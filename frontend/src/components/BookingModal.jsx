import { useState, useEffect } from 'react';
import { getAvailableSlots, createServiceBooking } from '../services/api';
import { FaTimes, FaCalendarAlt, FaClock, FaCheckCircle } from 'react-icons/fa';

const BookingModal = ({ service, onClose, onSuccess }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [fetchingSlots, setFetchingSlots] = useState(false);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots();
        }
    }, [selectedDate]);

    const fetchAvailableSlots = async () => {
        try {
            setFetchingSlots(true);
            setError('');
            setSelectedSlot('');
            
            const response = await getAvailableSlots(service._id, selectedDate);
            const slots = response.data.data?.slots || response.data.slots || [];
            setAvailableSlots(slots);
            
            if (slots.length === 0) {
                setError('No slots available for this date. Please select another date.');
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
            setError('Failed to load available time slots');
            setAvailableSlots([]);
        } finally {
            setFetchingSlots(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedDate) {
            setError('Please select a date');
            return;
        }
        
        if (!selectedSlot) {
            setError('Please select a time slot');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const bookingData = {
                serviceId: service._id,
                date: selectedDate,
                slot: selectedSlot
            };

            await createServiceBooking(bookingData);
            
            setSuccess(true);
            setTimeout(() => {
                onSuccess && onSuccess();
            }, 2000);
        } catch (error) {
            console.error('Error creating booking:', error);
            setError(error.response?.data?.message || 'Failed to create booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
                    <div className="mb-4">
                        <FaCheckCircle className="text-6xl text-green-500 mx-auto animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-600 mb-4">
                        Your booking has been successfully created.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-600 mb-1">Service Provider</p>
                        <p className="font-semibold text-gray-800">{service.name || service.fullName}</p>
                        <p className="text-sm text-gray-600 mt-2 mb-1">Date & Time</p>
                        <p className="font-semibold text-gray-800">{formatDate(selectedDate)}</p>
                        <p className="font-semibold text-gray-800">{selectedSlot}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Book Appointment</h2>
                        <p className="text-gray-600">
                            {service.name || service.fullName} - {service.category || service.serviceType}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {/* Booking Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Service Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">Service Price</p>
                                <p className="text-2xl font-bold text-indigo-600">₹{service.price}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Category</p>
                                <p className="font-semibold text-gray-800">{service.category || service.serviceType}</p>
                            </div>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                            <FaCalendarAlt className="text-indigo-600" />
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={today}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                            required
                        />
                        {selectedDate && (
                            <p className="mt-2 text-sm text-gray-600">
                                {formatDate(selectedDate)}
                            </p>
                        )}
                    </div>

                    {/* Time Slot Selection */}
                    {selectedDate && (
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                <FaClock className="text-indigo-600" />
                                Select Time Slot
                            </label>
                            
                            {fetchingSlots ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
                                    <p className="text-gray-600 mt-2">Loading available slots...</p>
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <p className="text-gray-600">No slots available for this date</p>
                                    <p className="text-sm text-gray-500 mt-1">Please select another date</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2">
                                    {availableSlots.map((slot, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                                                selectedSlot === slot
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                            }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Booking Summary */}
                    {selectedDate && selectedSlot && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-800 mb-3">Booking Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Service Provider:</span>
                                    <span className="font-medium text-gray-800">{service.name || service.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-medium text-gray-800">{new Date(selectedDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Time:</span>
                                    <span className="font-medium text-gray-800">{selectedSlot}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-indigo-300">
                                    <span className="text-gray-600 font-semibold">Total Amount:</span>
                                    <span className="font-bold text-indigo-600 text-lg">₹{service.price}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-bold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            disabled={loading || !selectedDate || !selectedSlot}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                                    Processing...
                                </span>
                            ) : (
                                'Confirm Booking'
                            )}
                        </button>
                    </div>
                </form>

                {/* Info Note */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Please arrive 10 minutes before your scheduled time. 
                        Cancellations must be made at least 24 hours in advance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
