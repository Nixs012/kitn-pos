import React from 'react';
import { SkeletonCard, SkeletonTableRow, SkeletonBox } from '@/components/ui/Skeleton';
import Table from '@/components/ui/Table';

export default function SalesReportsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Breadcrumbs Skeleton */}
      <div className="flex gap-2">
        <SkeletonBox width="60px" height="14px" />
        <SkeletonBox width="10px" height="14px" />
        <SkeletonBox width="80px" height="14px" />
        <SkeletonBox width="10px" height="14px" />
        <SkeletonBox width="40px" height="14px" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <SkeletonBox width="280px" height="40px" borderRadius="12px" />
          <SkeletonBox width="400px" height="16px" borderRadius="4px" />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <SkeletonBox width="220px" height="56px" borderRadius="22px" />
          <SkeletonBox width="160px" height="56px" borderRadius="16px" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Skeleton */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <SkeletonBox width="150px" height="24px" className="mb-8" />
            <SkeletonBox width="100%" height="300px" borderRadius="16px" />
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <SkeletonBox width="200px" height="28px" />
              <div className="flex gap-2">
                <SkeletonBox width="40px" height="40px" borderRadius="12px" />
                <SkeletonBox width="80px" height="40px" borderRadius="12px" />
                <SkeletonBox width="40px" height="40px" borderRadius="12px" />
              </div>
            </div>
            <Table headers={['Receipt #', 'Date & Time', 'Cashier', 'Payment', 'Amount', 'Actions']} loading={true}>
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonTableRow key={i} />
              ))}
            </Table>
          </div>
        </div>

        <div className="space-y-8">
          {/* Right Column: Payment Methods & Top Products */}
          <div className="space-y-4">
            <SkeletonBox width="180px" height="24px" />
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-50 space-y-4">
                <div className="flex justify-between">
                  <SkeletonBox width="100px" height="20px" />
                  <SkeletonBox width="80px" height="20px" />
                </div>
                <SkeletonBox width="100%" height="8px" borderRadius="4px" />
              </div>
            ))}
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <SkeletonBox width="150px" height="24px" className="mb-4" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <SkeletonBox width="32px" height="32px" borderRadius="8px" />
                <div className="flex-1 space-y-2">
                  <SkeletonBox width="70%" height="14px" />
                  <SkeletonBox width="40%" height="10px" />
                </div>
                <SkeletonBox width="60px" height="14px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
