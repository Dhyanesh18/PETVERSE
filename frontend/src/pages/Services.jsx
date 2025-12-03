import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFilter, FaTimes, FaPaw, FaUser, FaComment } from 'react-icons/fa';
import { useServiceEvent } from '../hooks/useServiceEvent';

const Services = () => {
    const navigate = useNavigate();
    const {
        filteredServices,
        servicesLoading: loading,
        servicesError: error,
        serviceFilters: filters,
        loadServices,
        updateServiceFilters,
        resetServiceFilters
    } = useServiceEvent();
    
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
        loadServices();
    }, []);

    const handleCategoryChange = (category) => {
        const categories = filters.categories.includes(category)
            ? filters.categories.filter(c => c !== category)
            : [...filters.categories, category];
        updateServiceFilters({ categories });
    };

    const clearFilters = () => {
        resetServiceFilters();
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
                    <FaPaw className="text-6xl text-teal-500 animate-bounce mx-auto mb-4" />
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
                        onClick={() => loadServices()}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen" style={{ paddingTop: '75px' }}>
            {/* Hero Section */}
            <section 
                className="text-white py-20 px-5 text-center relative overflow-hidden bg-cover bg-center"
                style={{
                    background: `linear-gradient(135deg, rgba(102, 201, 234, 0.5) 0%, rgba(75, 162, 162, 0.3) 100%), url('/images/service-hero.jpg') no-repeat center center`,
                    backgroundSize: 'cover'
                }}
            >
                <div className="max-w-7xl mx-auto px-4 text-center" style={{paddingTop:'15px'}}>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Pet Care Services</h1>
                    <p className="text-xl text-teal-50">Find professional pet care services near you</p>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters Sidebar */}
                    <aside className={`lg:w-64 shrink-0 ${showFilters ? '' : 'hidden lg:block'}`}>
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <FaFilter className="text-teal-600" />
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
                                        <label key={category.value} className="flex items-center gap-2 cursor-pointer hover:bg-teal-50 p-2 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filters.categories.includes(category.value)}
                                                onChange={() => handleCategoryChange(category.value)}
                                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
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
                                        onChange={(e) => updateServiceFilters({ minPrice: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) => updateServiceFilters({ maxPrice: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Rating Filter */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-700 mb-3">Minimum Rating</h3>
                                <div className="space-y-2">
                                    {[4, 3, 2].map(rating => (
                                        <label key={rating} className="flex items-center gap-2 cursor-pointer hover:bg-teal-50 p-2 rounded transition-colors">
                                            <input
                                                type="radio"
                                                name="rating"
                                                checked={filters.minRating === rating.toString()}
                                                onChange={() => updateServiceFilters({ minRating: rating.toString() })}
                                                className="w-4 h-4 text-teal-600 focus:ring-teal-500"
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
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-md hover:shadow-md transition-all font-semibold"
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
                                className="mb-4 lg:hidden bg-teal-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-teal-700 transition-colors"
                            >
                                <FaFilter />
                                Show Filters
                            </button>
                        )}

                        {/* Results Header */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Available Services <span className="text-teal-600">({filteredServices.length})</span>
                                </h2>
                            </div>
                        </div>

                        {/* Services Grid */}
                        {filteredServices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-md">
                                <FaPaw className="text-6xl text-gray-400 mb-4" />
                                <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                                    {filteredServices.length === 0 && filters.categories.length === 0 && !filters.minPrice && !filters.maxPrice ? 'No Service Providers Available Yet' : 'No Services Found'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {filteredServices.length === 0 && filters.categories.length === 0 && !filters.minPrice && !filters.maxPrice
                                        ? 'Service providers will appear here once they register. Check back soon!' 
                                        : 'Try adjusting your filters to see more results'}
                                </p>
                                {(filters.categories.length > 0 || filters.minPrice || filters.maxPrice || filters.minRating) && (
                                    <button
                                        onClick={clearFilters}
                                        className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors font-semibold"
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
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                                        onClick={() => navigate(`/services/${service._id || service.id}`)}
                                    >
                                        {/* Service Image */}
                                        <div className="h-48 overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100">
                                            <img
                                                src={getServiceImage(service.serviceType)}
                                                alt={service.name}
                                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
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
                                                <span className="inline-block px-3 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full">
                                                    ₹{service.price}
                                                </span>
                                            </div>

                                            <p className="text-sm text-teal-600 font-medium mb-3">
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
                                                    <FaMapMarkerAlt className="text-teal-500" />
                                                    {service.serviceAddress}
                                                </p>
                                            )}

                                            {/* Contact Info */}
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                                {service.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <FaPhone className="text-xs text-teal-500" />
                                                        {service.phone}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Recent Reviews Preview */}
                                            {service.topReviews && service.topReviews.length > 0 && (
                                                <div className="border-t border-teal-100 pt-3 mt-3">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                                        <FaComment className="text-teal-500" />
                                                        Recent Review
                                                    </p>
                                                    <div className="text-xs text-gray-600">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <FaUser className="text-teal-400 text-xs" />
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
                                                className="w-full mt-4 bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-colors font-semibold hover:shadow-md"
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
