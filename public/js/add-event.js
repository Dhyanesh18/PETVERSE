document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addEventForm');
    const descriptionTextarea = document.getElementById('description');
    const charCount = document.querySelector('.char-count');
    const documentInput = document.getElementById('permissionDocument');
    const documentPreview = document.getElementById('documentPreview');
    const eventDateInput = document.getElementById('eventDate');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');

    // Initialize validation system
    const EventValidator = {
        validationState: {
            title: false,
            category: false,
            description: false,
            eventDate: false,
            startTime: false,
            endTime: false,
            venue: false,
            address: false,
            city: false,
            maxAttendees: false,
            permissionDocument: false,
            contactEmail: false,
            contactPhone: false
        },

        init: function() {
            this.setupDateValidation();
            this.attachEventListeners();
            console.log('🎉 Event Creation Validation Initialized');
        },

        setupDateValidation: function() {
            // Set minimum date to 1 month from today
            const today = new Date();
            const minDate = new Date(today);
            minDate.setMonth(today.getMonth() + 1);
            eventDateInput.min = minDate.toISOString().split('T')[0];

            // Set maximum date to 6 months from today
            const maxDate = new Date(today);
            maxDate.setMonth(today.getMonth() + 6);
            eventDateInput.max = maxDate.toISOString().split('T')[0];
        },

        attachEventListeners: function() {
            // Real-time validation for all fields
            document.getElementById('title').addEventListener('input', () => this.validateTitle());
            document.getElementById('category').addEventListener('change', () => this.validateCategory());
            document.getElementById('description').addEventListener('input', () => this.validateDescription());
            eventDateInput.addEventListener('change', () => this.validateEventDate());
            startTimeInput.addEventListener('change', () => this.validateStartTime());
            endTimeInput.addEventListener('change', () => this.validateEndTime());
            document.getElementById('venue').addEventListener('input', () => this.validateVenue());
            document.getElementById('address').addEventListener('input', () => this.validateAddress());
            document.getElementById('city').addEventListener('input', () => this.validateCity());
            document.getElementById('maxAttendees').addEventListener('input', () => this.validateMaxAttendees());
            document.getElementById('contactEmail').addEventListener('input', () => this.validateContactEmail());
            document.getElementById('contactPhone').addEventListener('input', () => this.validateContactPhone());
            documentInput.addEventListener('change', () => this.validatePermissionDocument());
        },

        validateTitle: function() {
            const title = document.getElementById('title').value.trim();
            let isValid = true;
            let message = '';

            if (title.length === 0) {
                isValid = false;
                message = 'Event title is required';
            } else if (title.length < 5) {
                isValid = false;
                message = `Title is too short (${title.length}/5 characters minimum)`;
            } else if (title.length > 100) {
                isValid = false;
                message = `Title is too long (${title.length}/100 characters maximum)`;
            }

            this.showFieldValidation('title', isValid, message);
            return isValid;
        },

        validateCategory: function() {
            const category = document.getElementById('category').value;
            const isValid = category !== '';
            this.showFieldValidation('category', isValid, 'Please select a category');
            return isValid;
        },

        validateDescription: function() {
            const description = document.getElementById('description').value.trim();
            let isValid = true;
            let message = '';

            if (description.length === 0) {
                isValid = false;
                message = 'Event description is required';
            } else if (description.length < 20) {
                isValid = false;
                message = `Description is too short (${description.length}/20 characters minimum)`;
            } else if (description.length > 1000) {
                isValid = false;
                message = `Description is too long (${description.length}/1000 characters maximum)`;
            }

            this.showFieldValidation('description', isValid, message);
            return isValid;
        },

        validateEventDate: function() {
            const eventDate = new Date(eventDateInput.value);
            const today = new Date();
            const oneMonthFromNow = new Date(today);
            oneMonthFromNow.setMonth(today.getMonth() + 1);
            const sixMonthsFromNow = new Date(today);
            sixMonthsFromNow.setMonth(today.getMonth() + 6);

            let isValid = true;
            let message = '';
            let notificationMessage = '';

            if (!eventDateInput.value) {
                isValid = false;
                message = 'Please select an event date';
                notificationMessage = 'Please select an event date';
            } else if (eventDate < oneMonthFromNow) {
                isValid = false;
                message = 'Event must be at least 1 month in advance';
                notificationMessage = '❌ Event must be at least 1 month in advance';
            } else if (eventDate > sixMonthsFromNow) {
                isValid = false;
                message = 'Event cannot be more than 6 months in advance';
                notificationMessage = '❌ Event cannot be more than 6 months in advance';
            } else {
                notificationMessage = '✅ Event date is valid (1-6 months in advance)';
            }

            this.showFieldValidation('eventDate', isValid, message);
            this.showDateNotification(notificationMessage, isValid);
            return isValid;
        },

        showDateNotification: function(message, isValid) {
            const notification = document.getElementById('dateValidationNotice');
            if (notification) {
                notification.innerHTML = `<i class="fas fa-${isValid ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
                notification.className = `date-validation-notice ${isValid ? 'valid' : 'invalid'}`;
            }
        },

        validateStartTime: function() {
            const startTime = startTimeInput.value;
            let isValid = true;
            let message = '';

            if (startTime === '') {
                isValid = false;
                message = 'Start time is required';
            }

            this.showFieldValidation('startTime', isValid, message);
            return isValid;
        },

        validateEndTime: function() {
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            let isValid = true;
            let message = '';

            if (endTime === '') {
                isValid = false;
                message = 'End time is required';
            } else if (startTime && endTime <= startTime) {
                isValid = false;
                message = 'End time must be after start time';
            }

            this.showFieldValidation('endTime', isValid, message);
            return isValid;
        },

        validateVenue: function() {
            const venue = document.getElementById('venue').value.trim();
            let isValid = true;
            let message = '';

            if (venue.length === 0) {
                isValid = false;
                message = 'Venue name is required';
            } else if (venue.length < 3) {
                isValid = false;
                message = `Venue name is too short (${venue.length}/3 characters minimum)`;
            }

            this.showFieldValidation('venue', isValid, message);
            return isValid;
        },

        validateAddress: function() {
            const address = document.getElementById('address').value.trim();
            let isValid = true;
            let message = '';

            if (address.length === 0) {
                isValid = false;
                message = 'Address is required';
            } else if (address.length < 10) {
                isValid = false;
                message = `Address is too short (${address.length}/10 characters minimum)`;
            }

            this.showFieldValidation('address', isValid, message);
            return isValid;
        },

        validateCity: function() {
            const city = document.getElementById('city').value.trim();
            let isValid = true;
            let message = '';

            if (city.length === 0) {
                isValid = false;
                message = 'City name is required';
            } else if (city.length < 2) {
                isValid = false;
                message = `City name is too short (${city.length}/2 characters minimum)`;
            }

            this.showFieldValidation('city', isValid, message);
            return isValid;
        },

        validateMaxAttendees: function() {
            const maxAttendees = parseInt(document.getElementById('maxAttendees').value);
            let isValid = true;
            let message = '';

            if (isNaN(maxAttendees) || maxAttendees === 0) {
                isValid = false;
                message = 'Maximum attendees is required';
            } else if (maxAttendees < 1) {
                isValid = false;
                message = 'Maximum attendees must be at least 1';
            } else if (maxAttendees > 1000) {
                isValid = false;
                message = 'Maximum attendees cannot exceed 1000';
            }

            this.showFieldValidation('maxAttendees', isValid, message);
            return isValid;
        },

        validatePermissionDocument: function() {
            const file = documentInput.files[0];
            const isValid = file !== undefined;
            this.showFieldValidation('permissionDocument', isValid, 'Please upload permission document');
            return isValid;
        },

        validateContactEmail: function() {
            const email = document.getElementById('contactEmail').value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            let isValid = true;
            let message = '';
            let noticeMessage = '';

            if (email === '') {
                // Email is optional, so empty is valid
                isValid = true;
                message = '';
                noticeMessage = 'Optional - Leave blank to use your account email';
            } else if (!email.includes('@')) {
                isValid = false;
                message = 'Email must contain @ symbol';
                noticeMessage = '❌ Email must contain @ symbol';
            } else if (!email.includes('.')) {
                isValid = false;
                message = 'Email must contain a domain (e.g., .com, .org)';
                noticeMessage = '❌ Email must contain a domain (e.g., .com, .org)';
            } else if (!emailRegex.test(email)) {
                isValid = false;
                message = 'Please enter a valid email format (e.g., user@example.com)';
                noticeMessage = '❌ Please enter a valid email format (e.g., user@example.com)';
            } else {
                isValid = true;
                message = '';
                noticeMessage = '✅ Email address is valid';
            }

            this.showFieldValidation('contactEmail', isValid, message);
            this.showContactNotification('contactEmailNotice', noticeMessage, isValid);
            return isValid;
        },

        validateContactPhone: function() {
            const phone = document.getElementById('contactPhone').value.trim();
            const phoneRegex = /^\d{10}$/;
            const hasNonNumeric = /[^0-9]/.test(phone);
            
            let isValid = true;
            let message = '';
            let noticeMessage = '';

            if (phone === '') {
                // Phone is optional, so empty is valid
                isValid = true;
                message = '';
                noticeMessage = 'Optional - Leave blank to use your account phone';
            } else if (hasNonNumeric) {
                isValid = false;
                message = 'Phone number can only contain digits (0-9)';
                noticeMessage = '❌ Phone number can only contain digits (0-9)';
            } else if (!phoneRegex.test(phone)) {
                isValid = false;
                message = 'Phone number must be exactly 10 digits';
                noticeMessage = '❌ Phone number must be exactly 10 digits';
            } else {
                isValid = true;
                message = '';
                noticeMessage = '✅ Phone number is valid';
            }

            this.showFieldValidation('contactPhone', isValid, message);
            this.showContactNotification('contactPhoneNotice', noticeMessage, isValid);
            return isValid;
        },

        showContactNotification: function(noticeId, message, isValid) {
            const notification = document.getElementById(noticeId);
            if (notification) {
                notification.innerHTML = `<i class="fas fa-${isValid ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
                notification.className = `contact-validation-notice ${isValid ? 'valid' : 'invalid'}`;
            }
        },

        showFieldValidation: function(fieldName, isValid, message) {
            const field = document.getElementById(fieldName);
            const errorElement = document.getElementById(fieldName + 'Error');
            
            if (!errorElement) {
                const errorDiv = document.createElement('div');
                errorDiv.id = fieldName + 'Error';
                errorDiv.className = 'field-error';
                field.parentNode.appendChild(errorDiv);
            }

            const errorElementNew = document.getElementById(fieldName + 'Error');
            
            if (isValid) {
                field.classList.remove('invalid');
                field.classList.add('valid');
                errorElementNew.style.display = 'none';
                this.validationState[fieldName] = true;
            } else {
                field.classList.remove('valid');
                field.classList.add('invalid');
                errorElementNew.textContent = message;
                errorElementNew.style.display = 'block';
                this.validationState[fieldName] = false;
            }
        },

        validateForm: function() {
            const isTitleValid = this.validateTitle();
            const isCategoryValid = this.validateCategory();
            const isDescriptionValid = this.validateDescription();
            const isEventDateValid = this.validateEventDate();
            const isStartTimeValid = this.validateStartTime();
            const isEndTimeValid = this.validateEndTime();
            const isVenueValid = this.validateVenue();
            const isAddressValid = this.validateAddress();
            const isCityValid = this.validateCity();
            const isMaxAttendeesValid = this.validateMaxAttendees();
            const isPermissionDocumentValid = this.validatePermissionDocument();
            const isContactEmailValid = this.validateContactEmail();
            const isContactPhoneValid = this.validateContactPhone();

            return isTitleValid && isCategoryValid && isDescriptionValid && 
                   isEventDateValid && isStartTimeValid && isEndTimeValid && 
                   isVenueValid && isAddressValid && isCityValid && 
                   isMaxAttendeesValid && isPermissionDocumentValid && 
                   isContactEmailValid && isContactPhoneValid;
        }
    };

    // Initialize validator
    EventValidator.init();

    // Character count for description
    descriptionTextarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = `${count} / 1000`;
        
        // Update character count color based on limit
        if (count > 1000) {
            charCount.style.color = '#f44336';
        } else if (count > 900) {
            charCount.style.color = '#ff9800';
        } else {
            charCount.style.color = '#4CAF50';
        }
    });

    // Document preview
    documentInput.addEventListener('change', function(e) {
        documentPreview.innerHTML = '';
        const file = e.target.files[0];
        
        if (file) {
            // Check file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                documentInput.value = '';
                return;
            }

            const div = document.createElement('div');
            div.className = 'document-preview-item';
            
            const icon = getFileIcon(file.type);
            const fileSize = (file.size / 1024).toFixed(2);
            
            div.innerHTML = `
                <i class="fas ${icon}"></i>
                <div class="document-info">
                    <span class="document-name">${file.name}</span>
                    <span class="document-size">${fileSize} KB</span>
                </div>
                <button type="button" class="remove-document" onclick="this.parentElement.remove(); document.getElementById('permissionDocument').value = '';">
                    <i class="fas fa-times"></i>
                </button>
            `;
            documentPreview.appendChild(div);
        }
    });

    // Get file icon based on type
    function getFileIcon(type) {
        if (type.includes('pdf')) return 'fa-file-pdf';
        if (type.includes('word') || type.includes('doc')) return 'fa-file-word';
        if (type.includes('image')) return 'fa-file-image';
        return 'fa-file-alt';
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Use comprehensive validation
        if (!EventValidator.validateForm()) {
            // Scroll to first error
            const firstError = document.querySelector('.invalid');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }
        
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        try {
            const formData = new FormData(form);
            
            const response = await fetch('/events/add', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Event created successfully!');
                window.location.href = `/events/${data.eventId}`;
            } else {
                alert(data.message || 'Failed to create event');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Create Event';
            }
        } catch (err) {
            console.error('Error creating event:', err);
            alert('Failed to create event');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Create Event';
        }
    });
});
