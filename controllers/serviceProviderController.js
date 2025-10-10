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

        // Support admin preview of a specific service provider via query param
        const serviceProviderId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
        const today = new Date('2025-05-07'); // As per requirements

        // Format today as YYYY-MM-DD for string comparison
        const todayFormatted = today.toISOString().split('T')[0];

        // Fetch future bookings - directly using provider field
        const futureBookings = await Booking.find({
            service: serviceProviderId,
            date: { $gt: todayFormatted }
        }).populate({
            path: 'user',
            select: 'fullName username email'
        });

        // Fetch past bookings - directly using provider field
        const pastBookings = await Booking.find({
            service: serviceProviderId,
            date: { $lte: todayFormatted }
        }).populate({
            path: 'user',
            select: 'fullName username email'
        });

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

        // If admin is previewing, load that user's profile; else current user
        let profileUser = req.user;
        if (req.user.role === 'admin' && req.query.userId) {
            const found = await User.findById(serviceProviderId).lean();
            if (found) profileUser = found;
        }

        res.render('service-provider-dashboard', {
            futureBookings,
            pastBookings,
            totalReviews,
            averageRating: averageRating.toFixed(1),
            user: profileUser, // Pass the target user object to the template
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