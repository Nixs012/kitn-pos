import React from 'react';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center text-gray-400 font-medium">
    {title} Module Coming Soon
  </div>
);

export default function Page() { return <PlaceholderPage title="Inventory" />; }
