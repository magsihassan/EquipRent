-- Migration: Add OTP verification and registration status columns
-- Run this after the initial 001_schema.sql

-- Add OTP and registration status columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_purpose VARCHAR(20) DEFAULT 'email_verify';
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add password reset token columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_users_otp ON users(email, otp_code) WHERE otp_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_registration_status ON users(registration_status);

-- Update existing users to be approved (for demo accounts)
UPDATE users SET registration_status = 'approved', email_verified = true WHERE role = 'admin';

COMMENT ON COLUMN users.registration_status IS 'pending, approved, rejected';
COMMENT ON COLUMN users.otp_purpose IS 'email_verify, password_reset';
