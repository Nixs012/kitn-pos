'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  ChevronLeft,
  Settings2,
  Filter,
  ArrowUpRight,
  RefreshCw,
  ArrowRightLeft
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/userStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Image from 'next/image';
import StockTransferModal from '@/components/outlets/StockTransferModal';

type TabType = 'overview' | 'inventory' | 'staff';

interface BranchDetail {
  id: string;
  name: string;
  location: string;
  phone?: string;
  user_profiles: Array<{ id: string; full_name: string; role: string; avatar_url?: string; phone?: string; created_at: string }>;
}

interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  reorder_level: number;
  products: { id: string; name: string; category: string; unit: string };
}

interface SaleDetail {
  id: string;
  branch_id: string;
  total_amount: number | string;
  created_at: string;
}

export default function OutletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useUserStore();
  const supabase = createClient();
  const outletId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [outletData, setOutletData] = useState<BranchDetail | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [staff, setStaff] = useState<BranchDetail['user_profiles']>([]);
  const [salesData, setSalesData] = useState<{ name: string; revenue: number }[]>([]);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    totalStaff: 0,
    productsTracked: 0
  });

  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.tenant_id || !outletId) return;
    setLoading(true);

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);

      // 1. Fetch Outlet Details
      const { data: outlet } = await supabase
        .from('branches')
        .select(`
          *,
          user_profiles(id, full_name, role, avatar_url, phone, created_at)
        `)
        .eq('id', outletId)
        .single();
      
      if (outlet) {
        setOutletData(outlet as unknown as BranchDetail);
        setStaff((outlet as unknown as BranchDetail).user_profiles || []);
      }

      // 2. Fetch Inventory
      const { data: inv } = await supabase
        .from('inventory')
        .select('*, products(*)')
        .eq('branch_id', outletId);
      
      if (inv) setInventory(inv as unknown as InventoryItem[]);

      // 3. Fetch Sales
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('branch_id', outletId)
        .gte('created_at', monthStart.toISOString());
      
      if (sales) {
        const typedSales = sales as unknown as SaleDetail[];
        const todaySales = typedSales.filter(s => new Date(s.created_at) >= todayStart);
        const totalToday = todaySales.reduce((acc, s) => acc + Number(s.total_amount), 0);
        const totalMonth = typedSales.reduce((acc, s) => acc + Number(s.total_amount), 0);

        setMetrics({
          todayRevenue: totalToday,
          monthRevenue: totalMonth,
          totalStaff: ((outlet as unknown as BranchDetail).user_profiles || []).length,
          productsTracked: (inv || []).length
        });

        // Last 7 days chart data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
          const daySales = typedSales.filter(s => new Date(s.created_at).toDateString() === d.toDateString());
          return {
            name: dayStr,
            revenue: daySales.reduce((acc, s) => acc + Number(s.total_amount), 0)
          };
        });
        setSalesData(last7Days);
      }
    } catch (err) {
      console.error('Outlet detail fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id, outletId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredInventory = useMemo(() => {
    let result = inventory;
    if (inventoryFilter === 'low') result = inventory.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level);
    else if (inventoryFilter === 'out') result = inventory.filter(i => i.quantity <= 0);
    return result;
  }, [inventory, inventoryFilter]);

  if (loading || !outletData) return <div className="p-10 text-center animate-pulse">Loading branch details...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="p-2 border-gray-200 rounded-xl hover:bg-gray-50 text-gray-400"
          >
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-brand-dark tracking-tighter leading-tight">{outletData.name}</h1>
            <div className="flex items-center gap-4 mt-1">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                 <MapPin size={14} /> {outletData.location}
               </p>
               <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                 <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Online Now</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-3 pr-6 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm h-fit">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-bold shrink-0">
              {outletData.user_profiles?.find((u) => u.role === 'manager')?.full_name[0] || 'M'}
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Manager</p>
              <p className="text-sm font-black text-brand-dark">
                {outletData.user_profiles?.find((u) => u.role === 'manager')?.full_name || 'No Manager Assigned'}
              </p>
            </div>
          </div>
          <Button variant="outline" className="p-3 border-gray-200 text-gray-400 hover:text-brand-dark rounded-2xl h-[52px]">
            <Settings2 size={24} />
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-green/5 flex items-center justify-center text-brand-green">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Today&apos;s Revenue</p>
            <h3 className="text-xl font-black text-brand-dark">{metrics.todayRevenue.toLocaleString()} <span className="text-[10px] opacity-40">KES</span></h3>
          </div>
        </Card>
        <Card className="p-6 bg-white border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Month Revenue</p>
            <h3 className="text-xl font-black text-brand-dark">{metrics.monthRevenue.toLocaleString()} <span className="text-[10px] opacity-40">KES</span></h3>
          </div>
        </Card>
        <Card className="p-6 bg-white border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Staff</p>
            <h3 className="text-xl font-black text-brand-dark">{metrics.totalStaff} People</h3>
          </div>
        </Card>
        <Card className="p-6 bg-white border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Products Tracked</p>
            <h3 className="text-xl font-black text-brand-dark">{metrics.productsTracked} Items</h3>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="space-y-8">
        <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-3xl w-fit border border-gray-100">
           {(['overview', 'inventory', 'staff'] as TabType[]).map(tab => (
             <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab ? 'bg-brand-dark text-white shadow-lg' : 'text-gray-400 hover:text-brand-dark'}`}
             >
               {tab}
             </button>
           ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-10 bg-white border-gray-100 h-fit">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-brand-dark tracking-tighter">7-Day Sales Trend</h3>
                  <p className="text-gray-400 font-medium text-sm">Revenue performance over the last week.</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF' }} 
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF' }} />
                    <Tooltip 
                      cursor={{ fill: '#F9FAFB' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#1D9E75" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-8 bg-white border-gray-100">
              <h3 className="text-xl font-black text-brand-dark tracking-tighter mb-6">Top Products</h3>
              <div className="space-y-5">
                {/* Simplified top products logic: using first 5 from inventory as mock for now */}
                {inventory.slice(0, 5).map((item, idx) => (
                   <div key={item.id} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-brand-dark text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-brand-dark truncate">{item.products?.name}</p>
                        <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">In Stock: {item.quantity}</p>
                      </div>
                      <div className="flex items-center text-brand-green">
                        <ArrowUpRight size={16} />
                      </div>
                   </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Inventory */}
        {activeTab === 'inventory' && (
          <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-2xl w-fit">
                   {(['all', 'low', 'out'] as const).map(f => (
                     <button
                        key={f}
                        onClick={() => setInventoryFilter(f)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventoryFilter === f ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                       {f === 'all' ? 'All Items' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
                     </button>
                   ))}
                </div>
                <div className="flex items-center gap-3">
                   <Button variant="outline" className="border-gray-200 text-xs px-5 py-3 gap-2">
                      <Filter size={14} /> Filter
                   </Button>
                   <Button 
                    onClick={() => setIsTransferModalOpen(true)}
                    className="bg-[#378ADD] text-xs px-5 py-3 gap-2"
                   >
                     <ArrowRightLeft size={14} /> Transfer Out
                   </Button>
                </div>
             </div>

             <Table headers={['Product Name', 'Category', 'Current Stock', 'Unit', 'Reorder Lvl', 'Status', 'Actions']}>
                {filteredInventory.length > 0 ? filteredInventory.map(item => (
                   <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-brand-dark">{item.products?.name}</td>
                      <td className="px-8 py-5">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.products?.category}</span>
                      </td>
                      <td className="px-8 py-5 font-black text-brand-dark">{item.quantity}</td>
                      <td className="px-8 py-5 text-sm text-gray-500">{item.products?.unit}</td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-400">{item.reorder_level}</td>
                      <td className="px-8 py-5">
                         <Badge 
                           variant={item.quantity <= 0 ? 'danger' : item.quantity <= item.reorder_level ? 'warning' : 'success'}
                           className="text-[8px] font-black uppercase"
                         >
                            {item.quantity <= 0 ? 'OUT OF STOCK' : item.quantity <= item.reorder_level ? 'LOW STOCK' : 'OPTIMAL'}
                         </Badge>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-brand-green/10 text-brand-green rounded-lg transition-colors" title="Restock">
                               <RefreshCw size={14} />
                            </button>
                         </div>
                      </td>
                   </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-400 italic">No products matched your filter.</td>
                  </tr>
                )}
             </Table>
          </Card>
        )}

        {/* Tab 3: Staff */}
        {activeTab === 'staff' && (
           <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
              <Table headers={['Staff Member', 'Role', 'Status', 'Last Login', 'Phone', 'Created', 'Actions']}>
                 {staff.length > 0 ? staff.map(member => (
                   <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-black text-[10px] relative overflow-hidden shrink-0">
                              {member.avatar_url ? <Image src={member.avatar_url} alt="" fill className="object-cover" unoptimized /> : member.full_name[0]}
                           </div>
                           <span className="font-bold text-brand-dark">{member.full_name}</span>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{member.role}</span>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                           <span className="text-[10px] font-bold text-brand-dark uppercase">Online</span>
                        </div>
                     </td>
                     <td className="px-8 py-5 text-xs text-gray-500">Today, 2:45 PM</td>
                     <td className="px-8 py-5 text-xs font-medium text-gray-400">{member.phone || '---'}</td>
                     <td className="px-8 py-5 text-xs text-gray-500">{new Date(member.created_at).toLocaleDateString()}</td>
                     <td className="px-8 py-5">
                        <Button variant="outline" className="text-[9px] px-3 py-1.5 border-gray-100 font-black uppercase text-gray-500 hover:text-brand-dark">Reassign</Button>
                     </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={7} className="py-20 text-center text-gray-400 italic">No staff assigned to this outlet yet.</td>
                   </tr>
                 )}
              </Table>
           </Card>
        )}
      </div>

      <StockTransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={fetchData}
        initialFromBranchId={outletId}
      />
    </div>
  );
}
