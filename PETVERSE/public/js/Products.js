function toggleFilter(id) {
    var content = document.getElementById(id);
    if (content.style.display === "none" || content.style.display === "") {
        content.style.display = "block";
        if (id === "brandContent") {
            content.style.height = "38vh";
            content.style.overflowY = "scroll";
        }
    } else {
        content.style.display = "none";
        if (id === "brandContent") {
            content.style.height = "auto";
            content.style.overflowY = "hidden";
        }
    }
}

// Global Cart State
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isCartOpen = false;

// Global filter state
let activeFilters = {
    brand: [],
    flavor: [],
    lifeStage: [],
    breedSize: [],
    productType: [],
    category: [],
    priceRange: 50000
};

// Pagination state
let currentPage = 1;
const itemsPerPage = 6;
let filteredProducts = [];

// Convert price string to number
function priceToNumber(priceStr) {
    if (!priceStr) return 0; // Handle undefined or null values
    return parseInt(priceStr.toString().replace(/,/g, ''), 10);
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN').format(price);
}

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Update price value display
function updatePriceValue(value) {
    const priceValue = document.getElementById('priceValue');
    if (priceValue) {
        priceValue.innerText = formatPrice(value);
    }
    
    // Update filter and refresh products
    activeFilters.priceRange = parseInt(value);
    applyFilters();
}

// Add to cart with optimized fetch
function addToCart(productId) {
    // Show loading indicator
    showNotification("Adding to cart...", false);
    
    // First try to find the product in the client-side data
    if (typeof products !== 'undefined') {
        const product = products.find(p => p.id === productId);
        if (product) {
            addProductToCart(product);
            return;
        }
    }
    
    // If not found locally, fetch from server
    fetch(`/api/products/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(product => {
            if (!product) throw new Error('Product not found');
            addProductToCart(product);
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            showNotification("Failed to add item to cart. Please try again.", false);
        });
}

// Helper function to add product to cart
function addProductToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateCart();
    updateCartCount();
    
    // Show confirmation message
    showNotification(`${product.Breed} added to cart!`, true);
}

function removeFromCart(productId) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Find the item in the cart
    let itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
        // Decrease quantity if more than 1, else remove item
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
            showNotification(`Quantity decreased`, true);
        } else {
            cart.splice(itemIndex, 1); // Remove item if quantity is 1
            showNotification(`Item removed from cart`, true);
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Completely remove an item from cart
function remove(productId) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Filter out the item completely from the cart
    const previousLength = cart.length;
    cart = cart.filter(item => item.id !== productId);

    // Only show notification if something was actually removed
    if (previousLength !== cart.length) {
        showNotification("Item removed from cart", true);
    }

    // Save updated cart and refresh UI
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Update the cart item template in the updateCart function
function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    let item = document.getElementById('itemCount');
    if (!cartItems || !cartTotal || !cartCount) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fa fa-shopping-bag"></i>
                </div>
                <h2>Your shopping cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet</p>
                <a href="/products" class="continue-shopping">
                    <i class="fa fa-arrow-left"></i>
                    Continue Shopping
                </a>
            </div>
        `;
        cartTotal.textContent = "0";
        cartCount.textContent = "0";
        cartCount.style.display = "none";
        localStorage.setItem("cartCount", "0"); // Store in localStorage
        return;
    }

    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    const template = document.createElement('div');
    
    cart.forEach(item => {
        let stockValue = item.stock || 0; // Ensure stock has a default value
        let stockText = stockValue > 0 ? "In Stock" : "Out of Stock";
        let stockColor = stockValue > 0 ? "green" : "red";
        
        template.innerHTML = `
         <div class="cart-item">
            <div class="cart-item-left">
                <div class="cart-image-container">
                    <img src="/images/${item.image_url}" alt="${item.Breed}" class="cart-item-image" loading="lazy">
                    <span class="cart-item-category">${item.category}</span>
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-header">
                        <h3 class="cart-item-title">${item.Breed}</h3>
                        <div class="cart-item-meta">
                            <span class="cart-item-age">Age: ${item.age}</span>
                           <span class="stock-status" data-stock="${stockValue}" style="color:${stockColor}; font-weight: bold;">
                                    ${stockText}
                                </span>
                        </div>
                    </div>
                    <div class="cart-item-shipping">
                        <i class="fa fa-truck"></i>
                        <span>Free Delivery</span>
                        <div class="delivery-estimate">Estimated delivery: 2-4 days</div>
                    </div>
                </div>
            </div>
            
            <div class="cart-item-right">
                <div class="cart-item-price-container">
                    <div class="cart-item-price">₹${formatPrice(priceToNumber(item.price) * item.quantity)}</div>
                    <div class="cart-item-discount">
                        <i class="fa fa-tag"></i>
                        ${item.dis} OFF
                    </div>
                </div>
                
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="removeFromCart(${item.id})">
                            <i class="fa fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="addToCart(${item.id})">
                            <i class="fa fa-plus"></i>
                        </button>
                    </div>
                    <button class="remove-item-btn" onclick="remove(${item.id})">
                        <i class="fa fa-trash"></i>
                        Remove
                    </button>
                </div>
            </div>
        </div>
        `;
        
        fragment.appendChild(template.firstChild);
    });
    
    cartItems.innerHTML = '';
    cartItems.appendChild(fragment);
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (priceToNumber(item.price) * item.quantity), 0);
    cartTotal.textContent = formatPrice(total);

    // Update cart count
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = itemCount;
    cartCount.style.display = itemCount > 0 ? "inline-block" : "none";

    if (item) {
        item.textContent = itemCount;
    }

    // Store cart count in localStorage for access in other files
    localStorage.setItem("cartCount", itemCount.toString());
}

function toggleCart() {
    window.location.href = '/cart';
}

// Show notification with success/error styling
function showNotification(message, isSuccess = true) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and show notification with appropriate styling
    notification.textContent = message;
    notification.className = 'notification';
    if (!isSuccess) {
        notification.classList.add('error');
    }
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Toggle mobile filters
function toggleMobileFilters() {
    const filtersContainer = document.querySelector('.filters-container');
    const overlay = document.getElementById('overlay');
    
    if (filtersContainer) {
        filtersContainer.classList.toggle('expanded');
        if (overlay) {
            if (filtersContainer.classList.contains('expanded')) {
                overlay.style.display = 'block';
            } else {
                overlay.style.display = 'none';
            }
        }
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.getElementById('overlay');
    
    if (navLinks) {
        navLinks.classList.toggle('active');
        if (overlay) {
            if (navLinks.classList.contains('active')) {
                overlay.style.display = 'block';
            } else {
                overlay.style.display = 'none';
            }
        }
    }
}

// Apply filters to products
function applyFilters() {
    // Show loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
        // Get all products
        const allProducts = typeof products !== 'undefined' ? products : [];
        
        // Filter products based on active filters
        filteredProducts = allProducts.filter(product => {
            // Check brand filter
            if (activeFilters.brand.length > 0 && !activeFilters.brand.includes(product.Breed)) {
                return false;
            }
            
            // Check product type filter
            if (activeFilters.productType.length > 0 && !activeFilters.productType.includes(product.type)) {
                return false;
            }
            
            // Check category filter
            if (activeFilters.category.length > 0 && !activeFilters.category.includes(product.category)) {
                return false;
            }
            
            // Check price range
            const productPrice = priceToNumber(product.price);
            if (productPrice > activeFilters.priceRange) {
                return false;
            }
            
            // All filters passed
            return true;
        });
        
        // Update pagination
        currentPage = 1;
        updatePagination();
        
        // Update applied filters UI
        updateAppliedFiltersUI();
        
        // Hide loading spinner
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }, 100);
}

// Update the applied filters UI
function updateAppliedFiltersUI() {
    const appliedFiltersContainer = document.getElementById('appliedFilters');
    if (!appliedFiltersContainer) return;
    
    // Clear existing filters
    appliedFiltersContainer.innerHTML = '';
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add filter tags for each active filter
    let hasFilters = false;
    
    // Add brand filters
    activeFilters.brand.forEach(brand => {
        hasFilters = true;
        const filterTag = createFilterTag('brand', brand);
        fragment.appendChild(filterTag);
    });
    
    // Add product type filters
    activeFilters.productType.forEach(type => {
        hasFilters = true;
        const filterTag = createFilterTag('productType', type);
        fragment.appendChild(filterTag);
    });
    
    // Add category filters
    activeFilters.category.forEach(category => {
        hasFilters = true;
        const filterTag = createFilterTag('category', category);
        fragment.appendChild(filterTag);
    });
    
    // Add price range filter if not at max
    if (activeFilters.priceRange < 50000) {
        hasFilters = true;
        const priceTag = document.createElement('div');
        priceTag.className = 'filter-tag';
        priceTag.innerHTML = `
            Price: ₹${formatPrice(activeFilters.priceRange)} or less
            <span class="remove-filter" onclick="resetPriceRange()">×</span>
        `;
        fragment.appendChild(priceTag);
    }
    
    // Add clear all button if there are filters
    if (hasFilters) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-filters';
        clearBtn.id = 'clearFilters';
        clearBtn.textContent = 'Clear All';
        clearBtn.onclick = clearAllFilters;
        fragment.appendChild(clearBtn);
    }
    
    // Add the fragment to the container
    appliedFiltersContainer.appendChild(fragment);
}

// Create a filter tag element
function createFilterTag(filterType, value) {
    const filterTag = document.createElement('div');
    filterTag.className = 'filter-tag';
    
    // Format the display text based on filter type
    let displayText = value;
    if (filterType === 'productType') {
        displayText = `Type: ${value}`;
    } else if (filterType === 'category') {
        displayText = `Category: ${value}`;
    } else if (filterType === 'brand') {
        displayText = `Brand: ${value}`;
    }
    
    filterTag.innerHTML = `
        ${displayText}
        <span class="remove-filter" onclick="removeFilter('${filterType}', '${value}')">×</span>
    `;
    
    return filterTag;
}

// Remove a specific filter
function removeFilter(filterType, value) {
    activeFilters[filterType] = activeFilters[filterType].filter(item => item !== value);
    
    // Update checkbox state
    const checkbox = document.querySelector(`input[name="${filterType}"][value="${value}"]`);
    if (checkbox) checkbox.checked = false;
    
    // Apply updated filters
    applyFilters();
}

// Reset price range to max
function resetPriceRange() {
    activeFilters.priceRange = 50000;
    
    // Update range input
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.value = 50000;
        updatePriceValue(50000);
    }
    
    // Apply updated filters
    applyFilters();
}

// Clear all filters
function clearAllFilters() {
    // Reset all filter arrays
    activeFilters = {
        brand: [],
        flavor: [],
        lifeStage: [],
        breedSize: [],
        productType: [],
        category: [],
        priceRange: 50000
    };
    
    // Uncheck all checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset price range
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.value = 50000;
        updatePriceValue(50000);
    }
    
    // Apply updated filters
    applyFilters();
}

// Update pagination based on filtered products
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    // Calculate total pages
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    // Clear existing pagination
    paginationContainer.innerHTML = '';
    
    // Don't show pagination if only one page
    if (totalPages <= 1) {
        renderProductsPage();
        return;
    }
    
    // Create pagination buttons
    const fragment = document.createDocumentFragment();
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fa fa-angle-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    };
    fragment.appendChild(prevBtn);
    
    // Page buttons
    const maxButtons = 5; // Maximum number of page buttons to show
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // Adjust start page if end page is at max
    if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // First page button if not visible
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'pagination-btn';
        firstBtn.textContent = '1';
        firstBtn.onclick = () => {
            currentPage = 1;
            updatePagination();
        };
        fragment.appendChild(firstBtn);
        
        // Ellipsis if needed
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            fragment.appendChild(ellipsis);
        }
    }
    
    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            updatePagination();
        };
        fragment.appendChild(pageBtn);
    }
    
    // Last page button if not visible
    if (endPage < totalPages) {
        // Ellipsis if needed
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            fragment.appendChild(ellipsis);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.className = 'pagination-btn';
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => {
            currentPage = totalPages;
            updatePagination();
        };
        fragment.appendChild(lastBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fa fa-angle-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    };
    fragment.appendChild(nextBtn);
    
    // Add pagination to container
    paginationContainer.appendChild(fragment);
    
    // Render products for current page
    renderProductsPage();
}

// Render products for the current page
function renderProductsPage() {
    const productsGrid = document.getElementById('card');
    if (!productsGrid) return;
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
    
    // Clear existing products
    productsGrid.innerHTML = '';
    
    // Check if there are products to display
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <p>No products match your filters. Try adjusting your criteria.</p>
                <button class="clear-filters" onclick="clearAllFilters()">Clear All Filters</button>
            </div>
        `;
        return;
    }
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add products for current page
    for (let i = startIndex; i < endIndex; i++) {
        const product = filteredProducts[i];
        const productCard = document.createElement('div');
        productCard.className = 'card';
        productCard.setAttribute('data-id', product.id);
        productCard.setAttribute('data-type', product.type);
        productCard.setAttribute('data-category', product.category);
        productCard.setAttribute('data-price', priceToNumber(product.price));
        productCard.onclick = () => openProduct(product.id);
        
        productCard.innerHTML = `
            <div class="card-head">
                <img src="/images/${product.image_url}" alt="${product.Breed}" loading="lazy">
            </div>
            <div class="card-body">
                <h2 class="product-title">${product.Breed}</h2>
                <span class="badge">${product.category}</span>
                <p class="product-caption">${product.type} | ${product.age}</p>
                <div class="product-rating">
                    <i class="fa fa-star"></i>
                    <i class="fa fa-star"></i>
                    <i class="fa fa-star"></i>
                    <i class="fa fa-star"></i>
                    <i class="fa fa-star grey"></i>
                </div>
                <div class="product-price">
                    ₹${product.price}
                    <span class="discount-text">${product.dis} OFF</span>
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                        <i class="fa fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        fragment.appendChild(productCard);
    }
    
    // Add products to grid
    productsGrid.appendChild(fragment);
}

// Search products
const searchProducts = debounce(function(query) {
    if (!query || query.trim() === '') {
        // If search is empty, reset to all products
        applyFilters();
        return;
    }
    
    query = query.toLowerCase().trim();
    
    // Filter products that match the search query
    const allProducts = typeof products !== 'undefined' ? products : [];
    filteredProducts = allProducts.filter(product => {
        // Check if product matches search query
        return (
            product.Breed.toLowerCase().includes(query) ||
            product.title.toLowerCase().includes(query) ||
            product.type.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query)
        );
    });
    
    // Update pagination with search results
    currentPage = 1;
    updatePagination();
    
    // Show message if no results
    const productsGrid = document.getElementById('card');
    if (filteredProducts.length === 0 && productsGrid) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <p>No products match your search for "${query}". Try different keywords.</p>
            </div>
        `;
    }
}, 300); // 300ms debounce delay

function openProduct(productId) {
    // Redirect to product detail page
    window.location.href = `/product-detail?id=${productId}`;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
    // Initialize filtered products with all products
    filteredProducts = typeof products !== 'undefined' ? [...products] : [];
    
    // Initialize pagination
    updatePagination();
    
    // Cart icon click handler
    const cartIcon = document.getElementById("cartIcon");
    if (cartIcon) {
        cartIcon.onclick = toggleCart;
    }
    
    // Hamburger menu click handler
    const hamburger = document.getElementById("hamburger");
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    // Filter toggle button for mobile
    const filterToggle = document.getElementById("filterToggle");
    if (filterToggle) {
        filterToggle.addEventListener('click', toggleMobileFilters);
    }
    
    // Close filters button for mobile
    const closeFilters = document.getElementById("closeFilters");
    if (closeFilters) {
        closeFilters.addEventListener('click', toggleMobileFilters);
    }
    
    // Overlay click handler
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.addEventListener('click', () => {
            // Close mobile menu and filters
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && navLinks.classList.contains('active')) {
                toggleMobileMenu();
            }
            
            const filtersContainer = document.querySelector('.filters-container');
            if (filtersContainer && filtersContainer.classList.contains('expanded')) {
                toggleMobileFilters();
            }
        });
    }
    
    // Search input handler
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
    }
    
    // Search button click handler
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            searchProducts(searchInput.value);
        });
    }
    
    // Filter checkbox change handlers
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const filterType = this.name;
            const filterValue = this.value;
            
            if (this.checked) {
                // Add filter
                if (!activeFilters[filterType].includes(filterValue)) {
                    activeFilters[filterType].push(filterValue);
                }
            } else {
                // Remove filter
                activeFilters[filterType] = activeFilters[filterType].filter(item => item !== filterValue);
            }
            
            // Apply filters
            applyFilters();
        });
    });
    
    // Price range input handler
    const priceRange = document.getElementById("priceRange");
    if (priceRange) {
        priceRange.addEventListener('input', function() {
            updatePriceValue(this.value);
        });
        
        // Initialize price value
        updatePriceValue(priceRange.value);
    }
    
    // Initialize cart
    updateCart();
    
    // Initialize cart count from localStorage
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const count = localStorage.getItem('cartCount') || '0';
        cartCount.textContent = count;
        cartCount.style.display = count !== '0' ? 'inline-block' : 'none';
    }
});

// Run on Page Load
updateCart();

// Open Cart
function openCart() {
    if (!isCartOpen) {
        toggleCart();
    }
}

// Intersection Observer for lazy loading
if ('IntersectionObserver' in window) {
    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                lazyLoadObserver.unobserve(img);
            }
        });
    });
    
    // Observe all lazy images
    document.addEventListener('DOMContentLoaded', () => {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => {
            lazyLoadObserver.observe(img);
        });
    });
}
