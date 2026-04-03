'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Download,
  Package,
  AlertCircle,
  Camera,
  Upload,
  X,
  ImageIcon,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import BarcodeScanner from '@/components/pos/BarcodeScanner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';


// Components
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Papa from 'papaparse';

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
  image_url: string | null;
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
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

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
    initial_stock: 0,
    image_url: ''
  });

  // Global Barcode Scanner Listener
  useBarcodeScanner({
    onScan: (code) => {
      if (isAddModalOpen || isEditModalOpen) {
        // If adding/editing, fill the barcode field
        setFormData(prev => ({ ...prev, barcode: code }));
        toast.success(`Barcode detected: ${code}`);
      } else {
        // Otherwise, use it to search the catalog
        setSearch(code);
        toast.success(`Searching for: ${code}`);
      }
    }
  });


  const fetchProducts = useCallback(async (tenantId?: string) => {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to load products: ' + message);
    } finally {
      setLoading(false);
    }
  }, [supabase, profile?.tenant_id]);

  const loadInitialData = useCallback(async () => {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Session error: ' + message);
    }
  }, [supabase, fetchProducts]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 52428800) { // 50MB
      toast.error('File size exceeds 50MB limit');
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setTempImageUrl(publicUrl);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!profile) throw new Error('User profile not loaded');

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
          unit: formData.unit,
          image_url: formData.image_url
        })
        .select()
        .single();

      if (pError) throw pError;

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
        buying_price: 0, selling_price: 0, vat_rate: 16, unit: 'pcs', 
        initial_stock: 0, image_url: ''
      });
      setTempImageUrl(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(message);
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
          unit: formData.unit,
          image_url: formData.image_url
        })
        .eq('id', currentProduct.id);

      if (error) throw error;

      toast.success('Product updated');
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(message);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(message);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const loadingToast = toast.loading('Importing products...');

    interface CSVRow {
      Name?: string;
      name?: string;
      Category?: string;
      category?: string;
      'Buying Price'?: string;
      buying_price?: string;
      'Selling Price'?: string;
      selling_price?: string;
      SKU?: string;
      sku?: string;
      Unit?: string;
      unit?: string;
      Stock?: string;
      stock?: string;
      Barcode?: string;
      barcode?: string;
    }

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const productsData = results.data.map((row) => ({
            name: row.Name || row.name || 'Untitled Product',
            category: row.Category || row.category || 'Uncategorized',
            buying_price: parseFloat(row['Buying Price'] || row.buying_price || '0') || 0,
            selling_price: parseFloat(row['Selling Price'] || row.selling_price || '0') || 0,
            sku: row.SKU || row.sku || '',
            unit: row.Unit || row.unit || 'pcs',
            stock: parseInt(row.Stock || row.stock || '0') || 0,
            barcode: row.Barcode || row.barcode || ''
          }));

          const response = await fetch('/api/products/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: productsData })
          });

          const data = await response.json();

          if (data.success) {
            toast.success(`Successfully imported ${data.count} products`, { id: loadingToast });
            fetchProducts();
          } else {
            throw new Error(data.error || 'Import failed');
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Import failed';
          toast.error(message, { id: loadingToast });
        } finally {
          setIsImporting(false);
          if (e.target) e.target.value = '';
        }
      },
      error: (error) => {
        toast.error('CSV Parsing Error: ' + error.message, { id: loadingToast });
        setIsImporting(false);
      }
    });
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
      initial_stock: product.inventory?.[0]?.quantity || 0,
      image_url: product.image_url || ''
    });
    setTempImageUrl(product.image_url || null);
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
    <>
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
            <input 
              type="file" 
              id="csv-import" 
              className="hidden" 
              accept=".csv" 
              disabled={isImporting}
              onChange={handleImportCSV} 
            />
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => document.getElementById('csv-import')?.click()}
              loading={isImporting}
            >
              <Download size={16} /> Import CSV
            </Button>
            <Button 
              onClick={() => {
                setFormData({
                  name: '', barcode: '', sku: '', category: 'Cooking',
                  buying_price: 0, selling_price: 0, vat_rate: 16, unit: 'pcs', 
                  initial_stock: 0, image_url: ''
                });
                setTempImageUrl(null);
                setIsAddModalOpen(true);
              }} 
              className="gap-2"
            >
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
          {filteredProducts.length > 0 ? filteredProducts.map((p, i) => {
            const stock = p.inventory?.[0]?.quantity || 0;
            const reorder = p.inventory?.[0]?.reorder_level || 10;
            
            let stockVariant: 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'purple' | 'brand' = 'success';
            let stockLabel = 'In Stock';
            if (stock === 0) {
              stockVariant = 'danger';
              stockLabel = 'Out of Stock';
            } else if (stock < reorder) {
              stockVariant = 'warning';
              stockLabel = 'Low Stock';
            }

            return (
              <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{i + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform overflow-hidden relative">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                      ) : (
                        <Package size={16} />
                      )}
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
          }) : (
            <tr>
              <td colSpan={11} className="py-20 text-center font-medium text-gray-400 italic">
                No products found matching your search.
              </td>
            </tr>
          )}
        </Table>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setIsScannerOpen(false); }}
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
              <div className="relative">
                <Input 
                  label="Barcode" 
                  value={formData.barcode}
                  onChange={e => setFormData({...formData, barcode: e.target.value})}
                  placeholder="600123..."
                  className="pr-12"
                />
                <button 
                  type="button"
                  onClick={() => setIsScannerOpen(!isScannerOpen)}
                  className="absolute right-2 bottom-2 p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-brand-green hover:text-white transition-all"
                >
                  <Camera size={16} />
                </button>
              </div>
              <Input 
                label="SKU" 
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                placeholder="PROD-001"
              />
            </div>

            {isScannerOpen && (
              <div className="col-span-full border-2 border-dashed border-brand-green/20 rounded-2xl p-4 bg-brand-green/5">
                <BarcodeScanner 
                  onScan={(code) => {
                    setFormData({...formData, barcode: code});
                    setIsScannerOpen(false);
                    toast.success('Barcode scanned: ' + code);
                  }}
                  onClose={() => setIsScannerOpen(false)}
                />
              </div>
            )}

            <div className="col-span-full space-y-3">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Product Image (Max 50MB)</label>
              <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="relative w-24 h-24 bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {tempImageUrl ? (
                    <>
                      <Image src={tempImageUrl} alt="Preview" fill className="object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setTempImageUrl(null); setFormData({...formData, image_url: ''}); }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="text-gray-200" size={32} />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <RefreshCw className="animate-spin text-brand-green" size={24} />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-brand-dark">Upload representative photo</p>
                  <p className="text-[10px] text-gray-400 font-medium">Supports JPG, PNG, WEBP up to 50MB</p>
                  <input 
                    type="file" 
                    id="product-image" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-brand-blue"
                    onClick={() => document.getElementById('product-image')?.click()}
                  >
                    <Upload size={14} className="mr-2" /> Choose File
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c} className="text-black bg-white">
                      {c}
                    </option>
                  ))}
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
                  className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                  value={formData.vat_rate}
                  onChange={e => setFormData({...formData, vat_rate: Number(e.target.value)})}
                >
                  <option value={0} className="text-black bg-white">0% (Exempt)</option>
                  <option value={16} className="text-black bg-white">16% (Standard)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Unit</label>
                <select 
                  className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                >
                  {UNITS.map(u => (
                      <option key={u} value={u} className="text-black bg-white">
                        {u.toUpperCase()}
                      </option>
                    ))}
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
            <Button type="button" variant="ghost" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setIsScannerOpen(false); }}>Cancel</Button>
            <Button type="submit">{isAddModalOpen ? 'Create Product' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

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
            <p className="text-xs text-brand-blue font-black mt-2">&ldquo;{currentProduct?.name}&rdquo;</p>
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
    </>
  );
}
