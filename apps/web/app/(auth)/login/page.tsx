'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import KitnLogo from '@/components/ui/KitnLogo'
import * as toast from '@/lib/toast'
import { Mail, Lock, ChevronRight, UserCircle2, ShieldCheck, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'

type Role = 'admin' | 'manager' | 'cashier'

const roles: { id: Role; label: string; color: string; icon: React.ReactNode }[] = [
  { id: 'admin', label: 'Administrator', color: 'text-brand-green', icon: <ShieldCheck size={16} /> },
  { id: 'manager', label: 'Store Manager', color: 'text-brand-blue', icon: <UserCircle2 size={16} /> },
  { id: 'cashier', label: 'POS Cashier', color: 'text-brand-purple', icon: <ArrowRight size={16} /> },
]

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('cashier')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoClicks, setLogoClicks] = useState(0)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [recoveryKey, setRecoveryKey] = useState('')

  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      toast.showError(error.message)
      setLoading(false)
    } else {
      toast.showSuccess('Successfully signed in!')
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1
    setLogoClicks(newClicks)
    if (newClicks >= 5) {
      setIsRecoveryMode(true)
      setLogoClicks(0)
      toast.showSuccess('Entering System Recovery Mode')
    }
  }

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/verify-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: recoveryKey })
      })

      const data = await res.json()
      if (data.success) {
        toast.showSuccess('System Recovery Verified!')
        // Logic for what happens after recovery
        // For example: Redirect to a global settings or admin reset page
        router.push('/superadmin') 
      } else {
        toast.showError(data.error || 'Recovery verification failed')
      }
    } catch (err) {
      console.error('Recovery error:', err)
      toast.showError('Network error: Unable to connect to recovery server')
    } finally {
      setLoading(false)
      setIsRecoveryMode(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-6 font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-green/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-brand-blue/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] relative">
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10" />
        
        <div className="relative p-10 space-y-8">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div 
              className="cursor-pointer transition-transform active:scale-95 select-none"
              onClick={handleLogoClick}
            >
              <KitnLogo size="lg" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Welcome</h1>
              <p className="text-gray-400 text-sm font-medium">KiTN POS Enterprise Terminal</p>
            </div>
          </div>

          {isRecoveryMode ? (
            <form onSubmit={handleRecoverySubmit} className="space-y-6 animate-in fade-in zoom-in duration-300">
               <div className="p-4 bg-brand-coral/10 border border-brand-coral/20 rounded-2xl text-center">
                  <p className="text-brand-coral text-xs font-black uppercase tracking-widest">System Recovery Mode</p>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Recovery Key</label>
                 <input
                   type="password"
                   placeholder="Enter 32-char key"
                   value={recoveryKey}
                   onChange={e => setRecoveryKey(e.target.value)}
                   className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none transition-all placeholder:text-gray-600"
                 />
               </div>
               <Button className="w-full bg-brand-coral hover:bg-brand-coral/90 h-[56px] text-sm font-black uppercase tracking-widest" type="submit">
                  Verify Access
               </Button>
               <button 
                type="button" 
                onClick={() => setIsRecoveryMode(false)}
                className="w-full text-center text-xs font-bold text-gray-500 hover:text-white transition-colors"
               >
                 Cancel Recovery
               </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              {/* Role Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Level</label>
                <div className="relative group">
                   <select 
                     value={selectedRole}
                     onChange={(e) => setSelectedRole(e.target.value as Role)}
                     className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold appearance-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all cursor-pointer"
                   >
                     {roles.map(role => (
                       <option key={role.id} value={role.id} className="bg-[#1A1A2E] text-white py-2">
                         {role.label}
                       </option>
                     ))}
                   </select>
                   <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-500 group-hover:text-white transition-colors">
                      <ChevronRight size={16} className="rotate-90" />
                   </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                   <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-green transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-all placeholder:text-gray-600"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-blue transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded-md border-white/10 bg-white/5 text-brand-green focus:ring-brand-green outline-none transition-all" />
                  Remember Session
                </label>
              </div>

              <Button 
                className="w-full bg-brand-green hover:bg-brand-green/90 h-[60px] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-green/10" 
                type="submit"
                loading={loading}
              >
                Sign In Terminal
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
              Proprietary System of KiTN POS. Unauthorized access is prohibited by Kenyan Cybercrime Laws.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
