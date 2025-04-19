// Main filter functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get all filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    
    // Get price filter elements
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const applyPriceButton = document.getElementById('apply-price');
    
    // Get clear filters button
    const clearFiltersButton = document.querySelector('.clear-filters');
    
    // Get sort dropdown
    const sortDropdown = document.querySelector('.sort-dropdown');
    
    // Get products grid
    const productsGrid = document.querySelector('.products-grid');
    
    // Store the original products for resetting filters
    let originalProducts = [];
    
    // Clone all product cards initially to have an original set
    document.querySelectorAll('.product-card').forEach(card => {
        originalProducts.push(card.cloneNode(true));
    });
    
    // Function to filter and display products
    function filterAndDisplayProducts() {
        // Get all active filters
        const activeFilters = {
            category: getActiveFilters('category'),
            brand: getActiveFilters('brand'),
            rating: getActiveFilters('rating'),
            price: getPriceFilter(),
            // Dynamic filters (will capture all other filter names)
            toyType: getActiveFilters('toy-type'),
            material: getActiveFilters('material'),
            features: getActiveFilters('features'),
            petSize: getActiveFilters('pet-size')
            // Any other dynamic filters will be handled in the filterProduct function
        };
        
        // Filter products
        let filteredProducts = originalProducts.filter(productCard => {
            return filterProduct(productCard, activeFilters);
        });
        
        // Sort filtered products
        filteredProducts = sortProducts(filteredProducts);
        
        // Display filtered products
        displayProducts(filteredProducts);
    }
    
    // Function to get active filters for a specific filter group
    function getActiveFilters(filterName) {
        const activeValues = [];
        document.querySelectorAll(`input[name="${filterName}"]:checked`).forEach(checkbox => {
            activeValues.push(checkbox.value);
        });
        return activeValues;
    }
    
    // Function to get price filter values
    function getPriceFilter() {
        const minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : 0;
        const maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : Infinity;
        return { min: minPrice, max: maxPrice };
    }
    
    // Function to filter a product based on active filters
    function filterProduct(productCard, activeFilters) {
        // If no filters are active, show all products
        if (Object.values(activeFilters).every(filter => 
            Array.isArray(filter) ? filter.length === 0 : 
            (filter.min === 0 && filter.max === Infinity))) {
            return true;
        }
        
        // Product data extraction from the card
        const productInfo = extractProductInfo(productCard);
        
        // Check category filters
        if (activeFilters.category.length > 0 && 
            !activeFilters.category.some(cat => productInfo.categories.includes(cat))) {
            return false;
        }
        
        // Check brand filters
        if (activeFilters.brand.length > 0 && 
            !activeFilters.brand.some(brand => productInfo.brands.includes(brand))) {
            return false;
        }
        
        // Check rating filters
        if (activeFilters.rating.length > 0) {
            const minRequiredRating = Math.min(...activeFilters.rating.map(r => parseInt(r)));
            if (productInfo.rating < minRequiredRating) {
                return false;
            }
        }
        
        // Check price filters
        if (productInfo.price < activeFilters.price.min || 
            productInfo.price > activeFilters.price.max) {
            return false;
        }
        
        // Check dynamic filters - toy type
        if (activeFilters.toyType.length > 0 && 
            !activeFilters.toyType.some(type => productInfo.tags.includes(type))) {
            return false;
        }
        
        // Check dynamic filters - material
        if (activeFilters.material.length > 0 && 
            !activeFilters.material.some(material => productInfo.tags.includes(material))) {
            return false;
        }
        
        // Check dynamic filters - features
        if (activeFilters.features.length > 0 && 
            !activeFilters.features.some(feature => productInfo.tags.includes(feature))) {
            return false;
        }
        
        // Check dynamic filters - pet size
        if (activeFilters.petSize.length > 0 && 
            !activeFilters.petSize.some(size => productInfo.tags.includes(size))) {
            return false;
        }
        
        // If the product passes all filter checks, show it
        return true;
    }
    
    // Function to extract product information from a product card
    function extractProductInfo(productCard) {
        // This function extracts data from the product card
        // Either from data attributes or by parsing the content
        
        // Get price
        const priceElement = productCard.querySelector('.product-price');
        const price = parseFloat(priceElement.textContent.replace('₹', '').trim());
        
        // Get rating
        const ratingElement = productCard.querySelector('.product-rating');
        const fullStars = ratingElement.querySelectorAll('.fas.fa-star').length;
        const halfStars = ratingElement.querySelectorAll('.fas.fa-star-half-alt').length;
        const rating = fullStars + (halfStars * 0.5);
        
        // Extract product tags from data attributes (you'll need to add these)
        let tags = [];
        let categories = [];
        let brands = [];
        
        // For the initial implementation, we'll add data attributes to the cards
        // This assumes you'll modify your EJS template to include these attributes
        if (productCard.dataset.tags) {
            tags = productCard.dataset.tags.split(',');
        }
        
        if (productCard.dataset.category) {
            categories = productCard.dataset.category.split(',');
        }
        
        if (productCard.dataset.brand) {
            brands = productCard.dataset.brand.split(',');
        }
        
        return {
            price,
            rating,
            tags,
            categories,
            brands
        };
    }
    
    // Function to sort products based on the selected sort option
    function sortProducts(products) {
        const sortOption = sortDropdown.value;
        
        return [...products].sort((a, b) => {
            // Extract info for sorting
            const priceA = parseFloat(a.querySelector('.product-price').textContent.replace('₹', '').trim());
            const priceB = parseFloat(b.querySelector('.product-price').textContent.replace('₹', '').trim());
            
            const ratingA = countStars(a.querySelector('.product-rating'));
            const ratingB = countStars(b.querySelector('.product-rating'));
            
            // Apply sorting based on selected option
            switch (sortOption) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'rating':
                    return ratingB - ratingA;
                // For 'popular' and 'newest', we would need additional data
                // For now, we'll leave them as-is
                default:
                    return 0;
            }
        });
    }
    
    // Helper function to count stars for rating
    function countStars(ratingElement) {
        const fullStars = ratingElement.querySelectorAll('.fas.fa-star').length;
        const halfStars = ratingElement.querySelectorAll('.fas.fa-star-half-alt').length;
        return fullStars + (halfStars * 0.5);
    }
    
    // Function to display filtered products
    function displayProducts(products) {
        // Clear the products grid
        productsGrid.innerHTML = '';
        
        // If no products match the filters
        if (products.length === 0) {
            productsGrid.innerHTML = '<div class="no-products">No products match your filters. Try different filter options.</div>';
            return;
        }
        
        // Add filtered products to the grid
        products.forEach(product => {
            productsGrid.appendChild(product);
        });
    }
    
    // Add event listeners to filter checkboxes
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterAndDisplayProducts);
    });
    
    // Add event listener to price filter button
    applyPriceButton.addEventListener('click', filterAndDisplayProducts);
    
    // Add event listener to clear filters button
    clearFiltersButton.addEventListener('click', function() {
        // Clear all checkboxes
        filterCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Clear price inputs
        minPriceInput.value = '';
        maxPriceInput.value = '';
        
        // Reset sort to default
        sortDropdown.value = 'popular';
        
        // Show all products
        displayProducts(originalProducts);
    });
    
    // Add event listener to sort dropdown
    sortDropdown.addEventListener('change', filterAndDisplayProducts);
});

// Modify your EJS template to include data attributes for each product
// This function adds those attributes when the page loads
function enhanceProductCards() {
    // Get all product cards
    const productCards = document.querySelectorAll('.product-card');
    
    // Loop through each card and add data attributes based on the original data
    productCards.forEach((card, index) => {
        // We need to somehow match this card with the original data
        // One option is to add a data-id attribute in your EJS template
        const productId = card.dataset.id;
        
        // Find the matching product data
        // This depends on how your data is stored/accessible
        // For this example, we'll assume products is available in the global scope
        if (typeof products !== 'undefined' && products[index]) {
            const product = products[index];
            
            // Add data attributes
            if (product.category) {
                card.dataset.category = product.category;
            }
            
            if (product.brand) {
                card.dataset.brand = product.brand;
            }
            
            if (product.tags) {
                card.dataset.tags = product.tags.join(',');
            }
        }
    });
}

// Call the enhancement function when the page loads
document.addEventListener('DOMContentLoaded', enhanceProductCards);