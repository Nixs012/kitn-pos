'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRightLeft, AlertCircle, ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Branch {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
}

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialFromBranchId?: string;
}

export default function StockTransferModal({
  isOpen,
  onClose,
  onSuccess,
  initialFromBranchId
}: StockTransferModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [fromBranchId, setFromBranchId] = useState(initialFromBranchId || '');
  const [toBranchId, setToBranchId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Rebalancing');
  const [notes, setNotes] = useState('');

  const fetchInitialData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) return;

      const [branchesRes, productsRes] = await Promise.all([
        supabase.from('branches').select('id, name').eq('tenant_id', profile.tenant_id),
        supabase.from('products').select('id, name, unit').eq('tenant_id', profile.tenant_id)
      ]);

      if (branchesRes.data) setBranches(branchesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  }, [supabase]);

  const fetchCurrentStock = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('branch_id', fromBranchId)
        .eq('product_id', selectedProductId)
        .single();
      
      setCurrentStock(data?.quantity || 0);
    } catch (err) {
      console.error('Stock fetch error:', err);
      setCurrentStock(0);
    }
  }, [fromBranchId, selectedProductId, supabase]);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, fetchInitialData]);

  useEffect(() => {
    if (fromBranchId && selectedProductId) {
      fetchCurrentStock();
    } else {
      setCurrentStock(null);
    }
  }, [fromBranchId, selectedProductId, fetchCurrentStock]);

  const handleTransfer = async () => {
    if (!fromBranchId || !toBranchId || !selectedProductId || !quantity) {
      toast.error('All fields marked with * are required');
      return;
    }

    if (fromBranchId === toBranchId) {
      toast.error('Source and destination branches must be different');
      return;
    }

    const transferQty = Number(quantity);
    if (isNaN(transferQty) || transferQty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (currentStock !== null && transferQty > currentStock) {
      toast.error('Transfer quantity exceeds current stock at source');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Tenant profile not found');

      // Start the transfer process
      // Note: We'll use individual queries for simplicity, though a stored procedure is safer
      
      // 1. Deduct from source
      const { error: deductError } = await supabase.rpc('decrement_inventory', {
        p_product_id: selectedProductId,
        p_branch_id: fromBranchId,
        p_amount: transferQty
      });
      // Fallback if RPC isn't available
      if (deductError) {
        await supabase.from('inventory')
          .update({ quantity: (currentStock || 0) - transferQty })
          .eq('product_id', selectedProductId)
          .eq('branch_id', fromBranchId);
      }

      // 2. Add to destination
      const { data: destInv } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', selectedProductId)
        .eq('branch_id', toBranchId)
        .single();
      
      if (destInv) {
        await supabase.from('inventory')
          .update({ quantity: (destInv.quantity || 0) + transferQty })
          .eq('product_id', selectedProductId)
          .eq('branch_id', toBranchId);
      } else {
        await supabase.from('inventory')
          .insert({
            product_id: selectedProductId,
            branch_id: toBranchId,
            quantity: transferQty,
            reorder_level: 10
          });
      }

      // 3. Insert Stock Movements
      const product = products.find(p => p.id === selectedProductId);
      const fromBranch = branches.find(b => b.id === fromBranchId);
      const toBranch = branches.find(b => b.id === toBranchId);

      await supabase.from('stock_movements').insert([
        {
          product_id: selectedProductId,
          branch_id: fromBranchId,
          destination_branch_id: toBranchId,
          type: 'transfer_out',
          quantity_change: -transferQty,
          created_by: user.id
        },
        {
          product_id: selectedProductId,
          branch_id: toBranchId,
          type: 'transfer_in',
          quantity_change: transferQty,
          created_by: user.id
        }
      ]);

      toast.success(`Transferred ${transferQty} ${product?.unit || ''} of ${product?.name} from ${fromBranch?.name} to ${toBranch?.name}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Transfer error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete transfer';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[550px] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-dark tracking-tighter">Stock Transfer</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inter-Branch Movement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 h-fit">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">From Outlet*</label>
              <select 
                value={fromBranchId} 
                onChange={(e) => setFromBranchId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none appearance-none"
              >
                <option value="">Select Source</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">To Outlet*</label>
              <select 
                value={toBranchId} 
                onChange={(e) => setToBranchId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none appearance-none"
              >
                <option value="">Select Destination</option>
                {branches.filter(b => b.id !== fromBranchId).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Product*</label>
            <div className="relative">
              <select 
                value={selectedProductId} 
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-10 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none appearance-none"
              >
                <option value="">Search and select product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
              <ShoppingBag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {currentStock !== null && (
            <div className="p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="text-brand-green" />
                <span className="text-xs font-bold text-brand-green uppercase tracking-tight">Available at Source</span>
              </div>
              <span className="text-sm font-black text-brand-green">{currentStock} {products.find(p => p.id === selectedProductId)?.unit}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Quantity to Transfer*</label>
            <input 
              type="number"
              placeholder="e.g. 50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Reason</label>
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none appearance-none"
              >
                <option value="Rebalancing">Rebalancing</option>
                <option value="Excess Stock">Excess Stock</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Notes (Optional)</label>
              <textarea 
                placeholder="Any specific details about this transfer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none h-24 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8 bg-gray-50 border-t border-gray-100">
          <Button 
            onClick={handleTransfer}
            loading={loading}
            className="w-full py-4 bg-[#378ADD] hover:bg-[#378ADD]/90 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20"
          >
            Confirm Transfer
          </Button>
        </div>
      </div>
    </div>
  );
}
