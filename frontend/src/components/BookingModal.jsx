import { useState, useEffect } from 'react';
import { getAvailableSlots, createBooking } from '../services/api';
import { FaTimes, FaCalendarAlt, FaClock, FaCheckCircle, FaUser, FaPaw } from 'react-icons/fa';

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
            
            const serviceId = service._id || service.id;
            console.log('Fetching slots for service:', serviceId, 'date:', selectedDate);
            const response = await getAvailableSlots(serviceId, selectedDate);
            console.log('Slots response:', response.data);
            const slots = response.data.data?.slots || response.data.slots || response.data.availableSlots || [];
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
                serviceId: service._id || service.id,
                date: selectedDate,
                slot: selectedSlot
            };

            console.log('Creating booking with data:', bookingData);
            const response = await createBooking(bookingData);
            console.log('Booking response:', response.data);
            
            setSuccess(true);
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(response.data);
                }
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
            <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-[9999] overflow-y-auto pt-24 pb-8 px-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center transform animate-fadeIn my-4">
                    {/* Success Icon with Animation */}
                    <div className="mb-4 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <div className="relative">
                            <FaCheckCircle className="text-6xl text-green-500 mx-auto drop-shadow-lg" />
                        </div>
                    </div>
                    
                    {/* Success Message */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-600 mb-4">
                        Your appointment has been successfully scheduled
                    </p>
                    
                    {/* Booking Details Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 mb-4 border border-indigo-100 shadow-inner">
                        <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">Booking Details</h3>
                        
                        <div className="space-y-2 text-left">
                            <div className="flex items-start gap-2 pb-2 border-b border-indigo-100">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FaUser className="text-indigo-600 text-sm" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Service Provider</p>
                                    <p className="font-bold text-gray-800">{service.name || service.fullName}</p>
                                    <p className="text-xs text-indigo-600">{service.category || service.serviceType}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-2 pb-2 border-b border-indigo-100">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FaCalendarAlt className="text-indigo-600 text-sm" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Appointment Date</p>
                                    <p className="font-bold text-gray-800 text-sm">{formatDate(selectedDate)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FaClock className="text-indigo-600 text-sm" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Time Slot</p>
                                    <p className="font-bold text-gray-800">{selectedSlot}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Info Message */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-xs text-yellow-800">
                            <strong>📧 Confirmation sent!</strong> Check your email for details.
                        </p>
                    </div>
                    
                    {/* Action Button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-6 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-[9999] overflow-y-auto pt-24 pb-8 px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-4 transform transition-all">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <FaCalendarAlt className="text-indigo-600" />
                            Book Appointment
                        </h2>
                        <p className="text-gray-600 text-base">
                            {service.name || service.fullName} - <span className="text-indigo-600 font-medium">{service.category || service.serviceType}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <FaTimes className="text-2xl" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Booking Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Service Info Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                                    <FaPaw className="text-2xl text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-0.5">Service Price</p>
                                    <p className="text-2xl font-bold text-indigo-600">₹{service.price}</p>
                                    <p className="text-xs text-gray-500">per session</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-600 mb-0.5">Category</p>
                                <p className="font-bold text-gray-800">{service.category || service.serviceType}</p>
                            </div>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                        <label className="block text-gray-800 font-semibold mb-2 flex items-center gap-2">
                            <FaCalendarAlt className="text-indigo-600" />
                            Select Appointment Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={today}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 font-medium text-gray-700 transition-all"
                            required
                        />
                        {selectedDate && (
                            <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                                <p className="text-sm text-indigo-600 font-medium">
                                    📅 {formatDate(selectedDate)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Time Slot Selection */}
                    {selectedDate && (
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                            <label className="block text-gray-800 font-semibold mb-3 flex items-center gap-2">
                                <FaClock className="text-indigo-600" />
                                Select Time Slot
                            </label>
                            
                            {fetchingSlots ? (
                                <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg">
                                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 mb-3"></div>
                                    <p className="text-gray-600 text-sm font-medium">Loading available slots...</p>
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <div className="text-center py-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-100">
                                    <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-700 font-semibold">No slots available</p>
                                    <p className="text-sm text-gray-500">Please select another date</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs text-gray-600 mb-2">{availableSlots.length} slots available</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                                        {availableSlots.map((slot, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`px-3 py-3 rounded-lg border-2 font-semibold text-sm transition-all transform hover:scale-105 ${
                                                    selectedSlot === slot
                                                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white border-indigo-600 shadow-lg scale-105'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm'
                                                }`}
                                            >
                                                <FaClock className={`mx-auto mb-1 text-xs ${selectedSlot === slot ? 'text-white' : 'text-indigo-500'}`} />
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Booking Summary */}
                    {selectedDate && selectedSlot && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                                <FaCheckCircle className="text-green-600" />
                                <h3 className="font-bold text-gray-800">Booking Summary</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center pb-2 border-b border-green-200">
                                    <span className="text-gray-600 text-sm font-medium">Service Provider:</span>
                                    <span className="font-bold text-gray-800 text-sm">{service.name || service.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-green-200">
                                    <span className="text-gray-600 text-sm font-medium">Date:</span>
                                    <span className="font-bold text-gray-800 text-sm">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-green-200">
                                    <span className="text-gray-600 text-sm font-medium">Time:</span>
                                    <span className="font-bold text-gray-800 text-sm">{selectedSlot}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 bg-white rounded-lg p-2.5">
                                    <span className="text-gray-700 font-bold">Total Amount:</span>
                                    <span className="font-bold text-green-600 text-xl">₹{service.price}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-all duration-300 font-semibold border-2 border-gray-300 hover:border-gray-400"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 font-semibold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                            disabled={loading || !selectedDate || !selectedSlot}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <FaCheckCircle />
                                    Confirm Booking
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Info Note */}
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-lg shadow-sm">
                    <div className="flex gap-2">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-xs text-yellow-900 font-semibold mb-1">Important Information</p>
                            <ul className="text-xs text-yellow-800 space-y-0.5">
                                <li>• Arrive 10 minutes early</li>
                                <li>• Cancel 24 hours in advance</li>
                                <li>• Bring vaccination records</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
