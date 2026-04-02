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
  ChevronUp
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, label, active }: NavItemProps) => (
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState<{
    fullName: string;
    email: string;
    role: string;
    initials: string;
    avatarUrl?: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          const initials = profile.full_name
            ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            : 'U';
          setUserData({
            fullName: profile.full_name || 'User',
            email: user.email || '',
            role: profile.role || 'Member',
            initials,
            avatarUrl: profile.avatar_url,
          });
        }
      }
    };

    fetchUserData();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const roleColor = userData?.role === 'admin' ? '#D85A30' : userData?.role === 'manager' ? '#378ADD' : '#1D9E75';

  return (
    <aside className="w-[220px] bg-[#1A1A2E] flex flex-col flex-shrink-0 z-20 shadow-2xl border-r border-white/5">
      {/* Logo Section */}
      <div className="p-7 flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-xl shadow-inner border border-white/5">
          <KitnLogo size="sm" />
        </div>
        <div>
          <span className="font-black text-white text-sm tracking-tighter block leading-none">KiTN POS</span>
          <span className="text-[9px] text-brand-green font-bold tracking-widest uppercase mt-0.5">Premium</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide px-2">
        <NavGroup title="Operation">
          <NavItem href="/dashboard" label="Home" icon={<LayoutDashboard size={18} />} active={pathname === '/dashboard'} />
          <NavItem href="/dashboard/pos" label="POS Terminal" icon={<Terminal size={18} />} active={pathname === '/dashboard/pos'} />
          <NavItem href="/dashboard/products" label="Products" icon={<Package size={18} />} active={pathname === '/dashboard/products'} />
          <NavItem href="/dashboard/inventory" label="Inventory" icon={<Boxes size={18} />} active={pathname === '/dashboard/inventory'} />
        </NavGroup>

        <NavGroup title="Analytics">
          <NavItem href="/dashboard/reports/sales" label="Sales Reports" icon={<BarChart3 size={18} />} active={pathname === '/dashboard/reports/sales'} />
          <NavItem href="/dashboard/finance" label="Finance" icon={<TrendingUp size={18} />} active={pathname === '/dashboard/finance'} />
          <NavItem href="/dashboard/directory" label="Directory" icon={<Users size={18} />} active={pathname === '/dashboard/directory'} />
        </NavGroup>

        <NavGroup title="System">
          <NavItem href="/dashboard/users" label="Team" icon={<UserCog size={18} />} active={pathname === '/dashboard/users'} />
          <NavItem href="/dashboard/branches" label="Outlets" icon={<GitBranch size={18} />} active={pathname === '/dashboard/branches'} />
          <NavItem href="/dashboard/settings" label="Settings" icon={<Settings size={18} />} active={pathname === '/dashboard/settings'} />
        </NavGroup>
      </nav>

      {/* User Card & Popup Menu */}
      <div className="p-4 relative" ref={menuRef}>
        {/* Popup Menu (Above the card) */}
        {isMenuOpen && userData && (
          <div 
            className="absolute bottom-full left-4 bg-[#1E2235] border-[0.5px] border-white/10 rounded-2xl shadow-2xl py-3 w-[calc(100%-32px)] mb-3 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-[11px] font-black shrink-0 relative overflow-hidden">
                {userData.avatarUrl ? (
                  <Image 
                    src={userData.avatarUrl} 
                    alt="Avatar" 
                    fill 
                    className="object-cover" 
                    unoptimized 
                  />
                ) : userData.initials}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-white truncate">{userData.fullName}</p>
                <p className="text-[10px] text-gray-500 font-bold truncate">{userData.email}</p>
              </div>
            </div>

            <div className="h-[0.5px] bg-white/5 mx-5 my-1" />

            {/* Menu Items */}
            <div className="p-1.5 space-y-0.5">
              <Link 
                href="/dashboard/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] text-white hover:bg-brand-green transition-colors"
              >
                <span className="text-base">👤</span>
                <span className="font-bold">My Profile</span>
              </Link>

              <Link 
                href="/dashboard/settings"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] text-white hover:bg-brand-green transition-colors"
              >
                <span className="text-base">⚙️</span>
                <span className="font-bold">Settings</span>
              </Link>

              <div className="h-[0.5px] bg-white/5 mx-3 my-1.5" />

              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] text-[#E24B4A] hover:bg-white/5 transition-colors"
              >
                <span className="text-base">🔴</span>
                <span className="font-bold">Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* User Card Trigger */}
        <div 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${isMenuOpen ? 'bg-white/5' : 'hover:bg-white/5'}`}
        >
          <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-lg shadow-brand-green/10 relative overflow-hidden">
            {userData?.avatarUrl ? (
              <Image 
                src={userData.avatarUrl} 
                alt="Avatar" 
                fill 
                className="object-cover" 
                unoptimized 
              />
            ) : userData?.initials || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-white truncate">{userData?.fullName || 'Loading...'}</p>
            <div 
              className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white"
              style={{ backgroundColor: roleColor }}
            >
              {userData?.role || 'User'}
            </div>
          </div>
          <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}>
            <ChevronUp size={14} className="text-gray-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}
