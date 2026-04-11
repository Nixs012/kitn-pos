import React from 'react';
import { SkeletonCard, SkeletonTableRow, SkeletonBox } from '@/components/ui/Skeleton';
import Table from '@/components/ui/Table';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <SkeletonBox width="200px" height="32px" borderRadius="8px" />
          <SkeletonBox width="300px" height="16px" borderRadius="4px" />
        </div>
        <div className="flex gap-4">
          <SkeletonBox width="150px" height="48px" borderRadius="16px" />
          <SkeletonBox width="150px" height="48px" borderRadius="16px" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm h-[400px]">
            <SkeletonBox width="40%" height="24px" className="mb-8" />
            <SkeletonBox width="100%" height="300px" borderRadius="24px" />
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <SkeletonBox width="200px" height="24px" />
              <div className="flex gap-2">
                <SkeletonBox width="40px" height="40px" borderRadius="12px" />
                <SkeletonBox width="80px" height="40px" borderRadius="12px" />
                <SkeletonBox width="40px" height="40px" borderRadius="12px" />
              </div>
            </div>
            <Table 
              headers={['ID', 'Date', 'Amount', 'Status', 'Payment', 'Actions']} 
              loading={true}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonTableRow key={i} />
              ))}
            </Table>
          </div>
        </div>

        {/* Sidebar Skeletons */}
        <div className="space-y-8">
          <div className="space-y-4">
            <SkeletonBox width="150px" height="20px" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between mb-4">
                    <SkeletonBox width="100px" height="16px" />
                    <SkeletonBox width="60px" height="16px" />
                  </div>
                  <SkeletonBox width="100%" height="8px" borderRadius="4px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
