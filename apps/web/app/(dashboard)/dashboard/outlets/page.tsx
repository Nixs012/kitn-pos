'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitBranch, 
  Plus, 
  ArrowRightLeft, 
  Calendar,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/userStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import OutletCard, { OutletCardProps } from '@/components/outlets/OutletCard';
import StockTransferModal from '@/components/outlets/StockTransferModal';
import AddOutletModal from '@/components/outlets/AddOutletModal';

const BRAND_COLORS = ['#1D9E75', '#378ADD', '#D85A30', '#8B5CF6', '#EC4899', '#F59E0B'];

interface BranchWithRelations {
  id: string;
  name: string;
  location: string;
  inventory: Array<{ quantity: number; reorder_level: number }>;
  user_profiles: Array<{ id: string; role: string; full_name: string }>;
}

interface Sale {
  branch_id: string;
  total_amount: number | string;
  created_at: string;
}

export default function OutletsPage() {
  const { profile } = useUserStore();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<OutletCardProps[]>([]);
  const [weeklyComparison, setWeeklyComparison] = useState<{ name: string; revenue: number }[]>([]);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      // 1. Fetch Branches
      const { data: branches } = await supabase
        .from('branches')
        .select(`
          *,
          user_profiles(id, role, full_name),
          inventory(quantity, reorder_level)
        `)
        .eq('tenant_id', profile.tenant_id);

      // 2. Fetch Sales for Metrics and Chart
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', weekStart.toISOString());

      if (branches) {
        const typedBranches = branches as unknown as BranchWithRelations[];
        const typedSales = (sales || []) as unknown as Sale[];

        const processedOutlets: OutletCardProps[] = typedBranches.map((branch) => {
          const branchSales = typedSales.filter((s) => s.branch_id === branch.id);
          const todaySalesArr = branchSales.filter((s) => new Date(s.created_at) >= todayStart);
          
          const inventory = branch.inventory || [];
          const totalProducts = inventory.length;
          const lowStock = inventory.filter((inv) => inv.quantity > 0 && inv.quantity <= inv.reorder_level).length;
          const outOfStock = inventory.filter((inv) => inv.quantity <= 0).length;
          const optimalStock = totalProducts - lowStock - outOfStock;
          const healthPercentage = totalProducts > 0 ? Math.round((optimalStock / totalProducts) * 100) : 100;

          const manager = (branch.user_profiles || []).find((u) => u.role === 'manager');
          const totalStaff = (branch.user_profiles || []).length;

          return {
            id: branch.id,
            name: branch.name,
            location: branch.location,
            isOnline: true, 
            managerName: manager?.full_name,
            metrics: {
              todaySales: todaySalesArr.reduce((acc, s) => acc + Number(s.total_amount), 0),
              transactions: todaySalesArr.length,
              staffActive: `${Math.min(totalStaff, 1)}/${totalStaff}`,
              lowStockCount: lowStock + outOfStock
            },
            stockHealth: {
              percentage: healthPercentage,
              totalProducts,
              lowStock,
              outOfStock
            },
            lastUpdated: 'Just now',
            onManageStock: () => {} // Overwritten in main component usage if needed
          };
        });

        setOutlets(processedOutlets);

        const comparison = processedOutlets.map(out => ({
          name: out.name,
          revenue: typedSales.filter((s) => s.branch_id === out.id).reduce((acc, s) => acc + Number(s.total_amount), 0)
        })).sort((a, b) => b.revenue - a.revenue);
        
        setWeeklyComparison(comparison);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-10 animate-pulse pb-20">
        <div className="h-12 w-64 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => <div key={i} className="h-80 bg-gray-50 rounded-[40px]" />)}
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-brand-dark tracking-tighter leading-none">Outlets & Branches</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-green/10 rounded-full border border-brand-green/20">
              <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">{outlets.length} Total</span>
            </div>
          </div>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" /> {currentDate}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsTransferModalOpen(true)}
            variant="outline"
            className="border-[#378ADD] text-[#378ADD] hover:bg-blue-50 px-6 py-4 flex items-center gap-2"
          >
            <ArrowRightLeft size={18} />
            Transfer Stock
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand-green hover:bg-brand-green/90 px-6 py-4 shadow-xl flex items-center gap-2"
          >
            <Plus size={18} />
            Add New Outlet
          </Button>
        </div>
      </div>

      {outlets.length === 1 ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center bg-gray-50/50 border-dashed border-2 border-gray-200">
           <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green mb-6">
             <GitBranch size={40} />
           </div>
           <h3 className="text-2xl font-black text-brand-dark mb-2">You have one outlet</h3>
           <p className="text-gray-500 max-w-sm mb-8">Add more branches to compare performance, manage cross-outlet stock transfers, and scale your business.</p>
           <Button onClick={() => setIsAddModalOpen(true)} className="bg-brand-green">Add New Outlet Now</Button>
        </Card>
      ) : (
        <>
          {/* Outlets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {outlets.map((outlet) => (
              <OutletCard 
                key={outlet.id}
                {...outlet}
                onManageStock={() => setIsTransferModalOpen(true)}
              />
            ))}
          </div>

          {/* Performance Comparison */}
          <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Branch Comparison — This Week</h3>
                <p className="text-gray-400 font-medium text-sm">Revenue distribution across all operational outlets.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl text-brand-green">
                <BarChart3 size={24} />
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={weeklyComparison}
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 900, fill: '#1A1A2E' }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      fontWeight: 700 
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={32}>
                    {weeklyComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {/* Modals */}
      <StockTransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={fetchData}
      />
      <AddOutletModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
