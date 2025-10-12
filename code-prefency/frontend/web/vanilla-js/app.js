// Modern JavaScript for Web Development
class WebApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Demo button functionality
        const demoBtn = document.getElementById('demo-btn');
        if (demoBtn) {
            demoBtn.addEventListener('click', this.handleDemoClick.bind(this));
        }

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Responsive navigation
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

        // Intersection Observer for animations
        this.setupScrollAnimations();
    }

    handleDemoClick(event) {
        event.preventDefault();

        // Create ripple effect
        this.createRippleEffect(event.target);

        // Show notification
        this.showNotification('Hello from JavaScript!', 'success');

        // Update UI
        this.updateDemoContent();
    }

    createRippleEffect(element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        ripple.classList.add('ripple');

        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);

        // Manual close
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => notification.remove());
    }

    updateDemoContent() {
        const hero = document.querySelector('.hero h2');
        if (hero) {
            const originalText = hero.textContent;
            hero.textContent = 'JavaScript is working! 🎉';

            setTimeout(() => {
                hero.textContent = originalText;
            }, 2000);
        }
    }

    handleKeyDown(event) {
        // ESC key to close notifications
        if (event.key === 'Escape') {
            const notifications = document.querySelectorAll('.notification');
            notifications.forEach(notification => notification.remove());
        }

        // Space bar for demo
        if (event.key === ' ' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
            event.preventDefault();
            const demoBtn = document.getElementById('demo-btn');
            if (demoBtn) {
                demoBtn.click();
            }
        }
    }

    handleResize() {
        // Responsive adjustments
        const features = document.querySelector('.features');
        if (features && window.innerWidth <= 768) {
            features.classList.add('mobile-layout');
        } else if (features) {
            features.classList.remove('mobile-layout');
        }
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            observer.observe(card);
        });
    }

    loadData() {
        // Simulate API call
        setTimeout(() => {
            this.displayLoadedData();
        }, 1000);
    }

    displayLoadedData() {
        const featuresSection = document.querySelector('.features');
        if (featuresSection) {
            const newCard = document.createElement('div');
            newCard.className = 'feature-card animate-fade-in';
            newCard.innerHTML = `
                <h3>Dynamic Content</h3>
                <p>Loaded from JavaScript - Modern web development!</p>
            `;

            featuresSection.appendChild(newCard);
        }
    }

    setupAnimations() {
        // Add CSS for ripple effect
        const style = document.createElement('style');
        style.textContent = `
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                pointer-events: none;
            }

            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007bff;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideInRight 0.3s ease;
            }

            .notification-success { background: #28a745; }
            .notification-error { background: #dc3545; }
            .notification-warning { background: #ffc107; color: #212529; }

            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .mobile-layout {
                grid-template-columns: 1fr !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Utility function for debouncing
    debounce(func, wait) {
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
}

// Initialize the web app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebApp();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebApp;
}
