'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  User, 
  Rocket 
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import * as toast from '@/lib/toast';

const KENYA_COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", "Wajir", "Mandera", "Marsabit",
  "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga",
  "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans-Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Baringo",
  "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia",
  "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
].sort();

export const RegisterPartnerModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    business_type: 'retail',
    county: 'Nairobi',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    plan: 'free'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.showSuccess('Business registered successfully');
      onClose();
      router.refresh();
      
      // Reset form
      setFormData({
        name: '',
        business_type: 'retail',
        county: 'Nairobi',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        plan: 'free'
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Platform Partner" size="lg">
      <form onSubmit={handleSubmit} className="space-y-8 py-4">
        {/* Business Info Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#D85A30]" />
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Business Configuration</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Business Name" 
              placeholder="e.g. Imani Collective"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Business Type</label>
              <select 
                className="w-full h-[46px] bg-white/5 border border-white/10 rounded-2xl px-5 py-2 font-bold text-sm focus:border-[#D85A30] focus:outline-none transition-all appearance-none text-white"
                value={formData.business_type}
                onChange={e => setFormData({...formData, business_type: e.target.value})}
              >
                {['retail', 'supermarket', 'wholesale', 'grocery', 'service'].map(t => (
                  <option key={t} value={t} className="bg-[#0D1117] text-white uppercase">{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Location County</label>
              <select 
                className="w-full h-[46px] bg-white/5 border border-white/10 rounded-2xl px-5 py-2 font-bold text-sm focus:border-[#D85A30] focus:outline-none transition-all appearance-none text-white"
                value={formData.county}
                onChange={e => setFormData({...formData, county: e.target.value})}
              >
                {KENYA_COUNTIES.map(c => (
                  <option key={c} value={c} className="bg-[#0D1117] text-white">{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Initial Plan</label>
              <div className="flex bg-white/5 rounded-2xl p-1 gap-1 border border-white/5">
                {['free', 'basic', 'pro'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({...formData, plan: p})}
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${
                      formData.plan === p ? 'bg-[#D85A30] text-white' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Info Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Primary Administrator</h3>
          </div>
          
          <Input 
            label="Admin Full Name" 
            placeholder="e.g. Nixon Nixon"
            icon={<User size={16} />}
            value={formData.admin_name}
            onChange={e => setFormData({...formData, admin_name: e.target.value})}
            required
            className="bg-white/5 border-white/10 text-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Admin Email Address" 
              placeholder="admin@business.com"
              type="email"
              icon={<Mail size={16} />}
              value={formData.admin_email}
              onChange={e => setFormData({...formData, admin_email: e.target.value})}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <Input 
              label="Initial Password" 
              placeholder="Min. 8 characters"
              type="password"
              icon={<Lock size={16} />}
              value={formData.admin_password}
              onChange={e => setFormData({...formData, admin_password: e.target.value})}
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            variant="ghost" 
            type="button" 
            onClick={onClose} 
            className="flex-1 text-gray-500 hover:text-white uppercase font-black"
          >
            Cancel
          </Button>
          <Button 
            loading={loading} 
            type="submit" 
            className="flex-[2] bg-[#D85A30] hover:bg-[#D85A30]/80 gap-2 uppercase font-black"
          >
            <Rocket size={18} /> Deploy Business Node
          </Button>
        </div>
      </form>
    </Modal>
  );
};
