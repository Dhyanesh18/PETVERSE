const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/admin-auth');
const User = require('../models/users');
const mongoose = require('mongoose');
const fs = require('fs');
const Wallet = require('../models/wallet');

// Admin dashboard route
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
        const Product = require('../models/products');
        products = await Product.find().populate('seller').sort({ createdAt: -1 }).limit(10);
        
        // Get pets data using the actual Pet model
        let pets = [];
        try {
            // Use the correct path for the Pet model
            const Pet = require('../models/pets');
            pets = await Pet.find().populate('addedBy').sort({ createdAt: -1 }).limit(10);
            console.log('Successfully loaded Pet model and data');
        } catch (err) {
            console.error('Error loading pets:', err);
            // Use mock pet data as a fallback
            pets = generateMockPets(6);
        }
        
        // Get services data - in a real app, adjust this to use your actual Service model
        let services = [];
        try {
            // Try to require the Service model if it exists
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
            console.log('Successfully loaded ServiceProvider model and data');
        } catch (err) {
            console.error('Error loading service providers:', err);
            // Generate mock service data as a fallback
            services = generateMockServices(8);
        }
        
        // Generate user growth data based on user registration dates
        const userGrowthData = await generateUserGrowthFromDb();
        
        // Generate product categories data based on actual products
        const productCategoriesData = generateProductCategoriesData(products);
        
        // Monthly revenue data (for the revenue chart) - replace with real data in production
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

        res.render('admin', {
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
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).render('error', { message: 'Server error loading admin dashboard' });
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
        
        if (i===10){
            revenues.push(userWallet.balance - 10000);
        }
        else {
            revenues.push(baseRevenue);
        }
    }
    
    return {
        labels: months,
        data: revenues
    };
}



router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find();
        res.render('admin/users', { users });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).render('error', { message: 'Server error loading users' });
    }
});

// API route for approving users
router.post('/approve-user/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.isApproved = true;
        await user.save();
        
        res.json({ success: true, message: 'User approved successfully' });
    } catch (err) {
        console.error('User approval error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// API route for rejecting users
router.post('/reject-user/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Add rejection reason if provided
        if (req.body.rejectionReason) {
            user.rejectionReason = req.body.rejectionReason;
        }
        
        user.isApproved = false;
        await user.save();
        
        res.json({ success: true, message: 'User rejected successfully' });
    } catch (err) {
        console.error('User rejection error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin route to update order status
router.post('/order/:orderId/status', adminAuth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const allowed = ['pending', 'processing', 'completed', 'cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const Order = require('../models/order');
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.json({ success: true, status: order.status });
    } catch (err) {
        console.error('Order status update error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/user-document/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
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
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.set('Content-Type', contentType);
        return res.send(documentData);
    } catch (err) {
        console.error('Document fetch error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;