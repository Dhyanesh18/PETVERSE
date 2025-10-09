const mongoose = require('mongoose');
const fileSchema = require('./fileSchema');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['Workshop', 'Training', 'Adoption Drive', 'Pet Show', 'Health Camp', 'Meetup', 'Competition', 'Other']
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format (HH:MM)'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format (HH:MM)'
    }
  },
  location: {
    venue: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    }
  },
  entryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttendees: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: {
    type: [fileSchema],
    validate: [arrayLimit, 'Maximum 3 images allowed']
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    numberOfPets: {
      type: Number,
      default: 1,
      min: 1
    },
    specialRequirements: String
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  tags: [String],
  contactEmail: {
    type: String,
    validate: {
      validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Invalid email format'
    }
  },
  contactPhone: {
    type: String,
    validate: {
      validator: v => /^\d{10}$/.test(v),
      message: 'Phone must be 10 digits'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

// Validation for image array limit
function arrayLimit(val) {
  return val.length <= 3;
}

// Virtual for available slots
eventSchema.virtual('availableSlots').get(function() {
  return this.maxAttendees - this.attendees.length;
});

// Virtual for isFull
eventSchema.virtual('isFull').get(function() {
  return this.attendees.length >= this.maxAttendees;
});

// Index for faster queries
eventSchema.index({ eventDate: 1, status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ category: 1 });

// Method to check if user is registered
eventSchema.methods.isUserRegistered = function(userId) {
  return this.attendees.some(attendee => attendee.user.toString() === userId.toString());
};

// Static method to get upcoming events
eventSchema.statics.getUpcomingEvents = function() {
  return this.find({
    eventDate: { $gte: new Date() },
    status: 'upcoming'
  }).sort({ eventDate: 1 });
};

module.exports = mongoose.model('Event', eventSchema);
