const Booking = require('../models/Booking');
const Service = require('../models/Service');

const allSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM',
  '03:00 PM', '04:00 PM', '05:00 PM'
];

exports.getBookingPage = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).send('Service not found');
    res.render('booking', { service, error: null, confirmed: false });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { serviceId, date } = req.query;
    const bookings = await Booking.find({ service: serviceId, date });
    const bookedSlots = bookings.map(b => b.slot);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    res.json({ availableSlots });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching slots' });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { serviceId, date, slot, name, petName, email } = req.body;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).send('Service not found');

    const existing = await Booking.findOne({ service: serviceId, date, slot });
    if (existing) {
      return res.render('booking', { service, error: 'Slot already booked', confirmed: false });
    }

    const booking = new Booking({
      user: req.user._id,
      service: serviceId,
      date,
      slot
    });

    await booking.save();
    res.render('booking', {
      service,
      error: null,
      confirmed: true,
      booking: { name, date, slot }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Booking failed');
  }
};