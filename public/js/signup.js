document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    const form = document.getElementById('signup-form');
    console.log("Form element:", form);

    // Form fields
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPassInput = document.getElementById('confirm-password');
    const phoneInput = document.getElementById('phone');
    const fullNameInput = document.getElementById('fullName');
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
            passwordGroup.appendChild(createErrorMessage('✖ Your password must be at least 8 characters long'));
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

        if (!/^[0-9]{10}$/.test(phoneInput.value)) {
            phoneGroup.appendChild(createErrorMessage('✖ Enter a valid 10-digit phone number'));
            phoneGroup.classList.add('has-error');
            return false;
        }

        return true;
    }

    function validateFullName() {
        clearErrors(fullNameInput);
        const fullNameGroup = fullNameInput.closest('.input-group');
        const nameValue = fullNameInput.value.trim();

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

        const nameRegex = /^[A-Za-z\s'-]+$/;
        if (!nameRegex.test(nameValue)){
            fullNameInput.parentElement.appendChild(createErrorMessage('✖ Full name can contain only characters'));
            fullNameInput.parentElement.classList.add("has-error");
            return false;
        }

        return true;
    }

    // Phone number formatting - only allow digits and limit to 10
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

    // Clear errors when user starts typing
    emailInput.addEventListener('input', () => clearErrors(emailInput));
    usernameInput.addEventListener('input', () => clearErrors(usernameInput));
    passwordInput.addEventListener('input', () => clearErrors(passwordInput));
    confirmPassInput.addEventListener('input', () => clearErrors(confirmPassInput));
    phoneInput.addEventListener('input', () => clearErrors(phoneInput));
    fullNameInput.addEventListener('input', () => clearErrors(fullNameInput));

    // Form submission - YOUR ORIGINAL WORKING CODE WITH ADDED VALIDATION
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Run all validations
        let isValid = true;
        if (!validateEmail()) isValid = false;
        if (!validateUsername()) isValid = false;
        if (!validatePassword()) isValid = false;
        if (!validateConfirmPassword()) isValid = false;
        if (!validatePhoneNumber()) isValid = false;
        if (!validateFullName()) isValid = false;
        
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
            // Scroll to the first error
            const firstError = document.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Don't proceed with submission if invalid
        }

        // YOUR ORIGINAL WORKING SUBMISSION CODE
        const formData = {
            email: emailInput.value.trim().toLowerCase(),
            username: usernameInput.value.trim(),
            password: passwordInput.value,
            phone: phoneInput.value.replace(/\D/g, ''),
            fullName: fullNameInput.value.trim(),
            role: 'owner'
        };
        
        console.log("Form Data:", formData);
        
        try {
            const response = await fetch('/signup/owner', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }
            
            const result = await response.json();
            console.log("Success:", result);
            window.location.href = '/login';
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    });
});