-- SQL to update Supabase for PayPal and User Type support

-- 1. Ensure the settings table exists for storing custom user attributes
-- This table stores keys like 'u_{user_id}_type'
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Optional: Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_update_settings_updated_at') THEN
        CREATE TRIGGER tr_update_settings_updated_at
        BEFORE UPDATE ON settings
        FOR EACH ROW
        EXECUTE FUNCTION update_settings_updated_at();
    END IF;
END $$;

-- 3. (Optional) Example: Update an existing user to be a PayPal user
-- Replace 'USER_ID_HERE' with the actual UUID from your 'users' table
-- INSERT INTO settings (key, value) 
-- VALUES ('u_USER_ID_HERE_type', 'paypal')
-- ON CONFLICT (key) DO UPDATE SET value = 'paypal';

-- Note: The application logic in utils.js and admin.js handles creating these 
-- entries automatically when you use the Admin Panel. 
-- You do not need to manually insert rows for every user.
