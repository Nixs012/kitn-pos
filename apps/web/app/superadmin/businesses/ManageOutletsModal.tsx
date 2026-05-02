'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Trash2, 
  Plus, 
  Building2,
  Phone,
  PowerOff,
  Power
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import * as toast from '@/lib/toast';

interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
  is_active: boolean;
}

export default function ManageOutletsModal({
  isOpen,
  onClose,
  tenantId,
  tenantName
}: {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
}) {
  const [outlets, setOutlets] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newOutlet, setNewOutlet] = useState({ name: '', location: '', phone: '' });
  const supabase = createClient();

  const fetchOutlets = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOutlets(data || []);
    } catch (err) {
      console.error('Fetch outlets error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, supabase]);

  useEffect(() => {
    if (isOpen) fetchOutlets();
  }, [isOpen, fetchOutlets]);

  const handleAddOutlet = async () => {
    if (!newOutlet.name || !newOutlet.location) {
      toast.showError('Name and location are required');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('branches')
        .insert([{
          ...newOutlet,
          tenant_id: tenantId
        }]);

      if (error) throw error;

      toast.showSuccess('New outlet added successfully');
      setNewOutlet({ name: '', location: '', phone: '' });
      setIsAdding(false);
      fetchOutlets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add outlet';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOutlet = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.showSuccess('Outlet deleted');
      fetchOutlets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete outlet. It may have sales records.';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('branches')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.showSuccess(!currentStatus ? 'Outlet activated' : 'Outlet deactivated');
      fetchOutlets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update outlet status';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Outlets: ${tenantName}`} size="md">
      <div className="space-y-6">
        {/* Add Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 hover:border-[#D85A30] hover:text-[#D85A30] transition-all font-black uppercase text-[10px] tracking-widest"
            >
              <Plus size={16} /> Add New Branch for {tenantName}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Branch Name</label>
                  <input 
                    type="text"
                    className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D85A30] outline-none"
                    placeholder="e.g. Nairobi Central"
                    value={newOutlet.name}
                    onChange={(e) => setNewOutlet({...newOutlet, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Location</label>
                  <input 
                    type="text"
                    className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D85A30] outline-none"
                    placeholder="e.g. Kenyatta Avenue"
                    value={newOutlet.location}
                    onChange={(e) => setNewOutlet({...newOutlet, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Phone Number</label>
                  <input 
                    type="text"
                    className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D85A30] outline-none"
                    placeholder="07XX XXX XXX"
                    value={newOutlet.phone}
                    onChange={(e) => setNewOutlet({...newOutlet, phone: e.target.value})}
                  />
                </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddOutlet} loading={loading} className="flex-1 bg-[#D85A30]">Create Branch</Button>
              </div>
            </div>
          )}
        </div>

        {/* List Section */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
          {outlets.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic text-sm">
              No outlets registered for this business yet.
            </div>
          ) : (
            outlets.map((outlet) => (
              <div key={outlet.id} className={`p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all ${!outlet.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${!outlet.is_active ? 'bg-red-500/10 text-red-400' : 'bg-[#D85A30]/10 text-[#D85A30]'}`}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-white text-sm uppercase tracking-tight">{outlet.name}</h4>
                      {!outlet.is_active && <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded">INACTIVE</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><MapPin size={10} /> {outlet.location}</span>
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><Phone size={10} /> {outlet.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleActive(outlet.id, outlet.is_active)}
                    className={`p-2 rounded-lg transition-all ${!outlet.is_active ? 'text-green-500 hover:bg-green-500/10' : 'text-orange-500 hover:bg-orange-500/10'}`}
                    title={!outlet.is_active ? 'Activate' : 'Deactivate'}
                  >
                    {!outlet.is_active ? <Power size={16} /> : <PowerOff size={16} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteOutlet(outlet.id, outlet.name)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
