'use client';

import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export const RevenueChart = ({ data }: { data: { name: string, total: number, free: number, paying: number }[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D85A30" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#D85A30" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
        <XAxis 
          dataKey="name" 
          stroke="#4b5563" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false}
          dy={10}
        />
        <YAxis 
          stroke="#4b5563" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `K${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#0D1117', 
            border: '1px solid #ffffff10', 
            borderRadius: '16px',
            fontSize: '11px',
            color: '#fff'
          }}
          itemStyle={{ color: '#D85A30', fontWeight: 'bold' }}
          labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
        />
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke="#D85A30" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorTotal)" 
          dot={{ fill: '#D85A30', strokeWidth: 2, r: 4, stroke: '#0D1117' }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
