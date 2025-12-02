import React, { useState } from 'react';
import { deleteService } from '../../services/api';
import './DashboardComponents.css';

const ServicesManagement = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!data) return <div>Loading...</div>;

    const services = data.services || [];

    const filteredServices = services.filter(service =>
        service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.provider?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            await deleteService(serviceId);
            alert('Service deleted!');
            window.location.reload();
        } catch (error) {
            alert('Failed to delete: ' + error.message);
        }
    };

    return (
        <div className="services-management">
            <div className="management-header">
                <h3>Services ({filteredServices.length})</h3>
                <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="services-list-admin">
                {filteredServices.map(service => (
                    <div key={service._id} className="service-card-admin">
                        <h4>{service.name}</h4>
                        <p><strong>Provider:</strong> {service.provider?.fullName}</p>
                        <p><strong>Type:</strong> {service.serviceType}</p>
                        <p>{service.description}</p>
                        <div className="service-actions-admin">
                            <button className="action-btn delete-btn" onClick={() => handleDeleteService(service._id)}>
                                <i className="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServicesManagement;
