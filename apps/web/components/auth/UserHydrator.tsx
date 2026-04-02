'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export function UserHydrator({ user, profile }: { user: User | null; profile: any }) {
  const setAuth = useUserStore((state) => state.setAuth);
  const clearAuth = useUserStore((state) => state.clearAuth);
  const supabase = createClient();

  // Initial hydration from server props
  useEffect(() => {
    if (user) {
      setAuth(user, profile);
    } else {
      clearAuth();
    }
  }, [user, profile, setAuth, clearAuth]);

  // Listen for real-time auth changes (e.g. sign out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAuth();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const currentUser = session?.user;
        if (currentUser) {
          const { data: currentProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          setAuth(currentUser, currentProfile);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setAuth, clearAuth]);

  return null;
}
