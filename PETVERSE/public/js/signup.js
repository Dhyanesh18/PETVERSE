const userTypeOptions = document.querySelectorAll('.user-type-option');
const additionalFields = {
    'pet-owner': null, // No additional fields for pet owners
    'pet-seller': {
        left: 'business-name',
        right: 'license-number'
    },
    'service-provider': {
        left: 'service-type',
        right: 'certification'
    }
};

// Create container divs for additional fields
const leftFormContainer = document.querySelector('.left-form');
const rightFormContainer = document.querySelector('.right-form');

// Create seller fields and move them to appropriate containers
const businessNameField = document.getElementById('business-name').closest('.input-group');
const licenseNumberField = document.getElementById('license-number').closest('.input-group');

// Create service provider fields and prepare them for movement
const serviceTypeField = document.getElementById('service-type').closest('.input-group');
const certificationField = document.getElementById('certification').closest('.input-group');

// Remove all additional fields from their original containers
document.getElementById('pet-seller-fields').remove();
document.getElementById('service-provider-fields').remove();
document.getElementById('pet-owner-fields').remove();

// Fix for select elements - add custom styling
const styleEl = document.createElement('style');
styleEl.textContent = `
    .input-group select {
        width: 100%;
        padding: 10px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        margin-top: 15px;
        font-size: 0.95rem;
        transition: all 0.3s ease;
        background: #f8f9fa;
        color: #333;
    }
    
    .input-group select:focus {
        border-color: #5f9ea0;
        background: white;
        box-shadow: 0 0 8px rgba(95, 158, 160, 0.1);
        outline: none;
    }
    
    .input-group select:focus + label,
    .input-group select:not([value=""]) + label {
        top: 15px;
        left: 10px;
        transform: translateY(-50%) scale(0.85);
        background: white;
        color: #5f9ea0;
        border-color: #5f9ea0;
        z-index: 5;
        padding: 0 5px;
    }
`;
document.head.appendChild(styleEl);

// Create hidden field wrappers in the left and right containers
const leftSellerWrapper = document.createElement('div');
leftSellerWrapper.className = 'seller-field left-additional-field';
leftSellerWrapper.style.display = 'none';
leftSellerWrapper.appendChild(businessNameField);
leftFormContainer.appendChild(leftSellerWrapper);

const rightSellerWrapper = document.createElement('div');
rightSellerWrapper.className = 'seller-field right-additional-field';
rightSellerWrapper.style.display = 'none';
rightSellerWrapper.appendChild(licenseNumberField);
rightFormContainer.appendChild(rightSellerWrapper);

const leftServiceWrapper = document.createElement('div');
leftServiceWrapper.className = 'service-field left-additional-field';
leftServiceWrapper.style.display = 'none';
leftServiceWrapper.appendChild(serviceTypeField);
leftFormContainer.appendChild(leftServiceWrapper);

const rightServiceWrapper = document.createElement('div');
rightServiceWrapper.className = 'service-field right-additional-field';
rightServiceWrapper.style.display = 'none';
rightServiceWrapper.appendChild(certificationField);
rightFormContainer.appendChild(rightServiceWrapper);

userTypeOptions.forEach(option => {
    option.addEventListener('click', function() {
        // Remove active class from all options
        userTypeOptions.forEach(opt => opt.classList.remove('active'));
        
        // Add active class to selected option
        this.classList.add('active');
        
        // Hide all additional fields
        document.querySelectorAll('.left-additional-field, .right-additional-field').forEach(field => {
            field.style.display = 'none';
        });
        
        // Show fields for selected user type
        const userType = this.getAttribute('data-type');
        
        if (userType === 'pet-seller') {
            document.querySelectorAll('.seller-field').forEach(field => {
                field.style.display = 'block';
            });
            document.getElementById('username').innerHTML = 'Business Name';
        } else if (userType === 'service-provider') {
            document.querySelectorAll('.service-field').forEach(field => {
                field.style.display = 'block';
            });
            document.getElementById('username').innerHTML = 'Business Name';
        }
        
        // Add hidden input to form to track selected type
        let typeInput = document.getElementById('user-type-input');
        if (!typeInput) {
            typeInput = document.createElement('input');
            typeInput.type = 'hidden';
            typeInput.id = 'user-type-input';
            typeInput.name = 'userType';
            document.getElementById('signup-form').appendChild(typeInput);
        }
        typeInput.value = userType;
    });
});

// Helper function to handle select element changes
function handleSelectChange(selectElement) {
    if (selectElement.value) {
        selectElement.setAttribute('value', 'selected');
    } else {
        selectElement.removeAttribute('value');
    }
}

// Initialize all select elements
document.querySelectorAll('select').forEach(select => {
    // Set initial attribute
    if (select.value) {
        select.setAttribute('value', 'selected');
    }
    
    // Add change event listener
    select.addEventListener('change', function() {
        handleSelectChange(this);
    });
});

// Set Pet Owner as default selected
userTypeOptions[0].click();

const loginForm = document.getElementById('signup-form');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPassInput = document.getElementById('confirm-password');
const phoneInput = document.getElementById('phone-number');

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
}

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
    
    emailGroup.classList.remove('has-error');
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

    usernameGroup.classList.remove('has-error');
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
    
    passwordGroup.classList.remove('has-error');
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

    confirmPassGroup.classList.remove('has-error');
    return true;
}

function validatePhoneNumber() {
    clearErrors(phoneInput);
    const phoneGroup = phoneInput.closest('.input-group');

    if (phoneInput.value && phoneInput.value.length !== 10) {
        phoneGroup.appendChild(createErrorMessage('✖ Enter a valid 10-digit phone number'));
        phoneGroup.classList.add('has-error');
        return false;
    }

    phoneGroup.classList.remove('has-error');
    return true;
}

// Add input validation for additional fields

document.getElementById('phone-number').addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
});

emailInput.addEventListener('blur', validateEmail);
usernameInput.addEventListener('blur', validateUsername);
passwordInput.addEventListener('blur', validatePassword);
confirmPassInput.addEventListener('blur', validateConfirmPassword);
phoneInput.addEventListener('blur', validatePhoneNumber);
