import { FaMars, FaVenus, FaPaw, FaBirthdayCake, FaMapMarkerAlt, FaPhone, FaEnvelope, FaInfoCircle } from 'react-icons/fa';

const MateCard = ({ pet }) => {
    const getImageSrc = () => {
        if (pet.imageUrls && pet.imageUrls.length > 0) {
            return `http://localhost:8080${pet.imageUrls[0]}`;
        }
        return '/images/default-pet.jpg';
    };

    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] h-full flex flex-col">
            <div className="relative h-[200px] overflow-hidden">
                <img 
                    src={getImageSrc()} 
                    alt={pet.name}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                        e.target.src = '/images/default-pet.jpg';
                    }}
                />
                <div className={`absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-full text-white font-bold ${
                    pet.gender === 'male' ? 'bg-[#4a90e2]' : 'bg-[#e25c8b]'
                }`}>
                    {pet.gender === 'male' ? <FaMars className="inline" /> : <FaVenus className="inline" />}
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-xl text-gray-800 mb-2.5 font-semibold">{pet.name}</h3>
                <div className="mb-4 flex-1">
                    <p className="mb-2 text-gray-600 text-sm">
                        <FaPaw className="inline mr-1.5 text-teal-500" /> 
                        <strong>Breed:</strong> {pet.breed}
                    </p>
                    <p className="mb-2 text-gray-600 text-sm">
                        <FaBirthdayCake className="inline mr-1.5 text-teal-500" /> 
                        <strong>Age:</strong> {pet.age.value} {pet.age.unit}
                    </p>
                    <p className="mb-2 text-gray-600 text-sm">
                        <FaMapMarkerAlt className="inline mr-1.5 text-teal-500" /> 
                        <strong>Location:</strong> {pet.location.district}, {pet.location.state}
                    </p>
                    <p className="mb-2 text-gray-600 text-sm">
                        <FaPhone className="inline mr-1.5 text-teal-500" /> 
                        <strong>Contact:</strong> {pet.contact.phone}
                    </p>
                    <p className="mb-2 text-gray-600 text-sm">
                        <FaEnvelope className="inline mr-1.5 text-teal-500" /> 
                        <strong>Email:</strong> {pet.contact.email}
                    </p>
                    {pet.description && (
                        <p className="italic mt-2.5 text-gray-500 text-sm">
                            <FaInfoCircle className="inline mr-1.5" /> {pet.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MateCard;