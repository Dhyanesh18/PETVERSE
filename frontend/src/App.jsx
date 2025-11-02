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
import OwnerDashboard from './pages/OwnerDashboard';

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

                {/* Wishlist - Requires Login */}
                <Route
                    path="/wishlist"
                    element={
                    <ProtectedRoute>
                        <Wishlist />
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
                        <div>Seller Dashboard</div>
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/service-provider/dashboard"
                    element={
                    <ProtectedRoute allowedRoles={['service_provider']}>
                        <div>Service Provider Dashboard</div>
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

                {/* The catch-all route should redirect to /home if authenticated,
                    or /login if not. Your <ProtectedRoute> on /home
                    will handle this automatically.
                */}
                <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </Layout>
            </Router>
        </CartProvider>
        </AuthProvider>
    );
}

export default App;