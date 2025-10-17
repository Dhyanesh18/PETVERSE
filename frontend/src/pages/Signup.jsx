import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [selectedProfile, setSelectedProfile] = useState('');
    const navigate = useNavigate();

    const profiles = [
        {
            id: 'owner',
            name: 'Pet Owner',
            description: 'Find and adopt pets, buy products',
            image: '/images/login/owner.jpg',
            route: '/signup-owner'
        },
        {
            id: 'seller',
            name: 'Pet Seller',
            description: 'Sell pets and pet products',
            image: '/images/login/seller.jpg',
            route: '/signup-seller'
        },
        {
            id: 'service',
            name: 'Service Provider',
            description: 'Offer pet care services',
            image: '/images/login/service.jpg',
            route: '/signup-service'
        }
    ];

    const handleContinue = () => {
        const profile = profiles.find(p => p.id === selectedProfile);
        if (profile) {
            navigate(profile.route);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4 relative">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            
            <div className="relative z-10 text-center w-full max-w-6xl">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                    <span className="text-6xl">🐾</span> PetVerse
                </h1>
                
                <h2 className="text-3xl md:text-4xl text-white mb-12 font-semibold">
                    Choose Your Profile
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => setSelectedProfile(profile.id)}
                            className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                                selectedProfile === profile.id ? 'scale-105' : ''
                            }`}
                        >
                            <div className={`bg-white rounded-2xl overflow-hidden shadow-2xl ${
                                selectedProfile === profile.id ? 'ring-4 ring-white' : ''
                            }`}>
                                <div className="h-56 overflow-hidden">
                                    <img
                                        src={profile.image}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=' + profile.name;
                                        }}
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                        {profile.name}
                                    </h3>
                                    <p className="text-gray-600">{profile.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <button
                    onClick={handleContinue}
                    disabled={!selectedProfile}
                    className={`px-12 py-4 text-xl font-bold rounded-full transition-all duration-300 ${
                        selectedProfile
                            ? 'bg-white text-purple-600 hover:bg-gray-100 shadow-2xl hover:shadow-3xl'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                >
                    Continue
                </button>
                
                <p className="mt-6 text-white text-lg">
                    Already have an account?{' '}
                    <a href="/login" className="font-bold underline hover:text-gray-200">
                        Sign In
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Signup;
