import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAdminDashboard, setActiveTab } from '../redux/slices/adminSlice';
import { logout } from '../redux/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import DashboardOverview from '../components/admin/DashboardOverview';
import PendingApplications from '../components/admin/PendingApplications';
import ApprovedApplications from '../components/admin/ApprovedApplications';
import RejectedApplications from '../components/admin/RejectedApplications';
import AllUsers from '../components/admin/AllUsers';
import ProductsManagement from '../components/admin/ProductsManagement';
import ServicesManagement from '../components/admin/ServicesManagement';
import PetsManagement from '../components/admin/PetsManagement';
import OrdersManagement from '../components/admin/OrdersManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { dashboardData, loading, activeTab, error } = useSelector(state => state.admin);

    useEffect(() => {
        console.log('AdminDashboard mounted, fetching dashboard data...');
        dispatch(fetchAdminDashboard());
    }, [dispatch]);

    useEffect(() => {
        console.log('Dashboard data updated:', dashboardData);
        console.log('Loading state:', loading);
        console.log('Error state:', error);
        
        if (dashboardData) {
            console.log('Dashboard data keys:', Object.keys(dashboardData));
            if (dashboardData.data) {
                console.log('Nested data keys:', Object.keys(dashboardData.data));
            }
        }
    }, [dashboardData, loading, error]);

    const handleTabChange = (tab) => {
        dispatch(setActiveTab(tab));
    };

    const handleLogout = async () => {
        try {
            await dispatch(logout()).unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-error">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Error loading dashboard: {error}</p>
                <button onClick={() => dispatch(fetchAdminDashboard())} className="btn-retry">
                    <i className="fas fa-redo"></i> Retry
                </button>
            </div>
        );
    }

    const data = dashboardData?.data || dashboardData;
    
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="admin-error">
                <i className="fas fa-exclamation-triangle"></i>
                <p>No dashboard data available</p>
                <button onClick={() => dispatch(fetchAdminDashboard())} className="btn-retry">
                    <i className="fas fa-redo"></i> Reload
                </button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container">
            <div className="admin-main-container">
                {/* Sidebar */}
                <aside className="admin-sidebar">
                    <div className="sidebar-section">
                        <h2>Dashboard</h2>
                        <ul className="admin-menu">
                            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => handleTabChange('dashboard')}>
                                <i className="fas fa-tachometer-alt"></i> Dashboard Overview
                            </li>
                            <li className={activeTab === 'pending' ? 'active' : ''} onClick={() => handleTabChange('pending')}>
                                <i className="fas fa-clock"></i> Pending Applications
                            </li>
                            <li className={activeTab === 'approved' ? 'active' : ''} onClick={() => handleTabChange('approved')}>
                                <i className="fas fa-check-circle"></i> Approved
                            </li>
                            <li className={activeTab === 'rejected' ? 'active' : ''} onClick={() => handleTabChange('rejected')}>
                                <i className="fas fa-times-circle"></i> Rejected
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h2>User Management</h2>
                        <ul className="admin-menu">
                            <li className={activeTab === 'all-users' ? 'active' : ''} onClick={() => handleTabChange('all-users')}>
                                <i className="fas fa-users"></i> All Users
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h2>Content Management</h2>
                        <ul className="admin-menu">
                            <li className={activeTab === 'products' ? 'active' : ''} onClick={() => handleTabChange('products')}>
                                <i className="fas fa-box"></i> Products
                            </li>
                            <li className={activeTab === 'services' ? 'active' : ''} onClick={() => handleTabChange('services')}>
                                <i className="fas fa-hands-helping"></i> Services
                            </li>
                            <li className={activeTab === 'pets' ? 'active' : ''} onClick={() => handleTabChange('pets')}>
                                <i className="fas fa-paw"></i> Pets
                            </li>
                            <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => handleTabChange('orders')}>
                                <i className="fas fa-shopping-cart"></i> Orders
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h2>Financial</h2>
                        <ul className="admin-menu">
                            <li onClick={() => window.location.href = '/wallet'}>
                                <i className="fas fa-wallet"></i> Wallet
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <ul className="admin-menu">
                            <li onClick={handleLogout} className="logout-btn">
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="admin-content">
                    <header className="admin-header">
                        <h1>Admin Dashboard</h1>
                        <div className="admin-user-info">
                            <span>Welcome, {user?.fullName || 'Admin'}!</span>
                        </div>
                    </header>

                    <div className="admin-content-wrapper">
                        {activeTab === 'dashboard' && <DashboardOverview data={data} />}
                        {activeTab === 'pending' && <PendingApplications data={data} />}
                        {activeTab === 'approved' && <ApprovedApplications data={data} />}
                        {activeTab === 'rejected' && <RejectedApplications data={data} />}
                        {activeTab === 'all-users' && <AllUsers data={data} />}
                        {activeTab === 'products' && <ProductsManagement data={data} />}
                        {activeTab === 'services' && <ServicesManagement data={data} />}
                        {activeTab === 'pets' && <PetsManagement data={data} />}
                        {activeTab === 'orders' && <OrdersManagement data={data} />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
