'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Types
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  isAlert?: boolean;
}

interface ProductSale {
  name: string;
  total_sales: number;
}

interface Transaction {
  id: string;
  receipt_number: string;
  total_amount: number;
  payment_method: 'Cash' | 'M-Pesa' | 'Card';
  created_at: string;
}

const StatCard = ({ label, value, icon, trend, isAlert, href }: StatCardProps & { href?: string }) => {
  const content = (
    <div className="bg-white p-5 rounded-[12px] border-[0.5px] border-[#E8E8E8] shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${isAlert && Number(value) > 0 ? 'bg-red-50 text-red-500' : 'bg-brand-green/10 text-brand-green'}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-[10px] font-bold ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
      <h3 className={`text-xl font-black tracking-tight ${isAlert && Number(value) > 0 ? 'text-red-600' : 'text-brand-dark'}`}>
        {label.includes('KES') ? `KES ${Number(value).toLocaleString()}` : value}
      </h3>
    </div>
  );

  if (href) return <Link href={href} className="block group">{content}</Link>;
  return content;
};

const PaymentBadge = ({ method }: { method: Transaction['payment_method'] }) => {
  const styles = {
    'M-Pesa': 'bg-green-100 text-green-700 border-green-200',
    'Cash': 'bg-blue-100 text-blue-700 border-blue-200',
    'Card': 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[method]}`}>
      {method.toUpperCase()}
    </span>
  );
};

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    sales: 0,
    transactions: 0,
    itemsSold: 0,
    lowStock: 0
  });
  const [recentSales, setRecentSales] = useState<Transaction[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // 1. Fetch Today's Sales & Transactions
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false });

      if (salesData) {
        const total = salesData.reduce((acc, sale) => acc + Number(sale.total_amount), 0);
        setStats(prev => ({ 
          ...prev, 
          sales: total, 
          transactions: salesData.length 
        }));
        setRecentSales(salesData.slice(0, 10));
      }

      // 2. Fetch Items Sold Today
      const { data: itemsData } = await supabase
        .from('sales_items')
        .select('quantity')
        .gte('created_at', todayISO);
      
      if (itemsData) {
        const count = itemsData.reduce((acc, item) => acc + item.quantity, 0);
        setStats(prev => ({ ...prev, itemsSold: count }));
      }

      // 3. Fetch Low Stock Alerts
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .filter('stock_quantity', 'lte', 'low_stock_threshold');
      
      setStats(prev => ({ ...prev, lowStock: lowStockCount || 0 }));

      // 4. Fetch Top Selling Products Today
      const { data: topData } = await supabase
        .from('sales_items')
        .select(`
          quantity,
          products (name)
        `)
        .gte('created_at', todayISO);

      if (topData) {
        const productMap: Record<string, number> = {};
        topData.forEach((item: { quantity: number; products: { name: string } | Array<{ name: string }> | null }) => {
          const product = Array.isArray(item.products) ? item.products[0] : item.products;
          const name = (product as { name: string } | null)?.name || 'Unknown';
          productMap[name] = (productMap[name] || 0) + item.quantity;
        });
        const sorted = Object.entries(productMap)
          .map(([name, qty]) => ({ name, total_sales: qty }))
          .sort((a, b) => b.total_sales - a.total_sales)
          .slice(0, 5);
        setTopProducts(sorted);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    document.title = 'Dashboard — KiTN POS';

    // Real-time subscription for new sales
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        (payload) => {
          const newSale = payload.new as Transaction;
          setRecentSales(prev => [newSale, ...prev.slice(0, 9)]);
          setStats(prev => ({ 
            ...prev, 
            sales: prev.sales + Number(newSale.total_amount),
            transactions: prev.transactions + 1
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <Breadcrumbs items={[{ label: 'Home' }]} />
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Today's Sales (KES)" 
          value={stats.sales} 
          icon={<TrendingUp size={20} />} 
          trend={{ value: '12%', positive: true }} 
        />
        <StatCard 
          label="Transactions count" 
          value={stats.transactions} 
          icon={<ShoppingCart size={20} />} 
        />
        <StatCard 
          label="Items Sold" 
          value={stats.itemsSold} 
          icon={<Package size={20} />} 
        />
        <StatCard 
          label="Low Stock Alerts" 
          value={stats.lowStock} 
          icon={<AlertTriangle size={20} />} 
          isAlert
          href="/dashboard/inventory"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-[12px] border-[0.5px] border-[#E8E8E8] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-brand-dark text-sm uppercase tracking-tight">Top selling products today</h3>
            <button className="text-brand-blue text-[10px] font-bold hover:underline">VIEW ALL</button>
          </div>
          
          <div className="space-y-5">
            {topProducts.length > 0 ? topProducts.map((product, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-700">{product.name}</span>
                  <span className="font-black text-brand-dark">{product.total_sales} units</span>
                </div>
                <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      i === 0 ? 'bg-brand-green' : i === 1 ? 'bg-brand-blue' : i === 2 ? 'bg-brand-purple' : 'bg-brand-coral'
                    }`}
                    style={{ width: `${(product.total_sales / (topProducts[0]?.total_sales || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm italic">
                No sales data yet today
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-[12px] border-[0.5px] border-[#E8E8E8] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-brand-dark text-sm uppercase tracking-tight">Recent transactions</h3>
            <div className="flex items-center gap-1.5 text-brand-green text-[10px] font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              LIVE
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-50">
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receipt</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.length > 0 ? recentSales.map((sale) => (
                  <tr key={sale.id} className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/dashboard/reports/sales?receipt=${sale.receipt_number}`}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-green/5 flex items-center justify-center text-brand-green">
                           <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-brand-dark">{sale.receipt_number}</p>
                          <p className="text-[9px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <PaymentBadge method={sale.payment_method} />
                    </td>
                    <td className="py-4 text-right">
                      <p className="text-xs font-black text-brand-dark">KES {Number(sale.total_amount).toLocaleString()}</p>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-400 text-sm italic">
                      No transactions recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <button className="w-full mt-4 py-2 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-bold text-gray-400 hover:border-brand-blue hover:text-brand-blue transition-all flex items-center justify-center gap-1.5">
            VIEW FULL HISTORY <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
