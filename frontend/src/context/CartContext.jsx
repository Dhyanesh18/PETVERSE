import { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as addToCartAPI, removeFromCart as removeFromCartAPI, clearCart as clearCartAPI } from '../services/api';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await getCart();
            const cartData = response.data;
            setCart(cartData.items || []);
            const count = cartData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            setCartCount(count);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            // Fallback to localStorage
            const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
            setCart(localCart);
            const count = localCart.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(count);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const addToCart = async (itemData) => {
        try {
            const response = await addToCartAPI(itemData);
            await fetchCart();
            return response.data;
        } catch (error) {
            console.error('Failed to add to cart:', error);
            // Fallback to localStorage
            const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItem = localCart.find(item => 
                item.productId === itemData.productId || item.serviceId === itemData.serviceId
            );
            if (existingItem) {
                existingItem.quantity += itemData.quantity || 1;
            } else {
                localCart.push(itemData);
            }
            localStorage.setItem('cart', JSON.stringify(localCart));
            setCart(localCart);
            const count = localCart.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(count);
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            await removeFromCartAPI(itemId);
            await fetchCart();
        } catch (error) {
            console.error('Failed to remove from cart:', error);
        }
    };

    const clearCart = async () => {
        try {
            await clearCartAPI();
            setCart([]);
            setCartCount(0);
            localStorage.removeItem('cart');
        } catch (error) {
            console.error('Failed to clear cart:', error);
            // Fallback to local clear
            setCart([]);
            setCartCount(0);
            localStorage.removeItem('cart');
        }
    };

    const value = {
        cart,
        cartCount,
        loading,
        addToCart,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
