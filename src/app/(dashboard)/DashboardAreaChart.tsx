'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardAreaChartProps {
  chartData: any[];
}

export default function DashboardAreaChart({ chartData }: DashboardAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorSaving" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.3)', fontWeight: 600 }}
          dy={15}
        />
        <YAxis hide />
        <Tooltip 
          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '12px 16px' }}
          formatter={(value: any, name: any) => {
            const formattedValue = new Intl.NumberFormat('vi-VN').format(value);
            if (name === 'spend') return [formattedValue, 'Chi tiêu'];
            if (name === 'income') return [formattedValue, 'Thu nhập'];
            if (name === 'saving') return [formattedValue, 'Tiết kiệm'];
            return [formattedValue, name];
          }}
        />
        <Area 
          type="monotone" 
          dataKey="spend" 
          stroke="#ef4444" 
          strokeWidth={4}
          fillOpacity={1} 
          fill="url(#colorSpend)" 
          animationDuration={1500}
        />
        <Area 
          type="monotone" 
          dataKey="income" 
          stroke="#10b981" 
          strokeWidth={4}
          fillOpacity={1} 
          fill="url(#colorIncome)" 
          animationDuration={1500}
        />
        <Area 
          type="monotone" 
          dataKey="saving" 
          stroke="#3b82f6" 
          strokeWidth={4}
          fillOpacity={1} 
          fill="url(#colorSaving)" 
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
