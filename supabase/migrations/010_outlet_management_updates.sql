-- Migration: 010_outlet_management_updates.sql
-- Description: Adds destination_branch_id to stock_movements and updates the type constraint for transfers.

-- 1. Add destination_branch_id column
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS destination_branch_id uuid REFERENCES branches(id);

-- 2. Update the type check constraint to include transfers
-- First, drop the old constraint (Postgres usually names it table_column_check)
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;

-- Add the updated constraint
ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_type_check 
CHECK (type IN ('sale', 'restock', 'adjustment', 'return', 'transfer_in', 'transfer_out'));

-- 3. Ensure RLS allows the new column and types
-- (Already handled by "Allow all for authenticated" if that policy exists, 
-- but we make it explicit for this new functionality if needed)
CREATE POLICY "authenticated_transfer_access" 
ON stock_movements FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
