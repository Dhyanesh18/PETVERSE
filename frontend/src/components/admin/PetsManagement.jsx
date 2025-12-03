import React, { useState } from 'react';
import { deletePet } from '../../services/api';
import './DashboardComponents.css';

const PetsManagement = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!data) return <div>Loading...</div>;

    const pets = data.pets || [];

    // Helper function to get full image URL
    const getImageUrl = (pet) => {
        if (pet.images && pet.images.length > 0) {
            return `http://localhost:8080/api/pets/image/${pet._id}/0`;
        }
        return '/images/default-pet.jpg';
    };

    const filteredPets = pets.filter(pet =>
        pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeletePet = async (petId) => {
        if (!window.confirm('Delete this pet?')) return;
        try {
            await deletePet(petId);
            alert('Pet deleted!');
            window.location.reload();
        } catch (error) {
            alert('Failed to delete: ' + error.message);
        }
    };

    return (
        <div className="pets-management">
            <div className="management-header">
                <h3>Pets ({filteredPets.length})</h3>
                <input
                    type="text"
                    placeholder="Search pets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="pets-grid-admin">
                {filteredPets.map(pet => (
                    <div key={pet._id} className="pet-card-admin">
                        <div className="pet-image-admin">
                            <img 
                                src={getImageUrl(pet)} 
                                alt={pet.name} 
                                onError={(e) => e.target.src = '/images/default-pet.jpg'} 
                            />
                        </div>
                        <div className="pet-info-admin">
                            <h4>{pet.name}</h4>
                            <p><strong>Breed:</strong> {pet.breed}</p>
                            <p><strong>Age:</strong> {pet.age}</p>
                            <p className="pet-price">₹{pet.price?.toLocaleString()}</p>
                            <div className="pet-actions-admin">
                                <button className="action-btn delete-btn" onClick={() => handleDeletePet(pet._id)}>
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

export default PetsManagement;
