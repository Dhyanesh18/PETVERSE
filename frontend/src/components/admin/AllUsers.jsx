import React, { useState } from 'react';
import { approveUser, deleteUser } from '../../services/api';
import './DashboardComponents.css';

const AllUsers = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    if (!data) return <div>Loading...</div>;

    const allUsers = data.users || [];

    const filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleApproveUser = async (userId) => {
        if (!window.confirm('Approve this user?')) return;
        try {
            await approveUser(userId);
            alert('User approved successfully!');
            window.location.reload();
        } catch (error) {
            alert('Failed to approve user: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await deleteUser(userId);
            alert('User deleted successfully!');
            window.location.reload();
        } catch (error) {
            alert('Failed to delete user: ' + error.message);
        }
    };

    return (
        <div className="all-users">
            <div className="users-header">
                <h3>All Users ({filteredUsers.length})</h3>
                <div className="users-controls">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="role-filter">
                        <option value="all">All Roles</option>
                        <option value="owner">Owners</option>
                        <option value="seller">Sellers</option>
                        <option value="service_provider">Service Providers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user._id}>
                                <td>{user.fullName}</td>
                                <td>{user.email}</td>
                                <td>@{user.username}</td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    {['seller', 'service_provider'].includes(user.role) ? (
                                        <span className={`status-badge ${user.isApproved ? 'approved' : 'pending'}`}>
                                            {user.isApproved ? 'Approved' : 'Pending'}
                                        </span>
                                    ) : (
                                        <span className="status-badge active">Active</span>
                                    )}
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div className="action-buttons">
                                        {['seller', 'service_provider'].includes(user.role) && !user.isApproved && (
                                            <button
                                                className="action-icon approve"
                                                onClick={() => handleApproveUser(user._id)}
                                                title="Approve"
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                        )}
                                        <button
                                            className="action-icon delete"
                                            onClick={() => handleDeleteUser(user._id)}
                                            title="Delete"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AllUsers;
