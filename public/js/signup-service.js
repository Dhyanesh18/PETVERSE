document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    
    // Form validation elements
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPassInput = document.getElementById('confirm-password');
    const phoneInput = document.getElementById('phone-number');
    const fullNameInput = document.getElementById('full-name');
    const serviceTypeInput = document.getElementById('service-type');
    const businessAddressInput = document.getElementById('business-address');
    const certificateInput = document.getElementById('certificate');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function createErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        return errorDiv;
    }

    function clearErrors(inputElement) {
        const inputGroup = inputElement.closest('.input-group');
        const existingError = inputGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        inputGroup.classList.remove('has-error');
    }

    // Common validations
    function validateEmail() {
        clearErrors(emailInput);
        const emailGroup = emailInput.closest('.input-group');
        
        if (!emailInput.value) {
            emailGroup.appendChild(createErrorMessage('✖ Email is required'));
            emailGroup.classList.add('has-error');
            return false;
        }

        if (!emailRegex.test(emailInput.value)) {
            emailGroup.appendChild(createErrorMessage('✖ Please enter a valid email address'));
            emailGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateUsername() {
        clearErrors(usernameInput);
        const usernameGroup = usernameInput.closest('.input-group');

        if (!usernameInput.value.trim()) {
            usernameGroup.appendChild(createErrorMessage('✖ Username is required'));
            usernameGroup.classList.add('has-error');
            return false;
        }

        if (usernameInput.value.length < 3) {
            usernameGroup.appendChild(createErrorMessage('✖ Username must be at least 3 characters long'));
            usernameGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validatePassword() {
        clearErrors(passwordInput);
        const passwordGroup = passwordInput.closest('.input-group');
        
        if (!passwordInput.value) {
            passwordGroup.appendChild(createErrorMessage('✖ Password is required'));
            passwordGroup.classList.add('has-error');
            return false;
        }
        
        if (passwordInput.value.length < 8) {
            passwordGroup.appendChild(createErrorMessage('✖ Password must be at least 8 characters long'));
            passwordGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateConfirmPassword() {
        clearErrors(confirmPassInput);
        const confirmPassGroup = confirmPassInput.closest('.input-group');

        if (!confirmPassInput.value) {
            confirmPassGroup.appendChild(createErrorMessage('✖ Please confirm your password'));
            confirmPassGroup.classList.add('has-error');
            return false;
        }

        if (confirmPassInput.value !== passwordInput.value) {
            confirmPassGroup.appendChild(createErrorMessage('✖ Passwords do not match'));
            confirmPassGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validatePhoneNumber() {
        clearErrors(phoneInput);
        const phoneGroup = phoneInput.closest('.input-group');

        if (!phoneInput.value) {
            phoneGroup.appendChild(createErrorMessage('✖ Phone number is required'));
            phoneGroup.classList.add('has-error');
            return false;
        }

        if (phoneInput.value.length !== 10) {
            phoneGroup.appendChild(createErrorMessage('✖ Enter a valid 10-digit phone number'));
            phoneGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateFullName() {
        clearErrors(fullNameInput);
        const fullNameGroup = fullNameInput.closest('.input-group');

        if (!fullNameInput.value) {
            fullNameGroup.appendChild(createErrorMessage('✖ Full name is required'));
            fullNameGroup.classList.add('has-error');
            return false;
        }

        if (fullNameInput.value.split(' ').length < 2) {
            fullNameGroup.appendChild(createErrorMessage('✖ Please enter your full name (first and last name)'));
            fullNameGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    // Service Provider specific validations
    function validateServiceType() {
        clearErrors(serviceTypeInput);
        const serviceTypeGroup = serviceTypeInput.closest('.input-group');

        if (!serviceTypeInput.value) {
            serviceTypeGroup.appendChild(createErrorMessage('✖ Service type is required'));
            serviceTypeGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateBusinessAddress() {
        clearErrors(businessAddressInput);
        const businessAddressGroup = businessAddressInput.closest('.input-group');

        if (!businessAddressInput.value.trim()) {
            businessAddressGroup.appendChild(createErrorMessage('✖ Business address is required'));
            businessAddressGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateCertificate() {
        clearErrors(certificateInput);
        const certificateGroup = certificateInput.closest('.file-upload-group');

        if (!certificateInput.files || certificateInput.files.length === 0) {
            certificateGroup.appendChild(createErrorMessage('✖ Professional certificate is required'));
            certificateGroup.classList.add('has-error');
            return false;
        }

        const validTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const file = certificateInput.files[0];
        
        if (!validTypes.includes(file.type)) {
            certificateGroup.appendChild(createErrorMessage('✖ Only PDF or DOC files are allowed'));
            certificateGroup.classList.add('has-error');
            return false;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            certificateGroup.appendChild(createErrorMessage('✖ File size must be less than 5MB'));
            certificateGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    // Phone number formatting
    phoneInput.addEventListener("input", function() {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });

    // File input display
    certificateInput.addEventListener('change', function() {
        const fileNameDisplay = document.querySelector('.file-name');
        if (this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
        } else {
            fileNameDisplay.textContent = 'Upload your certificate';
        }
    });

    // Event listeners for validation
    emailInput.addEventListener('blur', validateEmail);
    usernameInput.addEventListener('blur', validateUsername);
    passwordInput.addEventListener('blur', validatePassword);
    confirmPassInput.addEventListener('blur', validateConfirmPassword);
    phoneInput.addEventListener('blur', validatePhoneNumber);
    fullNameInput.addEventListener('blur', validateFullName);
    serviceTypeInput.addEventListener('change', validateServiceType);
    businessAddressInput.addEventListener('blur', validateBusinessAddress);
    certificateInput.addEventListener('change', validateCertificate);

    // Clear errors when user starts typing
    const inputs = [emailInput, usernameInput, passwordInput, confirmPassInput, 
                   phoneInput, fullNameInput, businessAddressInput];
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearErrors(this);
        });
    });

    // Form submission validation
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let isValid = true;
        
        // Validate all fields
        if (!validateEmail()) isValid = false;
        if (!validateUsername()) isValid = false;
        if (!validatePassword()) isValid = false;
        if (!validateConfirmPassword()) isValid = false;
        if (!validatePhoneNumber()) isValid = false;
        if (!validateFullName()) isValid = false;
        if (!validateServiceType()) isValid = false;
        if (!validateBusinessAddress()) isValid = false;
        if (!validateCertificate()) isValid = false;
        
        // Check terms and conditions
        const agreeCheckbox = document.getElementById('agree');
        if (!agreeCheckbox.checked) {
            const termsLabel = document.querySelector('.terms-and-conditions');
            const existingError = termsLabel.querySelector('.error-message');
            if (!existingError) {
                const errorDiv = createErrorMessage('✖ You must agree to the terms and conditions');
                termsLabel.appendChild(errorDiv);
            }
            isValid = false;
        } else {
            const existingError = document.querySelector('.terms-and-conditions .error-message');
            if (existingError) {
                existingError.remove();
            }
        }
        
        if (!isValid) {
            e.preventDefault();
            const firstError = document.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        try {
            const formData = new FormData(this);
            
            const response = await fetch('/signup/service-provider', {
                method: 'POST',
                body: formData
            });
    
            const result = await response.json();
            
            if (response.ok) {
                // Show success message
                const successModal = document.createElement('div');
                successModal.className = 'success-modal';
                successModal.innerHTML = `
                    <div class="modal-content">
                        <h3>✅ Registration Submitted</h3>
                        <p>${result.message}</p>
                        <p>Your account will be activated after admin approval.</p>
                        <button onclick="window.location.href='/availability'">Add availability</button>
                    </div>
                `;
                document.body.appendChild(successModal);
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            const errorContainer = document.getElementById('form-error-container') || 
                document.createElement('div');
            
            errorContainer.id = 'form-error-container';
            errorContainer.className = 'form-error';
            errorContainer.textContent = error.message;
            
            if (!document.getElementById('form-error-container')) {
                signupForm.prepend(errorContainer);
            }
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});