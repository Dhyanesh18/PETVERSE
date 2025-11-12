import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
        description: '',
        price: '',
        discount: 0,
        category: '',
        brand: '',
        stock: ''
    });
    
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const maxFiles = 5;
    const categories = ['Pet Food', 'Toys', 'Accessories', 'Health & Medicine', 'Grooming', 'Leashes & Collars'];

    // Validation functions
    const validators = {
        name: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Product name is required';
            }
            if (value.length < 3) {
                return 'Product name must be at least 3 characters';
            }
            if (value.length > 100) {
                return 'Product name must not exceed 100 characters';
            }
            if (!/^[a-zA-Z0-9\s\-&().,]+$/.test(value)) {
                return 'Product name contains invalid characters';
            }
            return null;
        },
        description: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Description is required';
            }
            if (value.length < 10) {
                return 'Description must be at least 10 characters';
            }
            if (value.length > 1000) {
                return 'Description must not exceed 1000 characters';
            }
            return null;
        },
        price: (value) => {
            if (!value || value === '') {
                return 'Price is required';
            }
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                return 'Price must be a valid number';
            }
            if (numValue < 1) {
                return 'Price must be at least ₹1';
            }
            if (numValue > 1000000) {
                return 'Price cannot exceed ₹10,00,000';
            }
            return null;
        },
        category: (value) => {
            if (!value || value === '') {
                return 'Please select a category';
            }
            return null;
        },
        brand: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Brand name is required';
            }
            if (value.length < 2) {
                return 'Brand name must be at least 2 characters';
            }
            if (value.length > 50) {
                return 'Brand name must not exceed 50 characters';
            }
            return null;
        },
        stock: (value) => {
            if (!value || value === '') {
                return 'Stock quantity is required';
            }
            const numValue = parseInt(value);
            if (isNaN(numValue)) {
                return 'Stock must be a valid number';
            }
            if (numValue < 1) {
                return 'Stock must be at least 1';
            }
            if (numValue > 10000) {
                return 'Stock cannot exceed 10,000';
            }
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
        
        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // Real-time validation
        const error = validateField(name, processedValue);
        setValidationErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length > maxFiles) {
            setValidationErrors(prev => ({
                ...prev,
                images: `Maximum ${maxFiles} images allowed`
            }));
            return;
        }

        // Validate file types and sizes
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        const validFiles = files.filter(file => {
            if (!validTypes.includes(file.type)) {
                setValidationErrors(prev => ({
                    ...prev,
                    images: 'Only JPEG, PNG, and GIF images are allowed'
                }));
                return false;
            }
            if (file.size > maxSize) {
                setValidationErrors(prev => ({
                    ...prev,
                    images: 'Image size must be less than 5MB'
                }));
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
        
        // Create preview URLs
        const previews = validFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
        setError('');
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        
        // Revoke the URL to prevent memory leaks
        URL.revokeObjectURL(imagePreviews[index]);
        
        setImages(newImages);
        setImagePreviews(newPreviews);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        Object.keys(formData).forEach(field => {
            if (field !== 'discount') { // discount is optional
                const error = validateField(field, formData[field]);
                if (error) newErrors[field] = error;
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
        
        if (!validateForm()) {
            return;
        }
        
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const formDataToSend = new FormData();
            
            // Add form fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            
            // Add images
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
                setSuccess('Product created successfully!');
                
                // Clean up preview URLs
                imagePreviews.forEach(url => URL.revokeObjectURL(url));
                
                setTimeout(() => {
                    window.history.back();
                }, 2000);
            } else {
                setError(data.message || 'Failed to create product');
            }
        } catch (err) {
            setError('Error creating product: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            discount: 0,
            category: '',
            brand: '',
            stock: ''
        });
        
        // Clean up preview URLs
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImages([]);
        setImagePreviews([]);
        setError('');
        setSuccess('');
    };

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
                            Add New Product
                        </h1>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
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
                                <div className="flex-shrink-0">
                                    <i className="fas fa-check-circle text-green-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-green-700 font-medium">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-8" style={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        maxLength="100"
                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                                            validationErrors.name 
                                                ? 'border-red-400 bg-red-50 focus:border-red-500' 
                                                : formData.name 
                                                    ? 'border-green-400 bg-green-50 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-teal-500'
                                        }`}
                                        placeholder="Enter product name"
                                        style={{ fontSize: '16px' }}
                                    />
                                    {formData.name && !validationErrors.name && (
                                        <i className="fas fa-check-circle absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"></i>
                                    )}
                                    {validationErrors.name && (
                                        <i className="fas fa-exclamation-circle absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"></i>
                                    )}
                                </div>
                                {validationErrors.name && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="fas fa-exclamation-triangle text-xs"></i>
                                        {validationErrors.name}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{formData.name.length}/100 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 cursor-pointer ${
                                            validationErrors.category 
                                                ? 'border-red-400 bg-red-50 focus:border-red-500' 
                                                : formData.category 
                                                    ? 'border-green-400 bg-green-50 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-teal-500'
                                        }`}
                                        style={{ fontSize: '16px' }}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {formData.category && !validationErrors.category && (
                                        <i className="fas fa-check-circle absolute right-8 top-1/2 transform -translate-y-1/2 text-green-500"></i>
                                    )}
                                </div>
                                {validationErrors.category && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="fas fa-exclamation-triangle text-xs"></i>
                                        {validationErrors.category}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Brand <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleInputChange}
                                        required
                                        maxLength="50"
                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                                            validationErrors.brand 
                                                ? 'border-red-400 bg-red-50 focus:border-red-500' 
                                                : formData.brand 
                                                    ? 'border-green-400 bg-green-50 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-teal-500'
                                        }`}
                                        placeholder="Enter brand name"
                                        style={{ fontSize: '16px' }}
                                    />
                                    {formData.brand && !validationErrors.brand && (
                                        <i className="fas fa-check-circle absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"></i>
                                    )}
                                </div>
                                {validationErrors.brand && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="fas fa-exclamation-triangle text-xs"></i>
                                        {validationErrors.brand}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Price (₹) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="1000000"
                                        step="0.01"
                                        required
                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                                            validationErrors.price 
                                                ? 'border-red-400 bg-red-50 focus:border-red-500' 
                                                : formData.price 
                                                    ? 'border-green-400 bg-green-50 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-teal-500'
                                        }`}
                                        placeholder="Enter price (e.g., 299.99)"
                                        style={{ fontSize: '16px' }}
                                    />
                                    {formData.price && !validationErrors.price && (
                                        <i className="fas fa-check-circle absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"></i>
                                    )}
                                </div>
                                {validationErrors.price && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="fas fa-exclamation-triangle text-xs"></i>
                                        {validationErrors.price}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Discount (%) <span className="text-gray-400 text-xs">Optional</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="discount"
                                        value={formData.discount}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="90"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 transition-all duration-200"
                                        placeholder="Enter discount (0-90%)"
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Leave as 0 for no discount</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Stock Quantity <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="10000"
                                        required
                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                                            validationErrors.stock 
                                                ? 'border-red-400 bg-red-50 focus:border-red-500' 
                                                : formData.stock 
                                                    ? 'border-green-400 bg-green-50 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-teal-500'
                                        }`}
                                        placeholder="Enter stock quantity"
                                        style={{ fontSize: '16px' }}
                                    />
                                    {formData.stock && !validationErrors.stock && (
                                        <i className="fas fa-check-circle absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"></i>
                                    )}
                                </div>
                                {validationErrors.stock && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="fas fa-exclamation-triangle text-xs"></i>
                                        {validationErrors.stock}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product Description <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="5"
                                    maxLength="1000"
                                    required
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 resize-vertical ${
                                        validationErrors.description 
                                            ? 'border-red-400 bg-red-50 focus:border-red-500' 
                                            : formData.description 
                                                ? 'border-green-400 bg-green-50 focus:border-green-500'
                                                : 'border-gray-300 focus:border-teal-500'
                                    }`}
                                    placeholder="Describe your product features, benefits, specifications, usage instructions..."
                                    style={{ fontSize: '16px', minHeight: '120px' }}
                                />
                                {formData.description && !validationErrors.description && (
                                    <i className="fas fa-check-circle absolute right-3 top-3 text-green-500"></i>
                                )}
                            </div>
                            {validationErrors.description && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <i className="fas fa-exclamation-triangle text-xs"></i>
                                    {validationErrors.description}
                                </p>
                            )}
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-gray-500">
                                    Minimum 10 characters required
                                </p>
                                <p className={`text-xs ${
                                    formData.description.length > 800 ? 'text-red-500' : 
                                    formData.description.length > 600 ? 'text-yellow-500' : 'text-gray-500'
                                }`}>
                                    {formData.description.length}/1000 characters
                                </p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product Images <span className="text-red-500">*</span>
                                <span className="text-xs text-gray-500 ml-2">(Max {maxFiles} images, up to 5MB each)</span>
                            </label>
                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    required
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                                    validationErrors.images 
                                        ? 'border-red-400 bg-red-50' 
                                        : images.length > 0 
                                            ? 'border-green-400 bg-green-50'
                                            : 'border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50'
                                }`}>
                                    <div className="flex flex-col items-center">
                                        <i className={`fas fa-cloud-upload-alt text-4xl mb-3 ${
                                            validationErrors.images 
                                                ? 'text-red-400' 
                                                : images.length > 0 
                                                    ? 'text-green-500'
                                                    : 'text-gray-400'
                                        }`}></i>
                                        <p className="text-lg font-medium text-gray-700 mb-1">
                                            {images.length > 0 ? `${images.length} image(s) selected` : 'Click to upload images'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Or drag and drop your images here
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            JPEG, PNG, GIF up to 5MB each
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {validationErrors.images && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <i className="fas fa-exclamation-triangle text-xs"></i>
                                    {validationErrors.images}
                                </p>
                            )}
                        </div>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="mt-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    <i className="fas fa-images mr-2"></i>
                                    Image Previews ({imagePreviews.length}/{maxFiles})
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border-2 border-white shadow-md group-hover:shadow-lg transition-all duration-200"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-all duration-200 transform hover:scale-110"
                                                    title="Remove image"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                                {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-10 pt-6 border-t-2 border-gray-100">
                            <div className="flex flex-col sm:flex-row gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 font-medium"
                                >
                                    <i className="fas fa-times mr-2"></i>
                                    Cancel
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 font-medium"
                                >
                                    <i className="fas fa-redo mr-2"></i>
                                    Reset Form
                                </button>
                                
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 text-white rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                    style={{
                                        background: submitting 
                                            ? '#94a3b8' 
                                            : 'linear-gradient(135deg, rgb(0, 180, 180), teal)',
                                        boxShadow: submitting 
                                            ? 'none' 
                                            : '0 4px 15px rgba(0, 180, 180, 0.3)'
                                    }}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Creating Product...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-plus"></i>
                                            Create Product
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;