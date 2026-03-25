import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string;
  image_url?: string;
}

export interface PendingSale {
  id?: number;
  receipt_number: string;
  items: {
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  total_amount: number;
  payment_method: 'Cash' | 'M-Pesa' | 'Card';
  created_at: string;
  synced: number; // 0 for no, 1 for yes
}

export class KitnDatabase extends Dexie {
  products!: Table<LocalProduct>;
  pendingSales!: Table<PendingSale>;

  constructor() {
    super('KitnPOS');
    this.version(1).stores({
      products: 'id, name, sku, category',
      pendingSales: '++id, receipt_number, synced, created_at'
    });
  }
}

export const db = new KitnDatabase();
