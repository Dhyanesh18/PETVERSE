// Sample data for demonstration

  // DOM Elements
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initializePage();
    
    // Tab buttons event listeners
    document.querySelectorAll('.tab-btn').forEach(button => {
      button.addEventListener('click', function() {
        switchMainTab(this.dataset.tab);
      });
    });
    
    // Sub-tab buttons event listeners
    document.querySelectorAll('.sub-tab-btn').forEach(button => {
      button.addEventListener('click', function() {
        switchSubTab(this.dataset.type);
      });
    });
    
    // Search input event listener
    document.getElementById('searchInput').addEventListener('input', function() {
      filterApplications();
    });
    
    // Sort dropdown event listener
    document.getElementById('sortFilter').addEventListener('change', function() {
      sortApplications(this.value);
    });
    
    // Pagination buttons
    document.getElementById('prevPage').addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        renderApplications();
      }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
      const totalPages = Math.ceil(currentData.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderApplications();
      }
    });
    
    // Modal close button
    document.querySelector('.close-modal').addEventListener('click', function() {
      document.getElementById('documentModal').style.display = 'none';
    });
    
    // Confirmation modal buttons
    document.getElementById('confirmButton').addEventListener('click', function() {
      if (confirmationCallback) {
        confirmationCallback();
        closeConfirmationModal();
      }
    });
    
    document.getElementById('cancelButton').addEventListener('click', function() {
      closeConfirmationModal();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
      const documentModal = document.getElementById('documentModal');
      const confirmationModal = document.getElementById('confirmationModal');
      
      if (event.target === documentModal) {
        documentModal.style.display = 'none';
      }
      
      if (event.target === confirmationModal) {
        closeConfirmationModal();
      }
    });
  });
  
  // Initialize the page with default data
  function initializePage() {
    // In a real app, you would fetch the data from the server
    // For this example, we're using the sample data
    filterAndRenderApplications();
  }
  
  // Switch between main tabs (pending, approved, rejected)
  function switchMainTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });
    currentPage = 1;
    filterAndRenderApplications();
  }
  
  // Switch between sub-tabs (seller, service)
  function switchSubTab(type) {
    currentType = type;
    document.querySelectorAll('.sub-tab-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.type === type);
    });
    currentPage = 1;
    filterAndRenderApplications();
  }
  
  // Filter applications based on current tab, type and search
  function filterApplications() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    currentData = sampleData.applications.filter(app => {
      // Filter by status tab
      if (app.status !== currentTab) {
        return false;
      }
      
      // Filter by type (seller/service)
      if (app.type !== currentType) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        return (
          app.fullName.toLowerCase().includes(searchTerm) ||
          app.email.toLowerCase().includes(searchTerm) ||
          (app.businessName && app.businessName.toLowerCase().includes(searchTerm)) ||
          (app.serviceType && app.serviceType.toLowerCase().includes(searchTerm))
        );
      }
      
      return true;
    });
    
    renderApplications();
  }
  
  // Sort applications based on selected criteria
  function sortApplications(sortType) {
    switch(sortType) {
      case 'newest':
        currentData.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
        break;
      case 'oldest':
        currentData.sort((a, b) => new Date(a.dateApplied) - new Date(b.dateApplied));
        break;
      case 'nameAZ':
        currentData.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case 'nameZA':
        currentData.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
    }
    
    renderApplications();
  }
  
  // Render the filtered applications to the DOM
  function renderApplications() {
    const container = document.getElementById('applicationsContainer');
    container.innerHTML = '';
    
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = currentData.slice(start, end);
    
    if (pageData.length === 0) {
      container.innerHTML = `
        <div class="no-applications">
          <p>No ${currentType === 'seller' ? 'seller' : 'service provider'} applications found with status "${currentTab}".</p>
        </div>
      `;
    } else {
      pageData.forEach(app => {
        const card = document.createElement('div');
        card.className = 'application-card';
        card.dataset.type = app.type;
        card.dataset.status = app.status;
        
        card.innerHTML = `
          <div class="application-header">
            <h3>${app.businessName || app.fullName}</h3>
            <span class="application-date">${app.dateApplied}</span>
          </div>
          <div class="application-body">
            <div class="applicant-info">
              <p><strong>Full Name:</strong> ${app.fullName}</p>
              <p><strong>Email:</strong> ${app.email}</p>
              <p><strong>Phone:</strong> ${app.phone}</p>
              ${app.type === 'seller' 
                ? `<p><strong>Business Name:</strong> ${app.businessName}</p>` 
                : `<p><strong>Service Type:</strong> ${app.serviceType}</p>`
              }
            </div>
            <div class="application-docs">
              <p><strong>License/Certification:</strong> 
                <a href="#" class="doc-link" onclick="viewDocument('${app.licenseUrl}'); return false;">View Document</a>
              </p>
            </div>
          </div>
          <div class="application-actions">
            ${getActionButtons(app)}
          </div>
        `;
        
        container.appendChild(card);
      });
    }
    
    // Update pagination
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    document.getElementById('pageIndicator').textContent = `Page ${currentPage} of ${totalPages || 1}`;
  }
  
  // Get action buttons based on application status
  function getActionButtons(app) {
    if (app.status === 'pending') {
      return `
        <button class="btn approve-btn" onclick="approveApplication('${app.id}')">Approve</button>
        <button class="btn reject-btn" onclick="rejectApplication('${app.id}')">Reject</button>
      `;
    } else if (app.status === 'approved') {
      return `
        <span class="status-badge approved">Approved on ${app.dateReviewed}</span>
        <button class="btn remove-btn" onclick="removeAccount('${app.id}')">Remove Account</button>
      `;
    } else if (app.status === 'rejected') {
      return `
        <span class="status-badge rejected">Rejected on ${app.dateReviewed}</span>
        <button class="btn reconsider-btn" onclick="reconsiderApplication('${app.id}')">Reconsider</button>
      `;
    }
    return '';
  }
  
  // Combined function to filter and render
  function filterAndRenderApplications() {
    filterApplications();
    sortApplications(document.getElementById('sortFilter').value);
  }
  
  // View document function
  function viewDocument(url) {
    const viewer = document.getElementById('documentViewer');
    viewer.src = url;
    document.getElementById('documentModal').style.display = 'block';
  }
  
  // Approve application
  function approveApplication(id) {
    showConfirmation(
      'Approve Application', 
      'Are you sure you want to approve this application?',
      function() {
        // In a real app, you would make an API call here
        updateApplicationStatus(id, 'approved');
      }
    );
  }
  
  // Reject application
  function rejectApplication(id) {
    showConfirmation(
      'Reject Application', 
      'Are you sure you want to reject this application?',
      function() {
        // In a real app, you would make an API call here
        updateApplicationStatus(id, 'rejected');
      }
    );
  }
  
  // Reconsider rejected application
  function reconsiderApplication(id) {
    showConfirmation(
      'Reconsider Application', 
      'This will move the application back to pending status for review. Continue?',
      function() {
        // In a real app, you would make an API call here
        updateApplicationStatus(id, 'pending');
      }
    );
  }
  
  // Remove account
  function removeAccount(id) {
    showConfirmation(
      'Remove Account', 
      'Are you sure you want to permanently remove this account? This action cannot be undone.',
      function() {
        // In a real app, you would make an API call here
        // For this demo, we'll just remove from our sample data
        const index = sampleData.applications.findIndex(app => app.id === id);
        if (index !== -1) {
          sampleData.applications.splice(index, 1);
          filterAndRenderApplications();
        }
      }
    );
  }
  
  // Update application status in our sample data
  function updateApplicationStatus(id, newStatus) {
    const application = sampleData.applications.find(app => app.id === id);
    if (application) {
      application.status = newStatus;
      application.dateReviewed = new Date().toISOString().slice(0, 10); // Today's date
      filterAndRenderApplications();
    }
  }
  
  // Show confirmation modal
  function showConfirmation(title, message, callback) {
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    confirmationCallback = callback;
    document.getElementById('confirmationModal').style.display = 'block';
  }
  
  // Close confirmation modal
  function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
    confirmationCallback = null;
  }

  // Add this at the top of your admin.js file, outside any functions
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Tab buttons event listeners
    const tabButtons = document.querySelectorAll('.tab-btn');
    console.log('Found tab buttons:', tabButtons.length);
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Tab clicked:', this.dataset.tab);
        switchMainTab(this.dataset.tab);
      });
    });
    
    // Sub-tab buttons event listeners
    const subTabButtons = document.querySelectorAll('.sub-tab-btn');
    console.log('Found sub-tab buttons:', subTabButtons.length);
    
    subTabButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Sub-tab clicked:', this.dataset.type);
        switchSubTab(this.dataset.type);
      });
    });
    
    // Initialize with default tabs
    switchMainTab('pending');
    switchSubTab('seller');
  });
  
  // Make sure these functions are defined outside any other function
  function switchMainTab(tab) {
    console.log('Switching to main tab:', tab);
    currentTab = tab;
    
    // Update active class on tab buttons
    document.querySelectorAll('.tab-btn').forEach(button => {
      if (button.dataset.tab === tab) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    currentPage = 1;
    filterAndRenderApplications();
  }
  
  function switchSubTab(type) {
    console.log('Switching to sub-tab:', type);
    currentType = type;
    
    // Update active class on sub-tab buttons
    document.querySelectorAll('.sub-tab-btn').forEach(button => {
      if (button.dataset.type === type) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    currentPage = 1;
    filterAndRenderApplications();
  }
  
  // Expose these functions to the window object for onclick attributes
  window.viewDocument = viewDocument;
  window.approveApplication = approveApplication;
  window.rejectApplication = rejectApplication;
  window.reconsiderApplication = reconsiderApplication;
  window.removeAccount = removeAccount;

  // Expose these functions globally for inline onclick attributes
window.switchMainTab = switchMainTab;
window.switchSubTab = switchSubTab;