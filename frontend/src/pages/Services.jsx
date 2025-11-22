import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../services/api';
import { FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFilter, FaTimes, FaPaw, FaUser, FaComment } from 'react-icons/fa';

const Services = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    console.log('Services component mounted');

    // Filter states
    const [filters, setFilters] = useState({
        categories: [],
        minPrice: '',
        maxPrice: '',
        minRating: ''
    });
    const [showFilters, setShowFilters] = useState(true);

    const serviceCategories = [
        { value: 'veterinarian', label: 'Veterinary Doctor' },
        { value: 'groomer', label: 'Pet Grooming' },
        { value: 'trainer', label: 'Dog Training' },
        { value: 'pet sitter', label: 'Pet Sitting' },
        { value: 'breeder', label: 'Breeding Services' },
        { value: 'walking', label: 'Dog Walking' },
        { value: 'sitting', label: 'Pet Sitting' }
    ];

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, services]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching services from API...');
            const response = await getServices();
            console.log('Services API response:', response);
            console.log('Response data structure:', response.data);
            
            // Handle different response structures
            let servicesData = [];
            if (response.data.success && response.data.data && Array.isArray(response.data.data.services)) {
                servicesData = response.data.data.services;
                console.log('Found services in response.data.data.services:', servicesData.length);
            } else if (response.data.data && Array.isArray(response.data.data)) {
                servicesData = response.data.data;
                console.log('Found services in response.data.data:', servicesData.length);
            } else if (Array.isArray(response.data.services)) {
                servicesData = response.data.services;
                console.log('Found services in response.data.services:', servicesData.length);
            } else if (Array.isArray(response.data)) {
                servicesData = response.data;
                console.log('Found services in response.data:', servicesData.length);
            } else {
                console.warn('Unexpected response structure:', response.data);
                servicesData = [];
            }
            
            console.log('Final parsed services data:', servicesData);
            console.log('Total services found:', servicesData.length);
            if (servicesData.length > 0) {
                console.log('First service sample:', servicesData[0]);
            }
            
            setServices(servicesData);
            setFilteredServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);
            setError(error.response?.data?.message || error.response?.data?.error || 'Failed to load services. Please try again later.');
            setServices([]);
            setFilteredServices([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...services];

        // Filter by categories
        if (filters.categories.length > 0) {
            filtered = filtered.filter(service => 
                filters.categories.includes(service.serviceType?.toLowerCase())
            );
        }

        // Filter by price range
        if (filters.minPrice) {
            filtered = filtered.filter(service => service.price >= parseFloat(filters.minPrice));
        }
        if (filters.maxPrice) {
            filtered = filtered.filter(service => service.price <= parseFloat(filters.maxPrice));
        }

        // Filter by rating
        if (filters.minRating) {
            filtered = filtered.filter(service => service.rating >= parseFloat(filters.minRating));
        }

        setFilteredServices(filtered);
    };

    const handleCategoryChange = (category) => {
        setFilters(prev => {
            const categories = prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category];
            return { ...prev, categories };
        });
    };

    const clearFilters = () => {
        setFilters({
            categories: [],
            minPrice: '',
            maxPrice: '',
            minRating: ''
        });
    };

    const getServiceImage = (serviceType) => {
        const imageMap = {
            'veterinarian': '/images/services/service1.jpg',
            'groomer': '/images/services/service7.jpg',
            'pet sitter': '/images/services/service11.jpg',
            'trainer': '/images/services/service6.jpg',
            'breeder': '/images/services/service12.jpg',
            'walking': '/images/services/service2.jpg',
            'sitting': '/images/services/service11.jpg'
        };
        return imageMap[serviceType?.toLowerCase()] || '/images/services/service2.jpg';
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <FaStar
                key={index}
                className={index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}
            />
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="text-center">
                    <FaPaw className="text-6xl text-indigo-500 animate-bounce mx-auto mb-4" />
                    <p className="text-xl text-gray-700 font-semibold">Loading Services...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Services</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchServices}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Pet Care Services</h1>
                    <p className="text-gray-600">Find professional pet care services near you</p>
                </div>

                <div className="flex gap-8">
                    {/* Filters Sidebar */}
                    <aside className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <FaFilter className="text-indigo-600" />
                                    Filters
                                </h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="lg:hidden text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-700 mb-3">Category</h3>
                                <div className="space-y-2">
                                    {serviceCategories.map(category => (
                                        <label key={category.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filters.categories.includes(category.value)}
                                                onChange={() => handleCategoryChange(category.value)}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-700">{category.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range Filter */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-700 mb-3">Price Range</h3>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minPrice}
                                        onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Rating Filter */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-700 mb-3">Minimum Rating</h3>
                                <div className="space-y-2">
                                    {[4, 3, 2].map(rating => (
                                        <label key={rating} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="rating"
                                                checked={filters.minRating === rating.toString()}
                                                onChange={() => setFilters(prev => ({ ...prev, minRating: rating.toString() }))}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-700 flex items-center gap-1">
                                                {rating}
                                                <FaStar className="text-yellow-400 text-sm" />
                                                & above
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={clearFilters}
                                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </aside>

                    {/* Services Grid */}
                    <main className="flex-1">
                        {/* Toggle Filter Button (Mobile) */}
                        {!showFilters && (
                            <button
                                onClick={() => setShowFilters(true)}
                                className="mb-4 lg:hidden bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <FaFilter />
                                Show Filters
                            </button>
                        )}

                        {/* Results Info */}
                        <div className="mb-6 flex justify-between items-center">
                            <p className="text-gray-600">
                                Showing <span className="font-semibold">{filteredServices.length}</span> services
                            </p>
                        </div>

                        {/* Services Grid */}
                        {filteredServices.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                                <FaPaw className="text-6xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                                    {services.length === 0 ? 'No Service Providers Available Yet' : 'No Services Found'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {services.length === 0 
                                        ? 'Service providers will appear here once they register. Check back soon!' 
                                        : 'Try adjusting your filters to see more results'}
                                </p>
                                {services.length > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredServices.map(service => (
                                    <div
                                        key={service._id || service.id}
                                        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                                        onClick={() => navigate(`/services/${service._id || service.id}`)}
                                    >
                                        {/* Service Image */}
                                        <div className="h-48 overflow-hidden bg-gray-200">
                                            <img
                                                src={getServiceImage(service.serviceType)}
                                                alt={service.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = '/images/services/service2.jpg';
                                                }}
                                            />
                                        </div>

                                        {/* Service Info */}
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-xl font-bold text-gray-800">
                                                    {service.name || service.fullName}
                                                </h3>
                                                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                    ₹{service.price}
                                                </span>
                                            </div>

                                            <p className="text-sm text-indigo-600 font-medium mb-3">
                                                {service.category || service.serviceType}
                                            </p>

                                            {/* Rating */}
                                            {service.rating > 0 && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex items-center gap-1">
                                                        {renderStars(service.rating)}
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {service.rating.toFixed(1)} ({service.reviewCount || 0} reviews)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Location */}
                                            {service.serviceAddress && (
                                                <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                                                    <FaMapMarkerAlt className="text-gray-400" />
                                                    {service.serviceAddress}
                                                </p>
                                            )}

                                            {/* Contact Info */}
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                                {service.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <FaPhone className="text-xs" />
                                                        {service.phone}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Recent Reviews Preview */}
                                            {service.topReviews && service.topReviews.length > 0 && (
                                                <div className="border-t pt-3 mt-3">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                                        <FaComment className="text-indigo-500" />
                                                        Recent Review
                                                    </p>
                                                    <div className="text-xs text-gray-600">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <FaUser className="text-gray-400 text-xs" />
                                                            <span className="font-medium">{service.topReviews[0].userName}</span>
                                                        </div>
                                                        <p className="line-clamp-2">
                                                            {service.topReviews[0].comment || 'Great service!'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/services/${service._id || service.id}`);
                                                }}
                                                className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                            >
                                                View Details & Book
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Services;
