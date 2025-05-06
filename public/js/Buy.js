const productDataElement = document.getElementById("productData");
let selectedProduct = null;
let images = [];
let imageIndex = 0;

// Add debugging logs
console.log("Buy.js loaded");

try {
    if (productDataElement) {
        console.log("Product data element found");
        selectedProduct = JSON.parse(productDataElement.getAttribute("data-product"));
        console.log("Product data loaded:", selectedProduct);
        
        // Ensure images are correctly formatted
        images = [
            selectedProduct.image_url,
            selectedProduct.image1,
            selectedProduct.image2,
            selectedProduct.image3
        ].filter(Boolean);
        
        console.log("Images loaded:", images);
    } else {
        console.error("Product data element not found");
    }
} catch (error) {
    console.error("Error parsing product data:", error);
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded in Buy.js");
    
    // Add click event listener to rating container for scrolling to reviews
    const ratingContainer = document.getElementById("rating");
    if (ratingContainer) {
        ratingContainer.addEventListener('click', function() {
            const targetId = this.getAttribute('data-scroll-to');
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }
    
    // Check if the user has already reviewed this product
    if (selectedProduct && selectedProduct._id) {
        checkExistingReview();
    }
    
    // Set the main image immediately
    if (images.length > 0) {
        console.log("Setting main image to:", images[0]);
        const mainImage = document.getElementById("mainImage");
        if (mainImage) {
            mainImage.style.backgroundImage = `url('/images/dash/${images[0]}')`;
            console.log("Main image set successfully with URL:", `/images/dash/${images[0]}`);
        } else {
            console.error("Main image element not found");
        }
    } else {
        console.error("No images available to display");
        
        // Fallback: try to load images from thumbnails
        const thumbnails = document.querySelectorAll('.thumbnail');
        if (thumbnails.length > 0) {
            console.log("Using fallback: loading images from thumbnails");
            thumbnails.forEach(thumb => {
                const src = thumb.getAttribute('src');
                if (src) {
                    const imgPath = src.replace('/images/dash/', '');
                    images.push(imgPath);
                }
            });
            
            if (images.length > 0) {
                console.log("Fallback images loaded:", images);
                const mainImage = document.getElementById("mainImage");
                if (mainImage) {
                    mainImage.style.backgroundImage = `url('${thumbnails[0].getAttribute('src')}')`;
                    console.log("Main image set from fallback with URL:", thumbnails[0].getAttribute('src'));
                }
            }
        }
    }
    
    // Add click event listeners to thumbnails
    document.querySelectorAll('.thumbnail').forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            const imageUrl = this.getAttribute('data-image');
            if (imageUrl) {
                changeImage(imageUrl);
            }
        });
    });
    
    // Add click event listener to main image
    const mainImage = document.getElementById("mainImage");
    if (mainImage) {
        mainImage.addEventListener('click', function() {
            const imageUrl = this.getAttribute('data-image');
            if (imageUrl) {
                openFullscreen(imageUrl);
            }
        });
    }
    
    // Add click event listeners to fullscreen controls
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFullscreen);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevImage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextImage);
    }
    
    // Add event listeners for cart and buy buttons
    document.querySelector('.add-to-cart-btn')?.addEventListener('click', () => {
        if (typeof addToCart === 'function') {
            addToCart(selectedProduct.id);
            console.log("Added to cart:", selectedProduct.id);
        } else {
            console.error("addToCart function not found");
        }
    });
    
    document.querySelector('.buy-now-btn')?.addEventListener('click', () => {
        // Functionality for buy now button
    });
    
    // Initialize ratings and reviews
    if (typeof displayRating === 'function') {
        displayRating();
    }
    
    // Update cart count if applicable
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
});

// Function to change the main image
function changeImage(imageUrl) {
    console.log("Changing image to:", imageUrl);
    const mainImage = document.getElementById("mainImage");
    if (mainImage) {
        // Check if the imageUrl already includes /images/dash/
        const fullImageUrl = imageUrl.startsWith('/images/dash/') 
            ? imageUrl 
            : `/images/dash/${imageUrl}`;
            
        mainImage.style.backgroundImage = `url('${fullImageUrl}')`;
        console.log("Main image updated successfully with URL:", fullImageUrl);
        
        // Update current index
        imageIndex = images.indexOf(imageUrl);
        if (imageIndex === -1) {
            console.error("Image not found in images array:", imageUrl);
        }
    } else {
        console.error("Main image element not found");
    }
}

// Function to open fullscreen view
function openFullscreen(imageUrl) {
    console.log("Opening fullscreen with image:", imageUrl);
    const fullscreenImage = document.getElementById("fullscreenImage");
    const fullscreenContainer = document.getElementById("fullscreenContainer");
    
    if (fullscreenImage && fullscreenContainer) {
        // Update imageIndex to match the clicked image
        imageIndex = images.indexOf(imageUrl);
        if (imageIndex === -1) {
            console.error("Image not found in images array:", imageUrl);
            return;
        }
        
        // Set the fullscreen image source
        fullscreenImage.src = "/images/dash/" + imageUrl;
        
        // Show the fullscreen container
        fullscreenContainer.style.display = "flex";
        
        // Prevent body scrolling when in fullscreen
        document.body.style.overflow = "hidden";
        
        console.log("Fullscreen opened successfully with image:", imageUrl);
    } else {
        console.error("Fullscreen elements not found");
    }
}

// Function to close fullscreen view
function closeFullscreen() {
    console.log("Closing fullscreen");
    const fullscreenContainer = document.getElementById("fullscreenContainer");
    if (fullscreenContainer) {
        fullscreenContainer.style.display = "none";
        // Restore body scrolling
        document.body.style.overflow = "auto";
    }
}

function prevImage() {
    imageIndex = (imageIndex - 1 + images.length) % images.length;
    console.log("Navigating to previous image:", images[imageIndex]);
    
    // Update main image
    const mainImage = document.getElementById("mainImage");
    if (mainImage) {
        mainImage.style.backgroundImage = `url('/images/dash/${images[imageIndex]}')`;
    }
    
    // Update fullscreen image
    const fullscreenImage = document.getElementById("fullscreenImage");
    if (fullscreenImage) {
        fullscreenImage.src = `/images/dash/${images[imageIndex]}`;
    }
}

function nextImage() {
    imageIndex = (imageIndex + 1) % images.length;
    console.log("Navigating to next image:", images[imageIndex]);
    
    // Update main image
    const mainImage = document.getElementById("mainImage");
    if (mainImage) {
        mainImage.style.backgroundImage = `url('/images/dash/${images[imageIndex]}')`;
    }
    
    // Update fullscreen image
    const fullscreenImage = document.getElementById("fullscreenImage");
    if (fullscreenImage) {
        fullscreenImage.src = `/images/dash/${images[imageIndex]}`;
    }
}

function initializePage() {
    console.log("Initializing page");
    
    if (!selectedProduct || !selectedProduct.title) {
        console.error("No product data available");
        return;
    }
    
    // Set the main image with the correct URL format
    const mainImage = document.getElementById("mainImage");
    if (mainImage && images.length > 0) {
        mainImage.style.backgroundImage = `url('/images/dash/${images[imageIndex]}')`;
        console.log("Main image set in initializePage with URL:", `/images/dash/${images[imageIndex]}`);
    } else {
        console.error("Cannot set main image in initializePage");
    }

    // Set product type
    const productContainer = document.querySelector('[data-type]');
    if (productContainer) {
        productContainer.setAttribute('data-type', selectedProduct.type);
        console.log("Product type set to:", selectedProduct.type);
    }

    // Update stock status
    updateStockStatus();
}

// Function to update stock status display
function updateStockStatus() {
    const stockStatusElement = document.querySelector('.stock-status');

    if (stockStatusElement) {
        stockStatusElement.innerHTML = `
            <i class="fa fa-check-circle"></i>
            ${selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
        `;
        stockStatusElement.style.color = selectedProduct.stock > 0 ? '#10b981' : '#ef4444';
    }
}

function openProduct(productId) {
    console.log("Opening product:", productId); // Debugging log
    window.location.href = `/buy/${productId}`;
}

// Replace the global rating variables with product-specific logic
function getProductRating() {
    if (!selectedProduct || !selectedProduct.id) return { rating: 5, count: 1 };
    
    const productId = selectedProduct.id;
    let rating, count;
    
    // Product-specific default ratings
    if (productId === 1) { // Rottweiler
        rating = 5.0;
        count = 1;
    } else if (productId === 2) { // Royal Canin
        rating = 4.5;
        count = 2;
    } else if (productId === 3) { // Siamese Cat
        rating = 4.5;
        count = 2;
    } else {
        rating = 5.0;
        count = 1;
    }
    
    // Override with stored values if they exist
    const storedRating = sessionStorage.getItem(`rating_${productId}`);
    const storedCount = sessionStorage.getItem(`ratingCount_${productId}`);
    
    if (storedRating) rating = parseFloat(storedRating);
    if (storedCount) count = parseInt(storedCount);
    
    return { rating, count };
}

function displayRating() {
    // Check if server-side rating is already displayed
    const ratingValue = document.getElementById("ratingValue");
    const ratingCount = document.getElementById("ratingCount");
    
    // If both elements already have content, don't override server-side data
    if (ratingValue && ratingValue.textContent && 
        ratingCount && ratingCount.textContent) {
        console.log("Server-side rating already displayed, skipping client-side rating");
        return;
    }
    
    const { rating, count } = getProductRating();
    
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            starsHTML += `<i class='fa fa-star'></i>`;
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            starsHTML += `<i class='fa fa-star-half-o'></i>`;
        } else {
            starsHTML += `<i class='fa fa-star-o'></i>`;
        }
    }
    
    const starsElement = document.getElementById("stars");
    
    if (starsElement && !starsElement.innerHTML.trim()) starsElement.innerHTML = starsHTML;
    if (ratingValue && !ratingValue.textContent) ratingValue.innerText = rating.toFixed(1);
    if (ratingCount && !ratingCount.textContent) ratingCount.innerText = `(${count})`;
}

function submitRating() {
    if (!selectedProduct || !selectedProduct._id) {
        alert("Error: Cannot identify product. Please refresh the page and try again.");
        return;
    }
    
    // Get rating from the hidden input field
    const userRating = parseInt(document.getElementById('rating-value').value);
    
    if (!userRating || userRating === 0) {
        alert("Please select a star rating before submitting.");
        return;
    }
    
    // Get feedback text
    const feedbackText = document.getElementById("feedback").value.trim();
    
    // Save the review to MongoDB
    saveReviewToMongoDB(userRating, feedbackText);
}

function saveReviewToMongoDB(userRating, feedback) {
    if (!selectedProduct || !selectedProduct._id) return;
    
    // Create review data
    const reviewData = {
        rating: userRating,
        comment: feedback || "Great product!",
        targetType: 'Product',
        targetId: selectedProduct._id
    };
    
    // Show loading state
    const submitButton = document.getElementById('submit-review');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = 'Submitting...';
    }
    
    // Send to server
    fetch('/api/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit review');
        }
        return response.json();
    })
    .then(data => {
        // Update the displayed reviews
        displayReviews();
        
        // Reset form
        document.getElementById("feedback").value = "";
        document.getElementById('rating-value').value = "0";
        
        // Reset stars
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.classList.remove('selected');
            star.style.color = '#ddd';
        });
        
        // Reset button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = 'Submit';
        }
        
        // Show success message
        alert("Thank you for your feedback!");
    })
    .catch(error => {
        console.error('Error saving review:', error);
        alert("There was an error submitting your review. Please try again.");
        
        // Reset button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = 'Submit';
        }
    });
}

function displayReviews() {
    if (!selectedProduct || !selectedProduct._id) return;
    
    const productId = selectedProduct._id;
    const reviewSection = document.getElementById("reviewList");
    
    if (!reviewSection) return;
    
    // Clear existing reviews
    reviewSection.innerHTML = "<p>Loading reviews...</p>";
    
    // Fetch reviews from server
    fetch(`/api/reviews/product/${productId}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        return response.json();
    })
    .then(data => {
        reviewSection.innerHTML = "";
        
        // Check if we have reviews
        if (!data.success || !data.reviews) {
            reviewSection.innerHTML = "<p>No reviews yet. Be the first to review this product!</p>";
            return;
        }
        
        // Extract reviews array from the response
        const reviews = data.reviews;
        
        // If no reviews, show a message
        if (reviews.length === 0) {
            reviewSection.innerHTML = "<p>No reviews yet. Be the first to review this product!</p>";
            return;
        }
        
        // Update the product rating if available
        if (data.avgRating) {
            updateProductRating(data.avgRating, data.count);
        }
        
        // Create container for all reviews
        const reviewsContainer = document.createElement('div');
        reviewsContainer.className = 'reviews-container';
        
        // Display each review
        reviews.forEach(review => {
            const reviewDiv = document.createElement("div");
            reviewDiv.classList.add("review");
            
            // Generate stars HTML
            let starsHTML = "";
            for (let i = 0; i < 5; i++) {
                if (i < review.rating) {
                    starsHTML += `<span class="star filled">★</span>`;
                } else {
                    starsHTML += `<span class="star">★</span>`;
                }
            }
            
            // Format the date
            const reviewDate = new Date(review.createdAt).toLocaleDateString();
            
            // Get user info
            const username = review.user ? (review.user.username || review.user.firstName || 'Anonymous') : 'Anonymous';
            
            // Set review content
            reviewDiv.innerHTML = `
                <div class="review-header">
                    <div class="reviewer-info">
                        <strong>${username}</strong>
                    </div>
                    <div class="review-stars">${starsHTML}</div>
                    <div class="review-date">${reviewDate}</div>
                </div>
                <p class="review-text">${review.comment || ''}</p>
            `;
            
            // Add to reviews container
            reviewsContainer.appendChild(reviewDiv);
        });
        
        // Add all reviews to the section
        reviewSection.appendChild(reviewsContainer);
        
        // Add styling for the reviews
        addReviewStyles();
    })
    .catch(error => {
        console.error('Error fetching reviews:', error);
        reviewSection.innerHTML = "<p>Error loading reviews. Please try again later.</p>";
    });
}

// Add styling to reviews
function addReviewStyles() {
    // Check if we already added the styles
    if (document.getElementById('review-styles')) return;
    
    const reviewStyle = document.createElement('style');
    reviewStyle.id = 'review-styles';
    reviewStyle.textContent = `
        .reviews-container {
            width: 100%;
        }
        .review {
            background: #f9f9f9;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .review-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        .reviewer-info {
            font-size: 14px;
            font-weight: 500;
        }
        .review-stars {
            display: flex;
            gap: 2px;
        }
        .star {
            color: #ddd;
            font-size: 16px;
        }
        .star.filled {
            color: #FFD700;
        }
        .review-date {
            color: #777;
            font-size: 12px;
        }
        .review-text {
            color: #333;
            line-height: 1.5;
        }
        #reviewList {
            max-height: 500px;
            overflow-y: auto;
            padding: 10px 0;
        }
    `;
    document.head.appendChild(reviewStyle);
}

// Helper function to get current user ID
function getUserId() {
    const userDataElement = document.getElementById('userData');
    if (userDataElement) {
        return userDataElement.getAttribute('data-user-id');
    }
    return null;
}

// Function to update the product rating display with server data
function updateProductRating(avgRating, count) {
    // Get the elements
    const ratingValue = document.getElementById("ratingValue");
    const ratingCount = document.getElementById("ratingCount");
    const stars = document.getElementById("stars");
    
    // Check if the elements already have server-rendered content
    const hasServerRenderedRating = ratingValue && ratingValue.textContent && 
                                    ratingCount && ratingCount.textContent;
    
    if (hasServerRenderedRating) {
        console.log("Server-side rating already rendered, not updating from AJAX");
        return;
    }
    
    // Update the elements if they exist and don't have content
    if (ratingValue && !ratingValue.textContent) ratingValue.textContent = avgRating;
    if (ratingCount && !ratingCount.textContent) ratingCount.textContent = `(${count} reviews)`;
    
    if (stars && !stars.innerHTML.trim()) {
        let starsHTML = '';
        const rating = parseFloat(avgRating);
        
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                starsHTML += `<i class='fa fa-star'></i>`;
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                starsHTML += `<i class='fa fa-star-half-o'></i>`;
            } else {
                starsHTML += `<i class='fa fa-star-o'></i>`;
            }
        }
        
        stars.innerHTML = starsHTML;
    }
}

// Handle the star selection and form submission
document.addEventListener('DOMContentLoaded', function() {
    // Star rating functionality
    const stars = document.querySelectorAll('.star');
    const ratingValueInput = document.getElementById('rating-value');
    const formRatingInput = document.getElementById('form-rating-value');
    const formCommentInput = document.getElementById('form-comment-value');
    const feedbackTextarea = document.getElementById('feedback');
    const reviewForm = document.getElementById('review-form');
    
    // Initialize stars
    stars.forEach(star => {
        // Click handler
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            ratingValueInput.value = value;
            
            if (formRatingInput) {
                formRatingInput.value = value;
            }
            
            // Update star visual state
            updateStars(value);
        });
        
        // Hover effects
        star.addEventListener('mouseover', function() {
            const value = parseInt(this.getAttribute('data-value'));
            hoverStars(value);
        });
        
        star.addEventListener('mouseout', function() {
            const selectedValue = parseInt(ratingValueInput.value) || 0;
            updateStars(selectedValue);
        });
    });
    
    // Form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get rating
            const rating = parseInt(ratingValueInput.value);
            if (!rating || rating === 0) {
                alert("Please select a star rating before submitting.");
                return;
            }
            
            // Get comment
            const comment = feedbackTextarea.value.trim();
            
            // Update form values
            formRatingInput.value = rating;
            formCommentInput.value = comment;
            
            // Submit form
            this.submit();
        });
    }
    
    // Update stars based on rating
    function updateStars(rating) {
        stars.forEach(star => {
            const value = parseInt(star.getAttribute('data-value'));
            if (value <= rating) {
                star.classList.add('selected');
                star.style.color = '#FFD700';
            } else {
                star.classList.remove('selected');
                star.style.color = '#ddd';
            }
        });
    }
    
    // Temporarily highlight stars on hover
    function hoverStars(rating) {
        stars.forEach(star => {
            const value = parseInt(star.getAttribute('data-value'));
            if (value <= rating) {
                star.style.color = '#FFD700';
            } else {
                star.style.color = '#ddd';
            }
        });
    }
    
    // Check if there's a pre-existing review to populate the form
    const existingRating = document.getElementById('existing-rating');
    if (existingRating) {
        const rating = parseInt(existingRating.value);
        if (rating > 0) {
            ratingValueInput.value = rating;
            updateStars(rating);
            
            // Also populate comment if available
            const existingComment = document.getElementById('existing-comment');
            if (existingComment && feedbackTextarea) {
                feedbackTextarea.value = existingComment.value;
            }
        }
    }
});

const pincodeMapping = {
    "110001": "New Delhi, Delhi",
    "400001": "Mumbai, Maharashtra",
    "600001": "Chennai, Tamil Nadu",
    "500001": "Hyderabad, Telangana",
    "700001": "Kolkata, West Bengal",
    "530045": "Visakhapatnam, Andhra Pradesh"
};

// Fetch the place based on pincode without using an API
function fetchAddress() {
    const pincode = document.getElementById("pincodeInput").value.trim();
    const placeOutput = document.getElementById("placeOutput");

    // Check if the pincode is valid (6 digits)
    if (!pincode || isNaN(pincode) || pincode.length !== 6) {
        placeOutput.innerText = "Please enter a valid 6-digit pincode.";
        return;
    }

    // Check if the pincode exists in our predefined mapping
    if (pincodeMapping[pincode]) {
        const place = pincodeMapping[pincode];
        placeOutput.innerText = `Delivery available in ${place}`;

        // Store the pincode and address in sessionStorage
        sessionStorage.setItem('pincode', pincode);
        sessionStorage.setItem('deliveryAddress', place);
    } else {
        placeOutput.innerText = "Delivery not available in this area.";
    }
}

// Retrieve pincode and address on page load (even after refresh)
window.onload = function () {
    // Retrieve pincode and address from sessionStorage
    const storedPincode = sessionStorage.getItem('pincode');
    const storedAddress = sessionStorage.getItem('deliveryAddress');

    // If both pincode and address exist, display them
    if (storedPincode && storedAddress) {
        const pincodeInput = document.getElementById("pincodeInput");
        const placeOutput = document.getElementById("placeOutput");
        if (pincodeInput) pincodeInput.value = storedPincode; // Fill the pincode input
        if (placeOutput) placeOutput.innerText = `Delivery available in ${storedAddress}`; // Display the address
    }
    
    // Check if seller info elements exist before attempting to set them
    const sellerNameText = document.getElementById('sellerNameText');
    const sellerRatingText = document.getElementById('sellerRatingText');
    const sellerLocationText = document.getElementById('sellerLocationText');
    
    if (sellerNameText || sellerRatingText || sellerLocationText) {
        const sellerInfo = {
            name: "PetWorld Store",
            rating: 4.5,  // This can be dynamically fetched
            location: "Mumbai, Maharashtra"
        };

        // Dynamically set the seller information in the HTML only if elements exist
        if (sellerNameText) sellerNameText.innerText = sellerInfo.name;
        if (sellerRatingText) sellerRatingText.innerText = sellerInfo.rating + " / 5";
        if (sellerLocationText) sellerLocationText.innerText = sellerInfo.location;
    }
    
    // These function calls now check for server-rendered data before updating
    displayRating();
    
    // Only call displayReviews if we're using client-side review loading
    const ratingValue = document.getElementById("ratingValue");
    const ratingCount = document.getElementById("ratingCount");
    const hasServerRenderedRating = ratingValue && ratingValue.textContent && 
                                    ratingCount && ratingCount.textContent;
    
    if (!hasServerRenderedRating) {
        displayReviews();
    }
    
    updateCartCount();
};

document.querySelector(".read-more").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default anchor behavior
});

document.addEventListener("DOMContentLoaded", function () {
    // Select the "Read More" link
    const readMoreLink = document.querySelector(".read-more");

    // Add event listener to scroll to footer on click
    if (readMoreLink) {
        readMoreLink.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default link behavior
            document.querySelector("#footer").scrollIntoView({
                behavior: "smooth" // Smooth scrolling effect
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    
    // Load cart count
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const count = localStorage.getItem('cartCount') || '0';
        cartCount.textContent = count;
        cartCount.style.display = count === '0' ? 'none' : 'inline-block';
    }
});

/* Buy Page - Adjust Button Sizes */
/* Adding Product Descriptions Dynamically */
const descriptionContainer = document.createElement('div');
descriptionContainer.className = 'product-description';
descriptionContainer.innerHTML = `<p>${selectedProduct.description || 'No description available.'}</p>`;
document.querySelector('[data-type]').appendChild(descriptionContainer);

descriptionContainer.style.marginTop = '20px';
descriptionContainer.style.fontSize = '1rem';
descriptionContainer.style.color = '#444';
descriptionContainer.style.lineHeight = '1.5';

function scrollToRate() {
    const rateSection = document.getElementById("rateSection");
    if (rateSection) {
        rateSection.style.display = "block";
        rateSection.scrollIntoView({ behavior: "smooth" });
    }
}

// Add back the star selection event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll(".rate-stars .fa").forEach(star => {
        star.addEventListener("click", function () {
            const userRating = parseInt(this.getAttribute("data-value"));
            document.querySelectorAll(".rate-stars .fa").forEach((s, index) => {
                s.classList.toggle("selected", index < userRating);
            });
        });
    });
});

// Function to check if the user has already reviewed this product
function checkExistingReview() {
    if (!selectedProduct || !selectedProduct._id) return;
    
    fetch(`/api/reviews/user/Product/${selectedProduct._id}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    console.log('User not logged in');
                    return null;
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.success && data.hasReview) {
                // User has an existing review - populate the form
                const review = data.review;
                populateReviewForm(review);
            }
        })
        .catch(error => {
            console.error('Error checking existing review:', error);
        });
}

// Function to populate the review form with existing review data
function populateReviewForm(review) {
    if (!review) return;
    
    // Set rating
    const ratingValue = document.getElementById('rating-value');
    if (ratingValue) {
        ratingValue.value = review.rating;
    }
    
    // Set feedback text
    const feedbackElement = document.getElementById('feedback');
    if (feedbackElement && review.comment) {
        feedbackElement.value = review.comment;
    }
    
    // Update star display
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        const value = parseInt(star.getAttribute('data-value'));
        if (value <= review.rating) {
            star.classList.add('selected');
            star.style.color = '#FFD700';
        }
    });
}

