import React from 'react';
import './DashboardComponents.css';

const RejectedApplications = ({ data, filters }) => {
    if (!data) return <div>Loading...</div>;

    const rejectedItems = [
        ...(data.rejectedPets || []).map(pet => ({ ...pet, type: 'pet' })),
        ...(data.rejectedProducts || []).map(product => ({ ...product, type: 'product' })),
        ...(data.rejectedServices || []).map(service => ({ ...service, type: 'service' }))
    ];

    const filteredItems = rejectedItems.filter(item => {
        if (!filters.types[item.type]) return false;
        if (filters.dateRange.start || filters.dateRange.end) {
            const itemDate = new Date(item.rejectedAt || item.createdAt);
            if (filters.dateRange.start && itemDate < new Date(filters.dateRange.start)) return false;
            if (filters.dateRange.end && itemDate > new Date(filters.dateRange.end)) return false;
        }
        return true;
    });

    return (
        <div className="rejected-applications">
            <div className="applications-header">
                <h3>Rejected Applications ({filteredItems.length})</h3>
                <p className="applications-subtitle">Applications that were not approved</p>
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-times-circle"></i>
                    <p>No rejected applications</p>
                </div>
            ) : (
                <div className="rejected-list">
                    {filteredItems.map(item => (
                        <div key={item._id} className="rejected-card">
                            <div className="rejected-header">
                                <span className="type-label">{item.type}</span>
                                <span className="rejected-date">
                                    {new Date(item.rejectedAt || item.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h4>{item.name}</h4>
                            <p className="provider-name">
                                by {item.seller?.businessName || item.provider?.fullName}
                            </p>
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
