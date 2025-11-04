import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventTicket } from '../services/api';
import { FaQrcode, FaPrint, FaArrowLeft } from 'react-icons/fa';

const EventTicket = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const response = await getEventTicket(id);
            const data = response.data.data;
            setTicket(data.ticket);
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
            alert('Failed to load ticket. You may not be registered for this event.');
            navigate(`/events/${id}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700">Loading ticket...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl text-gray-700">Ticket not found</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 pt-20">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-sm opacity-90 mb-1">Event Ticket</div>
                                <h1 className="text-3xl font-bold">{ticket.title}</h1>
                            </div>
                            <div>
                                <FaQrcode className="text-6xl opacity-90" />
                            </div>
                        </div>
                    </div>

                    {/* Ticket Body */}
                    <div className="p-8">
                        {/* Attendee Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Attendee</div>
                                <div className="text-lg font-semibold text-gray-800">{ticket.attendeeName}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">Category</div>
                                <div className="text-lg font-semibold text-gray-800">{ticket.category}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">Number of Pets</div>
                                <div className="text-lg font-semibold text-gray-800">{ticket.numberOfPets}</div>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Date</div>
                                <div className="text-lg font-semibold text-gray-800">{formatDate(ticket.date)}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">Time</div>
                                <div className="text-lg font-semibold text-gray-800">
                                    {ticket.startTime} - {ticket.endTime}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">City</div>
                                <div className="text-lg font-semibold text-gray-800">{ticket.city}</div>
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            <div className="md:col-span-2">
                                <div className="text-sm text-gray-500 mb-1">Venue</div>
                                <div className="text-lg font-semibold text-gray-800">{ticket.venue}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">Registered At</div>
                                <div className="text-lg font-semibold text-gray-800">
                                    {formatDateTime(ticket.registeredAt)}
                                </div>
                            </div>
                        </div>

                        {/* Special Requirements */}
                        {ticket.specialRequirements && (
                            <div className="mb-6">
                                <div className="text-sm text-gray-500 mb-1">Special Requirements</div>
                                <div className="text-gray-800 p-4 bg-gray-50 rounded-lg">
                                    {ticket.specialRequirements}
                                </div>
                            </div>
                        )}

                        {/* Important Notice */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-yellow-800 mb-2">Important Information</h3>
                            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                                <li>Please carry a printed or digital copy of this ticket</li>
                                <li>Arrive at least 15 minutes before the event start time</li>
                                <li>Bring necessary pet supplies and documents</li>
                                <li>Follow all event guidelines and organizer instructions</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-end print:hidden">
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition duration-200"
                            >
                                <FaPrint />
                                Print Ticket
                            </button>
                            <button
                                onClick={() => navigate(`/events/${ticket.eventId}`)}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-md transition duration-200"
                            >
                                <FaArrowLeft />
                                Back to Event
                            </button>
                        </div>
                    </div>

                    {/* Ticket Footer */}
                    <div className="bg-gray-100 px-8 py-4 text-center text-sm text-gray-600 border-t border-gray-200">
                        <p>Thank you for registering! We look forward to seeing you at the event.</p>
                        <p className="mt-1">For any queries, please contact the event organizer.</p>
                    </div>
                </div>

                {/* Success Message */}
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center print:hidden">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Registration Successful!</h3>
                    <p className="text-green-700">
                        Your ticket has been confirmed. You will receive a confirmation email shortly.
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default EventTicket;
