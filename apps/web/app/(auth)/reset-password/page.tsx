'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import KitnLogo from '@/components/ui/KitnLogo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import * as toast from '@/lib/toast';
import { Lock, ShieldCheck, ChevronRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Ensure we have a session (either from the link or already active)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.showError('Session expired or invalid link. Please request a new recovery email.');
        router.push('/login');
      } else {
        setVerifying(false);
      }
    });
  }, [supabase.auth, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.showError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.showError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.showSuccess('Password updated successfully!');
      
      // Clear session or redirect to dashboard
      router.push('/dashboard');
      router.refresh();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Update failed';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
        <div className="animate-pulse space-y-4 text-center">
           <KitnLogo size="lg" className="mx-auto" />
           <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.2em]">Verifying Security Token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1d1d35]/60 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/10 transition-all duration-500 hover:shadow-brand-green/10">
        <div className="p-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-4 text-brand-green border border-brand-green/20">
               <ShieldCheck size={32} />
            </div>
            <KitnLogo size="sm" className="mb-2 opacity-50" />
            <h1 className="text-2xl font-black text-white tracking-tight uppercase italic underline decoration-brand-green">Security Override</h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2">Establish your new account password</p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <Input 
              label="New Secure Password"
              placeholder="Min. 8 characters"
              type="password"
              icon={<Lock size={16} />}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white"
            />

            <Input 
              label="Confirm Password"
              placeholder="Repeat password"
              type="password"
              icon={<Lock size={16} />}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white"
            />

            <div className="pt-4">
              <Button 
                type="submit" 
                loading={loading}
                className="w-full py-4 bg-brand-green hover:bg-brand-green/80 gap-2 font-black uppercase tracking-widest"
              >
                Update Password <ChevronRight size={18} />
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
            Changing your password will update your security credentials across all KiTN terminal nodes.
          </p>
        </div>
      </div>
    </div>
  );
}
