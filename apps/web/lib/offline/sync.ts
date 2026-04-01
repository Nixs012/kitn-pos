import { db, type SalesQueueEntry, type SaleItemsQueueEntry } from './db';
import { createClient } from '@/lib/supabase/client';

export async function pushQueue() {
  const pendingSales = await db.sales_queue
    .where('sync_status')
    .equals('pending')
    .toArray();

  if (pendingSales.length === 0) return;

  const supabase = createClient();

  for (const sale of pendingSales) {
    try {
      const items = await db.sale_items_queue
        .where('sale_queue_id')
        .equals(sale.id!)
        .toArray();

      // Start a "simulation" of individual inserts since we don't have a single bulk API yet
      // In a real app, you'd call a stored procedure or a dedicated sync endpoint
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .insert({
          branch_id: sale.branch_id,
          cashier_id: sale.cashier_id,
          receipt_number: sale.receipt_number,
          total_amount: sale.total_amount,
          discount: sale.discount,
          tax_amount: sale.tax_amount,
          payment_method: sale.payment_method,
          mpesa_ref: sale.mpesa_ref,
          created_at: sale.created_at
        })
        .select()
        .single();

      if (salesError) throw salesError;

      const itemsToInsert = items.map(item => ({
        sale_id: salesData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        vat_amount: item.vat_amount
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Mark as synced
      await db.sales_queue.update(sale.id!, { sync_status: 'synced' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to sync sale ${sale.receipt_number}:`, message);
      await db.sales_queue.update(sale.id!, { 
        sync_status: 'failed',
        retry_count: sale.retry_count + 1 
      });
    }
  }
}

export async function pullProducts() {
  const supabase = createClient();
  const { data: remoteProducts, error } = await supabase
    .from('products')
    .select('*, inventory(*)');

  if (error) throw error;

  for (const remote of remoteProducts) {
    const local = await db.products.get(remote.id);
    
    if (!local || new Date(remote.updated_at) > new Date(local.local_updated_at)) {
      await db.products.put({
        ...remote,
        local_updated_at: new Date().toISOString()
      });
    }
  }
}

export function resolveConflict(local: { local_updated_at: string }, remote: { updated_at: string }) {
  // Simple "last write wins" based on remote timestamp
  return new Date(remote.updated_at) > new Date(local.local_updated_at) ? remote : local;
}
