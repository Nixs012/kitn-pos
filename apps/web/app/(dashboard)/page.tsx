import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green">
              <span className="font-bold">#</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Stat Card {i}</p>
            <p className="text-2xl font-black text-brand-dark">0.00</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center text-gray-400 font-medium italic">
        Select a module from the sidebar to continue
      </div>
    </div>
  );
}
