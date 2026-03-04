import React, { useState } from 'react';
import './DashboardComponents.css';

const RejectedApplications = ({ data }) => {
    const [filterType, setFilterType] = useState('all'); // 'all', 'users', 'items'
    
    if (!data) return <div>Loading...</div>;

    const rejectedUsers = (data.rejectedApplications || []).map(user => ({ ...user, type: 'user' }));
    const rejectedItems = [
        ...(data.rejectedPets || []).map(pet => ({ ...pet, type: 'pet' })),
        ...(data.rejectedProducts || []).map(product => ({ ...product, type: 'product' })),
        ...(data.rejectedServices || []).map(service => ({ ...service, type: 'service' }))
    ];

    // Combine all rejected items
    const allRejected = [...rejectedUsers, ...rejectedItems];

    // Apply filter
    const filteredItems = filterType === 'all' 
        ? allRejected 
        : filterType === 'users' 
            ? rejectedUsers 
            : rejectedItems;

    const getTypeColor = (type) => {
        const colors = { 
            user: 'teal',
            pet: 'pink', 
            product: 'orange', 
            service: 'purple' 
        };
        return colors[type] || 'gray';
    };

    return (
        <div className="rejected-applications">
            <div className="applications-header">
                <h3>Rejected Applications ({filteredItems.length})</h3>
                <p className="applications-subtitle">Applications that were not approved</p>
                
                {/* Filter Buttons */}
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        <i className="fas fa-list"></i> All ({allRejected.length})
                    </button>
                    <button 
                        className={`filter-btn ${filterType === 'users' ? 'active' : ''}`}
                        onClick={() => setFilterType('users')}
                    >
                        <i className="fas fa-users"></i> Users ({rejectedUsers.length})
                    </button>
                    <button 
                        className={`filter-btn ${filterType === 'items' ? 'active' : ''}`}
                        onClick={() => setFilterType('items')}
                    >
                        <i className="fas fa-box"></i> Products/Pets/Services ({rejectedItems.length})
                    </button>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-times-circle"></i>
                    <p>No rejected applications</p>
                </div>
            ) : (
                <div className="rejected-list">
                    {filteredItems.map(item => (
                        <div key={item._id} className={`rejected-card ${getTypeColor(item.type)}`}>
                            <div className="rejected-header">
                                <span className="type-label">
                                    {item.type === 'user' 
                                        ? (item.role === 'seller' ? 'Seller' : 'Service Provider')
                                        : item.type
                                    }
                                </span>
                                <span className="rejected-date">
                                    {new Date(item.rejectedAt || item.updatedAt || item.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h4>{item.type === 'user' ? item.fullName : item.name}</h4>
                            {item.type === 'user' ? (
                                <div className="provider-info">
                                    <p className="provider-name">{item.email}</p>
                                    <p className="provider-name">{item.phone}</p>
                                    {item.businessName && <p className="business-name">{item.businessName}</p>}
                                    {item.serviceType && <p className="service-type">{item.serviceType}</p>}
                                    <button 
                                        className="icon-btn-inline"
                                        onClick={() => window.open(`/api/admin/user-document/${item._id}/${item.role === 'seller' ? 'license' : 'certificate'}`, '_blank')}
                                        title={item.role === 'seller' ? 'View Business License' : 'View Certificate'}
                                    >
                                        <i className="fas fa-file-pdf"></i> View Document
                                    </button>
                                </div>
                            ) : (
                                <p className="provider-name">
                                    by {item.seller?.businessName || item.provider?.fullName || 'Unknown'}
                                </p>
                            )}
                            {item.rejectionReason && (
                                <div className="rejection-reason">
                                    <strong>Reason:</strong> {item.rejectionReason}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RejectedApplications;
