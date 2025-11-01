import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';

const PetCard = ({ pet, onAddToCart, variant = 'default' }) => {
    const isFeature = variant === 'feature';
    
    return (
        <div 
            className={`bg-white rounded-lg overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.4)] ${
                isFeature ? 'h-[440px]' : 'h-[380px]'
            } flex flex-col`}
        >
            <Link to={`/pets/${pet._id}`} className="block">
                <img 
                    src={pet.thumbnail || pet.images?.[0] || '/images/default-pet.jpg'} 
                    alt={pet.name}
                    className="w-full h-[250px] object-cover"
                />
            </Link>
            
            <div className="p-5 flex flex-col grow">
                <Link to={`/pets/${pet._id}`} className="no-underline">
                    <h2 className={`text-center font-semibold text-gray-800 hover:text-secondary-500 transition-colors mb-2 ${
                        isFeature ? 'text-xl' : 'text-lg'
                    }`}>
                        {pet.name}
                    </h2>
                </Link>
                
                {pet.breed && (
                    <p className="text-sm text-gray-600 text-center mb-2">
                        {pet.breed} • {pet.age} • {pet.gender}
                    </p>
                )}
                
                <p className="text-green-600 font-bold text-center my-2 text-lg">
                    ₹ {pet.price?.toLocaleString()}
                </p>
                
                <button
                    onClick={() => onAddToCart(pet._id, 'Pet')}
                    className="mt-auto w-full bg-linear-to-r from-primary-500 to-secondary-500 text-white font-medium py-2 px-4 rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <FaShoppingCart />
                    <span>Buy Now</span>
                </button>
            </div>
        </div>
    );
};

export default PetCard;