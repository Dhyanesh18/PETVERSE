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
          
          // Update the page title
          document.querySelector('.page-title').textContent = `${tabId.charAt(0).toUpperCase() + tabId.slice(1)} Applications`;
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
