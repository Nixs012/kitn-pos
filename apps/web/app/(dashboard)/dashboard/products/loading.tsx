import React from 'react';
import { SkeletonCard, SkeletonTableRow, SkeletonBox } from '@/components/ui/Skeleton';
import Table from '@/components/ui/Table';

export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBox width="200px" height="32px" borderRadius="8px" />
          <SkeletonBox width="250px" height="16px" borderRadius="4px" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBox width="140px" height="40px" borderRadius="12px" />
          <SkeletonBox width="140px" height="40px" borderRadius="12px" />
        </div>
      </div>

      {/* Filter Skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <SkeletonBox width="100%" height="48px" borderRadius="24px" />
        <div className="flex flex-wrap gap-2 pt-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonBox key={i} width="80px" height="32px" borderRadius="20px" />
          ))}
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>

      {/* Table Skeleton */}
      <Table 
        headers={['#', 'Product Name', 'Barcode', 'Category', 'Buy Price', 'Sell Price', 'VAT', 'Unit', 'Stock', 'Status', 'Actions']} 
        loading={true}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </Table>
    </div>
  );
}
