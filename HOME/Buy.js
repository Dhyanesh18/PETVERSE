const selectedProduct = JSON.parse(sessionStorage.getItem("selectedProduct")) || {};

let images = [selectedProduct.image_url, selectedProduct.image1, selectedProduct.image2, selectedProduct.image3].filter(Boolean);
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    updateCartCount(); // Ensure cart count updates when the page loads

    if (images.length > 0) {
        document.getElementById("mainImage").style.backgroundImage = `url(${images[currentIndex]})`;
    }

    const thumbnailsContainer = document.querySelector(".thumbnail-container");
    thumbnailsContainer.innerHTML = images.map((img, index) =>
        `<img src="${img}" class="thumbnail" onclick="changeImage(${index})">`
    ).join('');

    // Ensure add-to-cart button updates cart count dynamically
    document.querySelector('.add-to-cart-btn').addEventListener('click', () => {
        addToCart(selectedProduct.id);
        updateCartCount(); // Immediately update cart count on the page
    });

    // Ensure buy-now button updates cart and redirects to Cart.html
    document.querySelector('.buy-now-btn').addEventListener('click', () => {
        addToCart(selectedProduct.id);
        updateCartCount();
        window.location.href = 'Cart.html';
    });
});

function changeImage(index) {
    currentIndex = index;
    document.getElementById("mainImage").style.backgroundImage = `url(${images[currentIndex]})`;
}

function openFullscreen() {
    document.getElementById("fullscreenImage").src = images[currentIndex];
    document.getElementById("fullscreenContainer").style.display = "flex";
}

function closeFullscreen() {
    document.getElementById("fullscreenContainer").style.display = "none";
}

function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    changeImage(currentIndex);
    document.getElementById("fullscreenImage").src = images[currentIndex];
}

function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    changeImage(currentIndex);
    document.getElementById("fullscreenImage").src = images[currentIndex];
}

function initializePage() {
    if (!selectedProduct || !selectedProduct.title) {
        window.location.href = "Products.html";
        return;
    }

    document.querySelector("h3").textContent = selectedProduct.title;
    document.getElementById("mainImage").style.backgroundImage = `url(${images[currentIndex]})`;

    let price = parseFloat(selectedProduct.price.replace(/,/g, '')); // Convert price to number
    let discount = parseFloat(selectedProduct.dis.replace('%', '')); // Convert discount to number

    // Calculate MRP
    let mrp = price / (1 - (discount / 100));
    let formattedMRP = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(mrp.toFixed(2));

    // Update price and MRP in HTML
    document.querySelector(".final-price").innerHTML = `₹ ${price.toLocaleString()} 
        <span style="font-size:small;" class="discount">SAVE ${selectedProduct.dis} 
            <span style="font-family: cursive;font-size: 0.4rem;"> (Incl. of all taxes)</span>
        </span>`;

    document.querySelector(".mrp").innerHTML = formattedMRP;

    const productContainer = document.querySelector('[data-type]');
    if (productContainer) {
        productContainer.setAttribute('data-type', selectedProduct.type);
    }

    renderSimilarProducts();
    updateStockStatus();
}

// Function to update stock status display
function updateStockStatus() {
    const stockStatus = document.createElement('div');
    stockStatus.className = 'stock-status';
    stockStatus.innerHTML = `
        <i class="fa fa-check-circle"></i>
        ${selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}`;
    stockStatus.style.color = selectedProduct.stock > 0 ? '#10b981' : '#ef4444';

    // Insert stock status after price
    const priceContainer = document.querySelector('.price');
    if (priceContainer) {
        const existingStatus = priceContainer.querySelector('.stock-status');
        if (existingStatus) {
            existingStatus.replaceWith(stockStatus);
        } else {
            priceContainer.insertBefore(stockStatus, priceContainer.children[2]);
        }
    }
}

// Function to update cart count dynamically
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let cartCountElement = document.getElementById('cartCount');

    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
    cartCountElement.style.display = totalItems > 0 ? 'inline-block' : 'none';
}
function openProduct(productId) {
    let product = products.find(p => p.id === productId);
    if (!product) return;

    sessionStorage.setItem("selectedProduct", JSON.stringify(product));
    window.location.href = "Buy.html";
}

let rating = sessionStorage.getItem('rating') ? parseFloat(sessionStorage.getItem('rating')) : 5;
let ratingCount = sessionStorage.getItem('ratingCount') ? parseInt(sessionStorage.getItem('ratingCount')) : 1;
let userRating = 0;

function displayRating() {
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
    document.getElementById("stars").innerHTML = starsHTML;
    document.getElementById("ratingValue").innerText = rating.toFixed(1);
    document.getElementById("ratingCount").innerText = `(${ratingCount})`;
}

function scrollToRate() {
    document.getElementById("rateSection").style.display = "block";
    document.getElementById("rateSection").scrollIntoView({ behavior: "smooth" });
}

document.querySelectorAll(".rate-stars .fa").forEach(star => {
    star.addEventListener("click", function () {
        userRating = parseInt(this.getAttribute("data-value"));
        document.querySelectorAll(".rate-stars .fa").forEach(s => s.classList.remove("selected"));
        for (let i = 0; i < userRating; i++) {
            document.querySelectorAll(".rate-stars .fa")[i].classList.add("selected");
        }
    });
});

function submitRating() {
    if (userRating > 0) {
        rating = ((rating * ratingCount) + userRating) / (ratingCount + 1);
        ratingCount++;
        sessionStorage.setItem('rating', rating);
        sessionStorage.setItem('ratingCount', ratingCount);
        displayRating();
        alert("Thank you for your feedback!");
    } else {
        alert("Please select a rating before submitting.");
    }
}
function handleImageUpload(event) {
    const imagePreview = document.getElementById("imagePreview");
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

function submitReview() {
    let userRating = document.querySelectorAll(".rate-stars .fa.selected").length;
    let feedbackText = document.getElementById("feedback").value.trim();
    let uploadedImages = document.querySelectorAll(".image-preview img");

    if (userRating === 0) {
        alert("Please select a rating before submitting.");
        return;
    }

    let review = {
        rating: userRating,
        feedback: feedbackText,
        images: Array.from(uploadedImages).map(img => img.src)
    };

    // Retrieve existing reviews
    let reviews = JSON.parse(sessionStorage.getItem("reviews"));

    // Ensure reviews is always an array
    if (!Array.isArray(reviews)) {
        reviews = [];
    }

    // Add new review
    reviews.unshift(review);
    sessionStorage.setItem("reviews", JSON.stringify(reviews));

    displayReviews();

    // Clear inputs
    document.getElementById("feedback").value = "";
    document.getElementById("imagePreview").innerHTML = "";
}
function saveReview(feedback, images) {
    let reviews = JSON.parse(sessionStorage.getItem("reviews")) || []; // Ensure we get an array
    
    let newReview = {
        rating: userRating || 5, // Default to 5 if no rating is given
        feedback: feedback,
        images: images || [] // Store image URLs if any
    };

    reviews.push(newReview); // Add new review
    sessionStorage.setItem("reviews", JSON.stringify(reviews)); // Save back to storage

    displayReviews(); // Refresh the UI
}


function displayReviews() {
    let reviewSection = document.getElementById("reviewList");
    reviewSection.innerHTML = "";

    let reviews = JSON.parse(sessionStorage.getItem("reviews")) || []; // Get stored reviews
    if (!Array.isArray(reviews)) { // Handle any storage corruption
        reviews = [];
    }

    if (reviews.length === 0) {
        reviewSection.innerHTML = "<p>No reviews yet.</p>";
        return;
    }

    reviews.forEach(review => {
        let reviewDiv = document.createElement("div");
        reviewDiv.classList.add("review");

        let starsHTML = "";
        for (let i = 0; i < review.rating; i++) {
            starsHTML += `<i class='fa fa-star review-stars'></i>`;
        }

        let imageHTML = review.images.map(imgSrc => `<img src="${imgSrc}" alt="Review Image" class="review-image">`).join('');

        reviewDiv.innerHTML = `
            <p><strong>Rating:</strong> ${starsHTML}</p>
            <p>${review.feedback}</p>
            <div class="review-images">${imageHTML}</div>
        `;
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

