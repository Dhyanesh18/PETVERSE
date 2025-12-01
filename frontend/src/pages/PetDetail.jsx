import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetById, togglePetWishlist, getWishlist, getPets } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { Truck, XCircle, Wallet, Stethoscope, ShoppingCart, Heart, Clock, Home, Ruler, Palette } from 'lucide-react';
import { Mars, Venus } from 'lucide-react';

const PetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [similarPets, setSimilarPets] = useState([]);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const fetchPetDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [petResponse, wishlistResponse] = await Promise.all([
                getPetById(id),
                isAuthenticated ? getWishlist().catch(() => ({ data: { data: { pets: [] } } })) : Promise.resolve({ data: { data: { pets: [] } } })
            ]);
            
            console.log('Full pet API response:', petResponse.data);
            console.log('Pet response keys:', Object.keys(petResponse.data));
            console.log('Pet data keys:', petResponse.data.data ? Object.keys(petResponse.data.data) : 'no data.data');
            
            let petData, similarPetsData;
            
            if (petResponse.data.data && petResponse.data.data.pet) {
                petData = petResponse.data.data.pet;
                similarPetsData = petResponse.data.data.similarPets || [];
                
                console.log('Using nested structure - Pet:', petData);
                console.log('Using nested structure - Similar pets:', similarPetsData);
            } else {
                petData = petResponse.data.data;
                similarPetsData = petResponse.data.data?.similarPets || petResponse.data.similarPets || [];
                
                console.log('Using direct structure - Pet:', petData);
                console.log('Using direct structure - Similar pets:', similarPetsData);
            }
            
            setPet(petData);
            setSimilarPets(similarPetsData);
            
            if (isAuthenticated && wishlistResponse.data.data) {
                const wishlistPetIds = (wishlistResponse.data.data.pets || []).map(pet => pet._id);
                setIsWishlisted(wishlistPetIds.includes(id));
            } else {
                setIsWishlisted(false);
            }
            
            if (petData && petData.category) {
                console.log('Current pet category:', petData.category);
                console.log('Current pet breed:', petData.breed);
                try {
                    const similarResponse = await getPets({ 
                        limit: 20
                    });
                    
                    const allPets = similarResponse.data.data || similarResponse.data || [];
                    console.log('All pets fetched:', allPets.length);
                    console.log('Sample pet categories:', allPets.slice(0, 3).map(p => ({ name: p.name, category: p.category, breed: p.breed })));
                    
                    const categoryPets = allPets
                        .filter(p => {
                            const isSameCategory = p.category && p.category.toLowerCase() === petData.category.toLowerCase();
                            const isNotCurrentPet = p._id !== id;
                            console.log(`Pet ${p.name}: category="${p.category}", matches="${isSameCategory}", notCurrent="${isNotCurrentPet}"`);
                            return isSameCategory && isNotCurrentPet;
                        })
                        .slice(0, 4);
                    
                    console.log(`Found ${categoryPets.length} similar ${petData.category} pets:`, categoryPets.map(p => ({ name: p.name, category: p.category })));
                    setSimilarPets(categoryPets);
                } catch (similarError) {
                    console.error('Failed to fetch similar pets:', similarError);
                    setSimilarPets([]);
                }
            } else {
                setSimilarPets([]);
            }
        } catch (error) {
            console.error('Failed to fetch pet details:', error);
        } finally {
            setLoading(false);
        }
    }, [id, isAuthenticated]);

    useEffect(() => {
        fetchPetDetails();
    }, [id, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleWishlistToggle = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        try {
            await togglePetWishlist(id);
            setIsWishlisted(!isWishlisted);
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        try {
            const cartItem = {
                productId: pet._id,
                itemType: 'Pet',
                quantity: 1
            };
            
            console.log('Adding to cart:', cartItem);
            console.log('Pet object:', pet);
            console.log('Auth status:', isAuthenticated);
            console.log('Pet ID:', pet._id);
            
            await addToCart(cartItem);
            
            alert(`${pet.name} has been added to your cart!`);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            
            const serverError = error.response?.data?.error || error.message;
            console.error('Server error message:', serverError);
            
            if (error.response?.status === 404) {
                alert('Cart service is not available. Please try again later.');
            } else if (error.response?.status === 401) {
                alert('Please log in again to add items to cart.');
                navigate('/login');
            } else if (error.response?.status === 400) {
                alert(`Validation error: ${serverError}`);
            } else {
                alert(`Failed to add to cart: ${serverError}`);
            }
        }
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

    if (!pet && !loading) {
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
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Image Gallery */}
                        <div className="flex flex-col">
                            <div className="mb-4 rounded-lg overflow-hidden aspect-square">
                                {(pet.imageUrls && pet.imageUrls.length > 0) || (pet.images && pet.images.length > 0) ? (
                                    <img
                                        src={
                                            pet.imageUrls && pet.imageUrls.length > 0 
                                                ? `http://localhost:8080${pet.imageUrls[selectedImage]}`
                                                : `http://localhost:8080/api/pets/image/${pet._id}/${selectedImage}`
                                        }
                                        alt={pet.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            if (pet.imageUrls && pet.imageUrls[selectedImage] && !e.target.src.includes('/images/pet/')) {
                                                e.target.src = `http://localhost:8080${pet.imageUrls[selectedImage]}`;
                                            } else if (pet.images && pet.images.length > selectedImage && !e.target.src.includes('/api/pets/image/')) {
                                                e.target.src = `http://localhost:8080/api/pets/image/${pet._id}/${selectedImage}`;
                                            } else {
                                                const breed = pet.breed?.toLowerCase() || '';
                                                if (breed.includes('dog') || breed.includes('german') || breed.includes('shepherd')) {
                                                    e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                                } else if (breed.includes('cat')) {
                                                    e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                                } else {
                                                    e.target.src = 'https://via.placeholder.com/500x384/e5e7eb/6b7280?text=' + encodeURIComponent(pet.name || 'Pet');
                                                }
                                            }
                                        }}
                                    />
                                ) : pet.thumbnail ? (
                                    <img
                                        src={`http://localhost:8080${pet.thumbnail}`}
                                        alt={pet.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const breed = pet.breed?.toLowerCase() || '';
                                            if (breed.includes('dog') || breed.includes('german') || breed.includes('shepherd')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                            } else if (breed.includes('cat')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                            } else {
                                                e.target.src = 'https://via.placeholder.com/500x384/e5e7eb/6b7280?text=' + encodeURIComponent(pet.name || 'Pet');
                                            }
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={pet.breed?.toLowerCase().includes('dog') || pet.breed?.toLowerCase().includes('german') || pet.breed?.toLowerCase().includes('shepherd') 
                                            ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
                                            : pet.category === 'cats' || pet.breed?.toLowerCase().includes('cat')
                                            ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
                                            : 'https://via.placeholder.com/500x384/e5e7eb/6b7280?text=' + encodeURIComponent(pet.name || 'Pet')
                                        }
                                        alt={pet.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            
                            {/* Thumbnail Gallery */}
                            {((pet.imageUrls && pet.imageUrls.length > 1) || (pet.images && pet.images.length > 1)) && (
                                <div className="grid grid-cols-4 gap-2">
                                    {(pet.imageUrls || pet.images || []).map((imageUrl, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`rounded-lg overflow-hidden border-2 aspect-square ${
                                                selectedImage === index ? 'border-indigo-600' : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                src={
                                                    pet.imageUrls && pet.imageUrls.length > 0 
                                                        ? `http://localhost:8080${pet.imageUrls[index]}`
                                                        : `http://localhost:8080/api/pets/image/${pet._id}/${index}`
                                                }
                                                alt={`${pet.name} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    if (pet.imageUrls && pet.imageUrls[index] && !e.target.src.includes('/images/pet/')) {
                                                        e.target.src = `http://localhost:8080${pet.imageUrls[index]}`;
                                                    } else if (pet.images && pet.images[index] && !e.target.src.includes('/api/pets/image/')) {
                                                        e.target.src = `http://localhost:8080/api/pets/image/${pet._id}/${index}`;
                                                    } else {
                                                        e.target.src = 'https://via.placeholder.com/80x80/e5e7eb/6b7280?text=' + (index + 1);
                                                    }
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pet Information */}
                        <div className="flex flex-col">
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">{pet.name}</h1>
                            
                            <div className="text-4xl font-bold text-green-600 mb-6">
                                ₹{pet.price.toLocaleString()}
                            </div>

                            {/* Pet Details Grid */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Pet Details</h2>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                                            <Home className="w-4 h-4" />
                                            Category:
                                        </span>
                                        <p className="text-gray-600 capitalize ml-6">{pet.category}</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-700 mb-1">Breed:</span>
                                        <p className="text-gray-600">{pet.breed}</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                                            <Clock className="w-4 h-4" />
                                            Age:
                                        </span>
                                        <p className="text-gray-600 ml-6">{pet.age}</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-700 mb-1">Gender:</span>
                                        <p className="text-gray-600 capitalize flex items-center gap-1">
                                            {pet.gender === 'male' ? (
                                            <>
                                                <Mars size={16} className="text-blue-500" />
                                                Male
                                            </>
                                            ) : (
                                            <>
                                                <Venus size={16} className="text-pink-500" />
                                                Female
                                            </>
                                            )}
                                        </p>
                                        </div>
                                    {pet.color && (
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                                                <Palette className="w-4 h-4" />
                                                Color:
                                            </span>
                                            <p className="text-gray-600 ml-6">{pet.color}</p>
                                        </div>
                                    )}
                                    {pet.weight && (
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                                                <Ruler className="w-4 h-4" />
                                                Weight:
                                            </span>
                                            <p className="text-gray-600 ml-6">{pet.weight}</p>
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
                                <div className="flex items-center gap-2 mb-1">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Free Delivery</span>
                                </div>
                                <p className="text-blue-700 text-sm ml-7">
                                    Estimated delivery: 2-4 days
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 mt-auto">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Add to Cart
                                </button>
                                <button 
                                    onClick={handleWishlistToggle}
                                    className={`px-6 py-4 border-2 rounded-lg transition ${
                                        isWishlisted 
                                            ? 'border-red-500 bg-red-50 text-red-500' 
                                            : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                                    }`}
                                >
                                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-3">
                            <Truck className="w-10 h-10 text-teal-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Free Delivery</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-3">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">No Returns</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-3">
                            <Wallet className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Pay On Delivery</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-3">
                            <Stethoscope className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Free Check Up</h3>
                    </div>
                </div>

                {/* Similar Pets */}
                <div className="my-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Similar Pets</h2>
                    {similarPets.length > 0 ? (
                        <div className="overflow-x-auto scrollbar-hide">
                            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                                {similarPets.map((similarPet) => (
                                    <div
                                        key={similarPet._id}
                                        className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col w-64 shrink-0"
                                        onClick={(e) => {
                                            if (!e.target.closest('.product-action')) {
                                                navigate(`/seller/detail/${similarPet._id}`);
                                            }
                                        }}
                                    >
                                        <div className="relative w-full aspect-4/3">
                                            <img
                                                src={
                                                    similarPet.images && similarPet.images.length > 0
                                                        ? `http://localhost:8080/api/pets/${similarPet._id}/image/0`
                                                        : similarPet.thumbnail 
                                                        ? `http://localhost:8080${similarPet.thumbnail}`
                                                        : similarPet.category === 'dogs' || similarPet.breed?.toLowerCase().includes('dog') || similarPet.breed?.toLowerCase().includes('shepherd') || similarPet.breed?.toLowerCase().includes('rottweiler')
                                                            ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : similarPet.category === 'cats' || similarPet.breed?.toLowerCase().includes('cat') || similarPet.breed?.toLowerCase().includes('persian') || similarPet.breed?.toLowerCase().includes('siamese')
                                                            ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : similarPet.category === 'birds' || similarPet.breed?.toLowerCase().includes('bird')
                                                            ? 'https://images.unsplash.com/photo-1444464666168-49d633b86797?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : similarPet.category === 'fish' || similarPet.breed?.toLowerCase().includes('fish')
                                                            ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                }
                                                alt={similarPet.name}
                                                className="absolute top-0 left-0 w-full h-full object-cover"
                                                onError={(e) => {
                                                    const breed = similarPet.breed?.toLowerCase() || '';
                                                    if (breed.includes('dog') || breed.includes('shepherd') || breed.includes('rottweiler')) {
                                                        e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                    } else if (breed.includes('cat') || breed.includes('persian') || breed.includes('siamese')) {
                                                        e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                    } else {
                                                        e.target.src = 'https://via.placeholder.com/250x190/e5e7eb/6b7280?text=' + encodeURIComponent(similarPet.name || 'Pet');
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="p-4 flex flex-col grow">
                                            <h3 className="text-base font-semibold text-gray-800 mb-1">{similarPet.name}</h3>
                                            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{similarPet.description}</p>
                                            <div className="text-lg font-bold text-teal-600 mb-2">
                                                ₹{similarPet.price?.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {similarPet.age}
                                                </span>
                                                {similarPet.gender === 'male' ? (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <Mars size={16} color="blue" /> Male
  </span>
) : (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <Venus size={16} color="deeppink" /> Female
  </span>
)}
                                            </div>
                                            <div className="product-action flex gap-2 mt-auto">
                                                <button 
                                                    onClick={() => navigate(`/seller/detail/${similarPet._id}`)}
                                                    className="flex-1 bg-linear-to-r from-teal-500 to-teal-600 text-white py-2 px-3 rounded text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition"
                                                >
                                                    View Details
                                                </button>
                                                <button 
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (!isAuthenticated) {
                                                            navigate('/login');
                                                            return;
                                                        }
                                                        try {
                                                            await togglePetWishlist(similarPet._id);
                                                        } catch (error) {
                                                            console.error('Failed to toggle wishlist:', error);
                                                        }
                                                    }}
                                                    className="w-10 h-10 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center"
                                                >
                                                    <Heart className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">No similar pets available at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PetDetail;