'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface AssetLineChartProps {
  chartData: any[];
  isProfitable: boolean;
}

export default function AssetLineChart({ chartData, isProfitable }: AssetLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={isProfitable ? '#10B981' : '#F43F5E'} 
          strokeWidth={2} 
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
