'use client';

import React from 'react';
import { X, DollarSign, TrendingUp, Hash, Clock, FileText } from 'lucide-react';
import Image from 'next/image';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    name: string;
    role: string;
    outlet: string;
    avatarUrl?: string;
    salesToday: number;
    transactionsToday: number;
    avgSale: number;
  };
  salesTimeline: Array<{
    id: string;
    time: string;
    receiptNumber: string;
    items: string;
    amount: number;
    method: string;
  }>;
  recentActions: Array<{
    id: string;
    action: string;
    table: string;
    time: string;
  }>;
}

export default function ActivityDrawer({
  isOpen,
  onClose,
  staff,
  salesTimeline,
  recentActions,
}: ActivityDrawerProps) {
  if (!isOpen) return null;

  const initials = staff.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-brand-dark/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-500 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-black text-xl relative overflow-hidden">
              {staff.avatarUrl ? (
                <Image src={staff.avatarUrl} alt={staff.name} fill className="object-cover" unoptimized />
              ) : initials}
            </div>
            <div>
              <h3 className="text-2xl font-black text-brand-dark tracking-tighter">{staff.name}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {staff.role} <span className="w-1 h-1 rounded-full bg-gray-300" /> {staff.outlet}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-brand-dark"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* Mini Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-[24px] border border-gray-100">
              <div className="text-brand-green mb-2"><DollarSign size={20} /></div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sales Today</p>
              <p className="text-sm font-black text-brand-dark">{staff.salesToday.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-[24px] border border-gray-100">
              <div className="text-blue-500 mb-2"><Hash size={20} /></div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sales</p>
              <p className="text-sm font-black text-brand-dark">{staff.transactionsToday}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-[24px] border border-gray-100">
              <div className="text-purple-500 mb-2"><TrendingUp size={20} /></div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Sale</p>
              <p className="text-sm font-black text-brand-dark">{staff.avgSale.toLocaleString()}</p>
            </div>
          </div>

          {/* Sales Timeline */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-brand-green" />
              <h4 className="text-sm font-black text-brand-dark uppercase tracking-widest">Sales Timeline</h4>
            </div>
            <div className="space-y-4">
              {salesTimeline.length > 0 ? salesTimeline.map((sale) => (
                <div key={sale.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-brand-green ring-4 ring-brand-green/10" />
                    <div className="w-[1px] flex-1 bg-gray-100 mt-2" />
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sale.time}</span>
                      <span className="text-xs font-black text-brand-dark">{sale.amount.toLocaleString()} KES</span>
                    </div>
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl group-hover:border-brand-green/20 transition-all shadow-sm">
                      <p className="text-sm font-bold text-brand-dark mb-1">Receipt {sale.receiptNumber}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{sale.items}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{sale.method}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center py-10 text-gray-400 text-sm italic">No sales recorded today.</p>
              )}
            </div>
          </section>

          {/* Recent Actions */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              <h4 className="text-sm font-black text-brand-dark uppercase tracking-widest">Recent Actions</h4>
            </div>
            <div className="bg-gray-50 rounded-[32px] overflow-hidden">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Table</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentActions.length > 0 ? recentActions.map((action) => (
                    <tr key={action.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-tight">{action.action}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase">{action.table}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{action.time}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-400 text-xs italic">No recent activity.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
