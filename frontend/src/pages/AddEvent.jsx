import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addEvent } from '../services/api';
import { FaCalendarPlus, FaInfoCircle } from 'react-icons/fa';

const AddEvent = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        venue: '',
        address: '',
        city: '',
        entryFee: 0,
        maxAttendees: '',
        contactEmail: '',
        contactPhone: '',
        tags: ''
    });
    const [permissionDocument, setPermissionDocument] = useState(null);
    const [documentPreview, setDocumentPreview] = useState('');
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Validation functions
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'title':
                if (!value.trim()) {
                    error = 'Title is required';
                } else if (value.trim().length < 5) {
                    error = 'Title must be at least 5 characters';
                } else if (value.length > 100) {
                    error = 'Title must not exceed 100 characters';
                }
                break;

            case 'category':
                if (!value) {
                    error = 'Category is required';
                }
                break;

            case 'description':
                if (!value.trim()) {
                    error = 'Description is required';
                } else if (value.trim().length < 20) {
                    error = 'Description must be at least 20 characters';
                } else if (value.length > 1000) {
                    error = 'Description must not exceed 1000 characters';
                }
                break;

            case 'venue':
                if (!value.trim()) {
                    error = 'Venue name is required';
                } else if (value.trim().length < 3) {
                    error = 'Venue name must be at least 3 characters';
                }
                break;

            case 'address':
                if (!value.trim()) {
                    error = 'Address is required';
                } else if (value.trim().length < 10) {
                    error = 'Address must be at least 10 characters';
                }
                break;

            case 'city':
                if (!value.trim()) {
                    error = 'City is required';
                } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
                    error = 'City should only contain letters';
                }
                break;

            case 'entryFee':
                const fee = parseFloat(value);
                if (isNaN(fee) || fee < 0) {
                    error = 'Entry fee must be 0 or greater';
                } else if (fee > 10000) {
                    error = 'Entry fee seems too high (max: ₹10,000)';
                }
                break;

            case 'maxAttendees':
                const attendees = parseInt(value);
                if (!value || isNaN(attendees)) {
                    error = 'Maximum attendees is required';
                } else if (attendees < 1) {
                    error = 'Must allow at least 1 attendee';
                } else if (attendees > 1000) {
                    error = 'Maximum attendees cannot exceed 1000';
                }
                break;

            case 'contactEmail':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Enter a valid email address';
                }
                break;

            case 'contactPhone':
                if (value && !/^[0-9]{10}$/.test(value)) {
                    error = 'Phone number must be exactly 10 digits';
                }
                break;

            case 'eventDate':
                if (!value) {
                    error = 'Event date is required';
                }
                break;

            case 'startTime':
                if (!value) {
                    error = 'Start time is required';
                }
                break;

            case 'endTime':
                if (!value) {
                    error = 'End time is required';
                }
                break;

            default:
                break;
        }

        return error;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validate on change if field has been touched
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                e.target.value = '';
                setPermissionDocument(null);
                setDocumentPreview('');
                return;
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed');
                e.target.value = '';
                setPermissionDocument(null);
                setDocumentPreview('');
                return;
            }

            setPermissionDocument(file);
            setDocumentPreview(file.name);
            console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
        } else {
            setPermissionDocument(null);
            setDocumentPreview('');
        }
    };

    const validateDate = (dateString) => {
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const oneMonthFromNow = new Date(today);
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        
        const sixMonthsFromNow = new Date(today);
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        if (selectedDate <= today) {
            return 'Event date must be in the future';
        }
        if (selectedDate < oneMonthFromNow) {
            return 'Event must be scheduled at least 1 month in advance';
        }
        if (selectedDate > sixMonthsFromNow) {
            return 'Event cannot be scheduled more than 6 months in advance';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        // Validate date
        const dateError = validateDate(formData.eventDate);
        if (dateError) {
            newErrors.eventDate = dateError;
        }

        // Validate time
        if (formData.startTime >= formData.endTime) {
            newErrors.endTime = 'End time must be after start time';
        }

        // Validate permission document
        if (!permissionDocument) {
            setError('Government permission letter is required');
            setErrors(newErrors);
            // Mark all fields as touched
            const allTouched = {};
            Object.keys(formData).forEach(key => {
                allTouched[key] = true;
            });
            setTouched(allTouched);
            return;
        }

        // Check if there are any errors
        if (Object.keys(newErrors).length > 0) {
            setError('Please fix all validation errors before submitting');
            setErrors(newErrors);
            // Mark all fields as touched
            const allTouched = {};
            Object.keys(formData).forEach(key => {
                allTouched[key] = true;
            });
            setTouched(allTouched);
            return;
        }

        try {
            setSubmitting(true);

            // Create FormData for file upload
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            submitData.append('permissionDocument', permissionDocument);

            // Debug: Log FormData contents
            console.log('Submitting event with file:', permissionDocument?.name);
            console.log('FormData entries:');
            for (let pair of submitData.entries()) {
                console.log(pair[0], ':', pair[1]);
            }

            const response = await addEvent(submitData);

            if (response.data.success) {
                alert('Event created successfully!');
                navigate(`/events/${response.data.data.eventId}`);
            }
        } catch (error) {
            console.error('Failed to create event:', error);
            setError(error.response?.data?.error || error.response?.data?.message || 'Failed to create event');
        } finally {
            setSubmitting(false);
        }
    };

    const getMinDate = () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 6);
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="bg-gray-50 min-h-screen pt-24 pb-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
                            <FaCalendarPlus className="text-teal-500" />
                            Create New Event
                        </h1>
                        <p className="text-gray-600 mt-2">Fill in the details to create a pet event</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Basic Information */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Basic Information
                            </h3>

                            <div className="mb-4">
                                <label htmlFor="title" className="block text-gray-700 font-semibold mb-2">
                                    Event Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    maxLength="100"
                                    placeholder="e.g., Dog Training Workshop"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        touched.title && errors.title
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                />
                                <div className="flex justify-between items-center mt-1">
                                    {touched.title && errors.title && (
                                        <small className="text-red-500">{errors.title}</small>
                                    )}
                                    <small className={`${touched.title && errors.title ? 'ml-auto' : ''} text-gray-500`}>
                                        {formData.title.length} / 100
                                    </small>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="category" className="block text-gray-700 font-semibold mb-2">
                                    Category *
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        touched.category && errors.category
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                >
                                    <option value="">Select Category</option>
                                    <option value="Workshop">Workshop</option>
                                    <option value="Adoption Drive">Adoption Drive</option>
                                    <option value="Pet Show">Pet Show</option>
                                    <option value="Competition">Competition</option>
                                </select>
                                {touched.category && errors.category && (
                                    <small className="text-red-500 block mt-1">{errors.category}</small>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    maxLength="1000"
                                    rows="5"
                                    placeholder="Describe your event..."
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        touched.description && errors.description
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                />
                                <div className="flex justify-between items-center mt-1">
                                    {touched.description && errors.description && (
                                        <small className="text-red-500">{errors.description}</small>
                                    )}
                                    <small className={`${touched.description && errors.description ? 'ml-auto' : ''} text-gray-500`}>
                                        {formData.description.length} / 1000
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Government Permission */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Government Permission
                            </h3>

                            <div className="mb-4">
                                <label htmlFor="permissionDocument" className="block text-gray-700 font-semibold mb-2">
                                    Permission Letter *
                                </label>
                                <input
                                    type="file"
                                    id="permissionDocument"
                                    name="permissionDocument"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                <small className="text-gray-500 block mt-1">
                                    Upload government permission letter (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
                                </small>
                                {documentPreview && (
                                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                                        Selected: {documentPreview}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Date & Time
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label htmlFor="eventDate" className="block text-gray-700 font-semibold mb-2">
                                        Event Date *
                                    </label>
                                    <input
                                        type="date"
                                        id="eventDate"
                                        name="eventDate"
                                        value={formData.eventDate}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        min={getMinDate()}
                                        max={getMaxDate()}
                                        required
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                            touched.eventDate && errors.eventDate
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-teal-500'
                                        }`}
                                    />
                                    {touched.eventDate && errors.eventDate ? (
                                        <small className="text-red-500 block mt-1">{errors.eventDate}</small>
                                    ) : (
                                        <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                            <FaInfoCircle />
                                            Event must be scheduled 1-6 months in advance
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="startTime" className="block text-gray-700 font-semibold mb-2">
                                        Start Time *
                                    </label>
                                    <input
                                        type="time"
                                        id="startTime"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                            touched.startTime && errors.startTime
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-teal-500'
                                        }`}
                                    />
                                    {touched.startTime && errors.startTime && (
                                        <small className="text-red-500 block mt-1">{errors.startTime}</small>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="endTime" className="block text-gray-700 font-semibold mb-2">
                                        End Time *
                                    </label>
                                    <input
                                        type="time"
                                        id="endTime"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                            touched.endTime && errors.endTime
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-teal-500'
                                        }`}
                                    />
                                    {touched.endTime && errors.endTime && (
                                        <small className="text-red-500 block mt-1">{errors.endTime}</small>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Location
                            </h3>

                            <div className="mb-4">
                                <label htmlFor="venue" className="block text-gray-700 font-semibold mb-2">
                                    Venue Name *
                                </label>
                                <input
                                    type="text"
                                    id="venue"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    placeholder="e.g., City Park"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        touched.venue && errors.venue
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                />
                                {touched.venue && errors.venue && (
                                    <small className="text-red-500 block mt-1">{errors.venue}</small>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="address" className="block text-gray-700 font-semibold mb-2">
                                    Address *
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    placeholder="Street address"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        touched.address && errors.address
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                />
                                {touched.address && errors.address && (
                                    <small className="text-red-500 block mt-1">{errors.address}</small>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="city" className="block text-gray-700 font-semibold mb-2">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    placeholder="City name"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        touched.city && errors.city
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                />
                                {touched.city && errors.city && (
                                    <small className="text-red-500 block mt-1">{errors.city}</small>
                                )}
                            </div>
                        </div>

                        {/* Registration Details */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Registration Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="entryFee" className="block text-gray-700 font-semibold mb-2">
                                        Entry Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        id="entryFee"
                                        name="entryFee"
                                        value={formData.entryFee}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        min="0"
                                        placeholder="0 for free"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                            touched.entryFee && errors.entryFee
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-teal-500'
                                        }`}
                                    />
                                    {touched.entryFee && errors.entryFee && (
                                        <small className="text-red-500 block mt-1">{errors.entryFee}</small>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="maxAttendees" className="block text-gray-700 font-semibold mb-2">
                                        Maximum Attendees *
                                    </label>
                                    <input
                                        type="number"
                                        id="maxAttendees"
                                        name="maxAttendees"
                                        value={formData.maxAttendees}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        min="1"
                                        max="1000"
                                        placeholder="e.g., 50"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                            touched.maxAttendees && errors.maxAttendees
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-teal-500'
                                        }`}
                                    />
                                    {touched.maxAttendees && errors.maxAttendees && (
                                        <small className="text-red-500 block mt-1">{errors.maxAttendees}</small>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Contact Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="contactEmail" className="block text-gray-700 font-semibold mb-2">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        id="contactEmail"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="your.email@example.com (optional)"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                            touched.contactEmail && errors.contactEmail
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-teal-500'
                                        }`}
                                    />
                                    {touched.contactEmail && errors.contactEmail ? (
                                        <small className="text-red-500 block mt-1">{errors.contactEmail}</small>
                                    ) : (
                                        <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                            <FaInfoCircle />
                                            Optional - Leave blank to use your account email
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="contactPhone" className="block text-gray-700 font-semibold mb-2">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        id="contactPhone"
                                        name="contactPhone"
                                        value={formData.contactPhone}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        placeholder="9876543210 (optional)"
                                        pattern="[0-9]{10}"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                            touched.contactPhone && errors.contactPhone
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-teal-500'
                                        }`}
                                    />
                                    {touched.contactPhone && errors.contactPhone ? (
                                        <small className="text-red-500 block mt-1">{errors.contactPhone}</small>
                                    ) : (
                                        <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                            <FaInfoCircle />
                                            Optional - Leave blank to use your account phone
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="tags" className="block text-gray-700 font-semibold mb-2">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    id="tags"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    placeholder="e.g., training, puppies, beginners"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-md transition duration-200 flex items-center gap-2 disabled:opacity-50"
                            >
                                <FaCalendarPlus />
                                {submitting ? 'Creating...' : 'Create Event'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddEvent;
