const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/admin-auth');
const User = require('../models/users');
const mongoose = require('mongoose');
const fs = require('fs');

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
        
        // Generate application data based on user data
        // For each pending seller/provider, create an "application"
        const pendingApplications = await generateApplicationsFromUsers(
            await User.find({
                role: { $in: ['seller', 'service_provider'] },
                isApproved: false
            })
        );
        
        // For each approved seller/provider, create an "application"
        const approvedApplications = await generateApplicationsFromUsers(
            await User.find({
                role: { $in: ['seller', 'service_provider'] },
                isApproved: true
            })
        );
        
        // For any rejected users (we'll simulate this for now)
        // In a real system, you'd have a rejection flag or reason field
        const rejectedApplications = [];
        
        // Combine all applications
        const allApplications = [...pendingApplications, ...approvedApplications, ...rejectedApplications];
        
        // Get products data - in a real app, adjust this to use your actual Product model
        let products = [];
        try {
            // Try to require the Product model if it exists
            const Product = require('../models/products'); // Use correct path (plural 'products')
            products = await Product.find().populate('seller').sort({ createdAt: -1 }).limit(10);
        } catch (err) {
            console.log('Product model not available, using mock data');
            // Generate mock product data
            products = generateMockProducts(10);
        }
        
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
        const revenueData = generateMonthlyRevenue();

        res.render('admin', {
            admin: req.user,
            pendingUsers,
            allUsers,
            pendingApplications,
            approvedApplications,
            rejectedApplications,
            allApplications,
            products,
            services,
            pets,
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
                monthlyRevenue: calculateTotalRevenue(revenueData)
            }
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).render('error', { message: 'Server error loading admin dashboard' });
    }
});

// Helper functions for generating mock data
function generateMockProducts(count) {
    const products = [];
    const categories = ['food', 'toys', 'accessories', 'health', 'clothing'];
    const names = [
        'Premium Pet Food', 'Chew Toy', 'Pet Collar', 'Vitamins', 
        'Dog Sweater', 'Cat Treats', 'Bird Cage', 'Fish Tank', 
        'Hamster Wheel', 'Pet Shampoo', 'Dental Treats', 'Pet Bed'
    ];
    
    for (let i = 0; i < count; i++) {
        products.push({
            _id: new mongoose.Types.ObjectId(),
            name: names[Math.floor(Math.random() * names.length)],
            description: 'High-quality product for your pet',
            price: Math.floor(Math.random() * 2000) + 100,
            stock: Math.floor(Math.random() * 50) + 1,
            category: categories[Math.floor(Math.random() * categories.length)],
            image: `/images/products/product${i + 1}.jpg`,
            isApproved: Math.random() > 0.3,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
            seller: {
                _id: new mongoose.Types.ObjectId(),
                fullName: `Seller ${i + 1}`,
                businessName: `Pet Shop ${i + 1}`
            }
        });
    }
    
    return products;
}

function generateMockServices(count) {
    const services = [];
    const types = ['grooming', 'veterinary', 'training', 'boarding', 'walking'];
    const names = [
        'Pet Grooming', 'Veterinary Check-up', 'Training Session', 
        'Pet Boarding', 'Dog Walking', 'Pet Sitting', 'Dental Cleaning', 
        'Nail Trimming'
    ];
    
    for (let i = 0; i < count; i++) {
        services.push({
            _id: new mongoose.Types.ObjectId(),
            name: names[Math.floor(Math.random() * names.length)],
            description: 'Professional service for your pet',
            price: Math.floor(Math.random() * 1000) + 200,
            type: types[Math.floor(Math.random() * types.length)],
            duration: `${Math.floor(Math.random() * 3) + 1} hours`,
            image: `/images/services/service${i + 1}.jpg`,
            isApproved: Math.random() > 0.3,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
            provider: {
                _id: new mongoose.Types.ObjectId(),
                fullName: `Provider ${i + 1}`
            }
        });
    }
    
    return services;
}

function generateMockPets(count) {
    const pets = [];
    const categories = ['Dog', 'Cat', 'Bird', 'Fish', 'Other'];
    const breeds = {
        'Dog': ['Labrador', 'German Shepherd', 'Bulldog', 'Golden Retriever', 'Poodle'],
        'Cat': ['Persian', 'Siamese', 'Maine Coon', 'Bengal', 'Ragdoll'],
        'Bird': ['Parrot', 'Canary', 'Finch', 'Cockatiel', 'Lovebird'],
        'Fish': ['Goldfish', 'Betta', 'Guppy', 'Angelfish', 'Tetra'],
        'Other': ['Hamster', 'Rabbit', 'Guinea Pig', 'Turtle', 'Ferret']
    };
    const names = ['Max', 'Luna', 'Charlie', 'Bella', 'Buddy', 'Lucy', 'Cooper', 'Daisy'];
    const genders = ['male', 'female'];
    
    for (let i = 0; i < count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const breedOptions = breeds[category];
        const breed = breedOptions[Math.floor(Math.random() * breedOptions.length)];
        
        pets.push({
            _id: new mongoose.Types.ObjectId(),
            name: names[Math.floor(Math.random() * names.length)],
            category,
            breed,
            age: `${Math.floor(Math.random() * 10) + 1} ${Math.random() > 0.5 ? 'years' : 'months'}`,
            gender: genders[Math.floor(Math.random() * genders.length)],
            description: 'Lovely pet looking for a new home',
            price: Math.floor(Math.random() * 5000) + 500,
            images: [
                {
                    data: Buffer.from('Mock image data'),
                    contentType: 'image/jpeg',
                    uploadedAt: new Date()
                }
            ],
            available: true,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
            addedBy: {
                _id: new mongoose.Types.ObjectId(),
                fullName: `Pet Owner ${i + 1}`
            }
        });
    }
    
    return pets;
}

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
    
    // Calculate cumulative growth
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
    
    // If there are no products or very few categories, add some defaults
    if (categoryMap.size < 3) {
        if (!categoryMap.has('Pet Food')) categoryMap.set('Pet Food', 0);
        if (!categoryMap.has('Toys')) categoryMap.set('Toys', 0);
        if (!categoryMap.has('Accessories')) categoryMap.set('Accessories', 0);
        if (!categoryMap.has('Health')) categoryMap.set('Health', 0);
        if (!categoryMap.has('Clothing')) categoryMap.set('Clothing', 0);
    }
    
    // Convert Map to arrays for chart data
    const labels = Array.from(categoryMap.keys());
    const data = Array.from(categoryMap.values());
    
    return { labels, data };
}

function generateMonthlyRevenue() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenues = [];
    
    let baseRevenue = 100000; // Start at 100,000
    for (let i = 0; i < 12; i++) {
        // Add some random variation (between -10% and +20%)
        const variation = baseRevenue * (Math.random() * 0.3 - 0.1);
        const revenue = Math.round(baseRevenue + variation);
        revenues.push(revenue);
        
        // Increase base revenue slightly for next month
        baseRevenue += baseRevenue * 0.05;
    }
    
    return {
        labels: months,
        data: revenues
    };
}

function calculateTotalRevenue(revenueData) {
    // Sum of last 3 months as current MTD (Month to Date)
    const lastThreeMonths = revenueData.data.slice(-3);
    return lastThreeMonths.reduce((total, month) => total + month, 0);
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

// Route to get user document (certificate or license)
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