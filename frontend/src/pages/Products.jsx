import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getProducts } from '../services/api';
import { useCart } from '../context/CartContext';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: [],
        brand: [],
        minPrice: '',
        maxPrice: '',
        rating: ''
    });
    const navigate = useNavigate();
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await getProducts();
            setProducts(response.data.products || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'category' || filterType === 'brand') {
            setFilters(prev => ({
                ...prev,
                [filterType]: prev[filterType].includes(value)
                    ? prev[filterType].filter(v => v !== value)
                    : [...prev[filterType], value]
            }));
        } else {
            setFilters(prev => ({ ...prev, [filterType]: value }));
        }
    };

    const handleAddToCart = async (productId, e) => {
        e.stopPropagation();
        try {
            await addToCart(productId, 1);
            alert('Added to cart!');
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    const filteredProducts = products.filter(product => {
        if (filters.category.length > 0 && !filters.category.includes(product.category)) return false;
        if (filters.brand.length > 0 && !filters.brand.includes(product.brand)) return false;
        if (filters.minPrice && product.price < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) return false;
        if (filters.rating && (product.avgRating || 0) < parseFloat(filters.rating)) return false;
        return true;
    });

    const uniqueBrands = [...new Set(products.map(p => p.brand))];
    const categories = ['Pet Food', 'Toys', 'Accessories', 'Healthcare', 'Grooming'];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Pet Products</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow-md h-fit">
                        <h2 className="text-xl font-bold mb-4">Filters</h2>
                        
                        {/* Category Filter */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">Category</h3>
                            <div className="space-y-2">
                                {categories.map(category => (
                                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.category.includes(category)}
                                            onChange={() => handleFilterChange('category', category)}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700">{category}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">Price Range</h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    placeholder="Min"
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                                <input
                                    type="number"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    placeholder="Max"
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Brand Filter */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">Brand</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {uniqueBrands.map(brand => (
                                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.brand.includes(brand)}
                                            onChange={() => handleFilterChange('brand', brand)}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700">{brand}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">Rating</h3>
                            <div className="space-y-2">
                                {[4, 3, 2].map(rating => (
                                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="rating"
                                            checked={filters.rating === rating.toString()}
                                            onChange={() => handleFilterChange('rating', rating.toString())}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700">{rating}★ & above</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setFilters({ category: [], brand: [], minPrice: '', maxPrice: '', rating: '' })}
                            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                        >
                            Clear All Filters
                        </button>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="text-2xl text-gray-600">Loading...</div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-xl text-gray-600">No products found.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 text-gray-600">
                                    Showing {filteredProducts.length} of {products.length} products
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.map((product) => (
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
                                                    
                                                    {/* Rating */}
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
                                                    
                                                    {/* Price */}
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

                                                    {/* Stock */}
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
                                            
                                            {/* Action Buttons */}
                                            <div className="p-4 pt-0 flex gap-2">
                                                <button
                                                    onClick={(e) => handleAddToCart(product._id, e)}
                                                    disabled={product.stock === 0}
                                                    className={`flex-1 py-2 rounded-lg transition ${
                                                        product.stock === 0
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    }`}
                                                >
                                                    🛒 Add to Cart
                                                </button>
                                                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                                    ❤️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;