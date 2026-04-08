-- Migration 014: Create Notifications Table
-- Description: Supports real-time platform alerts for low stock, new sales, and subscription events.

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id), -- Optional: for user-specific alerts
  type text NOT NULL CHECK (type IN ('low_stock', 'out_of_stock', 'sale', 'info', 'summary', 'subscription')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users can read their tenant's notifications
DROP POLICY IF EXISTS "allow_tenant_notifications" ON notifications;
CREATE POLICY "allow_tenant_notifications" ON notifications 
FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())) WITH CHECK (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Enable Realtime safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
