'use client';

import React from 'react';
import { ShieldAlert, Mail, MessageCircle, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function SuspendedPage() {
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-red-100">
        {/* Header Decor */}
        <div className="h-2 bg-red-500 w-full" />
        
        <div className="p-8 md:p-12 text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <ShieldAlert size={40} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Account Suspended</h1>
            <p className="text-sm font-bold text-gray-500 leading-relaxed">
              Your KiTN POS account has been suspended for violating terms or non-payment. 
              Please contact us to resolve this issue.
            </p>
          </div>

          <div className="space-y-4">
            <a 
              href="mailto:support@kitnpos.co.ke" 
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-brand-green/5 transition-colors group"
            >
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-green">
                <Mail size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Support</p>
                <p className="text-sm font-bold text-brand-dark">support@kitnpos.co.ke</p>
              </div>
            </a>

            <a 
              href="https://wa.me/254123456789" 
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-brand-green/5 transition-colors group"
            >
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-green">
                <MessageCircle size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp Business</p>
                <p className="text-sm font-bold text-brand-dark">+254 123 456 789</p>
              </div>
            </a>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="w-full text-red-500 hover:bg-red-50 gap-2"
            >
              <LogOut size={18} /> Sign Out
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KiTN POS Safety Engine</p>
        </div>
      </div>
    </div>
  );
}
