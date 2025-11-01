import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart } from 'react-icons/fa';

const ProductCard = ({ product, onAddToCart, variant = 'default' }) => {
    const isFeature = variant === 'feature';
    
    return (
        <div 
            className={`bg-white rounded-lg overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.4)] ${
                isFeature ? 'h-[440px]' : 'h-[380px]'
            } flex flex-col`}
        >
            <Link to={`/products/${product._id}`} className="block">
                <img 
                    src={product.thumbnail || product.images?.[0] || '/images/default-product.jpg'} 
                    alt={product.name}
                    className="w-full h-[250px] object-cover"
                />
            </Link>
            
            <div className="p-5 flex flex-col grow">
                <Link to={`/products/${product._id}`} className="no-underline">
                    <h2 className={`text-center font-semibold text-gray-800 hover:text-secondary-500 transition-colors mb-2 ${
                        isFeature ? 'text-xl' : 'text-lg'
                    }`}>
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
                        ₹ {product.price?.toLocaleString()}
                    </p>
                    {product.discount > 0 && (
                        <span className="bg-linear-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {product.discount}% OFF
                        </span>
                    )}
                </div>
                
                <button
                    onClick={() => onAddToCart(product._id, 'Product')}
                    className="mt-auto w-full bg-linear-to-r from-primary-500 to-secondary-500 text-white font-medium py-2 px-4 rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <FaShoppingCart />
                    <span>Buy Now</span>
                </button>
            </div>
        </div>
    );
};

export default ProductCard;