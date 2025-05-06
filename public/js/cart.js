// Cart functionality
async function addToCart(productId) {
    try {
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Update cart count
            updateCartCount(data.cartCount);
            
            // Show success message
            alert('Product added to cart successfully!');
            
            // Dispatch cart update event
            const event = new CustomEvent('cartUpdate', {
                detail: { cartCount: data.cartCount }
            });
            document.dispatchEvent(event);
            
            return true;
        } else {
            console.error('Server error:', data.error);
            alert(data.error || 'Error adding product to cart');
            return false;
        }
    } catch (err) {
        console.error('Error adding to cart:', err);
        alert('Error adding product to cart. Please try again.');
        return false;
    }
}

function updateCartCount(count) {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? "inline-block" : "none";
    }
}

// Initialize cart count from server
async function initializeCart() {
    try {
        const response = await fetch('/cart/count');
        const data = await response.json();
        
        if (data.success) {
            updateCartCount(data.cartCount);
        }
    } catch (err) {
        console.error('Error initializing cart:', err);
    }
}

// Call initializeCart when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
    
    // Add event delegation for add to cart buttons
    document.addEventListener('click', function(event) {
        const addToCartButton = event.target.closest('.add-to-cart');
        if (addToCartButton && !addToCartButton.disabled) {
            const productId = addToCartButton.getAttribute('data-product-id');
            if (productId) {
                addToCart(productId);
            }
        }
    });
});

// Listen for cart updates from other scripts
document.addEventListener('cartUpdated', function(event) {
    console.log('Cart updated event received:', event.detail);
    updateCartCount();
});

// Ensure cart count updates when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    console.log("Cart.js loaded, cart count updated");
    
    // Debug cart data
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length > 0) {
        console.log("Cart data from Cart.js:", cart);
        console.log("Cart item IDs:", cart.map(item => Number(item.id)));
    }
    
    // Make updateCartCount available globally
    window.updateCartCount = updateCartCount;
});

// Update quantity in cart
async function updateQuantity(productId, newQuantity) {
    try {
        const response = await fetch('/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: productId,
                quantity: newQuantity
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update cart count
            updateCartCount(data.cartCount);
            
            // Refresh the page to update the cart display
            window.location.reload();
        } else {
            console.error('Server error:', data.error);
            alert(data.error || 'Error updating cart');
        }
    } catch (err) {
        console.error('Error updating quantity:', err);
        alert('Error updating quantity. Please try again.');
    }
}

// Remove item from cart
async function removeFromCart(productId) {
    try {
        const response = await fetch('/cart/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: productId
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update cart count
            updateCartCount(data.cartCount);
            
            // Refresh the page to update the cart display
            window.location.reload();
        } else {
            console.error('Server error:', data.error);
            alert(data.error || 'Error removing item from cart');
        }
    } catch (err) {
        console.error('Error removing from cart:', err);
        alert('Error removing item from cart. Please try again.');
    }
}
