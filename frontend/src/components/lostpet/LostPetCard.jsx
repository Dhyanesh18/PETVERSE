import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';

const LostPetCard = ({ lostPet }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/lost-found/${lostPet._id}`);
    };

    const getImageUrl = (index = 0) => {
        if (!lostPet.images || lostPet.images.length === 0) {
            return '/images/default-pet.jpg';
        }
        
        const image = lostPet.images[index];
        
        // Handle string URLs (external URLs or stored paths)
        if (typeof image === 'string') {
            return image.startsWith('http') ? image : `http://localhost:8080/api/lost-pets/image/${lostPet._id}/${index}`;
        }
        
        // Handle object with url property
        if (typeof image === 'object' && image?.url) {
            return image.url.startsWith('http') ? image.url : `http://localhost:8080/api/lost-pets/image/${lostPet._id}/${index}`;
        }
        
        // Fallback: try to load from API endpoint (for MongoDB binary data)
        return `http://localhost:8080/api/lost-pets/image/${lostPet._id}/${index}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
        >
            {/* Status Badge */}
            <div className="relative">
                <div className="absolute top-3 right-3 z-10">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        lostPet.status === 'lost' ? 'bg-red-500 text-white' :
                        lostPet.status === 'found' ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                    }`}>
                        {lostPet.status.toUpperCase()}
                    </span>
                </div>
                
                {/* Image */}
                <div className="h-48 overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100">
                    <img
                        src={getImageUrl()}
                        alt={lostPet.petName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = '/images/default-pet.jpg';
                        }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{lostPet.petName}</h3>
                <p className="text-sm text-teal-600 font-medium mb-3">
                    {lostPet.petType} • {lostPet.breed}
                </p>

                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-teal-500" />
                        <span>{lostPet.lastSeenLocation.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-teal-500" />
                        <span>Last seen: {formatDate(lostPet.lastSeenDate)}</span>
                    </div>
                    {lostPet.rewardOffered && (
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-600 font-semibold">
                                💰 Reward: ₹{lostPet.rewardAmount}
                            </span>
                        </div>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                    className="w-full mt-4 bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-colors font-semibold"
                >
                    View Details
                </button>
            </div>
        </div>
    );
};

export default LostPetCard;
