import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
    const hasImages = product.images && product.images.length > 0;
    const firstImage = hasImages ? product.images[0] : null;
    return (
        <div className="product-card">
            {hasImages ? (
                <img src={`data:${firstImage.contentType};base64,${firstImage.data}`}
                alt={product.name}
                className="product-image"
                />
            ) : (<p>No images available</p>)}
            <p className="price">
                <strong>₹ {product.price}</strong>
            </p>
            <Link to="/products" className="card-button">
                Buy Now
            </Link>
        </div>
    );
};


export default ProductCard;