'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Image from 'next/image';

interface StaffCardProps {
  name: string;
  role: string;
  avatarUrl?: string;
  clockInTime: string;
  salesToday: number;
  transactionsToday: number;
  isActive?: boolean;
}

export default function StaffCard({
  name,
  role,
  avatarUrl,
  clockInTime,
  salesToday,
  transactionsToday,
  isActive = true,
}: StaffCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const roleColors: Record<string, string> = {
    admin: 'bg-[#D85A30]',
    manager: 'bg-[#378ADD]',
    cashier: 'bg-[#1D9E75]',
  };

  const roleColor = roleColors[role.toLowerCase()] || '#6B7280';

  return (
    <Card className="min-w-[280px] p-6 group hover:border-brand-green/20 transition-all duration-500 bg-white shadow-sm border-gray-100/50">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-brand-dark font-black text-lg border-2 border-white shadow-md overflow-hidden">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} fill className="object-cover" unoptimized />
              ) : (
                <span className="opacity-40">{initials}</span>
              )}
            </div>
            {isActive && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-black text-brand-dark text-lg leading-tight group-hover:text-brand-green transition-colors">{name}</h4>
            <div 
              className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white"
              style={{ backgroundColor: roleColor }}
            >
              {role}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
          <span>Clocked in at</span>
          <span className="text-brand-dark font-black tracking-tighter">{clockInTime}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sales Today</p>
            <p className="text-sm font-black text-brand-dark">{salesToday.toLocaleString()} <span className="text-[9px] opacity-40">KES</span></p>
          </div>
          <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Activity</p>
            <p className="text-sm font-black text-brand-dark">{transactionsToday} <span className="text-[9px] opacity-40">SALES</span></p>
          </div>
        </div>
      </div>
    </Card>
  );
}
