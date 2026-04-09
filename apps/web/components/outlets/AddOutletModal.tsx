'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Phone, Mail, Clock, UserPlus, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import * as toast from '@/lib/toast';

interface Manager {
  id: string;
  full_name: string;
}

interface AddOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOutletModal({
  isOpen,
  onClose,
  onSuccess
}: AddOutletModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [availableManagers, setAvailableManagers] = useState<Manager[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    town: '',
    phone: '',
    email: '',
    managerId: '',
    hours: 'Mon-Sat 7AM-9PM, Sun 8AM-6PM'
  });

  const fetchManagers = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('tenant_id', profile.tenant_id)
        .eq('role', 'manager');
      
      if (data) setAvailableManagers(data);
    } catch (err: unknown) {
      console.error('Managers fetch error:', err);
    }
  }, [supabase]);

  useEffect(() => {
    if (isOpen) {
      fetchManagers();
    }
  }, [isOpen, fetchManagers]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.town || !formData.phone) {
      toast.showError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Tenant not found');

      const { data: newBranch, error: branchError } = await supabase
        .from('branches')
        .insert({
          tenant_id: profile.tenant_id,
          name: formData.name,
          location: `${formData.address}, ${formData.town}`,
          phone: formData.phone,
          is_active: true
        })
        .select()
        .single();

      if (branchError) throw branchError;

      if (formData.managerId) {
        await supabase
          .from('user_profiles')
          .update({ branch_id: newBranch.id })
          .eq('id', formData.managerId);
      }

      const { data: allProducts } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', profile.tenant_id);
      
      if (allProducts && allProducts.length > 0) {
        const inventoryRows = allProducts.map(p => ({
          product_id: p.id,
          branch_id: newBranch.id,
          quantity: 0,
          reorder_level: 10
        }));

        const { error: invError } = await supabase
          .from('inventory')
          .insert(inventoryRows);
        
        if (invError) console.error('Inventory init error:', invError);
      }

      toast.showSuccess(`${formData.name} added successfully — inventory initialized at 0`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Add branch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add outlet';
      toast.showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[600px] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/5 flex items-center justify-center text-brand-green">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-dark tracking-tighter">Add New Outlet</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Expansion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 h-fit">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Outlet Name*</label>
            <input 
              placeholder="e.g. Westlands Branch"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Physical Address*</label>
              <input 
                placeholder="e.g. Rhapta Road"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Town/Area*</label>
              <input 
                placeholder="e.g. Nairobi"
                value={formData.town}
                onChange={(e) => setFormData({...formData, town: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Phone Number*</label>
              <div className="relative">
                <input 
                  placeholder="e.g. 0712345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-10 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none"
                />
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <input 
                  placeholder="outlet@kitnpos.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-10 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none"
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Assign Manager</label>
            <div className="relative">
              <select 
                value={formData.managerId}
                onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-10 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none appearance-none"
              >
                <option value="">Select a manager to oversee this outlet</option>
                {availableManagers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
              <UserPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Opening Hours</label>
            <div className="relative">
              <input 
                placeholder="e.g. Mon-Sat 7AM-9PM"
                value={formData.hours}
                onChange={(e) => setFormData({...formData, hours: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-10 py-3.5 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none"
              />
              <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8 bg-gray-50 border-t border-gray-100">
          <Button 
            onClick={handleSubmit}
            loading={loading}
            className="w-full py-4 bg-brand-green hover:bg-brand-green/90 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-green/20"
          >
            Create Outlet
            <Save size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
