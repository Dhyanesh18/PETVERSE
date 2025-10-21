import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getProducts } from '../services/api';
import { useCart } from '../context/CartContext';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        categories: [],
        brands: [],
        minPrice: '',
        maxPrice: '',
        ratings: []
    });
    const [wishlist, setWishlist] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6); // 6 items per page (2 rows of 3)
    const navigate = useNavigate();
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await getProducts();
            const productsData = response.data.data || response.data || [];
            setProducts(productsData);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (type, value) => {
        setFilters(prev => {
            if (type === 'categories' || type === 'brands' || type === 'ratings') {
                const currentArray = prev[type];
                const newArray = currentArray.includes(value)
                    ? currentArray.filter(item => item !== value)
                    : [...currentArray, value];
                return { ...prev, [type]: newArray };
            } else {
                return { ...prev, [type]: value };
            }
        });
    };

    const clearFilters = () => {
        setFilters({
            categories: [],
            brands: [],
            minPrice: '',
            maxPrice: '',
            ratings: []
        });
    };

    const toggleWishlist = (productId) => {
        setWishlist(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleAddToCart = async (productId, e) => {
        e.stopPropagation();
        try {
            await addToCart({ productId, quantity: 1 });
            alert('Added to cart!');
        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('Failed to add to cart. Please try again.');
        }
    };

    const filteredProducts = products.filter(product => {
        // Category filter
        if (filters.categories.length > 0) {
            const productCategory = product.category?.toLowerCase() || '';
            const productName = product.name?.toLowerCase() || '';
            
            const matchesCategory = filters.categories.some(filterCategory => {
                const filterCat = filterCategory.toLowerCase();
                return productCategory.includes(filterCat) || 
                       productName.includes(filterCat) ||
                       (filterCat === 'pet food' && (productCategory.includes('food') || productName.includes('food'))) ||
                       (filterCat === 'toys' && (productCategory.includes('toy') || productName.includes('toy'))) ||
                       (filterCat === 'accessories' && (productCategory.includes('accessory') || productName.includes('accessory'))) ||
                       (filterCat === 'healthcare' && (productCategory.includes('health') || productName.includes('health'))) ||
                       (filterCat === 'grooming' && (productCategory.includes('groom') || productName.includes('groom')));
            });
            
            if (!matchesCategory) return false;
        }
        
        // Brand filter
        if (filters.brands.length > 0) {
            const productBrand = product.brand?.toLowerCase() || '';
            const matchesBrand = filters.brands.some(brand => 
                productBrand.includes(brand.toLowerCase())
            );
            if (!matchesBrand) return false;
        }
        
        // Rating filter
        if (filters.ratings.length > 0) {
            const productRating = product.avgRating || 0;
            const matchesRating = filters.ratings.some(rating => 
                productRating >= parseFloat(rating)
            );
            if (!matchesRating) return false;
        }
        
        // Price filter
        if (filters.minPrice && product.price < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) return false;
        
        return true;
    });

    const uniqueBrands = [...new Set(products.map(p => p.brand))];
    const categories = ['Pet Food', 'Toys', 'Accessories', 'Healthcare', 'Grooming'];

    // Pagination logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        
        // Calculate start and end page numbers
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Previous button
        pages.push(
            <button
                key="prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i className="fas fa-chevron-left"></i>
            </button>
        );

        // First page and ellipsis
        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="ellipsis1" className="px-3 py-2 text-gray-500">
                        ...
                    </span>
                );
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-2 border rounded ${
                        currentPage === i
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {i}
                </button>
            );
        }

        // Last page and ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(
                    <span key="ellipsis2" className="px-3 py-2 text-gray-500">
                        ...
                    </span>
                );
            }
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    {totalPages}
                </button>
            );
        }

        // Next button
        pages.push(
            <button
                key="next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i className="fas fa-chevron-right"></i>
            </button>
        );

        return (
            <div className="flex justify-center mt-8 gap-1">
                {pages}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-5 py-5 flex gap-5">
                {/* Filters Sidebar */}
                <div className="w-64 bg-white rounded-lg shadow-sm p-5 h-fit">
                    <h2 className="text-xl font-semibold mb-5">Filters</h2>
                    
                    {/* Category Filter */}
                    <div className="mb-5">
                        <h3 className="text-base font-medium mb-2 pb-2 border-b border-gray-200">Category</h3>
                        <div className="space-y-2">
                            {categories.map(category => (
                                <label key={category} className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={filters.categories.includes(category)}
                                        onChange={() => handleFilterChange('categories', category)}
                                        className="mr-2"
                                    />
                                    {category}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="mb-5">
                        <h3 className="text-base font-medium mb-2 pb-2 border-b border-gray-200">Price Range</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="number"
                                value={filters.minPrice}
                                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                placeholder="Min"
                                className="w-16 px-1 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-sm">to</span>
                            <input
                                type="number"
                                value={filters.maxPrice}
                                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                placeholder="Max"
                                className="w-16 px-1 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button 
                                onClick={() => {/* Apply price filter */}}
                                className="px-3 py-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm rounded hover:from-teal-600 hover:to-teal-700"
                            >
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Brand Filter */}
                    <div className="mb-5">
                        <h3 className="text-base font-medium mb-2 pb-2 border-b border-gray-200">Brand</h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {uniqueBrands.filter(brand => brand).slice(0, 10).map(brand => (
                                <label key={brand} className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={filters.brands.includes(brand)}
                                        onChange={() => handleFilterChange('brands', brand)}
                                        className="mr-2"
                                    />
                                    {brand}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Rating Filter */}
                    <div className="mb-5">
                        <h3 className="text-base font-medium mb-2 pb-2 border-b border-gray-200">Rating</h3>
                        <div className="space-y-2">
                            {['4', '3', '2'].map(rating => (
                                <label key={rating} className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={filters.ratings.includes(rating)}
                                        onChange={() => handleFilterChange('ratings', rating)}
                                        className="mr-2"
                                    />
                                    {rating}★ & above
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition mt-2"
                    >
                        Clear All Filters
                    </button>
                </div>

                {/* Products Display Area */}
                <div className="flex-1">
                    <div className="mb-5">
                        <h1 className="text-2xl font-semibold text-gray-800">All Products</h1>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-2xl text-gray-600">Loading...</div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-xl text-gray-600">No products found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {currentProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
                                    onClick={(e) => {
                                        if (!e.target.closest('.product-action')) {
                                            navigate(`/buy/${product._id}`);
                                        }
                                    }}
                                >
                                    <div className="relative w-full pt-[100%]">
                                        <img
                                            src={
                                                product.images && product.images.length > 0
                                                    ? `http://localhost:8080/api/products/${product._id}/image/0`
                                                    : product.category?.toLowerCase().includes('food') || product.name?.toLowerCase().includes('food')
                                                        ? 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                        : product.category?.toLowerCase().includes('toy') || product.name?.toLowerCase().includes('toy')
                                                        ? 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                        : 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                            }
                                            alt={product.name}
                                            className="absolute top-0 left-0 w-full h-full object-cover"
                                            onError={(e) => {
                                                const name = product.name?.toLowerCase() || '';
                                                if (name.includes('food')) {
                                                    e.target.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                } else if (name.includes('toy')) {
                                                    e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                } else {
                                                    e.target.src = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=' + encodeURIComponent(product.name || 'Product');
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.name}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                                        
                                        {/* Rating */}
                                        <div className="flex items-center gap-1 mb-2">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span
                                                        key={star}
                                                        className={`text-sm ${star <= (product.avgRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-600">({product.reviewCount || 0})</span>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-3 flex-grow line-clamp-2">{product.description}</p>
                                        
                                        {/* Price */}
                                        <div className="mb-2">
                                            {product.discount && product.discount > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 line-through text-sm">₹{product.price.toFixed(2)}</span>
                                                    <span className="text-xl font-bold text-gray-800">
                                                        ₹{(product.price * (1 - product.discount / 100)).toFixed(2)}
                                                    </span>
                                                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                        {product.discount}% OFF
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xl font-bold text-gray-800">
                                                    ₹{product.price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Stock */}
                                        <div className="text-sm mb-4">
                                            {product.stock === 0 ? (
                                                <span className="text-red-600 font-medium">Out of Stock</span>
                                            ) : product.stock <= 5 ? (
                                                <span className="text-green-600 font-medium">Only {product.stock} left in stock!</span>
                                            ) : (
                                                <span className="text-green-600 font-medium">In Stock</span>
                                            )}
                                        </div>

                                        <div className="product-action flex justify-between items-center mt-auto gap-2">
                                            <button 
                                                onClick={(e) => handleAddToCart(product._id, e)}
                                                disabled={product.stock === 0}
                                                className={`flex-1 py-2.5 px-4 rounded font-medium transition ${
                                                    product.stock === 0
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700'
                                                }`}
                                            >
                                                Add to Cart
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(product._id);
                                                }}
                                                className="w-10 h-10 border border-gray-300 rounded hover:border-red-500 hover:text-red-500 transition flex items-center justify-center"
                                            >
                                                <i className={`${wishlist.includes(product._id) ? 'fas' : 'far'} fa-heart ${wishlist.includes(product._id) ? 'text-red-500' : 'text-gray-600'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
};

export default Products;