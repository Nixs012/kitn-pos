'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import Button from './Button';

// --------------------------------------------------------------------------
// BREADCRUMBS COMPONENT
// --------------------------------------------------------------------------

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => {
  return (
    <nav className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight size={10} className="text-gray-300" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-brand-green transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-brand-dark">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// --------------------------------------------------------------------------
// UPGRADE PROMPT COMPONENT
// --------------------------------------------------------------------------

export const UpgradePrompt = ({ 
  title = "Unlock Premium Features", 
  feature = "This module requires a Basic or Pro plan.",
  plan = "Basic"
}: { 
  title?: string, 
  feature?: string,
  plan?: 'Basic' | 'Pro'
}) => {
  return (
    <div className="relative overflow-hidden bg-brand-dark rounded-[40px] p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-green/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-brand-blue/10 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 space-y-6">
        <div className="w-20 h-20 bg-brand-green/10 rounded-full mx-auto flex items-center justify-center text-brand-green border border-brand-green/20 shadow-[0_0_40px_rgba(29,158,117,0.2)]">
          <Zap size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white italic tracking-tight uppercase underline decoration-brand-green decoration-4 underline-offset-8 decoration-wavy">
            {title}
          </h2>
          <p className="max-w-md mx-auto text-sm font-bold text-gray-400 leading-relaxed capitalize">
            {feature} 
            <span className="block mt-1 text-[10px] font-black text-brand-green tracking-widest text-center">Requires {plan} Tier or Higher</span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={() => window.location.href = '/dashboard/settings?tab=subscription'}
            className="px-10 py-5 bg-brand-green hover:bg-brand-green/80 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-green/20 ring-offset-brand-dark"
          >
            Upgrade Plan <ArrowRight size={18} className="ml-2" />
          </Button>
          
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <ShieldAlert size={12} /> Data remains secure during upgrade
          </div>
        </div>
      </div>
    </div>
  );
};
