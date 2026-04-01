'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  DollarSign, 
  Hash, 
  TrendingUp, 
  Box, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Download,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';

type DateRange = 'today' | 'week' | 'month' | 'custom';

interface SalesMetric {
  totalRevenue: number;
  transactionCount: number;
  averageSale: number;
  totalItems: number;
}

interface PaymentMetric {
  method: string;
  amount: number;
  percentage: number;
}

interface Sale {
  id: string;
  receipt_number: string;
  created_at: string;
  payment_method: string;
  total_amount: number;
  tax_amount: number;
  discount: number;
  user_profiles: { full_name: string };
  sale_items: Array<{
    id: string;
    products: { name: string; unit?: string } | null;
    quantity: number;
    unit_price: number;
  }>;
}

const SummaryCard = ({ title, value, icon: Icon, colorClass, subText }: { title: string, value: string | number, icon: React.ElementType, colorClass: string, subText: string }) => (
  <Card className="p-6 relative overflow-hidden group hover:border-brand-green/20 transition-all duration-500">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`} />
    <div className="relative z-10 flex items-start justify-between">
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{title}</p>
        <h3 className="text-3xl font-black text-brand-dark tracking-tighter">{value}</h3>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{subText}</p>
      </div>
      <div className={`p-4 rounded-2xl ${colorClass.replace('bg-', 'bg-opacity-10 text-')}`}>
        <Icon size={24} />
      </div>
    </div>
  </Card>
);

const PaymentCard = ({ method, amount, percentage, icon: Icon, color }: { method: string, amount: number, percentage: number, icon: React.ElementType, color: string }) => (
  <Card className="p-6 border-none bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all duration-500">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-white shadow-sm`} style={{ color }}>
          <Icon size={20} />
        </div>
        <span className="font-black text-brand-dark text-sm uppercase tracking-wider">{method}</span>
      </div>
      <span className="font-black text-brand-dark">{amount.toLocaleString()} KES</span>
    </div>
    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full transition-all duration-1000 ease-out" 
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
    <div className="mt-2 text-[10px] font-black text-gray-400 text-right">{percentage}%</div>
  </Card>
);

export default function SalesReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [metrics, setMetrics] = useState<SalesMetric>({ totalRevenue: 0, transactionCount: 0, averageSale: 0, totalItems: 0 });
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetric[]>([]);
  const [chartData, setChartData] = useState<Array<{ day: string; revenue: number }>>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; unitsSold: number; revenue: number; rank: number; percentage: string | number }>>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const supabase = createClient();

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id, branch_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const startDate = new Date();
      if (dateRange === 'today') startDate.setHours(0,0,0,0);
      else if (dateRange === 'week') startDate.setDate(startDate.getDate() - 7);
      else if (dateRange === 'month') startDate.setMonth(startDate.getMonth() - 1);

      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          *,
          user_profiles!inner(full_name),
          sale_items (
            *,
            products (name)
          )
        `)
        .eq('branch_id', profile.branch_id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(salesData || []);
      
      // Calculate Metrics
      let totalRev = 0;
      let totalItemsValue = 0;
      const payMap: Record<string, number> = { mpesa: 0, cash: 0, card: 0 };
      const prodMap: Record<string, { name: string, unitsSold: number, revenue: number }> = {};
      const dayMap: Record<string, number> = {};

      salesData?.forEach(sale => {
        totalRev += Number(sale.total_amount);
        payMap[sale.payment_method] = (payMap[sale.payment_method] || 0) + Number(sale.total_amount);
        
        const day = new Date(sale.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        dayMap[day] = (dayMap[day] || 0) + Number(sale.total_amount);

        sale.sale_items?.forEach((item: { quantity: number; unit_price: number; products: { name: string; unit?: string } | null }) => {
          totalItemsValue += Number(item.quantity);
          const pName = item.products?.name || 'Unknown';
          if (!prodMap[pName]) prodMap[pName] = { name: pName, unitsSold: 0, revenue: 0 };
          prodMap[pName].unitsSold += Number(item.quantity);
          prodMap[pName].revenue += Number(item.quantity) * Number(item.unit_price);
        });
      });

      setMetrics({
        totalRevenue: totalRev,
        transactionCount: salesData?.length || 0,
        averageSale: salesData?.length ? totalRev / salesData.length : 0,
        totalItems: totalItemsValue
      });

      setPaymentMetrics([
        { method: 'M-Pesa', amount: payMap.mpesa, percentage: totalRev ? Math.round((payMap.mpesa / totalRev) * 100) : 0 },
        { method: 'Cash', amount: payMap.cash, percentage: totalRev ? Math.round((payMap.cash / totalRev) * 100) : 0 },
        { method: 'Card', amount: payMap.card, percentage: totalRev ? Math.round((payMap.card / totalRev) * 100) : 0 },
      ]);

      setChartData(Object.entries(dayMap).map(([day, revenue]) => ({ day, revenue })));
      
      setTopProducts(
        Object.values(prodMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
          .map((p, i) => ({ ...p, rank: i + 1, percentage: totalRev ? ((p.revenue / totalRev) * 100).toFixed(1) : 0 }))
      );

    } catch (err: unknown) {
      console.error('Sales reports fetch error:', err);
      toast.error('Failed to load sales reports');
    } finally {
      setLoading(false);
    }
  }, [dateRange, supabase]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const exportCSV = () => {
    const headers = ['Receipt #', 'Date', 'Cashier', 'Method', 'Tax', 'Discount', 'Total'];
    const rows = sales.map(s => [
      s.receipt_number,
      new Date(s.created_at).toLocaleString(),
      s.user_profiles?.full_name,
      s.payment_method,
      s.tax_amount,
      s.discount,
      s.total_amount
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `kitn-sales-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pagedSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sales.slice(start, start + pageSize);
  }, [sales, page]);

  const viewReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-dark tracking-tighter leading-none mb-3">Sales Reports</h1>
          <p className="text-gray-500 font-medium">Analyze your store performance and transactional history.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white p-1.5 rounded-[22px] shadow-sm border border-gray-100 flex-wrap">
            {(['today', 'week', 'month'] as DateRange[]).map((range) => (
              <button 
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-6 py-2.5 rounded-[16px] text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${dateRange === range ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button onClick={exportCSV} className="bg-brand-green hover:bg-brand-green/90 px-8 py-4 shadow-xl shadow-brand-green/10 flex items-center gap-2">
            <Download size={18} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Sales" value={`${metrics.totalRevenue.toLocaleString()} KES`} icon={DollarSign} colorClass="bg-green-600" subText="Net Revenue Collected" />
        <SummaryCard title="Transactions" value={metrics.transactionCount} icon={Hash} colorClass="bg-blue-600" subText="Total Sales Completed" />
        <SummaryCard title="Avg Sale Value" value={`${Math.round(metrics.averageSale).toLocaleString()} KES`} icon={TrendingUp} colorClass="bg-purple-600" subText="Revenue per Customer" />
        <SummaryCard title="Items Sold" value={metrics.totalItems} icon={Box} colorClass="bg-orange-500" subText="Total Volume Sold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Bar Chart */}
          <Card className="p-8 rounded-[32px]">
            <h3 className="text-xl font-black text-brand-dark tracking-tight mb-8">Sales by Day</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="revenue" fill="#1D9E75" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Transactions Table */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Detailed Transactions</h3>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
                <div className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-black text-gray-500">Page {page}</div>
                <button onClick={() => setPage(p => p + 1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ChevronRight size={20} /></button>
              </div>
            </div>
            <Table headers={['Receipt #', 'Date & Time', 'Cashier', 'Payment', 'Amount', 'Actions']} loading={loading}>
              {pagedSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5 font-black text-brand-dark">{sale.receipt_number}</td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-gray-600">{new Date(sale.created_at).toLocaleDateString()}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(sale.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-gray-500">{sale.user_profiles?.full_name}</td>
                  <td className="px-6 py-5 uppercase">
                    <Badge variant={sale.payment_method === 'mpesa' ? 'success' : 'info'} className="text-[9px] font-black px-3 py-1 bg-opacity-10">
                      {sale.payment_method}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 font-black text-brand-dark">{Number(sale.total_amount).toLocaleString()} KES</td>
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => viewReceipt(sale)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-green/5 text-brand-green rounded-xl transition-all hover:bg-brand-green hover:text-white font-bold text-[10px] uppercase tracking-widest"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        </div>

        <div className="space-y-8">
          {/* Payment breakdown */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-brand-dark tracking-tight">Payment Methods</h3>
            <div className="space-y-4">
              <PaymentCard method="M-Pesa" amount={paymentMetrics[0]?.amount || 0} percentage={paymentMetrics[0]?.percentage || 0} icon={Smartphone} color="#1D9E75" />
              <PaymentCard method="Cash" amount={paymentMetrics[1]?.amount || 0} percentage={paymentMetrics[1]?.percentage || 0} icon={Banknote} color="#3B82F6" />
              <PaymentCard method="Card" amount={paymentMetrics[2]?.amount || 0} percentage={paymentMetrics[2]?.percentage || 0} icon={CreditCard} color="#8B5CF6" />
            </div>
          </div>

          {/* Top Products */}
          <Card className="p-8 rounded-[32px] overflow-hidden">
            <h3 className="text-xl font-black text-brand-dark tracking-tight mb-8">Top 10 Products</h3>
            <div className="space-y-6">
              {topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-4 group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
                    {p.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-dark text-sm truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.unitsSold} sold • {p.percentage}% of rev</p>
                  </div>
                  <div className="font-black text-brand-dark text-sm whitespace-nowrap">{Math.round(p.revenue).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        title={`Receipt ${selectedSale?.receipt_number}`}
        size="md"
      >
        {selectedSale && (
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-[24px] border border-gray-100 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</span>
                <span className="font-bold text-brand-dark">{new Date(selectedSale.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cashier</span>
                <span className="font-bold text-brand-dark">{selectedSale.user_profiles?.full_name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-black text-brand-green">Payment Method</span>
                <span className="font-black text-brand-green uppercase">{selectedSale.payment_method}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-2">Itemized Breakdown</h4>
              <div className="space-y-2">
                {selectedSale.sale_items?.map((item: { id: string; products: { name: string; unit?: string } | null; quantity: number; unit_price: number }) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
                    <div>
                      <p className="font-bold text-brand-dark text-sm">{item.products?.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{item.quantity} {item.products?.unit || 'pcs'} × {item.unit_price.toLocaleString()} KES</p>
                    </div>
                    <span className="font-black text-brand-dark">{(item.quantity * item.unit_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-brand-dark rounded-[24px] text-white space-y-3 shadow-2xl">
              <div className="flex justify-between text-white/60 text-[10px] font-black uppercase tracking-widest">
                <span>Tax & VAT</span>
                <span>{selectedSale.tax_amount.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between text-white/60 text-[10px] font-black uppercase tracking-widest">
                <span>Total Discount</span>
                <span>-{selectedSale.discount.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-white/10">
                <span className="text-sm font-black text-brand-green uppercase tracking-tighter">Amount Paid</span>
                <span className="text-3xl font-black text-white tracking-widest">{Number(selectedSale.total_amount).toLocaleString()} <span className="text-xs text-white/40">KES</span></span>
              </div>
            </div>

            <Button onClick={() => window.print()} className="w-full py-5 rounded-3xl shadow-xl shadow-brand-green/20">
              Print Duplicate Receipt
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
