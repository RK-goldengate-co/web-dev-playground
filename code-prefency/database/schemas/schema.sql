-- SQL Database Schema for User Management System
-- Modern relational database design with PostgreSQL

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL CHECK (length(name) >= 2),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    role user_role_enum NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    password_hash VARCHAR(255), -- For authentication (optional)
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_name_length CHECK (length(name) >= 2 AND length(name) <= 100)
);

-- Create user roles enum
CREATE TYPE user_role_enum AS ENUM ('admin', 'moderator', 'user');

-- Create user preferences table (normalized design)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications BOOLEAN NOT NULL DEFAULT true,
    language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (length(language) = 2),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- Create user sessions table (for authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Index for faster token lookups
    INDEX idx_sessions_token (token),
    INDEX idx_sessions_user_expires (user_id, expires_at)
);

-- Create audit log table (for tracking changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for efficient querying
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_table (table_name),
    INDEX idx_audit_logs_created_at (created_at)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Insert sample data
INSERT INTO users (name, email, role) VALUES
    ('John Doe', 'john.doe@example.com', 'admin'),
    ('Jane Smith', 'jane.smith@example.com', 'moderator'),
    ('Bob Johnson', 'bob.johnson@example.com', 'user'),
    ('Alice Brown', 'alice.brown@example.com', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert corresponding preferences
INSERT INTO user_preferences (user_id, theme, notifications, language, timezone)
SELECT
    u.id,
    'light',
    true,
    'en',
    'UTC'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences up WHERE up.user_id = u.id
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, table_name, record_id, new_values)
        VALUES ('create', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values)
        VALUES ('update', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, old_values)
        VALUES ('delete', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_user_preferences_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create view for user summary
CREATE OR REPLACE VIEW user_summary AS
SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.is_active,
    u.created_at,
    up.theme,
    up.notifications,
    up.language,
    up.timezone
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    inactive_users BIGINT,
    admin_count BIGINT,
    moderator_count BIGINT,
    user_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE role = 'moderator') as moderator_count,
        COUNT(*) FILTER (WHERE role = 'user') as user_count
    FROM users;
END;
$$ LANGUAGE plpgsql;

-- Create RLS (Row Level Security) policies for multi-tenancy (optional)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;
-- GRANT SELECT ON user_summary TO app_user;
-- GRANT EXECUTE ON FUNCTION get_user_stats() TO app_user;

-- Sample queries for common operations

-- Get all active users with their preferences
-- SELECT * FROM user_summary WHERE is_active = true;

-- Get user statistics
-- SELECT * FROM get_user_stats();

-- Search users by name or email
-- SELECT * FROM user_summary
-- WHERE name ILIKE '%john%' OR email ILIKE '%john%';

-- Get users by role
-- SELECT * FROM user_summary WHERE role = 'admin';

-- Get recent audit logs
-- SELECT * FROM audit_logs
-- WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
-- ORDER BY created_at DESC;

-- Pagination example
-- SELECT * FROM user_summary
-- ORDER BY created_at DESC
-- LIMIT 10 OFFSET 20;

-- Complex query with joins and aggregations
-- SELECT
--     u.role,
--     COUNT(u.id) as user_count,
--     AVG(EXTRACT(EPOCH FROM (u.created_at))) as avg_created_timestamp,
--     json_object_agg(up.theme, up.notifications) as theme_preferences
-- FROM users u
-- LEFT JOIN user_preferences up ON u.id = up.user_id
-- GROUP BY u.role;

-- Create materialized view for performance (refresh periodically)
-- CREATE MATERIALIZED VIEW user_role_stats AS
-- SELECT
--     role,
--     COUNT(*) as count,
--     COUNT(*) FILTER (WHERE is_active = true) as active_count
-- FROM users
-- GROUP BY role;

-- Refresh materialized view
-- REFRESH MATERIALIZED VIEW user_role_stats;
