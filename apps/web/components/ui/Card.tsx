'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
