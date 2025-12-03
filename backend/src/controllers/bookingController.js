const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/users');
const Availability = require('../models/availability');

const getDayName = (dayNum) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayNum];
};


const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

exports.getBookingPage = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    
    // Find provider information from user model with role="service_provider"
    const provider = await User.findById(serviceId);
    
    if (!provider || provider.role !== 'service_provider') {
      return res.status(404).send('Service provider not found');
    }
    
    // Create a service object for compatibility with the booking.ejs template
    const service = {
      _id: provider._id,
      name: provider.fullName,
      serviceType: provider.serviceType,
      description: provider.description || 'Professional pet services provider.',
      location: provider.serviceAddress || 'Available Locally',
      rate: provider.serviceType === 'veterinarian' ? 500 : 
            provider.serviceType === 'groomer' ? 300 : 
            provider.serviceType === 'trainer' ? 500 : 200
    };
    
    res.render('booking', { 
      service, 
      error: null, 
      confirmed: false,
      user: req.user
    });
  } catch (err) {
    console.error('Error loading booking page:', err);
    res.status(500).send('Server error: ' + err.message);
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { serviceId, date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Get the day of the week for the selected date
    const selectedDate = new Date(date);
    const dayOfWeek = getDayName(selectedDate.getDay());
    
    // Get service provider's availability
    const providerAvailability = await Availability.findOne({ serviceProvider: serviceId });
    
    // Default slots if no availability is set
    let allPossibleSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '01:00 PM', '02:00 PM',
      '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    // If provider has availability settings, use those instead
    if (providerAvailability) {
      const dayAvailability = providerAvailability.getByDay(dayOfWeek);
      
      // Only return empty if explicitly marked as holiday
      // If no slots configured for the day, fall back to default slots
      if (dayAvailability.isHoliday) {
        return res.json({ availableSlots: [] });
      }
      
      // If slots are configured for this day, use them
      if (dayAvailability.slots && dayAvailability.slots.length > 0) {
        // Generate slots based on provider's availability
        allPossibleSlots = [];
        dayAvailability.slots.forEach(slot => {
          // Generate 1-hour slots between start and end times
          const [startHour, startMin] = slot.start.split(':').map(Number);
          const [endHour, endMin] = slot.end.split(':').map(Number);
          
          let currentHour = startHour;
          let currentMin = startMin;
          
          while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
            allPossibleSlots.push(formatTime(timeString));
            
            // Advance by 1 hour
            currentHour++;
          }
        });
      }
      // If no slots configured, allPossibleSlots remains as default
    }
    
    // Find bookings for this provider on the selected date
    const bookings = await Booking.find({ 
      service: serviceId, 
      date: date 
    });
    
    // Filter out already booked slots
    const bookedSlots = bookings.map(b => b.slot);
    const availableSlots = allPossibleSlots.filter(slot => !bookedSlots.includes(slot));
    
    res.json({ availableSlots });
  } catch (err) {
    console.error('Error fetching available slots:', err);
    res.status(500).json({ error: 'Error fetching slots: ' + err.message });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { serviceId, date, slot, name, petName, email } = req.body;
    
    if (!serviceId || !date || !slot) {
      return res.render('booking', { 
        service: { _id: serviceId },
        error: 'Missing required booking information',
        confirmed: false,
        user: req.user
      });
    }
    
    // Find the provider
    const provider = await User.findById(serviceId);
    if (!provider || provider.role !== 'service_provider') {
      return res.status(404).send('Service provider not found');
    }
    
    // Create service object for the template
    const service = {
      _id: provider._id,
      name: provider.fullName,
      serviceType: provider.serviceType,
      description: provider.description || 'Professional pet services provider.',
      location: provider.serviceAddress || 'Available Locally',
      rate: provider.serviceType === 'veterinarian' ? 500 : 
            provider.serviceType === 'groomer' ? 300 : 
            provider.serviceType === 'trainer' ? 500 : 200
    };
    
    // Check if slot is already booked
    const existing = await Booking.findOne({ 
      service: serviceId, 
      date, 
      slot 
    });
    
    if (existing) {
      return res.render('booking', { 
        service,
        error: 'This time slot has already been booked. Please choose another time.',
        confirmed: false,
        user: req.user
      });
    }
    
    // Create and save the booking
    const booking = new Booking({
      user: req.user._id,
      service: serviceId,
      date,
      slot
    });
    
    await booking.save();
    
    // Redirect to service payment page after booking
    return res.redirect(`/services/${serviceId}/payment`);
  } catch (err) {
    console.error('Booking failed:', err);
    res.status(500).send('Booking failed: ' + err.message);
  }
};