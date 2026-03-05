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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVerificationAnswer = (index, value) => {
        setFormData(prev => ({
            ...prev,
            verificationAnswers: {
                ...prev.verificationAnswers,
                [`answer_${index}`]: value
            }
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length + images.length > 3) {
            setError('You can upload maximum 3 images');
            return;
        }

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
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (images.length === 0) {
            setError('Please upload at least one clear image of the found pet');
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
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="Your answer"
                                    />
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
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
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
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
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
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
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
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
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
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
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
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
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
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
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
                            required
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Describe the condition of the pet, behavior, and any other relevant details..."
                        />
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
                            disabled={loading || images.length === 0}
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
