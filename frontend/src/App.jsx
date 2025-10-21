import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './context/CartContext';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SearchResults from './pages/SearchResults';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import About from './pages/About';
import OwnerDashboard from './pages/OwnerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import ServiceProviderDashboard from './pages/ServiceProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Mate from './pages/Mate';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderDetails from './pages/OrderDetails';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            
            {/* Search */}
            <Route path="/search" element={<SearchResults />} />
            
            {/* Pets */}
            <Route path="/pets" element={<Pets />} />
            <Route path="/seller/detail/:id" element={<PetDetail />} />
            <Route path="/seller/add-pet" element={<AddPet />} />
            <Route path="/seller/edit-pet/:id" element={<EditPet />} />
            <Route path="/pets/mate" element={<Mate />} />
            
            {/* Products */}
            <Route path="/products" element={<Products />} />
            <Route path="/buy/:id" element={<ProductDetail />} />
            <Route path="/seller/add-product" element={<AddProduct />} />
            <Route path="/seller/edit-product/:id" element={<EditProduct />} />
            
            {/* Services */}
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            
            {/* Cart & Checkout */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
            <Route path="/order/:id" element={<OrderDetails />} />
            
            {/* Events */}
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            
            {/* Dashboards */}
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/service-provider/dashboard" element={<ServiceProviderDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App
