import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Wishlist from './pages/Wishlist';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import AddEvent from './pages/AddEvent';
import EventPayment from './pages/EventPayment';
import EventTicket from './pages/EventTicket';
import OwnerDashboard from './pages/OwnerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import ServiceProviderDashboard from './pages/ServiceProviderDashboard';
import OrderDetails from './pages/OrderDetails';
import UserOrderDetails from './pages/UserOrderDetails';
import PetMate from './pages/PetMate';

function App() {
    return (
        <AuthProvider>
        <CartProvider>
            <Router>
            <Layout>
                <Routes>
                <Route path="/login" element={<Login />} /> 
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Public Routes - No Authentication Required */}
                <Route path="/home" element={<Homepage />} />
                <Route path="/pets" element={<Pets />} />
                <Route path="/seller/detail/:id" element={<PetDetail />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/mate" element={<PetMate />} />

                {/* Protected Routes - Seller Only */}
                <Route
                    path="/seller/add-pet"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <AddPet />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/edit-pet/:id"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <EditPet />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/add-product"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <AddProduct />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/edit-product/:id"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <EditProduct />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/products/add"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <AddProduct />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/products/edit/:id"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <EditProduct />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/pets/add"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <AddPet />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/pets/edit/:id"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <EditPet />
                    </ProtectedRoute>
                    }
                />

                {/* Order Details - Seller Only */}
                <Route
                    path="/seller/order-details/:orderId"
                    element={
                    <ProtectedRoute allowedRoles={['seller']}>
                        <OrderDetails />
                    </ProtectedRoute>
                    }
                />

                {/* User Order Details - Owner/Customer */}
                <Route
                    path="/order-details/:orderId"
                    element={
                    <ProtectedRoute allowedRoles={['owner', 'user']}>
                        <UserOrderDetails />
                    </ProtectedRoute>
                    }
                />

                {/* Wishlist - Requires Login */}
                <Route
                    path="/wishlist"
                    element={
                    <ProtectedRoute>
                        <Wishlist />
                    </ProtectedRoute>
                    }
                />

                {/* Events */}
                <Route
                    path="/events"
                    element={
                    <ProtectedRoute>
                        <Events />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/events/:id"
                    element={
                    <ProtectedRoute>
                        <EventDetail />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/events/add"
                    element={
                    <ProtectedRoute allowedRoles={['service_provider']}>
                        <AddEvent />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/events/:id/payment"
                    element={
                    <ProtectedRoute allowedRoles={['owner']}>
                        <EventPayment />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/events/:id/ticket"
                    element={
                    <ProtectedRoute allowedRoles={['owner']}>
                        <EventTicket />
                    </ProtectedRoute>
                    }
                />

                {/* Role-based Dashboards */}
                <Route
                    path="/dashboard"
                    element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                        <OwnerDashboard />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/dashboard"
                    element={
                    <ProtectedRoute allowedRoles={['seller','admin']}>
                        <SellerDashboard />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/service-provider/dashboard"
                    element={
                    <ProtectedRoute allowedRoles={['service_provider', 'admin']}>
                        <ServiceProviderDashboard />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/dashboard"
                    element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <div>Admin Dashboard</div>
                    </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </Layout>
            </Router>
        </CartProvider>
        </AuthProvider>
    );
}

export default App;