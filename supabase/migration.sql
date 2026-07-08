-- Add device_limit to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_limit INT DEFAULT 3;

-- Update existing users to have minimum 3 devices
UPDATE users SET device_limit = 3 WHERE device_limit IS NULL;
