import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import PageTransition from '@/components/layout/PageTransition';
import NavigationProgress from '@/components/layout/NavigationProgress';
import NotificationBell from '@/components/layout/NotificationBell';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { UserHydrator } from '@/components/auth/UserHydrator';
import GlobalSearch from '@/components/layout/GlobalSearch';
import NetworkStatusBadge from '@/components/layout/NetworkStatusBadge';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Parallel fetch for speed
  const [userRes, profileRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getUser().then(({ data: { user } }) => 
      user ? supabase.from('user_profiles').select('*').eq('id', user.id).single() : null
    )
  ]);

  const user = userRes.data.user;
  const profile = profileRes?.data;

  if (!user) {
    redirect('/login');
  }

  const currentDate = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex h-screen bg-[#F8F9FC] overflow-hidden selection:bg-brand-green/30">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      <UserHydrator user={user} profile={profile} />

      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <OfflineBanner />
        
        {/* Top bar */}
        <header className="h-[75px] bg-white border-b border-gray-100 flex items-center justify-between px-10 z-10 shadow-[0_1px_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h2 className="text-xl font-black text-brand-dark tracking-tighter flex items-center gap-2">
              Management Portal
              <span className="w-1 h-1 rounded-full bg-brand-green" />
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{currentDate}</p>
          </div>

          <div className="flex-1 max-w-md px-10">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-6">
            <NetworkStatusBadge />
            <NotificationBell />
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FC] relative">
          <div className="p-8 pb-20">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
