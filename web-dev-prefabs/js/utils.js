// Web Development Utilities
// A collection of useful JavaScript functions for web development

const Utils = {
    // DOM Utilities
    DOM: {
        /**
         * Select a single element
         * @param {string} selector - CSS selector
         * @param {Element} parent - Parent element (default: document)
         * @returns {Element|null}
         */
        select: (selector, parent = document) => {
            return parent.querySelector(selector);
        },

        /**
         * Select multiple elements
         * @param {string} selector - CSS selector
         * @param {Element} parent - Parent element (default: document)
         * @returns {NodeList}
         */
        selectAll: (selector, parent = document) => {
            return parent.querySelectorAll(selector);
        },

        /**
         * Create an element with attributes and content
         * @param {string} tag - HTML tag name
         * @param {Object} attributes - Element attributes
         * @param {string} content - Inner HTML content
         * @returns {Element}
         */
        create: (tag, attributes = {}, content = '') => {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
            if (content) element.innerHTML = content;
            return element;
        },

        /**
         * Add event listener to element(s)
         * @param {string|Element|NodeList} selector - CSS selector or element(s)
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object} options - Event options
         */
        on: (selector, event, handler, options = {}) => {
            const elements = typeof selector === 'string'
                ? Utils.DOM.selectAll(selector)
                : selector;

            if (elements instanceof NodeList || elements instanceof HTMLCollection) {
                elements.forEach(element => {
                    element.addEventListener(event, handler, options);
                });
            } else if (elements instanceof Element) {
                elements.addEventListener(event, handler, options);
            }
        },

        /**
         * Remove element(s) from DOM
         * @param {string|Element|NodeList} selector - CSS selector or element(s)
         */
        remove: (selector) => {
            const elements = typeof selector === 'string'
                ? Utils.DOM.selectAll(selector)
                : selector;

            if (elements instanceof NodeList || elements instanceof HTMLCollection) {
                elements.forEach(element => element.remove());
            } else if (elements instanceof Element) {
                elements.remove();
            }
        },

        /**
         * Check if element has a class
         * @param {Element} element - DOM element
         * @param {string} className - Class name to check
         * @returns {boolean}
         */
        hasClass: (element, className) => {
            return element.classList.contains(className);
        },

        /**
         * Add class to element(s)
         * @param {string|Element|NodeList} selector - CSS selector or element(s)
         * @param {string} className - Class name to add
         */
        addClass: (selector, className) => {
            const elements = typeof selector === 'string'
                ? Utils.DOM.selectAll(selector)
                : selector;

            if (elements instanceof NodeList || elements instanceof HTMLCollection) {
                elements.forEach(element => element.classList.add(className));
            } else if (elements instanceof Element) {
                elements.classList.add(className);
            }
        },

        /**
         * Remove class from element(s)
         * @param {string|Element|NodeList} selector - CSS selector or element(s)
         * @param {string} className - Class name to remove
         */
        removeClass: (selector, className) => {
            const elements = typeof selector === 'string'
                ? Utils.DOM.selectAll(selector)
                : selector;

            if (elements instanceof NodeList || elements instanceof HTMLCollection) {
                elements.forEach(element => element.classList.remove(className));
            } else if (elements instanceof Element) {
                elements.classList.remove(className);
            }
        },

        /**
         * Toggle class on element(s)
         * @param {string|Element|NodeList} selector - CSS selector or element(s)
         * @param {string} className - Class name to toggle
         */
        toggleClass: (selector, className) => {
            const elements = typeof selector === 'string'
                ? Utils.DOM.selectAll(selector)
                : selector;

            if (elements instanceof NodeList || elements instanceof HTMLCollection) {
                elements.forEach(element => element.classList.toggle(className));
            } else if (elements instanceof Element) {
                elements.classList.toggle(className);
            }
        }
    },

    // AJAX Utilities
    AJAX: {
        /**
         * Make a GET request
         * @param {string} url - Request URL
         * @param {Object} headers - Request headers
         * @returns {Promise}
         */
        get: (url, headers = {}) => {
            return fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            }).then(response => response.json());
        },

        /**
         * Make a POST request
         * @param {string} url - Request URL
         * @param {Object} data - Data to send
         * @param {Object} headers - Request headers
         * @returns {Promise}
         */
        post: (url, data = {}, headers = {}) => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(data)
            }).then(response => response.json());
        },

        /**
         * Make a PUT request
         * @param {string} url - Request URL
         * @param {Object} data - Data to send
         * @param {Object} headers - Request headers
         * @returns {Promise}
         */
        put: (url, data = {}, headers = {}) => {
            return fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(data)
            }).then(response => response.json());
        },

        /**
         * Make a DELETE request
         * @param {string} url - Request URL
         * @param {Object} headers - Request headers
         * @returns {Promise}
         */
        delete: (url, headers = {}) => {
            return fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            }).then(response => response.json());
        }
    },

    // Storage Utilities
    Storage: {
        /**
         * Set item in localStorage
         * @param {string} key - Storage key
         * @param {any} value - Value to store
         */
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('Storage error:', error);
            }
        },

        /**
         * Get item from localStorage
         * @param {string} key - Storage key
         * @param {any} defaultValue - Default value if key doesn't exist
         * @returns {any}
         */
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage error:', error);
                return defaultValue;
            }
        },

        /**
         * Remove item from localStorage
         * @param {string} key - Storage key
         */
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Storage error:', error);
            }
        },

        /**
         * Clear all localStorage
         */
        clear: () => {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('Storage error:', error);
            }
        }
    },

    // Cookie Utilities
    Cookie: {
        /**
         * Set a cookie
         * @param {string} name - Cookie name
         * @param {string} value - Cookie value
         * @param {number} days - Days until expiration
         */
        set: (name, value, days = 30) => {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
        },

        /**
         * Get a cookie value
         * @param {string} name - Cookie name
         * @returns {string|null}
         */
        get: (name) => {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },

        /**
         * Delete a cookie
         * @param {string} name - Cookie name
         */
        delete: (name) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
    },

    // URL Utilities
    URL: {
        /**
         * Get URL parameters
         * @returns {Object}
         */
        getParams: () => {
            const params = {};
            const urlParams = new URLSearchParams(window.location.search);
            for (const [key, value] of urlParams) {
                params[key] = value;
            }
            return params;
        },

        /**
         * Get a specific URL parameter
         * @param {string} name - Parameter name
         * @returns {string|null}
         */
        getParam: (name) => {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },

        /**
         * Update URL parameter
         * @param {string} key - Parameter key
         * @param {string} value - Parameter value
         */
        updateParam: (key, value) => {
            const url = new URL(window.location);
            url.searchParams.set(key, value);
            window.history.pushState({}, '', url);
        }
    },

    // Validation Utilities
    Validation: {
        /**
         * Validate email address
         * @param {string} email - Email to validate
         * @returns {boolean}
         */
        isEmail: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        /**
         * Validate phone number
         * @param {string} phone - Phone number to validate
         * @returns {boolean}
         */
        isPhone: (phone) => {
            const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
            return phoneRegex.test(phone);
        },

        /**
         * Validate URL
         * @param {string} url - URL to validate
         * @returns {boolean}
         */
        isURL: (url) => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },

        /**
         * Check if value is empty
         * @param {any} value - Value to check
         * @returns {boolean}
         */
        isEmpty: (value) => {
            return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
        }
    },

    // Animation Utilities
    Animation: {
        /**
         * Animate element with CSS classes
         * @param {Element} element - Element to animate
         * @param {string} animationClass - Animation class name
         * @param {number} duration - Animation duration in ms
         */
        animate: (element, animationClass, duration = 1000) => {
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
            }, duration);
        },

        /**
         * Smooth scroll to element
         * @param {Element|string} target - Target element or selector
         */
        scrollTo: (target) => {
            const element = typeof target === 'string'
                ? Utils.DOM.select(target)
                : target;

            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        },

        /**
         * Intersection Observer for scroll animations
         * @param {string} selector - CSS selector
         * @param {Function} callback - Callback function
         * @param {Object} options - Observer options
         */
        observeScroll: (selector, callback, options = {}) => {
            const defaultOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        callback(entry.target);
                    }
                });
            }, { ...defaultOptions, ...options });

            const elements = Utils.DOM.selectAll(selector);
            elements.forEach(element => observer.observe(element));

            return observer;
        }
    },

    // Utility Functions
    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function}
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function}
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Generate random ID
     * @param {number} length - ID length
     * @returns {string}
     */
    generateId: (length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object}
     */
    clone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Format number with commas
     * @param {number} number - Number to format
     * @returns {string}
     */
    formatNumber: (number) => {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string}
     */
    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} length - Maximum length
     * @param {string} suffix - Suffix to add
     * @returns {string}
     */
    truncate: (text, length = 100, suffix = '...') => {
        if (text.length <= length) return text;
        return text.slice(0, length - suffix.length) + suffix;
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

// Make available globally
window.Utils = Utils;
