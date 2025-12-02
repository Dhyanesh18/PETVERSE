import React from 'react';
import { useNavigate } from 'react-router-dom';

const LostPetCard = ({ lostPet }) => {
    const navigate = useNavigate();

    const getStatusColor = (status) => {
        switch (status) {
            case 'lost': return 'bg-red-100 text-red-800';
            case 'found': return 'bg-yellow-100 text-yellow-800';
            case 'reunited': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getImageUrl = () => {
        if (lostPet.images && lostPet.images.length > 0) {
            return `http://localhost:8080/api/lost-pets/image/${lostPet._id}/0`;
        }
        return '/images/default-pet.jpg';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div
            onClick={() => navigate(`/lost-found/${lostPet._id}`)}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        >
            {/* Image */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={getImageUrl()}
                    alt={lostPet.petName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = '/images/default-pet.jpg';
                    }}
                />
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lostPet.status)}`}>
                        {lostPet.status.toUpperCase()}
                    </span>
                </div>
                {lostPet.distance && (
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-sm font-semibold text-teal-600">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {lostPet.distance} km away
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{lostPet.petName}</h3>
                        <p className="text-sm text-gray-600">{lostPet.breed} • {lostPet.petType}</p>
                    </div>
                    <div className="text-right">
                        <i className={`fas fa-${lostPet.gender === 'male' ? 'mars' : 'venus'} text-2xl ${lostPet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}></i>
                    </div>
                </div>

                {/* Last Seen Info */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <i className="fas fa-clock mr-2 text-teal-600"></i>
                        Last seen: {formatDate(lostPet.lastSeenDate)}
                    </div>
                    <div className="flex items-start text-sm text-gray-600">
                        <i className="fas fa-map-marker-alt mr-2 text-teal-600 mt-0.5"></i>
                        <span className="line-clamp-1">{lostPet.lastSeenLocation.address}, {lostPet.lastSeenLocation.city}</span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 line-clamp-2 mb-4">
                    {lostPet.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    {lostPet.rewardOffered && (
                        <div className="flex items-center text-green-600 font-semibold text-sm">
                            <i className="fas fa-gift mr-1"></i>
                            Reward: ₹{lostPet.rewardAmount}
                        </div>
                    )}
                    <div className="flex items-center text-gray-500 text-sm ml-auto">
                        <i className="fas fa-eye mr-1"></i>
                        {lostPet.views} views
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LostPetCard;
