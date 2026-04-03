-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references user_profiles(id),
  type text check (type in ('low_stock', 'out_of_stock', 'sale', 'info', 'summary')) default 'info',
  title text not null,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Development policy: allow all authenticated users to see all notifications
-- (In production, this would be restricted by tenant_id)
CREATE POLICY "allow_all_notifications" ON notifications 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for this table
alter publication supabase_realtime add table notifications;
