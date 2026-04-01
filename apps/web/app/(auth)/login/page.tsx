'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import KitnLogo from '@/components/ui/KitnLogo'
import { toast } from 'sonner'
import { Mail, Lock, ChevronRight, UserCircle2 } from 'lucide-react'

type Role = 'admin' | 'manager' | 'cashier' | 'viewer'

const roles: { id: Role; label: string; color: string }[] = [
  { id: 'admin', label: 'Admin', color: 'bg-brand-green' },
  { id: 'manager', label: 'Manager', color: 'bg-brand-blue' },
  { id: 'cashier', label: 'Cashier', color: 'bg-brand-purple' },
  { id: 'viewer', label: 'Viewer', color: 'bg-brand-coral' },
]

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('cashier')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'password' | 'pin'>('password')
  const [error, setError] = useState('')
  const [pinError, setPinError] = useState(false)

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
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Successfully signed in!')
      router.push('/dashboard')
      router.refresh()
    }
  }

    const handlePinLogin = async (pinValue: string) => {
      setLoading(true)
      
      // Sign in using the magic link approach via API
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, pin: pinValue })
      })

      const data = await res.json()
      if (data.error) {
        setPinError(true)
        setPin('')
        toast.error(data.error)
      } else {
        toast.success(`Welcome back! Logging you in...`)
        router.push('/dashboard')
        router.refresh()
      }
      setLoading(false)
    }

  const handlePinEntry = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num
      setPin(newPin)
      
      if (newPin.length === 4) {
        handlePinLogin(newPin)
      }
    }
  }

  const clearPin = () => {
    setPin('')
    setPinError(false)
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1d1d35]/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 transition-all duration-500 hover:shadow-brand-blue/10">
        <div className="p-6">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-5">
            <KitnLogo size="lg" className="mb-3" />
            <h1 className="text-xl font-bold text-white">KiTN POS</h1>
            <p className="text-gray-400 text-xs italic">Smart retail for Kenya</p>
          </div>

          {/* Role Selector */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 text-center">Select your role</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight transition-all duration-200 border ${
                    selectedRole === role.id 
                      ? `${role.color} text-white border-transparent scale-105 shadow-lg` 
                      : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-gray-300'
                  }`}
                >
                  {role.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Form Toggle */}
          <div className="flex bg-black/20 rounded-lg p-1 mb-6">
            <button 
              onClick={() => { setAuthMethod('password'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${authMethod === 'password' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              PASSWORD
            </button>
            <button 
              onClick={() => { setAuthMethod('pin'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${authMethod === 'pin' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              PIN CODE
            </button>
          </div>

          {error && <p className="text-red-400 text-[10px] font-bold mb-4 text-center animate-pulse">{error.toUpperCase()}</p>}

          {authMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-3.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-green transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="Email or Phone number"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-brand-green transition-all"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-green transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-brand-green transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] py-0.5">
                <label className="flex items-center text-gray-500 cursor-pointer hover:text-gray-400">
                  <input type="checkbox" className="mr-1.5 rounded border-white/10 bg-white/5 text-brand-green focus:ring-brand-green" />
                  Remember me
                </label>
                <a href="#" className="text-brand-blue font-bold hover:text-brand-blue/80 transition-colors">FORGOT PASSWORD?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-xl text-xs font-black text-white bg-brand-green hover:bg-[#188B67] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
                {!loading && <ChevronRight className="ml-1.5 w-4 h-4" />}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              {/* PIN Dots */}
              <div className="flex justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                      pin.length > i 
                        ? 'bg-brand-purple border-brand-purple scale-110 shadow-[0_0_10px_rgba(127,119,221,0.5)]' 
                        : 'bg-white/5 border-white/10'
                    } ${pin.length === i ? 'animate-pulse bg-white/10' : ''} ${pinError ? 'border-red-500 bg-red-500/20' : ''}`}
                  />
                ))}
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinEntry(num.toString())}
                    disabled={loading}
                    className="h-12 flex items-center justify-center text-lg font-black text-white bg-white/5 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all border border-white/5 hover:border-white/10 shadow-sm disabled:opacity-30"
                  >
                    {num}
                  </button>
                ))}
                <button 
                  onClick={clearPin}
                  className="h-12 flex items-center justify-center text-[10px] font-black tracking-widest bg-brand-coral/10 text-brand-coral rounded-xl hover:bg-brand-coral/20 transition-all border border-brand-coral/20"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => handlePinEntry('0')}
                  disabled={loading}
                  className="h-12 flex items-center justify-center text-lg font-black text-white bg-white/5 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all border border-white/5 hover:border-white/10 shadow-sm disabled:opacity-30"
                >
                  0
                </button>
                <div className="h-12 flex items-center justify-center opacity-30">
                  <UserCircle2 className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-center text-[10px] text-gray-500 font-medium">
              By signing in, you agree to our <a href="#" className="underline hover:text-gray-400">Terms</a> and <a href="#" className="underline hover:text-gray-400">Privacy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
