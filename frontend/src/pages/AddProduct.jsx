import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';

const AddProduct = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: '',
        brand: '',
        description: '',
        discount: '',
        stock: ''
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const maxFiles = 5;

    const validators = {
        name: (value) => {
            if (!value || value.trim().length === 0) return 'Product name is required';
            if (value.length < 2) return 'Product name must be at least 2 characters';
            if (value.length > 100) return 'Product name must not exceed 100 characters';
            if (!/[a-zA-Z]/.test(value)) return 'Product name must contain at least one letter';
            if (!/^[a-zA-Z0-9\s\-&().,]+$/.test(value)) return 'Product name contains invalid characters';
            return null;
        },
        brand: (value) => {
            if (!value || value.trim().length === 0) return 'Brand is required';
            if (value.length < 2) return 'Brand must be at least 2 characters';
            if (value.length > 50) return 'Brand must not exceed 50 characters';
            if (!/^[a-zA-Z\s\-&'.]+$/.test(value)) return 'Brand can only contain letters, spaces, hyphens, ampersands, apostrophes, and periods';
            return null;
        },
        price: (value) => {
            if (!value || value === '') return 'Price is required';
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return 'Price must be a valid number';
            if (numValue < 1) return 'Price must be at least ₹1';
            if (numValue > 10000000) return 'Price cannot exceed ₹1,00,00,000';
            return null;
        },
        category: (value) => {
            if (!value || value === '') return 'Please select a category';
            return null;
        },
        stock: (value) => {
            if (!value || value === '') return 'Stock quantity is required';
            const numValue = parseInt(value);
            if (isNaN(numValue)) return 'Stock must be a valid number';
            if (numValue < 0) return 'Stock cannot be negative';
            if (numValue > 10000) return 'Stock cannot exceed 10,000';
            return null;
        }
    };

    const validateField = (fieldName, value) => {
        const validator = validators[fieldName];
        if (!validator) return null;
        return validator(value);
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;

        setFormData(prev => ({ ...prev, [name]: processedValue }));

        const fieldError = validateField(name, processedValue);
        setValidationErrors(prev => ({ ...prev, [name]: fieldError }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > maxFiles) {
            setValidationErrors(prev => ({ ...prev, images: `Maximum ${maxFiles} images allowed` }));
            return;
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024;

        const validFiles = files.filter(file => {
            if (!validTypes.includes(file.type)) {
                setValidationErrors(prev => ({ ...prev, images: 'Only JPEG, PNG, and GIF images are allowed' }));
                return false;
            }
            if (file.size > maxSize) {
                setValidationErrors(prev => ({ ...prev, images: 'Image size must be less than 5MB' }));
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            setImages([]);
            setImagePreviews([]);
            return;
        }

        setImages(validFiles);
        setValidationErrors(prev => ({ ...prev, images: null }));
        setImagePreviews(validFiles.map(file => URL.createObjectURL(file)));
        setError('');
    };

    const removeImage = (index) => {
        URL.revokeObjectURL(imagePreviews[index]);
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImages(newImages);
        setImagePreviews(newPreviews);
        if (fileInputRef.current && newImages.length === 0) {
            fileInputRef.current.value = '';
        }
    };

    const validateForm = () => {
        const newErrors = {};

        Object.keys(formData).forEach(field => {
            if (field !== 'description' && field !== 'discount') {
                const fieldError = validateField(field, formData[field]);
                if (fieldError) newErrors[field] = fieldError;
            }
        });

        if (images.length === 0) {
            newErrors.images = 'At least one product image is required';
        }

        setValidationErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            setError('Please fix the validation errors above');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            const response = await fetch('/api/seller/products', {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Product added successfully!');
                imagePreviews.forEach(url => URL.revokeObjectURL(url));
                setTimeout(() => {
                    navigate('/seller/dashboard');
                }, 2000);
            } else {
                throw new Error(data.error || data.message || 'Failed to add product');
            }
        } catch (err) {
            console.error('Error adding product:', err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user || user.role !== 'seller') {
        navigate('/login');
        return null;
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <Header />
            <div className="container mx-auto px-4 py-8" style={{ paddingTop: '100px' }}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center mb-8">
                        <h1 className="text-4xl font-bold" style={{
                            background: 'linear-gradient(135deg, rgb(0, 180, 180), teal)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Add Product
                        </h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                            <div className="flex items-center">
                                <div className="shrink-0">
                                    <i className="fas fa-exclamation-triangle text-red-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
                            <div className="flex items-center">
                                <div className="shrink-0">
                                    <i className="fas fa-check-circle text-green-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-green-700 font-medium">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    maxLength="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter product name"
                                />
                                {validationErrors.name && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                                )}
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
                                    <option value="Pet Food">Pet Food</option>
                                    <option value="Toys">Toys</option>
                                    <option value="Accessories">Accessories</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Grooming">Grooming</option>
                                </select>
                                {validationErrors.category && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand *
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter brand name"
                                />
                                {validationErrors.brand && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.brand}</p>
                                )}
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
                                    step="0.01"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                                {validationErrors.price && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.price}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stock Quantity *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                                {validationErrors.stock && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.stock}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="4"
                                maxLength="500"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe your product features, benefits, specifications..."
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {formData.description.length}/500 characters
                            </p>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Images * (Max {maxFiles})
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Select up to {maxFiles} images (JPG, PNG, GIF, max 5MB each)
                            </p>
                            {validationErrors.images && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.images}</p>
                            )}
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Image Previews
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-md bg-gray-100"
                                            />
                                            <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-all duration-200 transform hover:scale-110 pointer-events-auto"
                                                    title="Remove image"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex gap-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {submitting ? 'Adding Product...' : 'Add Product'}
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

export default AddProduct;
