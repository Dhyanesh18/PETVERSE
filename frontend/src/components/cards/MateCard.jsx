import { FaMars, FaVenus, FaPaw, FaBirthdayCake, FaMapMarkerAlt, FaPhone, FaEnvelope, FaInfoCircle } from 'react-icons/fa';

const MateCard = ({ pet }) => {
    const getImageUrl = (index = 0) => {
        if (!pet || !pet._id) {
            return '/images/default-pet.jpg';
        }

        // Check if images array exists with binary data (like in mate.ejs)
        if (pet.images && pet.images.length > 0) {
            const image = pet.images[index];
            
            // If image has binary data and contentType (MongoDB storage)
            if (image && image.data && image.contentType) {
                // Convert buffer to base64 if needed
                const base64Data = image.data.toString ? image.data.toString('base64') : image.data;
                return `data:${image.contentType};base64,${base64Data}`;
            }
            
            // If image has dataBase64 property (from API)
            if (image && image.dataBase64 && image.contentType) {
                return `data:${image.contentType};base64,${image.dataBase64}`;
            }
            
            // If image is a string URL
            if (typeof image === 'string') {
                return image.startsWith('http') ? image : `http://localhost:8080${image}`;
            }
            
            // If image has url property
            if (image && image.url) {
                return image.url.startsWith('http') ? image.url : `http://localhost:8080${image.url}`;
            }
        }

        // Check if imageUrls array exists (alternative storage)
        if (pet.imageUrls && pet.imageUrls.length > 0) {
            const imageUrl = pet.imageUrls[index];
            
            if (typeof imageUrl === 'string') {
                return imageUrl.startsWith('http') ? imageUrl : `http://localhost:8080${imageUrl}`;
            }
        }

        // Fallback: try to load from API endpoint
        return `http://localhost:8080/api/mate/image/${pet._id}/${index}`;
    };

    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] h-full flex flex-col">
            <div className="relative h-[200px] overflow-hidden">
                <img 
                    src={getImageUrl(0)} 
                    alt={pet.name}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                        console.error('Failed to load pet mate image:', e.target.src);
                        console.error('Pet data:', pet);
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