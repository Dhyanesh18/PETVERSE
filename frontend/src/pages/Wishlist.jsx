import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWishlist, togglePetWishlist, toggleProductWishlist } from '../services/api';

const Wishlist = () => {
    const [wishlistPets, setWishlistPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadWishlistItems();
    }, []);

    const loadWishlistItems = async () => {
        try {
            setLoading(true);
            const response = await getWishlist();
            
            if (response.data.success) {
                setWishlistPets(response.data.data.pets || []);
            }
        } catch (error) {
            console.error('Failed to load wishlist:', error);
            setWishlistPets([]);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (petId) => {
        try {
            await togglePetWishlist(petId);
            setWishlistPets(prev => prev.filter(pet => pet._id !== petId));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    const clearWishlist = async () => {
        try {
            // Remove all pets from wishlist individually
            const removePromises = wishlistPets.map(pet => togglePetWishlist(pet._id));
            await Promise.all(removePromises);
            setWishlistPets([]);
        } catch (error) {
            console.error('Error clearing wishlist:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Wishlist</h1>
                    {wishlistPets.length > 0 && (
                        <button
                            onClick={clearWishlist}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {wishlistPets.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl text-gray-300 mb-4">
                            <i className="far fa-heart"></i>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your wishlist is empty</h2>
                        <p className="text-gray-500 mb-8">Browse pets and add your favorites to your wishlist</p>
                        <button
                            onClick={() => navigate('/pets')}
                            className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                        >
                            Browse Pets
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistPets.map((pet) => (
                            <div key={pet._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                                <div className="relative">
                                    <img
                                        src={pet.images?.[0] || '/images/default-pet.jpg'}
                                        alt={pet.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <button
                                        onClick={() => removeFromWishlist(pet._id)}
                                        className="absolute top-2 right-2 w-10 h-10 bg-white rounded-full shadow-md hover:bg-red-50 transition flex items-center justify-center"
                                    >
                                        <i className="fas fa-heart text-red-500"></i>
                                    </button>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{pet.breed}</h3>
                                    <p className="text-gray-600 mb-3 line-clamp-2">{pet.description}</p>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-2xl font-bold text-teal-600">
                                            ₹{pet.price?.toLocaleString()}
                                        </span>
                                        <div className="text-sm text-gray-500">
                                            {pet.age} • {pet.gender}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => navigate(`/pet/${pet._id}`)}
                                            className="flex-1 bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 transition"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => removeFromWishlist(pet._id)}
                                            className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;