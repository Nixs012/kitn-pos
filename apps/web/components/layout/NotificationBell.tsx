'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  Info,
  Calendar,
  Clock
} from 'lucide-react';
import { useNotificationStore, NotificationType } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { useUserStore } from '@/stores/userStore';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { profile } = useUserStore();
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    subscribeToNotifications,
    initialized
  } = useNotificationStore();

  useEffect(() => {
    if (profile?.tenant_id) {
      if (!initialized) {
        fetchNotifications();
      }
      const unsubscribe = subscribeToNotifications(profile.tenant_id);
      return () => unsubscribe();
    }
  }, [profile?.tenant_id, initialized, fetchNotifications, subscribeToNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'out_of_stock': return <AlertTriangle size={16} className="text-red-500" />;
      case 'low_stock': return <Package size={16} className="text-orange-500" />;
      case 'sale': return <ShoppingCart size={16} className="text-emerald-500" />;
      case 'summary': return <Calendar size={16} className="text-blue-500" />;
      default: return <Info size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green hover:bg-brand-green/20 transition-all hover:shadow-lg relative group shadow-sm shadow-brand-green/5"
      >
        <Bell size={20} className="group-hover:animate-[bell_0.5s_ease-in-out]" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] bg-white rounded-[24px] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-[10px] font-black text-brand-green uppercase tracking-wider flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={`p-4 flex gap-4 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${!n.is_read ? 'bg-brand-green/5 hover:bg-brand-green/10' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${!n.is_read ? 'bg-white shadow-sm' : 'bg-gray-100/50'}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand-dark leading-tight line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1.5 opacity-40">
                        <Clock size={10} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center px-10">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
                  <Bell size={24} />
                </div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No notifications yet</p>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">We&apos;ll alert you when something important happens.</p>
              </div>
            )}
          </div>

          <button className="w-full py-4 bg-gray-50/50 border-t border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-brand-dark transition-colors">
            View all activity
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes bell {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          75% { transform: rotate(-15deg); }
        }
      `}</style>
    </div>
  );
}
