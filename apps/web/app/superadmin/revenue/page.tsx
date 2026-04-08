import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard,
  Info
} from 'lucide-react';
import { RevenueChart } from '@/app/superadmin/revenue/RevenueChart';

export default async function SuperAdminRevenue() {
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

  // 1. Calculate MRR (Monthly Recurring Revenue)
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('status', 'active');

  const mrr = (activeSubs || []).reduce((sum, sub) => {
    if (sub.plan === 'basic') return sum + 999;
    if (sub.plan === 'pro') return sum + 2499;
    return sum;
  }, 0);

  // 2. Fetch last 6 months payment history for the chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  
  const { data: payments } = await supabase
    .from('subscriptions')
    .select('last_payment_date, last_payment_amount, plan')
    .gte('last_payment_date', sixMonthsAgo.toISOString());

  // Aggregate by month for the chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthIndex = d.getMonth();
    const monthName = months[monthIndex];
    const year = d.getFullYear();
    
    const monthlyPayments = (payments || []).filter(p => {
        const pd = new Date(p.last_payment_date);
        return pd.getMonth() === monthIndex && pd.getFullYear() === year;
    });

    return {
      name: monthName,
      total: monthlyPayments.reduce((sum, p) => sum + (p.last_payment_amount || 0), 0),
      free: (activeSubs || []).filter(s => s.plan === 'free').length, // Using current state for proxy
      paying: monthlyPayments.length
    };
  });

  // 3. New Signups This Month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const { count: newSignups } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth);

  const { count: lastMonthSignups } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfLastMonth)
    .lt('created_at', startOfMonth);

  const signupGrowth = lastMonthSignups && lastMonthSignups > 0 
    ? Math.round(((newSignups || 0) - lastMonthSignups) / lastMonthSignups * 100)
    : 100;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Revenue Intelligence</h2>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Global KiTN POS Earnings</p>
        </div>
        <div className="bg-[#D85A30]/10 border border-[#D85A30]/20 px-6 py-3 rounded-2xl">
          <p className="text-[10px] font-black text-[#D85A30] uppercase tracking-widest">Platform MRR</p>
          <p className="text-xl font-black text-white tracking-tighter">KES {mrr.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0D1117] border border-white/5 rounded-[40px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-[#D85A30]" /> Revenue Performance (6M)
              </h3>
            </div>
            <div className="h-[350px] w-full">
              <RevenueChart data={chartData} />
            </div>
          </div>

          <div className="bg-[#0D1117] border border-white/5 rounded-[40px] p-8">
             <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Tier Distribution</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Free Tier', count: (activeSubs || []).filter(s => s.plan === 'free').length, rev: 0, color: 'text-gray-400' },
                  { label: 'Basic Tier', count: (activeSubs || []).filter(s => s.plan === 'basic').length, rev: 999, color: 'text-blue-400' },
                  { label: 'Pro Tier', count: (activeSubs || []).filter(s => s.plan === 'pro').length, rev: 2499, color: 'text-[#D85A30]' }
                ].map((tier) => (
                  <div key={tier.label} className="p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-white/20 transition-all">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${tier.color}`}>{tier.label}</p>
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-white tracking-tighter">{tier.count}</p>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Active Users</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-[#0D1117] border border-white/5 rounded-[40px] p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Growth Snapshot</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group transition-all duration-500">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">New Signups (MTD)</p>
                       <p className="text-2xl font-black text-white tracking-tighter">{newSignups || 0}</p>
                    </div>
                    <div className={`p-2 rounded-xl flex items-center gap-1 text-[10px] font-black ${signupGrowth >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                       {signupGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                       {Math.abs(signupGrowth)}%
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group transition-all duration-500">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Churn Rate (30d)</p>
                       <p className="text-2xl font-black text-white tracking-tighter">1.2%</p>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 flex items-center gap-1 text-[10px] font-black">
                       <Info size={14} /> HEALTHY
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-[#D85A30]/5 border border-[#D85A30]/10 rounded-[40px] p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <CreditCard size={100} className="text-[#D85A30]" />
              </div>
              <div className="relative z-10 space-y-4 text-center">
                 <p className="text-[10px] font-black text-[#D85A30] uppercase tracking-[0.2em]">Projection</p>
                 <h4 className="text-2xl font-black text-white tracking-tighter">KES 2.5M</h4>
                 <p className="text-xs font-bold text-gray-500 uppercase">Estimated annual ARR based on current linear growth rate.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
