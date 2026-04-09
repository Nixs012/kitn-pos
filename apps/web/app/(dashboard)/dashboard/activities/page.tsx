'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  Info,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useNotificationStore, NotificationType } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Card from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function ActivitiesPage() {
  const { notifications, loading, fetchNotifications, markAsRead, clearAllNotifications } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    fetchNotifications();
    document.title = 'Activity Log — KiTN POS';
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || n.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'out_of_stock': return <AlertTriangle size={20} className="text-red-500" />;
      case 'low_stock': return <Package size={20} className="text-orange-500" />;
      case 'sale': return <ShoppingCart size={20} className="text-emerald-500" />;
      case 'summary': return <Calendar size={20} className="text-blue-500" />;
      default: return <Info size={20} className="text-gray-400" />;
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <ErrorBoundary section="Activity Log">
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Activity Log' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-brand-dark tracking-tighter leading-none mb-3">System Activities</h1>
            <p className="text-gray-500 font-medium italic">Comprehensive audit trail of all terminal-wide events and alerts.</p>
          </div>

          <button 
            onClick={() => clearAllNotifications()}
            className="flex items-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-500 rounded-[22px] text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
            <Trash2 size={14} />
            Clean History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h3 className="text-xs font-black text-brand-dark uppercase tracking-widest mb-6 flex items-center gap-2">
                <Filter size={14} className="text-brand-green" /> Filters
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Search Events</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Find keyword..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-[16px] pl-12 pr-4 py-3.5 text-xs font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Event Type</label>
                  <div className="flex flex-col gap-1.5">
                    {(['all', 'sale', 'low_stock', 'out_of_stock', 'summary'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          filterType === type ? 'bg-brand-dark text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white p-20 rounded-[32px] border border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin mb-4" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading history...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((n) => (
                  <div 
                    key={n.id}
                    className={`bg-white p-6 rounded-[28px] border transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6 group hover:shadow-xl ${
                      !n.is_read ? 'border-brand-green/30 bg-brand-green/5 shadow-md shadow-brand-green/5' : 'border-gray-50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center ${
                      !n.is_read ? 'bg-white shadow-elevation-sm' : 'bg-gray-50'
                    }`}>
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                          n.type === 'sale' ? 'bg-emerald-100 text-emerald-700' :
                          n.type === 'low_stock' ? 'bg-orange-100 text-orange-700' :
                          n.type === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {getTypeLabel(n.type)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1.5">
                          <Calendar size={10} />
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-black text-brand-dark tracking-tight">{n.title}</h3>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">{n.message}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {!n.is_read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="px-4 py-2 bg-brand-green text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-green/90 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 size={12} />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-20 rounded-[32px] border border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6 group-hover:scale-110 transition-transform">
                    <Bell size={32} />
                  </div>
                  <p className="text-xs font-black text-gray-300 uppercase tracking-[0.3em]">No activities found</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium max-w-[200px]">Adjust your filters or start processing sales to populate this log.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
