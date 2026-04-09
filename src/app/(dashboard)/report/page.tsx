'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, BarChart3, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

// Thay đổi mảng này để test EmptyState
const EXPENSE_DATA = [
  { name: 'Ăn uống', value: 4500000, color: '#0D9488' }, // emerald-teal
  { name: 'Hóa đơn', value: 2100000, color: '#6D28D9' }, // deep-violet
  { name: 'Mua sắm', value: 1500000, color: '#EAB308' }, // yellow
  { name: 'Khác', value: 800000, color: '#F43F5E' },     // rose
];

const MONTHLY_DATA = [
  { name: 'T6', thu: 14000, chi: 8500 },
  { name: 'T7', thu: 15500, chi: 9200 },
  { name: 'T8', thu: 15000, chi: 7800 },
  { name: 'T9', thu: 15200, chi: 8900 },
];

export default function ReportPage() {
  const [hasData] = useState(EXPENSE_DATA.length > 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-[var(--border)] p-3 rounded-lg shadow-lg">
          <p className="font-medium text-foreground mb-1">{payload[0].name}</p>
          <p className="text-emerald-teal font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (!hasData) {
    return (
      <div className="w-full pb-10 flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState 
          title="Chưa đủ dữ liệu báo cáo" 
          description="Hệ thống cần thêm dữ liệu thu chi để có thể phân tích và tạo báo cáo chi tiết cho bạn."
          icon={<BarChart3 className="w-12 h-12 text-emerald-teal" strokeWidth={1.5} />}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-bold text-foreground">Báo cáo Phân tích</h2>
        <p className="text-foreground/60 mt-1">Cái nhìn tổng quan về tình hình tài chính của bạn tháng này.</p>
      </div>

      {/* AI Insight Panel */}
      <div className="mb-8 glass-panel rounded-[var(--radius-xl)] p-5 shadow-soft relative overflow-hidden flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md">
          <Sparkles className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div>
          <h4 className="font-heading font-semibold text-foreground flex items-center gap-2">
            AI Insight
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Beta</span>
          </h4>
          <p className="text-foreground/80 text-sm mt-1 leading-relaxed">
            Tháng này bạn đã kiểm soát tốt chi tiêu ăn uống, giảm 15% so với tháng trước. 
            Tuy nhiên, khoản mua sắm đang có xu hướng tăng. Hãy tiếp tục duy trì ngân sách để đạt mục tiêu tiết kiệm nhé!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Biểu đồ tròn - Cơ cấu chi tiêu */}
        <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-soft">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-6 text-center">Cơ cấu chi tiêu</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={EXPENSE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {EXPENSE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            {EXPENSE_DATA.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-foreground/70">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Biểu đồ cột - Tổng quan Thu / Chi */}
        <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-soft flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-heading font-semibold text-foreground">Tổng quan Thu / Chi</h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-teal"></div>
                <span className="text-foreground/70">Thu nhập</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-deep-violet"></div>
                <span className="text-foreground/70">Chi tiêu</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--slate-50)' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value}k`, '']}
                />
                <Bar dataKey="thu" fill="var(--emerald-teal)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="chi" fill="var(--color-deep-violet)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
