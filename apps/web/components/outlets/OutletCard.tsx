'use client';

import React from 'react';
import { 
  MapPin, 
  Users, 
  AlertTriangle,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export interface OutletCardProps {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
  managerName?: string;
  metrics: {
    todaySales: number;
    transactions: number;
    staffActive: string; // e.g. "3/5"
    lowStockCount: number;
  };
  stockHealth: {
    percentage: number; // 0-100
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  lastUpdated: string;
  onManageStock: () => void;
}

export default function OutletCard({
  id,
  name,
  location,
  isOnline,
  managerName,
  metrics,
  stockHealth,
  lastUpdated,
  onManageStock
}: OutletCardProps) {
  const healthColor = stockHealth.percentage > 80 ? 'bg-brand-green' : stockHealth.percentage > 40 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <Card className="p-8 relative overflow-hidden group hover:border-brand-green/20 transition-all duration-500 bg-white shadow-sm border-gray-100/50">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-green/5 flex items-center justify-center text-brand-green relative shrink-0">
            <MapPin size={24} />
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-brand-green' : 'bg-gray-300'}`} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter leading-tight group-hover:text-brand-green transition-colors">{name}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 mb-2">{location}</p>
            {managerName && (
              <p className="text-[10px] font-black text-brand-dark/60 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Manager: {managerName}
              </p>
            )}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isOnline ? 'bg-green-50 text-brand-green border border-brand-green/10' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/30">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Today&apos;s Sales</p>
          <div className="flex items-end gap-1.5">
             <span className="text-sm font-black text-brand-dark">{metrics.todaySales.toLocaleString()}</span>
             <span className="text-[9px] font-bold text-gray-400 pb-0.5">KES</span>
          </div>
        </div>
        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/30">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Transactions</p>
          <span className="text-sm font-black text-brand-dark">{metrics.transactions}</span>
        </div>
        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/30">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Staff Active</p>
          <div className="flex items-center gap-1.5 font-black text-brand-dark">
            <Users size={14} className="text-brand-green" />
            <span className="text-sm">{metrics.staffActive}</span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border ${metrics.lowStockCount > 0 ? 'bg-red-50/30 border-red-100/50' : 'bg-gray-50/50 border-gray-100/30'}`}>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Low Stock</p>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className={metrics.lowStockCount > 0 ? 'text-red-500' : 'text-gray-300'} />
            <span className={`text-sm font-black ${metrics.lowStockCount > 0 ? 'text-red-600' : 'text-brand-dark'}`}>{metrics.lowStockCount} Items</span>
          </div>
        </div>
      </div>

      {/* Stock Health Bar */}
      <div className="space-y-3 mb-8">
        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
          <span>Stock Health</span>
          <span className="text-brand-dark">{stockHealth.percentage}% Optimal</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${healthColor}`}
            style={{ width: `${stockHealth.percentage}%` }}
          />
        </div>
        <p className="text-[10px] font-bold text-gray-500">
          {stockHealth.totalProducts} products &middot; <span className={stockHealth.lowStock > 0 ? 'text-orange-500' : ''}>{stockHealth.lowStock} low stock</span> &middot; <span className={stockHealth.outOfStock > 0 ? 'text-red-500 text-black' : ''}>{stockHealth.outOfStock} out of stock</span>
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-50">
        <Link href={`/dashboard/outlets/${id}`} className="flex-1">
          <Button variant="outline" className="w-full justify-center gap-2 text-xs border-gray-200 hover:bg-gray-50">
            View Details
            <ChevronRight size={14} />
          </Button>
        </Link>
        <Button 
          onClick={onManageStock}
          className="flex-1 justify-center gap-2 text-xs bg-[#378ADD] hover:bg-[#378ADD]/90"
        >
          <ArrowRightLeft size={14} />
          Manage Stock
        </Button>
      </div>
      <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-4 text-center">Last updated: {lastUpdated}</p>
    </Card>
  );
}
