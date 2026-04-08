import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type NotificationType = 'low_stock' | 'out_of_stock' | 'sale' | 'info' | 'summary';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  subscribeToNotifications: (tenantId: string) => () => void;
}

const supabase = createClient();

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  initialized: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      set({ 
        notifications: data || [], 
        unreadCount: (data || []).filter(n => !n.is_read).length,
        loading: false,
        initialized: true
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const updated = state.notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.is_read).length
        };
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  addNotification: (notification) => {
    set((state) => {
      // Check if already exists to avoid duplicates from realtime + fetch relay
      if (state.notifications.some(n => n.id === notification.id)) return state;
      
      const updated = [notification, ...state.notifications].slice(0, 50);
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.is_read).length
      };
    });

    // Custom sound alert for sales
    if (notification.type === 'sale') {
      try {
        const audio = new Audio('/sounds/sale_alert.mp3');
        audio.play().catch(() => {}); // Play silently if possible
      } catch {}
    }
  },

  subscribeToNotifications: (tenantId: string) => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          get().addNotification(newNotif);
          
          // Show toast for new notification
          toast(newNotif.title, {
            description: newNotif.message,
            action: {
              label: 'View',
              onClick: () => console.log('View notification', newNotif.id)
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));
