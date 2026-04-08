import React from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { 
  BarChart3, 
  Building2, 
  Settings2, 
  Store,
  LayoutDashboard
} from 'lucide-react';

const SUPER_ADMINS = ['admin@kitnpos.co.ke'];

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isSuperAdmin = user.email?.endsWith('@kitnpos.co.ke') || SUPER_ADMINS.includes(user.email || '');

  if (!isSuperAdmin) {
    redirect('/dashboard');
  }

  const sidebarLinks = [
    { name: 'Overview', href: '/superadmin', icon: <LayoutDashboard size={20} /> },
    { name: 'Businesses', href: '/superadmin/businesses', icon: <Building2 size={20} /> },
    { name: 'Revenue', href: '/superadmin/revenue', icon: <BarChart3 size={20} /> },
    { name: 'System', href: '/superadmin/system', icon: <Settings2 size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#06080A]">
      {/* SuperAdmin Sidebar */}
      <aside className="w-72 bg-[#0D1117] border-r border-white/5 flex flex-col fixed inset-y-0 shadow-2xl z-50">
        <div className="p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">KiTN</h1>
            <span className="text-[10px] font-black italic uppercase tracking-[0.2em] text-[#D85A30]">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {sidebarLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 group"
            >
              <div className="text-[#D85A30] opacity-70 group-hover:opacity-100 transition-opacity">
                {link.icon}
              </div>
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="p-6 space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold text-brand-green bg-brand-green/5 hover:bg-brand-green/10 transition-all border border-brand-green/10"
          >
            <Store size={18} />
            Back to My Store
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-72 flex-1 p-8 text-white">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
          {children}
        </div>
      </main>
    </div>
  );
}
