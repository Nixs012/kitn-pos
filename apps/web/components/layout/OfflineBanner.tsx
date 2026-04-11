'use client'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function OfflineBanner() {
  const { isOnline, pendingSyncCount, offlineSince } = useNetworkStatus()

  if (isOnline) return null

  const getOfflineTime = () => {
    if (!offlineSince) return ''
    const mins = Math.round((Date.now() - offlineSince.getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins === 1) return '1 minute ago'
    return `${mins} minutes ago`
  }

  return (
    <div style={{
      background: '#854F0B',
      color: '#FAEEDA',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 12,
      fontWeight: 500,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>📶</span>
        <span>
          You are offline since {getOfflineTime()} — 
          cash sales still work and will sync automatically
        </span>
      </div>
      {pendingSyncCount > 0 && (
        <span style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '2px 10px',
          borderRadius: 20,
          fontSize: 11
        }}>
          {pendingSyncCount} pending sync
        </span>
      )}
    </div>
  )
}
