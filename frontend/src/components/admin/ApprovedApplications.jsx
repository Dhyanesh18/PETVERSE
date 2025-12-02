import React from 'react';
import './DashboardComponents.css';

const ApprovedApplications = ({ data, filters }) => {
    if (!data) return <div>Loading...</div>;

    const approvedItems = [
        ...(data.approvedPets || []).map(pet => ({ ...pet, type: 'pet' })),
        ...(data.approvedProducts || []).map(product => ({ ...product, type: 'product' })),
        ...(data.approvedServices || []).map(service => ({ ...service, type: 'service' }))
    ];

    // Apply filters
    const filteredItems = approvedItems.filter(item => {
        if (!filters.types[item.type]) return false;
        if (filters.dateRange.start || filters.dateRange.end) {
            const itemDate = new Date(item.approvedAt || item.createdAt);
            if (filters.dateRange.start && itemDate < new Date(filters.dateRange.start)) return false;
            if (filters.dateRange.end && itemDate > new Date(filters.dateRange.end)) return false;
        }
        return true;
    });

    const getTypeIcon = (type) => {
        const icons = { pet: 'paw', product: 'box', service: 'concierge-bell' };
        return icons[type] || 'question';
    };

    return (
        <div className="approved-applications">
            <div className="applications-header">
                <h3>Approved Applications ({filteredItems.length})</h3>
                <p className="applications-subtitle">Successfully approved items</p>
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
                                <th>Provider</th>
                                <th>Price</th>
                                <th>Approved Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item._id}>
                                    <td>
                                        <div className="type-badge">
                                            <i className={`fas fa-${getTypeIcon(item.type)}`}></i>
                                            {item.type}
                                        </div>
                                    </td>
                                    <td className="item-name">{item.name}</td>
                                    <td>{item.seller?.businessName || item.provider?.fullName || 'Unknown'}</td>
                                    <td>₹{item.price?.toLocaleString()}</td>
                                    <td>{new Date(item.approvedAt || item.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className="status-badge active">Active</span>
                                    </td>
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
