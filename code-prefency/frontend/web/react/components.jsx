// React Component Library - Reusable UI Components
// Modern React with hooks and TypeScript support

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Button Component
export const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    onClick,
    className = '',
    ...props
}) => {
    const [ripples, setRipples] = useState([]);

    const handleClick = useCallback((e) => {
        if (disabled || loading) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const newRipple = {
            id: Date.now(),
            x,
            y,
            size
        };

        setRipples(prev => [...prev, newRipple]);

        setTimeout(() => {
            setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
        }, 600);

        onClick?.(e);
    }, [disabled, loading, onClick]);

    const baseClasses = 'btn';
    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger',
        warning: 'btn-warning',
        info: 'btn-info',
        light: 'btn-light',
        dark: 'btn-dark',
        link: 'btn-link'
    };

    const sizeClasses = {
        small: 'btn-sm',
        medium: 'btn-md',
        large: 'btn-lg'
    };

    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'btn-disabled',
        loading && 'btn-loading',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            onClick={handleClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <span className="btn-spinner">⟳</span>}
            <span className="btn-content">{children}</span>

            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="btn-ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size
                    }}
                />
            ))}
        </button>
    );
};

// Modal Component
export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    closeOnOverlay = true,
    showCloseButton = true,
    ...props
}) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (e) => {
        if (closeOnOverlay && e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const sizeClasses = {
        small: 'modal-sm',
        medium: 'modal-md',
        large: 'modal-lg',
        fullscreen: 'modal-fullscreen'
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div
                className={`modal ${sizeClasses[size]}`}
                ref={modalRef}
                {...props}
            >
                {(title || showCloseButton) && (
                    <div className="modal-header">
                        {title && <h2 className="modal-title">{title}</h2>}
                        {showCloseButton && (
                            <button className="modal-close" onClick={onClose}>
                                ×
                            </button>
                        )}
                    </div>
                )}

                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Card Component
export const Card = ({
    children,
    title,
    subtitle,
    image,
    actions,
    className = '',
    ...props
}) => {
    return (
        <div className={`card ${className}`} {...props}>
            {image && (
                <div className="card-image">
                    <img src={image} alt={title} />
                </div>
            )}

            <div className="card-content">
                {title && <h3 className="card-title">{title}</h3>}
                {subtitle && <p className="card-subtitle">{subtitle}</p>}
                <div className="card-body">
                    {children}
                </div>
            </div>

            {actions && (
                <div className="card-actions">
                    {actions}
                </div>
            )}
        </div>
    );
};

// Input Component
export const Input = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    success,
    disabled = false,
    required = false,
    className = '',
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const inputClasses = [
        'input',
        isFocused && 'input-focused',
        error && 'input-error',
        success && 'input-success',
        disabled && 'input-disabled',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className="input-group">
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}

            <div className="input-wrapper">
                <input
                    ref={inputRef}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    disabled={disabled}
                    className={inputClasses}
                    {...props}
                />

                {error && <span className="input-icon input-icon-error">⚠</span>}
                {success && <span className="input-icon input-icon-success">✓</span>}
            </div>

            {error && <span className="input-message input-message-error">{error}</span>}
        </div>
    );
};

// Select Component
export const Select = ({
    label,
    placeholder = 'Select an option',
    options = [],
    value,
    onChange,
    disabled = false,
    required = false,
    className = '',
    ...props
}) => {
    return (
        <div className="select-group">
            {label && (
                <label className="select-label">
                    {label}
                    {required && <span className="select-required">*</span>}
                </label>
            )}

            <div className="select-wrapper">
                <select
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`select ${className}`}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <div className="select-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};

// Toast Notification Component
export const Toast = ({
    message,
    type = 'info',
    duration = 3000,
    onClose,
    position = 'top-right'
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300);
    };

    if (!isVisible) return null;

    const typeClasses = {
        success: 'toast-success',
        error: 'toast-error',
        warning: 'toast-warning',
        info: 'toast-info'
    };

    const positionClasses = {
        'top-right': 'toast-top-right',
        'top-left': 'toast-top-left',
        'bottom-right': 'toast-bottom-right',
        'bottom-left': 'toast-bottom-left',
        'top-center': 'toast-top-center',
        'bottom-center': 'toast-bottom-center'
    };

    return (
        <div className={`toast ${typeClasses[type]} ${positionClasses[position]} ${isLeaving ? 'toast-leaving' : ''}`}>
            <div className="toast-content">
                <span className="toast-message">{message}</span>
                <button className="toast-close" onClick={handleClose}>
                    ×
                </button>
            </div>
        </div>
    );
};

// Toast Container Hook
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        const toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration + 300);
    };

    const ToastContainer = () => (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                />
            ))}
        </div>
    );

    return { showToast, ToastContainer };
};

// Infinite Scroll Hook
export const useInfiniteScroll = (callback, threshold = 100) => {
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

            if (scrollTop + clientHeight >= scrollHeight - threshold && !isLoading && hasMore) {
                setIsLoading(true);
                callback().finally(() => setIsLoading(false));
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [callback, threshold, isLoading, hasMore]);

    return { isLoading, hasMore, setHasMore };
};

// Local Storage Hook
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key]);

    return [storedValue, setValue];
};

// API Hook
export const useApi = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (fetchOptions = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                    ...fetchOptions.headers
                },
                ...options,
                ...fetchOptions
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url, options]);

    useEffect(() => {
        if (options.autoFetch !== false) {
            fetchData();
        }
    }, [fetchData, options.autoFetch]);

    return { data, loading, error, refetch: fetchData };
};

// Theme Hook
export const useTheme = () => {
    const [theme, setTheme] = useLocalStorage('theme', 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, [setTheme]);

    return { theme, setTheme, toggleTheme };
};

// Form Hook
export const useForm = (initialValues = {}, validation = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const setValue = useCallback((field, value) => {
        setValues(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    }, [errors]);

    const setTouchedField = useCallback((field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const validate = useCallback(() => {
        const newErrors = {};

        Object.keys(validation).forEach(field => {
            const rules = validation[field];
            const value = values[field];

            if (rules.required && !value) {
                newErrors[field] = 'This field is required';
            }

            if (rules.minLength && value && value.length < rules.minLength) {
                newErrors[field] = `Minimum length is ${rules.minLength}`;
            }

            if (rules.pattern && value && !rules.pattern.test(value)) {
                newErrors[field] = rules.message || 'Invalid format';
            }

            if (rules.custom && value) {
                const customError = rules.custom(value);
                if (customError) {
                    newErrors[field] = customError;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [values, validation]);

    const handleSubmit = useCallback((callback) => (e) => {
        e.preventDefault();

        Object.keys(values).forEach(field => {
            setTouchedField(field);
        });

        if (validate()) {
            callback(values);
        }
    }, [values, validate, setTouchedField]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    return {
        values,
        errors,
        touched,
        setValue,
        setTouchedField,
        validate,
        handleSubmit,
        reset,
        isValid: Object.keys(errors).length === 0
    };
};

// Debounce Hook
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Intersection Observer Hook
export const useIntersectionObserver = (ref, options = {}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsIntersecting(entry.isIntersecting),
            options
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [ref, options]);

    return isIntersecting;
};

// Click Outside Hook
export const useClickOutside = (ref, callback) => {
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('touchstart', handleClick);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('touchstart', handleClick);
        };
    }, [ref, callback]);
};

// Responsive Hook
export const useResponsive = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowSize.width < 768;
    const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
    const isDesktop = windowSize.width >= 1024;

    return {
        ...windowSize,
        isMobile,
        isTablet,
        isDesktop
    };
};

// Animation Hook
export const useAnimation = (keyframes, options = {}) => {
    const elementRef = useRef(null);
    const [animation, setAnimation] = useState(null);

    const play = useCallback(() => {
        if (!elementRef.current) return;

        if (animation) {
            animation.cancel();
        }

        const newAnimation = elementRef.current.animate(keyframes, {
            duration: 300,
            easing: 'ease-in-out',
            fill: 'forwards',
            ...options
        });

        setAnimation(newAnimation);
        return newAnimation;
    }, [keyframes, options, animation]);

    return { elementRef, play, animation };
};

// Counter Hook
export const useCounter = (initialValue = 0, step = 1) => {
    const [count, setCount] = useState(initialValue);

    const increment = useCallback(() => setCount(prev => prev + step), [step]);
    const decrement = useCallback(() => setCount(prev => prev - step), [step]);
    const reset = useCallback(() => setCount(initialValue), [initialValue]);
    const setValue = useCallback((value) => setCount(value), []);

    return { count, increment, decrement, reset, setValue };
};

// Toggle Hook
export const useToggle = (initialValue = false) => {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => setValue(prev => !prev), []);
    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);

    return { value, toggle, setTrue, setFalse, setValue };
};

// Previous Value Hook
export const usePrevious = (value) => {
    const ref = useRef();

    useEffect(() => {
        ref.current = value;
    });

    return ref.current;
};

// Async Operation Hook
export const useAsync = (asyncFunction, dependencies = []) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const execute = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await asyncFunction();
                if (isMounted) {
                    setData(result);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        execute();

        return () => {
            isMounted = false;
        };
    }, dependencies);

    return { data, error, loading };
};

// Component Usage Examples
/*
import { Button, Modal, Card, Input, Select, useToast, useForm } from './components.js';

// Button usage
<Button variant="primary" size="large" onClick={() => console.log('Clicked!')}>
    Click me
</Button>

// Modal usage
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="My Modal">
    <p>Modal content goes here</p>
</Modal>

// Form with validation
const { values, errors, handleSubmit, setValue } = useForm(
    { email: '', password: '' },
    {
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        password: { required: true, minLength: 6 }
    }
);

const handleFormSubmit = handleSubmit((formData) => {
    console.log('Form submitted:', formData);
});

// Toast usage
const { showToast, ToastContainer } = useToast();

const handleSuccess = () => {
    showToast('Operation completed successfully!', 'success');
};

return (
    <>
        <form onSubmit={handleFormSubmit}>
            <Input
                label="Email"
                type="email"
                value={values.email}
                onChange={(e) => setValue('email', e.target.value)}
                error={errors.email}
                required
            />
            <Input
                label="Password"
                type="password"
                value={values.password}
                onChange={(e) => setValue('password', e.target.value)}
                error={errors.password}
                required
            />
            <Button type="submit">Submit</Button>
        </form>
        <ToastContainer />
    </>
);
*/
