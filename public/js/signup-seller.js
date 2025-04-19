document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    
    // Form validation elements
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPassInput = document.getElementById('confirm-password');
    const phoneInput = document.getElementById('phone-number');
    const fullNameInput = document.getElementById('full-name');
    const businessNameInput = document.getElementById('business-name');
    const businessAddressInput = document.getElementById('business-address');
    const taxIdInput = document.getElementById('tax-id');
    const licenseInput = document.getElementById('license');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function createErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        return errorDiv;
    }

    function clearErrors(inputElement) {
        const existingError = inputElement.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        inputElement.parentElement.classList.remove('has-error');
    }

    // Common validations (same as your existing ones)
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

    // Seller-specific validations
    function validateBusinessName() {
        clearErrors(businessNameInput);
        const businessNameGroup = businessNameInput.closest('.input-group');

        if (!businessNameInput.value.trim()) {
            businessNameGroup.appendChild(createErrorMessage('✖ Business name is required'));
            businessNameGroup.classList.add('has-error');
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

    function validateLicense() {
        clearErrors(licenseInput);
        const licenseGroup = licenseInput.closest('.input-group');

        if (!licenseInput.files || licenseInput.files.length === 0) {
            licenseGroup.appendChild(createErrorMessage('✖ Business license is required'));
            licenseGroup.classList.add('has-error');
            return false;
        }

        const validTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const file = licenseInput.files[0];
        
        if (!validTypes.includes(file.type)) {
            licenseGroup.appendChild(createErrorMessage('✖ Only PDF or DOC files are allowed'));
            licenseGroup.classList.add('has-error');
            return false;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            licenseGroup.appendChild(createErrorMessage('✖ File size must be less than 5MB'));
            licenseGroup.classList.add('has-error');
            return false;
        }
        return true;
    }

    // Phone number formatting
    phoneInput.addEventListener("input", function() {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });

    // File input display
    licenseInput.addEventListener('change', function() {
        const fileNameDisplay = document.querySelector('.file-name');
        if (this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });

    // Event listeners for validation
    emailInput.addEventListener('blur', validateEmail);
    usernameInput.addEventListener('blur', validateUsername);
    passwordInput.addEventListener('blur', validatePassword);
    confirmPassInput.addEventListener('blur', validateConfirmPassword);
    phoneInput.addEventListener('blur', validatePhoneNumber);
    fullNameInput.addEventListener('blur', validateFullName);
    businessNameInput.addEventListener('blur', validateBusinessName);
    businessAddressInput.addEventListener('blur', validateBusinessAddress);
    licenseInput.addEventListener('change', validateLicense);

    // Clear errors when user starts typing
    const inputs = [emailInput, usernameInput, passwordInput, confirmPassInput, 
                   phoneInput, fullNameInput, businessNameInput, businessAddressInput];
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearErrors(this);
        });
    });

    // Form submission validation
    signupForm.addEventListener('submit', function(e) {
        let isValid = true;
        
        // Validate all fields
        if (!validateEmail()) isValid = false;
        if (!validateUsername()) isValid = false;
        if (!validatePassword()) isValid = false;
        if (!validateConfirmPassword()) isValid = false;
        if (!validatePhoneNumber()) isValid = false;
        if (!validateFullName()) isValid = false;
        if (!validateBusinessName()) isValid = false;
        if (!validateBusinessAddress()) isValid = false;
        if (!validateLicense()) isValid = false;
        
        // Check terms and conditions
        const agreeCheckbox = document.getElementById('agree');
        if (!agreeCheckbox.checked) {
            const termsLabel = document.querySelector('.checkbox-container');
            const existingError = termsLabel.querySelector('.error-message');
            if (!existingError) {
                const errorDiv = createErrorMessage('✖ You must agree to the terms and conditions');
                termsLabel.appendChild(errorDiv);
            }
            isValid = false;
        } else {
            const existingError = document.querySelector('.checkbox-container .error-message');
            if (existingError) {
                existingError.remove();
            }
        }
        
        if (!isValid) {
            e.preventDefault();
            // Scroll to the first error
            const firstError = document.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
});