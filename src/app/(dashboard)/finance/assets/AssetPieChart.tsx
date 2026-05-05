'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AssetPieChartProps {
  pieData: any[];
  formatCurrency: (amount: number) => string;
}

export default function AssetPieChart({ pieData, formatCurrency }: AssetPieChartProps) {
  if (pieData.length === 0) {
    return <div className="w-full h-full rounded-full border-8 border-slate-100 dark:border-slate-800" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          innerRadius={30}
          outerRadius={50}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
      </PieChart>
    </ResponsiveContainer>
  );
}
