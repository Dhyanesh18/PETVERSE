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
    const ratingValueElement = document.getElementById("ratingValue");
    const ratingCountElement = document.getElementById("ratingCount");
    
    if (starsElement) starsElement.innerHTML = starsHTML;
    if (ratingValueElement) ratingValueElement.innerText = rating.toFixed(1);
    if (ratingCountElement) ratingCountElement.innerText = `(${count})`;
}

function submitRating() {
    if (!selectedProduct || !selectedProduct.id) {
        alert("Error: Cannot identify product. Please refresh the page and try again.");
        return;
    }
    
    const userRating = document.querySelectorAll(".rate-stars .fa.selected").length;
    if (userRating === 0) {
        alert("Please select a rating before submitting.");
        return;
    }
    
    const productId = selectedProduct.id;
    const { rating, count } = getProductRating();
    
    // Calculate new average rating
    const newRating = ((rating * count) + userRating) / (count + 1);
    const newCount = count + 1;
    
    // Store product-specific ratings
    sessionStorage.setItem(`rating_${productId}`, newRating);
    sessionStorage.setItem(`ratingCount_${productId}`, newCount);
    
    // Get feedback text
    const feedbackText = document.getElementById("feedback").value.trim();
    
    // Save the review
    saveReview(userRating, feedbackText);
    
    // Update the displayed rating
    displayRating();
    
    // Clear the form
    document.getElementById("feedback").value = "";
    document.getElementById("imagePreview").innerHTML = "";
    document.querySelectorAll(".rate-stars .fa").forEach(s => s.classList.remove("selected"));
    
    alert("Thank you for your feedback!");
}

function saveReview(userRating, feedback) {
    if (!selectedProduct || !selectedProduct.id) return;
    
    const productId = selectedProduct.id;
    
    // Get product-specific reviews
    let reviews = JSON.parse(sessionStorage.getItem(`reviews_${productId}`)) || [];
    
    // Get uploaded images
    const uploadedImages = Array.from(document.querySelectorAll(".image-preview img"))
        .map(img => img.src);
    
    // Create new review
    let newReview = {
        rating: userRating,
        feedback: feedback || "Great product!",
        images: uploadedImages,
        date: new Date().toLocaleDateString()
    };
    
    // Add new review to the beginning of the array
    reviews.unshift(newReview);
    
    // Save product-specific reviews
    sessionStorage.setItem(`reviews_${productId}`, JSON.stringify(reviews));
    
    // Refresh the reviews display
    displayReviews();
}

function displayReviews() {
    if (!selectedProduct || !selectedProduct.id) return;
    
    const productId = selectedProduct.id;
    const reviewSection = document.getElementById("reviewList");
    
    if (!reviewSection) return;
    
    // Clear existing reviews
    reviewSection.innerHTML = "";
    
    // Get product-specific reviews
    let reviews = JSON.parse(sessionStorage.getItem(`reviews_${productId}`)) || [];
    
    // If no reviews, create default reviews based on product ID
    if (reviews.length === 0) {
        if (productId === 2) { // Royal Canin Dog Food
            reviews = [
                {
                    rating: 5,
                    feedback: "My dog loves this food! His coat is shinier and he has more energy.",
                    images: [],
                    date: "2023-10-15"
                },
                {
                    rating: 4,
                    feedback: "Good quality but a bit expensive. Still worth it for the health benefits.",
                    images: [],
                    date: "2023-09-22"
                }
            ];
            sessionStorage.setItem(`reviews_${productId}`, JSON.stringify(reviews));
        } else if (productId === 3) { // Siamese Cat
            reviews = [
                {
                    rating: 5,
                    feedback: "Beautiful cat! Very playful and affectionate. Adapts well to new environments.",
                    images: [],
                    date: "2023-11-05"
                },
                {
                    rating: 4,
                    feedback: "Lovely companion, though a bit vocal at night. Overall very satisfied!",
                    images: [],
                    date: "2023-10-18"
                }
            ];
            sessionStorage.setItem(`reviews_${productId}`, JSON.stringify(reviews));
        } else if (productId === 1) { // Rottweiler
            reviews = [
                {
                    rating: 5,
                    feedback: "Excellent temperament and very healthy puppy. The breeder was professional and caring.",
                    images: [],
                    date: "2023-11-10"
                }
            ];
            sessionStorage.setItem(`reviews_${productId}`, JSON.stringify(reviews));
        }
    }
    
    // If still no reviews, show a message
    if (reviews.length === 0) {
        reviewSection.innerHTML = "<p>No reviews yet. Be the first to review this product!</p>";
        return;
    }
    
    // Display each review
    reviews.forEach(review => {
        let reviewDiv = document.createElement("div");
        reviewDiv.classList.add("review");
        
        // Generate stars HTML
        let starsHTML = "";
        for (let i = 0; i < 5; i++) {
            if (i < review.rating) {
                starsHTML += `<i class='fa fa-star review-stars'></i>`;
            } else {
                starsHTML += `<i class='fa fa-star-o review-stars'></i>`;
            }
        }
        
        // Generate images HTML
        let imageHTML = "";
        if (review.images && review.images.length > 0) {
            imageHTML = review.images
                .map(imgSrc => `<img src="${imgSrc}" alt="Review Image" class="review-image">`)
                .join('');
        }
        
        // Set review content
        reviewDiv.innerHTML = `
            <div class="review-header">
                <div class="review-stars">${starsHTML}</div>
                <div class="review-date">${review.date}</div>
            </div>
            <p class="review-text">${review.feedback}</p>
            ${imageHTML ? `<div class="review-images">${imageHTML}</div>` : ''}
        `;
        
        // Add to review section
        reviewSection.appendChild(reviewDiv);
    });
}

// Handle star selection
document.querySelectorAll(".rate-stars .fa").forEach(star => {
    star.addEventListener("click", function () {
        let value = parseInt(this.getAttribute("data-value"));
        document.querySelectorAll(".rate-stars .fa").forEach((s, index) => {
            s.classList.toggle("selected", index < value);
        });
    });
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
        document.getElementById("pincodeInput").value = storedPincode; // Fill the pincode input
        document.getElementById("placeOutput").innerText = `Delivery available in ${storedAddress}`; // Display the address
    }
    const sellerInfo = {
        name: "PetWorld Store",
        rating: 4.5,  // This can be dynamically fetched
        location: "Mumbai, Maharashtra"
    };

    // Dynamically set the seller information in the HTML
    document.getElementById('sellerNameText').innerText = sellerInfo.name;
    document.getElementById('sellerRatingText').innerText = sellerInfo.rating + " / 5";
    document.getElementById('sellerLocationText').innerText = sellerInfo.location;
    displayRating();
    displayReviews();
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

function handleImageUpload(event) {
    const imagePreview = document.getElementById("imagePreview");
    if (imagePreview) {
        imagePreview.innerHTML = ""; // Clear existing previews

        Array.from(event.target.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.alt = "Uploaded Image";
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
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

