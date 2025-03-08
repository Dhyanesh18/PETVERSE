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
// Global Cart State
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isCartOpen = false;// Convert price string to number
function priceToNumber(priceStr) {
    if (!priceStr) return 0; // Handle undefined or null values
    return parseInt(priceStr.toString().replace(/,/g, ''), 10);
}


function formatPrice(price) {
    return new Intl.NumberFormat('en-IN').format(price);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    updateCartCount();
}

function removeFromCart(productId) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Find the item in the cart
    let itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
        // Decrease quantity if more than 1, else remove item
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1); // Remove item if quantity is 1
        }
    }

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
                <a href="./Products.html" class="continue-shopping">
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

    cartItems.innerHTML = cart.map(item => {
        let stockValue = item.stock  || 0; // Ensure stock has a default value
        let stockText = stockValue > 0 ? "In Stock" : "Out of Stock";
        let stockColor = stockValue > 0 ? "green" : "red";
        return  `
         <div class="cart-item">
            <div class="cart-item-left">
                <div class="cart-image-container">
                    <img src="${item.image_url}" alt="${item.Breed}" class="cart-item-image">
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
    `}).join('');
    const total = cart.reduce((sum, item) => sum + (priceToNumber(item.price) * item.quantity), 0);
    cartTotal.textContent = formatPrice(total);

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
    window.location.href = 'Cart.html';
}

document.addEventListener("DOMContentLoaded", function () {
    const cartIcon = document.getElementById("cartIcon");
    if (cartIcon) {
        cartIcon.onclick = toggleCart;
    }
});
document.addEventListener("DOMContentLoaded", () => {
    renderProducts();
    updateCart();
});
// Run on Page Load
updateCart();
// Open Cart
function openCart() {
    if (!isCartOpen) {
        toggleCart();
    }
}

function remove(productId) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Filter out the item completely from the cart
    cart = cart.filter(item => item.id !== productId);

    // Save updated cart and refresh UI
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Product Data
const products = [
    {
        title: "Premium Rottweiler Puppies for Sale | Champion Bloodline | Healthy & Vet-Checked | Home Delivery Available!",
        Breed: "Rottweiler",
        id: 1,
        price: "25,005",
        gender: "male",
        dis: "25%",
        city: "Bangalore",
        image_url: "Rottweiler-dog.webp",
        image1: "Rottweiler-dog1.webp",
        image2: "rottweiler-dog2.jpg",
        image3: "rottweiler-dog3.jpg",
        is_active: true,
        category: "Old",
        type: "Dog",
        age: "2 Month",
        stock: 5
    },
    {
        title: "Royal Canin Dog Food | Vet-Approved | Best for Growth & Immunity | Order Now!",
        Breed: "Royal Canin",
        id: 2,
        price: "45,005",
        gender: "",
        age: "2 Years",
        dis: "10%",
        type: "Dog-food",
        city: "Bangalore",
        image_url: "Royal_Canin.jpg",
        image1: "RoyalCanin_1.jpg",
        image2: "RoyalCanin_2.jpg",
        image3: "RoyalCanin_3.jpg",
        category: "New",
        is_active: true,
        stock: 10
    },
    {
        title: "Adorable Cat for Sale | Vaccinated & Healthy | Perfect Companion for Your Home!",
        Breed: "Siamese Cat",
        id: 3,
        price: "24,500",
        gender: "Female",
        age: "4 Years",
        dis: "5%",
        city: "Vijayawada",
        category: "New",
        type: "Cat",
        image_url: "cat1.jpg",
        image1: "Cat_1.jpg",
        image2: "Cat_2.jpg",
        image3: "Cat_3.jpg",
        is_active: true,
        stock: 5
    },
    {
        title: "Pedigree Dog Food | Complete Nutrition | Strong Bones & Shiny Coat | Buy Now!",
        Breed: "Pedigree",
        id: 4,
        price: "51,000",
        gender: "",
        age: "2.5 Year",
        dis: "1%",
        city: "",
        category: "Old",
        type: "food",
        image_url: "pedigree.jpg",
        image1: "Pedigree_1.jpg",
        image2: "Pedigree_2.jpg",
        image3: "Pedigree_3.jpg",
        is_active: true,
        stock: 5
    },
    {
        title: "Farmina Pet Food | High-Protein & Natural Ingredients | Perfect for Growing Pets!",
        Breed: "Farmina",
        id: 5,
        price: "2,000",
        gender: " ",
        age: "1 Year",
        dis: "2%",
        category: "New",
        city: " ",
        type: "food",
        image_url: "farmina.jpg",
        image1: "Farmina_1.jpg",
        image2: "Farmina_2.jpg",
        image3: "Farmina_3.jpg",
        is_active: true,
        stock: 5
    },
    {
        title: "Carniwel Premium Pet Food | Rich in Essential Nutrients | Boosts Energy & Immunity!",
        Breed: "Carniwel",
        id: 6,
        price: "11,543",
        gender: " ",
        age: "11 Months",
        dis: "5%",
        category: "Old",
        city: " ",
        type: "food",
        image_url: "Carniwel.webp",
        image1: "Carniwel_1.jpg",
        image2: "Carniwel_2.jpg",
        image3: "Carniwel_3.jpg",
        is_active: true,
        stock: 5
    },
    {
        title: "Drools Dog Food | Stronger Bones & Muscles | Vet-Recommended | Order Today!",
        Breed: "Drools",
        id: 7,
        price: "2,983",
        gender: " ",
        age: "18 Months",
        dis: "10%",
        category: "Old",
        city: " ",
        type: "Dog-food",
        image_url: "Drools.jpg",
        image1: "Drools_1.jpg",
        image2: "Drools_2.jpg",
        image3: "Drools_3.jpg",
        is_active: true,
        stock: 5
    },
    {
        title: "Maine Coon Cat for Sale | Majestic & Friendly | Perfect Indoor Pet | Book Now!",
        Breed: "Maine Coon",
        id: 8,
        price: "29,000",
        gender: " ",
        age: "1 Year",
        dis: "30%",
        category: "New",
        city: "Delhi ",
        type: "Cat",
        image_url: "cat_products1.jpg",
        image1: "MaineCoon_1.jpg",
        image2: "MaineCoon_2.jpg",
        image3: "MaineCoon_3.jpg",
        is_active: true,
        stock: 5
    },
    {
        title: "Siberian Cat for Sale | Soft, Fluffy & Playful | Limited Stock Available!",
        Breed: "Siberian",
        id: 9,
        price: "5,000",
        gender: "Female",
        age: "1.5 Year",
        dis: "10%",
        category: "Our choice",
        city: "Delhi ",
        type: "Cat",
        image_url: "cat2.jpg",
        image1: "Siberian_1.jpg",
        image2: "Siberian_2.jpg",
        image3: "Siberian_3.jpg",
        is_active: true,
        stock: 5
    },
    {
        title: "Husky Puppy for Sale | Blue-Eyed Beauty | Playful & Loyal | Reserve Yours Now!",
        Breed: "Husky",
        id: 10,
        price: "9,000",
        gender: "Male",
        age: "15 Month",
        dis: "27%",
        category: "New",
        city: "Tamil Nadu ",
        type: "Dog",
        image_url: "dog2.jpg",
        image1: "Husky_1.jpg",
        image2: "Husky_2.jpg",
        image3: "Husky_3.jpg",
        is_active: true,
        stock: 5
    },
    {
        title: "Henlo Pet Food | Super Tasty & Nutrient-Rich | Give Your Pet the Best!",
        Breed: "Henlo",
        id: 11,
        price: "45,800",
        gender: " ",
        age: "2 Year",
        dis: "3%",
        category: "Old",
        city: " ",
        type: "Food",
        image_url: "Henlo.webp",
        image1: "Henlo_1.jpg",
        image2: "Henlo_2.jpg",
        image3: "Henlo_3.jpg",
        is_active: true,
        stock: 5
    },
];

function renderProducts() {
    const cardDetailsTrend = document.getElementById("card");

    if (!cardDetailsTrend) {
        console.error("Error: 'card' container not found.");
        return;
    }

    let outPut = "";
    products.forEach((product) => {
        outPut += `
            <div class="container">
                <div class="card" onclick="openProduct(${product.id})">
                    <div class="card-head">
                        <img src="${product.image_url}" alt="${product.Breed}" class="card-logo">
                    </div>
                    <div class="card-body">
                        <div class="product-desc">
                            <span class="product-title">
                                ${product.Breed}
                                <span class="badge">${product.category}</span>
                            </span>
                            <span class="product-rating">
                                <i class="fa fa-star"></i>
                                <i class="fa fa-star"></i>
                                <i class="fa fa-star"></i>
                                <i class="fa fa-star"></i>
                                <i class="fa fa-star grey"></i>
                            </span>
                        </div>
                        <div class="product-properties">
                            <span class="product-size">
                                <h4>Age: <b>${product.age}</b></h4>
                                <h3 style="color: #000000;">₹ ${formatPrice(priceToNumber(product.price))} 
                                    <span style="font-size:small;" class="discount-text">&nbsp;${product.dis} Off</span> 
                                </h3>
                            </span>
                            <span class="product-color">
                                <button onclick="event.stopPropagation(); addToCart(${product.id})" class="product-price">Add To Cart</button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    cardDetailsTrend.innerHTML = outPut;
}

// Function to open Buy.html with product details
function openProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Store product details in sessionStorage
    sessionStorage.setItem("selectedProduct", JSON.stringify(product));

    // Redirect to Buy.html
    window.location.href = "Buy.html";
}


document.addEventListener("DOMContentLoaded", () => {
    const cardContainer = document.getElementById("card");

    if (cardContainer) {
        renderProducts();  // Only run this function if "card" exists
    }

    updateCart(); // This can run on all pages if needed
});

function renderSimilarProducts() {
    const container = document.getElementById('similarProducts');
    if (!container) return;

    const currentProductElement = document.querySelector('[data-type]');
    if (!currentProductElement) {
        console.error("Error: No product with [data-type] found.");
        return;
    }

    const currentProductType = currentProductElement.getAttribute('data-type');
    if (!currentProductType) {
        console.error("Error: Missing 'data-type' attribute.");
        return;
    }

    const similarProducts = products
        .filter(product => product.type.toLowerCase().includes(currentProductType.toLowerCase()))
        .slice(0, 6); // Show first 6 similar products

    container.innerHTML = similarProducts.map(product => `
            <div class="container" onclick="openProduct(${product.id})">
                <div class="card">
                    <div class="card-head">
                        <img src="${product.image_url}" alt="logo" class="card-logo">
                    </div>
                    <div class="card-body">
                        <div class="product-desc">
                            <span class="product-title">
                                ${product.Breed}
                                <span class="badge">${product.category}</span>
                            </span>
                            <span class="product-rating">
                                <i class="fa fa-star"></i>
                                <i class="fa fa-star"></i>
                                <i class="fa fa-star"></i>
                                <i class="fa fa-star"></i>
                                <i class="fa fa-star grey"></i>
                            </span>
                        </div>
                        <div class="product-properties">
                            <span class="product-size">
                                <h4>Age: <b>${product.age}</b></h4>
                                <h3 style="color: #000000;">₹ ${formatPrice(priceToNumber(product.price))} 
                                    <span style="font-size:x-small;" class="discount-text">&nbsp;${product.dis} Off</span> 
                                </h3>
                            </span>
                            <span class="product-color">
                                <button onclick="event.stopPropagation(); addToCart(${product.id})" class="product-price">Add To Cart</button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
    `).join('');
}

function slideProducts(direction) {
    const container = document.querySelector('.products-container');
    const scrollAmount = 330; // Card width + gap
    container.scrollLeft += direction * scrollAmount;
}

// Initialize similar products on page load
document.addEventListener('DOMContentLoaded', () => {
    renderSimilarProducts();
});
// Filtering logic for similar products


// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderSimilarProducts();
    updateCart();

    // Initialize rating stars
    document.querySelectorAll(".rate-stars .fa").forEach(star => {
        star.addEventListener("click", function() {
            userRating = parseInt(this.getAttribute("data-value"));
            document.querySelectorAll(".rate-stars .fa").forEach(s => s.classList.remove("selected"));
            for (let i = 0; i < userRating; i++) {
                document.querySelectorAll(".rate-stars .fa")[i].classList.add("selected");
            }
        });
    });
});
