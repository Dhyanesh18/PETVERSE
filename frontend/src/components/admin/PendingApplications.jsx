import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { approveItem, rejectItem, fetchAdminDashboard } from '../../redux/slices/adminSlice';
import './DashboardComponents.css';

const PendingApplications = ({ data }) => {
    const dispatch = useDispatch();
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    if (!data) return <div>Loading...</div>;

    const pendingItems = [
        ...(data.pendingPets || []).map(pet => ({ ...pet, type: 'pet' })),
        ...(data.pendingProducts || []).map(product => ({ ...product, type: 'product' })),
        ...(data.pendingServices || []).map(service => ({ ...service, type: 'service' }))
    ];

    const handleApprove = async (id, type) => {
        if (!window.confirm(`Are you sure you want to approve this ${type}?`)) return;

        try {
            await dispatch(approveItem({ id, type })).unwrap();
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} approved successfully!`);
            dispatch(fetchAdminDashboard());
        } catch (error) {
            alert(`Failed to approve ${type}: ${error.message}`);
        }
    };

    const openRejectModal = (item) => {
        setSelectedItem(item);
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            await dispatch(rejectItem({ 
                id: selectedItem._id, 
                type: selectedItem.type, 
                reason: rejectionReason 
            })).unwrap();
            alert(`${selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)} rejected successfully!`);
            setRejectModalOpen(false);
            setRejectionReason('');
            setSelectedItem(null);
            dispatch(fetchAdminDashboard());
        } catch (error) {
            alert(`Failed to reject ${selectedItem.type}: ${error.message}`);
        }
    };

    const getTypeIcon = (type) => {
        const icons = { pet: 'paw', product: 'box', service: 'concierge-bell' };
        return icons[type] || 'question';
    };

    const getTypeColor = (type) => {
        const colors = { pet: 'pink', product: 'orange', service: 'purple' };
        return colors[type] || 'gray';
    };

    return (
        <div className="pending-applications">
            <div className="applications-header">
                <h3>Pending Applications ({pendingItems.length})</h3>
                <p className="applications-subtitle">Review and approve new submissions</p>
            </div>

            {pendingItems.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-inbox"></i>
                    <p>No pending applications</p>
                    <span className="empty-subtitle">All applications have been reviewed</span>
                </div>
            ) : (
                <div className="applications-grid">
                    {pendingItems.map(item => (
                        <div key={item._id} className={`application-card ${getTypeColor(item.type)}`}>
                            <div className="application-badge">
                                <i className={`fas fa-${getTypeIcon(item.type)}`}></i>
                                <span>{item.type}</span>
                            </div>

                            <div className="application-content">
                                <h4 className="application-name">{item.name}</h4>
                                
                                {item.type === 'pet' && (
                                    <div className="application-details">
                                        <p><strong>Breed:</strong> {item.breed}</p>
                                        <p><strong>Age:</strong> {item.age}</p>
                                        <p><strong>Price:</strong> ₹{item.price?.toLocaleString()}</p>
                                    </div>
                                )}

                                {item.type === 'product' && (
                                    <div className="application-details">
                                        <p><strong>Brand:</strong> {item.brand}</p>
                                        <p><strong>Category:</strong> {item.category}</p>
                                        <p><strong>Price:</strong> ₹{item.price?.toLocaleString()}</p>
                                        <p><strong>Stock:</strong> {item.stock} units</p>
                                    </div>
                                )}

                                {item.type === 'service' && (
                                    <div className="application-details">
                                        <p><strong>Type:</strong> {item.serviceType}</p>
                                        <p><strong>Location:</strong> {item.location || item.address}</p>
                                        <p><strong>Description:</strong> {item.description?.substring(0, 100)}...</p>
                                    </div>
                                )}

                                <div className="application-meta">
                                    <span className="meta-item">
                                        <i className="fas fa-user"></i>
                                        {item.seller?.businessName || item.provider?.fullName || 'Unknown'}
                                    </span>
                                    <span className="meta-item">
                                        <i className="fas fa-calendar"></i>
                                        {new Date(item.createdAt || item.submittedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="application-actions">
                                <button 
                                    className="action-btn approve-btn"
                                    onClick={() => handleApprove(item._id, item.type)}
                                >
                                    <i className="fas fa-check"></i>
                                    Approve
                                </button>
                                <button 
                                    className="action-btn reject-btn"
                                    onClick={() => openRejectModal(item)}
                                >
                                    <i className="fas fa-times"></i>
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Reject Application</h3>
                            <button className="modal-close" onClick={() => setRejectModalOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Please provide a reason for rejecting this {selectedItem?.type}:</p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                rows="4"
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setRejectModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={handleReject}>
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingApplications;
