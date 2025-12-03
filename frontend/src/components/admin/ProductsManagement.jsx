import React, { useState } from 'react';
import { deleteProduct } from '../../services/api';
import './DashboardComponents.css';

const ProductsManagement = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!data) return <div>Loading...</div>;

    const products = data.products || [];

    // Helper function to get full image URL
    const getImageUrl = (product) => {
        if (product.images && product.images.length > 0) {
            return `http://localhost:8080/api/products/image/${product._id}/0`;
        }
        return '/images/default-product.jpg';
    };

    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await deleteProduct(productId);
            alert('Product deleted!');
            window.location.reload();
        } catch (error) {
            alert('Failed to delete: ' + error.message);
        }
    };

    return (
        <div className="products-management">
            <div className="management-header">
                <h3>Products ({filteredProducts.length})</h3>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="products-grid-admin">
                {filteredProducts.map(product => (
                    <div key={product._id} className="product-card-admin">
                        <div className="product-image-admin">
                            <img 
                                src={getImageUrl(product)} 
                                alt={product.name} 
                                onError={(e) => e.target.src = '/images/default-product.jpg'} 
                            />
                        </div>
                        <div className="product-info-admin">
                            <h4>{product.name}</h4>
                            <p className="product-brand">{product.brand}</p>
                            <p className="product-price">₹{product.price?.toLocaleString()}</p>
                            <p className="product-stock">Stock: {product.stock}</p>
                            <div className="product-actions-admin">
                                <button className="action-btn delete-btn" onClick={() => handleDeleteProduct(product._id)}>
                                    <i className="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductsManagement;
