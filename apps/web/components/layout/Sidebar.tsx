'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import KitnLogo from '@/components/ui/KitnLogo';
import { 
  LayoutDashboard, 
  Terminal, 
  Package, 
  Boxes, 
  BarChart3, 
  TrendingUp, 
  Users, 
  UserCog, 
  GitBranch,
  Settings
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon, label, active }: NavItemProps) => (
  <Link 
    href={href}
    className={`flex items-center gap-3 px-4 py-2.5 mx-2.5 rounded-[12px] transition-all duration-300 group ${
      active 
        ? 'bg-brand-green text-white shadow-lg shadow-brand-green/25 scale-[1.02]' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${active ? 'bg-white scale-125' : 'bg-gray-600 group-hover:bg-gray-400'}`} />
    <span className="text-sm font-bold tracking-tight">{label}</span>
    {active && (
      <div className="ml-auto w-1 h-4 bg-white/20 rounded-full animate-pulse" />
    )}
  </Link>
);

const NavGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <p className="px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 opacity-50">{title}</p>
    <div className="space-y-1.5">
      {children}
    </div>
  </div>
);

export default function Sidebar({ initials, name }: { initials: string; name: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-[#1A1A2E] flex flex-col flex-shrink-0 z-20 shadow-2xl border-r border-white/5">
      {/* Logo Section */}
      <div className="p-7 flex items-center gap-3 bg-gradient-to-b from-white/5 to-transparent">
        <div className="p-2 bg-white/5 rounded-xl shadow-inner border border-white/5">
          <KitnLogo size="sm" />
        </div>
        <div>
          <span className="font-black text-white text-sm tracking-tighter block leading-none">KiTN POS</span>
          <span className="text-[9px] text-brand-green font-bold tracking-widest uppercase mt-0.5">Premium</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 scrollbar-hide px-2">
        <NavGroup title="Operation">
          <NavItem href="/dashboard" label="Home" icon={<LayoutDashboard size={18} />} active={pathname === '/dashboard'} />
          <NavItem href="/pos" label="POS Terminal" icon={<Terminal size={18} />} active={pathname === '/pos'} />
          <NavItem href="/products" label="Products" icon={<Package size={18} />} active={pathname === '/products'} />
          <NavItem href="/inventory" label="Inventory" icon={<Boxes size={18} />} active={pathname === '/inventory'} />
        </NavGroup>

        <NavGroup title="Analytics">
          <NavItem href="/reports/sales" label="Sales Reports" icon={<BarChart3 size={18} />} active={pathname === '/reports/sales'} />
          <NavItem href="/profit" label="Finance" icon={<TrendingUp size={18} />} active={pathname === '/profit'} />
          <NavItem href="/customers" label="Directory" icon={<Users size={18} />} active={pathname === '/customers'} />
        </NavGroup>

        <NavGroup title="System">
          <NavItem href="/users" label="Team" icon={<UserCog size={18} />} active={pathname === '/users'} />
          <NavItem href="/branches" label="Outlets" icon={<GitBranch size={18} />} active={pathname === '/branches'} />
          <NavItem href="/settings" label="Settings" icon={<Settings size={18} />} active={pathname === '/settings'} />
        </NavGroup>
      </nav>

      {/* User Footer */}
      <div className="p-5 border-t border-white/5 bg-black/20 m-3 rounded-2xl transition-all duration-500 hover:bg-black/30 group cursor-pointer border border-white/0 hover:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-white font-black text-sm shadow-lg shadow-brand-green/20 group-hover:scale-110 transition-transform">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{name}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
