import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLostPets, setUserLocation, createLostPet } from '../redux/slices/lostPetSlice';
import LostPetCard from '../components/lostpet/LostPetCard';
import LostPetForm from '../components/lostpet/LostPetForm';
import LostPetFilters from '../components/lostpet/LostPetFilters';
import { useAuth } from '../hooks/useAuth';

const LostAndFound = () => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useAuth();
    const { lostPets, loading, error, userLocation, pagination } = useSelector(state => state.lostPet);
    
    const [showForm, setShowForm] = useState(false);
    const [filters, setFilters] = useState({
        status: 'lost',
        petType: '',
        radius: 50
    });

    useEffect(() => {
        // Get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    dispatch(setUserLocation(location));
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, [dispatch]);

    useEffect(() => {
        const params = {
            ...filters,
            ...(userLocation && {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
            })
        };
        dispatch(fetchLostPets(params));
    }, [dispatch, filters, userLocation]);

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleFormSubmit = async (formData) => {
        try {
            await dispatch(createLostPet(formData)).unwrap();
            setShowForm(false);
            dispatch(fetchLostPets({
                ...filters,
                ...(userLocation && {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude
                })
            }));
        } catch (error) {
            console.error('Failed to create post:', error);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-12" style={{ paddingTop: '160px' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        <span className="bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            Lost & Found
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Help reunite lost pets with their families. Post a lost pet alert or check if someone has found your pet.
                    </p>
                </div>

                {/* Alert Banner */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-lg">
                    <div className="flex items-center">
                        <i className="fas fa-exclamation-triangle text-yellow-400 text-xl mr-3"></i>
                        <div>
                            <p className="text-sm text-yellow-700">
                                <strong>Important:</strong> Always verify identity before sharing personal information or meeting with strangers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setShowForm(true)}
                        disabled={!isAuthenticated}
                        className="bg-linear-to-r from-teal-600 to-cyan-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <i className="fas fa-plus-circle"></i>
                        Report Lost Pet
                    </button>
                    {!isAuthenticated && (
                        <p className="text-sm text-gray-500 self-center">
                            <a href="/login" className="text-teal-600 hover:text-teal-700 font-medium">Login</a> to post
                        </p>
                    )}
                </div>

                {/* Form Modal */}
                {showForm && (
                    <LostPetForm
                        onClose={() => setShowForm(false)}
                        onSubmit={handleFormSubmit}
                        userLocation={userLocation}
                    />
                )}

                {/* Filters and Listings */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <LostPetFilters
                            filters={filters}
                            onChange={handleFilterChange}
                            userLocation={userLocation}
                        />
                    </div>

                    {/* Listings */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center">
                                <i className="fas fa-exclamation-circle text-3xl mb-2"></i>
                                <p>{error}</p>
                            </div>
                        ) : lostPets.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <i className="fas fa-search text-gray-300 text-6xl mb-4"></i>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No pets found</h3>
                                <p className="text-gray-600">Try adjusting your filters or expanding the search radius.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {lostPets.map((lostPet) => (
                                        <LostPetCard key={lostPet._id} lostPet={lostPet} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center mt-8 gap-2">
                                        {Array.from({ length: pagination.totalPages }, (_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handleFilterChange({ page: i + 1 })}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                    pagination.page === i + 1
                                                        ? 'bg-teal-600 text-white shadow-lg'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LostAndFound;
