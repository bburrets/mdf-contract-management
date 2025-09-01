-- Create users table for authentication system
-- Story 1.2: Basic User Authentication System

CREATE TABLE IF NOT EXISTS users (
  user_id        TEXT PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'operations' 
                 CHECK (role IN ('operations', 'finance', 'admin')),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login     TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Insert seed data for testing
INSERT INTO users (user_id, email, password_hash, full_name, role, is_active) VALUES
-- Password for all test users is 'password123' (will be properly hashed in production)
('user_ops_001', 'ops@arkansas.gov', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWHUBCfXwP.DgBUa', 'Arkansas Operations User', 'operations', true),
('user_fin_001', 'finance@arkansas.gov', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWHUBCfXwP.DgBUa', 'Arkansas Finance User', 'finance', true),
('user_adm_001', 'admin@arkansas.gov', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWHUBCfXwP.DgBUa', 'System Administrator', 'admin', true)
ON CONFLICT (user_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for MDF system authentication and authorization';
COMMENT ON COLUMN users.user_id IS 'Unique user identifier (primary key)';
COMMENT ON COLUMN users.email IS 'User email address for authentication';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password';
COMMENT ON COLUMN users.full_name IS 'User display name';
COMMENT ON COLUMN users.role IS 'User role: operations, finance, or admin';
COMMENT ON COLUMN users.is_active IS 'Account status flag';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.last_login IS 'Last successful login timestamp';