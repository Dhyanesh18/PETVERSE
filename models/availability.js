const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    serviceProvider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceProvider',
        required: true
    },
    days: [{
        day: {
        type: String,
        enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        required: true
    },
    isHoliday: {
        type: Boolean,
        default: false
    },
    slots: [{
        start: {
            type: String,
            validate: {
                validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format (HH:MM)`
            },
            required: function() {
                return !this.isHoliday;
            }
        },
        end: {
            type: String,
            validate: {
                validator: function(v) {
                    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)) return false;
                    return new Date(`1970-01-01T${v}:00`) > new Date(`1970-01-01T${this.start}:00`);
                },
                message: props => `End time must be after start time`
                },
                required: function() {
                    return !this.isHoliday;
                }
            }
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
availabilitySchema.index({ serviceProvider: 1 });
availabilitySchema.index({ 'days.day': 1 });

// Update the timestamp before saving
availabilitySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

//get availability by day
availabilitySchema.methods.getByDay = function(day) {
    return this.days.find(d => d.day === day.toLowerCase()) || { 
    isHoliday: true, 
    slots: [] 
    };
};

//update or create availability
availabilitySchema.statics.updateAvailability = async function(serviceProviderId, daysData) {
    return this.findOneAndUpdate(
    { serviceProvider: serviceProviderId },
    { 
        $set: { 
            days: Object.entries(daysData).map(([day, data]) => ({
            day,
            isHoliday: data.isHoliday,
            slots: data.isHoliday ? [] : data.slots
            .filter(slot => slot.start && slot.end)
            .map(slot => ({
                start: slot.start.padStart(5, '0'), // Ensure HH:MM format
                end: slot.end.padStart(5, '0')
                }))
            }))
        } 
    },
    { 
            upsert: true,
            new: true,
            runValidators: true 
        }
    );
};

module.exports = mongoose.model('Availability', availabilitySchema);