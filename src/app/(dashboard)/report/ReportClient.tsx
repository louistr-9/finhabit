'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, BarChart3, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/EmptyState';

// Thay đổi mảng này để test EmptyState
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) => (
  <div
    className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
      checked ? 'bg-emerald-teal' : 'bg-slate-300 dark:bg-slate-700'
    }`}
    onClick={() => onChange(!checked)}
  >
    <motion.div
      className="w-5 h-5 bg-white rounded-full shadow-md"
      layout
      initial={false}
      animate={{ x: checked ? 20 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </div>
);

interface ExpenseData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  name: string;
  thu: number;
  chi: number;
}

export default function ReportClient({ initialExpenseData, initialMonthlyData }: { initialExpenseData: ExpenseData[], initialMonthlyData: MonthlyData[] }) {
  const [hasData] = useState(initialExpenseData.length > 0 || initialMonthlyData.length > 0);
  const [weeklyReport, setWeeklyReport] = useState(true);

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
          description="Hệ thống cần thêm dữ liệu thu chi thực tế ở mục Tài chính để có thể phân tích báo cáo chi tiết cho bạn."
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
            {initialExpenseData.length > 0 
              ? `Tháng này bạn chi nhiều nhất cho "${initialExpenseData[0].name}". Hãy kiểm soát mức chi tiêu ở khoản này để đạt mục tiêu tốt nhất nhé!`
              : "Tháng này có vẻ bạn làm rất tốt trong việc kiểm soát chi tiêu. Hãy tiếp tục duy trì!"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Biểu đồ tròn - Cơ cấu chi tiêu */}
        <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-soft">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-6 text-center">Cơ cấu chi tiêu</h3>
          <div className="h-[280px] w-full">
            {initialExpenseData.length === 0 ? (
              <div className="w-full h-full border-2 border-dashed border-[var(--border)] rounded-2xl flex items-center justify-center text-foreground/40 text-sm font-medium">Chưa có chi phí tháng này</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={initialExpenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {initialExpenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {initialExpenseData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-foreground/70">{item.name} <span className="font-semibold">{formatCompactLocal(item.value)}</span></span>
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
            {initialMonthlyData.length === 0 ? (
               <div className="w-full h-full border-2 border-dashed border-[var(--border)] rounded-2xl flex items-center justify-center text-foreground/40 text-sm font-medium">Chưa thống kê lịch sử thu chi</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initialMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)' }} />
                  <RechartsTooltip
                    cursor={{ fill: 'var(--slate-50)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`${formatCompactLocal(value)}`, '']}
                  />
                  <Bar dataKey="thu" fill="var(--emerald-teal)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="chi" fill="var(--color-deep-violet)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* ─── Báo cáo tuần ──────────────────────────────── */}
      <div className="mt-8 bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-slate-50/50">
          <h3 className="font-heading font-semibold text-foreground">Báo cáo tuần</h3>
          <p className="text-xs text-foreground/50 mt-0.5">Nhận tổng hợp tài chính tự động vào cuối mỗi tuần</p>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <User className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="font-medium text-foreground text-sm">Gửi báo cáo qua email</h4>
              <p className="text-xs text-foreground/60 mt-0.5">
                Tổng hợp thu chi sẽ được gửi vào <span className="font-semibold">Chủ nhật hàng tuần</span>
              </p>
            </div>
          </div>
          <Switch checked={weeklyReport} onChange={setWeeklyReport} />
        </div>

        {weeklyReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-5 pb-5"
          >
            <div className="bg-emerald-teal/5 border border-emerald-teal/20 rounded-xl p-4 text-sm text-emerald-teal font-medium flex items-center gap-2">
              <span className="text-base">✅</span>
              Báo cáo tuần đã được kích hoạt. Bạn sẽ nhận email vào Chủ nhật tới.
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}

function formatCompactLocal(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
  return num + ' đ';
}
