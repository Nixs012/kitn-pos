'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/offline/db';
import { pushQueue, pullProducts } from '@/lib/offline/sync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLiveQuery } from 'dexie-react-hooks';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Search, 
  Maximize, 
  Camera, 
  Package,
  Plus, 
  Minus, 
  Trash2, 
  Wifi, 
  WifiOff,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  ShoppingCart,
  X
} from 'lucide-react';

// --- Types ---
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// --- Components ---

const ProductCard = ({ product, onAdd }: { product: any, onAdd: (p: any) => void }) => {
  const stock = product.inventory?.[0]?.quantity ?? 0;
  const isLowStock = stock <= (product.reorder_level ?? 10);
  
  return (
    <div 
      onClick={() => onAdd(product)}
      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-green/30 transition-all cursor-pointer group"
    >
      <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-gray-300">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <Package size={32} />
        )}
      </div>
      <h3 className="font-bold text-sm text-brand-dark mb-1 line-clamp-1">{product.name}</h3>
      <div className="flex justify-between items-end">
        <p className="font-black text-brand-green text-sm">KES {(product.selling_price ?? 0).toLocaleString()}</p>
        <p className={`text-[10px] font-bold ${isLowStock ? 'text-orange-500' : 'text-gray-400'}`}>
          {stock} in stock
        </p>
      </div>
    </div>
  );
};

const MpesaModal = ({ 
  isOpen, 
  onClose, 
  total, 
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  total: number,
  onSuccess: () => void 
}) => {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'waiting' | 'success' | 'error'>('idle');

  const handlePay = async () => {
    setStatus('sending');
    // Simulate STK Push
    setTimeout(() => {
      setStatus('waiting');
      // Simulate Polling
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }, 3000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-green-600 p-6 text-white text-center">
          <Smartphone size={40} className="mx-auto mb-2" />
          <h3 className="text-xl font-bold">M-Pesa STK Push</h3>
          <p className="opacity-80 text-sm">Charge KES {total.toLocaleString()}</p>
        </div>
        
        <div className="p-8">
          {status === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Customer Phone</label>
                <input 
                  type="text" 
                  placeholder="07XX XXX XXX" 
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-lg font-bold mt-1 focus:ring-2 focus:ring-green-500 outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <button 
                onClick={handlePay}
                className="w-full bg-green-600 text-white rounded-xl py-4 font-black text-sm uppercase tracking-wider hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                Send Payment Prompt
              </button>
              <button onClick={onClose} className="w-full text-gray-400 text-xs font-bold hover:text-gray-600 uppercase tracking-widest mt-2">Cancel</button>
            </div>
          )}

          {(status === 'sending' || status === 'waiting') && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-bold text-brand-dark">
                {status === 'sending' ? 'Initiating STK Push...' : 'Waiting for customer PIN...'}
              </p>
              <p className="text-xs text-gray-400">A payment prompt has been sent to {phone}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in duration-300">
              <CheckCircle2 size={64} className="text-green-500 mx-auto" />
              <p className="font-black text-xl text-brand-dark">Payment Received!</p>
              <p className="text-sm text-gray-500 font-medium italic">KES {total.toLocaleString()} confirmed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PosPage() {
  const supabase = createClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isOnline, pendingCount } = useOnlineStatus();

  // Dexie Queries
  const localProducts = useLiveQuery(() => db.products.toArray(), []);

  useEffect(() => {
    // Sync products from Supabase to Dexie on mount if online
    const syncProducts = async () => {
      if (!isOnline) return;
      try {
        await pullProducts();
      } catch (err) {
        console.error('Initial sync failed:', err);
      }
    };
    syncProducts();
  }, [isOnline]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.selling_price ?? 0), quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleCheckout = async (method: 'Cash' | 'M-Pesa' | 'Card') => {
    if (method === 'M-Pesa') {
      setIsMpesaModalOpen(true);
      return;
    }
    completeSale(method);
  };

  const completeSale = async (method: 'Cash' | 'M-Pesa' | 'Card') => {
    const saleData = {
      branch_id: '8087796d-317f-449e-b83c-f46329432f8b', // TODO: Get from worker context
      cashier_id: 'd83c4b7a-6242-4521-8848-8cf81e3a628b', // TODO: Get from session
      receipt_number: `RCPT-${Date.now()}`,
      total_amount: total,
      discount: 0,
      tax_amount: tax,
      payment_method: method.toLowerCase() as any,
      created_at: new Date().toISOString(),
      sync_status: 'pending' as const,
      retry_count: 0
    };

    try {
      const saleId = await db.sales_queue.add(saleData);
      
      const itemEntries = cart.map(item => ({
        sale_queue_id: saleId as number,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        discount: 0,
        vat_amount: item.price * 0.16 * item.quantity
      }));

      await db.sale_items_queue.bulkAdd(itemEntries);

      if (isOnline) {
        // Trigger immediate sync attempt
        pushQueue().catch(console.error);
      }

      toast.success('Sale saved locally' + (isOnline ? ' and syncing...' : ''));
      setCart([]);
    } catch (error) {
      console.error('Failed to save sale:', error);
      toast.error('Failed to save sale locally');
    }
  };

  const filteredProducts = (localProducts || []).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(localProducts?.map(p => p.category) || []))];

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden gap-6">
      {/* Left Panel: Products */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Header: Search and Filter */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Scan barcode or search name/SKU..."
                className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button 
                onClick={() => setIsScanning(!isScanning)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-colors ${isScanning ? 'bg-brand-coral text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <Camera size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${category === cat ? 'bg-brand-dark text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between text-orange-700 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <WifiOff size={20} />
              <div>
                <p className="text-sm font-bold">Offline Mode Active</p>
                <p className="text-[10px] opacity-80 font-medium">{pendingCount} sales pending sync automatically.</p>
              </div>
            </div>
            <div className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Enabled</div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <Package size={40} />
                </div>
                <p className="text-gray-400 font-medium italic">No products found matching your search</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div className="w-[300px] bg-[#1A1A2E] rounded-3xl flex flex-col overflow-hidden text-white shadow-2xl relative">
        {/* Cart Header */}
        <div className="p-6 border-b border-white/5 bg-[#1f1f3a]/40">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-1">POS TERMINAL</p>
              <h2 className="text-xl font-black">Current Order</h2>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <Maximize size={18} className="text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green font-black">JD</div>
            <div>
              <p className="text-xs font-bold leading-none">John Doe</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">TILL #10294</p>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {cart.map(item => (
            <div key={item.id} className="bg-white/5 p-3 rounded-2xl relative group">
              <button 
                onClick={() => removeFromCart(item.id)}
                className="absolute -right-1 -top-1 bg-brand-coral text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
              <p className="text-xs font-bold mb-3">{item.name}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 bg-black/20 rounded-xl p-1">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:text-brand-green"><Minus size={14} /></button>
                  <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:text-brand-green"><Plus size={14} /></button>
                </div>
                <p className="text-sm font-black text-brand-green">KES {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-20 py-20">
              <ShoppingCart size={48} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="p-6 space-y-4 bg-white/5 border-t border-white/5">
          <div className="space-y-2 text-[11px] font-bold text-gray-400">
            <div className="flex justify-between">
              <span>SUBTOTAL</span>
              <span className="text-white">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (16%)</span>
              <span className="text-white">KES {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>DISCOUNT</span>
              <span className="text-brand-coral">- KES 0</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex justify-between items-end">
            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Total Amount</span>
            <span className="text-2xl font-black text-brand-green leading-none">KES {total.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleCheckout('Cash')}
              className="bg-white/10 hover:bg-white/20 text-xs font-bold py-3 rounded-2xl flex flex-col items-center gap-1 transition-all"
            >
              <Banknote size={18} className="text-blue-400" />
              CASH
            </button>
            <button 
              onClick={() => handleCheckout('Card')}
              className="bg-white/10 hover:bg-white/20 text-xs font-bold py-3 rounded-2xl flex flex-col items-center gap-1 transition-all"
            >
              <CreditCard size={18} className="text-gray-400" />
              CARD
            </button>
            <button 
              onClick={() => handleCheckout('M-Pesa')}
              className="col-span-2 bg-[#1D9E75] hover:bg-[#188c67] text-white text-xs font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/40"
            >
              <Smartphone size={18} />
              M-PESA PAY
            </button>
          </div>

          <button 
            disabled={cart.length === 0}
            className="w-full bg-[#E57373] hover:bg-[#ef5350] disabled:opacity-30 disabled:hover:bg-[#E57373] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-red-900/20 mt-2"
          >
            Charge KES {total.toLocaleString()}
          </button>
        </div>
      </div>

      {/* Modals */}
      <MpesaModal 
        isOpen={isMpesaModalOpen} 
        onClose={() => setIsMpesaModalOpen(false)} 
        total={total}
        onSuccess={() => completeSale('M-Pesa')}
      />

      {/* Barcode Scanner Overlay (Placeholder for actual video stream) */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg aspect-square border-4 border-brand-green rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-green/20 to-transparent animate-scan" style={{ top: '-100%', animation: 'scan 2s linear infinite' }} />
            <div className="absolute inset-0 flex items-center justify-center flex-col text-white gap-4">
              <Camera size={64} className="opacity-50" />
              <p className="font-bold text-center px-10 tracking-widest uppercase text-sm">Align barcode within the frame</p>
            </div>
          </div>
          <button 
            onClick={() => setIsScanning(false)}
            className="absolute top-10 right-10 bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl transition-all"
          >
            <X size={32} />
          </button>
        </div>
      )}

      {/* Component Specific Styles */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(512px); }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thumb-brand-green::-webkit-scrollbar-thumb {
          background-color: #1D9E75;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
