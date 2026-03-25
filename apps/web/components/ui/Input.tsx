import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = ({ label, error, icon, className = '', ...props }: InputProps) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-green transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-white border border-gray-100 rounded-[12px] 
            px-4 py-3 text-sm font-medium text-brand-dark
            placeholder:text-gray-400 placeholder:font-bold placeholder:text-[11px] placeholder:uppercase placeholder:tracking-wider
            transition-all duration-300
            focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-red-500 ring-4 ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] font-bold text-red-500 ml-1">{error}</p>}
    </div>
  );
};

export default Input;
