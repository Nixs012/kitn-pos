import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  tenant_id: string | null;
  branch_id: string | null;
}

interface UserState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setAuth: (user: User | null, profile: UserProfile | null) => void;
  clearAuth: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setAuth: (user, profile) => set({ user, profile, isLoading: false }),
  clearAuth: () => set({ user: null, profile: null, isLoading: false }),
}));
