// Advanced React TypeScript Components
// Modern React with TypeScript, hooks, and advanced patterns

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Generic Types
interface BaseProps {
    className?: string;
    children?: React.ReactNode;
    id?: string;
}

// Advanced Button Component with TypeScript
interface ButtonProps extends BaseProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    fullWidth?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'medium',
    loading = false,
    fullWidth = false,
    disabled = false,
    className = '',
    onClick,
    ...props
}) => {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
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

    const buttonClasses = useMemo(() => {
        const base = 'btn';
        const variants = {
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

        const sizes = {
            small: 'btn-sm',
            medium: 'btn-md',
            large: 'btn-lg'
        };

        return [
            base,
            variants[variant],
            sizes[size],
            fullWidth && 'btn-full-width',
            (disabled || loading) && 'btn-disabled',
            className
        ].filter(Boolean).join(' ');
    }, [variant, size, fullWidth, disabled, loading, className]);

    return (
        <button
            className={buttonClasses}
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

// Advanced Modal Component
interface ModalProps extends BaseProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'small' | 'medium' | 'large' | 'fullscreen';
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    closeOnOverlay = true,
    closeOnEscape = true,
    showCloseButton = true,
    footer,
    className = ''
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === 'Escape') {
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
    }, [isOpen, closeOnEscape, onClose]);

    const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlay && e.target === e.currentTarget) {
            onClose();
        }
    }, [closeOnOverlay, onClose]);

    if (!isOpen) return null;

    const modalClasses = useMemo(() => {
        const base = 'modal';
        const sizes = {
            small: 'modal-sm',
            medium: 'modal-md',
            large: 'modal-lg',
            fullscreen: 'modal-fullscreen'
        };

        return [base, sizes[size], className].filter(Boolean).join(' ');
    }, [size, className]);

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={modalClasses} ref={modalRef}>
                {(title || showCloseButton) && (
                    <div className="modal-header">
                        {title && <h2 className="modal-title">{title}</h2>}
                        {showCloseButton && (
                            <button className="modal-close" onClick={onClose} aria-label="Close modal">
                                ×
                            </button>
                        )}
                    </div>
                )}

                <div className="modal-body">
                    {children}
                </div>

                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// Advanced Data Table Component
interface Column<T> {
    key: keyof T | string;
    title: string;
    render?: (value: any, record: T, index: number) => React.ReactNode;
    sortable?: boolean;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
}

interface TableProps<T> extends BaseProps {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    pagination?: {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize: number) => void;
    };
    rowSelection?: {
        selectedRowKeys: string[];
        onChange: (selectedRowKeys: string[]) => void;
    };
    onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    pagination,
    rowSelection,
    onRow,
    className = ''
}: TableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof T];
            const bValue = b[sortConfig.key as keyof T];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = useCallback((column: Column<T>) => {
        if (!column.sortable) return;

        setSortConfig(current => {
            if (current?.key === column.key) {
                return current.direction === 'asc'
                    ? { key: column.key as string, direction: 'desc' }
                    : null;
            }
            return { key: column.key as string, direction: 'asc' };
        });
    }, []);

    const tableClasses = ['data-table', className].filter(Boolean).join(' ');

    return (
        <div className={tableClasses}>
            <div className="table-container">
                <table className="table">
                    <thead className="table-head">
                        <tr>
                            {rowSelection && (
                                <th className="table-cell table-cell-selection">
                                    <input
                                        type="checkbox"
                                        checked={rowSelection.selectedRowKeys.length === data.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                rowSelection.onChange(data.map(item => String(item.id || item.key)));
                                            } else {
                                                rowSelection.onChange([]);
                                            }
                                        }}
                                    />
                                </th>
                            )}
                            {columns.map((column, index) => (
                                <th
                                    key={String(column.key) + index}
                                    className={`table-cell table-header-cell ${column.sortable ? 'sortable' : ''}`}
                                    style={{ width: column.width, textAlign: column.align }}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className="header-content">
                                        {column.title}
                                        {column.sortable && sortConfig?.key === column.key && (
                                            <span className={`sort-icon ${sortConfig.direction}`}>
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="table-body">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (rowSelection ? 1 : 0)} className="table-cell loading-cell">
                                    Loading...
                                </td>
                            </tr>
                        ) : sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (rowSelection ? 1 : 0)} className="table-cell empty-cell">
                                    No data
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((record, index) => (
                                <tr
                                    key={String(record.id || record.key || index)}
                                    className="table-row"
                                    {...onRow?.(record, index)}
                                >
                                    {rowSelection && (
                                        <td className="table-cell table-cell-selection">
                                            <input
                                                type="checkbox"
                                                checked={rowSelection.selectedRowKeys.includes(String(record.id || record.key))}
                                                onChange={(e) => {
                                                    const key = String(record.id || record.key);
                                                    if (e.target.checked) {
                                                        rowSelection.onChange([...rowSelection.selectedRowKeys, key]);
                                                    } else {
                                                        rowSelection.onChange(rowSelection.selectedRowKeys.filter(k => k !== key));
                                                    }
                                                }}
                                            />
                                        </td>
                                    )}
                                    {columns.map((column, colIndex) => (
                                        <td
                                            key={String(column.key) + colIndex}
                                            className="table-cell"
                                            style={{ textAlign: column.align }}
                                        >
                                            {column.render
                                                ? column.render(record[column.key], record, index)
                                                : String(record[column.key] || '')
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="table-pagination">
                    <div className="pagination-info">
                        Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                        {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                        {pagination.total} entries
                    </div>

                    <div className="pagination-controls">
                        <Button
                            variant="secondary"
                            size="small"
                            disabled={pagination.current <= 1}
                            onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                        >
                            Previous
                        </Button>

                        <span className="pagination-current">
                            Page {pagination.current}
                        </span>

                        <Button
                            variant="secondary"
                            size="small"
                            disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                            onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Advanced Form Components with TypeScript
interface FormFieldProps extends BaseProps {
    label?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    value?: any;
    onChange?: (value: any) => void;
    onBlur?: () => void;
}

export const FormField: React.FC<FormFieldProps & { children: React.ReactNode }> = ({
    label,
    error,
    required = false,
    disabled = false,
    children,
    className = ''
}) => {
    const fieldClasses = ['form-field', error && 'form-field-error', disabled && 'form-field-disabled', className]
        .filter(Boolean).join(' ');

    return (
        <div className={fieldClasses}>
            {label && (
                <label className="form-label">
                    {label}
                    {required && <span className="form-required">*</span>}
                </label>
            )}

            <div className="form-input-wrapper">
                {children}
            </div>

            {error && <span className="form-error-message">{error}</span>}
        </div>
    );
};

// Input Component
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>, FormFieldProps {
    onChange?: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    required = false,
    disabled = false,
    value = '',
    onChange,
    className = '',
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.value);
    }, [onChange]);

    const handleFocus = useCallback(() => setIsFocused(true), []);
    const handleBlur = useCallback(() => setIsFocused(false), []);

    const inputClasses = [
        'form-input',
        isFocused && 'form-input-focused',
        error && 'form-input-error',
        disabled && 'form-input-disabled',
        className
    ].filter(Boolean).join(' ');

    return (
        <FormField label={label} error={error} required={required} disabled={disabled}>
            <input
                className={inputClasses}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={disabled}
                {...props}
            />
        </FormField>
    );
};

// Select Component
interface SelectProps extends FormFieldProps {
    options: Array<{ value: string | number; label: string; disabled?: boolean }>;
    placeholder?: string;
    onChange?: (value: string | number) => void;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    placeholder = 'Select an option',
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    className = ''
}) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange?.(e.target.value);
    }, [onChange]);

    const selectClasses = [
        'form-select',
        error && 'form-select-error',
        disabled && 'form-select-disabled',
        className
    ].filter(Boolean).join(' ');

    return (
        <FormField label={label} error={error} required={required} disabled={disabled}>
            <select
                className={selectClasses}
                value={value}
                onChange={handleChange}
                disabled={disabled}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option, index) => (
                    <option
                        key={index}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </FormField>
    );
};

// Custom Hooks with TypeScript
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T) => {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key]);

    return [storedValue, setValue];
}

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function useAsync<T>(asyncFunction: () => Promise<T>, dependencies: React.DependencyList = []) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

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
                    setError(err instanceof Error ? err : new Error(String(err)));
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
}

// Generic API Hook
interface UseApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    autoFetch?: boolean;
}

export function useApi<T = any>(url: string, options: UseApiOptions = {}) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (fetchOptions: UseApiOptions = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url, {
                method: options.method || fetchOptions.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                    ...fetchOptions.headers
                },
                body: fetchOptions.body ? JSON.stringify(fetchOptions.body) : options.body ? JSON.stringify(options.body) : undefined
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
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
}

// Infinite Scroll Hook
export function useInfiniteScroll<T>(
    fetchMore: () => Promise<{ data: T[]; hasMore: boolean }>,
    dependencies: React.DependencyList = []
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        setError(null);

        try {
            const result = await fetchMore();
            setData(prev => [...prev, ...result.data]);
            setHasMore(result.hasMore);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [fetchMore, loading, hasMore]);

    useEffect(() => {
        setData([]);
        setHasMore(true);
        setError(null);
    }, dependencies);

    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);

    return { data, loading, hasMore, error, loadMore };
}

// Virtual Scrolling Hook
export function useVirtualScroll<T>(items: T[], itemHeight: number, containerHeight: number) {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    useEffect(() => {
        const element = containerRef;
        if (!element) return;

        const handleScrollEvent = (e: Event) => {
            setScrollTop((e.target as HTMLDivElement).scrollTop);
        };

        element.addEventListener('scroll', handleScrollEvent);
        return () => element.removeEventListener('scroll', handleScrollEvent);
    }, [containerRef]);

    return {
        containerRef: setContainerRef,
        totalHeight,
        visibleItems,
        offsetY,
        handleScroll,
        startIndex,
        endIndex
    };
}

// Higher-Order Component for Error Boundaries
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
    React.PropsWithChildren<ErrorBoundaryProps>,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.props.onError?.(error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
            }

            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>{this.state.error.message}</p>
                    <Button onClick={this.resetError}>Try again</Button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Generic List Component
interface ListProps<T> extends BaseProps {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    keyExtractor?: (item: T, index: number) => string | number;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
}

export function List<T>({
    items,
    renderItem,
    keyExtractor = (_, index) => index,
    loading = false,
    emptyMessage = 'No items found',
    className = ''
}: ListProps<T>) {
    if (loading) {
        return (
            <div className={`list loading ${className}`}>
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className={`list empty ${className}`}>
                <div className="empty-message">{emptyMessage}</div>
            </div>
        );
    }

    return (
        <div className={`list ${className}`}>
            {items.map((item, index) => (
                <div key={keyExtractor(item, index)} className="list-item">
                    {renderItem(item, index)}
                </div>
            ))}
        </div>
    );
}

// Export all components and hooks
export {
    Button,
    Modal,
    DataTable,
    FormField,
    Input,
    Select,
    useLocalStorage,
    useDebounce,
    useAsync,
    useApi,
    useInfiniteScroll,
    useVirtualScroll,
    ErrorBoundary,
    List
};

// Default export for easy importing
export default {
    Button,
    Modal,
    DataTable,
    Input,
    Select,
    useLocalStorage,
    useDebounce,
    useAsync,
    useApi,
    ErrorBoundary
};
