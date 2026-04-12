'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { RegisterPartnerModal } from './RegisterPartnerModal';

export const BusinessHeader = ({ totalCount }: { totalCount: number }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Active Businesses</h2>
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Manage platform partners and billing</p>
      </div>
      <div className="flex gap-4">
        <Badge variant="gray" className="px-4 py-2 border-white/10 uppercase tracking-widest">{totalCount} total</Badge>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#D85A30] hover:bg-[#D85A30]/80 gap-2 uppercase font-black px-6"
        >
          <Plus size={18} /> Register New Partner
        </Button>
      </div>
      <RegisterPartnerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
