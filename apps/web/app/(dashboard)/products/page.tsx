'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  Download,
  Package,
  ChevronRight,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

// Types from schema
interface Product {
  id: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  category: string;
  buying_price: number;
  selling_price: number;
  vat_rate: number;
  unit: string;
  is_active: boolean;
  inventory: {
    quantity: number;
    reorder_level: number;
  }[];
}

const CATEGORIES = [
  'All', 'Flour & Grains', 'Cooking', 'Dairy', 'Bakery', 
  'Drinks', 'Cleaning', 'Spices', 'Spreads', 'Personal Care'
];

const UNITS = ['pcs', 'kg', 'litres', 'packet', 'bottle', 'bag', 'box', 'tray', 'loaf', 'tub'];

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [profile, setProfile] = useState<{ tenant_id: string, branch_id: string } | null>(null);


  // Form states
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    sku: '',
    category: 'All',
    buying_price: 0,
    selling_price: 0,
    vat_rate: 16,
    unit: 'pcs',
    initial_stock: 0
  });

  const fetchProducts = async (tenantId?: string) => {
    try {
      setLoading(true);
      const tid = tenantId || profile?.tenant_id;
      if (!tid) return;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          inventory(quantity, reorder_level)
        `)
        .eq('tenant_id', tid)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error('Failed to load products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('tenant_id, branch_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      fetchProducts(profileData.tenant_id);
    } catch (error: any) {
      toast.error('Session error: ' + error.message);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);


  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!profile) throw new Error('User profile not loaded');

      // 1. Insert Product
      const { data: product, error: pError } = await supabase
        .from('products')
        .insert({
          tenant_id: profile.tenant_id,
          name: formData.name,
          barcode: formData.barcode,
          sku: formData.sku,
          category: formData.category,
          buying_price: formData.buying_price,
          selling_price: formData.selling_price,
          vat_rate: formData.vat_rate,
          unit: formData.unit
        })
        .select()
        .single();


      if (pError) throw pError;

      // 2. Insert Inventory (default to user's branch if available)
      const { error: iError } = await supabase
        .from('inventory')
        .insert({
          product_id: product.id,
          branch_id: profile.branch_id,
          quantity: formData.initial_stock,
          reorder_level: 10
        });


      if (iError) throw iError;

      toast.success('Product added successfully');
      setIsAddModalOpen(false);
      fetchProducts();
      setFormData({
        name: '', barcode: '', sku: '', category: 'All',
        buying_price: 0, selling_price: 0, vat_rate: 16, unit: 'pcs', initial_stock: 0
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          barcode: formData.barcode,
          sku: formData.sku,
          category: formData.category,
          buying_price: formData.buying_price,
          selling_price: formData.selling_price,
          vat_rate: formData.vat_rate,
          unit: formData.unit
        })
        .eq('id', currentProduct.id);

      if (error) throw error;

      toast.success('Product updated');
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!currentProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', currentProduct.id);

      if (error) throw error;

      toast.success('Product deleted');
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      sku: product.sku || '',
      category: product.category,
      buying_price: product.buying_price,
      selling_price: product.selling_price,
      vat_rate: product.vat_rate,
      unit: product.unit,
      initial_stock: product.inventory?.[0]?.quantity || 0
    });
    setIsEditModalOpen(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.barcode?.includes(search) || 
                          p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tighter flex items-center gap-2">
            Products Catalog
            <div className="w-2 h-2 rounded-full bg-brand-green" />
          </h1>
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">Manage your inventory items</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download size={16} /> Import CSV
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus size={18} /> Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border-[0.5px] border-gray-200 shadow-sm space-y-4">
        <div className="max-w-md">
          <Input 
            placeholder="Search by name, barcode or SKU..." 
            icon={<Search size={18} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                selectedCategory === cat 
                ? 'bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20 scale-105' 
                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <Table headers={['#', 'Product Name', 'Barcode', 'Category', 'Buy Price', 'Sell Price', 'VAT', 'Unit', 'Stock', 'Status', 'Actions']} loading={loading}>
        {filteredProducts.map((p, i) => {
          const stock = p.inventory?.[0]?.quantity || 0;
          const reorder = p.inventory?.[0]?.reorder_level || 10;
          
          let stockVariant: any = 'success';
          let stockLabel = 'In Stock';
          if (stock <= 0) {
            stockVariant = 'danger';
            stockLabel = 'Out of Stock';
          } else if (stock <= reorder) {
            stockVariant = 'warning';
            stockLabel = 'Low Stock';
          }

          return (
            <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{i + 1}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                    <Package size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-brand-dark">{p.name}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{p.sku || 'NO SKU'}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-gray-700">{p.barcode || '-'}</td>
              <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{p.category}</td>
              <td className="px-6 py-4 text-[11px] font-black text-gray-600">KES {p.buying_price?.toLocaleString()}</td>
              <td className="px-6 py-4 text-[11px] font-black text-brand-green">KES {p.selling_price?.toLocaleString()}</td>
              <td className="px-6 py-4 text-[10px] font-bold text-gray-500">{p.vat_rate}%</td>
              <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">{p.unit}</td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <p className="text-xs font-black text-brand-dark">{stock} <span className="text-[9px] text-gray-400">{p.unit}</span></p>
                  <Badge variant={stockVariant}>{stockLabel}</Badge>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge variant={p.is_active ? 'success' : 'gray'}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(p)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => { setCurrentProduct(p); setIsDeleteModalOpen(true); }}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>

      {/* Add/Edit Modal Content */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isAddModalOpen ? 'Create New Product' : 'Edit Product'}
        size="lg"
      >
        <form onSubmit={isAddModalOpen ? handleAddProduct : handleEditProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Product Name*" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Premium Basmati Rice"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Barcode" 
                value={formData.barcode}
                onChange={e => setFormData({...formData, barcode: e.target.value})}
                placeholder="600123..."
              />
              <Input 
                label="SKU" 
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                placeholder="PROD-001"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Buying Price (KES)*" 
                type="number" 
                required 
                value={formData.buying_price}
                onChange={e => setFormData({...formData, buying_price: Number(e.target.value)})}
              />
              <Input 
                label="Selling Price (KES)*" 
                type="number" 
                required 
                value={formData.selling_price}
                onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">VAT Rate</label>
                <select 
                  className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                  value={formData.vat_rate}
                  onChange={e => setFormData({...formData, vat_rate: Number(e.target.value)})}
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={16}>16% (Standard)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Unit</label>
                <select 
                  className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            {isAddModalOpen && (
              <Input 
                label="Initial Stock Quantity" 
                type="number" 
                value={formData.initial_stock}
                onChange={e => setFormData({...formData, initial_stock: Number(e.target.value)})}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button type="button" variant="ghost" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
            <Button type="submit">{isAddModalOpen ? 'Create Product' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-dark">Are you sure you want to delete this product?</p>
            <p className="text-xs text-brand-blue font-black mt-2">"{currentProduct?.name}"</p>
            <p className="text-[10px] text-gray-400 mt-4 leading-relaxed">
              This action will mark the product as <span className="text-red-500 font-bold uppercase">Inactive</span>. 
              It will no longer appear in the POS terminal but transaction history will be preserved.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="danger" onClick={handleDeleteProduct}>Confirm Delete</Button>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
