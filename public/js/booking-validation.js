/**
 * PETVERSE Booking Form Validation
 * Client-side DOM validation for booking appointments
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize validation system
  const BookingValidator = {
    // Form elements
    form: document.getElementById('bookingForm'),
    datePicker: document.getElementById('datePicker'),
    slotSelect: document.getElementById('slotSelect'),
    noSlots: document.getElementById('no-slots'),
    submitBtn: document.getElementById('submitBtn'),
    
    // Validation state
    validationState: {
      date: false,
      slot: false
    },
    
    // Initialize the validator
    init: function() {
      if (!this.form) return; // Exit if form not found
      
      this.setupDatePicker();
      this.attachEventListeners();
      console.log('🐾 PetVerse Booking Validation Initialized');
    },
    
    // Setup date picker with minimum date
    setupDatePicker: function() {
      if (this.datePicker) {
        const today = new Date().toISOString().split('T')[0];
        this.datePicker.min = today;
      }
    },
    
    // Attach all event listeners
    attachEventListeners: function() {
      // Date picker change event
      this.datePicker?.addEventListener('change', (e) => {
        this.handleDateChange(e);
      });
      
      // Slot selection change event
      this.slotSelect?.addEventListener('change', () => {
        this.validateSlot();
      });
      
      // Form submission event
      this.form?.addEventListener('submit', (e) => {
        this.handleFormSubmit(e);
      });
      
      // Reset button state on page load
      window.addEventListener('load', () => {
        this.resetSubmitButton();
      });
    },
    
    // Handle date picker changes
    handleDateChange: async function(event) {
      const date = event.target.value;
      const serviceId = document.querySelector('input[name="serviceId"]')?.value;
      
      // Reset slot validation
      this.clearFieldValidation('slot');
      if (this.slotSelect) this.slotSelect.value = '';
      
      if (!date) {
        this.resetSlotSelect('-- First select a date --');
        this.clearFieldValidation('date');
        return;
      }
      
      // Validate the selected date
      if (!this.validateDate()) {
        this.resetSlotSelect('-- Select a valid date first --');
        return;
      }
      
      // Load available slots
      await this.loadAvailableSlots(serviceId, date);
    },
    
    // Load available time slots
    loadAvailableSlots: async function(serviceId, date) {
      if (!serviceId || !date) return;
      
      try {
        // Show loading state
        this.setSlotLoading();
        
        // Fetch available slots
        const response = await fetch(`/booking/available/slots?serviceId=${serviceId}&date=${date}`);
        const data = await response.json();
        
        if (data.availableSlots && data.availableSlots.length > 0) {
          this.populateSlots(data.availableSlots);
        } else {
          this.showNoSlotsAvailable();
        }
      } catch (error) {
        console.error('Error loading slots:', error);
        this.showSlotLoadingError();
      }
    },
    
    // Set loading state for slots
    setSlotLoading: function() {
      if (this.slotSelect) {
        this.slotSelect.disabled = true;
        this.slotSelect.innerHTML = '<option value="">Loading available slots...</option>';
      }
      if (this.noSlots) this.noSlots.style.display = 'none';
    },
    
    // Populate slot dropdown with available times
    populateSlots: function(slots) {
      if (!this.slotSelect) return;
      
      this.slotSelect.innerHTML = '<option value="">-- Select a time slot --</option>';
      slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot;
        this.slotSelect.appendChild(option);
      });
      this.slotSelect.disabled = false;
      if (this.noSlots) this.noSlots.style.display = 'none';
    },
    
    // Show no slots available state
    showNoSlotsAvailable: function() {
      if (this.slotSelect) {
        this.slotSelect.innerHTML = '<option value="">No available slots</option>';
        this.slotSelect.disabled = true;
      }
      if (this.noSlots) this.noSlots.style.display = 'block';
      this.showFieldError('slot', 'No time slots available for this date. Please select another date.');
    },
    
    // Show slot loading error
    showSlotLoadingError: function() {
      if (this.slotSelect) {
        this.slotSelect.innerHTML = '<option value="">Error loading slots</option>';
        this.slotSelect.disabled = true;
      }
      if (this.noSlots) this.noSlots.style.display = 'none';
      this.showFieldError('slot', 'Error loading time slots. Please try again.');
    },
    
    // Reset slot select to default state
    resetSlotSelect: function(placeholder) {
      if (this.slotSelect) {
        this.slotSelect.disabled = true;
        this.slotSelect.innerHTML = `<option value="">${placeholder}</option>`;
      }
      if (this.noSlots) this.noSlots.style.display = 'none';
    },
    
    // Validation Functions
    validateDate: function() {
      const date = this.datePicker?.value;
      
      if (!date) {
        this.showFieldError('date', 'Please select a date for your appointment');
        return false;
      }
      
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if date is in the past
      if (selectedDate < today) {
        this.showFieldError('date', 'Please select a future date');
        return false;
      }
      
      // Check if selected date is Sunday (day 0)
      if (selectedDate.getDay() === 0) {
        this.showFieldError('date', 'Sorry, we are closed on Sundays. Please select another date');
        return false;
      }
      
      // Check if date is too far in future (3 months limit)
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      if (selectedDate > maxDate) {
        this.showFieldError('date', 'Please select a date within the next 3 months');
        return false;
      }
      
      this.showFieldSuccess('date');
      return true;
    },
    
    validateSlot: function() {
      const slot = this.slotSelect?.value;
      
      if (!slot) {
        this.showFieldError('slot', 'Please select a time slot for your appointment');
        return false;
      }
      
      if (this.slotSelect?.disabled) {
        this.showFieldError('slot', 'Please select a valid date first');
        return false;
      }
      
      this.showFieldSuccess('slot');
      return true;
    },
    
    validateForm: function() {
      const isDateValid = this.validateDate();
      const isSlotValid = this.validateSlot();
      return isDateValid && isSlotValid;
    },
    
    // Visual Feedback Functions - Clean Version (No Icons)
    showFieldError: function(fieldName, message) {
      const field = document.getElementById(fieldName === 'date' ? 'datePicker' : 'slotSelect');
      const errorText = document.getElementById(fieldName + 'ErrorText');
      
      if (field) {
        field.classList.add('input-error');
        field.classList.remove('input-success');
      }
      
      if (errorText) {
        errorText.textContent = message;
        errorText.style.display = 'block';
      }
      
      this.validationState[fieldName] = false;
    },
    
    showFieldSuccess: function(fieldName) {
      const field = document.getElementById(fieldName === 'date' ? 'datePicker' : 'slotSelect');
      const errorText = document.getElementById(fieldName + 'ErrorText');
      
      if (field) {
        field.classList.remove('input-error');
        field.classList.add('input-success');
      }
      
      if (errorText) errorText.style.display = 'none';
      
      this.validationState[fieldName] = true;
    },
    
    clearFieldValidation: function(fieldName) {
      const field = document.getElementById(fieldName === 'date' ? 'datePicker' : 'slotSelect');
      const errorText = document.getElementById(fieldName + 'ErrorText');
      
      if (field) {
        field.classList.remove('input-error', 'input-success');
      }
      
      if (errorText) errorText.style.display = 'none';
      
      this.validationState[fieldName] = false;
    },
    
    // Form submission handler
    handleFormSubmit: function(event) {
      event.preventDefault();
      
      if (!this.validateForm()) {
        this.scrollToFirstError();
        return false;
      }
      
      this.showSubmissionLoading();
      this.form.submit();
    },
    
    // Scroll to first validation error
    scrollToFirstError: function() {
      const firstError = document.querySelector('.input-error');
      if (firstError) {
        firstError.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        firstError.focus();
      }
    },
    
    // Show submission loading state
    showSubmissionLoading: function() {
      if (this.submitBtn) {
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirming Booking...';
      }
    },
    
    // Reset submit button to normal state
    resetSubmitButton: function() {
      if (this.submitBtn) {
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = 'Confirm Booking';
      }
    }
  };
  
  // Initialize the booking validator
  BookingValidator.init();
});
