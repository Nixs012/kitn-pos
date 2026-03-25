import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  className?: string;
}

const Badge = ({ children, variant = 'info', className = '' }: BadgeProps) => {
  const styles = {
    success: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200"
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${styles[variant]} ${className}`}>
      <div className={`w-1 h-1 rounded-full ${
        variant === 'success' ? 'bg-green-500' : 
        variant === 'warning' ? 'bg-amber-500' : 
        variant === 'danger' ? 'bg-red-500' : 
        variant === 'info' ? 'bg-blue-500' : 'bg-gray-500'
      }`} />
      {children}
    </span>
  );
};

export default Badge;
