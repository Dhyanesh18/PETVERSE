import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getPets } from '../services/api';

const Pets = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        breed: '',
        minPrice: '',
        maxPrice: '',
        age: '',
        gender: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        try {
            setLoading(true);
            const response = await getPets();
            setPets(response.data || []);
        } catch (error) {
            console.error('Failed to fetch pets:', error);
            // Fallback sample data when backend is not available
            setPets([
                {
                    _id: '1',
                    breed: 'Golden Retriever',
                    category: 'dog',
                    price: 25000,
                    age: '2 years',
                    gender: 'male',
                    description: 'Friendly and energetic Golden Retriever puppy. Great with kids and other pets.',
                    images: []
                },
                {
                    _id: '2',
                    breed: 'Persian Cat',
                    category: 'cat',
                    price: 15000,
                    age: '1 year',
                    gender: 'female',
                    description: 'Beautiful Persian cat with long silky fur. Very calm and affectionate.',
                    images: []
                },
                {
                    _id: '3',
                    breed: 'German Shepherd',
                    category: 'dog',
                    price: 30000,
                    age: '3 years',
                    gender: 'male',
                    description: 'Well-trained German Shepherd. Excellent guard dog and family companion.',
                    images: []
                },
                {
                    _id: '4',
                    breed: 'Siamese Cat',
                    category: 'cat',
                    price: 12000,
                    age: '6 months',
                    gender: 'female',
                    description: 'Playful Siamese kitten with beautiful blue eyes. Very social and vocal.',
                    images: []
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredPets = pets.filter(pet => {
        if (filters.category && pet.category !== filters.category) return false;
        if (filters.breed && !pet.breed.toLowerCase().includes(filters.breed.toLowerCase())) return false;
        if (filters.minPrice && pet.price < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && pet.price > parseFloat(filters.maxPrice)) return false;
        if (filters.age && pet.age !== filters.age) return false;
        if (filters.gender && pet.gender !== filters.gender) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Find Your Perfect Pet</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow-md h-fit">
                        <h2 className="text-xl font-bold mb-4">Filters</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Categories</option>
                                    <option value="dog">Dog</option>
                                    <option value="cat">Cat</option>
                                    <option value="bird">Bird</option>
                                    <option value="fish">Fish</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                                <input
                                    type="text"
                                    value={filters.breed}
                                    onChange={(e) => setFilters({...filters, breed: e.target.value})}
                                    placeholder="Search breed..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={filters.minPrice}
                                        onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                                        placeholder="Min"
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="number"
                                        value={filters.maxPrice}
                                        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                                        placeholder="Max"
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    value={filters.gender}
                                    onChange={(e) => setFilters({...filters, gender: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setFilters({ category: '', breed: '', minPrice: '', maxPrice: '', age: '', gender: '' })}
                                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Pets Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="text-2xl text-gray-600">Loading...</div>
                            </div>
                        ) : filteredPets.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-xl text-gray-600">No pets found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPets.map((pet) => (
                                    <div
                                        key={pet._id}
                                        onClick={() => navigate(`/seller/detail/${pet._id}`)}
                                        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                                    >
                                        <div className="h-64 overflow-hidden">
                                            {pet.images && pet.images.length > 0 ? (
                                                <img
                                                    src={`data:${pet.images[0].contentType};base64,${pet.images[0].data}`}
                                                    alt={pet.breed}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={
                                                        pet.category === 'dog' 
                                                            ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : pet.category === 'cat'
                                                            ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                    }
                                                    alt={pet.breed}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/400x300?text=' + pet.breed;
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">{pet.breed}</h3>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pet.description}</p>
                                            <div className="text-2xl font-bold text-indigo-600 mb-3">
                                                ₹{pet.price.toFixed(2)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                                <span className="flex items-center gap-1">
                                                    🎂 {pet.age}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {pet.gender === 'male' ? '♂️ Male' : '♀️ Female'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
                                                    View Details
                                                </button>
                                                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                                    ❤️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pets;
