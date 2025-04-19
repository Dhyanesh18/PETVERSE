function addToCart(productId) {
    // Ensure productId is a number
    productId = Number(productId);
    console.log("Adding to cart, product ID:", productId);
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if the product already exists in cart
    let existingItem = cart.find(item => Number(item.id) === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }

    // Save to localStorage and update cart count
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Dispatch a custom event that other scripts can listen for
    const cartUpdateEvent = new CustomEvent('cartUpdated', { 
        detail: { cart: cart }
    });
    document.dispatchEvent(cartUpdateEvent);
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let cartCountElement = document.getElementById('cartCount');

    if (cartCountElement) {
        let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'inline-block' : 'none';
        
        // Also update itemCount if it exists (for cart page)
        let itemCountElement = document.getElementById('itemCount');
        if (itemCountElement) {
            itemCountElement.textContent = totalItems;
        }
    }
}

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
