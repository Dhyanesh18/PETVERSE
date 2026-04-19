import React, { useState } from 'react';
import { FaTimes, FaCamera, FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import api from '../../services/api';

const FoundClaimForm = ({ lostPet, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        claimerName: '',
        claimerPhone: '',
        claimerEmail: '',
        foundAddress: '',
        foundCity: '',
        foundState: '',
        foundLatitude: '',
        foundLongitude: '',
        foundDate: '',
        description: '',
        verificationAnswers: {}
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    const validateField = (name, value) => {
        switch (name) {
            case 'claimerName':
            case 'foundAddress':
            case 'foundCity':
            case 'foundState':
            case 'foundDate':
            case 'description':
                return value?.trim() ? '' : 'This field is required';
            case 'claimerPhone': {
                if (!value?.trim()) return 'Phone number is required';
                const ok = /^\+?[0-9\s-]{7,15}$/.test(value.trim());
                return ok ? '' : 'Enter a valid phone number';
            }
            case 'claimerEmail': {
                if (!value?.trim()) return 'Email is required';
                const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
                return ok ? '' : 'Enter a valid email';
            }
            case 'images':
                return images.length > 0 ? '' : 'Please upload at least one clear image of the found pet';
            default:
                return '';
        }
    };

    const validateAll = (values = formData) => {
        const fields = [
            'images',
            'claimerName',
            'claimerPhone',
            'claimerEmail',
            'foundAddress',
            'foundCity',
            'foundState',
            'foundDate',
            'description'
        ];

        const nextErrors = {};
        for (const field of fields) {
            const err = validateField(field, values[field]);
            if (err) nextErrors[field] = err;
        }

        if (lostPet?.verificationQuestions?.length) {
            lostPet.verificationQuestions.forEach((_, index) => {
                const key = `answer_${index}`;
                const answer = values.verificationAnswers?.[key] || '';
                if (!answer.trim()) {
                    nextErrors[key] = 'This answer is required';
                }
            });
        }

        if (images.length > 3) {
            nextErrors.images = 'You can upload maximum 3 images';
        }

        return nextErrors;
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
        const err = validateField(name, formData[name]);
        setFieldErrors(prev => ({
            ...prev,
            [name]: err
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (touched[name]) {
            const err = validateField(name, value);
            setFieldErrors(prev => ({
                ...prev,
                [name]: err
            }));
        }
    };

    const handleVerificationAnswer = (index, value) => {
        const key = `answer_${index}`;
        setFormData(prev => ({
            ...prev,
            verificationAnswers: {
                ...prev.verificationAnswers,
                [key]: value
            }
        }));

        if (touched[key]) {
            setFieldErrors(prev => ({
                ...prev,
                [key]: value.trim() ? '' : 'This answer is required'
            }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        setTouched(prev => ({
            ...prev,
            images: true
        }));
        
        if (files.length + images.length > 3) {
            setFieldErrors(prev => ({
                ...prev,
                images: 'You can upload maximum 3 images'
            }));
            return;
        }

        setFieldErrors(prev => ({
            ...prev,
            images: ''
        }));

        setImages(prev => [...prev, ...files]);
        
        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => {
            const next = prev.filter((_, i) => i !== index);
            if (touched.images) {
                setFieldErrors(prevErrors => ({
                    ...prevErrors,
                    images: next.length > 0 ? '' : 'Please upload at least one clear image of the found pet'
                }));
            }
            return next;
        });
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const nextErrors = validateAll();
        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            const nextTouched = {
                images: true,
                claimerName: true,
                claimerPhone: true,
                claimerEmail: true,
                foundAddress: true,
                foundCity: true,
                foundState: true,
                foundDate: true,
                description: true
            };
            if (lostPet?.verificationQuestions?.length) {
                lostPet.verificationQuestions.forEach((_, index) => {
                    nextTouched[`answer_${index}`] = true;
                });
            }
            setTouched(nextTouched);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const submitData = new FormData();
            
            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (key !== 'verificationAnswers') {
                    submitData.append(key, formData[key]);
                }
            });

            // Add verification answers
            Object.keys(formData.verificationAnswers).forEach(key => {
                submitData.append(key, formData.verificationAnswers[key]);
            });

            // Add images
            images.forEach(image => {
                submitData.append('images', image);
            });

            await api.post(`/lost-pets/${lostPet._id}/claim`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Your claim has been submitted successfully! The owner will review it and contact you if verified.');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit claim');
            console.error('Submit claim error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-neutral-100 bg-opacity-50 z-50 flex items-center justify-center p-4 pt-24 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FaCheckCircle />
                        I Found This Pet
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Pet Info Display */}
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                        <h3 className="font-semibold text-teal-800 mb-2">Found Pet: {lostPet.petName}</h3>
                        <p className="text-sm text-teal-700">
                            {lostPet.petType} • {lostPet.breed} • {lostPet.color}
                        </p>
                    </div>

                    {/* Image Upload - REQUIRED */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Upload Clear Images of the Found Pet <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            For verification purposes, you must upload 1-3 clear images showing the pet's face and distinguishing features
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            id="claim-images"
                        />
                        <label
                            htmlFor="claim-images"
                            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-teal-300 rounded-lg hover:border-teal-500 cursor-pointer transition-colors bg-teal-50"
                        >
                            <FaCamera className="text-teal-600" />
                            <span className="text-teal-700 font-medium">Upload Images (Max 3)</span>
                        </label>

                        {touched.images && fieldErrors.images && (
                            <p className="text-sm text-red-600">{fieldErrors.images}</p>
                        )}
                        
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <FaTimes className="text-xs" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Verification Questions */}
                    {lostPet.verificationQuestions && lostPet.verificationQuestions.length > 0 && (
                        <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                                🔐 Verification Questions
                            </h3>
                            <p className="text-sm text-amber-700 mb-3">
                                Please answer the following questions to help verify you found this pet:
                            </p>
                            {lostPet.verificationQuestions.map((vq, index) => (
                                <div key={index}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {vq.question} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.verificationAnswers[`answer_${index}`] || ''}
                                        onChange={(e) => handleVerificationAnswer(index, e.target.value)}
                                        onBlur={() => {
                                            const key = `answer_${index}`;
                                            setTouched(prev => ({ ...prev, [key]: true }));
                                            const val = formData.verificationAnswers[key] || '';
                                            setFieldErrors(prev => ({ ...prev, [key]: val.trim() ? '' : 'This answer is required' }));
                                        }}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="Your answer"
                                    />
                                    {touched[`answer_${index}`] && fieldErrors[`answer_${index}`] && (
                                        <p className="mt-1 text-sm text-red-600">{fieldErrors[`answer_${index}`]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Your Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Your Contact Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="claimerName"
                                    value={formData.claimerName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                {touched.claimerName && fieldErrors.claimerName && (
                                    <p className="mt-1 text-sm text-red-600">{fieldErrors.claimerName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="claimerPhone"
                                    value={formData.claimerPhone}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                {touched.claimerPhone && fieldErrors.claimerPhone && (
                                    <p className="mt-1 text-sm text-red-600">{fieldErrors.claimerPhone}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="claimerEmail"
                                    value={formData.claimerEmail}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                {touched.claimerEmail && fieldErrors.claimerEmail && (
                                    <p className="mt-1 text-sm text-red-600">{fieldErrors.claimerEmail}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Found Location */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-teal-600" />
                            Where Did You Find This Pet?
                        </h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="foundAddress"
                                value={formData.foundAddress}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            {touched.foundAddress && fieldErrors.foundAddress && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.foundAddress}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="foundCity"
                                    value={formData.foundCity}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                {touched.foundCity && fieldErrors.foundCity && (
                                    <p className="mt-1 text-sm text-red-600">{fieldErrors.foundCity}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="foundState"
                                    value={formData.foundState}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                {touched.foundState && fieldErrors.foundState && (
                                    <p className="mt-1 text-sm text-red-600">{fieldErrors.foundState}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <FaCalendarAlt className="text-teal-600" />
                                When Did You Find This Pet? <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="foundDate"
                                value={formData.foundDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            {touched.foundDate && fieldErrors.foundDate && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.foundDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Details <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Describe the condition of the pet, behavior, and any other relevant details..."
                        />
                        {touched.description && fieldErrors.description && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || Object.keys(validateAll()).length > 0}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Claim'}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        By submitting this claim, you confirm that you have genuinely found this pet and agree to return it to the rightful owner upon verification.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default FoundClaimForm;
