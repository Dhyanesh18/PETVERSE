import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const EditPet = () => {
    const { id } = useParams();
    // const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        breed: '',
        age: '',
        gender: '',
        price: '',
        description: '',
        available: true
    });
    
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [imagesToKeep, setImagesToKeep] = useState([]);

    useEffect(() => {
        fetchPetData();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchPetData = async () => {
        try {
            const response = await fetch(`/api/seller/pets/${id}/edit`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            console.log('Pet data received:', data); // Debug log
            
            if (data.success && data.pet) {
                const pet = data.pet;
                setFormData({
                    name: pet.name || '',
                    category: pet.category || '',
                    breed: pet.breed || '',
                    age: pet.age || '',
                    gender: pet.gender || '',
                    price: pet.price || '',
                    description: pet.description || '',
                    available: pet.available !== false
                });
                
                // Generate image URLs for binary data stored in database
                const imageUrls = (pet.images || []).map((img, index) => 
                    `/api/images/pet/${pet._id}/${index}`
                );
                console.log('Generated pet image URLs:', imageUrls);
                setExistingImages(imageUrls);
                setImagesToKeep(new Array(imageUrls.length || 0).fill(true));
            }
        } catch (err) {
            setError('Failed to load pet data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            setError('Maximum 5 images allowed');
            return;
        }
        setNewImages(files);
    };

    const toggleKeepImage = (index) => {
        setImagesToKeep(prev => {
            const updated = [...prev];
            updated[index] = !updated[index];
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const formDataToSend = new FormData();
            
            // Add form fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            
            // Add image keep flags
            imagesToKeep.forEach((keep) => {
                formDataToSend.append('keepImages', keep.toString());
            });
            
            // Add new images
            newImages.forEach(image => {
                formDataToSend.append('images', image);
            });

            const response = await fetch(`/api/pets/${id}/edit`, {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend
            });

            const data = await response.json();
            
            if (data.success) {
                setSuccess('Pet updated successfully!');
                setTimeout(() => {
                    window.history.back();
                }, 2000);
            } else {
                setError(data.message || 'Failed to update pet');
            }
        } catch (err) {
            setError('Error updating pet: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <Header />
            <div className="container mx-auto px-4 py-8" style={{ paddingTop: '100px' }}>
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-center mb-8">
                        <h1 className="text-4xl font-bold" style={{ 
                            background: 'linear-gradient(135deg, rgb(0, 180, 180), teal)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Edit Pet
                        </h1>
                    </div>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pet Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Category</option>
                                    <option value="Dog">Dog</option>
                                    <option value="Cat">Cat</option>
                                    <option value="Bird">Bird</option>
                                    <option value="Fish">Fish</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Breed *
                                </label>
                                <input
                                    type="text"
                                    name="breed"
                                    value={formData.breed}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Age *
                                </label>
                                <input
                                    type="text"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 2 years, 6 months"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gender *
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tell us about your pet..."
                            />
                        </div>

                        <div className="mt-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="available"
                                    checked={formData.available}
                                    onChange={handleInputChange}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium text-gray-700">Available for adoption</span>
                            </label>
                        </div>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Images (uncheck to remove)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {existingImages.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={image}
                                                alt={`Pet ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-md"
                                                onError={(e) => {
                                                    e.target.src = '/images/default-pet.jpg';
                                                }}
                                            />
                                            <label className="absolute top-2 right-2 bg-white rounded-full p-1">
                                                <input
                                                    type="checkbox"
                                                    checked={imagesToKeep[index]}
                                                    onChange={() => toggleKeepImage(index)}
                                                    className="w-4 h-4"
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Images */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add New Images (Max 5 total)
                            </label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Select up to 5 images (JPG, PNG, GIF)
                            </p>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {submitting ? 'Updating...' : 'Update Pet Listing'}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditPet;