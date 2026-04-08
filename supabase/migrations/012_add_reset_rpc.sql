-- RPC: Reset Tenant Data
-- Description: Recursively deletes all transactional data for a tenant (sales, inventory, movements).

CREATE OR REPLACE FUNCTION reset_tenant_data(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete sale items (via sales)
    DELETE FROM sale_items WHERE sale_id IN (
        SELECT id FROM sales WHERE branch_id IN (
            SELECT id FROM branches WHERE tenant_id = _tenant_id
        )
    );

    -- Delete sales
    DELETE FROM sales WHERE branch_id IN (
        SELECT id FROM branches WHERE tenant_id = _tenant_id
    );

    -- Delete stock movements
    DELETE FROM stock_movements WHERE branch_id IN (
        SELECT id FROM branches WHERE tenant_id = _tenant_id
    );

    -- Reset inventory quantities to 0
    UPDATE inventory SET quantity = 0, last_restocked = NULL 
    WHERE branch_id IN (
        SELECT id FROM branches WHERE tenant_id = _tenant_id
    );

    -- Log the action
    INSERT INTO audit_log (tenant_id, action, table_name)
    VALUES (_tenant_id, 'reset_store_data', 'tenants');
END;
$$;
