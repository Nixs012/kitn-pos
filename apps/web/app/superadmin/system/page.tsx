import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  Database, 
  Terminal, 
  History, 
  Trash2, 
  HardDrive
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default async function SuperAdminSystem() {
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

  // 1. Fetch table row counts
  const tables = ['tenants', 'branches', 'user_profiles', 'products', 'sales', 'sale_items', 'inventory'];
  const tableStats = await Promise.all(tables.map(async (table) => {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    return { name: table, count: count || 0 };
  }));

  // 2. Fetch last 20 audit logs
  const { data: logs } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // 3. Est. DB Size (Pseudo-calculation for UI)
  const totalRows = tableStats.reduce((sum, t) => sum + t.count, 0);
  const estSizeMB = Math.round((totalRows * 0.002) + 12.5); // 0.002MB per row + base metadata
  const quotaMB = 500;
  const usagePercent = Math.min(Math.round((estSizeMB / quotaMB) * 100), 100);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">System Core</h2>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Database & Infrastructure Logs</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="border-white/10 text-gray-400 hover:text-white gap-2 text-[10px] font-black uppercase">
             <Trash2 size={14} /> Run DB Cleanup
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Storage Health */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#0D1117] border border-white/5 rounded-[40px] p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
               <HardDrive size={16} className="text-[#D85A30]" /> Storage Health
            </h3>
            <div className="space-y-8">
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-2xl font-black text-white tracking-tighter">{estSizeMB} MB</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Est. Workspace Size</p>
                     </div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{usagePercent}% of {quotaMB}MB</p>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                     <div 
                        className="h-full bg-gradient-to-r from-[#D85A30] to-[#FF8C69] rounded-full transition-all duration-1000 shadow-lg shadow-[#D85A30]/20" 
                        style={{ width: `${usagePercent}%` }}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                     <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Backup Frequency</p>
                     <p className="text-xs font-black text-white uppercase tracking-widest">Daily (2AM)</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                     <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Region</p>
                     <p className="text-xs font-black text-white uppercase tracking-widest">aws-eu-west-1</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-[#0D1117] border border-white/5 rounded-[40px] p-8">
             <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Database size={16} className="text-[#D85A30]" /> Table Usage
             </h3>
             <div className="space-y-4">
                {tableStats.map((stat) => (
                  <div key={stat.name} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/5 transition-colors">
                     <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{stat.name}</span>
                     <span className="text-sm font-black text-white bg-white/5 px-3 py-1 rounded-lg tabular-nums">{stat.count.toLocaleString()}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-2">
           <div className="bg-[#0D1117] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl h-full">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={16} className="text-[#D85A30]" /> System Audit Stream
                 </h3>
                 <Badge variant="gray" className="animate-pulse">Live Logging</Badge>
              </div>
              <div className="p-4">
                 {logs && logs.length > 0 ? (
                   <div className="space-y-2 font-mono">
                      {logs.map((log, i) => (
                        <div key={log.id || i} className="p-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors rounded-xl flex items-start justify-between group">
                           <div className="flex items-start gap-4">
                              <span className="text-[10px] text-gray-600 mt-1 whitespace-nowrap">
                                {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
                              </span>
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${log.action?.includes('delete') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                      {log.action}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-500">{log.table_name}</span>
                                 </div>
                                 <p className="text-xs text-blue-400 break-all">{JSON.stringify(log.details || log.metadata || '{}')}</p>
                              </div>
                           </div>
                           <div className="text-[9px] font-bold text-gray-700 uppercase group-hover:text-[#D85A30] transition-colors">
                              Tenant: {log.tenant_id?.slice(0, 8)}
                           </div>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="py-32 text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full mx-auto flex items-center justify-center text-gray-700">
                         <History size={32} />
                      </div>
                      <p className="text-xs font-black text-gray-600 uppercase tracking-[0.2em]">No logs detected in the last stream</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
