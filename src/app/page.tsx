'use client';

import { ArrowUpRight, ArrowDownRight, Flame, Check, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Dummy Data ---
const chartData = [
  { name: 'Mon', spend: 400 },
  { name: 'Tue', spend: 300 },
  { name: 'Wed', spend: 500 },
  { name: 'Thu', spend: 280 },
  { name: 'Fri', spend: 590 },
  { name: 'Sat', spend: 800 },
  { name: 'Sun', spend: 200 },
];

const habits = [
  { id: 1, name: 'Đọc sách 30p', done: true },
  { id: 2, name: 'Chạy bộ 2km', done: false },
  { id: 3, name: 'Không ăn vặt', done: true },
  { id: 4, name: 'Uống 2L nước', done: false },
];

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pb-10">
      
      {/* 1. Greeting - Header Area */}
      <div className="col-span-1 md:col-span-3 mb-2">
        <h2 className="text-3xl font-heading font-bold text-foreground">Chào buổi sáng, User 👋</h2>
        <p className="text-foreground/60 mt-1">Hôm nay là một ngày tuyệt vời để duy trì thói quen tốt!</p>
      </div>

      {/* --- Cột bên TRÁI: Dành cho Finance & Charts (Chiếm 2/3) --- */}
      <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
        
        {/* 2. Total Balance Card */}
        <div className="rounded-[var(--radius-xl)] bg-card border border-[var(--border)] p-6 shadow-soft hover:shadow-soft-hover transition-all duration-300 relative overflow-hidden group">
          {/* Background decoration */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-teal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-teal/20 transition-all duration-500"></div>
          
          <p className="text-sm font-medium text-foreground/60">Tổng số dư</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-4xl font-heading font-bold tracking-tight text-foreground">12,500,000 ₫</h3>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-emerald-teal/10 text-emerald-teal px-3 py-1.5 rounded-lg text-sm font-medium">
              <ArrowUpRight className="h-4 w-4" />
              <span>Thu nhập: 15.2M</span>
            </div>
            <div className="flex items-center gap-2 bg-red-500/10 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium">
              <ArrowDownRight className="h-4 w-4" />
              <span>Đã chi: 2.7M</span>
            </div>
          </div>
        </div>

        {/* 3. Weekly Spending Chart */}
        <div className="rounded-[var(--radius-xl)] bg-card border border-[var(--border)] p-6 shadow-soft hover:shadow-soft-hover transition-all duration-300 h-[380px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-heading font-semibold text-foreground">Biểu đồ chi tiêu tuần</h3>
            <select className="bg-slate-50 border border-[var(--border)] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-teal/50 transition-all">
              <option>Tuần này</option>
              <option>Tuần trước</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--emerald-teal)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--emerald-teal)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value}k`, 'Chi tiêu']}
                />
                <Area type="monotone" dataKey="spend" stroke="var(--emerald-teal)" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </div>

      {/* --- Cột bên PHẢI: Dành cho Habit (Chiếm 1/3) --- */}
      <div className="col-span-1 flex flex-col gap-6">
        
        {/* 4. Habit Checklist */}
        <div className="rounded-[var(--radius-xl)] bg-card border border-[var(--border)] p-6 shadow-soft hover:shadow-soft-hover transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-heading font-semibold text-foreground">Thói quen hôm nay</h3>
            <button className="h-8 w-8 rounded-full bg-deep-violet/10 text-deep-violet flex items-center justify-center hover:bg-deep-violet hover:text-white transition-colors duration-200">
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {habits.map((habit) => (
              <div 
                key={habit.id} 
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                  habit.done 
                    ? 'border-deep-violet/20 bg-deep-violet/5' 
                    : 'border-[var(--border)] bg-background hover:border-deep-violet/40'
                }`}
              >
                <span className={`font-medium transition-colors ${habit.done ? 'text-deep-violet line-through decoration-deep-violet/50' : 'text-foreground'}`}>
                  {habit.name}
                </span>
                <div className={`h-6 w-6 rounded-md border flex items-center justify-center transition-all ${
                  habit.done 
                    ? 'bg-deep-violet border-deep-violet' 
                    : 'border-slate-300 group-hover:border-deep-violet'
                }`}>
                  {habit.done && <Check className="h-4 w-4 text-white" />}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium text-foreground/60 mb-2">
              <span>Tiến độ</span>
              <span>50%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-deep-violet rounded-full w-1/2 transition-all duration-1000 ease-out"></div>
            </div>
          </div>
        </div>

        {/* 5. Streaks */}
        <div className="rounded-[var(--radius-xl)] bg-gradient-to-br from-deep-violet to-purple-600 p-6 shadow-soft hover:shadow-soft-hover transition-all duration-300 text-white relative overflow-hidden group">
           {/* Decorative flame icon faded in background */}
           <Flame className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 group-hover:text-white/20 transition-colors duration-500 transform -rotate-12" />
           
           <h3 className="text-lg font-heading font-semibold mb-1 relative z-10">Kỷ luật bản thân</h3>
           <p className="text-white/80 text-sm mb-6 relative z-10">Chuỗi ngày liên tục của bạn</p>
           
           <div className="flex items-end gap-2 relative z-10">
             <span className="text-5xl font-heading font-bold tracking-tight">14</span>
             <span className="text-xl font-medium mb-1">Ngày 🔥</span>
           </div>
           
           <div className="mt-6 flex gap-1 justify-between relative z-10">
             {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
               <div key={day} className="flex flex-col items-center gap-1">
                 <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                   idx < 4 ? 'bg-white/20 text-white' : idx === 4 ? 'bg-white text-deep-violet ring-4 ring-white/30' : 'bg-white/10 text-white/50'
                 }`}>
                   {idx < 4 ? <Check className="h-4 w-4" /> : day}
                 </div>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
