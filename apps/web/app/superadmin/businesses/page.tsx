import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  MapPin, 
  Users, 
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { BusinessActions } from '@/app/superadmin/businesses/BusinessActions';
import { BusinessHeader } from '@/app/superadmin/businesses/BusinessHeader';

export default async function SuperAdminBusinesses() {
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

  // Fetch all tenants with their subscription data
  const { data: businesses, error } = await supabase
    .from('tenants')
    .select(`
      *,
      subscriptions (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-red-400 font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-3">
      <AlertCircle size={20} /> Error loading businesses: {error.message}
    </div>;
  }

  // Fetch counts for branches and staff for each tenant
  // (In a real app, we might use a Postgres View or RPC to avoid N+1 issues)
  const businessesWithMetrics = await Promise.all(businesses.map(async (b) => {
    const { count: outlets } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', b.id);

    const { count: staff } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', b.id);

    // Sum sales this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // This is the expensive part - we join branches to get sales for this tenant
    const { data: branches } = await supabase.from('branches').select('id').eq('tenant_id', b.id);
    const branchIds = branches?.map(br => br.id) || [];
    
    let monthlySales = 0;
    if (branchIds.length > 0) {
        const { data: sales } = await supabase
          .from('sales')
          .select('total_amount')
          .in('branch_id', branchIds)
          .gte('created_at', startOfMonth);
        
        monthlySales = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
    }

    return {
      ...b,
      outletCount: outlets || 0,
      staffCount: staff || 0,
      monthlySales
    };
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <BusinessHeader totalCount={businessesWithMetrics.length} />

      <div className="bg-[#0D1117] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Business & Local</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Tier & Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Scale</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Sales (Month)</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {businessesWithMetrics.map((biz) => (
                <tr key={biz.id} className={`group hover:bg-white/[0.02] transition-colors ${biz.suspended ? 'opacity-40 grayscale animate-pulse' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white tracking-tight uppercase group-hover:text-[#D85A30] transition-colors">{biz.name}</span>
                        {biz.suspended && <Badge variant="danger" className="text-[8px] px-1.5 py-0">SUSPENDED</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                        <MapPin size={10} className="text-[#D85A30]" /> {biz.county} • {biz.business_type}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <PlanBadge plan={biz.subscriptions?.plan || 'free'} />
                        <StatusBadge status={biz.subscriptions?.status || 'trial'} />
                      </div>
                      <div className="text-[9px] font-bold text-gray-600 uppercase flex items-center gap-1">
                        <Clock size={10} /> Joined {new Date(biz.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <Zap size={12} />
                        </div>
                        <span className="text-xs font-black text-white">{biz.outletCount} Outlets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                          <Users size={12} />
                        </div>
                        <span className="text-xs font-black text-white">{biz.staffCount} Staff</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-mono text-sm font-black text-[#D85A30] tracking-tighter">
                    KES {biz.monthlySales.toLocaleString()}
                  </td>
                  <td className="px-6 py-6">
                    <BusinessActions 
                        tenantId={biz.id} 
                        currentPlan={biz.subscriptions?.plan || 'free'} 
                        isSuspended={biz.suspended}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const PlanBadge = ({ plan }: { plan: string }) => {
  const styles = {
    free: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    basic: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-500/5",
    pro: "bg-[#D85A30]/10 text-[#D85A30] border-[#D85A30]/20 shadow-lg shadow-[#D85A30]/5"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[plan as keyof typeof styles] || styles.free}`}>
      {plan}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    active: "text-green-500",
    trial: "text-orange-400",
    expired: "text-red-500"
  };
  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${styles[status as keyof typeof styles] || 'text-gray-400'}`}>
      <div className={`w-1.5 h-1.5 rounded-full bg-current ${status === 'active' ? 'animate-pulse' : ''}`} />
      {status}
    </div>
  );
};
