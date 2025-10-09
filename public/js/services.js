// public/js/Services.js

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // ============= NAVBAR FUNCTIONALITY =============
  
  // Set navbar style to be consistent
  document.getElementById('navbar').classList.add('scrolled');
  
  // Handle hamburger menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('active');
    });
  }
  
  // Handle dropdown functionality
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  
  if (dropdownToggles.length > 0) {
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const dropdown = this.closest('.dropdown');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        if (dropdownMenu) {
          document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            if (menu !== dropdownMenu) {
              menu.classList.remove('show');
            }
          });
          
          dropdownMenu.classList.toggle('show');
        }
      });
    });
    
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });
  }
  
  // ============= MODAL FUNCTIONALITY - NO ALERT =============
  
  const writeReviewBtn = document.getElementById('writeReviewBtn');
  const reviewModal = document.getElementById('review-modal');
  const closeButtons = document.getElementsByClassName('close-modal');
  
  if (writeReviewBtn && reviewModal) {
    writeReviewBtn.addEventListener('click', function() {
      reviewModal.style.display = 'block';
    });
  }
  
  if (closeButtons.length > 0) {
    Array.from(closeButtons).forEach(button => {
      button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
      });
    });
  }
  
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
  
  // Handle star rating functionality
  const stars = document.querySelectorAll('.rating-select i');
  if (stars.length > 0) {
    stars.forEach(star => {
      star.addEventListener('click', function() {
        const rating = this.getAttribute('data-rating');
        document.getElementById('rating-value').value = rating;
        
        stars.forEach(s => {
          if (s.getAttribute('data-rating') <= rating) {
            s.className = 'fas fa-star';
          } else {
            s.className = 'far fa-star';
          }
        });
      });
    });
  }
  
  // ============= SERVICES FILTERING FUNCTIONALITY =============
  
  const serviceCards = document.querySelectorAll('.service-card');
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
  const ratingCheckboxes = document.querySelectorAll('input[name="rating"]');
  
  if (categoryCheckboxes.length > 0) {
    categoryCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });
  }
  
  if (ratingCheckboxes.length > 0) {
    ratingCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });
  }
  
  const applyPriceBtn = document.getElementById('apply-price');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', applyFilters);
  }
  
  const clearFiltersBtn = document.querySelector('.clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }
  
  function applyFilters() {
    if (!serviceCards.length) return;
    
    const selectedCategories = Array.from(categoryCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    const selectedRatings = Array.from(ratingCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => parseFloat(checkbox.value));
    
    const minPrice = document.getElementById('min-price')?.value ? 
      parseFloat(document.getElementById('min-price').value) : 0;
    
    const maxPrice = document.getElementById('max-price')?.value ? 
      parseFloat(document.getElementById('max-price').value) : Infinity;
    
    serviceCards.forEach(card => {
      const category = card.dataset.category.toLowerCase();
      const rating = parseFloat(card.dataset.rating) || 0;
      const price = parseFloat(card.dataset.price) || 0;
      
      const passesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
      const passesRating = selectedRatings.length === 0 || selectedRatings.some(r => rating >= r);
      const passesPrice = price >= minPrice && price <= maxPrice;
      
      if (passesCategory && passesRating && passesPrice) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
    
    const visibleCards = Array.from(serviceCards).filter(card => card.style.display !== 'none');
    const servicesContainer = document.querySelector('.services-container');
    let noResults = document.getElementById('no-results');
    
    if (visibleCards.length === 0 && servicesContainer) {
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.id = 'no-results';
        noResults.innerHTML = '<p>No services match your filters. Please try different criteria.</p>';
        noResults.style.textAlign = 'center';
        noResults.style.width = '100%';
        noResults.style.padding = '20px';
        noResults.style.color = '#666';
        servicesContainer.appendChild(noResults);
      } else {
        noResults.style.display = 'block';
      }
    } else if (noResults) {
      noResults.style.display = 'none';
    }
  }
  
  function clearAllFilters() {
    categoryCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    ratingCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    
    serviceCards.forEach(card => {
      card.style.display = 'block';
    });
    
    const noResults = document.getElementById('no-results');
    if (noResults) {
      noResults.style.display = 'none';
    }
  }
  
  // ============= BOOKING FUNCTIONALITY =============
  
  window.bookService = function(serviceId) {
    window.location.href = `/booking/${serviceId}`;
  };
});
