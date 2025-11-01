import { Link } from "react-router-dom";

const ItemCard = ({ item, type }) => {
    const hasImages = item.images && item.images.length > 0;
    const firstImage = hasImages ? item.images[0] : null;

    const detailLink = `/${type}s/${item._id}`;

    const cardClass = `${type}-card`;

    return (
        <div className={cardClass}>
            {hasImages ? (
                <img
                    src={`data:${firstImage.contentType};base64,${firstImage.data}`}
                    alt={item.name}
                    className={`${type}-image`}
                />
            ) : (
                <div className="no-image-placeholder">
                    <p>No image available</p>
                </div>
            )}

            <h3 className="item-name">{item.name}</h3>

            <p className="price">
                <strong>₹ {item.price}</strong>
            </p>

            <Link to={detailLink} className="card-button">
                View Details
            </Link>
        </div>
    );
};

export default ItemCard;