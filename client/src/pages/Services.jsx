import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { getServices } from '../services/api';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'all',
        search: ''
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await getServices();
            setServices(response.data.services || []);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(service => {
        const matchesCategory = filters.category === 'all' || service.category === filters.category;
        const matchesSearch = service.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                            service.description?.toLowerCase().includes(filters.search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories = ['all', 'grooming', 'veterinary', 'training', 'boarding', 'walking'];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-12 mb-8 text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Pet Services</h1>
                    <p className="text-xl text-green-100">Professional care for your beloved pets</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search services..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilters({ ...filters, category: cat })}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                                        filters.category === cat
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Loading services...</div>
                    </div>
                ) : filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredServices.map((service) => (
                            <Link
                                key={service._id}
                                to={`/services/${service._id}`}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
                            >
                                <div className="relative h-48 bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                                    <i className={`fas ${
                                        service.category === 'grooming' ? 'fa-cut' :
                                        service.category === 'veterinary' ? 'fa-stethoscope' :
                                        service.category === 'training' ? 'fa-graduation-cap' :
                                        service.category === 'boarding' ? 'fa-home' :
                                        service.category === 'walking' ? 'fa-walking' :
                                        'fa-paw'
                                    } text-6xl text-white opacity-80 group-hover:scale-110 transition`}></i>
                                    <span className="absolute top-4 right-4 bg-white text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                                        {service.category}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-green-600">₹{service.price}</p>
                                            <p className="text-xs text-gray-500">{service.duration || 'per session'}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <i className="fas fa-star text-yellow-400"></i>
                                            <span className="font-medium">{service.rating || '5.0'}</span>
                                            <span className="text-gray-500 text-sm">({service.reviews || 0})</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-600">
                                            <i className="fas fa-user text-gray-400 mr-2"></i>
                                            {service.provider?.name || 'Professional Provider'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-lg">
                        <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                        <p className="text-gray-500 text-lg mb-4">No services found</p>
                        <button
                            onClick={() => setFilters({ category: 'all', search: '' })}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Services;