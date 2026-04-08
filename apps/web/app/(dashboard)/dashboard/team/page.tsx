'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Trophy, 
  Activity, 
  ExternalLink,
  Calendar,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { toast } from 'sonner';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import StaffCard from '@/components/team/StaffCard';
import ActivityDrawer from '@/components/team/ActivityDrawer';

type FilterRange = 'today' | 'week' | 'month';

interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  outlet: string;
  avatarUrl?: string;
  salesVolume: number;
  transactions: number;
  avgSale: number;
  topProduct: string;
  hoursOnShift: number;
  isOnline: boolean;
  clockInTime?: string;
}

interface ShiftLog {
  id: string;
  staffName: string;
  clockIn: string;
  clockOut: string | null;
  duration: string;
  status: 'active' | 'completed';
}

interface Shift {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  tenant_id: string;
  branch_id: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  trend?: string;
}

const MetricCard = ({ title, value, subtext, icon: Icon, trend }: MetricCardProps) => (
  <Card className="p-6 relative overflow-hidden group hover:border-brand-green/20 transition-all duration-500 bg-white">
    <div className="relative z-10 flex items-start justify-between">
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{title}</p>
        <h3 className="text-3xl font-black text-brand-dark tracking-tighter">{value}</h3>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${trend.includes('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend}
            </span>
          )}
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{subtext}</p>
        </div>
      </div>
      <div className="p-4 rounded-2xl bg-brand-green/5 text-brand-green group-hover:bg-brand-green group-hover:text-white transition-all duration-500 shadow-sm">
        <Icon size={24} />
      </div>
    </div>
  </Card>
);

export default function TeamPerformancePage() {
  const { user, profile } = useUserStore();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState<FilterRange>('today');
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformance | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [staffData, setStaffData] = useState<StaffPerformance[]>([]);
  const [shifts, setShifts] = useState<ShiftLog[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null); 
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  interface TimelineItem {
    id: string;
    time: string;
    receiptNumber: string;
    amount: number;
    method: string;
    items: string;
  }

  interface AuditLogItem {
    id: string;
    action: string;
    table: string;
    time: string;
  }

  const currentDate = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const fetchData = useCallback(async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      // 1. Fetch Users
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*, branches(name)')
        .eq('tenant_id', profile.tenant_id);

      if (usersError) throw usersError;

      // 2. Fetch Sales for filter period
      const startDate = new Date();
      if (filterRange === 'today') startDate.setHours(0, 0, 0, 0);
      else if (filterRange === 'week') startDate.setDate(startDate.getDate() - 7);
      else startDate.setMonth(startDate.getMonth() - 1);

      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*, sale_items(quantity, products(name))')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', startDate.toISOString());

      if (salesError) throw salesError;

      // 3. Fetch Shifts for today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*, user_profiles(full_name)')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false });

      if (shiftsError) throw shiftsError;

      // 4. Transform Data
      const processedStaff: StaffPerformance[] = users.map(u => {
        const userSales = sales.filter(s => s.cashier_id === u.id);
        const totalSales = userSales.reduce((acc, s) => acc + Number(s.total_amount), 0);
        const activeShift = shiftsData.find(s => s.user_id === u.id && !s.clock_out);
        
        // Find top product for this user
        const productMap: Record<string, number> = {};
        userSales.forEach(s => {
          (s.sale_items as { quantity: number; products: { name: string } | null }[])?.forEach((item) => {
            const name = item.products?.name || 'Unknown';
            productMap[name] = (productMap[name] || 0) + item.quantity;
          });
        });
        const topProduct = Object.entries(productMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return {
          id: u.id,
          name: u.full_name,
          role: u.role,
          outlet: u.branches?.name || 'Main',
          avatarUrl: u.avatar_url,
          salesVolume: totalSales,
          transactions: userSales.length,
          avgSale: userSales.length ? totalSales / userSales.length : 0,
          topProduct,
          hoursOnShift: activeShift ? (new Date().getTime() - new Date(activeShift.clock_in).getTime()) / 3600000 : 0,
          isOnline: !!activeShift,
          clockInTime: activeShift ? new Date(activeShift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      });

      setStaffData(processedStaff);

      // Current user shift status
      const myActiveShift = shiftsData.find(s => s.user_id === user?.id && !s.clock_out);
      setCurrentShift(myActiveShift || null);

      // Shift Logs
      setShifts(shiftsData.map(s => ({
        id: s.id,
        staffName: s.user_profiles?.full_name || 'Unknown',
        clockIn: new Date(s.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOut: s.clock_out ? new Date(s.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        status: s.clock_out ? 'completed' : 'active',
        duration: s.clock_out 
          ? `${Math.round((new Date(s.clock_out).getTime() - new Date(s.clock_in).getTime()) / 60000)}m`
          : `${Math.round((new Date().getTime() - new Date(s.clock_in).getTime()) / 60000)}m`
      })));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed';
      console.error('Fetch error:', err);
      // Show more detailed error if it comes from Supabase
      if (typeof err === 'object' && err !== null && 'message' in err) {
        toast.error(`Database Error: ${String((err as { message: unknown }).message)}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id, filterRange, supabase, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClockAction = async () => {
    if (!profile?.tenant_id || !user?.id) return;

    try {
      if (currentShift) {
        // Clock Out
        const { error } = await supabase
          .from('shifts')
          .update({ clock_out: new Date().toISOString() })
          .eq('id', (currentShift as Shift).id);
        
        if (error) throw error;
        toast.success('Clocked out successfully');
      } else {
        // Clock In
        const { error } = await supabase
          .from('shifts')
          .insert({
            user_id: user.id,
            tenant_id: profile.tenant_id,
            branch_id: profile.branch_id,
            clock_in: new Date().toISOString()
          });
        
        if (error) throw error;
        toast.success('Clocked in successfully');
      }
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed';
      if (typeof err === 'object' && err !== null && 'message' in err) {
        toast.error(`Clock Action Error: ${String((err as { message: unknown }).message)}`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const openDrawer = async (staff: StaffPerformance) => {
    setSelectedStaff(staff);
    setIsDrawerOpen(true);

    // Fetch details for drawer
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [salesRes, logsRes] = await Promise.all([
        supabase
          .from('sales')
          .select('*, sale_items(quantity, products(name))')
          .eq('cashier_id', staff.id)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('audit_log')
          .select('*')
          .eq('user_id', staff.id)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (salesRes.data) {
        setTimelineData(salesRes.data.map(s => ({
          id: s.id,
          time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          receiptNumber: s.receipt_number,
          amount: s.total_amount,
          method: s.payment_method,
          items: (s.sale_items as { quantity: number; products: { name: string } | null }[]).map((i) => `${i.quantity}x ${i.products?.name}`).join(', ')
        })));
      }

      if (logsRes.data) {
        setAuditLogs(logsRes.data.map(l => ({
          id: l.id,
          action: l.action,
          table: l.table_name || 'N/A',
          time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      }
    } catch (err) {
      console.error('Drawer fetch error:', err);
    }
  };

  const metrics = useMemo(() => {
    const staffOnShift = staffData.filter(s => s.isOnline).length;
    const topPerformer = [...staffData].sort((a, b) => b.salesVolume - a.salesVolume)[0];
    const totalSales = staffData.reduce((acc, s) => acc + s.salesVolume, 0);
    const avgSalePerCashier = staffOnShift ? totalSales / staffOnShift : 0;

    return {
      staffOnShift,
      topPerformer,
      totalSales,
      avgSalePerCashier
    };
  }, [staffData]);

  const activeStaff = useMemo(() => staffData.filter(s => s.isOnline), [staffData]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-brand-dark tracking-tighter leading-none">Team Performance</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-green/10 rounded-full border border-brand-green/20">
              <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">{metrics.staffOnShift} Online</span>
            </div>
          </div>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" /> {currentDate}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={handleClockAction}
            className={`${currentShift ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-green hover:bg-brand-green/90'} px-6 py-4 shadow-xl flex items-center gap-2`}
          >
            <Clock size={18} />
            {currentShift ? 'Clock Out' : 'Clock In Now'}
          </Button>
          <Link href="/dashboard/settings">
            <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 px-6 py-4 flex items-center gap-2">
              <UserPlus size={18} />
              Manage Users
              <ChevronRight size={14} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Staff On Shift" 
          value={metrics.staffOnShift} 
          subtext={metrics.staffOnShift > 0 ? `${metrics.staffOnShift} active now` : "No one clocked in"} 
          icon={Users} 
        />
        <MetricCard 
          title="Top Performer" 
          value={metrics.topPerformer?.name || '---'} 
          subtext={metrics.topPerformer ? `${metrics.topPerformer.salesVolume.toLocaleString()} KES` : "No sales yet"} 
          icon={Trophy} 
        />
        <MetricCard 
          title="Total Team Sales" 
          value={`${metrics.totalSales.toLocaleString()} KES`} 
          subtext="Combined daily revenue" 
          icon={TrendingUp} 
          trend="+12%" 
        />
        <MetricCard 
          title="Avg Sale/Cashier" 
          value={`${Math.round(metrics.avgSalePerCashier).toLocaleString()} KES`} 
          subtext="Revenue per active staff" 
          icon={Activity} 
        />
      </div>

      {/* Currently On Shift */}
      {activeStaff.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter">On Shift Now</h3>
            <span className="text-gray-400 font-medium text-sm italic">Scroll horizontally &rarr;</span>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide snap-x">
            {activeStaff.map((staff) => (
              <div key={staff.id} className="snap-center">
                <StaffCard
                  name={staff.name}
                  role={staff.role}
                  avatarUrl={staff.avatarUrl}
                  clockInTime={staff.clockInTime || '---'}
                  salesToday={staff.salesVolume}
                  transactionsToday={staff.transactions}
                  isActive={true}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Performance Table */}
      <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Team Performance — {filterRange === 'today' ? 'Today' : filterRange === 'week' ? 'This Week' : 'This Month'}</h3>
            <p className="text-gray-400 font-medium text-sm">Real-time ranking based on net sales volume.</p>
          </div>
          
          <div className="flex bg-gray-50 p-1.5 rounded-[22px] border border-gray-200 flex-wrap">
            {(['today', 'week', 'month'] as FilterRange[]).map((range) => (
              <button 
                key={range}
                onClick={() => setFilterRange(range)}
                className={`px-6 py-2.5 rounded-[16px] text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${filterRange === range ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <Table headers={['Rank', 'Staff Member', 'Role', 'Outlet', 'Sales (KES)', 'Transactions', 'Avg Sale', 'Top Product', 'Hours', 'Actions']} loading={loading}>
          {staffData.length > 0 ? [...staffData].sort((a, b) => b.salesVolume - a.salesVolume).map((staff, idx) => (
            <tr 
              key={staff.id} 
              className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
              onClick={() => openDrawer(staff)}
            >
              <td className="px-6 py-5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50">
                  {idx === 0 ? <Trophy size={16} className="text-yellow-500" /> : 
                   idx === 1 ? <Trophy size={16} className="text-gray-400" /> : 
                   idx === 2 ? <Trophy size={16} className="text-orange-500" /> : 
                   <span className="text-xs font-black text-gray-400">{idx + 1}</span>}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-black text-[10px] overflow-hidden relative">
                    {staff.avatarUrl ? <Image src={staff.avatarUrl} alt="" fill className="object-cover" unoptimized /> : staff.name[0]}
                  </div>
                  <span className="font-bold text-brand-dark group-hover:text-brand-green transition-colors">{staff.name}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{staff.role}</span>
              </td>
              <td className="px-6 py-5 text-sm font-medium text-gray-500">{staff.outlet}</td>
              <td className="px-6 py-5 font-black text-brand-dark">{staff.salesVolume.toLocaleString()} KES</td>
              <td className="px-6 py-5 text-sm font-bold text-gray-600">{staff.transactions}</td>
              <td className="px-6 py-5 text-sm font-medium text-gray-500">{Math.round(staff.avgSale).toLocaleString()}</td>
              <td className="px-6 py-5 text-[10px] font-black text-brand-green uppercase tracking-tight">{staff.topProduct}</td>
              <td className="px-6 py-5 text-xs font-bold text-gray-500">{staff.isOnline ? `${staff.hoursOnShift.toFixed(1)}h` : '---'}</td>
              <td className="px-6 py-5">
                <button className="p-2 hover:bg-brand-green/5 text-gray-300 group-hover:text-brand-green transition-colors">
                  <ExternalLink size={16} />
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={10} className="py-20 text-center font-medium text-gray-400 italic">
                No sales data yet for this period
              </td>
            </tr>
          )}
        </Table>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Shift Log */}
        <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden h-fit">
          <div className="p-8 border-b border-gray-50">
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Shift Log — Today</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Staff Name</th>
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Clock In</th>
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Clock Out</th>
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shifts.length > 0 ? shifts.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-5 font-bold text-brand-dark">{log.staffName}</td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">{log.clockIn}</td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">{log.clockOut || '---'}</td>
                    <td className="px-8 py-5">
                      <Badge variant={log.status === 'active' ? 'success' : 'info'} className="text-[8px] font-black uppercase">
                        {log.status === 'active' ? 'ON SHIFT' : 'OFF SHIFT'}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-gray-400 text-sm italic">No shifts recorded today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Monthly Leaderboard */}
        <section className="space-y-6">
          <h3 className="text-2xl font-black text-brand-dark tracking-tighter uppercase tracking-[-0.04em]">This Month&apos;s Top Performers</h3>
          <div className="space-y-4">
            {staffData.length > 0 ? [...staffData].sort((a, b) => b.salesVolume - a.salesVolume).slice(0, 5).map((staff, idx) => (
              <Card key={staff.id} className="p-6 border-none bg-white hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-300' : idx === 2 ? 'bg-orange-500' : 'bg-transparent'}`} />
                <div className="flex items-center gap-6">
                  <div className={`text-2xl font-black ${idx < 3 ? 'text-brand-dark opacity-100' : 'text-gray-200'}`}>
                    #{idx + 1}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-dark font-black overflow-hidden relative border border-gray-100">
                    {staff.avatarUrl ? <Image src={staff.avatarUrl} alt="" fill className="object-cover" unoptimized /> : staff.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-brand-dark truncate">{staff.name}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{staff.salesVolume.toLocaleString()} KES total</p>
                  </div>
                  <div className="w-24 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-green" 
                      style={{ width: `${(staff.salesVolume / Math.max(...staffData.map(s => s.salesVolume || 1))) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            )) : (
              <p className="text-center py-10 text-gray-400 italic">Waiting for data...</p>
            )}
          </div>
        </section>
      </div>

      {/* Detail Drawer */}
      {selectedStaff && (
        <ActivityDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          staff={{
            name: selectedStaff.name,
            role: selectedStaff.role,
            outlet: selectedStaff.outlet,
            avatarUrl: selectedStaff.avatarUrl,
            salesToday: selectedStaff.salesVolume,
            transactionsToday: selectedStaff.transactions,
            avgSale: selectedStaff.avgSale
          }}
          salesTimeline={timelineData}
          recentActions={auditLogs}
        />
      )}
    </div>
  );
}
