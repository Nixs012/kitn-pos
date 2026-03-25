import { useState, useEffect } from 'react';
import { db } from '@/lib/offline/db';
import { pushQueue } from '@/lib/offline/sync';
import { useLiveQuery } from 'dexie-react-hooks';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true); // Default to true, update on mount

  const pendingSales = useLiveQuery(
    () => db.sales_queue.where('sync_status').equals('pending').count(),
    []
  );

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Automatically trigger sync when back online
      pushQueue().catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { 
    isOnline, 
    pendingCount: pendingSales || 0 
  };
}
