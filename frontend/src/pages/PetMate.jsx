import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaHeart, FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import MateCard from '../components/cards/MateCard';

// Reusable Components


const FilterSection = ({ title, children }) => {
    return (
        <div className="mb-5">
            <h3 className="text-gray-600 text-lg mb-2.5">{title}</h3>
            <div className="flex flex-col gap-2">
                {children}
            </div>
        </div>
    );
};

const FilterCheckbox = ({ id, name, value, label, checked, onChange }) => {
    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                id={id}
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                className="mr-2 cursor-pointer"
            />
            <label htmlFor={id} className="text-sm text-gray-600 cursor-pointer">{label}</label>
        </div>
    );
};

const AlertMessage = ({ type, message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div 
            className={`${type === 'success' ? 'bg-[#4CAF50]' : 'bg-[#f44336]'} text-white p-4 rounded-md mb-5 text-center flex items-center justify-center`}
        >
            {type === 'success' ? 
                <FaCheckCircle className="text-2xl mr-2.5" /> : 
                <FaExclamationCircle className="text-2xl mr-2.5" />
            }
            <strong className="mr-1">{type === 'success' ? 'Success!' : 'Error!'}</strong> {message}
        </div>
    );
};

const PetMate = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterOptions, setFilterOptions] = useState({
        petTypes: [],
        genders: [],
        breeds: [],
        states: []
    });
    
    // Filter states
    const [selectedPetTypes, setSelectedPetTypes] = useState([]);
    const [selectedGenders, setSelectedGenders] = useState([]);
    const [selectedBreeds, setSelectedBreeds] = useState([]);
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    
    // Form states
    const [formData, setFormData] = useState({
        petName: '',
        petType: '',
        breed: '',
        ageValue: '',
        ageUnit: '',
        gender: '',
        registrationNumber: '',
        state: '',
        district: '',
        description: '',
        contactNumber: '',
        email: '',
        healthCheck: false,
        terms: false
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [fileInfo, setFileInfo] = useState('No files chosen (Max 4 images)');
    const [submitting, setSubmitting] = useState(false);
    
    // Alert state
    const [alert, setAlert] = useState(null);

    // Fetch filter options on mount
    useEffect(() => {
        fetchFilterOptions();
    }, []);

    // Fetch pets when filters change
    useEffect(() => {
        fetchPets();
    }, [selectedPetTypes, selectedGenders, selectedBreeds, selectedState, selectedDistrict]);

    // Handle URL messages
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        
        if (success === 'true') {
            setAlert({ type: 'success', message: 'Your pet has been listed for mating.' });
            searchParams.delete('success');
            setSearchParams(searchParams);
        }
        
        if (error) {
            setAlert({ type: 'error', message: decodeURIComponent(error) });
            searchParams.delete('error');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    const fetchFilterOptions = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/mate/filter-options');
            const data = await response.json();
            
            if (data.success) {
                setFilterOptions(data.data);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const fetchPets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedPetTypes.length > 0) params.append('petType', selectedPetTypes.join(','));
            if (selectedGenders.length > 0) params.append('gender', selectedGenders.join(','));
            if (selectedBreeds.length > 0) params.append('breed', selectedBreeds.join(','));
            if (selectedState) params.append('state', selectedState);
            if (selectedDistrict) params.append('district', selectedDistrict);

            const response = await fetch(`http://localhost:8080/api/mate?${params.toString()}`);
            const data = await response.json();
            
            if (data.success) {
                setPets(data.data.pets);
            }
        } catch (error) {
            console.error('Error fetching pets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType, value, checked) => {
        switch (filterType) {
            case 'petType':
                setSelectedPetTypes(prev => 
                    checked ? [...prev, value] : prev.filter(v => v !== value)
                );
                break;
            case 'gender':
                setSelectedGenders(prev => 
                    checked ? [...prev, value] : prev.filter(v => v !== value)
                );
                break;
            case 'breed':
                setSelectedBreeds(prev => 
                    checked ? [...prev, value] : prev.filter(v => v !== value)
                );
                break;
            default:
                break;
        }
    };

    const clearAllFilters = () => {
        setSelectedPetTypes([]);
        setSelectedGenders([]);
        setSelectedBreeds([]);
        setSelectedState('');
        setSelectedDistrict('');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length > 4) {
            setFileInfo('Maximum 4 images allowed');
            setSelectedFiles([]);
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        let errorMessage = '';
        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                errorMessage = `${file.name} is not a valid image format.`;
                break;
            }
            if (file.size > maxSize) {
                errorMessage = `${file.name} is too large. Maximum size is 5MB.`;
                break;
            }
        }
        
        if (errorMessage) {
            setFileInfo(errorMessage);
            setSelectedFiles([]);
        } else {
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            setFileInfo(`${files.length} file(s) selected (${totalSizeMB} MB)`);
            setSelectedFiles(files);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedFiles.length === 0) {
            setAlert({ type: 'error', message: 'At least one image is required' });
            return;
        }

        setSubmitting(true);
        
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            
            selectedFiles.forEach(file => {
                formDataToSend.append('petImage', file);
            });

            const response = await fetch('http://localhost:8080/api/mate/add', {
                method: 'POST',
                body: formDataToSend,
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                setAlert({ type: 'success', message: 'Mate listing created successfully!' });
                // Reset form
                setFormData({
                    petName: '',
                    petType: '',
                    breed: '',
                    ageValue: '',
                    ageUnit: '',
                    gender: '',
                    registrationNumber: '',
                    state: '',
                    district: '',
                    description: '',
                    contactNumber: '',
                    email: '',
                    healthCheck: false,
                    terms: false
                });
                setSelectedFiles([]);
                setFileInfo('No files chosen (Max 4 images)');
                // Refresh pets list
                fetchPets();
            } else {
                setAlert({ type: 'error', message: data.error || 'Failed to create listing' });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setAlert({ type: 'error', message: 'Error submitting form. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-['Poppins',sans-serif]">
            <br />
            
            {/* Disclaimer */}
            <div className="bg-[#fef0be] text-[#795b00] border border-[#ebbd35] p-3 mx-4 md:mx-12 mb-8 rounded-md text-sm text-center mt-24">
                <p className="m-0">
                    ⚠️ Disclaimer: PetVerse provides this platform to connect pet owners and registered breeders. 
                    We do not guarantee the health, behavior, or safety of pets listed. 
                    Users should exercise caution and follow local regulations when arranging meetups or bookings.
                </p>
            </div>

            {/* Main Container */}
            <div className="flex flex-col lg:flex-row max-w-[1400px] mx-auto gap-5 px-4 my-5">
                {/* Filters Sidebar */}
                <div className="lg:flex-[0_0_280px] bg-white rounded-lg p-5 shadow-[0_2px_10px_rgba(0,0,0,0.1)] h-fit lg:sticky lg:top-5">
                    <h2 className="text-gray-800 mb-5 text-2xl pb-2.5 border-b border-gray-200">Find the Perfect Match</h2>
                    
                    {/* Pet Type Filter */}
                    <FilterSection title="Pet Type">
                        {filterOptions.petTypes.map(type => (
                            <FilterCheckbox
                                key={type.value}
                                id={`type-${type.value}`}
                                name="petType"
                                value={type.value}
                                label={type.label}
                                checked={selectedPetTypes.includes(type.value)}
                                onChange={(e) => handleFilterChange('petType', type.value, e.target.checked)}
                            />
                        ))}
                    </FilterSection>
                    
                    {/* Gender Filter */}
                    <FilterSection title="Gender">
                        {filterOptions.genders.map(gender => (
                            <FilterCheckbox
                                key={gender.value}
                                id={`gender-${gender.value}`}
                                name="gender"
                                value={gender.value}
                                label={gender.label}
                                checked={selectedGenders.includes(gender.value)}
                                onChange={(e) => handleFilterChange('gender', gender.value, e.target.checked)}
                            />
                        ))}
                    </FilterSection>
                    
                    {/* Breed Filter */}
                    <FilterSection title="Breed">
                        {filterOptions.breeds.slice(0, 10).map(breed => (
                            <FilterCheckbox
                                key={breed.value}
                                id={`breed-${breed.value}`}
                                name="breed"
                                value={breed.value}
                                label={breed.label}
                                checked={selectedBreeds.includes(breed.value)}
                                onChange={(e) => handleFilterChange('breed', breed.value, e.target.checked)}
                            />
                        ))}
                    </FilterSection>
                    
                    {/* State Filter */}
                    <FilterSection title="State">
                        <select 
                            id="state-filter" 
                            name="state"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded text-sm outline-none focus:border-teal-500"
                        >
                            <option value="">Select State</option>
                            {filterOptions.states.map(state => (
                                <option key={state.value} value={state.value}>
                                    {state.label}
                                </option>
                            ))}
                        </select>
                    </FilterSection>
                    
                    {/* District Filter */}
                    <FilterSection title="District">
                        <input 
                            type="text" 
                            id="district-filter" 
                            name="district"
                            placeholder="Enter district name"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded text-sm outline-none focus:border-teal-500"
                        />
                    </FilterSection>
                    
                    <div className="flex justify-between mt-5 gap-2.5">
                        <button 
                            onClick={clearAllFilters}
                            className="w-full py-2.5 px-5 border-none rounded bg-[#ff4c4c] text-white font-bold cursor-pointer transition-colors duration-300 hover:bg-[#f98787]"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>

                {/* Pets Display Area */}
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-2.5">
                        <h1 className="text-gray-800 text-3xl font-semibold m-0">Pet Mating Listings</h1>
                    </div>

                    {/* Pets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {loading ? (
                            <div className="text-center py-10 col-span-full">
                                <FaSpinner className="inline animate-spin text-3xl mb-2" />
                                <p>Loading pets...</p>
                            </div>
                        ) : pets.length > 0 ? (
                            pets.map(pet => <MateCard key={pet._id} pet={pet} />)
                        ) : (
                            <div className="text-center py-10 col-span-full">
                                <p>No pets match your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Horizontal Rule */}
            <hr className="border-none h-px bg-gray-300 w-[90%] mx-auto my-12 mt-16" />

            {/* Mate Submission Form */}
            <div className="bg-[#fcf7fc] py-10 px-5 my-12 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] max-w-[1400px] mx-auto">
                {alert && (
                    <AlertMessage 
                        type={alert.type} 
                        message={alert.message} 
                        onClose={() => setAlert(null)} 
                    />
                )}
                
                <div className="text-center mb-8">
                    <h2 className="text-[#e91e63] text-3xl mb-2.5 font-semibold">
                        <FaHeart className="inline mr-2.5" /> List Your Pet for Mating
                    </h2>
                    <p className="text-gray-500 text-base">Help your pet find the perfect match in the PetVerse community</p>
                </div>
                
                <form className="max-w-[1000px] mx-auto" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="mb-5">
                            <label htmlFor="pet-name" className="block mb-2 font-semibold text-gray-600">
                                Pet Name <span className="text-[#e91e63]">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="pet-name" 
                                name="petName" 
                                value={formData.petName}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63]"
                                required 
                            />
                        </div>
                        
                        <div className="mb-5">
                            <label htmlFor="pet-type" className="block mb-2 font-semibold text-gray-600">
                                Pet Type <span className="text-[#e91e63]">*</span>
                            </label>
                            <select 
                                id="pet-type" 
                                name="petType"
                                value={formData.petType}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-position-[right_10px_center] bg-size-[20px]"
                                required
                            >
                                <option value="">Select Pet Type</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                                <option value="bird">Bird</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div className="mb-5">
                            <label htmlFor="pet-breed" className="block mb-2 font-semibold text-gray-600">
                                Breed <span className="text-[#e91e63]">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="pet-breed" 
                                name="breed"
                                value={formData.breed}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63]"
                                required 
                            />
                        </div>
                        
                        <div className="mb-5">
                            <label htmlFor="pet-age-value" className="block mb-2 font-semibold text-gray-600">
                                Age <span className="text-[#e91e63]">*</span>
                            </label>
                            <div className="flex gap-2.5">
                                <input 
                                    type="number" 
                                    id="pet-age-value" 
                                    name="ageValue"
                                    placeholder="Enter age"
                                    min="0"
                                    step="0.1"
                                    value={formData.ageValue}
                                    onChange={handleInputChange}
                                    className="flex-2 p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63]"
                                    required
                                />
                                <select 
                                    id="pet-age-unit" 
                                    name="ageUnit"
                                    value={formData.ageUnit}
                                    onChange={handleInputChange}
                                    className="flex-1 p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-position-[right_10px_center] bg-size-[:20px]"
                                    required
                                >
                                    <option value="">Unit</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="mb-5">
                            <label className="block mb-2 font-semibold text-gray-600">
                                Gender <span className="text-[#e91e63]">*</span>
                            </label>
                            <div className="flex items-center gap-5">
                                <div className="flex items-center">
                                    <input 
                                        type="radio" 
                                        id="male" 
                                        name="gender" 
                                        value="male"
                                        checked={formData.gender === 'male'}
                                        onChange={handleInputChange}
                                        className="mr-2 cursor-pointer"
                                        required 
                                    />
                                    <label htmlFor="male" className="cursor-pointer">Male</label>
                                </div>
                                <div className="flex items-center">
                                    <input 
                                        type="radio" 
                                        id="female" 
                                        name="gender" 
                                        value="female"
                                        checked={formData.gender === 'female'}
                                        onChange={handleInputChange}
                                        className="mr-2 cursor-pointer"
                                    />
                                    <label htmlFor="female" className="cursor-pointer">Female</label>
                                </div>
                            </div>
                        </div>

                        <div className="mb-5">
                            <label htmlFor="pet-registration" className="block mb-2 font-semibold text-gray-600">
                                Registration Number (if any)
                            </label>
                            <input 
                                type="text" 
                                id="pet-registration" 
                                name="registrationNumber"
                                value={formData.registrationNumber}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63]"
                            />
                        </div>
                        
                        <div className="mb-5">
                            <label htmlFor="state" className="block mb-2 font-semibold text-gray-600">
                                State <span className="text-[#e91e63]">*</span>
                            </label>
                            <select 
                                id="state" 
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-position-[right_10px_center] bg-size-[20px]"
                                required
                            >
                                <option value="">Select State</option>
                                {filterOptions.states.map(state => (
                                    <option key={state.value} value={state.value}>
                                        {state.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="mb-5">
                            <label htmlFor="district" className="block mb-2 font-semibold text-gray-600">
                                District <span className="text-[#e91e63]">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="district" 
                                name="district"
                                value={formData.district}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63]"
                                required 
                            />
                        </div>
                        
                        <div className="mb-5 md:col-span-2">
                            <label htmlFor="pet-description" className="block mb-2 font-semibold text-gray-600">
                                Description <span className="text-[#e91e63]">*</span>
                            </label>
                            <textarea 
                                id="pet-description" 
                                name="description" 
                                rows="4"
                                placeholder="Describe your pet's personality, health, past breeding history, and any specific preferences for a mate."
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63] resize-y"
                                required
                            />
                        </div>
                        
                        <div className="mb-5 md:col-span-2">
                            <label htmlFor="pet-image" className="block mb-2 font-semibold text-gray-600">
                                Upload Pet Images <span className="text-[#e91e63]">*</span>
                            </label>
                            <div className="flex flex-col items-start">
                                <input 
                                    type="file" 
                                    id="pet-image" 
                                    name="petImage" 
                                    accept="image/*" 
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    required 
                                />
                                <label 
                                    htmlFor="pet-image" 
                                    className="inline-block py-3 px-5 bg-[#e91e63] text-white rounded-md cursor-pointer font-normal transition-colors duration-300 hover:bg-[#d81b60]"
                                >
                                    <FaCloudUploadAlt className="inline mr-2" /> Choose Files
                                </label>
                                <span className="mt-2 text-gray-500 text-sm">{fileInfo}</span>
                            </div>
                        </div>
                        
                        <div className="mb-5">
                            <label htmlFor="owner-contact" className="block mb-2 font-semibold text-gray-600">
                                Contact Number <span className="text-[#e91e63]">*</span>
                            </label>
                            <input 
                                type="tel" 
                                id="owner-contact" 
                                name="contactNumber"
                                value={formData.contactNumber}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63]"
                                required 
                            />
                        </div>
                        
                        <div className="mb-5">
                            <label htmlFor="owner-email" className="block mb-2 font-semibold text-gray-600">
                                Email <span className="text-[#e91e63]">*</span>
                            </label>
                            <input 
                                type="email" 
                                id="owner-email" 
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-md text-base outline-none focus:border-[#e91e63]"
                                required 
                            />
                        </div>
                        
                        <div className="mb-5 md:col-span-2">
                            <div className="flex items-start gap-2.5">
                                <input 
                                    type="checkbox" 
                                    id="health-check" 
                                    name="healthCheck"
                                    checked={formData.healthCheck}
                                    onChange={handleInputChange}
                                    className="mt-1 cursor-pointer"
                                    required 
                                />
                                <label htmlFor="health-check" className="text-gray-600 cursor-pointer">
                                    I confirm my pet is healthy and has all necessary vaccinations <span className="text-[#e91e63]">*</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="mb-5 md:col-span-2">
                            <div className="flex items-start gap-2.5">
                                <input 
                                    type="checkbox" 
                                    id="terms" 
                                    name="terms"
                                    checked={formData.terms}
                                    onChange={handleInputChange}
                                    className="mt-1 cursor-pointer"
                                    required 
                                />
                                <label htmlFor="terms" className="text-gray-600 cursor-pointer">
                                    I agree to PetVerse's <a href="/terms" className="text-[#e91e63] hover:underline">Terms & Conditions</a> <span className="text-[#e91e63]">*</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="block w-full max-w-[300px] mx-auto mt-8 py-3.5 px-5 bg-[#e91e63] text-white border-none rounded-md text-lg font-semibold cursor-pointer transition-colors duration-300 hover:bg-[#c2185b] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <FaSpinner className="inline animate-spin mr-2" /> Submitting...
                            </>
                        ) : (
                            'List Your Pet for Mating'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PetMate;