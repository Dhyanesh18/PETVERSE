import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './redux/store';
import { checkSession, selectInitialized, selectIsAuthenticated } from './redux/slices/authSlice';
import { fetchCart, loadCartFromLocalStorage } from './redux/slices/cartSlice';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import ForgotPassword from './pages/ForgotPassword';
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
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderConfirmation from './pages/OrderConfirmation';
import Wallet from './pages/Wallet';
import About from './pages/About';
import SearchResults from './pages/SearchResults';
import AdminDashboard from './pages/AdminDashboard';
import LostAndFound from './pages/LostAndFound';
import LostPetDetail from './pages/LostPetDetail';
import Signup from './pages/Signup';
import SignupOwner from './pages/SignupOwner';
import SignupSeller from './pages/SignupSeller';
import SignupServiceProvider from './pages/SignupServiceProvider';

// Component that initializes Redux state
function AppInitializer({ children }) {
    const dispatch = useDispatch();
    const initialized = useSelector(selectInitialized);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const cartInitialized = useRef(false);
    const sessionInitialized = useRef(false);
    const location = useLocation();

    useEffect(() => {
        if (!initialized && !sessionInitialized.current) {
            sessionInitialized.current = true;
            dispatch(checkSession());
        }
    }, [dispatch, initialized]);

    useEffect(() => {
        // Prevent duplicate cart fetches in StrictMode
        if (cartInitialized.current) return;
        cartInitialized.current = true;

        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
            dispatch(fetchCart());
        } else {
            dispatch(loadCartFromLocalStorage());
        }
    }, [dispatch]);

    // Refresh cart when navigating to cart page and user is authenticated
    useEffect(() => {
        if (isAuthenticated && location.pathname === '/cart' && cartInitialized.current) {
            console.log('Navigated to cart page, refreshing cart data');
            dispatch(fetchCart());
        }
    }, [location.pathname, isAuthenticated, dispatch]);

    return children;
}

function App() {
    return (
        <Provider store={store}>
            <Router>
                <AppInitializer>
                    <Layout>
                        <Routes>
                            <Route path="/login" element={<Login />} /> 
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/signup/owner" element={<SignupOwner />} />
                            <Route path="/signup/seller" element={<SignupSeller />} />
                            <Route path="/signup/service-provider" element={<SignupServiceProvider />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/unauthorized" element={<Unauthorized />} />

                            {/* Public Routes */}
                            <Route path="/" element={<Navigate to="/home" replace />} />

                            {/* Public Routes - No Authentication Required */}
                            <Route path="/home" element={<Homepage />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/search" element={<SearchResults />} />
                            <Route path="/pets" element={<Pets />} />
                            <Route path="/seller/detail/:id" element={<PetDetail />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/product/:id" element={<ProductDetail />} />
                            <Route path="/mate" element={<PetMate />} />
                            
                            {/* Lost & Found Routes */}
                            <Route path="/lost-found" element={<LostAndFound />} />
                            <Route path="/lost-found/:id" element={<LostPetDetail />} />

                            {/* Services Routes */}
                            <Route path="/services" element={<Services />} />
                            <Route path="/services/:id" element={<ServiceDetail />} />

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

                            {/* Order Details - Admin Only */}
                            <Route
                                path="/admin/order-details/:orderId"
                                element={
                                    <ProtectedRoute allowedRoles={['admin']}>
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

                            {/* Cart - Requires Login */}
                            <Route
                                path="/cart"
                                element={
                                    <ProtectedRoute>
                                        <Cart />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Checkout - Requires Login */}
                            <Route
                                path="/checkout"
                                element={
                                    <ProtectedRoute>
                                        <Checkout />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Payment - Requires Login */}
                            <Route
                                path="/payment"
                                element={
                                    <ProtectedRoute>
                                        <Payment />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Order Confirmation - Requires Login */}
                            <Route
                                path="/order-confirmation/:orderId?"
                                element={
                                    <ProtectedRoute>
                                        <OrderConfirmation />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Wallet - Requires Login */}
                            <Route
                                path="/wallet"
                                element={
                                    <ProtectedRoute>
                                        <Wallet />
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
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            <Route path="*" element={<Navigate to="/home" replace />} />
                        </Routes>
                    </Layout>
                </AppInitializer>
            </Router>
        </Provider>
    );
}

export default App;