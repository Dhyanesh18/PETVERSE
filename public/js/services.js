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
  
  
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
  const ratingCheckboxes = document.querySelectorAll('input[name="rating"]');
  const servicesContainer = document.querySelector('.services-container');
  
  // Store original services HTML on page load
  let originalServicesHTML = servicesContainer ? servicesContainer.innerHTML : '';
  let isFiltering = false;
  
  if (categoryCheckboxes.length > 0) {
    categoryCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFiltersAsync);
    });
  }
  
  if (ratingCheckboxes.length > 0) {
    ratingCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFiltersAsync);
    });
  }
  
  const applyPriceBtn = document.getElementById('apply-price');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', applyFiltersAsync);
  }
  
  const clearFiltersBtn = document.querySelector('.clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }
  
  async function applyFiltersAsync() {
    if (!servicesContainer || isFiltering) return;
    
    isFiltering = true;
    
    const selectedCategories = Array.from(categoryCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    const selectedRatings = Array.from(ratingCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => parseFloat(checkbox.value));
    
    const minPrice = document.getElementById('min-price')?.value || '';
    const maxPrice = document.getElementById('max-price')?.value || '';
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (selectedCategories.length > 0) {
      params.append('categories', selectedCategories.join(','));
    }
    
    if (minPrice) {
      params.append('minPrice', minPrice);
    }
    
    if (maxPrice) {
      params.append('maxPrice', maxPrice);
    }
    
    if (selectedRatings.length > 0) {
      const minRating = Math.min(...selectedRatings);
      params.append('minRating', minRating);
    }
    
    // Show loading state
    servicesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i><p>Loading services...</p></div>';
    
    try {
      const response = await fetch(`/services/api/filter?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.services && data.services.length > 0) {
        renderServices(data.services);
      } else if (data.success && data.services && data.services.length === 0) {
        servicesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><p>No services match your filters. Please try different criteria.</p></div>';
      } else {
        throw new Error(data.message || 'Failed to load services');
      }
    } catch (error) {
      console.error('Error filtering services:', error);
      servicesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;"><p>Error loading services. Please try again.</p><small style="display: block; margin-top: 10px;">' + error.message + '</small></div>';
    } finally {
      isFiltering = false;
    }
  }
  
  function renderServices(services) {
    if (!servicesContainer) return;
    
    servicesContainer.innerHTML = services.map(service => {
      // Skip services without serviceType
      if (!service.serviceType) return '';
      
      const serviceType = service.serviceType;
      const imagePath = getServiceImage(serviceType);
      const reviewsHtml = service.topReviews && service.topReviews.length > 0 
        ? `<div class="top-reviews">
            <h4>Recent Reviews</h4>
            ${service.topReviews.map(review => `
              <div class="review-preview">
                <div class="review-header-small">
                  <strong>${review.userName || 'Anonymous'}</strong>
                  <div class="review-stars">
                    ${generateStars(review.rating)}
                  </div>
                </div>
                <p class="review-text">"${review.comment ? (review.comment.substring(0, 80) + (review.comment.length > 80 ? '...' : '')) : 'No comment provided'}"</p>
                <small class="review-date">${formatDate(review.createdAt)}</small>
              </div>
            `).join('')}
          </div>`
        : '';
      
      return `
        <div class="service-card" 
          data-category="${serviceType.toLowerCase()}" 
          data-price="${service.price || 0}" 
          data-rating="${service.rating || 0}">
          <div class="service-image">
            <img src="${imagePath}" alt="${service.fullName || 'Service Provider'}">
          </div>
          <div class="service-info">
            <h2 class="service-name">${service.fullName || 'Service Provider'}</h2>
            <div class="service-meta">
              <p class="service-category">${serviceType}</p>
            </div>
            <p class="service-location">${service.serviceAddress || 'Location not specified'}</p>
            <p class="service-contact">
              <i class="fa fa-phone"></i> ${service.phone || 'N/A'} 
              <span class="service-email"><i class="fa fa-envelope"></i> ${service.email || 'N/A'}</span>
            </p>
            ${reviewsHtml}
            <div class="service-buttons">
              <button class="service-btn" onclick="bookService('${service.id}')">
                Book Appointment
              </button>
              <a href="/services/${service.id}" class="service-btn details-btn">
                View Details
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  function getServiceImage(serviceType) {
    if (!serviceType) return '/images/services/service2.jpg';
    
    const imageMap = {
      'veterinarian': '/images/services/service1.jpg',
      'groomer': '/images/services/service7.jpg',
      'pet sitter': '/images/services/service11.jpg',
      'trainer': '/images/services/service6.jpg',
      'breeder': '/images/services/service12.jpg'
    };
    return imageMap[serviceType.toLowerCase()] || '/images/services/service2.jpg';
  }
  
  function generateStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<i class="fas fa-star ${i <= rating ? 'filled' : ''}"></i>`;
    }
    return starsHtml;
  }
  
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  async function clearAllFilters() {
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
    
    // Reload all services
    await applyFiltersAsync();
  }
  
  // ============= BOOKING FUNCTIONALITY =============
  
  window.bookService = function(serviceId) {
    window.location.href = `/booking/${serviceId}`;
  };
});
