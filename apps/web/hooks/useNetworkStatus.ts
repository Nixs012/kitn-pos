import { useState, useEffect, useCallback } from 'react'
import { showOfflineWarning, showSuccess } from '@/lib/toast'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [wasOffline, setWasOffline] = useState(false)
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  const goOnline = useCallback(() => {
    setIsOnline(true)
    if (wasOffline) {
      const offlineDuration = offlineSince
        ? Math.round((Date.now() - offlineSince.getTime()) / 60000)
        : 0
      showSuccess(
        `Back online — syncing ${pendingSyncCount} offline sale${pendingSyncCount !== 1 ? 's' : ''}...`
      )
      setWasOffline(false)
      setOfflineSince(null)
      // Trigger sync
      triggerSync()
    }
  }, [wasOffline, offlineSince, pendingSyncCount])

  const goOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
    setOfflineSince(new Date())
    showOfflineWarning()
  }, [])

  const triggerSync = async () => {
    try {
      // Will be implemented in offline phase
      // For now just log
      console.log('Triggering sync after reconnection...')
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }

  useEffect(() => {
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [goOnline, goOffline])

  return { 
    isOnline, 
    wasOffline, 
    offlineSince,
    pendingSyncCount,
    setPendingSyncCount
  }
}
