import React from 'react';

const CategoryCard = ({ category, onClick }) => {
    return (
        <div 
            className="bg-white rounded-lg overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.4)] h-80 flex flex-col m-5 mx-0 w-[250px]"
        >
            <img 
                src={category.image || '/images/default-category.jpg'} 
                alt={category.name}
                className="w-full h-[250px] object-cover rounded-t-lg"
            />
            
            <div className="p-5 flex flex-col items-center grow">
                <h2 className="text-center text-lg font-semibold text-gray-800 mb-3">
                    {category.name}
                </h2>
                
                <button
                    onClick={onClick}
                    className="w-full bg-linear-to-r from-primary-500 to-secondary-500 text-white font-medium py-2 px-4 rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.5)] hover:scale-105 transition-all duration-300"
                >
                    Explore
                </button>
            </div>
        </div>
    );
};

export default CategoryCard;