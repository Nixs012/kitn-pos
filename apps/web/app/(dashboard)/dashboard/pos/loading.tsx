import React from 'react';
import { SkeletonProductCard, SkeletonBox } from '@/components/ui/Skeleton';

export default function PosLoading() {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 overflow-hidden animate-in fade-in duration-500">
      {/* Mobile Cart Toggle Skeleton */}
      <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <SkeletonBox width="40px" height="40px" borderRadius="12px" />
          <div className="space-y-1">
            <SkeletonBox width="60px" height="8px" />
            <SkeletonBox width="100px" height="14px" />
          </div>
        </div>
        <SkeletonBox width="80px" height="32px" borderRadius="12px" />
      </div>

      <div className="flex-1 flex flex-row gap-6 min-h-0 overflow-hidden relative">
        {/* Left Column: Product Selection Skeleton */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Search & Scan Skeleton */}
          <div className="flex flex-col md:flex-row gap-4 shrink-0 px-2 lg:px-0">
            <SkeletonBox width="100%" height="64px" borderRadius="24px" className="flex-1" />
            <div className="flex gap-2">
              <SkeletonBox width="120px" height="64px" borderRadius="24px" />
              <SkeletonBox width="64px" height="64px" borderRadius="24px" />
            </div>
          </div>

          {/* Categories Skeleton */}
          <div className="flex gap-2 bg-white/50 p-1.5 rounded-[24px] border border-gray-100 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <SkeletonBox key={i} width="100px" height="44px" borderRadius="18px" />
            ))}
          </div>

          {/* Product Grid Skeleton */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Terminal Skeleton */}
        <div className="hidden lg:flex lg:w-[400px] flex-col gap-4">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonBox width="40px" height="40px" borderRadius="16px" />
                <div className="space-y-1">
                  <SkeletonBox width="120px" height="20px" />
                  <SkeletonBox width="80px" height="12px" />
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                  <div className="flex-1 space-y-2">
                    <SkeletonBox width="80%" height="14px" />
                    <SkeletonBox width="40%" height="10px" />
                  </div>
                  <SkeletonBox width="60px" height="24px" borderRadius="12px" />
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <SkeletonBox width="60px" height="12px" />
                  <SkeletonBox width="80px" height="12px" />
                </div>
                <div className="flex justify-between">
                  <SkeletonBox width="60px" height="12px" />
                  <SkeletonBox width="80px" height="12px" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
                <SkeletonBox width="100px" height="16px" />
                <SkeletonBox width="140px" height="32px" />
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <SkeletonBox key={i} width="100%" height="70px" borderRadius="24px" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
