import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaPaw } from 'react-icons/fa';

const Signup = () => {
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const profiles = [
        {
            type: 'owner',
            name: 'Pet Owner',
            image: '/images/profiles/pet_owner.jpg',
            route: '/signup/owner'
        },
        {
            type: 'seller',
            name: 'Seller',
            image: '/images/profiles/service.jpg',
            route: '/signup/seller'
        },
        {
            type: 'service',
            name: 'Service Provider',
            image: '/images/profiles/seller.jpg',
            route: '/signup/service-provider'
        }
    ];

    const handleProfileSelect = (profile) => {
        setSelectedProfile(profile.type);
        setError('');
    };

    const handleContinue = (e) => {
        e.preventDefault();
        if (!selectedProfile) {
            setError('Please select a profile type to continue');
            return;
        }
        const profile = profiles.find(p => p.type === selectedProfile);
        navigate(profile.route);
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
            style={{ backgroundImage: "url('/images/login/LOGIN_CROP.jpg')" }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>

            {/* Content */}
            <div className="relative z-10 text-center w-full max-w-6xl px-4">
                {/* Logo */}
                <h1 className="text-5xl font-bold mb-8 text-white flex items-center justify-center gap-2">
                    <FaPaw /> PetVerse
                </h1>

                {/* Title */}
                <h2 className="text-3xl font-semibold text-white mb-12">
                    Who are you joining as?
                </h2>

                {/* Error Message */}
                {error && (
                    <div className="max-w-lg mx-auto mb-8 bg-red-500 bg-opacity-80 text-white px-5 py-4 rounded-lg animate-fadeIn">
                        <button 
                            onClick={() => setError('')}
                            className="float-right font-bold text-xl cursor-pointer hover:text-gray-200"
                        >
                            &times;
                        </button>
                        {error}
                    </div>
                )}

                {/* Profiles Container */}
                <div className="flex justify-center gap-8 flex-wrap mb-12">
                    {profiles.map((profile) => (
                        <div
                            key={profile.type}
                            onClick={() => handleProfileSelect(profile)}
                            className={`cursor-pointer transition-all duration-300 w-52 transform ${
                                selectedProfile === profile.type
                                    ? 'scale-105'
                                    : 'scale-100 hover:scale-105'
                            }`}
                        >
                            <img
                                src={profile.image}
                                alt={profile.name}
                                className={`w-full h-52 rounded-xl object-cover mb-4 transition-all duration-300 ${
                                    selectedProfile === profile.type
                                        ? 'border-4 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)]'
                                        : 'border-4 border-transparent hover:border-white hover:shadow-[0_0_10px_rgba(0,0,0,0.5)]'
                                }`}
                            />
                            <div className="text-2xl font-medium text-white mb-2">
                                {profile.name}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleContinue}
                    className="w-full max-w-xs mx-auto block py-3.5 bg-linear-to-br from-teal-600 to-gray-800 text-white rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_15px_rgba(38,70,83,0.2)]"
                >
                    Continue
                </button>

                {/* Login Link */}
                <div className="mt-8 text-gray-400">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-white no-underline font-medium hover:underline"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
