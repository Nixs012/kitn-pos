'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  Receipt, 
  Tag, 
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import { toast } from 'sonner';

type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';

interface FinanceMetrics {
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
  vatCollected: number;
  discountsGiven: number;
  netRevenue: number;
}

interface ProductProfit {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
}

const COLORS = ['#1D9E75', '#8B5CF6', '#3B82F6', '#F59E0B'];

const MetricCard = ({ title, value, subValue, icon: Icon, trend, prefix = "KES ", className }: { title: string, value: number, subValue: string, icon: React.ElementType, trend?: number, prefix?: string, className?: string }) => (
  <Card className={`p-6 relative overflow-hidden group hover:border-brand-green/20 transition-all duration-500 ${className || ''}`}>
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={80} />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-brand-dark tracking-tighter">
          <span className="text-sm font-bold text-gray-300 mr-1">{prefix}</span>
          {value.toLocaleString()}
        </h3>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${trend > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
            {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">{subValue}</p>
    </div>
  </Card>
);

export default function FinancePage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FinanceMetrics>({
    grossRevenue: 0,
    cogs: 0,
    grossProfit: 0,
    profitMargin: 0,
    vatCollected: 0,
    discountsGiven: 0,
    netRevenue: 0
  });
  const [chartData, setChartData] = useState<Array<{ date: string; revenue: number; profit: number }>>([]);
  const [paymentData, setPaymentData] = useState<Array<{ name: string; value: number }>>([]);
  const [productProfitData, setProductProfitData] = useState<ProductProfit[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const supabase = createClient();

  const fetchInitialInfo = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setTenantId(profile.tenant_id);
        const { data: branchesData } = await supabase
          .from('branches')
          .select('id, name')
          .eq('tenant_id', profile.tenant_id);
        if (branchesData) setBranches(branchesData);
      }
    } catch (error) {
      console.error('Initial Info Error:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchInitialInfo();
  }, [fetchInitialInfo]);

  const fetchFinanceData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const startDate = new Date();
      if (dateRange === 'today') startDate.setHours(0,0,0,0);
      else if (dateRange === 'week') startDate.setDate(startDate.getDate() - 7);
      else if (dateRange === 'month') startDate.setMonth(startDate.getMonth() - 1);
      else if (dateRange === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

      const query = supabase
        .from('sales')
        .select(`
          *,
          branches!inner(tenant_id),
          sale_items (
            *,
            products (name, buying_price)
          )
        `)
        .eq('branches.tenant_id', tenantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (selectedBranch !== 'all') {
        query.eq('branch_id', selectedBranch);
      }

      const { data: sales, error: salesError } = await query;
      if (salesError) throw salesError;

      // Aggregations
      let grossRev = 0;
      let totalCogs = 0;
      let totalVat = 0;
      let totalDiscount = 0;
      const dailyMap: Record<string, { revenue: number, profit: number }> = {};
      const payMap: Record<string, number> = {};
      const prodMap: Record<string, ProductProfit> = {};

      sales?.forEach(sale => {
        totalVat += Number(sale.tax_amount || 0);
        totalDiscount += Number(sale.discount || 0);
        
        const date = new Date(sale.created_at).toLocaleDateString();
        if (!dailyMap[date]) dailyMap[date] = { revenue: 0, profit: 0 };
        
        payMap[sale.payment_method] = (payMap[sale.payment_method] || 0) + Number(sale.total_amount);

        sale.sale_items?.forEach((item: { 
          quantity: number; 
          unit_price: number; 
          product_id: string;
          products?: { name: string; buying_price: number } | null 
        }) => {
          const revenue = Number(item.quantity) * Number(item.unit_price);
          const cogs = Number(item.quantity) * Number(item.products?.buying_price || 0);
          const profit = revenue - cogs;

          grossRev += revenue;
          totalCogs += cogs;
          dailyMap[date].revenue += revenue;
          dailyMap[date].profit += profit;

          const prodName = item.products?.name || 'Unknown';
          if (!prodMap[prodName]) {
            prodMap[prodName] = {
              id: item.product_id,
              name: prodName,
              unitsSold: 0,
              revenue: 0,
              cogs: 0,
              profit: 0,
              margin: 0
            };
          }
          const p = prodMap[prodName];
          p.unitsSold += Number(item.quantity);
          p.revenue += revenue;
          p.cogs += cogs;
          p.profit += profit;
          p.margin = p.revenue ? (p.profit / p.revenue) * 100 : 0;
        });
      });

      const netRev = grossRev - totalDiscount;
      const grossProfit = netRev - totalCogs;

      setMetrics({
        grossRevenue: grossRev,
        cogs: totalCogs,
        grossProfit: grossProfit,
        profitMargin: netRev ? (grossProfit / netRev) * 100 : 0,
        vatCollected: totalVat,
        discountsGiven: totalDiscount,
        netRevenue: netRev
      });

      setChartData(Object.entries(dailyMap).map(([date, vals]) => ({
        date,
        revenue: vals.revenue,
        profit: vals.profit
      })));

      setPaymentData(Object.entries(payMap).map(([name, value]) => ({ 
        name: name.toUpperCase(), 
        value 
      })));

      setProductProfitData(Object.values(prodMap).sort((a, b) => b.profit - a.profit));

    } catch (error: unknown) {
      console.error('Finance Fetch Error:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [tenantId, dateRange, selectedBranch, supabase]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-dark tracking-tighter leading-none mb-3">Finance Dashboard</h1>
          <p className="text-gray-500 font-medium italic">Comprehensive oversight of your business health and profitability.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white p-1.5 rounded-[22px] shadow-sm border border-gray-100 italic">
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 bg-transparent text-xs font-black uppercase tracking-widest text-gray-400 focus:outline-none border-none cursor-pointer"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-white p-1.5 rounded-[22px] shadow-sm border border-gray-100 self-start">
            {(['today', 'week', 'month', 'year'] as DateRange[]).map((range) => (
              <button 
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-6 py-2.5 rounded-[16px] text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${dateRange === range ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Gross Revenue" value={metrics.grossRevenue} subValue="Total Sales Value" icon={DollarSign} trend={12} />
        <MetricCard title="Cost of Goods" value={metrics.cogs} subValue="Total Buying Cost" icon={ShoppingBag} />
        <MetricCard 
          title="Gross Profit" 
          value={metrics.grossProfit} 
          subValue="Revenue - Cost" 
          icon={TrendingUp} 
          className={metrics.grossProfit > 0 ? "text-green-600" : "text-red-600"}
        />
        <MetricCard title="Profit Margin" value={Math.round(metrics.profitMargin)} subValue="Efficiency Rate" icon={Percent} prefix="" trend={2} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
            <Receipt size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-xs">VAT Collected</p>
            <p className="text-xl font-black text-brand-dark tracking-tight">KES {metrics.vatCollected.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Tag size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-xs">Total Discounts</p>
            <p className="text-xl font-black text-brand-dark tracking-tight">KES {metrics.discountsGiven.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-brand-dark p-6 rounded-[28px] shadow-2xl flex items-center gap-5 border border-white/5">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-brand-green">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-xs">Net Revenue</p>
            <p className="text-xl font-black text-white tracking-tight">KES {metrics.netRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Line Chart */}
        <Card className="lg:col-span-2 p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-brand-dark tracking-tight flex items-center gap-2">
              <TrendingUp className="text-brand-green" />
              Revenue vs Profit Trend
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-green" /> Revenue</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-purple" /> Profit</div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 700
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#1D9E75" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#8B5CF6" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart */}
        <Card className="p-8 rounded-[32px] flex flex-col items-center">
          <h3 className="text-xl font-black text-brand-dark tracking-tight mb-8 self-start">Payment Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-6">
            {paymentData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Product Profit Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Profit by Product</h3>
          <div className="p-3 bg-gray-50/50 rounded-2xl flex items-center gap-2 text-gray-400">
            <Filter size={16} />
            <span className="text-xs font-bold">Sort: Profit (High to Low)</span>
          </div>
        </div>
        <Table headers={['Product Name', 'Units Sold', 'Total Revenue', 'Total COGS', 'Profit', 'Margin %']} loading={loading}>
          {productProfitData.length > 0 ? productProfitData.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-brand-dark font-black text-xs">
                    {p.name[0]}
                  </div>
                  <span className="font-bold text-brand-dark">{p.name}</span>
                </div>
              </td>
              <td className="px-6 py-5 font-bold text-gray-500">{p.unitsSold.toLocaleString()}</td>
              <td className="px-6 py-5 font-black text-brand-dark">{p.revenue.toLocaleString()} KES</td>
              <td className="px-6 py-5 text-gray-400 font-medium">{p.cogs.toLocaleString()} KES</td>
              <td className="px-6 py-5 font-black text-brand-green">{p.profit.toLocaleString()} KES</td>
              <td className="px-6 py-5">
                <Badge 
                  variant={p.margin > 20 ? 'success' : p.margin > 10 ? 'warning' : 'danger'}
                  className="font-black px-4 py-1"
                >
                  {Math.round(p.margin)}%
                </Badge>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="py-20 text-center text-gray-400 font-medium italic">No sales data found for the selected period.</td>
            </tr>
          )}
          {/* Totals Row */}
          {productProfitData.length > 0 && (
            <tr className="bg-gray-50/80 font-black">
              <td className="px-6 py-6 text-brand-dark">TOTALS</td>
              <td className="px-6 py-6 text-gray-500">{productProfitData.reduce((acc, p) => acc + p.unitsSold, 0).toLocaleString()}</td>
              <td className="px-6 py-6 text-brand-dark">{metrics.grossRevenue.toLocaleString()} KES</td>
              <td className="px-6 py-6 text-gray-500">{metrics.cogs.toLocaleString()} KES</td>
              <td className="px-6 py-6 text-brand-green">{metrics.grossProfit.toLocaleString()} KES</td>
              <td className="px-6 py-6">
                <Badge variant="info" className="font-black px-4 py-1">
                  {Math.round(metrics.profitMargin)}% AVG
                </Badge>
              </td>
            </tr>
          )}
        </Table>
      </div>
    </div>
  );
}
