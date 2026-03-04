import React, { useState } from 'react';
import './DashboardComponents.css';

const ApprovedApplications = ({ data }) => {
    const [filterType, setFilterType] = useState('all'); // 'all', 'users', 'items'
    
    if (!data) return <div>Loading...</div>;

    const approvedUsers = (data.approvedApplications || []).map(user => ({ ...user, type: 'user' }));
    const approvedItems = [
        ...(data.approvedPets || []).map(pet => ({ ...pet, type: 'pet' })),
        ...(data.approvedProducts || []).map(product => ({ ...product, type: 'product' })),
        ...(data.approvedServices || []).map(service => ({ ...service, type: 'service' }))
    ];

    // Combine all approved items
    const allApproved = [...approvedUsers, ...approvedItems];

    // Apply filter
    const filteredItems = filterType === 'all' 
        ? allApproved 
        : filterType === 'users' 
            ? approvedUsers 
            : approvedItems;

    const getTypeIcon = (type) => {
        const icons = { 
            user: 'user-circle',
            pet: 'paw', 
            product: 'box', 
            service: 'concierge-bell' 
        };
        return icons[type] || 'question';
    };

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
        <div className="approved-applications">
            <div className="applications-header">
                <h3>Approved Applications ({filteredItems.length})</h3>
                <p className="applications-subtitle">Successfully approved items</p>
                
                {/* Filter Buttons */}
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        <i className="fas fa-list"></i> All ({allApproved.length})
                    </button>
                    <button 
                        className={`filter-btn ${filterType === 'users' ? 'active' : ''}`}
                        onClick={() => setFilterType('users')}
                    >
                        <i className="fas fa-users"></i> Users ({approvedUsers.length})
                    </button>
                    <button 
                        className={`filter-btn ${filterType === 'items' ? 'active' : ''}`}
                        onClick={() => setFilterType('items')}
                    >
                        <i className="fas fa-box"></i> Products/Pets/Services ({approvedItems.length})
                    </button>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-check-circle"></i>
                    <p>No approved applications</p>
                </div>
            ) : (
                <div className="approved-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Name</th>
                                <th>{filterType === 'users' ? 'Email / Business' : 'Provider'}</th>
                                <th>{filterType === 'users' ? 'Phone' : 'Price'}</th>
                                <th>Approved Date</th>
                                <th>Status</th>
                                {filterType === 'users' && <th>Documents</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item._id}>
                                    <td>
                                        <div className={`type-badge ${getTypeColor(item.type)}`}>
                                            <i className={`fas fa-${getTypeIcon(item.type)}`}></i>
                                            {item.type === 'user' 
                                                ? (item.role === 'seller' ? 'Seller' : 'Service Provider')
                                                : item.type
                                            }
                                        </div>
                                    </td>
                                    <td className="item-name">
                                        {item.type === 'user' ? item.fullName : item.name}
                                    </td>
                                    <td>
                                        {item.type === 'user' 
                                            ? (
                                                <div>
                                                    <div>{item.email}</div>
                                                    {item.businessName && (
                                                        <div className="text-muted small">{item.businessName}</div>
                                                    )}
                                                    {item.serviceType && (
                                                        <div className="text-muted small">{item.serviceType}</div>
                                                    )}
                                                </div>
                                            )
                                            : (item.seller?.businessName || item.provider?.fullName || 'Unknown')
                                        }
                                    </td>
                                    <td>
                                        {item.type === 'user' 
                                            ? item.phone 
                                            : `₹${item.price?.toLocaleString() || 'N/A'}`
                                        }
                                    </td>
                                    <td>{new Date(item.approvedAt || item.updatedAt || item.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className="status-badge active">Active</span>
                                    </td>
                                    {filterType === 'users' && (
                                        <td>
                                            {item.type === 'user' && (
                                                <button 
                                                    className="icon-btn"
                                                    onClick={() => window.open(`/api/admin/user-document/${item._id}/${item.role === 'seller' ? 'license' : 'certificate'}`, '_blank')}
                                                    title={item.role === 'seller' ? 'View Business License' : 'View Certificate'}
                                                >
                                                    <i className="fas fa-file-pdf"></i>
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ApprovedApplications;
