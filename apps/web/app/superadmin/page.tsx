import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Zap,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Settings2,
  Download
} from 'lucide-react';
import Link from 'next/link';

export default async function SuperAdminOverview() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // Stats Fetching
  const { count: totalTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true });

  const { count: payingCustomers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .neq('plan', 'free')
    .eq('status', 'active');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { data: monthlyRevenue } = await supabase
    .from('subscriptions')
    .select('last_payment_amount')
    .gte('last_payment_date', startOfMonth);

  const totalMonthlyRev = monthlyRevenue?.reduce((sum, sub) => sum + (sub.last_payment_amount || 0), 0) || 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const { count: todaySales } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString());

  // Fetch 10 most recent sales across all tenants
  const { data: recentSales } = await supabase
    .from('sales')
    .select(`
      id,
      total_amount,
      created_at,
      payment_method,
      branches (
        name,
        tenants (
          name
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  interface SaleWithTenant {
    id: string;
    total_amount: number;
    created_at: string;
    payment_method: string;
    branches: {
      name: string;
      tenants: {
        name: string;
      }
    } | null;
  }

  const sales = (recentSales as unknown as SaleWithTenant[]) || [];

  const stats = [
    { 
      label: 'Total Businesses', 
      value: totalTenants || 0, 
      icon: <Building2 className="text-blue-400" />,
      subtext: 'Registered tenants',
    },
    { 
      label: 'Paying Customers', 
      value: payingCustomers || 0, 
      icon: <CreditCard className="text-[#D85A30]" />,
      subtext: 'Active subscriptions',
    },
    { 
      label: 'Monthly Revenue', 
      value: `KES ${totalMonthlyRev.toLocaleString()}`, 
      icon: <TrendingUp className="text-green-400" />,
      subtext: 'This calendar month',
    },
    { 
      label: 'Today\'s Sales', 
      value: todaySales || 0, 
      icon: <Zap className="text-yellow-400" />,
      subtext: 'Live transactions',
    }
  ];



  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Platform Health</h2>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Global KiTN POS Analytics</p>
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Systems Operational</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#0D1117] border border-white/5 p-8 rounded-[32px] hover:border-[#D85A30]/50 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl">
                  {stat.icon}
                </div>
                <ArrowUpRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
              </div>
              <p className="text-[10px] font-bold text-gray-600 uppercase">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-[#0D1117] border border-white/5 rounded-[40px] p-8 h-full">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Platform Activity</h3>
                <Link href="/superadmin/businesses" className="text-[10px] font-black text-[#D85A30] uppercase tracking-widest flex items-center gap-1 hover:underline">
                  Detailed Report <ChevronRight size={12} />
                </Link>
             </div>
             
             <div className="space-y-4">
               {sales.map((sale) => (
                 <div key={sale.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                          <Zap size={18} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">
                            {sale.branches?.tenants?.name || 'Unknown Business'} • {sale.branches?.name || 'Main'}
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">
                            {new Date(sale.created_at).toLocaleTimeString()} via {sale.payment_method}
                          </p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-[#D85A30] tracking-tighter">KES {sale.total_amount.toLocaleString()}</p>
                       <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Completed</p>
                    </div>
                 </div>
               ))}
               
               {(!recentSales || recentSales.length === 0) && (
                 <div className="flex items-center justify-center py-20 text-gray-600 text-[10px] font-black uppercase tracking-widest italic border-2 border-dashed border-white/5 rounded-3xl">
                    No transactions recorded today
                 </div>
               )}
             </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-[#0D1117] border border-white/5 rounded-[40px] p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Quick Actions</h3>
              <div className="space-y-3">
                 {[
                   { label: 'Register New Partner', icon: <Plus size={16} />, href: '/superadmin/businesses' },
                   { label: 'System Health Check', icon: <Settings2 size={16} />, href: '/superadmin/system' },
                   { label: 'Download Revenue Report', icon: <Download size={16} />, href: '/superadmin/revenue' }
                 ].map(action => (
                   <Link 
                    key={action.label}
                    href={action.href}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-[#D85A30] hover:text-white transition-all group"
                   >
                     <div className="flex items-center gap-3">
                        <div className="text-[#D85A30] group-hover:text-white">{action.icon}</div>
                        <span className="text-[11px] font-black uppercase tracking-widest">{action.label}</span>
                     </div>
                     <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                   </Link>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
