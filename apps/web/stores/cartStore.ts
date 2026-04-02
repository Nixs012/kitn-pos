import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vat_rate: number;
  unit: string;
}

export interface CartProduct {
  id: string;
  name: string;
  selling_price?: number | string;
  vat_rate?: number | string;
  unit?: string;
  [key: string]: any;
}

interface CartStore {
  items: CartItem[];
  discount: number;
  addItem: (product: CartProduct) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;
  getTotals: () => {
    subtotal: number;
    vat: number;
    total: number;
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.id === product.id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                id: product.id,
                name: product.name,
                price: Number(product.selling_price ?? 0),
                quantity: 1,
                vat_rate: Number(product.vat_rate ?? 16),
                unit: product.unit || 'pcs',
              },
            ],
          });
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      setDiscount: (discount) => set({ discount: Math.max(0, discount) }),

      clearCart: () => set({ items: [], discount: 0 }),

      getTotals: () => {
        const { items, discount } = get();
        const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const vat = items.reduce((acc, item) => {
          const itemTotal = item.price * item.quantity;
          // VAT = Total - (Total / (1 + Rate/100))
          return acc + (itemTotal - (itemTotal / (1 + item.vat_rate / 100)));
        }, 0);
        
        return {
          subtotal,
          vat,
          total: Math.max(0, subtotal - discount),
        };
      },
    }),
    {
      name: 'kitn-pos-cart',
    }
  )
);
