import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FeaturedSection = ({ title, fetchFunction, CardComponent, viewAllLink }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadItems = async () => {
            try {
                setLoading(true);
                const response = await fetchFunction();
                setItems(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to load items. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, [fetchFunction]); // fetchFunction is not stable, should be wrapped in useCallback in parent if it causes re-renders

    if (error) return <div className="container"><p className="error-message">{error}</p></div>;
    if (loading) return <div className="container"><p>Loading...</p></div>;
    const RenderCard = CardComponent;
    return (
        <section className="feature-section">
            <div className="container">
                <h1 className="section-title">{title}</h1>
                <div className="item-grid">
                    {items.map(item => (
                        <RenderCard key={item._id} item={item} />
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link to={viewAllLink} className="view-all-btn">View All</Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedSection;