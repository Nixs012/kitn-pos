'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineBanner = () => {
  const { isOnline, pendingCount } = useOnlineStatus();

  // Show banner if offline OR if there are pending items to sync
  if (isOnline && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`w-full py-2 px-4 flex items-center justify-between text-white text-sm font-medium z-50 ${
          !isOnline ? 'bg-amber-600' : 'bg-green-600'
        }`}
      >
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Working offline — {pendingCount} sales pending sync</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>Back online — Syncing {pendingCount} transactions...</span>
            </>
          )}
        </div>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>Protecting your data</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
