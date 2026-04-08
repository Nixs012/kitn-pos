'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Zap, 
  PowerOff,
  Power
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export const BusinessActions = ({ 
  tenantId, 
  currentPlan, 
  isSuspended 
}: { 
  tenantId: string, 
  currentPlan: string, 
  isSuspended: boolean 
}) => {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const supabase = createClient();

  const handleUpdatePlan = async () => {
    try {
      setLoading(true);
      // Update tenant tier
      const { error: tError } = await supabase
        .from('tenants')
        .update({ subscription_tier: selectedPlan.toUpperCase() })
        .eq('id', tenantId);

      if (tError) throw tError;

      // Update subscription record
      const { error: sError } = await supabase
        .from('subscriptions')
        .update({ plan: selectedPlan })
        .eq('tenant_id', tenantId);

      if (sError) throw sError;

      toast.success('Subscription plan updated successfully');
      setIsPlanModalOpen(false);
      window.location.reload(); // Refresh to show new data
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Update failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspension = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tenants')
        .update({ suspended: !isSuspended })
        .eq('id', tenantId);

      if (error) throw error;

      toast.success(isSuspended ? 'Business reactivated' : 'Business suspended');
      setIsSuspendModalOpen(false);
      window.location.reload();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-end gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsPlanModalOpen(true)}
        className="text-[10px] font-black uppercase text-gray-500 hover:text-[#D85A30] gap-1.5"
      >
        <Zap size={14} /> Plan
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsSuspendModalOpen(true)}
        className={`text-[10px] font-black uppercase gap-1.5 ${isSuspended ? 'text-green-500' : 'text-red-500 hover:bg-red-500/10'}`}
      >
        {isSuspended ? <Power size={14} /> : <PowerOff size={14} />}
        {isSuspended ? 'Activate' : 'Suspend'}
      </Button>

      {/* Change Plan Modal */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Administrative Plan Override" size="sm">
        <div className="space-y-6">
          <p className="text-xs text-gray-400 font-bold uppercase leading-relaxed">
            Change the subscription tier for this business manually. This bypasses payment prompts.
          </p>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">New Plan Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {['free', 'basic', 'pro'].map(plan => (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={`px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${
                    selectedPlan === plan 
                    ? 'border-[#D85A30] bg-[#D85A30]/5 text-[#D85A30]' 
                    : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsPlanModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleUpdatePlan} loading={loading} className="flex-1 bg-[#D85A30] hover:bg-[#D85A30]/80">Confirm Update</Button>
          </div>
        </div>
      </Modal>

      {/* Suspension Modal */}
      <Modal isOpen={isSuspendModalOpen} onClose={() => setIsSuspendModalOpen(false)} title={isSuspended ? 'Reactivate Business' : 'Suspend Business'} size="sm">
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border-2 ${isSuspended ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'} space-y-4 text-center`}>
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${isSuspended ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              <ShieldAlert size={32} />
            </div>
            <p className="text-sm font-bold text-gray-300 leading-relaxed">
              {isSuspended 
                ? 'Are you sure you want to reactivate this business? All staff members will regain immediate access to the POS.'
                : 'Suspension will block ALL users under this business from accessing their dashboards and POS terminals. This should be used for policy violations or severe non-payment.'}
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsSuspendModalOpen(false)} className="flex-1">Cancel</Button>
            <Button 
                onClick={handleToggleSuspension} 
                loading={loading} 
                className={`flex-1 ${isSuspended ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {isSuspended ? 'Confirm Reactivation' : 'Confirm Suspension'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
