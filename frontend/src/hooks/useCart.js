import { useSelector, useDispatch } from 'react-redux';
import {
    selectCart,
    selectCartCount,
    selectCartLoading,
    selectCartError,
    fetchCart as fetchCartAction,
    addToCart as addToCartAction,
    removeFromCart as removeFromCartAction,
    clearCart as clearCartAction,
} from '../redux/slices/cartSlice';

export const useCart = () => {
    const dispatch = useDispatch();
    const cart = useSelector(selectCart);
    const cartCount = useSelector(selectCartCount);
    const loading = useSelector(selectCartLoading);
    const error = useSelector(selectCartError);

    const addToCart = async (itemData) => {
        return dispatch(addToCartAction(itemData));
    };

    const removeFromCart = async (itemId) => {
        return dispatch(removeFromCartAction(itemId));
    };

    const clearCart = async () => {
        return dispatch(clearCartAction());
    };

    const refreshCart = () => {
        dispatch(fetchCartAction());
    };

    return {
        cart,
        cartCount,
        loading,
        error,
        addToCart,
        removeFromCart,
        clearCart,
        refreshCart,
    };
};
