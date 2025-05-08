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
        event.stopPropagation(); // Prevent event from bubbling up
        
        // Find the parent dropdown element
        const dropdown = this.closest('.dropdown');
        
        // Find the dropdown menu within this dropdown
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        if (dropdownMenu) {
          // Close all other dropdown menus first
          document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            if (menu !== dropdownMenu) {
              menu.classList.remove('show');
            }
          });
          
          // Toggle this dropdown menu
          dropdownMenu.classList.toggle('show');
        }
      });
    });
    
    // Close dropdowns when clicking elsewhere on the page
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });
  }
  
  // ============= MODAL FUNCTIONALITY FOR SERVICE DETAILS =============
  
  // Handle service details page modal functionality
  const writeReviewBtn = document.getElementById('writeReviewBtn');
  const reviewModal = document.getElementById('review-modal');
  const closeButtons = document.getElementsByClassName('close-modal');
  
  // Set up review button event listener
  if (writeReviewBtn && reviewModal) {
    writeReviewBtn.addEventListener('click', function() {
      reviewModal.style.display = 'block';
    });
  }
  
  // Set up close buttons
  if (closeButtons.length > 0) {
    Array.from(closeButtons).forEach(button => {
      button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
      });
    });
  }
  
  // Close modals when clicking outside
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
        
        // Update star display
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
  
  // Submit service review
  const reviewForm = document.getElementById('service-review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Check if user is logged in
      const isLoggedIn = document.body.getAttribute('data-user-logged-in') === 'true';
      if (!isLoggedIn) {
        alert('You must be logged in to submit a review');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      
      const providerId = this.getAttribute('data-provider-id');
      const rating = document.getElementById('rating-value').value;
      const comment = document.getElementById('review-comment').value;
      
      if (!rating) {
        alert('Please select a star rating');
        return;
      }
      
      // Send review to server
      fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: Number(rating),
          comment: comment,
          targetType: 'ServiceProvider',
          targetId: providerId
        }),
        credentials: 'same-origin' // Include cookies for authentication
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Server returned status: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Hide modal
          document.getElementById('review-modal').style.display = 'none';
          
          // Show success message
          alert('Review submitted successfully!');
          
          // Reload the page to show the new review
          window.location.reload();
        } else {
          alert(data.message || 'Error submitting review');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        if (error.message && error.message.includes('401')) {
          alert('You need to be logged in to submit a review');
          window.location.href = '/login';
        } else {
          alert('An error occurred while submitting your review. Please try again later.');
        }
      });
    });
  }
  
  // ============= SERVICES FILTERING FUNCTIONALITY =============
  
  // Get all service cards
  const serviceCards = document.querySelectorAll('.service-card');
  
  // Get filter checkboxes
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
  const ratingCheckboxes = document.querySelectorAll('input[name="rating"]');
  
  // Add event listeners to filter checkboxes
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
  
  // Apply price filter button
  const applyPriceBtn = document.getElementById('apply-price');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', applyFilters);
  }
  
  // Clear all filters button
  const clearFiltersBtn = document.querySelector('.clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }
  
  // Function to apply all active filters
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
    
    // Loop through all service cards and check if they match the filters
    serviceCards.forEach(card => {
      const category = card.dataset.category.toLowerCase();
      const rating = parseFloat(card.dataset.rating) || 0;
      const price = parseFloat(card.dataset.price) || 0;
      
      // Check if card passes all active filters
      const passesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
      const passesRating = selectedRatings.length === 0 || selectedRatings.some(r => rating >= r);
      const passesPrice = price >= minPrice && price <= maxPrice;
      
      // Show or hide the card based on filter results
      if (passesCategory && passesRating && passesPrice) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
    
    // Check if no results are found
    const visibleCards = Array.from(serviceCards).filter(card => card.style.display !== 'none');
    const servicesContainer = document.querySelector('.services-container');
    let noResults = document.getElementById('no-results');
    
    if (visibleCards.length === 0 && servicesContainer) {
      // If no results element doesn't exist, create it
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
  
  // Function to clear all filters
  function clearAllFilters() {
    // Uncheck all checkboxes
    categoryCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    ratingCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Clear price inputs
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    
    // Show all service cards
    serviceCards.forEach(card => {
      card.style.display = 'block';
    });
    
    // Hide no results message if it exists
    const noResults = document.getElementById('no-results');
    if (noResults) {
      noResults.style.display = 'none';
    }
  }
  
  // ============= BOOKING FUNCTIONALITY =============
  
  // Function to handle booking a service
  window.bookService = function(serviceId) {
    // Redirect directly to the booking page - server-side auth middleware will handle authentication
    window.location.href = `/booking/${serviceId}`;
  };
});
  