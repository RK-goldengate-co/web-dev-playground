-- User Management System - Seed Data
-- Sample data cho development và testing

-- Insert sample users với different roles và statuses
INSERT INTO users (first_name, last_name, email, password_hash, role, status, email_verified, created_at) VALUES
-- Admin users
('John', 'Admin', 'john.admin@codeprefency.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeehdBP6fEtTT2/Dm', 'admin', 'active', TRUE, CURRENT_TIMESTAMP - INTERVAL '30 days'),
('Sarah', 'Manager', 'sarah.manager@codeprefency.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeehdBP6fEtTT2/Dm', 'moderator', 'active', TRUE, CURRENT_TIMESTAMP - INTERVAL '20 days'),

-- Regular users
('Michael', 'Johnson', 'michael.johnson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeehdBP6fEtTT2/Dm', 'user', 'active', TRUE, CURRENT_TIMESTAMP - INTERVAL '15 days'),
('Emily', 'Davis', 'emily.davis@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeehdBP6fEtTT2/Dm', 'user', 'active', TRUE, CURRENT_TIMESTAMP - INTERVAL '10 days'),
('David', 'Wilson', 'david.wilson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeehdBP6fEtTT2/Dm', 'user', 'active', TRUE, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('Lisa', 'Anderson', 'lisa.anderson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeehdBP6fEtTT2/Dm', 'user', 'inactive', TRUE, CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Pending users
('Chris', 'Brown', 'chris.brown@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeehdBP6fEtTT2/Dm', 'user', 'pending', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('Amanda', 'Taylor', 'amanda.taylor@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeehdBP6fEtTT2/Dm', 'user', 'pending', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Insert sample categories với hierarchy
INSERT INTO categories (name, slug, description, parent_id, sort_order) VALUES
-- Parent categories
('Electronics', 'electronics', 'Electronic devices and accessories', NULL, 1),
('Computers', 'computers', 'Computers and accessories', NULL, 2),
('Clothing', 'clothing', 'Fashion and apparel', NULL, 3),
('Books', 'books', 'Books and publications', NULL, 4),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', NULL, 5),

-- Subcategories
('Smartphones', 'smartphones', 'Mobile phones and accessories', 1, 1),
('Laptops', 'laptops', 'Laptop computers', 2, 1),
('Tablets', 'tablets', 'Tablet computers', 2, 2),
('Men''s Clothing', 'mens-clothing', 'Clothing for men', 3, 1),
('Women''s Clothing', 'womens-clothing', 'Clothing for women', 3, 2),
('Fiction Books', 'fiction-books', 'Fiction and novels', 4, 1),
('Technical Books', 'technical-books', 'Programming and technical books', 4, 2);

-- Insert sample products
INSERT INTO products (name, description, price, category_id, sku, stock_quantity, low_stock_threshold, status, specifications) VALUES
-- Electronics
('iPhone 15 Pro', 'Latest iPhone với advanced camera system và titanium design', 999.99, 7, 'IPH15P-128', 50, 10, 'active',
 '{"color": "Natural Titanium", "storage": "128GB", "display": "6.1 inch Super Retina XDR"}'::jsonb),

('MacBook Pro 16"', 'Powerful laptop cho professionals với M3 chip', 2499.99, 9, 'MBP16-M3', 25, 5, 'active',
 '{"processor": "Apple M3", "memory": "18GB", "storage": "512GB SSD", "display": "16.2 inch"}'::jsonb),

('iPad Air', 'Versatile tablet với M1 chip và all-screen design', 599.99, 10, 'IPA-M1', 75, 15, 'active',
 '{"processor": "Apple M1", "storage": "64GB", "connectivity": "Wi-Fi", "color": "Space Gray"}'::jsonb),

-- Clothing
('Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 19.99, 12, 'TS-COTTON-M', 200, 20, 'active',
 '{"material": "100% Cotton", "fit": "Regular", "care": "Machine wash"}'::jsonb),

('Denim Jeans', 'Classic straight-fit denim jeans', 79.99, 12, 'JEANS-DENIM-32', 100, 10, 'active',
 '{"material": "98% Cotton, 2% Elastane", "fit": "Straight", "rise": "Mid-rise"}'::jsonb),

-- Books
('Clean Code', 'A Handbook of Agile Software Craftsmanship', 47.99, 15, 'BOOK-CC-001', 150, 20, 'active',
 '{"author": "Robert C. Martin", "pages": 464, "language": "English", "format": "Paperback"}'::jsonb),

('The Pragmatic Programmer', 'Your Journey to Mastery', 42.99, 15, 'BOOK-PP-001', 120, 15, 'active',
 '{"author": "David Thomas, Andrew Hunt", "pages": 352, "language": "English", "format": "Paperback"}'::jsonb);

-- Insert sample orders
INSERT INTO orders (order_number, user_id, subtotal, tax_amount, shipping_amount, total_amount, currency_code, status, shipping_address, created_at) VALUES
('ORD-20241201-000001', 3, 1049.98, 94.50, 15.00, 1159.48, 'USD', 'delivered',
 '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "US"}'::jsonb,
 CURRENT_TIMESTAMP - INTERVAL '10 days'),

('ORD-20241201-000002', 4, 67.98, 6.12, 10.00, 84.10, 'USD', 'shipped',
 '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210", "country": "US"}'::jsonb,
 CURRENT_TIMESTAMP - INTERVAL '5 days'),

('ORD-20241201-000003', 5, 47.99, 4.32, 0.00, 52.31, 'USD', 'processing',
 '{"street": "789 Pine St", "city": "Chicago", "state": "IL", "zip": "60601", "country": "US"}'::jsonb,
 CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Insert order items cho các orders trên
INSERT INTO order_items (order_id, product_id, quantity, price, product_name, product_sku) VALUES
(1, 1, 1, 999.99, 'iPhone 15 Pro', 'IPH15P-128'),
(1, 3, 1, 49.99, 'iPad Air', 'IPA-M1'),

(2, 4, 2, 19.99, 'Cotton T-Shirt', 'TS-COTTON-M'),
(2, 5, 1, 27.99, 'Denim Jeans', 'JEANS-DENIM-32'),

(3, 6, 1, 47.99, 'Clean Code', 'BOOK-CC-001');

-- Insert sample user sessions
INSERT INTO user_sessions (session_token, user_id, device_info, ip_address, expires_at) VALUES
('sess_admin_123', 1, '{"device": "Desktop", "browser": "Chrome", "os": "Windows"}'::jsonb, '192.168.1.100', CURRENT_TIMESTAMP + INTERVAL '24 hours'),
('sess_user_456', 3, '{"device": "Mobile", "browser": "Safari", "os": "iOS"}'::jsonb, '10.0.0.50', CURRENT_TIMESTAMP + INTERVAL '24 hours'),
('sess_user_789', 4, '{"device": "Desktop", "browser": "Firefox", "os": "Linux"}'::jsonb, '172.16.0.25', CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- Insert sample API keys
INSERT INTO api_keys (key_id, key_hash, user_id, name, permissions, rate_limit_per_hour, status) VALUES
('ak_admin_001', 'hashed_secret_key_admin', 1, 'Admin API Key', ARRAY['read', 'write', 'delete'], 10000, 'active'),
('ak_user_001', 'hashed_secret_key_user', 3, 'User API Key', ARRAY['read'], 1000, 'active'),
('ak_integration_001', 'hashed_secret_key_integration', 2, 'External Integration', ARRAY['read', 'write'], 5000, 'active');

-- Insert sample audit logs
INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id, created_at) VALUES
('users', 3, 'INSERT', NULL, '{"first_name": "Michael", "last_name": "Johnson", "email": "michael.johnson@email.com"}'::jsonb, 1, CURRENT_TIMESTAMP - INTERVAL '15 days'),
('products', 1, 'INSERT', NULL, '{"name": "iPhone 15 Pro", "price": 999.99, "sku": "IPH15P-128"}'::jsonb, 1, CURRENT_TIMESTAMP - INTERVAL '12 days'),
('orders', 1, 'UPDATE', '{"status": "processing"}'::jsonb, '{"status": "shipped"}'::jsonb, 1, CURRENT_TIMESTAMP - INTERVAL '8 days'),
('orders', 1, 'UPDATE', '{"status": "shipped"}'::jsonb, '{"status": "delivered"}'::jsonb, 1, CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Update user statistics
UPDATE users SET last_login_at = CURRENT_TIMESTAMP - INTERVAL '1 hour' WHERE id = 1;
UPDATE users SET last_login_at = CURRENT_TIMESTAMP - INTERVAL '2 hours' WHERE id = 3;
UPDATE users SET last_login_at = CURRENT_TIMESTAMP - INTERVAL '30 minutes' WHERE id = 4;

-- Refresh materialized views
REFRESH MATERIALIZED VIEW daily_sales_summary;
REFRESH MATERIALIZED VIEW product_performance;

COMMIT;
