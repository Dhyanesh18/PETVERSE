const Event = require('../models/event');

exports.getOwnerDashboard = async (req, res) => {
    try {
        // existing data assembled elsewhere; fetch registered events for this owner
        const events = await Event.find({ 'attendees.user': req.user._id })
            .sort({ eventDate: 1 })
            .lean();

        const registeredEvents = events.map(ev => ({
            id: ev._id,
            title: ev.title,
            date: ev.eventDate,
            startTime: ev.startTime,
            endTime: ev.endTime,
            city: ev.location?.city,
            category: ev.category
        }));

        // Assume other dashboard data prepared; merge in
        res.render('owner-dashboard', {
            ...res.locals.dashboardData,
            registeredEvents
        });
    } catch (err) {
        console.error('Owner dashboard error:', err);
        res.status(500).render('error', { message: 'Failed to load dashboard' });
    }
};


