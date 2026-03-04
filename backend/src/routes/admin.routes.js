const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/admin-auth');
const User = require('../models/users');
const Seller = require('../models/seller');
const ServiceProvider = require('../models/serviceProvider');
const Order = require('../models/order');
const Transaction = require('../models/transaction');
const mongoose = require('mongoose');
const fs = require('fs');
const Wallet = require('../models/wallet');

// Get admin dashboard data
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        console.log('Admin dashboard API called by:', req.user.fullName);
        
        // Get all users for the all users tab
        const allUsers = await User.find().sort({ createdAt: -1 });
        
        // Get user counts by role for the pie chart
        const ownerCount = await User.countDocuments({ role: 'owner' });
        const sellerCount = await User.countDocuments({ role: 'seller' });
        const serviceProviderCount = await User.countDocuments({ role: 'service_provider' });
        const adminCount = await User.countDocuments({ role: 'admin' });
        
        // Get approved counts for platform summary
        const approvedSellersCount = await Seller.countDocuments({ isApproved: true });
        const approvedServiceProvidersCount = await ServiceProvider.countDocuments({ isApproved: true });
        
        // Debug: Check all sellers in database
        const allSellersInDb = await Seller.find().lean();
        console.log('=== ALL SELLERS IN DATABASE ===');
        allSellersInDb.forEach(seller => {
            console.log(`Seller: ${seller.fullName}, Email: ${seller.email}, isApproved: ${seller.isApproved}, Role: ${seller.role}`);
        });
        console.log('================================');

        // Get pending, approved, and rejected sellers and service providers - query discriminator models directly
        const pendingSellers = await Seller.find({
            isApproved: false,
            rejectionReason: { $exists: false }
        }).sort({ createdAt: -1 }).lean();
        
        const pendingServiceProviders = await ServiceProvider.find({
            isApproved: false,
            rejectionReason: { $exists: false }
        }).sort({ createdAt: -1 }).lean();
        
        const pendingApplications = [...pendingSellers, ...pendingServiceProviders];
        const pendingUsers = pendingApplications; // For backward compatibility
        
        // Get approved sellers and service providers
        const approvedSellersData = await Seller.find({
            isApproved: true
        }).sort({ createdAt: -1 }).lean();
        
        const approvedServiceProvidersData = await ServiceProvider.find({
            isApproved: true
        }).sort({ createdAt: -1 }).lean();
        
        const approvedApplications = [...approvedSellersData, ...approvedServiceProvidersData];
        
        console.log('Approved Applications:', approvedApplications.length);
        console.log('Approved Sellers:', approvedSellersData.length);
        console.log('Approved Service Providers:', approvedServiceProvidersData.length);
        if (approvedApplications.length > 0) {
            console.log('Sample approved user:', {
                role: approvedApplications[0].role,
                fullName: approvedApplications[0].fullName,
                email: approvedApplications[0].email,
                businessName: approvedApplications[0].businessName,
                serviceType: approvedApplications[0].serviceType,
                phone: approvedApplications[0].phone
            });
        }

        // Get rejected sellers and service providers
        const rejectedSellers = await Seller.find({
            isApproved: false,
            rejectionReason: { $exists: true }
        }).sort({ createdAt: -1 }).lean();
        
        const rejectedServiceProvidersData = await ServiceProvider.find({
            isApproved: false,
            rejectionReason: { $exists: true }
        }).sort({ createdAt: -1 }).lean();
        
        const rejectedApplications = [...rejectedSellers, ...rejectedServiceProvidersData];
        
        // Get pending and approved pets, products, services
        let products = [];
        let pendingProducts = [];
        let approvedProducts = [];
        let rejectedProducts = [];
        try {
            const Product = require('../models/products');
            const allProducts = await Product.find().populate('seller').sort({ createdAt: -1 });
            products = allProducts.map(product => product.toObject());
            pendingProducts = products.filter(p => p.isApproved === false && !p.rejectionReason);
            approvedProducts = products.filter(p => p.isApproved === true);
            rejectedProducts = products.filter(p => p.isApproved === false && p.rejectionReason);
        } catch (err) {
            console.error('Error loading products:', err);
        }
        
        // Get pets data using the actual Pet model
        let pets = [];
        let pendingPets = [];
        let approvedPets = [];
        let rejectedPets = [];
        try {
            const Pet = require('../models/pets');
            const allPets = await Pet.find().populate('addedBy').sort({ createdAt: -1 });
            pets = allPets.map(pet => pet.toObject());
            pendingPets = pets.filter(p => p.isApproved === false && !p.rejectionReason);
            approvedPets = pets.filter(p => p.isApproved === true);
            rejectedPets = pets.filter(p => p.isApproved === false && p.rejectionReason);
        } catch (err) {
            console.error('Error loading pets:', err);
        }
        
        // Get services data
        let services = [];
        let pendingServices = [];
        let approvedServices = [];
        let rejectedServices = [];
        try {
            const Service = require('../models/Service');
            const allServices = await Service.find().populate('provider').sort({ createdAt: -1 });
            services = allServices.map(service => ({
                _id: service._id,
                name: `${service.serviceType} Services`,
                description: service.description || `Professional ${service.serviceType} services`,
                provider: service.provider ? {
                    _id: service.provider._id,
                    fullName: service.provider.fullName || 'Service Provider',
                    serviceType: service.serviceType
                } : null,
                serviceType: service.serviceType,
                rate: service.rate,
                price: service.rate,
                isApproved: service.isApproved,
                rejectionReason: service.rejectionReason,
                createdAt: service.createdAt
            }));
            pendingServices = services.filter(s => s.isApproved === false && !s.rejectionReason);
            approvedServices = services.filter(s => s.isApproved === true);
            rejectedServices = services.filter(s => s.isApproved === false && s.rejectionReason);
        } catch (err) {
            console.error('Error loading services:', err);
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

        const responseData = {
            success: true,
            data: {
                admin: req.user,
                pendingUsers,
                allUsers,
                pendingApplications,
                approvedApplications,
                rejectedApplications,
                // Add separate arrays for pending and approved items
                pendingPets,
                approvedPets,
                rejectedPets,
                pendingProducts,
                approvedProducts,
                rejectedProducts,
                pendingServices,
                approvedServices,
                rejectedServices,
                products,
                services,
                pets,
                orders,
                stats: {
                    approved: approvedApplications.length + approvedPets.length + approvedProducts.length + approvedServices.length,
                    pending: pendingApplications.length + pendingPets.length + pendingProducts.length + pendingServices.length,
                    rejected: rejectedApplications.length + rejectedPets.length + rejectedProducts.length + rejectedServices.length,
                    sellers: sellerCount,
                    totalUsers: allUsers.length,
                    totalProducts: products.length,
                    petsListed: pets.length,
                },
                orderStats,
                userGrowthData,
                productCategoriesData,
                revenueData,
                userDistributionData: {
                    labels: ['Owners', 'Sellers', 'Service Providers', 'Admins'],
                    data: [ownerCount, sellerCount, serviceProviderCount, adminCount]
                },
                platformSummary: {
                    totalUsers: allUsers.length,
                    activeSellers: approvedSellersCount,
                    serviceProviders: approvedServiceProvidersCount,
                    totalProducts: products.length,
                    petsListed: pets.length,
                },
                users: allUsers // Add this for the AllUsers component
            }
        };
        
        console.log('Sending admin dashboard response with', Object.keys(responseData.data).length, 'data keys');
        res.json(responseData);
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
    const currentMonth = new Date().getMonth();
    const monthlyRevenue = Array(12).fill(0);
    
    try {
        // Get all orders to calculate real revenue
        const Order = require('../models/order');
        const orders = await Order.find({ status: { $ne: 'cancelled' } });
        
        orders.forEach(order => {
            const createdDate = new Date(order.createdAt);
            const monthIndex = createdDate.getMonth();
            const yearDiff = new Date().getFullYear() - createdDate.getFullYear();
            
            // Only include orders from the past year
            if (yearDiff === 0 || (yearDiff === 1 && currentMonth < monthIndex)) {
                const adjustedMonthIndex = (monthIndex - currentMonth + 12) % 12;
                monthlyRevenue[adjustedMonthIndex] += order.totalAmount;
            }
        });
    } catch (err) {
        console.error('Error calculating monthly revenue:', err);
    }
    
    // Adjust month labels to start with oldest month
    const adjustedMonths = [];
    for (let i = 0; i < 12; i++) {
        adjustedMonths.push(months[(currentMonth - 11 + i + 12) % 12]);
    }
    
    return {
        labels: adjustedMonths,
        data: monthlyRevenue
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

// API route to get user documents (license/certificate)
router.get('/user-document/:userId/:docType', adminAuth, async (req, res) => {
    try {
        const { userId, docType } = req.params;
        
        let user;
        if (docType === 'license') {
            user = await Seller.findById(userId);
            if (!user || !user.license || !user.license.data) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'License document not found' 
                });
            }
            res.setHeader('Content-Type', user.license.contentType || 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="license-${userId}.pdf"`);
            return res.send(user.license.data);
        } else if (docType === 'certificate') {
            user = await ServiceProvider.findById(userId);
            if (!user || !user.certificate || !user.certificate.data) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Certificate document not found' 
                });
            }
            res.setHeader('Content-Type', user.certificate.contentType || 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="certificate-${userId}.pdf"`);
            return res.send(user.certificate.data);
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid document type' 
            });
        }
    } catch (err) {
        console.error('Document retrieval error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error',
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
        user.approvedAt = new Date();
        user.approvedBy = req.user._id;
        user.rejectionReason = undefined;
        user.rejectedAt = undefined;
        user.rejectedBy = undefined;
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
        user.rejectedAt = new Date();
        user.rejectedBy = req.user._id;
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
        
        // Prevent changing status if order has been refunded (unless admin is setting it back to cancelled)
        if (order.paymentStatus === 'refunded' && status !== 'cancelled') {
            console.log('Cannot change status - order has been refunded');
            return res.status(400).json({
                success: false,
                error: 'Cannot change status of a refunded order. Order must remain cancelled.'
            });
        }
        
        // Prevent changing from cancelled to another status (only admin can override this if really needed)
        // But we'll still block it for safety - admin should create a new order instead
        if (oldStatus === 'cancelled' && status !== 'cancelled' && order.paymentStatus === 'refunded') {
            console.log('Cannot reactivate refunded cancelled order');
            return res.status(400).json({
                success: false,
                error: 'Cannot reactivate a cancelled order that has been refunded. Please create a new order instead.'
            });
        }
        
        // Handle cancellation - refund customer and deduct from seller
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            console.log('Admin processing cancellation refund...');
            
            // Check if refund was already processed
            if (order.paymentStatus === 'refunded') {
                console.log('Refund already processed - skipping duplicate refund');
                // Just update status, don't process refund again
                order.status = status;
                
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
                
                return res.json({ 
                    success: true, 
                    message: 'Order status updated successfully (refund already processed)',
                    data: {
                        orderId: order._id,
                        status: order.status,
                        paymentStatus: order.paymentStatus
                    }
                });
            }
            
            // Check if payment method is COD or not paid
            if (order.paymentMethod === 'cod' || order.paymentStatus !== 'paid') {
                console.log('No refund needed - COD order or payment not completed');
                order.status = status;
                order.paymentStatus = 'cancelled';
                
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
                
                return res.json({ 
                    success: true, 
                    message: 'Order cancelled successfully (no refund needed)',
                    data: {
                        orderId: order._id,
                        status: order.status,
                        paymentStatus: order.paymentStatus
                    }
                });
            }
            
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
                
                // Create transaction for seller deduction
                await new Transaction({
                    from: order.seller._id,
                    to: req.user._id,
                    amount: sellerShare,
                    type: 'refund',
                    description: `Refund deduction for cancelled order`
                }).save();
            } catch (err) {
                console.error('Seller has insufficient balance for refund:', err.message);
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient seller balance for refund. Seller needs to add funds to wallet.'
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
            
            // Create refund transaction record for customer
            await new Transaction({
                from: req.user._id,
                to: order.customer._id,
                amount: refundAmount,
                type: 'admin_refund',
                description: `Refund for cancelled order`
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

// Get single order details for admin
router.get('/orders/:orderId', adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('customer', 'fullName email phoneNo address')
            .populate('seller', 'fullName email businessName')
            .populate('items.product', 'name price images description breed category')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const formattedOrder = {
            _id: order._id,
            orderNumber: order.orderNumber || order._id.toString().slice(-8).toUpperCase(),
            customer: {
                _id: order.customer?._id,
                name: order.customer?.fullName || 'Customer',
                email: order.customer?.email,
                phone: order.customer?.phoneNo,
                address: order.customer?.address
            },
            seller: {
                _id: order.seller?._id,
                name: order.seller?.fullName || order.seller?.businessName || 'Seller',
                email: order.seller?.email
            },
            items: order.items.map(item => ({
                product: {
                    _id: item.product?._id,
                    name: item.product?.name || item.product?.breed || 'Product',
                    description: item.product?.description,
                    images: item.product?.images?.map((_, index) => 
                        `/images/product/${item.product._id}/${index}`
                    ) || []
                },
                quantity: item.quantity,
                price: item.price,
                subtotal: (item.quantity * item.price).toFixed(2)
            })),
            totalAmount: order.totalAmount || 0,
            status: order.status || 'pending',
            paymentStatus: order.paymentStatus || 'pending',
            paymentMethod: order.paymentMethod || 'wallet',
            shippingAddress: order.shippingAddress || {},
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            statusHistory: order.statusHistory || []
        };

        res.json({
            success: true,
            data: {
                order: formattedOrder
            }
        });
    } catch (error) {
        console.error('Error fetching admin order details:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching order details',
            message: error.message
        });
    }
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

// Admin routes for pet, product, and service approval/rejection/deletion
// Approve pet
router.post('/approve/pet/:id', adminAuth, async (req, res) => {
    try {
        const Pet = require('../models/pets');
        const pet = await Pet.findById(req.params.id);
        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }
        pet.isApproved = true;
        pet.approvedAt = new Date();
        pet.approvedBy = req.user._id;
        await pet.save();
        res.json({ success: true, message: 'Pet approved successfully', data: pet });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Reject pet
router.post('/reject/pet/:id', adminAuth, async (req, res) => {
    try {
        const Pet = require('../models/pets');
        const pet = await Pet.findById(req.params.id);
        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }
        pet.isApproved = false;
        pet.rejectionReason = req.body.reason || 'Not specified';
        pet.rejectedAt = new Date();
        pet.rejectedBy = req.user._id;
        await pet.save();
        res.json({ success: true, message: 'Pet rejected successfully', data: pet });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete pet
router.delete('/pet/:id', adminAuth, async (req, res) => {
    try {
        const Pet = require('../models/pets');
        const pet = await Pet.findByIdAndDelete(req.params.id);
        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }
        res.json({ success: true, message: 'Pet deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Approve product
router.post('/approve/product/:id', adminAuth, async (req, res) => {
    try {
        const Product = require('../models/products');
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        product.isApproved = true;
        product.approvedAt = new Date();
        product.approvedBy = req.user._id;
        await product.save();
        res.json({ success: true, message: 'Product approved successfully', data: product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Reject product
router.post('/reject/product/:id', adminAuth, async (req, res) => {
    try {
        const Product = require('../models/products');
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        product.isApproved = false;
        product.rejectionReason = req.body.reason || 'Not specified';
        product.rejectedAt = new Date();
        product.rejectedBy = req.user._id;
        await product.save();
        res.json({ success: true, message: 'Product rejected successfully', data: product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete product
router.delete('/product/:id', adminAuth, async (req, res) => {
    try {
        const Product = require('../models/products');
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Approve service
router.post('/approve/service/:id', adminAuth, async (req, res) => {
    try {
        const Service = require('../models/Service');
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }
        service.isApproved = true;
        service.approvedAt = new Date();
        service.approvedBy = req.user._id;
        await service.save();
        res.json({ success: true, message: 'Service approved successfully', data: service });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Reject service
router.post('/reject/service/:id', adminAuth, async (req, res) => {
    try {
        const Service = require('../models/Service');
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }
        service.isApproved = false;
        service.rejectionReason = req.body.reason || 'Not specified';
        service.rejectedAt = new Date();
        service.rejectedBy = req.user._id;
        await service.save();
        res.json({ success: true, message: 'Service rejected successfully', data: service });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete service
router.delete('/service/:id', adminAuth, async (req, res) => {
    try {
        const Service = require('../models/Service');
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }
        res.json({ success: true, message: 'Service deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete user
router.delete('/user/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get comprehensive analytics data
router.get('/analytics', adminAuth, async (req, res) => {
    try {
        console.log('Fetching comprehensive analytics...');
        
        // Models
        const Product = require('../models/products');
        const Pet = require('../models/pets');
        const Service = require('../models/Service');
        const Booking = require('../models/Booking');
        const Event = require('../models/event');
        
        // ============ SERVICE ANALYTICS ============
        const serviceTransactions = await Transaction.find({
            type: { $in: ['service_payment', 'event_payment'] }
        }).populate('from to');
        
        const totalServiceRevenue = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        const bookings = await Booking.find().populate('service user');
        const totalBookings = bookings.length;
        
        // Top service providers by revenue
        const serviceProviderRevenue = {};
        serviceTransactions
            .filter(t => t.type === 'service_payment')
            .forEach(t => {
                const providerId = t.to?._id?.toString();
                if (providerId) {
                    if (!serviceProviderRevenue[providerId]) {
                        serviceProviderRevenue[providerId] = {
                            provider: t.to,
                            revenue: 0,
                            count: 0
                        };
                    }
                    serviceProviderRevenue[providerId].revenue += t.amount;
                    serviceProviderRevenue[providerId].count += 1;
                }
            });
        
        const topServiceProviders = Object.values(serviceProviderRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(sp => ({
                id: sp.provider._id,
                name: sp.provider.fullName,
                email: sp.provider.email,
                revenue: sp.revenue,
                bookingsCount: sp.count
            }));
        
        // Service revenue by month (last 12 months)
        const serviceRevenueByMonth = await getRevenueByMonth(serviceTransactions);
        
        // Service types breakdown
        const services = await Service.find().populate('provider');
        const serviceTypeBreakdown = {};
        services.forEach(service => {
            const type = service.serviceType || 'other';
            serviceTypeBreakdown[type] = (serviceTypeBreakdown[type] || 0) + 1;
        });
        
        // ============ SELLER ANALYTICS ============
        const orders = await Order.find({ status: { $ne: 'cancelled' } })
            .populate('customer seller items.product');
        
        const totalOrderRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        
        // Top sellers by revenue
        const sellerRevenue = {};
        orders.forEach(order => {
            const sellerId = order.seller?._id?.toString();
            if (sellerId) {
                if (!sellerRevenue[sellerId]) {
                    sellerRevenue[sellerId] = {
                        seller: order.seller,
                        revenue: 0,
                        orderCount: 0
                    };
                }
                sellerRevenue[sellerId].revenue += order.totalAmount;
                sellerRevenue[sellerId].orderCount += 1;
            }
        });
        
        const topSellers = Object.values(sellerRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(s => ({
                id: s.seller._id,
                name: s.seller.fullName,
                email: s.seller.email,
                revenue: s.revenue,
                orderCount: s.orderCount,
                avgOrderValue: s.orderCount > 0 ? (s.revenue / s.orderCount).toFixed(2) : 0
            }));
        
        // Seller revenue by month
        const sellerRevenueByMonth = await getRevenueByMonthFromOrders(orders);
        
        // ============ PRODUCT ANALYTICS ============
        // Calculate product sales from orders
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const productId = item.product?._id?.toString();
                if (productId && item.itemType === 'Product') {
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            product: item.product,
                            totalRevenue: 0,
                            totalQuantity: 0,
                            orderCount: 0
                        };
                    }
                    productSales[productId].totalRevenue += item.price * item.quantity;
                    productSales[productId].totalQuantity += item.quantity;
                    productSales[productId].orderCount += 1;
                }
            });
        });
        
        const bestProducts = Object.values(productSales)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10)
            .map(p => ({
                id: p.product._id,
                name: p.product.name,
                category: p.product.category,
                brand: p.product.brand,
                totalRevenue: p.totalRevenue,
                totalQuantity: p.totalQuantity,
                orderCount: p.orderCount,
                avgRating: p.product.avgRating || 0
            }));
        
        // Product category performance
        const categoryPerformance = {};
        Object.values(productSales).forEach(ps => {
            const category = ps.product.category || 'Other';
            if (!categoryPerformance[category]) {
                categoryPerformance[category] = {
                    revenue: 0,
                    quantity: 0,
                    products: 0
                };
            }
            categoryPerformance[category].revenue += ps.totalRevenue;
            categoryPerformance[category].quantity += ps.totalQuantity;
            categoryPerformance[category].products += 1;
        });
        
        // ============ CUSTOMER ANALYTICS ============
        const customerRevenue = {};
        orders.forEach(order => {
            const customerId = order.customer?._id?.toString();
            if (customerId) {
                if (!customerRevenue[customerId]) {
                    customerRevenue[customerId] = {
                        customer: order.customer,
                        totalSpent: 0,
                        orderCount: 0
                    };
                }
                customerRevenue[customerId].totalSpent += order.totalAmount;
                customerRevenue[customerId].orderCount += 1;
            }
        });
        
        const topCustomers = Object.values(customerRevenue)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .map(c => ({
                id: c.customer._id,
                name: c.customer.fullName,
                email: c.customer.email,
                totalSpent: c.totalSpent,
                orderCount: c.orderCount,
                avgOrderValue: c.orderCount > 0 ? (c.totalSpent / c.orderCount).toFixed(2) : 0
            }));
        
        // ============ EVENT ANALYTICS ============
        const events = await Event.find().populate('organizer attendees.user');
        const eventRevenue = events.reduce((sum, event) => {
            return sum + (event.entryFee * event.attendees.length);
        }, 0);
        
        const totalEvents = events.length;
        const totalAttendees = events.reduce((sum, event) => sum + event.attendees.length, 0);
        
        const upcomingEvents = events.filter(e => new Date(e.eventDate) > new Date()).length;
        const pastEvents = events.filter(e => new Date(e.eventDate) <= new Date()).length;
        
        // ============ OVERALL PLATFORM METRICS ============
        const allTransactions = await Transaction.find();
        const totalPlatformRevenue = totalServiceRevenue + totalOrderRevenue + eventRevenue;
        
        // Commission calculation (admin's revenue)
        const adminCommissions = await Transaction.find({ type: 'commission' });
        const totalCommissions = adminCommissions.reduce((sum, t) => sum + t.amount, 0);
        
        // Get admin wallet - use current logged-in admin
        const adminWallet = await Wallet.findOne({ user: req.user._id });
        
        // Payment method distribution from orders
        const paymentMethodDist = {};
        orders.forEach(order => {
            const method = order.paymentMethod || 'unknown';
            paymentMethodDist[method] = (paymentMethodDist[method] || 0) + 1;
        });
        
        // Order status distribution
        const orderStatusDist = {};
        orders.forEach(order => {
            const status = order.status || 'unknown';
            orderStatusDist[status] = (orderStatusDist[status] || 0) + 1;
        });
        
        // ============ RESPONSE ============
        res.json({
            success: true,
            data: {
                // Service Analytics
                serviceAnalytics: {
                    totalRevenue: totalServiceRevenue,
                    totalBookings: totalBookings,
                    totalServices: services.length,
                    topServiceProviders,
                    revenueByMonth: serviceRevenueByMonth,
                    serviceTypeBreakdown
                },
                
                // Seller Analytics
                sellerAnalytics: {
                    totalRevenue: totalOrderRevenue,
                    totalOrders: totalOrders,
                    topSellers,
                    revenueByMonth: sellerRevenueByMonth,
                    avgOrderValue: totalOrders > 0 ? (totalOrderRevenue / totalOrders).toFixed(2) : 0
                },
                
                // Product Analytics
                productAnalytics: {
                    bestProducts,
                    categoryPerformance,
                    totalProducts: await Product.countDocuments()
                },
                
                // Customer Analytics
                customerAnalytics: {
                    topCustomers,
                    totalCustomers: Object.keys(customerRevenue).length,
                    avgCustomerValue: Object.keys(customerRevenue).length > 0 
                        ? (totalOrderRevenue / Object.keys(customerRevenue).length).toFixed(2) 
                        : 0
                },
                
                // Event Analytics
                eventAnalytics: {
                    totalRevenue: eventRevenue,
                    totalEvents,
                    totalAttendees,
                    upcomingEvents,
                    pastEvents,
                    avgAttendeesPerEvent: totalEvents > 0 ? (totalAttendees / totalEvents).toFixed(1) : 0
                },
                
                // Overall Platform Metrics
                platformMetrics: {
                    totalRevenue: totalPlatformRevenue,
                    totalCommissions,
                    adminBalance: adminWallet?.balance || 0,
                    totalTransactions: allTransactions.length,
                    paymentMethodDistribution: paymentMethodDist,
                    orderStatusDistribution: orderStatusDist
                }
            }
        });
        
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
            message: err.message
        });
    }
});

// Helper function to get revenue by month from transactions
async function getRevenueByMonth(transactions) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthlyRevenue = Array(12).fill(0);
    
    transactions.forEach(transaction => {
        const createdDate = new Date(transaction.createdAt);
        const monthIndex = createdDate.getMonth();
        const yearDiff = new Date().getFullYear() - createdDate.getFullYear();
        
        // Only include transactions from the past year
        if (yearDiff === 0 || (yearDiff === 1 && currentMonth < monthIndex)) {
            const adjustedMonthIndex = (monthIndex - currentMonth + 12) % 12;
            monthlyRevenue[adjustedMonthIndex] += transaction.amount;
        }
    });
    
    // Adjust month labels to start with oldest month
    const adjustedMonths = [];
    for (let i = 0; i < 12; i++) {
        adjustedMonths.push(months[(currentMonth - 11 + i + 12) % 12]);
    }
    
    return {
        labels: adjustedMonths,
        data: monthlyRevenue
    };
}

// Helper function to get revenue by month from orders
async function getRevenueByMonthFromOrders(orders) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthlyRevenue = Array(12).fill(0);
    
    orders.forEach(order => {
        const createdDate = new Date(order.createdAt);
        const monthIndex = createdDate.getMonth();
        const yearDiff = new Date().getFullYear() - createdDate.getFullYear();
        
        // Only include orders from the past year
        if (yearDiff === 0 || (yearDiff === 1 && currentMonth < monthIndex)) {
            const adjustedMonthIndex = (monthIndex - currentMonth + 12) % 12;
            monthlyRevenue[adjustedMonthIndex] += order.totalAmount;
        }
    });
    
    // Adjust month labels to start with oldest month
    const adjustedMonths = [];
    for (let i = 0; i < 12; i++) {
        adjustedMonths.push(months[(currentMonth - 11 + i + 12) % 12]);
    }
    
    return {
        labels: adjustedMonths,
        data: monthlyRevenue
    };
}

module.exports = router;