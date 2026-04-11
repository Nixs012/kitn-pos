'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Package, 
  AlertTriangle, 
  MinusCircle, 
  Plus, 
  RotateCcw, 
  Search,
  ArrowRightCircle,
  FileDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { safeQuery } from '@/lib/supabase/handleError';
import * as toast from '@/lib/toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SkeletonCard, SkeletonTableRow } from '@/components/ui/Skeleton';

interface InventoryItem {
  id: string; // product id
  name: string;
  sku: string;
  category: string;
  unit: string;
  inventory: {
    id: string;
    quantity: number;
    reorder_level: number;
    last_restocked: string | null;
  }[];
}

const REASONS = [
  'Damaged goods',
  'Counting error',
  'Theft',
  'Expiry',
  'Other'
];

export default function InventoryPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const searchId = searchParams.get('search');
  
  // Modals state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  
  // Form state
  const [restockData, setRestockData] = useState({
    quantity: '',
    supplier: '',
    cost: ''
  });
  const [adjustmentData, setAdjustmentData] = useState({
    productId: '',
    newQuantity: '',
    reason: REASONS[0]
  });

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const user = await safeQuery<{ user: { id: string; email?: string } }>(
        () => supabase.auth.getUser(),
        'get user'
      );
      if (!user) return;

      const profile = await safeQuery<{ branch_id: string }>(
        () => supabase
          .from('user_profiles')
          .select('branch_id')
          .eq('id', user.user.id)
          .single(),
        'load profile'
      );

      if (profile?.branch_id) {
        setBranchId(profile.branch_id);
        
        const data = await safeQuery<InventoryItem[]>(
          () => supabase
            .from('products')
            .select(`
              id, name, sku, category, unit,
              inventory!inner (
                id, quantity, reorder_level, last_restocked
              )
            `)
            .eq('inventory.branch_id', profile.branch_id)
            .eq('is_active', true)
            .order('name'),
          'load inventory'
        );

        setInventory(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchInventory();
    document.title = 'Inventory — KiTN POS';
  }, [fetchInventory]);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !branchId) return;

    try {
      const addedQty = Number(restockData.quantity);
      const currentInv = selectedProduct.inventory[0];
      const newQty = currentInv.quantity + addedQty;

      // 1. Update Inventory
      const success = await safeQuery(
        () => supabase
          .from('inventory')
          .update({ 
            quantity: newQty,
            last_restocked: new Date().toISOString()
          })
          .eq('id', currentInv.id),
        'update inventory'
      );

      if (success === null) return;

      // 2. Log Movement
      const user = await safeQuery<{ user: { id: string; email?: string } }>(
        () => supabase.auth.getUser(),
        'get user'
      );
      
      await safeQuery(
        () => supabase.from('stock_movements').insert({
          product_id: selectedProduct.id,
          branch_id: branchId,
          type: 'restock',
          quantity_change: addedQty,
          created_by: user?.user.id,
          reference_id: restockData.supplier || 'Restock'
        }),
        'log movement'
      );

      toast.showSuccess(`Stock updated — ${selectedProduct.name} now has ${newQty} ${selectedProduct.unit}`);
      setIsRestockModalOpen(false);
      setRestockData({ quantity: '', supplier: '', cost: '' });
      fetchInventory();
    } finally {
      // safeQuery handles the toast
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = inventory.find(p => p.id === adjustmentData.productId);
    if (!product || !branchId) return;

    try {
      const newQty = Number(adjustmentData.newQuantity);
      const currentInv = product.inventory[0];
      const diff = newQty - currentInv.quantity;

      // 1. Update Inventory
      const success = await safeQuery(
        () => supabase
          .from('inventory')
          .update({ quantity: newQty })
          .eq('id', currentInv.id),
        'adjust inventory'
      );

      if (success === null) return;

      // 2. Log Movement
      const user = await safeQuery<{ user: { id: string; email?: string } }>(
        () => supabase.auth.getUser(),
        'get user'
      );
      
      await safeQuery(
        () => supabase.from('stock_movements').insert({
          product_id: product.id,
          branch_id: branchId,
          type: 'adjustment',
          quantity_change: diff,
          created_by: user?.user.id,
          reference_id: adjustmentData.reason
        }),
        'log adjustment movement'
      );

      toast.showSuccess(`Adjustment recorded for ${product.name}`);
      setIsAdjustmentModalOpen(false);
      setAdjustmentData({ productId: '', newQuantity: '', reason: REASONS[0] });
      fetchInventory();
    } finally {
      // safeQuery handles the toast
    }
  };

  // Calculations for Summary Cards
  const lowStockCount = inventory.filter(i => i.inventory[0].quantity <= i.inventory[0].reorder_level && i.inventory[0].quantity > 0).length;
  const outOfStockCount = inventory.filter(i => i.inventory[0].quantity === 0).length;
  const totalProducts = inventory.length;

  const filteredInventory = inventory.filter(i => {
    if (searchId && i.id === searchId) return true;
    if (searchId) return false; // If searching for a specific ID, don't show others
    
    return i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
           i.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <ErrorBoundary section="Inventory Management">
      <div className="space-y-8 animate-in fade-in duration-500">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory' }]} />
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark tracking-tighter flex items-center gap-3">
            Inventory Management
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Monitor, adjust, and restock your catalog items.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw size={18} className="mr-2" />
            Stock Adjustment
          </Button>
          <Button onClick={() => setIsRestockModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Restock
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-green/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <Package className="text-brand-green" size={24} />
                </div>
              </div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">Total Products</p>
              <h3 className="text-3xl font-black text-brand-dark mt-1">{totalProducts}</h3>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <AlertTriangle className="text-orange-500" size={24} />
                </div>
                <div className="bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                  <span className="text-[10px] font-black text-orange-600 uppercase">Urgent</span>
                </div>
              </div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">Low Stock Items</p>
              <h3 className="text-3xl font-black text-orange-500 mt-1">{lowStockCount}</h3>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <MinusCircle className="text-red-500" size={24} />
                </div>
                <div className="bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                  <span className="text-[10px] font-black text-red-600 uppercase">Alert</span>
                </div>
              </div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">Out of Stock</p>
              <h3 className="text-3xl font-black text-red-500 mt-1">{outOfStockCount}</h3>
            </div>
          </>
        )}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header Filter */}
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, SKU or category..." 
              className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-brand-dark focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-gray-500 font-bold text-xs uppercase px-4 h-12 rounded-xl border-none">
              <FileDown size={18} className="mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Table headers={['Product Name', 'SKU', 'Category', 'Current Stock', 'Unit', 'Reorder Level', 'Status', 'Last Restocked', 'Actions']} loading={loading}>
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))
          ) : filteredInventory.length === 0 ? (
            <tr><td colSpan={9} className="py-20 text-center text-gray-400 font-medium">No results found for &ldquo;{searchTerm}&rdquo;</td></tr>
          ) : filteredInventory.map(item => {
            const stock = item.inventory[0].quantity;
            const reorder = item.inventory[0].reorder_level;
            const isLow = stock <= reorder && stock > 0;
            const isOut = stock === 0;

            let status = { text: 'In Stock', color: 'bg-green-50 text-green-600 border-green-100' };
            if (isLow) status = { text: 'Low Stock', color: 'bg-orange-50 text-orange-600 border-orange-100' };
            if (isOut) status = { text: 'Out of Stock', color: 'bg-red-50 text-red-600 border-red-100' };

            return (
              <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${isLow ? 'bg-orange-50/30' : ''} ${isOut ? 'bg-red-50/30' : ''}`}>
                <td className="px-8 py-5">
                  <div className="font-bold text-brand-dark text-sm">{item.name}</div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-black px-2 py-1 bg-gray-100 text-gray-500 rounded-md uppercase tracking-wider">{item.sku}</span>
                </td>
                <td className="px-8 py-5 text-gray-500 font-medium text-[13px]">{item.category}</td>
                <td className="px-8 py-5">
                  <span className={`text-sm font-black ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-brand-dark'}`}>
                    {stock}
                  </span>
                </td>
                <td className="px-8 py-5 text-gray-400 font-bold uppercase text-[11px]">{item.unit}</td>
                <td className="px-8 py-5 text-gray-500 text-sm">{reorder}</td>
                <td className="px-8 py-5">
                  <div className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${status.color} uppercase tracking-wider inline-block`}>
                    {status.text}
                  </div>
                </td>
                <td className="px-8 py-5 text-gray-400 text-[11px]">
                  {item.inventory[0].last_restocked ? new Date(item.inventory[0].last_restocked).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-8 py-5">
                  <button 
                    onClick={() => { setSelectedProduct(item); setIsRestockModalOpen(true); }}
                    className="p-2.5 hover:bg-white hover:shadow-lg rounded-xl transition-all text-brand-green group relative"
                  >
                    <ArrowRightCircle size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Restock</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>

      {/* Restock Modal */}
      <Modal 
        isOpen={isRestockModalOpen} 
        onClose={() => setIsRestockModalOpen(false)}
        title="Restock Product"
        size="md"
      >
        <form onSubmit={handleRestock} className="space-y-6">
          <div className="bg-brand-green/5 p-6 rounded-3xl border border-brand-green/10 mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">Selected Product</p>
              <h4 className="text-lg font-black text-brand-dark mt-1">{selectedProduct?.name || 'Select a product'}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Stock</p>
              <p className="text-xl font-black text-brand-green">{selectedProduct?.inventory[0].quantity} {selectedProduct?.unit}</p>
            </div>
          </div>

          {!selectedProduct && (
            <div className="space-y-1.5 mb-6">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Select Product*</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                required
                onChange={e => setSelectedProduct(inventory.find(i => i.id === e.target.value) || null)}
              >
                <option value="">Choose item to restock...</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Quantity to Add*" 
              type="number" 
              required 
              value={restockData.quantity}
              onChange={e => setRestockData({...restockData, quantity: e.target.value})}
              placeholder="e.g. 50"
            />
            <Input 
              label="Cost per Unit (KES)" 
              type="number" 
              value={restockData.cost}
              onChange={e => setRestockData({...restockData, cost: e.target.value})}
              placeholder="0.00"
            />
            <div className="md:col-span-2">
              <Input 
                label="Supplier Name" 
                value={restockData.supplier}
                onChange={e => setRestockData({...restockData, supplier: e.target.value})}
                placeholder="e.g. Brookside Dairy Ltd"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-8">
            <Button type="button" variant="ghost" onClick={() => { setIsRestockModalOpen(false); setSelectedProduct(null); }}>Cancel</Button>
            <Button type="submit" disabled={!selectedProduct}>Add Stock</Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment Modal */}
      <Modal 
        isOpen={isAdjustmentModalOpen} 
        onClose={() => setIsAdjustmentModalOpen(false)}
        title="Stock Adjustment"
        size="md"
      >
        <form onSubmit={handleAdjustment} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Select Product*</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                required
                value={adjustmentData.productId}
                onChange={e => setAdjustmentData({...adjustmentData, productId: e.target.value})}
              >
                <option value="">Choose item to adjust...</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Current: {i.inventory[0].quantity} {i.unit})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Input 
                label="New Total Quantity*" 
                type="number" 
                required 
                value={adjustmentData.newQuantity}
                onChange={e => setAdjustmentData({...adjustmentData, newQuantity: e.target.value})}
                placeholder="Corrected count"
              />
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Reason for Adjustment*</label>
                <select 
                  className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                  required
                  value={adjustmentData.reason}
                  onChange={e => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                >
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
              <AlertTriangle className="text-orange-500 mt-1" size={20} />
              <div>
                <p className="text-[11px] font-bold text-orange-700 leading-relaxed uppercase tracking-wider">Warning</p>
                <p className="text-[10px] text-orange-600 mt-0.5 leading-relaxed">
                  This action will manually override the current stock level. This will be logged in the audit history for branch reconciliation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-8">
            <Button type="button" variant="ghost" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!adjustmentData.productId}>Update Quantity</Button>
          </div>
        </form>
      </Modal>
      </div>
    </ErrorBoundary>
  );
}
