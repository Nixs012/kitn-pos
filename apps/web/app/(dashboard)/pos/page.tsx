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

// --- Components ---

const ProductCard = ({ product, onAdd }: { product: { id: string; name: string; inventory: Array<{ quantity: number }>; selling_price: number; unit?: string; reorder_level?: number }, onAdd: (p: { id: string; name: string; price: number; quantity: number; vat_rate: number }) => void }) => {
  const stock = Number(product.inventory?.[0]?.quantity ?? 0);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= (product.reorder_level ?? 10);
  const [isFlash, setIsFlash] = useState(false);

  const handleClick = () => {
    if (isOutOfStock) return;
    onAdd({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      vat_rate: 16 // Default VAT for now
    });
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
  
  const [products, setProducts] = useState<Array<{ 
    id: string; 
    name: string; 
    selling_price: number; 
    inventory: Array<{ quantity: number }>; 
    unit?: string; 
    reorder_level?: number; 
    category?: string; 
    barcode?: string 
  }>>([]);
  const [, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cashierName, setCashierName] = useState('Cashier');
  const [branchId, setBranchId] = useState<string | null>(null);
  
  // Payment States
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{ receipt_number: string; created_at: string; payment_method: string; total_amount: number; discount: number; items: Array<{ id: string; name: string; quantity: number; unit?: string; price: number }> } | null>(null);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, branch_id, tenant_id')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setCashierName(profile.full_name || 'Cashier');
        setBranchId(profile.branch_id);
        
        const { data: productsData } = await supabase
          .from('products')
          .select('*, inventory(*)')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true);
        
        if (productsData) setProducts(productsData);
      }
    } catch (err: unknown) {
      console.error('POS Initial Data Error:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const totals = getTotals();
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search));
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter((c): c is string => !!c)))];

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

  const completeSale = async (method: 'cash' | 'mpesa' | 'card') => {
    if (!branchId || isProcessing) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const receiptNum = `RCP-${Date.now()}`;
      
      // 1. Create Sale entry
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          branch_id: branchId,
          cashier_id: user?.id,
          receipt_number: receiptNum,
          total_amount: totals.total,
          discount: discount,
          tax_amount: totals.vat,
          payment_method: method,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Create Sale Items & Update Inventory
      for (const item of items) {
        // Add sale item
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
      setIsReceiptModalOpen(true);
      clearCart();
      toast.success('Sale completed successfully!');
      fetchInitialData(); // Refresh stock
    } catch (err: unknown) {
      console.error('Checkout Error:', err);
      toast.error('Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-8 overflow-hidden animate-in fade-in duration-700">
      
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
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-brand-dark text-white shadow-xl' : 'text-gray-400 hover:text-brand-dark'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addItem} />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-40 text-center space-y-4">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-gray-200 shadow-inner">
                  <Search size={48} />
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No products found</p>
                  <p className="text-gray-300 text-[10px] mt-1 italic">Try a different search term or category</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Checkout */}
      <div className="w-[320px] bg-brand-dark rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/5 relative">
        <div className="p-8 bg-[#1f1f3a]/30 border-b border-white/5">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-1 leading-none">ORDER LOG</p>
              <h2 className="text-2xl font-black text-white tracking-tighter leading-none">Checkout</h2>
            </div>
            <div className="bg-white/10 p-2.5 rounded-2xl">
              <ShoppingCart size={20} className="text-white" />
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-3xl flex items-center gap-4 border border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-brand-green/20 flex items-center justify-center text-brand-green font-black shadow-lg shadow-brand-green/10">
              {cashierName[0]}
            </div>
            <div>
              <p className="text-xs font-black text-white">{cashierName}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-60">Admin Server</p>
            </div>
          </div>
        </div>

        {/* Cart List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 p-4 rounded-[28px] border border-white/0 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-black text-white leading-tight line-clamp-2 pr-4">{item.name}</p>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-gray-500 hover:text-brand-coral transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-brand-green text-gray-400"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-black w-6 text-center text-white">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-brand-green text-gray-400"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-sm font-black text-brand-green">
                  {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-10 py-10 opacity-30 select-none">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <ShoppingCart size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed text-white">Tap a product to start your order</p>
            </div>
          )}
        </div>

        {/* Totals & Payment */}
        <div className="p-8 space-y-6 bg-[#1f1f3a]/40 border-t border-white/5">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-white/80">{totals.subtotal.toLocaleString()} KES</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span>VAT (16%)</span>
              <span className="text-white/80">{Math.round(totals.vat).toLocaleString()} KES</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span>Discount</span>
              <div className="flex items-center gap-2">
                <span className="text-brand-coral">KES</span>
                <input 
                  type="number" 
                  className="bg-white/10 w-16 px-2 py-1 rounded-lg text-white font-black text-right border-none focus:ring-1 focus:ring-brand-coral outline-none" 
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/10">
            <div className="flex justify-between items-end mb-6">
              <span className="text-[11px] font-black tracking-[0.2em] text-gray-500 uppercase">Amount Due</span>
              <span className="text-4xl font-black text-brand-green tracking-tighter leading-none">
                {Math.round(totals.total).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleCharge('mpesa')}
                disabled={items.length === 0}
                className="w-full bg-[#1D9E75] hover:bg-[#188c67] disabled:opacity-20 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-950/40 uppercase tracking-widest text-xs"
              >
                <Smartphone size={18} /> Pay with M-Pesa
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleCharge('cash')}
                  disabled={items.length === 0}
                  className="bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white font-black py-4 rounded-[22px] flex items-center justify-center gap-2 transition-all border border-white/5"
                >
                  <Banknote size={16} className="text-blue-400" />
                  <span className="text-[10px] uppercase tracking-widest">Cash</span>
                </button>
                <button 
                  onClick={() => handleCharge('card')}
                  disabled={items.length === 0}
                  className="bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white font-black py-4 rounded-[22px] flex items-center justify-center gap-2 transition-all border border-white/5"
                >
                  <CreditCard size={16} className="text-brand-purple" />
                  <span className="text-[10px] uppercase tracking-widest">Card</span>
                </button>
              </div>

              <button 
                onClick={() => handleCharge('cash')}
                disabled={items.length === 0 || isProcessing}
                className="w-full bg-[#D85A30] hover:bg-[#c44f2a] disabled:opacity-20 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl shadow-orange-950/40 mt-2 flex items-center justify-center gap-2"
              >
                {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : `Charge KES ${Math.round(totals.total).toLocaleString()}`}
              </button>
            </div>

            <button 
              onClick={clearCart}
              className="w-full text-brand-coral hover:text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mt-8 transition-colors active:scale-95"
            >
              Clear Current Order
            </button>
          </div>
        </div>
      </div>

      {/* Cash Payment Modal */}
      <Modal isOpen={isCashModalOpen} onClose={() => setIsCashModalOpen(false)} title="Cash Payment" size="sm">
        <div className="space-y-6">
          <div className="bg-brand-dark p-6 rounded-3xl border border-white/5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Due</p>
            <p className="text-4xl font-black text-brand-green tracking-tighter">KES {Math.round(totals.total).toLocaleString()}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cash Received</label>
              <input 
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                className="w-full bg-gray-50 border-gray-100 rounded-[22px] px-6 py-5 text-2xl font-black focus:ring-2 focus:ring-brand-green/20 outline-none mt-2"
                autoFocus
              />
            </div>

            <div className={`p-6 rounded-[24px] flex flex-col items-center justify-center border-2 border-dashed ${cashReceived >= totals.total ? 'bg-green-50/50 border-brand-green/20' : 'bg-red-50/50 border-brand-coral/20'}`}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Change</p>
              <p className={`text-4xl font-black tracking-tighter ${cashReceived >= totals.total ? 'text-brand-green' : 'text-brand-coral opacity-50'}`}>
                KES {Math.max(0, cashReceived - Math.round(totals.total)).toLocaleString()}
              </p>
            </div>

            <Button 
              onClick={() => completeSale('cash')} 
              disabled={cashReceived < totals.total || isProcessing}
              className="w-full py-5 rounded-[26px] shadow-xl shadow-brand-green/20"
            >
              {isProcessing ? 'Completing...' : 'Complete Sale'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* M-Pesa Modal */}
      <Modal isOpen={isMpesaModalOpen} onClose={() => setIsMpesaModalOpen(false)} title="M-Pesa Payment" size="sm">
        <div className="space-y-8 text-center py-6">
          <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green">
            <Smartphone size={48} />
          </div>
          <div>
            <h4 className="text-xl font-black text-brand-dark tracking-tighter">M-Pesa Integration</h4>
            <p className="text-xs text-gray-500 font-medium mt-3 leading-relaxed px-8">STK push integration and automated confirmation are scheduled for Phase 3.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Manual Verification Required
          </div>
          <Button onClick={() => completeSale('mpesa')} className="w-full py-5 rounded-[26px]">
            Simulate Payment Success
          </Button>
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
                {lastSale.items?.map((item: { id: string; name: string; quantity: number; unit?: string; price: number }) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
                    <div>
                      <p className="font-bold text-brand-dark text-sm">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{item.quantity} {item.unit} × {item.price.toLocaleString()}</p>
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
        .scrollbar-thumb-gray-200::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>

    </div>
  );
}
