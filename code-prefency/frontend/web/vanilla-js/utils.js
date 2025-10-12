// Advanced JavaScript Utilities Library
// Modern ES6+ utilities for web development

class JSUtils {
    // Array utilities
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    static unique(array) {
        return [...new Set(array)];
    }

    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = key(item);
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    static sortBy(array, key) {
        return array.sort((a, b) => {
            const aVal = key(a);
            const bVal = key(b);
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        });
    }

    // String utilities
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    static kebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    static truncate(str, length, suffix = '...') {
        return str.length > length ? str.slice(0, length) + suffix : str;
    }

    // Object utilities
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));

        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }

    static pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (key in obj) result[key] = obj[key];
        });
        return result;
    }

    static omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }

    // Date utilities
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    static relativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ngày trước`;
        if (hours > 0) return `${hours} giờ trước`;
        if (minutes > 0) return `${minutes} phút trước`;
        return `${seconds} giây trước`;
    }

    // DOM utilities
    static $(selector) {
        return document.querySelector(selector);
    }

    static $$(selector) {
        return document.querySelectorAll(selector);
    }

    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);

        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') element.className = value;
            else if (key === 'innerHTML') element.innerHTML = value;
            else element.setAttribute(key, value);
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    // Event utilities
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Validation utilities
    static isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isPhone(phone) {
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    static isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Storage utilities
    static setStorage(key, value, type = 'local') {
        const storage = type === 'local' ? localStorage : sessionStorage;
        try {
            storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    static getStorage(key, type = 'local') {
        const storage = type === 'local' ? localStorage : sessionStorage;
        try {
            const item = storage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    }

    static removeStorage(key, type = 'local') {
        const storage = type === 'local' ? localStorage : sessionStorage;
        storage.removeItem(key);
    }

    // Network utilities
    static async fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    static async apiCall(url, method = 'GET', data = null, headers = {}) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await this.fetchWithTimeout(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Animation utilities
    static animate(element, keyframes, options = {}) {
        const defaultOptions = {
            duration: 300,
            easing: 'ease-in-out',
            fill: 'forwards'
        };

        return element.animate(keyframes, { ...defaultOptions, ...options });
    }

    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';

        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    static fadeOut(element, duration = 300) {
        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration }).then(() => {
            element.style.display = 'none';
        });
    }

    static slideDown(element, duration = 300) {
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.display = 'block';

        return this.animate(element, [
            { height: '0' },
            { height: element.scrollHeight + 'px' }
        ], { duration }).then(() => {
            element.style.height = 'auto';
        });
    }

    static slideUp(element, duration = 300) {
        element.style.height = element.offsetHeight + 'px';
        element.style.overflow = 'hidden';

        return this.animate(element, [
            { height: element.offsetHeight + 'px' },
            { height: '0' }
        ], { duration }).then(() => {
            element.style.display = 'none';
        });
    }

    // Color utilities
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static lighten(color, percent) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;

        const { r, g, b } = rgb;
        const amount = percent / 100;

        return this.rgbToHex(
            Math.min(255, r + (255 - r) * amount),
            Math.min(255, g + (255 - g) * amount),
            Math.min(255, b + (255 - b) * amount)
        );
    }

    static darken(color, percent) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;

        const { r, g, b } = rgb;
        const amount = percent / 100;

        return this.rgbToHex(
            Math.max(0, r - r * amount),
            Math.max(0, g - g * amount),
            Math.max(0, b - b * amount)
        );
    }

    // Math utilities
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    // Performance utilities
    static measureTime(fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        return { result, duration: end - start };
    }

    static async measureAsyncTime(fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        return { result, duration: end - start };
    }

    // URL utilities
    static getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    static setQueryParams(params) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        });
        window.history.replaceState({}, '', url);
    }

    // Cookie utilities
    static setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    static getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    static deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    // Device detection
    static getDeviceInfo() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;

        return {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isTablet: /iPad|Android(?=.*\bMobile\b)|Tablet|PlayBook/i.test(userAgent),
            isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)),
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isAndroid: /Android/i.test(userAgent),
            platform,
            userAgent
        };
    }

    // Browser detection
    static getBrowserInfo() {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Chrome')) return { name: 'Chrome', version: this.getVersion(userAgent, 'Chrome') };
        if (userAgent.includes('Firefox')) return { name: 'Firefox', version: this.getVersion(userAgent, 'Firefox') };
        if (userAgent.includes('Safari')) return { name: 'Safari', version: this.getVersion(userAgent, 'Safari') };
        if (userAgent.includes('Edge')) return { name: 'Edge', version: this.getVersion(userAgent, 'Edge') };

        return { name: 'Unknown', version: 'Unknown' };
    }

    static getVersion(userAgent, browser) {
        const regex = new RegExp(`${browser}/([\\d.]+)`);
        const match = userAgent.match(regex);
        return match ? match[1] : 'Unknown';
    }

    // Theme utilities
    static setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.setStorage('theme', theme);
    }

    static getTheme() {
        return document.documentElement.getAttribute('data-theme') ||
               this.getStorage('theme') ||
               (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    static toggleTheme() {
        const currentTheme = this.getTheme();
        this.setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    // Clipboard utilities
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            return false;
        }
    }

    // File utilities
    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    // Geolocation utilities
    static async getCurrentPosition(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }

    // Notification utilities
    static async showNotification(title, options = {}) {
        if (!('Notification' in window)) {
            throw new Error('This browser does not support notifications');
        }

        if (Notification.permission === 'granted') {
            return new Notification(title, options);
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                return new Notification(title, options);
            }
        }

        throw new Error('Notification permission denied');
    }

    // Internationalization utilities
    static formatNumber(number, locale = 'vi-VN') {
        return new Intl.NumberFormat(locale).format(number);
    }

    static formatCurrency(amount, currency = 'VND', locale = 'vi-VN') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    static formatDate(date, locale = 'vi-VN', options = {}) {
        return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    }

    // Validation utilities
    static validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        const errors = [];

        inputs.forEach(input => {
            if (!input.value.trim()) {
                errors.push(`${input.labels[0]?.textContent || input.name} là bắt buộc`);
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Accessibility utilities
    static announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    static trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Error handling utilities
    static handleError(error, context = '') {
        console.error(`Error${context ? ` in ${context}` : ''}:`, error);

        // You can extend this to send errors to a logging service
        // this.logError(error, context);
    }

    static retry(fn, maxAttempts = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            const attempt = (n) => {
                fn()
                    .then(resolve)
                    .catch((error) => {
                        if (n < maxAttempts) {
                            setTimeout(() => attempt(n + 1), delay);
                        } else {
                            reject(error);
                        }
                    });
            };
            attempt(1);
        });
    }

    // Utility for creating custom events
    static dispatchCustomEvent(name, detail = {}) {
        const event = new CustomEvent(name, { detail });
        document.dispatchEvent(event);
        return event;
    }

    // Utility for creating elements with event listeners
    static createButton(text, onClick, className = '') {
        const button = this.createElement('button', {
            className,
            innerHTML: text
        });

        button.addEventListener('click', onClick);
        return button;
    }

    // Utility for creating modals
    static createModal(content, options = {}) {
        const modal = this.createElement('div', {
            className: 'modal-overlay'
        });

        const modalContent = this.createElement('div', {
            className: 'modal-content'
        });

        modalContent.appendChild(content);
        modal.appendChild(modalContent);

        // Close modal functionality
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);

        // Focus trap
        this.trapFocus(modalContent);

        return modal;
    }

    // Utility for infinite scroll
    static setupInfiniteScroll(callback, threshold = 100) {
        const handleScroll = this.throttle(() => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - threshold) {
                callback();
            }
        }, 100);

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }

    // Utility for lazy loading images
    static setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Utility for service worker registration
    static async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                return registration;
            } catch (error) {
                console.error('Service Worker registration failed:', error);
                throw error;
            }
        }
        throw new Error('Service Workers are not supported');
    }

    // Utility for web vitals measurement
    static measureWebVitals() {
        // This is a simplified version - you would typically use the web-vitals library
        const vitals = {};

        // Measure LCP
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Measure FID
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                vitals.fid = entry.processingStart - entry.startTime;
            });
        }).observe({ entryTypes: ['first-input'] });

        return vitals;
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSUtils;
} else if (typeof window !== 'undefined') {
    window.JSUtils = JSUtils;
}

// Usage examples:
// JSUtils.chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
// JSUtils.debounce(myFunction, 300)
// JSUtils.formatCurrency(1000000, 'VND') // "1.000.000 ₫"
// JSUtils.setTheme('dark')
// JSUtils.copyToClipboard('Hello World')
