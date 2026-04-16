'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownRight, Flame, Check, Plus,
  TrendingUp, Wallet, Target, Clock, ChevronRight,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  streak: number;
  done: boolean;
}

interface OverviewData {
  chartData: any[];
  quickStats: {
    balance: number;
    monthlySpent: number;
    habitCount: string;
    streak: number;
  };
  habits: Habit[];
}

interface Props {
  displayName: string;
  avatarUrl: string | null;
  email: string;
  overviewData: OverviewData;
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', '').trim() + ' ₫';
};

export default function DashboardClient({ displayName, avatarUrl, email, overviewData }: Props) {
  const { chartData, quickStats: serverQuickStats, habits: serverHabits } = overviewData;

  const quickStats = [
    { label: 'Tổng số dư', value: formatMoney(serverQuickStats.balance), change: 'Thực tế', trend: 'up', icon: Wallet, color: 'emerald' },
    { label: 'Chi tiêu tháng', value: formatMoney(serverQuickStats.monthlySpent), change: 'Thực tế', trend: 'down', icon: TrendingUp, color: 'rose' },
    { label: 'Mục tiêu', value: serverQuickStats.habitCount, change: 'Hôm nay', trend: 'up', icon: Target, color: 'violet' },
    { label: 'Chuỗi ngày', value: `${serverQuickStats.streak} ngày`, change: 'Liên tục', trend: 'up', icon: Flame, color: 'orange' },
  ];

  const [habitList, setHabitList] = useState<Habit[]>(serverHabits);

  const toggleHabit = (id: string, currentDone: boolean) => {
    // Basic optimistic toggle, assumes Habit page handles DB
    // To be perfect we should call a Server Action here too, but for Dashboard a mock toggle is ok if it links to Habit
    setHabitList((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !currentDone } : h))
    );
  };

  const doneCount = habitList.filter((h) => h.done).length;
  const progress = habitList.length > 0 ? Math.round((doneCount / habitList.length) * 100) : 0;

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime ? currentTime.getHours() : 12;

  const getGreeting = () => {
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="w-full pb-12 space-y-8">

      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-[var(--border)] shadow-soft shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-teal to-deep-violet flex items-center justify-center text-white font-bold font-heading text-lg">
                {initials}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-foreground/50 font-medium">{getGreeting()} 👋</p>
            <h2 className="text-2xl font-heading font-bold text-foreground leading-tight">{displayName}</h2>
            <p className="text-xs text-foreground/40 mt-0.5">{email}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-foreground/50 bg-card border border-[var(--border)] rounded-xl px-4 py-2.5 shadow-soft min-w-[200px] justify-center">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium whitespace-nowrap">
            {isMounted && currentTime
              ? currentTime.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Đang tải...'}
          </span>
        </div>
      </div>

      {/* ─── Quick Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          const isUp = stat.trend === 'up';
          const colorMap: Record<string, { bg: string; text: string; badge: string; icon: string }> = {
            emerald: { bg: 'bg-emerald-teal/10', text: 'text-emerald-teal', badge: 'bg-emerald-teal/10 text-emerald-teal', icon: 'text-emerald-teal' },
            rose:    { bg: 'bg-rose-500/10',     text: 'text-rose-500',     badge: 'bg-rose-500/10 text-rose-500',     icon: 'text-rose-500' },
            violet:  { bg: 'bg-deep-violet/10',  text: 'text-deep-violet',  badge: 'bg-deep-violet/10 text-deep-violet', icon: 'text-deep-violet' },
            orange:  { bg: 'bg-orange-400/10',   text: 'text-orange-500',   badge: 'bg-orange-400/10 text-orange-500', icon: 'text-orange-500' },
          };
          const c = colorMap[stat.color];
          return (
            <div
              key={stat.label}
              className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 ${c.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 opacity-60`} />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${c.icon}`} strokeWidth={1.5} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${c.badge}`}>
                  {isUp ? '↑' : '↓'} {stat.change}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground/50 relative z-10">{stat.label}</p>
              <p className={`text-xl font-heading font-bold mt-0.5 relative z-10 ${c.text}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Weekly Spending Chart (2/3) */}
        <div className="col-span-1 md:col-span-2 rounded-[var(--radius-xl)] bg-card border border-[var(--border)] p-6 shadow-soft hover:shadow-soft-hover transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground">Hoạt động tuần này</h3>
              <p className="text-xs text-foreground/50 mt-0.5">Chi tiêu & thu nhập theo ngày</p>
            </div>
            <Link
              href="/finance"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-teal hover:underline underline-offset-2"
            >
              Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-[240px] w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(175,84%,32%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(175,84%,32%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(263,70%,50%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(263,70%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)', opacity: 0.5 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--foreground)', opacity: 0.5 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: string) => [
                      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value)),
                      name === 'spend' ? 'Chi tiêu' : 'Thu nhập',
                    ]}
                  />
                  <Area type="monotone" dataKey="spend" stroke="var(--emerald-teal)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="income" stroke="var(--deep-violet)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <Icons.Activity className="w-8 h-8 animate-pulse" />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 pl-1">
            <div className="flex items-center gap-2 text-xs text-foreground/60">
              <span className="w-3 h-3 rounded-full bg-emerald-teal inline-block"></span> Chi tiêu
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/60">
              <span className="w-3 h-3 rounded-full bg-deep-violet inline-block"></span> Thu nhập
            </div>
          </div>
        </div>

        {/* ── Habit Checklist (1/3) */}
        <div className="col-span-1 flex flex-col gap-4">

          {/* Habit Card */}
          <div className="flex-1 rounded-[var(--radius-xl)] bg-card border border-[var(--border)] p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-heading font-semibold text-foreground">Thói quen hôm nay</h3>
                <p className="text-xs text-foreground/50 mt-0.5">{doneCount}/{habitList.length} hoàn thành</p>
              </div>
              <button className="h-8 w-8 rounded-full bg-deep-violet/10 text-deep-violet flex items-center justify-center hover:bg-deep-violet hover:text-white transition-colors duration-200">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {habitList.map((habit) => {
                const IconComponent = (Icons as any)[habit.icon] || Icons.Code;
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, habit.done)}
                    className={`w-full group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                      habit.done
                        ? 'border-deep-violet/30 bg-deep-violet/5'
                        : 'border-[var(--border)] bg-background hover:border-deep-violet/30 hover:bg-deep-violet/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`text-base leading-none ${habit.color}`}>
                        <IconComponent className="w-5 h-5" strokeWidth={1.5} />
                      </span>
                      <span className={`text-sm font-medium transition-colors ${habit.done ? 'text-deep-violet line-through decoration-deep-violet/50' : 'text-foreground'}`}>
                        {habit.name}
                      </span>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      habit.done ? 'bg-deep-violet border-deep-violet' : 'border-slate-300 group-hover:border-deep-violet'
                    }`}>
                      {habit.done && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs font-medium text-foreground/50 mb-1.5">
                <span>Tiến độ hôm nay</span>
                <span className="font-bold text-deep-violet">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-deep-violet to-purple-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>



        </div>
      </div>
    </div>
  );
}
