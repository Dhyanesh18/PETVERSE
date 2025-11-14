import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';

const PetCard = ({ pet, onAddToCart, variant = 'default' }) => {
    const isFeature = variant === 'feature';
    
    // Get image - handle both API endpoint and fallback
    const getImageSrc = () => {
        // If pet has images, use the API endpoint
        if (pet.images && pet.images.length > 0) {
            return `http://localhost:8080/api/pets/image/${pet._id}/0`;
        }
        
        // If thumbnail is provided as API endpoint path
        if (pet.thumbnail) {
            if (pet.thumbnail.startsWith('/api/pets/image/')) {
                return `http://localhost:8080${pet.thumbnail}`;
            }
            // If it's the old format /images/pet/...
            if (pet.thumbnail.startsWith('/images/pet/')) {
                // Convert to correct API format
                const petId = pet._id;
                return `http://localhost:8080/api/pets/image/${petId}/0`;
            }
        }
        
        // Fallback placeholder based on category/breed
        const breed = pet.breed?.toLowerCase() || '';
        const category = pet.category?.toLowerCase() || '';
        
        if (category.includes('dog') || breed.includes('dog') || breed.includes('shepherd') || breed.includes('retriever')) {
            return 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        } else if (category.includes('cat') || breed.includes('cat') || breed.includes('persian') || breed.includes('siamese')) {
            return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        } else if (category.includes('bird') || breed.includes('bird') || breed.includes('parrot')) {
            return 'https://images.unsplash.com/photo-1444464666168-49d633b86797?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        } else if (category.includes('fish')) {
            return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        }
        return 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    };
    
    return (
        <div 
            className={`bg-white rounded-lg overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.4)] ${
                isFeature ? 'h-[440px] w-[280px]' : 'h-[380px] w-[260px]'
            } flex flex-col`}
        >
            <Link to={`/seller/detail/${pet._id}`} className="block">
                <img 
                    src={getImageSrc()}
                    alt={pet.name}
                    className="w-full h-[250px] object-cover"
                    onError={(e) => {
                        // Fallback on error
                        const breed = pet.breed?.toLowerCase() || '';
                        if (breed.includes('dog') || breed.includes('shepherd')) {
                            e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                        } else if (breed.includes('cat') || breed.includes('persian')) {
                            e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                        } else {
                            e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                        }
                    }}
                />
            </Link>
            
            <div className="p-5 flex flex-col grow">
                <Link to={`/seller/detail/${pet._id}`} className="no-underline">
                    <h2 className={`text-center font-semibold text-gray-800 hover:text-secondary-500 transition-colors mb-2 ${
                        isFeature ? 'text-xl' : 'text-lg'
                    }`}>
                        {pet.name}
                    </h2>
                </Link>
                
                {pet.breed && (
                    <p className="text-sm text-gray-600 text-center mb-2">
                        {pet.breed}
                    </p>
                )}
                
                <p className="text-green-600 font-bold text-center my-2 text-lg">
                    ₹{pet.price?.toLocaleString()}
                </p>
                
                <button
                    onClick={() => onAddToCart(pet._id, 'Pet')}
                    className="mt-auto w-full bg-linear-to-r from-teal-500 to-teal-600 text-white font-medium py-2 px-4 rounded-sm shadow-md hover:shadow-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <FaShoppingCart />
                    <span>Buy Now</span>
                </button>
            </div>
        </div>
    );
};

export default PetCard;