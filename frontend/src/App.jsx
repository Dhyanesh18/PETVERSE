import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Homepage from './pages/Homepage';
import SearchResults from './pages/SearchResults';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Wishlist from './pages/Wishlist';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Homepage />} />
            
            {/* Search */}
            <Route path="/search" element={<SearchResults />} />
            
            {/* Pets */}
            <Route path="/pets" element={<Pets />} />
            <Route path="/seller/detail/:id" element={<PetDetail />} />
            <Route path="/seller/add-pet" element={<AddPet />} />
            <Route path="/seller/edit-pet/:id" element={<EditPet />} />
            
            {/* Products */}
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            
            {/* Wishlist */}
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/seller/add-product" element={<AddProduct />} />
            <Route path="/seller/edit-product/:id" element={<EditProduct />} />
            
            {/* Cart & Checkout */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App
