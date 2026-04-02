import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  User,
  LogOut,
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

export default function Sidebar({ initials, name }: { initials: string; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

      {/* User Footer with Dropdown */}
      <div className="relative p-5 border-t border-white/5 bg-black/20 m-3 rounded-2xl border border-white/0 hover:border-white/5" ref={menuRef}>
        {isMenuOpen && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1f1f3a] border border-white/10 rounded-2xl shadow-2xl py-2 animate-in slide-in-from-bottom-2 duration-300 z-30">
            <Link 
              href="/dashboard/profile" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-400 hover:text-white hover:bg-white/5 transition-all mx-2 rounded-xl"
            >
              <User size={14} className="text-brand-green" />
              My Profile
            </Link>
            <Link 
              href="/dashboard/settings" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-400 hover:text-white hover:bg-white/5 transition-all mx-2 rounded-xl"
            >
              <Settings size={14} className="text-brand-blue" />
              Settings
            </Link>
            <div className="my-2 h-[1px] bg-white/5 mx-4" />
            <button 
              onClick={handleSignOut}
              className="w-[calc(100%-16px)] flex items-center gap-3 px-4 py-2.5 text-xs font-black text-brand-coral hover:bg-brand-coral/10 transition-all mx-2 rounded-xl"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
        
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-white font-black text-sm shadow-lg shadow-brand-green/20 group-hover:scale-110 transition-transform">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{name}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Administrator</p>
          </div>
          <ChevronUp size={14} className={`text-gray-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </aside>
  );
}
