import React from 'react';

export function SkeletonBox({ 
  width = '100%', 
  height = '20px',
  borderRadius = '6px',
  className = '',
  style = {}
}: { 
  width?: string
  height?: string  
  borderRadius?: string 
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #E8E8E8 25%, #F5F5F5 50%, #E8E8E8 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
        ...style
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '1.5rem',
      border: '1px solid #F0F0F0',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
    }}>
      <SkeletonBox height="12px" width="60%" />
      <div style={{ margin: '16px 0' }}>
        <SkeletonBox height="32px" width="85%" />
      </div>
      <SkeletonBox height="10px" width="45%" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr style={{ borderBottom: '1px solid #F9F9F9' }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} style={{ padding: '20px 16px' }}>
          <SkeletonBox height="14px" width={i === 1 ? '85%' : '65%'} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonProductCard() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 24,
      padding: '1.25rem',
      border: '1px solid #F0F0F0',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    }}>
      <SkeletonBox height="140px" borderRadius="16px" />
      <div style={{ marginTop: 16 }}>
        <SkeletonBox height="18px" width="85%" />
      </div>
      <div style={{ marginTop: 8 }}>
        <SkeletonBox height="18px" width="55%" />
      </div>
      <div style={{ marginTop: 6 }}>
        <SkeletonBox height="12px" width="45%" />
      </div>
    </div>
  );
}
