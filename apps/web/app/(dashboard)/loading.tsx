import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="flex-1 p-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-10">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-gray-100 rounded-md"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-40 bg-gray-100 rounded-full"></div>
          <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="h-4 w-20 bg-gray-100 rounded"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Large Content Skeleton */}
      <div className="h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="h-6 w-48 bg-gray-200 rounded mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-50 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
