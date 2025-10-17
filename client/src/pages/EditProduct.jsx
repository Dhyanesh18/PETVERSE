import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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
    
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [imagesToKeep, setImagesToKeep] = useState([]);

    useEffect(() => {
        fetchProductData();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchProductData = async () => {
        try {
            const response = await fetch(`/api/products/${id}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch product data');
            }
            
            const data = await response.json();
            if (data.status === 'success' && data.data.product) {
                const product = data.data.product;
                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    price: product.price || '',
                    discount: product.discount || 0,
                    category: product.category || '',
                    brand: product.brand || '',
                    stock: product.stock || ''
                });
                
                setExistingImages(product.images || []);
                setImagesToKeep(new Array(product.images?.length || 0).fill(true));
            }
        } catch (err) {
            setError('Failed to load product data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
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

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Product name is required');
            return false;
        }
        if (!formData.description.trim()) {
            setError('Product description is required');
            return false;
        }
        if (!formData.price || formData.price <= 0) {
            setError('Valid price is required');
            return false;
        }
        if (!formData.category) {
            setError('Category is required');
            return false;
        }
        if (!formData.brand.trim()) {
            setError('Brand is required');
            return false;
        }
        if (!formData.stock || formData.stock < 0) {
            setError('Valid stock quantity is required');
            return false;
        }
        if (formData.discount < 0 || formData.discount > 100) {
            setError('Discount must be between 0 and 100');
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
            
            // Add image keep flags
            imagesToKeep.forEach((keep) => {
                formDataToSend.append('keepImages', keep.toString());
            });
            
            // Add new images
            newImages.forEach(image => {
                formDataToSend.append('images', image);
            });

            const response = await fetch(`/api/products/${id}/edit`, {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend
            });

            const data = await response.json();
            
            if (data.success) {
                setSuccess('Product updated successfully!');
                setTimeout(() => {
                    navigate('/seller-dashboard');
                }, 2000);
            } else {
                setError(data.message || 'Failed to update product');
            }
        } catch (err) {
            setError('Error updating product: ' + err.message);
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
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">Edit Product</h1>
                    
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
                                    Current Images (uncheck to remove)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {existingImages.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={`data:${image.contentType};base64,${image.data}`}
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-md"
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
                                {submitting ? 'Updating...' : 'Update Product'}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => navigate('/seller-dashboard')}
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