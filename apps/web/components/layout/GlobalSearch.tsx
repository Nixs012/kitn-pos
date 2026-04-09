'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Receipt, ArrowRight, Command, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';

interface ProductResult {
  id: string;
  name: string;
  sku: string;
  category: string;
}

interface SaleResult {
  id: string;
  receipt_number: string;
  total_amount: number;
  created_at: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ products: ProductResult[], sales: SaleResult[] }>({ products: [], sales: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const { profile } = useUserStore();
  const supabase = createClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults({ products: [], sales: [] });
        return;
      }

      setLoading(true);
      try {
        const [prodRes, salesRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, sku, category')
            .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
            .eq('tenant_id', profile?.tenant_id)
            .limit(5),
          supabase
            .from('sales')
            .select('id, receipt_number, total_amount, created_at')
            .ilike('receipt_number', `%${query}%`)
            .limit(5)
        ]);

        setResults({
          products: prodRes.data || [],
          sales: salesRes.data || []
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, profile?.tenant_id, supabase]);

  const handleSelect = (type: 'product' | 'sale', id: string) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'product') {
      router.push(`/dashboard/inventory?search=${id}`);
    } else {
      router.push(`/dashboard/reports/sales?receipt=${id}`);
    }
  };

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-100 transition-all w-72 group"
    >
      <Search size={16} className="group-hover:text-brand-green transition-colors" />
      <span className="text-xs font-bold text-gray-400">Search products, receipts...</span>
      <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-black text-gray-300">
        <Command size={10} /> K
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-brand-dark/20 animate-in fade-in duration-300">
      <div 
        ref={searchRef}
        className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300"
      >
        <div className="relative border-b border-gray-100">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            autoFocus
            type="text"
            placeholder="Search for products, SKUs, or receipt numbers..."
            className="w-full pl-16 pr-16 py-6 text-base font-bold text-brand-dark placeholder:text-gray-300 outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
              <div className="w-6 h-6 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Searching records...</p>
            </div>
          )}

          {!loading && query.length > 0 && results.products.length === 0 && results.sales.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm font-bold">No results found for &quot;{query}&quot;</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2">Try a different SKU or name</p>
            </div>
          )}

          {!loading && results.products.length > 0 && (
            <div>
              <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Products & Inventory</p>
              <div className="space-y-1">
                {results.products.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleSelect('product', p.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-brand-green/5 transition-all group"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-brand-green transition-all">
                      <Package size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-brand-dark group-hover:text-brand-green transition-colors">{p.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">{p.sku} • {p.category}</p>
                    </div>
                    <ArrowRight size={16} className="ml-auto text-gray-200 group-hover:text-brand-green translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && results.sales.length > 0 && (
            <div>
              <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sales & Receipts</p>
              <div className="space-y-1">
                {results.sales.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => handleSelect('sale', s.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-brand-blue/5 transition-all group"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-brand-blue transition-all">
                      <Receipt size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-brand-dark group-hover:text-brand-blue transition-colors">{s.receipt_number}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">KES {Number(s.total_amount).toLocaleString()} • {new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                    <ArrowRight size={16} className="ml-auto text-gray-200 group-hover:text-brand-blue translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">ESC</span> close
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↵</span> select
            </div>
          </div>
          <p className="text-[10px] font-black text-brand-green uppercase tracking-widest italic opacity-60">KiTN Global Search</p>
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );
}
