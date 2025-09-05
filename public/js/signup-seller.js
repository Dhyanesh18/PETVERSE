document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    
    // Form fields
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPassInput = document.getElementById('confirm-password');
    const phoneInput = document.getElementById('phone-number');
    const fullNameInput = document.getElementById('full-name');
    const businessNameInput = document.getElementById('business-name');
    const taxIdInput = document.getElementById('tax-id');
    const businessAddressInput = document.getElementById('business-address');
    const licenseInput = document.getElementById('license');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Error message helper
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

    // Validation functions
    function validateEmail() {
        clearErrors(emailInput);
        if (!emailInput.value) {
            emailInput.parentElement.appendChild(createErrorMessage('✖ Email is required'));
            emailInput.parentElement.classList.add('has-error');
            return false;
        }
        if (!emailRegex.test(emailInput.value)) {
            emailInput.parentElement.appendChild(createErrorMessage('✖ Please enter a valid email address'));
            emailInput.parentElement.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateUsername() {
        clearErrors(usernameInput);
        if (!usernameInput.value.trim()) {
            usernameInput.parentElement.appendChild(createErrorMessage('✖ Username is required'));
            usernameInput.parentElement.classList.add('has-error');
            return false;
        }
        if (usernameInput.value.length < 3) {
            usernameInput.parentElement.appendChild(createErrorMessage('✖ Username must be at least 3 characters'));
            usernameInput.parentElement.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validatePassword() {
        clearErrors(passwordInput);
        if (!passwordInput.value) {
            passwordInput.parentElement.appendChild(createErrorMessage('✖ Password is required'));
            passwordInput.parentElement.classList.add('has-error');
            return false;
        }
        if (passwordInput.value.length < 8) {
            passwordInput.parentElement.appendChild(createErrorMessage('✖ Password must be at least 8 characters'));
            passwordInput.parentElement.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateConfirmPassword() {
        clearErrors(confirmPassInput);
        if (!confirmPassInput.value) {
            confirmPassInput.parentElement.appendChild(createErrorMessage('✖ Please confirm your password'));
            confirmPassInput.parentElement.classList.add('has-error');
            return false;
        }
        if (confirmPassInput.value !== passwordInput.value) {
            confirmPassInput.parentElement.appendChild(createErrorMessage('✖ Passwords do not match'));
            confirmPassInput.parentElement.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validatePhoneNumber() {
        clearErrors(phoneInput);
        if (!phoneInput.value) {
            phoneInput.parentElement.appendChild(createErrorMessage('✖ Phone number is required'));
            phoneInput.parentElement.classList.add('has-error');
            return false;
        }
        if (!/^[0-9]{10}$/.test(phoneInput.value)) {
            phoneInput.parentElement.appendChild(createErrorMessage('✖ Enter a valid 10-digit phone number'));
            phoneInput.parentElement.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateFullName() {   
        clearErrors(fullNameInput);
        const naemValue = fullNameInput.value.trim()
        if (!fullNameInput.value) {
            fullNameInput.parentElement.appendChild(createErrorMessage('✖ Full name is required'));
            fullNameInput.parentElement.classList.add('has-error');
            return false;
        }
        if (fullNameInput.value.split(' ').length < 2) {
            fullNameInput.parentElement.appendChild(createErrorMessage('✖ Please enter your full name (first and last)'));
            fullNameInput.parentElement.classList.add('has-error');
            return false;
        }

        const nameRegex = /^[A-Za-z\s'-]+$/;
        if (!nameRegex.test(nameValue)){
            fullNameInput.parentElement.appendChild(createErrorMessage('✖ Full name can contain only characters'))
            fullNameInput.parentElement.classList.add('has-error');
            return false;
        }

        return true;
    }

    function validateBusinessName() {
        clearErrors(businessNameInput);
        if (!businessNameInput.value.trim()) {
            businessNameInput.parentElement.appendChild(createErrorMessage('✖ Business name is required'));
            businessNameInput.parentElement.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateBusinessAddress() {
        clearErrors(businessAddressInput);
        if (!businessAddressInput.value.trim()) {
            businessAddressInput.parentElement.appendChild(createErrorMessage('✖ Business address is required'));
            businessAddressInput.parentElement.classList.add('has-error');
            return false;
        }
        return true;
    }

    function validateLicense() {
        clearErrors(licenseInput);
        if (!licenseInput.files || !licenseInput.files[0]) {
            licenseInput.closest('.file-upload-group').querySelector('.file-name').textContent = 'License is required';
            licenseInput.closest('.file-upload-group').classList.add('has-error');
            return false;
        }
        
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(licenseInput.files[0].type)) {
            licenseInput.closest('.file-upload-group').querySelector('.file-name').textContent = 'Only PDF/DOC files allowed';
            licenseInput.closest('.file-upload-group').classList.add('has-error');
            return false;
        }
        return true;
    }

    // Phone number formatting
    phoneInput.addEventListener("input", function() {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
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

    // Clear errors when user starts typing
    const inputs = [emailInput, usernameInput, passwordInput, confirmPassInput, 
                   phoneInput, fullNameInput, businessNameInput, businessAddressInput];
    
    inputs.forEach(input => {
        input.addEventListener('input', () => clearErrors(input));
    });

    licenseInput.addEventListener('change', function() {
        const fileName = this.files[0] ? this.files[0].name : 'Upload your license';
        this.closest('.file-input-container').querySelector('.file-name').textContent = fileName;
        clearErrors(this);
    });
    

    // Form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Run all validations
        let isValid = true;
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
            const firstError = document.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Prepare FormData for file upload
        const formData = new FormData();
        formData.append('email', emailInput.value.trim().toLowerCase());
        formData.append('username', usernameInput.value.trim());
        formData.append('password', passwordInput.value);
        formData.append('phoneNumber', phoneInput.value);
        formData.append('fullName', fullNameInput.value.trim());
        formData.append('businessName', businessNameInput.value.trim());
        formData.append('businessAddress', businessAddressInput.value.trim());
        formData.append('taxId', taxIdInput.value.trim());
        formData.append('license', licenseInput.files[0]);
        formData.append('role', 'seller');
        
        try {
            const response = await fetch('/signup/seller', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Registration failed');
            }
            
            // Show success message
            const successModal = document.createElement('div');
            successModal.className = 'success-modal';
            successModal.innerHTML = `
                <div class="modal-content">
                    <h3>Registration Submitted</h3>
                    <p>${result.message}</p>
                    <p>Your account will be activated after admin approval.</p>
                    <button onclick="window.location.href='/login'">Go to Login</button>
                </div>
            `;
            document.body.appendChild(successModal);
            
        } catch (error) {
            console.error("Error:", error);
            
            // Show error in a more user-friendly way
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