let currentIndex = 0;
let autoSlideInterval;

// Function to show a specific slide
function showSlide(index) {
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  // Loop through slides to reset visibility
  slides.forEach((slide, i) => {
    slide.style.display = 'none';
    slide.style.transform = 'scale(0.8)'; // Shrink slides slightly for perspective
  });
  // Calculate new index
  currentIndex = (index + totalSlides) % totalSlides;
  // Show the current slide
  slides[currentIndex].style.display = 'block';
  slides[currentIndex].style.transform = 'scale(1)'; // Highlight current slide
  updateDots();
}

// Function to change slides
function changeSlide(step) {
  showSlide(currentIndex + step);
  resetAutoSlide();
}

// Auto-slide functionality
function autoSlide() {
  autoSlideInterval = setInterval(() => {
    changeSlide(1);
  }, 3000);
}

// Reset auto-slide timer
function resetAutoSlide() {
  clearInterval(autoSlideInterval);
  autoSlide();
}

function updateDots() {
  const dots = document.querySelectorAll('.dots span');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

function initDots() {
  const dotsContainer = document.querySelector('.dots');
  const slides = document.querySelectorAll('.slide');
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.addEventListener('click', () => {
      showSlide(i);
      resetAutoSlide();
    });
    dotsContainer.appendChild(dot);
  });
}

// Initialize the slideshow
document.addEventListener('DOMContentLoaded', () => {
  showSlide(currentIndex);
  initDots();
  updateDots();
  autoSlide();
  updateCartCountFromServer();
});

// Scroll event for navbar
document.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  const scrollPosition = window.scrollY;
  const threshold = 50;

  if (scrollPosition > threshold) {
    navbar.classList.add('scrolled');
  } else {
    // Only remove scrolled class if hamburger menu is not active
    const navlinks = document.querySelector('.nav-links');
    if (!navlinks.classList.contains('active')) {
      navbar.classList.remove('scrolled');
    }
  }
});

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const navlinks = document.querySelector('.nav-links');
const navbar = document.getElementById('navbar');

hamburger.addEventListener('click', () => {
  navlinks.classList.toggle('active');
  navbar.classList.add('scrolled');
});

// Multiple dropdown menus
document.addEventListener("DOMContentLoaded", function () {
    if (window.scrollY <= 50 && !navlinks.classList.contains('active')) {
      navbar.classList.remove('scrolled');
    }
  }
);

// Always fetch cart count from server on page load
async function updateCartCountFromServer() {
    try {
        const response = await fetch('/cart/count');
        const data = await response.json();
        if (data.success) {
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                cartCount.textContent = data.cartCount;
                cartCount.style.display = data.cartCount > 0 ? 'inline-block' : 'none';
            }
        }
    } catch (err) {
        console.error('Failed to update cart count from server:', err);
    }
}