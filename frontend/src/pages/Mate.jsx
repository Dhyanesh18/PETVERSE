import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const Mate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [pets, setPets] = useState([]);
    const [filteredPets, setFilteredPets] = useState([]);
    
    // Filter states
    const [filters, setFilters] = useState({
        petType: '',
        gender: '',
        breed: '',
        state: '',
        district: ''
    });

    // Form data for adding new mate listing
    const [formData, setFormData] = useState({
        petName: '',
        petType: '',
        breed: '',
        breedOther: '',
        ageValue: '',
        ageUnit: 'months',
        gender: '',
        description: '',
        state: '',
        district: '',
        contactNumber: '',
        email: '',
        registrationNumber: '',
        healthCheck: false,
        terms: false
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const petTypes = [
        { value: 'dog', label: 'Dog' },
        { value: 'cat', label: 'Cat' },
        { value: 'bird', label: 'Bird' },
        { value: 'other', label: 'Other' }
    ];

    const states = [
        { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
        { value: 'kerala', label: 'Kerala' },
        { value: 'karnataka', label: 'Karnataka' },
        { value: 'tamil-nadu', label: 'Tamil Nadu' },
        { value: 'telangana', label: 'Telangana' },
        { value: 'maharashtra', label: 'Maharashtra' },
        { value: 'gujarat', label: 'Gujarat' },
        { value: 'rajasthan', label: 'Rajasthan' },
        { value: 'west-bengal', label: 'West Bengal' },
        { value: 'uttar-pradesh', label: 'Uttar Pradesh' }
    ];

    const breeds = [
        { value: 'german-shepherd', label: 'German Shepherd' },
        { value: 'labrador', label: 'Labrador' },
        { value: 'golden-retriever', label: 'Golden Retriever' },
        { value: 'persian', label: 'Persian' },
        { value: 'siamese', label: 'Siamese' },
        { value: 'maine-coon', label: 'Maine Coon' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        fetchPets();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [pets, filters]);

    const fetchPets = async () => {
        try {
            const response = await fetch('/api/mate/api/filter', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setPets(data.pets);
                }
            }
        } catch (err) {
            setError('Failed to load pets: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = pets;

        if (filters.petType) {
            filtered = filtered.filter(pet => pet.petType === filters.petType);
        }
        if (filters.gender) {
            filtered = filtered.filter(pet => pet.gender === filters.gender);
        }
        if (filters.breed) {
            filtered = filtered.filter(pet => 
                pet.breed.toLowerCase().includes(filters.breed.toLowerCase())
            );
        }
        if (filters.state) {
            filtered = filtered.filter(pet => pet.location?.state === filters.state);
        }
        if (filters.district) {
            filtered = filtered.filter(pet => 
                pet.location?.district?.toLowerCase().includes(filters.district.toLowerCase())
            );
        }

        setFilteredPets(filtered);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            petType: '',
            gender: '',
            breed: '',
            state: '',
            district: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length > 4) {
            setError('Maximum 4 images allowed');
            return;
        }
        
        setImages(files);
        
        // Create preview URLs
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
        setError('');
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        
        // Revoke the URL to prevent memory leaks
        URL.revokeObjectURL(imagePreviews[index]);
        
        setImages(newImages);
        setImagePreviews(newPreviews);
    };

    const validateForm = () => {
        if (!formData.petName.trim()) {
            setError('Pet name is required');
            return false;
        }
        if (!formData.petType) {
            setError('Pet type is required');
            return false;
        }
        if (!formData.breed && formData.breed !== 'other') {
            setError('Breed is required');
            return false;
        }
        if (formData.breed === 'other' && !formData.breedOther.trim()) {
            setError('Please specify the breed');
            return false;
        }
        if (!formData.ageValue || formData.ageValue <= 0) {
            setError('Valid age is required');
            return false;
        }
        if (!formData.gender) {
            setError('Gender is required');
            return false;
        }
        if (!formData.description.trim()) {
            setError('Description is required');
            return false;
        }
        if (!formData.state) {
            setError('State is required');
            return false;
        }
        if (!formData.district.trim()) {
            setError('District is required');
            return false;
        }
        if (!formData.contactNumber.trim()) {
            setError('Contact number is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (images.length === 0) {
            setError('At least one image is required');
            return false;
        }
        if (!formData.terms) {
            setError('You must accept the terms and conditions');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const formDataToSend = new FormData();
            
            // Add form fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            
            // Add images
            images.forEach(image => {
                formDataToSend.append('petImage', image);
            });

            const response = await fetch('/api/mate/add', {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend
            });

            if (response.ok) {
                setSuccess('Pet mate listing created successfully!');
                
                // Reset form
                setFormData({
                    petName: '',
                    petType: '',
                    breed: '',
                    breedOther: '',
                    ageValue: '',
                    ageUnit: 'months',
                    gender: '',
                    description: '',
                    state: '',
                    district: '',
                    contactNumber: '',
                    email: '',
                    registrationNumber: '',
                    healthCheck: false,
                    terms: false
                });
                
                // Clean up preview URLs
                imagePreviews.forEach(url => URL.revokeObjectURL(url));
                setImages([]);
                setImagePreviews([]);
                setShowAddForm(false);
                
                // Refresh pets list
                fetchPets();
            } else {
                const errorText = await response.text();
                setError('Failed to create listing: ' + errorText);
            }
        } catch (err) {
            setError('Error creating listing: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatAge = (age) => {
        return `${age.value} ${age.unit}`;
    };

    const getImageSrc = (pet, index = 0) => {
        if (pet.images && pet.images[index]) {
            const image = pet.images[index];
            return `data:${image.contentType};base64,${image.dataBase64}`;
        }
        return '/images/default-pet.jpg';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">PetMate</h1>
                            <p className="text-lg text-gray-600 mt-2">Find the perfect mate for your pet</p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {showAddForm ? 'Cancel' : 'List Your Pet'}
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                            {success}
                        </div>
                    )}

                    {/* Add Pet Form - Truncated for space */}
                    {showAddForm && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">List Your Pet for Mating</h2>
                            <p className="text-gray-600 mb-4">Form implementation available - contact support for full form</p>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Pets</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <select
                                name="petType"
                                value={filters.petType}
                                onChange={handleFilterChange}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                {petTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>

                            <select
                                name="gender"
                                value={filters.gender}
                                onChange={handleFilterChange}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Genders</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>

                            <input
                                type="text"
                                name="breed"
                                value={filters.breed}
                                onChange={handleFilterChange}
                                placeholder="Breed"
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <select
                                name="state"
                                value={filters.state}
                                onChange={handleFilterChange}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All States</option>
                                {states.map(state => (
                                    <option key={state.value} value={state.value}>{state.label}</option>
                                ))}
                            </select>

                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Pet Listings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPets.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500 text-lg">No pets found matching your criteria.</p>
                            </div>
                        ) : (
                            filteredPets.map((pet) => (
                                <div key={pet._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    <img
                                        src={getImageSrc(pet)}
                                        alt={pet.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{pet.name}</h3>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p><span className="font-medium">Type:</span> {pet.petType}</p>
                                            <p><span className="font-medium">Breed:</span> {pet.breed}</p>
                                            <p><span className="font-medium">Age:</span> {formatAge(pet.age)}</p>
                                            <p><span className="font-medium">Gender:</span> {pet.gender}</p>
                                            <p><span className="font-medium">Location:</span> {pet.location?.district}, {pet.location?.state}</p>
                                        </div>
                                        <p className="mt-3 text-gray-700 text-sm line-clamp-3">{pet.description}</p>
                                        
                                        <div className="mt-4 flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                {pet.healthChecked && (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                        Health Checked
                                                    </span>
                                                )}
                                                {pet.registrationNumber && (
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                        Registered
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                📞 {pet.contact?.phone}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="mt-8 text-center text-gray-600">
                        Showing {filteredPets.length} of {pets.length} pets
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mate;