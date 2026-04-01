import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  id: string;
  tenant_id: string;
  name: string;
  barcode: string;
  sku: string;
  category: string;
  buying_price: number;
  selling_price: number;
  vat_rate: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
  inventory?: unknown[];
  local_updated_at: string;
}

export interface SalesQueueEntry {
  id?: number;
  branch_id: string;
  cashier_id: string;
  receipt_number: string;
  total_amount: number;
  discount: number;
  tax_amount: number;
  payment_method: 'mpesa' | 'cash' | 'card' | 'split';
  mpesa_ref?: string;
  created_at: string;
  sync_status: 'pending' | 'synced' | 'failed';
  retry_count: number;
}

export interface SaleItemsQueueEntry {
  id?: number;
  sale_queue_id: number;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  vat_amount: number;
}

export interface InventoryCacheEntry {
  product_id: string;
  branch_id: string;
  quantity: number;
  reorder_level: number;
}

export class KitnOfflineDB extends Dexie {
  products!: Table<LocalProduct>;
  sales_queue!: Table<SalesQueueEntry>;
  sale_items_queue!: Table<SaleItemsQueueEntry>;
  inventory_cache!: Table<InventoryCacheEntry>;

  constructor() {
    super('KitnOfflineDB');
    this.version(1).stores({
      products: 'id, barcode, sku, category, local_updated_at',
      sales_queue: '++id, receipt_number, sync_status, created_at',
      sale_items_queue: '++id, sale_queue_id, product_id',
      inventory_cache: '[product_id+branch_id]'
    });
  }
}

export const db = new KitnOfflineDB();
