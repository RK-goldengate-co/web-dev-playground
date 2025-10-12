// Animation Utilities for Web Development
// JavaScript functions for creating smooth animations and interactions

const Animations = {
    // Scroll-triggered animations
    scrollAnimations: {
        /**
         * Initialize scroll animations for elements
         * @param {string} selector - CSS selector for animated elements
         * @param {Object} options - Animation options
         */
        init: (selector = '.animate-on-scroll', options = {}) => {
            const defaultOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
                animationClass: 'animate-fade-in-up',
                staggerDelay: 100
            };

            const config = { ...defaultOptions, ...options };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add(config.animationClass);
                        }, index * config.staggerDelay);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: config.threshold,
                rootMargin: config.rootMargin
            });

            const elements = Utils.DOM.selectAll(selector);
            elements.forEach(element => {
                element.classList.add('scroll-animate-element');
                observer.observe(element);
            });

            return observer;
        },

        /**
         * Animate elements on scroll with different effects
         * @param {string} selector - CSS selector
         * @param {string} effect - Animation effect name
         */
        animate: (selector, effect = 'fadeInUp') => {
            const effects = {
                fadeInUp: 'animate-fade-in-up',
                fadeInDown: 'animate-fade-in-down',
                fadeInLeft: 'animate-fade-in-left',
                fadeInRight: 'animate-fade-in-right',
                slideInUp: 'animate-slide-in-up',
                slideInDown: 'animate-slide-in-down',
                scaleIn: 'animate-scale-in',
                bounceIn: 'animate-bounce-in'
            };

            return Animations.scrollAnimations.init(selector, {
                animationClass: effects[effect] || effects.fadeInUp
            });
        }
    },

    // Parallax animations
    parallax: {
        /**
         * Initialize parallax effect for elements
         * @param {string} selector - CSS selector for parallax elements
         * @param {number} speed - Parallax speed multiplier
         */
        init: (selector = '.parallax', speed = 0.5) => {
            const elements = Utils.DOM.selectAll(selector);

            const handleScroll = Utils.throttle(() => {
                const scrolled = window.pageYOffset;
                elements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const elementTop = rect.top + scrolled;
                    const elementHeight = rect.height;
                    const windowHeight = window.innerHeight;

                    if (elementTop < scrolled + windowHeight && elementTop + elementHeight > scrolled) {
                        const yPos = -(scrolled - elementTop) * speed;
                        element.style.transform = `translateY(${yPos}px)`;
                    }
                });
            }, 16);

            window.addEventListener('scroll', handleScroll);

            return {
                destroy: () => window.removeEventListener('scroll', handleScroll)
            };
        }
    },

    // Counter animations
    counters: {
        /**
         * Animate number counters
         * @param {string} selector - CSS selector for counter elements
         * @param {Object} options - Counter options
         */
        animate: (selector = '.counter', options = {}) => {
            const defaultOptions = {
                duration: 2000,
                separator: ',',
                suffix: '',
                prefix: ''
            };

            const config = { ...defaultOptions, ...options };

            const counters = Utils.DOM.selectAll(selector);
            let hasAnimated = false;

            const animateCounter = () => {
                if (hasAnimated) return;
                hasAnimated = true;

                counters.forEach(counter => {
                    const target = parseInt(counter.getAttribute('data-target') || counter.innerText);
                    const increment = target / (config.duration / 16);
                    let current = 0;

                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }

                        const formattedNumber = Math.floor(current).toLocaleString();
                        counter.innerText = config.prefix + formattedNumber + config.suffix;
                    }, 16);
                });
            };

            // Trigger animation on scroll
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter();
                        observer.disconnect();
                    }
                });
            });

            counters.forEach(counter => observer.observe(counter));

            return {
                restart: animateCounter,
                destroy: () => observer.disconnect()
            };
        }
    },

    // Loading animations
    loading: {
        /**
         * Show loading spinner
         * @param {Element} container - Container element
         * @param {string} text - Loading text
         */
        show: (container, text = 'Loading...') => {
            const loadingHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">${text}</p>
                </div>
            `;

            container.innerHTML = loadingHTML;
            container.classList.add('loading');
        },

        /**
         * Hide loading spinner
         * @param {Element} container - Container element
         */
        hide: (container) => {
            container.classList.remove('loading');
            const loadingContainer = container.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.remove();
            }
        }
    },

    // Modal animations
    modals: {
        /**
         * Animate modal opening
         * @param {Element} modal - Modal element
         */
        open: (modal) => {
            modal.classList.add('show');
            document.body.classList.add('modal-open');

            // Focus management for accessibility
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        },

        /**
         * Animate modal closing
         * @param {Element} modal - Modal element
         */
        close: (modal) => {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');

            // Return focus to trigger element
            const trigger = document.querySelector('[data-modal-target="' + modal.id + '"]');
            if (trigger) {
                trigger.focus();
            }
        },

        /**
         * Initialize modal functionality
         * @param {string} triggerSelector - Modal trigger selector
         * @param {string} modalSelector - Modal selector
         */
        init: (triggerSelector = '[data-modal-target]', modalSelector = '.modal') => {
            const triggers = Utils.DOM.selectAll(triggerSelector);
            const modals = Utils.DOM.selectAll(modalSelector);

            triggers.forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = trigger.getAttribute('data-modal-target');
                    const modal = document.getElementById(targetId);
                    if (modal) {
                        Animations.modals.open(modal);
                    }
                });
            });

            // Close modal functionality
            modals.forEach(modal => {
                const closeBtn = modal.querySelector('.modal-close, .modal-cancel');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        Animations.modals.close(modal);
                    });
                }

                // Close on backdrop click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        Animations.modals.close(modal);
                    }
                });

                // Close on Escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && modal.classList.contains('show')) {
                        Animations.modals.close(modal);
                    }
                });
            });
        }
    },

    // Smooth scroll animations
    smoothScroll: {
        /**
         * Initialize smooth scrolling for anchor links
         * @param {string} selector - Anchor link selector
         */
        init: (selector = 'a[href^="#"]') => {
            const links = Utils.DOM.selectAll(selector);

            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href');
                    const targetElement = document.querySelector(targetId);

                    if (targetElement) {
                        const headerOffset = 80; // Adjust based on fixed header height
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }
    },

    // Typewriter effect
    typewriter: {
        /**
         * Create typewriter effect
         * @param {Element} element - Target element
         * @param {string} text - Text to type
         * @param {number} speed - Typing speed in milliseconds
         */
        animate: (element, text, speed = 100) => {
            let i = 0;
            element.innerHTML = '';

            const type = () => {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                }
            };

            type();
        },

        /**
         * Initialize typewriter for multiple elements
         * @param {string} selector - CSS selector
         * @param {Object} options - Options object
         */
        init: (selector = '.typewriter', options = {}) => {
            const elements = Utils.DOM.selectAll(selector);
            const defaultOptions = {
                speed: 100,
                delay: 1000
            };

            const config = { ...defaultOptions, ...options };

            elements.forEach((element, index) => {
                const text = element.getAttribute('data-text') || element.textContent;
                element.textContent = '';

                setTimeout(() => {
                    Animations.typewriter.animate(element, text, config.speed);
                }, index * config.delay);
            });
        }
    },

    // Particle system
    particles: {
        /**
         * Create particle animation
         * @param {Element} container - Container element
         * @param {Object} options - Particle options
         */
        create: (container, options = {}) => {
            const defaultOptions = {
                count: 50,
                size: 2,
                speed: 1,
                color: '#007bff',
                opacity: 0.5
            };

            const config = { ...defaultOptions, ...options };
            const particles = [];

            // Create particles
            for (let i = 0; i < config.count; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.cssText = `
                    position: absolute;
                    width: ${config.size}px;
                    height: ${config.size}px;
                    background-color: ${config.color};
                    opacity: ${config.opacity};
                    border-radius: 50%;
                    pointer-events: none;
                `;

                // Random position
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';

                container.appendChild(particle);
                particles.push(particle);
            }

            // Animate particles
            const animate = () => {
                particles.forEach(particle => {
                    const currentY = parseFloat(particle.style.top) || Math.random() * 100;
                    const newY = currentY - config.speed;

                    if (newY < -10) {
                        particle.style.top = '110%';
                    } else {
                        particle.style.top = newY + '%';
                    }
                });

                requestAnimationFrame(animate);
            };

            animate();

            return {
                destroy: () => {
                    particles.forEach(particle => particle.remove());
                }
            };
        }
    },

    // Hover effects
    hoverEffects: {
        /**
         * Initialize hover effects for elements
         * @param {string} selector - CSS selector
         * @param {string} effect - Effect type
         */
        init: (selector = '.hover-effect', effect = 'lift') => {
            const elements = Utils.DOM.selectAll(selector);

            elements.forEach(element => {
                element.classList.add(`hover-${effect}`);

                if (effect === 'glow') {
                    element.addEventListener('mouseenter', () => {
                        element.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.5)';
                    });

                    element.addEventListener('mouseleave', () => {
                        element.style.boxShadow = '';
                    });
                }
            });
        }
    },

    // Text animations
    textAnimations: {
        /**
         * Animate text characters
         * @param {Element} element - Text element
         * @param {string} animation - Animation type
         */
        animate: (element, animation = 'fadeIn') => {
            const text = element.textContent;
            element.innerHTML = '';

            text.split('').forEach((char, index) => {
                const span = document.createElement('span');
                span.textContent = char;
                span.style.display = 'inline-block';
                span.classList.add(`animate-${animation}`);
                span.style.animationDelay = `${index * 0.1}s`;
                element.appendChild(span);
            });
        },

        /**
         * Initialize text animations
         * @param {string} selector - CSS selector
         */
        init: (selector = '.text-animate') => {
            const elements = Utils.DOM.selectAll(selector);
            elements.forEach(element => {
                Animations.textAnimations.animate(element);
            });
        }
    },

    // Progress bar animations
    progressBars: {
        /**
         * Animate progress bars
         * @param {string} selector - CSS selector
         */
        animate: (selector = '.progress-bar') => {
            const progressBars = Utils.DOM.selectAll(selector);
            let hasAnimated = false;

            const animate = () => {
                if (hasAnimated) return;
                hasAnimated = true;

                progressBars.forEach(bar => {
                    const targetWidth = bar.getAttribute('data-width') || '100%';
                    const duration = parseInt(bar.getAttribute('data-duration')) || 1000;

                    bar.style.width = '0%';
                    bar.style.transition = `width ${duration}ms ease-out`;

                    setTimeout(() => {
                        bar.style.width = targetWidth;
                    }, 100);
                });
            };

            // Trigger on scroll
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animate();
                        observer.disconnect();
                    }
                });
            });

            progressBars.forEach(bar => observer.observe(bar));
        }
    },

    // Stagger animations for lists
    stagger: {
        /**
         * Animate list items with stagger effect
         * @param {string} selector - CSS selector for list items
         * @param {number} delay - Delay between items in ms
         */
        animate: (selector = '.stagger-item', delay = 100) => {
            const items = Utils.DOM.selectAll(selector);

            items.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * delay);
            });
        }
    },

    // Page transitions
    pageTransitions: {
        /**
         * Initialize page transition effects
         * @param {Object} options - Transition options
         */
        init: (options = {}) => {
            const defaultOptions = {
                transitionClass: 'page-transition',
                duration: 500
            };

            const config = { ...defaultOptions, ...options };

            // Add transition overlay to body
            const overlay = document.createElement('div');
            overlay.className = config.transitionClass;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #007bff;
                transform: translateX(-100%);
                transition: transform ${config.duration}ms ease-in-out;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(overlay);

            // Handle link clicks
            Utils.DOM.on('a[href]:not([target="_blank"])', 'click', (e) => {
                const href = e.target.href;
                if (href && href !== window.location.href) {
                    e.preventDefault();
                    overlay.style.transform = 'translateX(0)';

                    setTimeout(() => {
                        window.location.href = href;
                    }, config.duration);
                }
            });

            return {
                destroy: () => overlay.remove()
            };
        }
    }
};

// Initialize common animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize smooth scrolling
    Animations.smoothScroll.init();

    // Initialize scroll animations
    Animations.scrollAnimations.init();

    // Initialize modal functionality
    Animations.modals.init();

    // Initialize hover effects
    Animations.hoverEffects.init();

    // Initialize progress bars
    Animations.progressBars.animate();

    // Initialize text animations
    Animations.textAnimations.init();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Animations;
}

// Make available globally
window.Animations = Animations;
