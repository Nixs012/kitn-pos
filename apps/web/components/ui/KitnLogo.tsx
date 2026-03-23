import React from 'react';

interface KitnLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const KitnLogo: React.FC<KitnLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
  };

  const tileClasses = "flex items-center justify-center font-bold text-white rounded-md transition-all hover:scale-105 shadow-sm";

  return (
    <div className={`grid grid-cols-2 gap-1 ${sizeClasses[size]} ${className}`} aria-label="KitN Logo">
      <div className={`${tileClasses} bg-brand-green`}>K</div>
      <div className={`${tileClasses} bg-brand-blue`}>i</div>
      <div className={`${tileClasses} bg-brand-purple`}>T</div>
      <div className={`${tileClasses} bg-brand-coral`}>N</div>
    </div>
  );
};

export default KitnLogo;
