const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/admin-auth');
const User = require('../models/users');
const mongoose = require('mongoose');
const fs = require('fs');
const Wallet = require('../models/wallet');

// Get admin dashboard data
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        // Get pending sellers and service providers
        const pendingUsers = await User.find({
            role: { $in: ['seller', 'service_provider'] },
            isApproved: false
        }).sort({ createdAt: -1 });

        // Get all users for the all users tab
        const allUsers = await User.find().sort({ createdAt: -1 });
        
        // Get user counts by role for the pie chart
        const ownerCount = await User.countDocuments({ role: 'owner' });
        const sellerCount = await User.countDocuments({ role: 'seller' });
        const serviceProviderCount = await User.countDocuments({ role: 'service_provider' });
        const adminCount = await User.countDocuments({ role: 'admin' });
        
        // Get approved sellers and service providers
        const approvedSellers = await User.find({ 
            role: 'seller', 
            isApproved: true 
        });
        
        const approvedServiceProviders = await User.find({ 
            role: 'service_provider', 
            isApproved: true 
        });
        
        const pendingApplications = await generateApplicationsFromUsers(
            await User.find({
                role: { $in: ['seller', 'service_provider'] },
                isApproved: false
            })
        );
        
        const approvedApplications = await generateApplicationsFromUsers(
            await User.find({
                role: { $in: ['seller', 'service_provider'] },
                isApproved: true
            })
        );

        const rejectedApplications = [];
        
        let products = [];
        try {
            const Product = require('../models/products');
            products = await Product.find().populate('seller').sort({ createdAt: -1 }).limit(10);
        } catch (err) {
            console.error('Error loading products:', err);
        }
        
        // Get pets data using the actual Pet model
        let pets = [];
        try {
            const Pet = require('../models/pets');
            pets = await Pet.find().populate('addedBy').sort({ createdAt: -1 }).limit(10);
        } catch (err) {
            console.error('Error loading pets:', err);
        }
        
        // Get services data
        let services = [];
        try {
            const ServiceProvider = require('../models/serviceProvider');
            const serviceProviders = await ServiceProvider.find().populate().sort({ createdAt: -1 }).limit(10);
            
            // Convert service providers to service offerings
            services = serviceProviders.map(provider => ({
                _id: provider._id,
                name: `${provider.serviceType} Services`,
                description: `Professional ${provider.serviceType} services`,
                provider: {
                    _id: provider._id,
                    fullName: provider.fullName || 'Service Provider',
                    serviceType: provider.serviceType,
                    serviceAddress: provider.serviceAddress
                },
                isApproved: provider.isApproved,
                createdAt: provider.createdAt
            }));
        } catch (err) {
            console.error('Error loading service providers:', err);
        }
        
        // Generate user growth data based on user registration dates
        const userGrowthData = await generateUserGrowthFromDb();
        
        // Generate product categories data based on actual products
        const productCategoriesData = generateProductCategoriesData(products);
        
        // Monthly revenue data
        const revenueData = await generateMonthlyRevenue();

        // Orders and order statistics for the dashboard
        let orders = [];
        let orderStats = {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            revenue: 0
        };

        try {
            const Order = require('../models/order');

            // Recent orders for the table
            orders = await Order.find()
                .populate('customer')
                .populate('seller')
                .populate('items.product')
                .sort({ createdAt: -1 })
                .limit(10);

            // Counts by status
            const [totalCount, pendingCount, processingCount, completedCount] = await Promise.all([
                Order.countDocuments({}),
                Order.countDocuments({ status: 'pending' }),
                Order.countDocuments({ status: 'processing' }),
                Order.countDocuments({ status: 'completed' })
            ]);

            // Total revenue across all orders
            const revenueAgg = await Order.aggregate([
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]);

            orderStats = {
                total: totalCount,
                pending: pendingCount,
                processing: processingCount,
                completed: completedCount,
                revenue: (revenueAgg[0] && revenueAgg[0].total) || 0
            };
        } catch (err) {
            console.log('Order model not available, using empty orders and zeroed stats');
        }

        // Return JSON response instead of rendering view
        res.json({
            success: true,
            data: {
                admin: req.user,
                pendingUsers,
                allUsers,
                pendingApplications,
                approvedApplications,
                rejectedApplications,
                products,
                services,
                pets,
                orders,
                orderStats,
                userGrowthData,
                productCategoriesData,
                revenueData,
                
                // User distribution data for pie chart
                userDistributionData: {
                    labels: ['Owners', 'Sellers', 'Service Providers', 'Admins'],
                    data: [ownerCount, sellerCount, serviceProviderCount, adminCount]
                },
                
                // Platform summary data
                platformSummary: {
                    totalUsers: allUsers.length,
                    activeSellers: approvedSellers.length,
                    serviceProviders: approvedServiceProviders.length,
                    totalProducts: products.length,
                    petsListed: pets.length,
                }
            }
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error loading admin dashboard',
            message: err.message 
        });
    }
});

// Function to generate applications from actual user data
async function generateApplicationsFromUsers(users) {
    const applications = [];
    
    for (const user of users) {
        let type, name, description;
        
        if (user.role === 'seller') {
            type = 'product';
            name = user.businessName || 'Business Registration';
            description = `Seller application from ${user.fullName}`;
        } else if (user.role === 'service_provider') {
            type = 'service';
            name = user.serviceType || 'Service Registration';
            description = `Service provider application from ${user.fullName}`;
        }
        
        applications.push({
            id: user._id.toString(),
            type,
            name,
            description,
            status: user.isApproved ? 'Approved' : 'Pending',
            date: user.createdAt.toLocaleDateString(),
            ...(user.isApproved ? { 
                approvalDate: user.updatedAt.toLocaleDateString() 
            } : {}),
            location: user.serviceAddress || user.businessAddress || 'Not provided',
            provider: {
                id: user._id.toString(),
                name: user.fullName
            }
        });
    }
    
    return applications;
}

// Generate user growth data based on actual user registrations
async function generateUserGrowthFromDb() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthlyData = Array(12).fill(0);
    
    // Get all users
    const users = await User.find({}, 'createdAt');
    
    // Count users by month
    users.forEach(user => {
        const createdDate = new Date(user.createdAt);
        const monthIndex = createdDate.getMonth();
        const yearDiff = new Date().getFullYear() - createdDate.getFullYear();
        
        // Only include users from the past year
        if (yearDiff === 0 || (yearDiff === 1 && currentMonth < monthIndex)) {
            const adjustedMonthIndex = (monthIndex - currentMonth + 12) % 12;
            monthlyData[adjustedMonthIndex]++;
        }
    });
    
    // Adjust month labels to start with oldest month
    const adjustedMonths = [];
    for (let i = 0; i < 12; i++) {
        adjustedMonths.push(months[(currentMonth - 11 + i) % 12]);
    }
    
    const cumulativeData = [];
    let runningTotal = 0;
    for (const monthCount of monthlyData) {
        runningTotal += monthCount;
        cumulativeData.push(runningTotal);
    }
    
    return {
        labels: adjustedMonths,
        data: cumulativeData
    };
}

// Generate product categories data based on actual products
function generateProductCategoriesData(products) {
    const categoryMap = new Map();
    
    // Count products by category
    products.forEach(product => {
        const category = product.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    if (categoryMap.size < 3) {
        if (!categoryMap.has('Pet Food')) categoryMap.set('Pet Food', 0);
        if (!categoryMap.has('Toys')) categoryMap.set('Toys', 0);
        if (!categoryMap.has('Accessories')) categoryMap.set('Accessories', 0);
    }
    
    const labels = Array.from(categoryMap.keys());
    const data = Array.from(categoryMap.values());
    
    return { labels, data };
}

async function generateMonthlyRevenue() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenues = [];
    const userWallet = await Wallet.findOne({ user: "6807e4424877bcd9980c7e00" });
    let baseRevenue = 0;
    for (let i = 0; i < 12; i++) {
        if (i === 10) {
            revenues.push(userWallet.balance - 10000);
        } else {
            revenues.push(baseRevenue);
        }
    }
    
    return {
        labels: months,
        data: revenues
    };
}

// Get all users - API endpoint
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ 
            success: true, 
            data: users 
        });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error loading users',
            message: err.message 
        });
    }
});

// API route for approving users
router.post('/approve-user/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        user.isApproved = true;
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'User approved successfully',
            data: user 
        });
    } catch (err) {
        console.error('User approval error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error',
            message: err.message 
        });
    }
});

// API route for rejecting users
router.post('/reject-user/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        // Add rejection reason if provided
        if (req.body.rejectionReason) {
            user.rejectionReason = req.body.rejectionReason;
        }
        
        user.isApproved = false;
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'User rejected successfully',
            data: user 
        });
    } catch (err) {
        console.error('User rejection error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error',
            message: err.message 
        });
    }
});

// Admin route to update order status
router.patch('/order/:orderId/status', adminAuth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        console.log('Admin updating order status:', { orderId, status, adminId: req.user._id });

        const allowed = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid status',
                validStatuses: allowed
            });
        }

        const Order = require('../models/order');
        const Wallet = require('../models/wallet');
        const Transaction = require('../models/transaction');
        
        const order = await Order.findById(orderId).populate('customer').populate('seller');
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        const oldStatus = order.status;
        
        // Handle cancellation - refund customer and deduct from seller
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            console.log('Admin processing cancellation refund...');
            
            // Get wallets
            const customerWallet = await Wallet.findOne({ user: order.customer._id });
            const sellerWallet = await Wallet.findOne({ user: order.seller._id });
            
            if (!customerWallet) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Customer wallet not found' 
                });
            }
            
            if (!sellerWallet) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Seller wallet not found' 
                });
            }
            
            const refundAmount = order.totalAmount;
            const sellerShare = refundAmount * 0.95; // Seller received 95% of the order
            const adminCommission = refundAmount * 0.05; // Admin received 5%
            
            // Refund customer
            await customerWallet.addFunds(refundAmount);
            console.log(`Admin refunded ₹${refundAmount} to customer`);
            
            // Deduct from seller (only their share)
            try {
                await sellerWallet.deductFunds(sellerShare);
                console.log(`Admin deducted ₹${sellerShare} from seller`);
            } catch (err) {
                console.error('Seller has insufficient balance for refund:', err.message);
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient seller balance for refund'
                });
            }
            
            // Deduct from admin wallet
            const adminWallet = await Wallet.findOne({ user: req.user._id });
            if (adminWallet) {
                try {
                    await adminWallet.deductFunds(adminCommission);
                    console.log(`Admin deducted ₹${adminCommission} commission from admin wallet`);
                } catch (err) {
                    console.error('Admin has insufficient balance for refund:', err.message);
                }
            }
            
            // Create refund transaction records
            await new Transaction({
                from: req.user._id,
                to: order.customer._id,
                amount: refundAmount,
                type: 'admin_refund',
                description: `Admin refund for cancelled order ${order._id}`
            }).save();
            
            // Update payment status to refunded
            order.paymentStatus = 'refunded';
            console.log('Admin refund completed successfully');
        }

        // Update status
        order.status = status;
        
        // Add to status history
        if (!order.statusHistory) {
            order.statusHistory = [];
        }
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user._id,
            updatedByRole: 'admin'
        });

        await order.save();

        console.log('Order status updated successfully by admin');
        res.json({ 
            success: true, 
            message: 'Order status updated successfully',
            data: { 
                orderId: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                oldStatus,
                updatedBy: 'admin'
            } 
        });
    } catch (err) {
        console.error('Admin order status update error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error',
            message: err.message 
        });
    }
});

// Keep the POST method for backward compatibility
router.post('/order/:orderId/status', adminAuth, async (req, res) => {
    // Redirect to PATCH method
    req.method = 'PATCH';
    return router.handle(req, res);
});

// Get user document (license/certificate)
router.get('/user-document/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        let documentData;
        let contentType;
        
        if (user.role === 'seller' && user.license) {
            documentData = user.license.data;
            contentType = user.license.contentType;
        } else if (user.role === 'service_provider' && user.certificate) {
            documentData = user.certificate.data;
            contentType = user.certificate.contentType;
        } else {
            return res.status(404).json({ 
                success: false, 
                error: 'Document not found' 
            });
        }
        
        res.set('Content-Type', contentType);
        return res.send(documentData);
    } catch (err) {
        console.error('Document fetch error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error',
            message: err.message 
        });
    }
});

module.exports = router;