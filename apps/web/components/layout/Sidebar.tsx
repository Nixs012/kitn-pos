"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import KitnLogo from '@/components/ui/KitnLogo';
import { createClient } from '@/lib/supabase/client';
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
  Settings,
  ChevronUp,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, label, icon, active }: NavItemProps) => (
  <Link 
    href={href}
    className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-[16px] transition-all duration-300 group ${
      active 
        ? 'bg-brand-green text-white shadow-lg shadow-brand-green/25 scale-[1.02]' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className={`transition-all duration-300 ${active ? 'text-white' : 'text-gray-500 group-hover:text-brand-green'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <span className="text-[13px] font-black tracking-tight uppercase">{label}</span>
    {active && (
      <div className="ml-auto w-1 h-4 bg-white/40 rounded-full animate-pulse" />
    )}
  </Link>
);

const NavGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <p className="px-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 opacity-40">{title}</p>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, profile } = useUserStore();
  
  const isOwner = user?.email?.endsWith('@kitnpos.co.ke') || ['admin@kitnpos.co.ke'].includes(user?.email || '');

  const fallbackName = user?.email?.split('@')[0] || 'User';
  const fullName = profile?.full_name || fallbackName;
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : fallbackName[0].toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { href: '/dashboard', label: 'Home', icon: <LayoutDashboard />, group: 'Operation' },
    { href: '/dashboard/pos', label: 'POS Terminal', icon: <Terminal />, group: 'Operation' },
    { href: '/dashboard/products', label: 'Products', icon: <Package />, group: 'Operation' },
    { href: '/dashboard/inventory', label: 'Inventory', icon: <Boxes />, group: 'Operation' },
    { href: '/dashboard/reports/sales', label: 'Sales Reports', icon: <BarChart3 />, group: 'Analytics' },
    { href: '/dashboard/finance', label: 'Finance', icon: <TrendingUp />, group: 'Analytics' },
    { href: '/dashboard/directory', label: 'Directory', icon: <Users />, group: 'Analytics' },
    { href: '/dashboard/team', label: 'Team', icon: <UserCog />, group: 'System' },
    { href: '/dashboard/outlets', label: 'Outlets', icon: <GitBranch />, group: 'System' },
    { href: '/dashboard/settings', label: 'Settings', icon: <Settings />, group: 'System' },
  ];

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-12 h-12 bg-brand-dark border border-white/10 rounded-2xl flex items-center justify-center text-white"
        >
          {isMobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Main Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-[240px] bg-brand-dark flex flex-col z-40 border-r border-white/5 transition-transform duration-300 md:translate-x-0 md:relative
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="p-8 flex items-center gap-4">
          <div className="p-2.5 bg-brand-green/10 rounded-2xl border border-brand-green/20 shadow-[0_0_20px_rgba(29,158,117,0.1)]">
            <KitnLogo size="sm" />
          </div>
          <div>
            <span className="font-black text-white text-lg tracking-tighter block leading-none italic uppercase">KiTN POS</span>
            <span className="text-[10px] text-brand-green font-black tracking-widest uppercase mt-1">v1.2.0</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide px-3">
          <NavGroup title="Operation">
            {menuItems.filter(i => i.group === 'Operation').map(item => (
              <NavItem key={item.href} {...item} active={pathname === item.href} />
            ))}
          </NavGroup>

          <NavGroup title="Analytics">
            {menuItems.filter(i => i.group === 'Analytics').map(item => (
              <NavItem key={item.href} {...item} active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))} />
            ))}
          </NavGroup>

          <NavGroup title="System">
            {menuItems.filter(i => i.group === 'System').map(item => (
              <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
            {isOwner && (
              <Link 
                  href="/superadmin"
                  className={`mt-6 flex items-center gap-3 px-4 py-3 mx-2 rounded-[16px] transition-all duration-300 group border-2 border-dashed ${
                    pathname.startsWith('/superadmin') 
                      ? 'bg-[#D85A30] border-[#D85A30] text-white' 
                      : 'border-white/5 text-[#D85A30] hover:bg-[#D85A30]/5 hover:border-[#D85A30]/20'
                  }`}
                >
                <div className={pathname.startsWith('/superadmin') ? 'text-white' : 'text-[#D85A30]'}>
                  <ShieldCheck size={18} />
                </div>
                <span className="text-[12px] font-black tracking-tight uppercase">Superadmin</span>
              </Link>
            )}
          </NavGroup>
        </nav>

        {/* User Card */}
        <div className="p-4 relative mt-auto border-t border-white/5" ref={menuRef}>
          {isMenuOpen && (
            <div className="absolute bottom-[calc(100%-12px)] left-4 bg-brand-dark/95 border border-white/10 rounded-3xl shadow-2xl py-3 w-[calc(100%-32px)] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50 backdrop-blur-xl">
              <div className="px-5 py-4 border-b border-white/5 mb-2">
                 <p className="text-[11px] font-black text-white tracking-tight leading-tight">{fullName}</p>
                 <p className="text-[9px] text-gray-500 font-bold truncate opacity-60 uppercase mt-1 tracking-widest">Administrator</p>
              </div>
              <div className="px-1.5 space-y-1">
                <Link href="/dashboard/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[12px] text-white hover:bg-brand-green transition-all font-bold">
                  👤 My Profile
                </Link>
                <Link href="/dashboard/settings?tab=subscription" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[12px] text-white hover:bg-brand-green transition-all font-bold">
                  💳 Subscription
                </Link>
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[12px] text-red-400 hover:bg-red-500/10 transition-all font-bold mt-2 border-t border-white/5 pt-3">
                  🔴 Sign Out
                </button>
              </div>
            </div>
          )}

          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${isMenuOpen ? 'bg-white/5' : 'hover:bg-white/5'}`}
          >
            <div className="w-10 h-10 rounded-2xl bg-brand-green flex items-center justify-center text-white text-[13px] font-black shadow-lg shadow-brand-green/20 relative overflow-hidden shrink-0">
               {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" unoptimized/>
               ) : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-black text-white truncate tracking-tight">{fullName}</p>
              <div 
                className="mt-1 inline-block px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-white"
                style={{ backgroundColor: profile?.role === 'admin' ? '#D85A30' : '#1D9E75' }}
              >
                {profile?.role || 'ADMIN'}
              </div>
            </div>
            <ChevronUp size={14} className={`text-gray-500 transition-transform duration-500 ${isMenuOpen ? 'rotate-180 text-brand-green' : ''}`} />
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-brand-dark border-t border-white/10 flex items-center justify-around px-4 z-40 backdrop-blur-lg">
        {[
          { href: '/dashboard', icon: <LayoutDashboard /> },
          { href: '/dashboard/pos', icon: <Terminal /> },
          { href: '/dashboard/inventory', icon: <Boxes /> },
          { href: '/dashboard/reports/sales', icon: <BarChart3 /> },
          { href: '/dashboard/settings', icon: <Settings /> },
        ].map((item) => {
          const active = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20 scale-110' : 'text-gray-500'}`}
            >
              {React.cloneElement(item.icon as React.ReactElement, { size: 22 })}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
