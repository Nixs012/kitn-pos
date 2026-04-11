'use client'

import React from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function NetworkStatusBadge() {
  const { isOnline } = useNetworkStatus()

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all cursor-default group ${
      isOnline 
        ? 'bg-brand-green/5 border-brand-green/10 hover:bg-brand-green/10' 
        : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
    }`}>
      <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] transition-all ${
        isOnline 
          ? 'bg-brand-green shadow-brand-green/50 group-hover:animate-ping' 
          : 'bg-amber-500 shadow-amber-500/50 animate-pulse'
      }`} />
      <span className={`text-[10px] font-black tracking-[0.15em] uppercase ${
        isOnline ? 'text-brand-green' : 'text-amber-600'
      }`}>
        {isOnline ? 'Branch Server Online' : 'Offline Mode'}
      </span>
    </div>
  )
}
