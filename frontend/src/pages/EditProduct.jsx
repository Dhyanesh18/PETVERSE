import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';

const EditProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
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
    
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const maxFiles = 5;
    const categories = ['Toys', 'Food', 'Accessories', 'Healthcare', 'Grooming', 'Training', 'Other'];

    // Validation functions
    const validators = {
        name: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Product name is required';
            }
            if (value.length < 2) {
                return 'Product name must be at least 2 characters';
            }
            if (value.length > 100) {
                return 'Product name must not exceed 100 characters';
            }
            return null;
        },
        brand: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Brand is required';
            }
            if (value.length < 2) {
                return 'Brand must be at least 2 characters';
            }
            if (value.length > 50) {
                return 'Brand must not exceed 50 characters';
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
            if (numValue > 10000000) {
                return 'Price cannot exceed ₹1,00,00,000';
            }
            return null;
        },
        category: (value) => {
            if (!value || value === '') {
                return 'Please select a category';
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
            if (numValue < 0) {
                return 'Stock cannot be negative';
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

    // Load existing product data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/seller/products/${id}/edit`, {
                    credentials: 'include'
                });
                
                const data = await response.json();
                console.log('Product data received:', data); // Debug log
                
                if (data.success && data.product) {
                    const product = data.product;
                    console.log('Product images array:', product.images);
                    console.log('Product images length:', product.images?.length);
                    setFormData({
                        name: product.name || '',
                        price: product.price || '',
                        category: product.category || '',
                        brand: product.brand || '',
                        description: product.description || '',
                        discount: product.discount || '',
                        stock: product.stock || ''
                    });
                    // Generate image URLs for binary data stored in database
                    const imageUrls = (product.images || []).map((img, index) => {
                        const url = `/api/images/product/${product._id}/${index}`;
                        console.log(`Generated URL ${index}:`, url);
                        console.log(`Image ${index} metadata:`, {
                            contentType: img.contentType,
                            hasData: !!img.data,
                            id: img._id
                        });
                        return url;
                    });
                    console.log('Generated image URLs:', imageUrls);
                    
                    // Test the first image URL
                    if (imageUrls.length > 0) {
                        console.log('Testing first image URL:', imageUrls[0]);
                        fetch(imageUrls[0])
                            .then(res => {
                                console.log('Image fetch test result:', {
                                    status: res.status,
                                    statusText: res.statusText,
                                    contentType: res.headers.get('content-type'),
                                    contentLength: res.headers.get('content-length')
                                });
                                return res.blob();
                            })
                            .then(blob => {
                                console.log('Image blob size:', blob.size, 'type:', blob.type);
                            })
                            .catch(err => {
                                console.error('Image fetch test failed:', err);
                            });
                    }
                    
                    setExistingImages(imageUrls);
                } else {
                    setError(data.error || data.message || 'Failed to load product');
                }
            } catch (err) {
                console.error('Error loading product:', err);
                setError('Error loading product: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

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

    const handleNewImageChange = (e) => {
        const files = Array.from(e.target.files);
        const totalImages = existingImages.length - imagesToDelete.length + files.length;
        
        if (totalImages > maxFiles) {
            setValidationErrors(prev => ({
                ...prev,
                images: `Maximum ${maxFiles} images allowed (including existing images)`
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
            setNewImages([]);
            setNewImagePreviews([]);
            return;
        }

        setNewImages(validFiles);
        setValidationErrors(prev => ({ ...prev, images: null }));
        
        // Create preview URLs
        const previews = validFiles.map(file => URL.createObjectURL(file));
        setNewImagePreviews(previews);
        setError('');
    };

    const removeExistingImage = (imagePath) => {
        setImagesToDelete(prev => [...prev, imagePath]);
        setExistingImages(prev => prev.filter(img => img !== imagePath));
    };

    const removeNewImage = (index) => {
        const newImagesList = newImages.filter((_, i) => i !== index);
        const newPreviewsList = newImagePreviews.filter((_, i) => i !== index);
        
        // Revoke the URL to prevent memory leaks
        URL.revokeObjectURL(newImagePreviews[index]);
        
        setNewImages(newImagesList);
        setNewImagePreviews(newPreviewsList);
        
        if (fileInputRef.current && newImagesList.length === 0) {
            fileInputRef.current.value = '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        Object.keys(formData).forEach(field => {
            if (field !== 'description' && field !== 'discount') { // description and discount are optional
                const error = validateField(field, formData[field]);
                if (error) newErrors[field] = error;
            }
        });

        const totalImages = existingImages.length + newImages.length;
        if (totalImages === 0) {
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
            
            // Add new images
            newImages.forEach(image => {
                formDataToSend.append('newImages', image);
            });

            // Add images to delete
            if (imagesToDelete.length > 0) {
                formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete));
            }

            const response = await fetch(`/api/seller/products/${id}`, {
                method: 'PUT',
                credentials: 'include',
                body: formDataToSend
            });

            const data = await response.json();
            
            if (data.success) {
                setSuccess('Product updated successfully!');
                
                // Clean up preview URLs
                newImagePreviews.forEach(url => URL.revokeObjectURL(url));
                
                setTimeout(() => {
                    window.history.back();
                }, 2000);
            } else {
                throw new Error(data.error || 'Failed to update product');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user || user.role !== 'seller') {
        navigate('/login');
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
                <Header />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center">
                        <i className="fas fa-spinner fa-spin text-4xl text-teal-500 mb-4"></i>
                        <p className="text-gray-600">Loading product...</p>
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
                            Edit Product
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
                                    <option value="Pet Food">Pet Food</option>
                                    <option value="Toys">Toys</option>
                                    <option value="Accessories">Accessories</option>
                                </select>
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
                                />
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
                                />
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
                                />
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

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Images
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {existingImages.map((imagePath, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={imagePath}
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-md bg-gray-100"
                                                style={{ 
                                                    minHeight: '128px',
                                                    display: 'block',
                                                    zIndex: 1
                                                }}
                                                onError={(e) => {
                                                    console.log(`Product image failed to load: ${e.target.src}`);
                                                    // Try to fetch the URL directly to see what's wrong
                                                    fetch(e.target.src)
                                                        .then(res => {
                                                            console.log('Direct fetch response:', {
                                                                status: res.status,
                                                                contentType: res.headers.get('content-type'),
                                                                ok: res.ok
                                                            });
                                                        })
                                                        .catch(err => console.log('Direct fetch error:', err));
                                                    e.target.src = '/images/default-product.jpg';
                                                }}
                                                onLoad={(e) => {
                                                    console.log(`Product image loaded successfully: ${e.target.src}`);
                                                    console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                                                    console.log('Image element computed style:', {
                                                        display: getComputedStyle(e.target).display,
                                                        visibility: getComputedStyle(e.target).visibility,
                                                        opacity: getComputedStyle(e.target).opacity,
                                                        zIndex: getComputedStyle(e.target).zIndex
                                                    });
                                                    // Force the image to be visible
                                                    e.target.style.border = '2px solid red';
                                                    e.target.style.backgroundColor = 'yellow';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(imagePath)}
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

                        {/* New Images */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add New Images (Max 5 total)
                            </label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleNewImageChange}
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
                                {submitting ? 'Updating...' : 'Update Product'}
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

export default EditProduct;