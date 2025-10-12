// Form Validation Utilities
// JavaScript functions for validating form inputs

const FormValidation = {
    // Validation rules
    rules: {
        required: {
            test: (value) => value.trim().length > 0,
            message: 'This field is required'
        },
        email: {
            test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Please enter a valid email address'
        },
        phone: {
            test: (value) => /^\+?[\d\s\-\(\)]{10,}$/.test(value),
            message: 'Please enter a valid phone number'
        },
        minLength: (min) => ({
            test: (value) => value.length >= min,
            message: `Must be at least ${min} characters long`
        }),
        maxLength: (max) => ({
            test: (value) => value.length <= max,
            message: `Must be no more than ${max} characters long`
        }),
        pattern: (regex, message) => ({
            test: (value) => regex.test(value),
            message: message
        }),
        url: {
            test: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'Please enter a valid URL'
        },
        number: {
            test: (value) => !isNaN(value) && !isNaN(parseFloat(value)),
            message: 'Please enter a valid number'
        },
        min: (min) => ({
            test: (value) => parseFloat(value) >= min,
            message: `Must be at least ${min}`
        }),
        max: (max) => ({
            test: (value) => parseFloat(value) <= max,
            message: `Must be no more than ${max}`
        }),
        password: {
            test: (value) => {
                const hasMinLength = value.length >= 8;
                const hasUpperCase = /[A-Z]/.test(value);
                const hasLowerCase = /[a-z]/.test(value);
                const hasNumbers = /\d/.test(value);
                const hasNonalphas = /\W/.test(value);
                return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
            },
            message: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character'
        },
        confirmPassword: (originalPassword) => ({
            test: (value) => value === originalPassword,
            message: 'Passwords do not match'
        })
    },

    // Validate single field
    validateField: (field, rules) => {
        const value = field.value;
        const fieldRules = Array.isArray(rules) ? rules : [rules];

        for (const rule of fieldRules) {
            let ruleConfig;

            if (typeof rule === 'string') {
                ruleConfig = FormValidation.rules[rule];
            } else if (typeof rule === 'function') {
                ruleConfig = { test: rule, message: 'Invalid value' };
            } else {
                ruleConfig = rule;
            }

            if (ruleConfig && !ruleConfig.test(value)) {
                return {
                    isValid: false,
                    message: ruleConfig.message
                };
            }
        }

        return { isValid: true };
    },

    // Validate entire form
    validateForm: (formSelector) => {
        const form = typeof formSelector === 'string'
            ? document.querySelector(formSelector)
            : formSelector;

        if (!form) return { isValid: false, errors: ['Form not found'] };

        const errors = {};
        let isValid = true;

        // Get fields with validation rules
        const fields = form.querySelectorAll('[data-validate]');
        fields.forEach(field => {
            const rules = field.getAttribute('data-validate').split(',').map(rule => rule.trim());
            const result = FormValidation.validateField(field, rules);

            if (!result.isValid) {
                errors[field.name] = result.message;
                isValid = false;
                FormValidation.showFieldError(field, result.message);
            } else {
                FormValidation.clearFieldError(field);
            }
        });

        return { isValid, errors };
    },

    // Show field error
    showFieldError: (field, message) => {
        // Remove existing error
        FormValidation.clearFieldError(field);

        // Add error class
        field.classList.add('error');

        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;

        // Insert after field
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    },

    // Clear field error
    clearFieldError: (field) => {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    // Initialize form validation
    init: (formSelector = 'form') => {
        const forms = typeof formSelector === 'string'
            ? document.querySelectorAll(formSelector)
            : [formSelector];

        forms.forEach(form => {
            // Real-time validation
            form.addEventListener('input', Utils.debounce((e) => {
                const field = e.target;
                if (field.hasAttribute('data-validate')) {
                    const rules = field.getAttribute('data-validate').split(',').map(rule => rule.trim());
                    const result = FormValidation.validateField(field, rules);

                    if (result.isValid) {
                        FormValidation.clearFieldError(field);
                    }
                }
            }, 300));

            // Form submission validation
            form.addEventListener('submit', (e) => {
                const result = FormValidation.validateForm(form);

                if (!result.isValid) {
                    e.preventDefault();

                    // Focus first error field
                    const firstErrorField = form.querySelector('.error');
                    if (firstErrorField) {
                        firstErrorField.focus();
                    }

                    // Show form error message
                    FormValidation.showFormError(form, 'Please correct the errors below and try again.');
                } else {
                    FormValidation.clearFormError(form);
                }
            });
        });
    },

    // Show form-level error
    showFormError: (form, message) => {
        FormValidation.clearFormError(form);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;

        form.insertBefore(errorDiv, form.firstChild);
    },

    // Clear form-level error
    clearFormError: (form) => {
        const errorDiv = form.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    // Password strength checker
    checkPasswordStrength: (password) => {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            special: /\W/.test(password)
        };

        Object.values(checks).forEach(check => {
            if (check) strength++;
        });

        return {
            score: strength,
            checks: checks,
            level: strength <= 2 ? 'weak' : strength <= 4 ? 'medium' : 'strong'
        };
    },

    // Initialize password strength indicator
    initPasswordStrength: (passwordSelector = 'input[type="password"]') => {
        const passwordFields = document.querySelectorAll(passwordSelector);

        passwordFields.forEach(field => {
            if (field.hasAttribute('data-strength-indicator')) {
                const indicator = document.querySelector(field.getAttribute('data-strength-indicator'));

                field.addEventListener('input', Utils.debounce(() => {
                    const strength = FormValidation.checkPasswordStrength(field.value);

                    if (indicator) {
                        indicator.className = `password-strength password-strength-${strength.level}`;
                        indicator.setAttribute('data-level', strength.level);

                        // Update visual indicators
                        const checks = indicator.querySelectorAll('.strength-check');
                        checks.forEach((check, index) => {
                            const checkName = ['length', 'uppercase', 'lowercase', 'numbers', 'special'][index];
                            check.classList.toggle('valid', strength.checks[checkName]);
                        });
                    }
                }, 300));
            }
        });
    },

    // File upload validation
    validateFile: (file, options = {}) => {
        const defaultOptions = {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            maxFiles: 5
        };

        const config = { ...defaultOptions, ...options };
        const errors = [];

        // Check file size
        if (file.size > config.maxSize) {
            errors.push(`File size must be less than ${Math.round(config.maxSize / 1024 / 1024)}MB`);
        }

        // Check file type
        if (!config.allowedTypes.includes(file.type)) {
            errors.push(`File type not allowed. Allowed types: ${config.allowedTypes.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // Initialize file upload validation
    initFileValidation: (inputSelector = 'input[type="file"]') => {
        const fileInputs = document.querySelectorAll(inputSelector);

        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                const maxFiles = parseInt(input.getAttribute('data-max-files')) || 5;
                const errors = [];

                // Check number of files
                if (files.length > maxFiles) {
                    errors.push(`Maximum ${maxFiles} files allowed`);
                }

                // Validate each file
                files.forEach((file, index) => {
                    const validation = FormValidation.validateFile(file, {
                        maxSize: parseInt(input.getAttribute('data-max-size')) || 5 * 1024 * 1024,
                        allowedTypes: input.getAttribute('data-allowed-types')?.split(',') || ['image/jpeg', 'image/png']
                    });

                    if (!validation.isValid) {
                        errors.push(`File ${index + 1}: ${validation.errors.join(', ')}`);
                    }
                });

                // Show errors
                if (errors.length > 0) {
                    FormValidation.showFieldError(input, errors.join('; '));
                } else {
                    FormValidation.clearFieldError(input);
                }
            });
        });
    },

    // Credit card validation
    validateCreditCard: (number) => {
        // Remove spaces and dashes
        const cleanNumber = number.replace(/[\s-]/g, '');

        // Check if all digits
        if (!/^\d+$/.test(cleanNumber)) {
            return { isValid: false, message: 'Credit card number must contain only digits' };
        }

        // Luhn algorithm
        let sum = 0;
        let shouldDouble = false;

        for (let i = cleanNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cleanNumber.charAt(i));

            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            shouldDouble = !shouldDouble;
        }

        const isValid = sum % 10 === 0;
        const type = FormValidation.getCardType(cleanNumber);

        return {
            isValid,
            type,
            message: isValid ? 'Valid credit card number' : 'Invalid credit card number'
        };
    },

    // Get credit card type
    getCardType: (number) => {
        const patterns = {
            visa: /^4/,
            mastercard: /^5[1-5]|^2[2-7]/,
            amex: /^3[47]/,
            discover: /^6(?:011|5)/,
            diners: /^3[068]/,
            jcb: /^35/
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(number)) {
                return type;
            }
        }

        return 'unknown';
    },

    // Date validation
    validateDate: (dateString, format = 'YYYY-MM-DD') => {
        if (!dateString) return { isValid: false, message: 'Date is required' };

        const date = new Date(dateString);
        const isValidDate = !isNaN(date.getTime());

        if (!isValidDate) {
            return { isValid: false, message: 'Invalid date format' };
        }

        // Check if date is in the past (for birth dates, etc.)
        if (new Date() < date) {
            return { isValid: false, message: 'Date cannot be in the future' };
        }

        return { isValid: true };
    },

    // Sanitize input
    sanitize: (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    // Format phone number
    formatPhone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return phone;
    },

    // Format credit card number
    formatCreditCard: (number) => {
        return number.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    }
};

// Initialize form validation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    FormValidation.init();
    FormValidation.initPasswordStrength();
    FormValidation.initFileValidation();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidation;
}

// Make available globally
window.FormValidation = FormValidation;
