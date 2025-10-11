document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const tabLinks = document.querySelectorAll('.admin-menu li');
  const tabContents = document.querySelectorAll('.tab-pane');
  
  tabLinks.forEach(tab => {
      tab.addEventListener('click', function() {
          // Remove active class from all tabs
          tabLinks.forEach(t => t.classList.remove('active'));
          
          // Add active class to clicked tab
          this.classList.add('active');
          
          // Hide all tab contents
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Show the corresponding tab content
          const tabId = this.getAttribute('data-tab');
          document.getElementById(`${tabId}-tab`).classList.add('active');
          
          // Update the page title with special cases
          const titleMap = {
              dashboard: 'Admin Dashboard',
              pending: 'Pending Applications',
              approved: 'Approved Applications',
              rejected: 'Rejected Applications',
              all: 'All Applications',
              products: 'Product Management',
              services: 'Service Management',
              pets: 'Pet Management',
              orders: 'Order Management'
          };
          document.querySelector('.page-title').textContent = titleMap[tabId] || `${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
      });
  });
  
  // Filter functionality
  const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
  const applicationCards = document.querySelectorAll('.application-card');
  const clearFiltersBtn = document.getElementById('clear-filters');
  
  function applyFilters() {
      // Get selected application types
      const selectedTypes = Array.from(document.querySelectorAll('.filter-checkbox[name="type"]:checked'))
          .map(checkbox => checkbox.value);
      
      // Get date range
      const startDate = document.getElementById('start-date').value;
      const endDate = document.getElementById('end-date').value;
      
      // Apply filters to application cards
      applicationCards.forEach(card => {
          const cardType = card.getAttribute('data-type');
          const cardDate = card.querySelector('.application-date').textContent;
          
          // Check if card type matches selected types
          const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(cardType);
          
          // Check if card date is within selected date range
          let dateMatch = true;
          if (startDate && endDate) {
              const cardDateObj = new Date(cardDate);
              const startDateObj = new Date(startDate);
              const endDateObj = new Date(endDate);
              dateMatch = cardDateObj >= startDateObj && cardDateObj <= endDateObj;
          }
          
          // Show/hide card based on filter match
          card.style.display = typeMatch && dateMatch ? 'block' : 'none';
      });
      
      // Update counters
      updateCounters();
  }
  
  filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
  });
  
  document.getElementById('apply-date').addEventListener('click', applyFilters);
  
  clearFiltersBtn.addEventListener('click', function() {
      // Reset checkboxes to default (checked if they originally had the checked attribute)
      filterCheckboxes.forEach(checkbox => {
          checkbox.checked = checkbox.hasAttribute('checked');
      });
      
      // Reset date inputs
      document.getElementById('start-date').value = '';
      document.getElementById('end-date').value = '';
      
      // Reset visibility of application cards
      applicationCards.forEach(card => {
          card.style.display = 'block';
      });
      
      // Update counters
      updateCounters();
  });
  
  // Modal functionality
  const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
  const detailModal = document.getElementById('application-detail-modal');
  const rejectModal = document.getElementById('rejection-reason-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal, .close-btn, .cancel-btn');
  
  viewDetailsBtns.forEach(btn => {
      btn.addEventListener('click', function() {
          detailModal.style.display = 'block';
      });
  });
  
  closeModalBtns.forEach(btn => {
      btn.addEventListener('click', function() {
          detailModal.style.display = 'none';
          rejectModal.style.display = 'none';
          document.getElementById('credentials-modal').style.display = 'none';
      });
  });
  
  // Approve/reject functionality
  const approveBtns = document.querySelectorAll('.approve-btn');
  const rejectBtns = document.querySelectorAll('.reject-btn');
  const confirmRejectBtn = document.getElementById('confirm-reject-btn');
  
  approveBtns.forEach(btn => {
      btn.addEventListener('click', function() {
          const applicationId = this.closest('.application-card').getAttribute('data-id');
          approveApplication(applicationId);
      });
  });
  
  rejectBtns.forEach(btn => {
      btn.addEventListener('click', function() {
          const applicationId = this.closest('.application-card').getAttribute('data-id');
          document.getElementById('rejection-application-id').value = applicationId;
          rejectModal.style.display = 'block';
      });
  });
  
  confirmRejectBtn.addEventListener('click', function() {
      const applicationId = document.getElementById('rejection-application-id').value;
      const reason = document.getElementById('rejection-reason').value;
      
      if (!reason.trim()) {
          alert('Please provide a reason for rejection');
          return;
      }
      
      rejectApplication(applicationId, reason);
      rejectModal.style.display = 'none';
      document.getElementById('rejection-reason').value = '';
  });
  
  // Helper function to show success message in a card format
  function showSuccessMessage(message) {
      const container = document.getElementById('success-message-container');
      // Clear any existing message so only one is visible at a time
      container.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'success-card';
      card.textContent = message;
      container.appendChild(card);
      setTimeout(() => {
          card.remove();
      }, 3000); // Remove after 3 seconds
  }
  
  // Functions to handle application actions
  window.approveApplication = function(id) {
      console.log(`Approving application ${id}`);
      showSuccessMessage('Successfully approved');
      // For demo purposes, remove the card from the pending tab if it exists
      const card = document.querySelector(`.application-card[data-id="${id}"]`);
      if (card && card.closest('.tab-pane').id === 'pending-tab') {
          card.remove();
          updateCounters();
      }
  };
  
  window.rejectApplication = function(id, reason) {
      // If reason is not passed, open the rejection modal
      if (!reason) {
          document.getElementById('rejection-application-id').value = id;
          document.getElementById('rejection-reason-modal').style.display = 'block';
          return;
      }
      console.log(`Rejecting application ${id} with reason: ${reason}`);
      showSuccessMessage('Successfully rejected');
      // For demo purposes, remove the card from the pending tab if it exists
      const card = document.querySelector(`.application-card[data-id="${id}"]`);
      if (card && card.closest('.tab-pane').id === 'pending-tab') {
          card.remove();
          updateCounters();
      }
  };
  
  window.revokeApproval = function(id) {
      console.log(`Revoking approval for application ${id}`);
      showSuccessMessage('Successfully revoked');
  };
  
  window.reconsiderApplication = function(id) {
      console.log(`Reconsidering application ${id}`);
      showSuccessMessage('Successfully moved back to pending');
  };
  
  window.viewApplicationDetails = function(id) {
      console.log(`Viewing details for application ${id}`);
      // Load application details into the modal (demo placeholder)
      document.getElementById('application-detail-modal').style.display = 'block';
      document.getElementById('application-detail-content').innerHTML = `
          <div class="detail-section">
              <h3>Application ID: ${id}</h3>
              <p>Loading application details...</p>
              <p>In a real application, this would show the complete details of the application.</p>
          </div>
      `;
      
      // Add appropriate action buttons based on the current status
      const actionButtons = document.getElementById('modal-action-buttons');
      actionButtons.innerHTML = `
          <button class="approve-btn" onclick="approveApplication('${id}')">
              <i class="fas fa-check"></i> Approve
          </button>
          <button class="reject-btn" onclick="rejectApplication('${id}')">
              <i class="fas fa-times"></i> Reject
          </button>
      `;
  };
  
  // Helper function to update counters based on visible application cards
  function updateCounters() {
      document.getElementById('pending-count').textContent = document.querySelectorAll('#pending-tab .application-card:not([style*="display: none"])').length;
      document.getElementById('approved-count').textContent = document.querySelectorAll('#approved-tab .application-card:not([style*="display: none"])').length;
      document.getElementById('rejected-count').textContent = document.querySelectorAll('#rejected-tab .application-card:not([style*="display: none"])').length;
      document.getElementById('total-count').textContent = document.querySelectorAll('.application-card:not([style*="display: none"])').length;
  }
  
  // Mobile navigation
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('active');
  });
  
  // Initialize counters on page load
  updateCounters();

  // Orders tab: update status handler
  document.addEventListener('click', async function(e) {
      if (e.target && e.target.classList.contains('update-order-status')) {
          const row = e.target.closest('tr');
          const orderId = row.getAttribute('data-id');
          const statusSelect = row.querySelector('.order-status-select');
          const newStatus = statusSelect.value;

          try {
              const res = await fetch(`/admin/order/${orderId}/status`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus })
              });
              const data = await res.json();
              if (!res.ok || !data.success) {
                  alert(data.error || 'Failed to update order status');
                  return;
              }
              showSuccessMessage('Order status updated');
          } catch (err) {
              alert('Network error updating order status');
          }
      }
  });

  // All Users: search and role filter
  const userSearchInput = document.getElementById('user-search');
  const userSearchBtn = document.getElementById('search-user-btn');
  const userRoleFilter = document.getElementById('user-role-filter');
  const usersTableBody = document.getElementById('users-table-body');

  function filterUsers() {
      if (!usersTableBody) return;
      const query = (userSearchInput?.value || '').toLowerCase().trim();
      const role = (userRoleFilter?.value || 'all');

      const rows = Array.from(usersTableBody.querySelectorAll('tr'));
      rows.forEach(row => {
          const name = row.children[0]?.textContent?.toLowerCase() || '';
          const username = row.children[1]?.textContent?.toLowerCase() || '';
          const email = row.children[2]?.textContent?.toLowerCase() || '';
          const roleBadge = row.querySelector('.role-badge')?.textContent?.toLowerCase() || '';

          const matchesQuery = !query || name.includes(query) || username.includes(query) || email.includes(query);
          const matchesRole = role === 'all' || roleBadge === role.replace('_', ' ');

          row.style.display = (matchesQuery && matchesRole) ? '' : 'none';
      });
  }

  userSearchBtn?.addEventListener('click', filterUsers);
  userSearchInput?.addEventListener('input', () => {
      // simple debounce
      clearTimeout(window.__userSearchDebounce);
      window.__userSearchDebounce = setTimeout(filterUsers, 200);
  });
  userRoleFilter?.addEventListener('change', filterUsers);

  // Expose view/edit/delete user handlers
  window.viewUserDetails = function(userId) {
      const row = document.querySelector(`tr[data-id="${userId}"]`);
      const roleText = row?.querySelector('.role-badge')?.textContent?.trim().toLowerCase();
      let path = '/';
      if (roleText === 'owner') path = '/owner-dashboard';
      else if (roleText === 'seller') path = '/seller-dashboard';
      else if (roleText === 'service_provider' || roleText === 'service provider') path = '/service-provider-dashboard';
      else if (roleText === 'admin') path = '/admin';
      try {
          window.open(path, '_blank');
      } catch (_) {
          alert('Cannot open dashboard page.');
      }
  };

  window.editUser = function(userId) {
      console.log('Edit user', userId);
      alert('Edit user not implemented yet.');
  };

  window.deleteUser = function(userId) {
      if (!confirm('Delete this user?')) return;
      console.log('Delete user', userId);
      alert('Delete user not implemented yet.');
  };

  // Products: search + category filter (client-side fallback)
  const productSearch = document.getElementById('product-search');
  const productSearchBtn = document.getElementById('search-product-btn');
  const productCategoryFilter = document.getElementById('product-category-filter');
  const productsGrid = document.querySelector('.products-grid');

  function normalizeCategory(value) {
      const v = (value || '').toString().toLowerCase().replace(/[^a-z]/g, '');
      if (v.includes('food')) return 'food';
      if (v.includes('toy')) return 'toys';
      if (v.includes('accessor')) return 'accessories';
      if (v.includes('health')) return 'health';
      return v;
  }

  function filterProducts() {
      if (!productsGrid) return;
      const query = (productSearch?.value || '').toLowerCase().trim();
      const category = (productCategoryFilter?.value || 'all').toLowerCase();
      const cards = Array.from(productsGrid.querySelectorAll('.product-card'));
      cards.forEach(card => {
          const name = card.getAttribute('data-name')?.toLowerCase() || '';
          const cat = normalizeCategory(card.getAttribute('data-category')) || '';
          const seller = card.getAttribute('data-seller')?.toLowerCase() || '';
          const matchesQuery = !query || name.includes(query) || seller.includes(query);
          const matchesCat = category === 'all' || cat === normalizeCategory(category);
          card.style.display = (matchesQuery && matchesCat) ? '' : 'none';
      });
  }

  productSearchBtn?.addEventListener('click', filterProducts);
  productSearch?.addEventListener('input', () => {
      clearTimeout(window.__prodSearchDebounce);
      window.__prodSearchDebounce = setTimeout(filterProducts, 200);
  });
  productCategoryFilter?.addEventListener('change', filterProducts);

  // Pets: search + category filter
  const petSearch = document.getElementById('pet-search');
  const petSearchBtn = document.getElementById('search-pet-btn');
  const petCategoryFilter = document.getElementById('pet-category-filter');
  const petsGrid = document.querySelector('.pets-grid');

  function filterPets() {
      if (!petsGrid) return;
      const query = (petSearch?.value || '').toLowerCase().trim();
      const category = (petCategoryFilter?.value || 'all');
      const cards = Array.from(petsGrid.querySelectorAll('.pet-card'));
      cards.forEach(card => {
          const name = card.getAttribute('data-name') || '';
          const breed = card.getAttribute('data-breed') || '';
          const cat = card.getAttribute('data-category') || '';
          const matchesQuery = !query || name.includes(query) || breed.includes(query);
          const matchesCat = category === 'all' || cat === category;
          card.style.display = (matchesQuery && matchesCat) ? '' : 'none';
      });
  }

  petSearchBtn?.addEventListener('click', filterPets);
  petSearch?.addEventListener('input', () => {
      clearTimeout(window.__petSearchDebounce);
      window.__petSearchDebounce = setTimeout(filterPets, 200);
  });
  petCategoryFilter?.addEventListener('change', filterPets);

  // Services: search + type filter
  const serviceSearch = document.getElementById('service-search');
  const serviceSearchBtn = document.getElementById('search-service-btn');
  const serviceTypeFilter = document.getElementById('service-type-filter');
  const servicesGrid = document.querySelector('.services-grid');

  function filterServices() {
      if (!servicesGrid) return;
      const query = (serviceSearch?.value || '').toLowerCase().trim();
      const type = (serviceTypeFilter?.value || 'all').toLowerCase();
      const cards = Array.from(servicesGrid.querySelectorAll('.service-card'));
      cards.forEach(card => {
          const name = card.getAttribute('data-name') || '';
          const provider = card.getAttribute('data-provider') || '';
          const serviceType = card.getAttribute('data-type') || '';
          const matchesQuery = !query || name.includes(query) || provider.includes(query);
          const matchesType = type === 'all' || serviceType.includes(type);
          card.style.display = (matchesQuery && matchesType) ? '' : 'none';
      });
  }

  serviceSearchBtn?.addEventListener('click', filterServices);
  serviceSearch?.addEventListener('input', () => {
      clearTimeout(window.__serviceSearchDebounce);
      window.__serviceSearchDebounce = setTimeout(filterServices, 200);
  });
  serviceTypeFilter?.addEventListener('change', filterServices);

  // Product view handler (eye icon)
  window.viewProduct = function(productId) {
      try {
          window.open(`/buy/${productId}`, '_blank');
      } catch (_) {
          alert('Unable to open product view');
      }
  };

  // Pet view handler (eye icon)
  window.viewPet = function(petId) {
      try {
          window.open(`/seller/detail/${petId}`, '_blank');
      } catch (_) {
          alert('Unable to open pet view');
      }
  };

  // Service view handler (eye icon)
  window.viewService = function(serviceId) {
      try {
          window.open(`/services/${serviceId}`, '_blank');
      } catch (_) {
          alert('Unable to open service view');
      }
  };
});

// Expose viewCredentials function to show a credentials modal
window.viewCredentials = function(providerId) {
  console.log(`Viewing credentials for provider ${providerId}`);
  // For demo, we show the credentials modal with placeholder data.
  document.getElementById('credentials-modal').style.display = 'block';
  document.getElementById('credential-name').textContent = "Dhyaneshvar K";
  document.getElementById('credential-email').textContent = "dhyaneshvark@gmail.com";
  document.getElementById('credential-phone').textContent = "123-456-7890";
  document.getElementById('credential-address').textContent = "123 Main St, City, Country";
  document.getElementById('credential-business-name').textContent = "Doe Enterprises";
  document.getElementById('credential-reg-number').textContent = "REG123456";
  document.getElementById('credential-years').textContent = "5";
};

// Function to apply price filter (from the sidebar)
window.applyPriceFilter = function() {
  console.log('Applying price filter');
};

// Function to clear all filters (if used by other UI elements)
window.clearAllFilters = function() {
  console.log('Clearing all filters');
  document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      checkbox.checked = checkbox.hasAttribute('checked');
  });
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
};

// Product approval/rejection handlers
window.approveProduct = function(productId) {
  if (!confirm('Approve this product?')) return;
  console.log('Approve product', productId);
  alert('Product approval not implemented yet. Please contact the developer.');
};

window.rejectProduct = function(productId) {
  if (!confirm('Reject this product?')) return;
  console.log('Reject product', productId);
  alert('Product rejection not implemented yet. Please contact the developer.');
};

// Pet availability handlers
window.markPetAvailable = function(petId) {
  if (!confirm('Mark this pet as available?')) return;
  console.log('Mark pet available', petId);
  alert('Pet availability toggle not implemented yet. Please contact the developer.');
};

window.markPetUnavailable = function(petId) {
  if (!confirm('Mark this pet as unavailable?')) return;
  console.log('Mark pet unavailable', petId);
  alert('Pet availability toggle not implemented yet. Please contact the developer.');
};

// Service approval/rejection handlers
window.approveService = function(serviceId) {
  if (!confirm('Approve this service?')) return;
  console.log('Approve service', serviceId);
  alert('Service approval not implemented yet. Please contact the developer.');
};

window.rejectService = function(serviceId) {
  if (!confirm('Reject this service?')) return;
  console.log('Reject service', serviceId);
  alert('Service rejection not implemented yet. Please contact the developer.');
};

// Delete handlers
window.deletePet = function(petId) {
  if (!confirm('Delete this pet? This action cannot be undone.')) return;
  console.log('Delete pet', petId);
  alert('Pet deletion not implemented yet. Please contact the developer.');
};

window.deleteService = function(serviceId) {
  if (!confirm('Delete this service? This action cannot be undone.')) return;
  console.log('Delete service', serviceId);
  alert('Service deletion not implemented yet. Please contact the developer.');
};

window.deactivateService = function(serviceId) {
  if (!confirm('Deactivate this service?')) return;
  console.log('Deactivate service', serviceId);
  alert('Service deactivation not implemented yet. Please contact the developer.');
};
