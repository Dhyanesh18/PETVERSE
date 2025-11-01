import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Pets from './pages/Pets';
import Unauthorized from './pages/Unauthorized';
import api from './utils/api';

function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const response = await api.get('/auth/check-session');
            if (response.data.success && response.data.isLoggedIn) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Session check error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PetVerse...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Layout user={user}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    
                    {/* Protected Routes - Homepage accessible only when logged in */}
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <Homepage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/home" 
                        element={
                            <ProtectedRoute>
                                <Homepage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/pets" 
                        element={
                            <ProtectedRoute>
                                <Pets />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Owner Routes */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['owner']}>
                                {/* <OwnerDashboard /> */}
                                <div>Owner Dashboard</div>
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Seller Routes */}
                    <Route 
                        path="/seller/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['seller']}>
                                {/* <SellerDashboard /> */}
                                <div>Seller Dashboard</div>
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Service Provider Routes */}
                    <Route 
                        path="/service-provider/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['service_provider']}>
                                {/* <ServiceProviderDashboard /> */}
                                <div>Service Provider Dashboard</div>
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Admin Routes */}
                    <Route 
                        path="/admin/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                {/* <AdminDashboard /> */}
                                <div>Admin Dashboard</div>
                            </ProtectedRoute>
                        } 
                    />

                    {/* Catch all - redirect to login if not authenticated */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
