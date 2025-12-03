import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateAdminOrderStatus, fetchAdminDashboard } from '../../redux/slices/adminSlice';
import './DashboardComponents.css';

const OrdersManagement = ({ data }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [updating, setUpdating] = useState(null);
    
    if (!data) return <div>Loading...</div>;

    const orders = data.orders || [];

    const handleViewOrder = (orderId) => {
        navigate(`/admin/order-details/${orderId}`);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            setUpdating(orderId);
            await dispatch(updateAdminOrderStatus({ orderId, status: newStatus })).unwrap();
            alert('Order status updated successfully!');
            // Optionally refresh dashboard data
            await dispatch(fetchAdminDashboard());
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Failed to update status: ' + (error.message || 'Unknown error'));
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="orders-management">
            <div className="management-header">
                <h3>Orders ({orders.length})</h3>
            </div>

            <div className="orders-table-wrapper">
                <table className="orders-table-admin">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id}>
                                <td>#{order.orderNumber || order._id?.slice(-8)}</td>
                                <td>{order.customer?.fullName || 'Unknown'}</td>
                                <td>{order.items?.length || 0} items</td>
                                <td>₹{order.totalAmount?.toLocaleString()}</td>
                                <td>
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                        className="status-select"
                                        disabled={updating === order._id}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className="action-icon view" 
                                        title="View Details"
                                        onClick={() => handleViewOrder(order._id)}
                                    >
                                        <i className="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersManagement;
