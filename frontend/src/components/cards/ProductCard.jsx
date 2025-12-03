import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart } from 'react-icons/fa';

const ProductCard = ({ product, onAddToCart, onToggleWishlist, isWishlisted = false, variant = 'default' }) => {
    const isFeature = variant === 'feature';
    
    // Get image - handle both API endpoint and fallback
    const getImageSrc = () => {
        // If product has images, use the API endpoint
        if (product.images && product.images.length > 0) {
            return `http://localhost:8080/api/products/image/${product._id}/0`;
        }
        
        // If thumbnail is provided as API endpoint path
        if (product.thumbnail) {
            if (product.thumbnail.startsWith('/api/products/image/')) {
                return `http://localhost:8080${product.thumbnail}`;
            }
            // If it's the old format /images/product/...
            if (product.thumbnail.startsWith('/images/product/')) {
                // Convert to correct API format
                const productId = product._id;
                return `http://localhost:8080/api/products/image/${productId}/0`;
            }
        }
        
        // Fallback placeholder based on category
        const category = product.category?.toLowerCase() || '';
        if (category.includes('food')) {
            return 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        } else if (category.includes('toy')) {
            return 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        } else if (category.includes('health')) {
            return 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        } else if (category.includes('groom')) {
            return 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        }
        return 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    };
    
    return (
        <div 
            className={`bg-white rounded-lg overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.4)] ${
                isFeature ? 'h-[440px] w-[280px]' : 'h-[380px] w-[260px]'
            } flex flex-col`}
        >
            <div className="relative">
                <Link to={`/product/${product._id}`} className="block">
                    <img 
                    src={getImageSrc()}
                    alt={product.name}
                    className="w-full h-[250px] object-cover"
                    onError={(e) => {
                        // Fallback on error
                        const category = product.category?.toLowerCase() || '';
                        if (category.includes('food')) {
                            e.target.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                        } else if (category.includes('toy')) {
                            e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                        } else {
                            e.target.src = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                        }
                    }}
                    />
                </Link>
                {onToggleWishlist && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleWishlist(product._id);
                        }}
                        className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer z-10"
                        aria-label="Toggle wishlist"
                    >
                        <FaHeart className={`text-xl ${isWishlisted ? 'text-red-500' : 'text-gray-400'}`} />
                    </button>
                )}
            </div>
            
            <div className="p-5 flex flex-col grow">
                <Link to={`/product/${product._id}`} className="no-underline">
                    <h2
                        className={`text-center font-semibold text-gray-800 hover:text-secondary-500 transition-colors mb-2 
                            wrap-break-word overflow-hidden text-ellipsis line-clamp-1
                            ${isFeature ? 'text-xl' : 'text-lg'}
                        `}
                    >
                        {product.name}
                    </h2>
                </Link>
                
                {product.avgRating !== undefined && (
                    <div className="flex items-center justify-center mb-2">
                        <div className="flex text-amber-400 text-sm mr-2">
                            {[...Array(5)].map((_, i) => (
                                <FaStar
                                    key={i}
                                    className={i < Math.floor(product.avgRating) ? 'text-amber-400' : 'text-gray-300'}
                                />
                            ))}
                        </div>
                        <span className="text-gray-600 text-sm">
                            ({product.reviewCount || 0})
                        </span>
                    </div>
                )}
                
                <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-green-600 font-bold text-lg">
                        ₹{product.price?.toLocaleString()}
                    </p>
                    {product.discount > 0 && (
                        <span className="bg-linear-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {product.discount}% OFF
                        </span>
                    )}
                </div>
                
                <button
                    onClick={() => onAddToCart(product._id, 'Product')}
                    className="mt-auto w-full bg-linear-to-r from-teal-500 to-teal-600 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <FaShoppingCart />
                    <span>Buy Now</span>
                </button>
            </div>
        </div>
    );
};

export default ProductCard;