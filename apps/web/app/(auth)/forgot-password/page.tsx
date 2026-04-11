'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import KitnLogo from '@/components/ui/KitnLogo'
import * as toast from '@/lib/toast'
import { Mail, ChevronLeft, Send } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard/profile`, // Or a dedicated reset-password page
    })

    if (error) {
      toast.showError(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
      toast.showSuccess('Reset link sent to your email!')
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1d1d35]/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 p-6">
        <div className="flex flex-col items-center mb-8">
          <KitnLogo size="lg" className="mb-3" />
          <h1 className="text-xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400 text-[10px] mt-1 text-center max-w-[200px]">
            Enter your email to receive a secure password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-6 py-4">
            <div className="p-4 bg-brand-green/10 rounded-2xl border border-brand-green/20">
              <p className="text-brand-green text-xs font-bold">SENT SUCCESSFULLY!</p>
              <p className="text-gray-400 text-[10px] mt-2 italic">Please check your inbox (and spam) for the reset link.</p>
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center text-xs font-black text-white hover:text-brand-green transition-colors gap-2"
            >
              <ChevronLeft size={14} /> BACK TO LOGIN
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-green transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 pr-3 py-3 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-brand-green transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-xl text-xs font-black text-white bg-brand-green hover:bg-[#188B67] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all disabled:opacity-50"
            >
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
              {!loading && <Send className="ml-2 w-3.5 h-3.5" />}
            </button>

            <div className="text-center pt-2">
              <Link 
                href="/login" 
                className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <ChevronLeft size={12} /> I REMEMBERED MY PASSWORD
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
