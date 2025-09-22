import { Link } from "react-router-dom";

const PetCard = ({ pet }) => {
    const hasImages = pet.images && pet.images.length > 0;
    const firstImage = hasImages ? pet.images[0] : null;
    return (
        <div className="pet-card">
            {hasImages ? (
                <img
                src={`data:${firstImage.contentType};base64,${firstImage.data}`}
                alt={pet.name}
                className="pet-image"
                />
            ) : (
                <p>No images available</p>
            )}

            <p className="price">
                <strong>₹ {pet.price}</strong>
            </p>

            <Link to="/pets" className="card-button">
                Buy Now
            </Link>
        </div>
    );
};

export default PetCard;
