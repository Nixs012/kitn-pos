'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Camera, 
  Package,
  Plus, 
  Minus, 
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Printer,
  ShoppingCart
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/stores/cartStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';

// --- Types ---

interface Inventory {
  quantity: number;
  reorder_level: number;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  unit?: string;
  category: string;
  reorder_level?: number;
  inventory?: Inventory[];
  vat_rate: number;
  barcode: string | null;
  [key: string]: unknown;
}

interface SaleItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  vat_rate: number;
}

interface UserProfile {
  id: string;
  tenant_id: string;
  branch_id: string;
  role: string;
  full_name: string;
}

interface Sale {
  id: string;
  receipt_number: string;
  total_amount: number;
  discount?: number;
  tax_amount?: number;
  payment_method: string;
  created_at: string;
}

// --- Components ---

const ProductCard = ({ product, onAdd }: { product: Product, onAdd: (p: Product) => void }) => {
  const stock = Number(product.inventory?.[0]?.quantity ?? 0);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= (product.reorder_level ?? 10);
  const [isFlash, setIsFlash] = useState(false);

  const handleClick = () => {
    if (isOutOfStock) return;
    onAdd(product);
    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 200);
  };
  
  return (
    <div 
      onClick={handleClick}
      className={`bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm transition-all duration-300 relative overflow-hidden group ${
        isOutOfStock ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-xl hover:border-brand-green/30 cursor-pointer active:scale-95'
      } ${isFlash ? 'bg-green-50 border-brand-green/50' : ''}`}
    >
      {isOutOfStock && (
        <div className="absolute inset-0 bg-gray-50/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
          <Badge variant="danger" className="font-black px-4 py-2 text-xs uppercase tracking-widest shadow-lg">Out of Stock</Badge>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform duration-500">
          <Package size={24} />
        </div>
        {isLowStock && !isOutOfStock && (
          <Badge variant="warning" className="text-[9px] font-black uppercase tracking-tighter bg-orange-100 text-orange-700">Low</Badge>
        )}
      </div>

      <h3 className="font-black text-brand-dark mb-1 line-clamp-2 min-h-[40px] leading-tight">{product.name}</h3>
      <div className="mt-4 flex flex-col gap-1">
        <p className="font-black text-brand-green text-xl tracking-tight">
          <span className="text-[10px] text-gray-400 mr-1 uppercase">KES</span>
          {(product.selling_price ?? 0).toLocaleString()}
        </p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {stock} {product.unit || 'pcs'} avail.
        </p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-brand-green text-white flex items-center justify-center shadow-lg">
          <Plus size={16} />
        </div>
      </div>
    </div>
  );
};

export default function PosPage() {
  const supabase = createClient();
  const { items, addItem, updateQuantity, removeItem, clearCart, getTotals, discount, setDiscount } = useCartStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cashierName, setCashierName] = useState('Cashier');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Payment States
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<(Sale & { items: SaleItem[] }) | null>(null);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // M-Pesa Integration States
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isWaitingForMpesa, setIsWaitingForMpesa] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setCashierName(profileData.full_name || 'Cashier');

      // Fetch products for this tenant
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, inventory(quantity, reorder_level)')
        .eq('tenant_id', profileData.tenant_id)
        .eq('is_active', true);

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (err: unknown) {
      console.error('Initial Data Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const totals = getTotals();
  const filteredProducts = products.filter(p => {
    const s = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(s) || 
                          (p.barcode?.toLowerCase()?.includes(s) ?? false) ||
                          (p.id.toLowerCase().includes(s));
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const handleCharge = async (method: 'cash' | 'mpesa' | 'card') => {
    if (items.length === 0) return;
    
    if (method === 'cash') {
      setIsCashModalOpen(true);
      setCashReceived(totals.total);
    } else if (method === 'mpesa') {
      setIsMpesaModalOpen(true);
    } else {
      completeSale('card');
    }
  };

  const completeSale = async (method: 'cash' | 'mpesa' | 'card' = 'cash', mpesaRef?: string) => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return null;
    }

    try {
      setIsProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      const branchId = profile?.branch_id;
      const tenantId = profile?.tenant_id;

      if (!branchId || !tenantId) throw new Error('User profile not loaded');

      const receiptNumber = `RCPT-${Date.now().toString().slice(-8)}`;

      // 1. Create Sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          branch_id: branchId,
          cashier_id: user?.id,
          receipt_number: receiptNumber,
          total_amount: totals.total,
          discount: discount,
          tax_amount: totals.vat,
          payment_method: method,
          mpesa_ref: mpesaRef || null
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Insert Sale Items
      for (const item of items) {
        await supabase.from('sale_items').insert({
          sale_id: sale.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          vat_amount: (item.price * item.quantity) - (item.price * item.quantity / (1 + item.vat_rate / 100))
        });

        // Update Inventory
        const currentStock = products.find(p => p.id === item.id)?.inventory?.[0]?.quantity || 0;
        await supabase
          .from('inventory')
          .update({ quantity: currentStock - item.quantity })
          .eq('product_id', item.id)
          .eq('branch_id', branchId);

        // Add Stock Movement
        await supabase.from('stock_movements').insert({
          product_id: item.id,
          branch_id: branchId,
          type: 'sale',
          quantity_change: -item.quantity,
          reference_id: sale.id,
          created_by: user?.id
        });
      }

      setLastSale({ ...sale, items });
      setIsCashModalOpen(false);
      setIsMpesaModalOpen(false);
      setIsWaitingForMpesa(false);
      setIsReceiptModalOpen(true);
      clearCart();
      setDiscount(0);
      toast.success('Sale completed successfully!');
      fetchInitialData();
      return sale;
    } catch (err: unknown) {
      console.error('Checkout Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to complete sale';
      toast.error(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMpesaPush = async () => {
    if (!mpesaPhone || !totals.total) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!/^(07|01|2547|2541|\+2547|\+2541)\d{8}$/.test(mpesaPhone)) {
      toast.error('Invalid phone number format');
      return;
    }

    try {
      setIsWaitingForMpesa(true);
      
      // 1. Create sale record first (pending state)
      const sale = await completeSale('mpesa', 'PENDING');
      if (!sale) throw new Error('Failed to create sale session');

      // 2. Trigger STK push with saleId
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: totals.total,
          saleId: sale.id,
          reference: `SALE-${sale.receipt_number}`
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('STK Push sent! Please enter your PIN on your phone.');
      
      // The callback (on the server) will update the mpesa_ref when it arrives.
      // We don't need a timeout anymore. The sale record is already there.

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'M-Pesa push failed';
      toast.error(message);
      setIsWaitingForMpesa(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
          <p className="text-xs font-black text-brand-dark uppercase tracking-widest animate-pulse">Initializing Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-500">
      
      {/* Left Column: Product Selection */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Search & Scan */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search product or scan barcode..."
              className="w-full bg-white border border-gray-100 rounded-[24px] pl-14 pr-6 py-5 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-brand-green/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-brand-green hover:text-white transition-all">
              <Camera size={20} />
            </button>
          </div>
          
          <div className="flex gap-2 bg-white/50 p-1.5 rounded-[24px] border border-gray-100 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  category === cat ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'bg-white text-gray-400 hover:text-brand-dark'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addItem} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Checkout Terminal */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-brand-dark tracking-tighter">Current Order</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{items.length} Items Selected</p>
              </div>
            </div>
            <button onClick={() => clearCart()} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale p-10">
                <ShoppingCart size={64} className="mb-4" />
                <p className="text-sm font-bold text-brand-dark uppercase tracking-widest">Cart is Empty</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-50 animate-in slide-in-from-right-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-dark text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.price.toLocaleString()} KES</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-gray-400 hover:text-brand-green"><Minus size={14} /></button>
                    <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-gray-400 hover:text-brand-green"><Plus size={14} /></button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-brand-dark">{(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeItem(item.id)} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{totals.subtotal.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>VAT (16%)</span>
                <span>{totals.vat.toLocaleString()} KES</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs font-bold text-brand-coral uppercase tracking-widest">
                  <span>Discount</span>
                  <span>-{discount.toLocaleString()} KES</span>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
              <span className="text-sm font-black text-brand-dark uppercase tracking-tighter">Total Payable</span>
              <span className="text-3xl font-black text-brand-green tracking-tighter">
                <span className="text-xs text-gray-400 mr-2 uppercase">KES</span>
                {totals.total.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-3 gap-3">
            <button onClick={() => handleCharge('cash')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-brand-blue/10 hover:text-brand-blue transition-all group">
              <Banknote size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cash</span>
            </button>
            <button onClick={() => handleCharge('mpesa')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-brand-green/10 hover:text-brand-green transition-all group">
              <Smartphone size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">M-Pesa</span>
            </button>
            <button onClick={() => handleCharge('card')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-purple-100 hover:text-purple-600 transition-all group">
              <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cash Modal */}
      <Modal isOpen={isCashModalOpen} onClose={() => setIsCashModalOpen(false)} title="Cash Payment" size="sm">
        <div className="space-y-6">
          <div className="p-6 bg-brand-green/5 rounded-3xl border border-brand-green/10 text-center">
            <p className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-1">Amount Due</p>
            <h3 className="text-3xl font-black text-brand-dark">{totals.total.toLocaleString()} <span className="text-xs text-gray-400">KES</span></h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cash Received</label>
              <input 
                type="number"
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xl font-black text-brand-dark focus:ring-4 focus:ring-brand-green/10 transition-all"
                value={cashReceived}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                autoFocus
              />
            </div>
            
            <div className="p-6 bg-gray-100 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Change Return</span>
              <span className="text-2xl font-black text-brand-coral">{Math.max(0, cashReceived - totals.total).toLocaleString()} KES</span>
            </div>
            
            <Button onClick={() => completeSale('cash')} className="w-full py-5 rounded-[26px] text-lg shadow-xl shadow-brand-green/10" disabled={cashReceived < totals.total || isProcessing}>
              {isProcessing ? 'Completing...' : 'Complete Sale'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* M-Pesa Modal */}
      <Modal 
        isOpen={isMpesaModalOpen} 
        onClose={() => !isWaitingForMpesa && setIsMpesaModalOpen(false)} 
        title="M-Pesa STK Push" 
        size="sm"
      >
        <div className="space-y-8 text-center py-6">
          <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green relative">
            <Smartphone size={48} />
            {isWaitingForMpesa && (
              <div className="absolute inset-0 border-4 border-t-brand-green border-brand-green/10 rounded-full animate-spin" />
            )}
          </div>
          
          <div>
            <h4 className="text-xl font-black text-brand-dark tracking-tighter">
              {isWaitingForMpesa ? 'Waiting for PIN...' : 'Customer Payment'}
            </h4>
            <p className="text-xs text-gray-500 font-medium mt-3 leading-relaxed px-8">
              {isWaitingForMpesa 
                ? 'We sent a request to the phone. The customer should enter their PIN to authorize.'
                : 'Enter the customer\'s mobile number to send an automated payment request.'}
            </p>
          </div>

          <div className="space-y-4">
            {!isWaitingForMpesa ? (
              <>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 italic space-y-4">
                  <div className="text-left space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">M-Pesa Number</label>
                    <input 
                      type="text"
                      placeholder="0712 XXX XXX"
                      className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-brand-dark focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all placeholder:text-gray-300"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleMpesaPush} 
                  className="w-full py-5 rounded-[26px] shadow-xl shadow-brand-green/10 group"
                  disabled={!mpesaPhone}
                >
                  Confirm & Send Push
                  <Smartphone size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount to Charge</p>
                  <p className="text-2xl font-black text-brand-green">{totals.total.toLocaleString()} KES</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-gray-400 font-bold animate-pulse">DO NOT CLOSE THIS MODAL UNTIL PAYMENT IS COMPLETE</p>
                  <Button variant="ghost" onClick={() => setIsWaitingForMpesa(false)} className="text-red-500 hover:bg-red-50">Cancel Request</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Sale Receipt" size="md">
        {lastSale && (
          <div className="p-4 space-y-6">
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center mx-auto text-brand-green font-black mb-4">Ki</div>
              <h2 className="text-2xl font-black text-brand-dark tracking-tighter">KiTN POS</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Premium Retail Solutions • Nairobi, Kenya</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-[28px] border border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <span>Receipt Number</span>
                <span className="text-brand-dark">{lastSale.receipt_number}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <span>Date & Time</span>
                <span className="text-brand-dark">{new Date(lastSale.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <span>Cashier Account</span>
                <span className="text-brand-dark">{cashierName}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest pt-3 border-t border-gray-200">
                <span>Payment Mode</span>
                <span className="text-brand-green font-black">{lastSale.payment_method}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sold Items</h4>
              <div className="space-y-2">
                {lastSale.items?.map((item: SaleItem) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
                    <div>
                      <p className="font-bold text-brand-dark text-sm">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{item.quantity} {item.unit || 'pcs'} × {item.price.toLocaleString()}</p>
                    </div>
                    <span className="font-black text-brand-dark tracking-tight">{(item.quantity * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-brand-dark p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShoppingCart size={80} />
              </div>
              <div className="relative z-10 space-y-3">
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <span>Subtotal</span>
                  <span>{Math.round(lastSale.total_amount + (lastSale.discount || 0)).toLocaleString()} KES</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <span>Discount</span>
                  <span className="text-brand-coral">-{lastSale.discount?.toLocaleString() || 0} KES</span>
                </div>
                <div className="flex justify-between items-end pt-5 border-t border-white/10 mt-2">
                  <span className="text-sm font-black text-brand-green uppercase tracking-tighter">Total Amount</span>
                  <span className="text-3xl font-black text-white tracking-widest">{Number(lastSale.total_amount).toLocaleString()} <span className="text-xs text-white/40 ml-1">KES</span></span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-brand-dark py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-gray-100"
              >
                <Printer size={16} /> Print Receipt
              </button>
              <Button onClick={() => setIsReceiptModalOpen(false)} className="flex-1 py-5 rounded-[22px] uppercase text-xs tracking-widest">
                Close Ticket
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase text-center tracking-[0.3em] py-4">Thank you for shopping with us!</p>
          </div>
        )}
      </Modal>

      {/* Styles for scrollbars and animations */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #e1e1e1;
        }
      `}</style>
    </div>
  );
}
