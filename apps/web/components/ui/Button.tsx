import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'blue' | 'info';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className = '', 
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-tight rounded-[12px] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#1D9E75] text-white shadow-lg shadow-[#1D9E75]/20 hover:bg-[#158060] hover:shadow-xl hover:shadow-[#1D9E75]/30",
    secondary: "bg-white text-[#1A1A2E] border border-[#E8E8E8] hover:bg-gray-50",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/30",
    blue: "bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/30",
    info: "bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/30",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900",
    outline: "bg-transparent text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-5 py-2.5 text-xs",
    lg: "px-8 py-3.5 text-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
