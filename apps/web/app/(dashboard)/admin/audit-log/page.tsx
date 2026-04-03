import React from 'react';
import { Activity, ShieldCheck, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';

export default function AuditLogPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-brand-dark tracking-tighter">System Audit Log</h1>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <ShieldCheck size={14} className="text-brand-green" /> Immutable Protocol Monitoring Active
        </p>
      </div>

      <Card className="p-20 flex flex-col items-center text-center gap-8 border-dashed border-2 border-gray-100 bg-gray-50/30">
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl shadow-brand-dark/5 flex items-center justify-center text-brand-dark relative z-10 border border-gray-50">
            <Activity size={40} className="animate-pulse" />
          </div>
          <div className="absolute -inset-4 bg-brand-green/5 rounded-full blur-2xl animate-pulse" />
        </div>
        
        <div className="space-y-4 max-w-md">
          <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Audit Engine Disconnected</h3>
          <p className="text-sm font-medium text-gray-500 leading-relaxed">
            The global activity stream is currently being synchronized with the primary database. 
            Real-time event logging will be visible here once the protocol bridge is established.
          </p>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Clock size={16} className="text-brand-blue" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Sync Status: 0% Complete</span>
        </div>
      </Card>
    </div>
  );
}
