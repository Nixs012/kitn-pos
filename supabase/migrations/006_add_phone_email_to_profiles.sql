-- Migration: Add email and phone to user_profiles for management visibility
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update existing profiles with email from auth.users (if any exist)
-- This requires a join which might be restricted in some RLS setups, 
-- but as a migration it runs as superuser.
UPDATE user_profiles
SET email = auth.users.email
FROM auth.users
WHERE user_profiles.id = auth.users.id
AND user_profiles.email IS NULL;
