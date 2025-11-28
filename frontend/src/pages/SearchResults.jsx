import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAll } from '../services/api';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState({ pets: [], products: [], services: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const query = searchParams.get('q');

    useEffect(() => {
        const performSearch = async () => {
            if (!query) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await searchAll(query);
                setResults(response.data || { pets: [], products: [], services: [] });
            } catch (err) {
                console.error('Search failed:', err);
                setError('Failed to perform search. Please try again.');
                setResults({ pets: [], products: [], services: [] });
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [query]);

    const totalResults = (results.pets?.length || 0) + (results.products?.length || 0) + (results.services?.length || 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Searching...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Results</h1>
                    {query && (
                        <p className="text-lg text-gray-600">
                            {totalResults > 0 
                                ? `Found ${totalResults} results for "${query}"` 
                                : `No results found for "${query}"`
                            }
                        </p>
                    )}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {!query ? (
                    <div className="text-center py-20">
                        <div className="text-xl text-gray-600">Please enter a search term</div>
                    </div>
                ) : totalResults === 0 && !loading ? (
                    <div className="text-center py-20">
                        <div className="text-6xl text-gray-300 mb-4">🔍</div>
                        <div className="text-xl text-gray-600 mb-2">No results found</div>
                        <div className="text-gray-500">Try different keywords or browse our categories</div>
                        <div className="mt-6 space-x-4">
                            <Link to="/pets" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                                Browse Pets
                            </Link>
                            <Link to="/products" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                                Browse Products
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Pets Results */}
                        {results.pets && results.pets.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    🐾 Pets ({results.pets.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.pets.map((pet) => (
                                        <Link
                                            key={pet._id}
                                            to={`/seller/detail/${pet._id}`}
                                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                                        >
                                            <div className="aspect-w-16 aspect-h-9 mb-4">
                                                <img
                                                    src={pet.images && pet.images.length > 0 
                                                        ? `/api/images/pet/${pet._id}/0` 
                                                        : '/images/default-pet.jpg'
                                                    }
                                                    alt={pet.name}
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-800 mb-1">{pet.name}</h3>
                                            <p className="text-gray-600 mb-2">{pet.breed}</p>
                                            <p className="text-teal-600 font-bold text-xl">₹{pet.price?.toLocaleString('en-IN')}</p>
                                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                <span>{pet.age} old</span>
                                                <span>•</span>
                                                <span>{pet.gender}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Products Results */}
                        {results.products && results.products.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    🛒 Products ({results.products.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.products.map((product) => (
                                        <Link
                                            key={product._id}
                                            to={`/product/${product._id}`}
                                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                                        >
                                            <div className="aspect-w-16 aspect-h-9 mb-4">
                                                <img
                                                    src={product.images && product.images.length > 0 
                                                        ? `/api/images/product/${product._id}/0` 
                                                        : '/images/default-product.jpg'
                                                    }
                                                    alt={product.name}
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-800 mb-1">{product.name}</h3>
                                            <p className="text-gray-600 mb-2">{product.brand}</p>
                                            <div className="flex items-center gap-2">
                                                {product.discount > 0 ? (
                                                    <>
                                                        <span className="text-teal-600 font-bold text-xl">
                                                            ₹{(product.price * (1 - product.discount / 100)).toFixed(0)}
                                                        </span>
                                                        <span className="text-gray-500 line-through text-sm">
                                                            ₹{product.price}
                                                        </span>
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                            {product.discount}% OFF
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-teal-600 font-bold text-xl">
                                                        ₹{product.price?.toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Services Results */}
                        {results.services && results.services.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    👨‍⚕️ Services ({results.services.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.services.map((service) => (
                                        <Link
                                            key={service._id}
                                            to={`/services/${service._id}`}
                                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                                        >
                                            <div className="mb-4">
                                                <h3 className="font-semibold text-lg text-gray-800 mb-1">{service.serviceType}</h3>
                                                <p className="text-gray-600 mb-2">{service.description}</p>
                                                <p className="text-teal-600 font-bold text-xl">₹{service.price?.toLocaleString('en-IN')}</p>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                    <span>📍 {service.location}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;