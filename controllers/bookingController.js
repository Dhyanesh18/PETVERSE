const Booking = require('../models/Booking');
const User = require('../models/users');

const allSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM',
    '03:00 PM', '04:00 PM', '05:00 PM'
];

const categoryMap = {
    'veterinarian': 'Veterinary Doctor',
    'groomer': 'Pet Grooming',
    'trainer': 'Dog Training',
    'pet sitter': 'Pet Sitting',
    'breeder': 'Breeding Services'
};

exports.getBookingPage = async (req, res) => {
    try {
        const providerId = req.params.serviceId;
        console.log(`Fetching provider with ID: ${providerId}`);

        const provider = await User.findById(providerId);
        if (!provider || provider.role !== 'service_provider') {
            console.log(`Provider not found for ID: ${providerId}`);
            return res.status(404).send(`Provider with ID ${providerId} not found.`);
        }

        const service = {
            _id: provider._id,
            serviceType: categoryMap[provider.serviceType] || provider.serviceType,
            description: provider.description || 'Service provided by ' + provider.fullName,
            rate: provider.serviceType === 'veterinarian' || provider.serviceType === 'trainer' ? 500 : 0,
            location: provider.serviceAddress,
            provider: provider
        };

        let confirmed = req.query.confirmed === 'true';
        let booking = null;
        if (confirmed && req.query.bookingId) {
            booking = await Booking.findById(req.query.bookingId).populate('user', 'fullName');
            if (!booking) confirmed = false;
            else booking = { name: booking.user.fullName, date: booking.date, slot: booking.slot };
        }

        res.render('booking', { 
            service, 
            error: null, 
            confirmed, 
            reviewSubmitted: false,
            booking,
            user: req.user
        });
    } catch (err) {
        console.error(`Error fetching provider for ID ${req.params.serviceId}:`, err);
        res.status(500).send('Error loading booking page.');
    }
};

exports.getAvailableSlots = async (req, res) => {
    try {
        const { serviceId, date } = req.query;
        console.log(`Fetching available slots for Provider ID: ${serviceId}, Date: ${date}`);
        const bookings = await Booking.find({ provider: serviceId, date });
        const bookedSlots = bookings.map(b => b.slot);
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        res.json({ availableSlots });
    } catch (err) {
        console.error('Error fetching slots:', err);
        res.status(500).json({ error: 'Error fetching slots' });
    }
};

exports.bookSlot = async (req, res) => {
    try {
        const serviceId = req.body.serviceId;
        const { date, slot, name, petName, email } = req.body;
        console.log(`Booking slot for Provider ID: ${serviceId}, Date: ${date}, Slot: ${slot}`);

        const provider = await User.findById(serviceId);
        if (!provider || provider.role !== 'service_provider') {
            console.log(`Provider not found for ID: ${serviceId}`);
            return res.status(404).send(`Provider with ID ${serviceId} not found.`);
        }

        const existing = await Booking.findOne({ provider: serviceId, date, slot });
        if (existing) {
            console.log(`Slot already booked: ${slot} on ${date}`);
            return res.render('booking', { 
                service: { _id: serviceId, provider }, 
                error: 'Slot already booked', 
                confirmed: false,
                reviewSubmitted: false,
                user: req.user
            });
        }

        const booking = new Booking({
            user: req.user._id,
            provider: serviceId,
            date,
            slot
        });

        await booking.save();
        console.log('Booking saved:', booking);

        res.redirect(`/booking/${serviceId}?confirmed=true&bookingId=${booking._id}`);
    } catch (err) {
        console.error('Booking failed:', err);
        res.status(500).send('Booking failed due to a server error.');
    }
};