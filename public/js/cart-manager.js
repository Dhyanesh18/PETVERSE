const cartManager = {
    async initializeCart() {
        try {
            const response = await fetch('/cart/count');
            const data = await response.json();
            if (data.success) {
                this.updateCartCount(data.cartCount);
            }
        } catch (error) {
            console.error('Failed to initialize cart:', error);
        }
    },

    updateCartCount(count) {
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
            cartCountElement.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    async addToCart(productId, quantity = 1, itemType = 'Product') {
        try {
            const response = await fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId, quantity, itemType })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add item to cart');
            }

            if (data.success) {
                this.updateCartCount(data.cartCount);
                return { success: true, cartCount: data.cartCount };
            } else {
                throw new Error(data.message || 'Failed to add item to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        }
    },
    
    async updateCartItem(productId, quantity) {
        try {
            const response = await fetch('/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId, quantity })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update cart');
            }

            if (data.success) {
                this.updateCartCount(data.cartCount);
                return { success: true, cartCount: data.cartCount };
            } else {
                throw new Error(data.message || 'Failed to update cart');
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            throw error;
        }
    },
    
    async removeFromCart(productId) {
        try {
            const response = await fetch('/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to remove item from cart');
            }

            if (data.success) {
                this.updateCartCount(data.cartCount);
                return { success: true, cartCount: data.cartCount };
            } else {
                throw new Error(data.message || 'Failed to remove item from cart');
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    }
}; 