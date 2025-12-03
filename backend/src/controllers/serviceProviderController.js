const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Review = require('../models/reviews');
const User = require('../models/users');

const getDashboard = async (req, res) => {
    try {
        // Check if user exists
        if (!req.user) {
            return res.redirect('/login');
        }

        const serviceProviderId = req.user._id;
        const today = new Date(); // Use current date
        
        // Format today as YYYY-MM-DD for string comparison
        const todayFormatted = today.toISOString().split('T')[0];

        console.log('Service Provider Dashboard - Provider ID:', serviceProviderId);
        console.log('Today\'s date:', todayFormatted);

        // First, find all services belonging to this provider
        const providerServices = await Service.find({ provider: serviceProviderId }).select('_id').lean();
        const serviceIds = providerServices.map(s => s._id);
        
        console.log(`Found ${serviceIds.length} services for this provider`);

        // Fetch future bookings using service IDs
        const futureBookings = await Booking.find({
            service: { $in: serviceIds },
            date: { $gt: todayFormatted }
        }).populate({
            path: 'user',
            select: 'fullName username email'
        }).sort({ date: 1, slot: 1 });

        console.log(`Found ${futureBookings.length} future bookings`);

        // Fetch past bookings using service IDs
        const pastBookings = await Booking.find({
            service: { $in: serviceIds },
            date: { $lte: todayFormatted }
        }).populate({
            path: 'user',
            select: 'fullName username email'
        }).sort({ date: -1, slot: -1 });

        console.log(`Found ${pastBookings.length} past bookings`);

        // Get review statistics
        const reviews = await Review.find({
            targetType: 'ServiceProvider',
            targetId: serviceProviderId
        });

        const totalReviews = reviews.length;
        const averageRating = reviews.length > 0 
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
            : 0;

        // Get all users for customer info
        const userIds = [...futureBookings, ...pastBookings].map(booking => booking.user._id);
        const usersMap = {};
        
        if (userIds.length > 0) {
            const users = await User.find({ _id: { $in: userIds } });
            users.forEach(user => {
                usersMap[user._id.toString()] = user.fullName;
            });
        }

        res.render('service-provider-dashboard', {
            futureBookings,
            pastBookings,
            totalReviews,
            averageRating: averageRating.toFixed(1),
            user: req.user, // Pass the user object to the template
            usersMap
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).send('Error loading dashboard: ' + error.message);
    }
};

module.exports = {
    getDashboard
}; 