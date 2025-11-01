import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetById } from '../services/api';

const PetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [similarPets, setSimilarPets] = useState([]);

    const fetchPetDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getPetById(id);
            setPet(response.data.pet);
            setSimilarPets(response.data.similarPets || []);
        } catch (error) {
            console.error('Failed to fetch pet details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPetDetails();
    }, [fetchPetDetails]);

    const handleContactSeller = () => {
        alert('Contact seller functionality coming soon!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pet Not Found</h1>
                        <button
                            onClick={() => navigate('/pets')}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                        >
                            Back to Pets
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Image Gallery */}
                        <div>
                            <div className="mb-4 rounded-lg overflow-hidden">
                                {pet.images && pet.images.length > 0 ? (
                                    <img
                                        src={`data:${pet.images[selectedImage].contentType};base64,${pet.images[selectedImage].data}`}
                                        alt={pet.name}
                                        className="w-full h-96 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400">No image available</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Thumbnail Gallery */}
                            {pet.images && pet.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {pet.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`rounded-lg overflow-hidden border-2 ${
                                                selectedImage === index ? 'border-indigo-600' : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                src={`data:${image.contentType};base64,${image.data}`}
                                                alt={`${pet.name} ${index + 1}`}
                                                className="w-full h-20 object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pet Information */}
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-4">{pet.breed}</h1>
                            
                            <div className="text-4xl font-bold text-indigo-600 mb-6">
                                ₹{pet.price.toLocaleString()}
                            </div>

                            {/* Pet Details Grid */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Pet Details</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="font-semibold text-gray-700">Category:</span>
                                        <p className="text-gray-600 capitalize">{pet.category}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Breed:</span>
                                        <p className="text-gray-600">{pet.breed}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Age:</span>
                                        <p className="text-gray-600">{pet.age}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Gender:</span>
                                        <p className="text-gray-600 capitalize flex items-center gap-1">
                                            {pet.gender === 'male' ? '♂️ Male' : '♀️ Female'}
                                        </p>
                                    </div>
                                    {pet.color && (
                                        <div>
                                            <span className="font-semibold text-gray-700">Color:</span>
                                            <p className="text-gray-600">{pet.color}</p>
                                        </div>
                                    )}
                                    {pet.weight && (
                                        <div>
                                            <span className="font-semibold text-gray-700">Weight:</span>
                                            <p className="text-gray-600">{pet.weight}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-3">Description</h2>
                                <p className="text-gray-600 leading-relaxed">{pet.description}</p>
                            </div>

                            {/* Delivery Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">🚚</span>
                                    <span className="font-semibold text-blue-900">Free Delivery</span>
                                </div>
                                <p className="text-blue-700 text-sm">
                                    Estimated delivery: 2-4 days
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleContactSeller}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                                >
                                    <span>📞</span>
                                    Contact Seller
                                </button>
                                <button className="px-6 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                    <span className="text-2xl">❤️</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="text-4xl mb-2">🚚</div>
                        <h3 className="font-semibold text-gray-800">Free Delivery</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="text-4xl mb-2">🚫</div>
                        <h3 className="font-semibold text-gray-800">No Returns</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="text-4xl mb-2">💰</div>
                        <h3 className="font-semibold text-gray-800">Pay On Delivery</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="text-4xl mb-2">🩺</div>
                        <h3 className="font-semibold text-gray-800">Free Check Up</h3>
                    </div>
                </div>

                {/* Similar Pets */}
                {similarPets.length > 0 && (
                    <div className="my-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Similar Pets</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {similarPets.map((similarPet) => (
                                <div
                                    key={similarPet._id}
                                    onClick={() => navigate(`/seller/detail/${similarPet._id}`)}
                                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
                                >
                                    <div className="h-48">
                                        {similarPet.images && similarPet.images.length > 0 ? (
                                            <img
                                                src={`data:${similarPet.images[0].contentType};base64,${similarPet.images[0].data}`}
                                                alt={similarPet.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">{similarPet.breed}</h3>
                                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{similarPet.description}</p>
                                        <div className="text-xl font-bold text-indigo-600 mb-3">
                                            ₹{similarPet.price.toLocaleString()}
                                        </div>
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

export default PetDetail;