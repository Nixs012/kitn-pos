-- Migration: 016_add_system_recovery.sql
-- Description: Creates a global system configuration table and stores the recovery key hash.

CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only superadmins (if we had a role for them) or service_role should see this
-- For now, we restrict all public access
CREATE POLICY "SystemConfig: Service Role Only" ON public.system_config
FOR ALL USING (false);

-- Insert the recovery key hash
INSERT INTO public.system_config (key, value, description)
VALUES (
    'recovery_key_hash', 
    'ba48ccbee8bc6ade3dc753c0d8c5bed4c13cea6d4e991b1048e5351796ce0830',
    'SHA256 hash of the system recovery key'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
