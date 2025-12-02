import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPets, togglePetWishlist, getWishlist } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Pets = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        categories: [],
        breeds: [],
        ages: [],
        minPrice: '',
        maxPrice: ''
    });
    const [wishlist, setWishlist] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6); // 6 items per page (2 rows of 3)
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        fetchPets();
        if (isAuthenticated) {
            loadWishlistStatus();
        } else {
            // Clear wishlist when user logs out
            setWishlist([]);
        }
    }, [isAuthenticated]);

    const loadWishlistStatus = async () => {
        try {
            console.log('Loading wishlist for authenticated user...');
            // Get user's wishlist from backend
            const response = await getWishlist();
            console.log('Wishlist API response:', response.data);
            const wishlistData = response.data.data || {};
            
            // Extract pet IDs from user's wishlist
            const wishlistPetIds = (wishlistData.pets || []).map(pet => pet._id);
            
            setWishlist(wishlistPetIds);
            console.log('Loaded wishlist pet IDs:', wishlistPetIds);
            console.log('Wishlist state updated successfully');
        } catch (error) {
            console.error('Error loading wishlist status:', error);
            console.error('Error details:', error.response?.data);
            // If user is not logged in or error occurs, set empty wishlist
            setWishlist([]);
        }
    };

    const fetchPets = async () => {
        try {
            setLoading(true);
            const response = await getPets();
            const petsData = response.data.data || response.data || [];
            setPets(petsData);
        } catch (error) {
            console.error('Failed to fetch pets:', error);
            setPets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (type, value) => {
        setFilters(prev => {
            if (type === 'categories' || type === 'breeds' || type === 'ages') {
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
            breeds: [],
            ages: [],
            minPrice: '',
            maxPrice: ''
        });
    };

    const toggleWishlist = async (petId) => {
        if (!isAuthenticated) {
            alert('Please login to add items to wishlist');
            return;
        }
        
        try {
            const response = await togglePetWishlist(petId);
            console.log('Toggle wishlist response:', response.data);
            
            if (response.data.success) {
                console.log('Toggle response data:', response.data.data);
                // Check if pet is now in wishlist based on backend response
                const isInWishlist = response.data.data?.isInWishlist || response.data.data?.wishlist;
                console.log('Pet is in wishlist:', isInWishlist);
                
                // Update local state based on actual backend state
                setWishlist(prev => {
                    console.log('Previous wishlist state:', prev);
                    if (isInWishlist && !prev.includes(petId)) {
                        console.log('Adding pet to wishlist');
                        return [...prev, petId];
                    } else if (!isInWishlist && prev.includes(petId)) {
                        console.log('Removing pet from wishlist');
                        return prev.filter(id => id !== petId);
                    }
                    console.log('No change to wishlist state');
                    return prev;
                });
                
                // Show notification
                const message = isInWishlist ? 'Added to wishlist' : 'Removed from wishlist';
                console.log(message, petId);
                
                // Optionally refresh wishlist from server to ensure consistency
                setTimeout(() => {
                    loadWishlistStatus();
                }, 500);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        }
    };

    const filteredPets = pets.filter(pet => {
        
        // Category filter
        if (filters.categories.length > 0) {
            const petCategory = pet.category?.toLowerCase() || '';
            const petBreed = pet.breed?.toLowerCase() || '';
            
            const matchesCategory = filters.categories.some(filterCategory => {
                if (filterCategory === 'dogs') {
                    return petCategory.includes('dog') || petBreed.includes('dog') || 
                           petBreed.includes('shepherd') || petBreed.includes('rottweiler') ||
                           petBreed.includes('retriever') || petBreed.includes('bulldog');
                }
                if (filterCategory === 'cats') {
                    return petCategory.includes('cat') || petBreed.includes('cat') || 
                           petBreed.includes('persian') || petBreed.includes('siamese');
                }
                if (filterCategory === 'birds') {
                    return petCategory.includes('bird') || petBreed.includes('bird') ||
                           petBreed.includes('parrot') || petBreed.includes('canary');
                }
                if (filterCategory === 'fish') {
                    return petCategory.includes('fish') || petBreed.includes('fish') ||
                           petBreed.includes('goldfish') || petBreed.includes('betta');
                }
                return petCategory.includes(filterCategory);
            });
            
            if (!matchesCategory) return false;
        }
        
        // Breed filter
        if (filters.breeds.length > 0) {
            const petBreedLower = pet.breed?.toLowerCase() || '';
            const matchesBreed = filters.breeds.some(breed => {
                if (breed === 'german-shepherd') return petBreedLower.includes('german') && petBreedLower.includes('shepherd');
                if (breed === 'persian') return petBreedLower.includes('persian');
                if (breed === 'siamese') return petBreedLower.includes('siamese');
                return petBreedLower.includes(breed.toLowerCase().replace('-', ' '));
            });
            if (!matchesBreed) return false;
        }
        
        // Age filter
        if (filters.ages.length > 0) {
            const petAgeLower = pet.age?.toLowerCase() || '';
            const matchesAge = filters.ages.some(age => {
                if (age === 'puppy') return petAgeLower.includes('month') || petAgeLower.includes('puppy') || petAgeLower.includes('kitten') || petAgeLower.includes('5 month');
                if (age === 'young') return petAgeLower.includes('1 year') || petAgeLower.includes('2 year') || petAgeLower.includes('1.5 year');
                if (age === 'adult') return petAgeLower.includes('3 year') || petAgeLower.includes('4 year') || petAgeLower.includes('5 year') || petAgeLower.includes('adult');
                return petAgeLower.includes(age.toLowerCase());
            });
            if (!matchesAge) return false;
        }
        
        // Price filter
        if (filters.minPrice && pet.price < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && pet.price > parseFloat(filters.maxPrice)) return false;
        
        return true;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredPets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPets = filteredPets.slice(startIndex, endIndex);

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
        <div className="min-h-screen bg-gray-50 pt-20" style={{ paddingTop: '130px' }}>
            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-5 py-5 flex gap-5">
                {/* Filters Sidebar */}
                <div className="w-64 bg-white rounded-lg shadow-sm p-5 h-fit">
                    <h2 className="text-xl font-semibold mb-5">Filters</h2>
                    
                    {/* Category Filter */}
                    <div className="mb-5">
                        <h3 className="text-base font-medium mb-2 pb-2 border-b border-gray-200">Category</h3>
                        <div className="space-y-2">
                            {['dogs', 'cats', 'birds', 'fish'].map(category => (
                                <label key={category} className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={filters.categories.includes(category)}
                                        onChange={() => handleFilterChange('categories', category)}
                                        className="mr-2"
                                    />
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
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
                                className="px-3 py-1 bg-linear-to-r from-teal-500 to-teal-600 text-white text-sm rounded hover:from-teal-600 hover:to-teal-700"
                            >
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Breed Filter */}
                    <div className="mb-5">
                        <h3 className="text-base font-medium mb-2 pb-2 border-b border-gray-200">Breed</h3>
                        <div className="space-y-2">
                            {['german-shepherd', 'persian', 'siamese'].map(breed => (
                                <label key={breed} className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={filters.breeds.includes(breed)}
                                        onChange={() => handleFilterChange('breeds', breed)}
                                        className="mr-2"
                                    />
                                    {breed.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Age Filter */}
                    <div className="mb-5">
                        <h3 className="text-base font-medium mb-2 pb-2 border-b border-gray-200">Age</h3>
                        <div className="space-y-2">
                            {['puppy', 'young', 'adult'].map(age => (
                                <label key={age} className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={filters.ages.includes(age)}
                                        onChange={() => handleFilterChange('ages', age)}
                                        className="mr-2"
                                    />
                                    {age === 'puppy' ? 'Puppy/Kitten' : age.charAt(0).toUpperCase() + age.slice(1)}
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
                        <h1 className="text-2xl font-semibold text-gray-800">Available Pets</h1>
                       
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-2xl text-gray-600">Loading...</div>
                        </div>
                    ) : filteredPets.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-xl text-gray-600">No pets found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {currentPets.map((pet) => (
                                <div
                                    key={pet._id}
                                    className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col h-full"
                                    onClick={(e) => {
                                        if (!e.target.closest('.product-action')) {
                                            navigate(`/seller/detail/${pet._id}`);
                                        }
                                    }}
                                >
                                    <div className="relative w-full pt-[100%]">
                                        <img
                                            src={
                                                pet.images && pet.images.length > 0
                                                    ? `http://localhost:8080/api/pets/${pet._id}/image/0`
                                                    : pet.category === 'dogs' || pet.breed.toLowerCase().includes('dog') || pet.breed.toLowerCase().includes('shepherd') || pet.breed.toLowerCase().includes('rottweiler')
                                                        ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                        : pet.category === 'cats' || pet.breed.toLowerCase().includes('cat') || pet.breed.toLowerCase().includes('persian') || pet.breed.toLowerCase().includes('siamese')
                                                        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                        : pet.category === 'birds' || pet.breed.toLowerCase().includes('bird')
                                                        ? 'https://images.unsplash.com/photo-1444464666168-49d633b86797?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                        : pet.category === 'fish' || pet.breed.toLowerCase().includes('fish')
                                                        ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                        : 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                            }
                                            alt={pet.breed}
                                            className="absolute top-0 left-0 w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to breed-specific placeholder
                                                const breed = pet.breed.toLowerCase();
                                                if (breed.includes('dog') || breed.includes('shepherd') || breed.includes('rottweiler')) {
                                                    e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                } else if (breed.includes('cat') || breed.includes('persian') || breed.includes('siamese')) {
                                                    e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                } else {
                                                    e.target.src = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=' + encodeURIComponent(pet.breed);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="p-4 flex flex-col grow">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2 -mt-4">{pet.breed}</h3>
                                        <p className="text-gray-600 text-sm mb-3 grow line-clamp-2">{pet.description}</p>
                                        <div className="text-lg font-medium text-green-600 mb-3">
                                            ₹{pet.price.toFixed(2)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                            <span className="flex items-center gap-1">
                                                <i className="fas fa-birthday-cake"></i> {pet.age}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                {pet.gender === 'male' ? (
                                                    <><i className="fas fa-mars"></i> Male</>
                                                ) : (
                                                    <><i className="fas fa-venus"></i> Female</>
                                                )}
                                            </span>
                                        </div>
                                        <div className="product-action flex justify-between items-center mt-auto">
                                            <button 
                                                onClick={() => navigate(`/seller/detail/${pet._id}`)}
                                                className="flex-1 bg-linear-to-r from-teal-500 to-teal-600 text-white py-2 px-3 rounded hover:from-teal-600 hover:to-teal-700 transition mr-2"
                                            >
                                                View Details
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isAuthenticated) {
                                                        alert('Please login to add items to wishlist');
                                                        return;
                                                    }
                                                    toggleWishlist(pet._id);
                                                }}
                                                className={`w-10 h-10 border border-gray-300 rounded-full transition flex items-center justify-center ${
                                                    isAuthenticated 
                                                        ? 'hover:border-red-500 hover:text-red-500' 
                                                        : 'cursor-not-allowed opacity-50'
                                                }`}
                                            >
                                                <i className={`${isAuthenticated && wishlist.includes(pet._id) ? 'fas' : 'far'} fa-heart ${
                                                    isAuthenticated && wishlist.includes(pet._id) ? 'text-red-500' : 'text-gray-600'
                                                }`}></i>
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

export default Pets;
