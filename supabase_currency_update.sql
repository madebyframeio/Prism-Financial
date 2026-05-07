-- Add currency column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Update existing users to have a default currency
UPDATE users SET currency = 'USD' WHERE currency IS NULL;
