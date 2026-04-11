import React from 'react';
import { SkeletonTableRow, SkeletonBox } from '@/components/ui/Skeleton';
import Table from '@/components/ui/Table';

export default function InventoryLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox width="200px" height="32px" borderRadius="8px" />
          <SkeletonBox width="250px" height="16px" borderRadius="4px" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox width="140px" height="40px" borderRadius="12px" />
          <SkeletonBox width="140px" height="40px" borderRadius="12px" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <SkeletonBox width="100%" height="48px" borderRadius="12px" />
      </div>

      <Table 
        headers={['#', 'Date', 'Type', 'Product', 'Branch', 'Quantity Change', 'Reference', 'By']} 
        loading={true}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </Table>
    </div>
  );
}
