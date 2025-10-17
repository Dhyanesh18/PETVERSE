import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchAll } from '../services/api';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState({ pets: [], products: [], services: [] });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToCart } = useCart();

    useEffect(() => {
        if (query) {
            fetchResults();
        }
    }, [query]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const response = await searchAll(query);
            setResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            await addToCart(productId, 1);
            alert('Added to cart!');
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    const getServiceImage = (serviceType) => {
        const images = {
            veterinarian: '/images/services/service1.jpg',
            groomer: '/images/services/service7.jpg',
            'pet sitter': '/images/services/service11.jpg',
            trainer: '/images/services/service6.jpg',
            breeder: '/images/services/service12.jpg',
        };
        return images[serviceType.toLowerCase()] || '/images/services/service2.jpg';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center h-96">
                    <div className="text-2xl text-gray-600">Loading...</div>
                </div>
            </div>
        );
    }

    const hasResults = results.pets.length > 0 || results.products.length > 0 || results.services.length > 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">
                    Search Results for &quot;{query}&quot;
                </h1>

                {!hasResults && (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-600">No results found.</p>
                    </div>
                )}

                {/* PETS SECTION */}
                {results.pets.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Pets</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {results.pets.map((pet) => (
                                <div
                                    key={pet._id}
                                    onClick={() => navigate(`/seller/detail/${pet._id}`)}
                                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                                >
                                    <div className="h-64 overflow-hidden">
                                        {pet.images && pet.images.length > 0 ? (
                                            <img
                                                src={`data:${pet.images[0].contentType};base64,${pet.images[0].data}`}
                                                alt={pet.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{pet.breed}</h3>
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pet.description}</p>
                                        <div className="text-2xl font-bold text-indigo-600 mb-3">
                                            ₹{pet.price.toFixed(2)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                            <span className="flex items-center gap-1">
                                                🎂 {pet.age}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                {pet.gender === 'male' ? '♂️ Male' : '♀️ Female'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
                                                View Details
                                            </button>
                                            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                                ❤️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PRODUCTS SECTION */}
                {results.products.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Products</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {results.products.map((product) => (
                                <div
                                    key={product._id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                                >
                                    <div
                                        onClick={() => navigate(`/buy/${product._id}`)}
                                        className="cursor-pointer"
                                    >
                                        <div className="h-64 overflow-hidden">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={`data:${product.images[0].contentType};base64,${product.images[0].data}`}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-400">No image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h3>
                                            <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span
                                                            key={star}
                                                            className={star <= (product.avgRating || 0) ? 'text-yellow-400' : 'text-gray-300'}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-sm text-gray-600">({product.reviewCount || 0})</span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                                            <div className="mb-3">
                                                {product.discount > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
                                                        <span className="text-2xl font-bold text-indigo-600">
                                                            ₹{(product.price * (1 - product.discount / 100)).toFixed(2)}
                                                        </span>
                                                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                            {product.discount}% OFF
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-2xl font-bold text-indigo-600">
                                                        ₹{product.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm mb-3">
                                                {product.stock === 0 ? (
                                                    <span className="text-red-600 font-semibold">Out of Stock</span>
                                                ) : product.stock <= 5 ? (
                                                    <span className="text-orange-600 font-semibold">Only {product.stock} left!</span>
                                                ) : (
                                                    <span className="text-green-600 font-semibold">In Stock</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 pt-0 flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(product._id)}
                                            disabled={product.stock === 0}
                                            className={`flex-1 py-2 rounded-lg transition ${
                                                product.stock === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                        >
                                            Add to Cart
                                        </button>
                                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                            ❤️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SERVICES SECTION */}
                {results.services.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Services</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.services.map((service) => (
                                <div
                                    key={service._id}
                                    onClick={() => navigate(`/services/${service._id}`)}
                                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                                >
                                    <div className="h-48 overflow-hidden">
                                        <img
                                            src={getServiceImage(service.serviceType)}
                                            alt={service.fullName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = '/images/services/service2.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{service.fullName}</h3>
                                        <p className="text-indigo-600 font-semibold mb-3">{service.serviceType}</p>
                                        <p className="text-gray-600 mb-2 flex items-center gap-2">
                                            📍 {service.serviceAddress}
                                        </p>
                                        <p className="text-gray-600 mb-2 flex items-center gap-2">
                                            📞 {service.phone}
                                        </p>
                                        <p className="text-gray-600 mb-4 flex items-center gap-2">
                                            ✉️ {service.email}
                                        </p>
                                        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
