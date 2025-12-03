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

    // Helper function to get service icon based on service type
    const getServiceIcon = (serviceType) => {
        const icons = {
            'Grooming': 'fas fa-cut',
            'Veterinary': 'fas fa-stethoscope',
            'Training': 'fas fa-graduation-cap',
            'Walking': 'fas fa-walking',
            'Boarding': 'fas fa-home',
            'Daycare': 'fas fa-sun'
        };
        return icons[serviceType] || 'fas fa-hands-helping';
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

            <div className="services-grid-admin">
                {filteredServices.map(service => (
                    <div key={service._id} className="service-card-admin">
                        <div className="service-icon-wrapper">
                            <i className={getServiceIcon(service.provider?.serviceType)}></i>
                        </div>
                        <div className="service-info-admin">
                            <h4>{service.name}</h4>
                            <p className="service-provider">
                                <i className="fas fa-user"></i> {service.provider?.fullName}
                            </p>
                            <p className="service-type">
                                <i className="fas fa-tag"></i> {service.provider?.serviceType}
                            </p>
                            {service.description && (
                                <p className="service-description">{service.description}</p>
                            )}
                            <div className="service-actions-admin">
                                <button className="action-btn delete-btn" onClick={() => handleDeleteService(service._id)}>
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

export default ServicesManagement;
