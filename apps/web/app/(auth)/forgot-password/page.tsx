'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import KitnLogo from '@/components/ui/KitnLogo'
import * as toast from '@/lib/toast'
import { Mail, ChevronLeft, Send, ShieldAlert, KeyRound } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      toast.showError(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
      toast.showSuccess('Reset link sent to your administrator email!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-6 font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-brand-coral/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-purple/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] relative">
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/10" />
        
        <div className="relative p-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-brand-coral/10 border border-brand-coral/20 rounded-2xl flex items-center justify-center text-brand-coral">
               <ShieldAlert size={32} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase italic underline decoration-brand-coral">Admin Recovery</h1>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] pt-2">Sensitive Access Restoration</p>
            </div>
          </div>

          {submitted ? (
            <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 bg-brand-green/10 rounded-[24px] border border-brand-green/20 text-center space-y-3">
                <div className="w-12 h-12 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto text-brand-green">
                   <KeyRound size={24} />
                </div>
                <div>
                   <p className="text-brand-green text-sm font-black uppercase tracking-widest">Request Transmitted</p>
                   <p className="text-gray-400 text-[10px] mt-1 font-medium leading-relaxed">
                     If an account exists for this email, a restoration handshake has been initiated. Check your inbox.
                   </p>
                </div>
              </div>
              <Link 
                href="/login" 
                className="w-full flex items-center justify-center h-[56px] text-xs font-black text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all gap-2 uppercase tracking-widest"
              >
                <ChevronLeft size={16} /> Return to Terminal
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                 <p className="text-gray-400 text-[11px] font-medium leading-relaxed text-center">
                    Enter the <span className="text-white font-bold italic">Admin Email</span> associated with your KiTN license to receive a secure restoration link.
                 </p>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-coral transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="Administrator Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white text-sm focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="w-full bg-brand-coral hover:bg-brand-coral/90 h-[60px] text-xs font-black text-white uppercase tracking-[0.2em] shadow-xl shadow-brand-coral/10"
              >
                Initiate Handshake <Send size={14} className="ml-2" />
              </Button>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-[10px] font-black text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1 uppercase tracking-widest"
                >
                  <ChevronLeft size={12} /> Secure Login Terminal
                </Link>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-white/5 text-center">
             <KitnLogo size="sm" className="mx-auto opacity-20 mb-2" />
             <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
               Enterprise Grade Security Protocol KiTN-256
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
