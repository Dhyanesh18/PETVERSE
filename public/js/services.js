// public/js/Services.js

function bookService(serviceId) {
    // Instead of an alert, redirect to /book/:serviceId
    window.location.href = `/book/${serviceId}`;
  }
  
  // Apply Price Filter
  function applyPriceFilter() {
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
  
    const min = parseFloat(minPriceInput.value) || 0;
    const max = parseFloat(maxPriceInput.value) || Number.MAX_VALUE;
  
    // For each service card, check if it falls in the price range
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
      const cardPrice = card.getAttribute('data-price');
  
      // If cardPrice is null or empty (doctors/trainers), skip numeric filtering
      if (!cardPrice || cardPrice === 'null') {
        // For doctors/training, ignore numeric filter, so show/hide them based on user preference
        // We'll hide them only if user has a numeric filter that excludes them
        // But to keep it simple, let's just keep them visible unless there's a 0 filter
        if (min === 0 && max === Number.MAX_VALUE) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
        return;
      }
  
      const numericPrice = parseFloat(cardPrice);
      if (numericPrice >= min && numericPrice <= max) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }
  
  // Clear All Filters
  function clearAllFilters() {
    // Clear checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  
    // Clear price inputs
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
  
    // Show all cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
      card.style.display = 'flex';
    });
  }
  
  // Additional filter logic for category or rating
  document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      applyFilters();
    });
  });
  
  function applyFilters() {
    // Gather selected categories
    const selectedCategories = [];
    document.querySelectorAll('input[name="category"]:checked').forEach(cb => {
      selectedCategories.push(cb.value);
    });
  
    // Gather selected rating
    const selectedRatings = [];
    document.querySelectorAll('input[name="rating"]:checked').forEach(cb => {
      selectedRatings.push(parseFloat(cb.value));
    });
  
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      const cardRating = parseFloat(card.getAttribute('data-rating')) || 0;
  
      let showByCategory = true;
      let showByRating = true;
  
      // Category check
      if (selectedCategories.length > 0 && !selectedCategories.includes(cardCategory)) {
        showByCategory = false;
      }
  
      // Rating check (e.g., "4★ & above" means cardRating >= 4)
      if (selectedRatings.length > 0) {
        const meetsRating = selectedRatings.some(r => cardRating >= r);
        showByRating = meetsRating;
      }
  
      // Show/hide card
      if (showByCategory && showByRating) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }
  