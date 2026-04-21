'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownRight, Flame, Check, Plus,
  TrendingUp, Wallet, Target, Clock, ChevronRight, Activity, 
  BookOpen, Dumbbell, Coffee, Heart, Brain, Sparkles, Droplets, 
  Moon, Sun, Apple, Zap, Music, Camera, Circle, Eye, EyeOff, PiggyBank
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleHabit as toggleHabitAction } from '@/app/(dashboard)/habit/actions';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const ICON_MAP: Record<string, any> = {
  BookOpen, Dumbbell, Coffee, Heart, Brain, Sparkles, Droplets, 
  Target, Moon, Sun, Apple, Zap, Music, Camera
};

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  unit: string;
  goal_value: number;
  current_value: number;
  done: boolean;
}

interface OverviewData {
  chartData: any[];
  quickStats: {
    balance: number;
    monthlySpent: number;
    totalSavings: number;
    habitCount: string;
    streak: number;
    monthlyBudget?: number;
  };
  habits: Habit[];
}

interface Props {
  displayName: string;
  avatarUrl: string | null;
  email: string;
  overviewData: OverviewData;
}

const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatMoney = (amount: number) => {
  return moneyFormatter.format(amount).replace('₫', '').trim() + ' ₫';
};

export default function DashboardClient({ displayName, avatarUrl, email, overviewData }: Props) {
  const router = useRouter();
  const { chartData, quickStats: serverQuickStats, habits: serverHabits } = overviewData;


  const [habitList, setHabitList] = useState<Habit[]>(serverHabits);
  const [isPending, startTransition] = useTransition();
  const [showSavings, setShowSavings] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useLocalStorage('isBalanceVisible', false);

  const toggleHabit = (id: string, currentDone: boolean) => {
    setHabitList((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !currentDone } : h))
    );
    
    startTransition(async () => {
      try {
        await toggleHabitAction(id, !currentDone);
        router.refresh();
      } catch (err) {
        console.error("Failed to toggle habit:", err);
        setHabitList((prev) =>
          prev.map((h) => (h.id === id ? { ...h, done: currentDone } : h))
        );
      }
    });
  };

  const doneCount = habitList.filter((h) => h.done).length;
  const progress = habitList.length > 0 ? Math.round((doneCount / habitList.length) * 100) : 0;

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const initialDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Midnight Monitor: check if date has changed
      const currentDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
      if (currentDate !== initialDate) {
        console.log("Day changed! Refreshing for midnight reset.");
        router.refresh();
        // Update initialDate to avoid multiple refreshes
        // This is a simplistic check; in a real app you might want to force a window.location.reload()
        window.location.reload(); 
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [router]);

  const getGreeting = () => {
    const hour = (currentTime || new Date()).getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="w-full pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-xl shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-teal to-deep-violet flex items-center justify-center text-white font-bold font-heading text-xl">
                {displayName[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-foreground/50 font-medium flex items-center gap-1.5">{getGreeting()} 👋</p>
            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight leading-tight">{displayName}</h2>
            <p className="text-sm text-foreground/40 mt-0.5">{email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl px-5 py-3 shadow-sm backdrop-blur-md">
          <Clock className="w-4 h-4 text-foreground/30" />
          <span className="text-xs font-bold text-foreground/60 whitespace-nowrap">
            {isMounted && currentTime ? (
              `lúc ${currentTime.toLocaleTimeString('vi-VN', { hour12: false })} ${currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
            ) : 'Đang tải...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {(() => {
          const budget = overviewData.quickStats.monthlyBudget || 0;
          const spent = overviewData.quickStats.monthlySpent;
          let expenseChange = 'Tháng này';
          let expenseColor = 'rose';
          
          if (budget > 0) {
            const percentage = (spent / budget) * 100;
            if (percentage < 50) {
              expenseChange = `An toàn (${Math.round(percentage)}%)`;
              expenseColor = 'teal';
            } else if (percentage <= 80) {
              expenseChange = `Cần chú ý (${Math.round(percentage)}%)`;
              expenseColor = 'orange';
            } else {
              expenseChange = `Sắp vượt hạn mức (${Math.round(percentage)}%)`;
              expenseColor = 'rose';
            }
          }

          // ── Streak logic ──
          const streak = overviewData.quickStats.streak;
          const allHabitsDone = habitList.length > 0 && habitList.every(h => h.done);
          const noneStarted = habitList.length > 0 && habitList.every(h => !h.done);
          const hour = (currentTime || new Date()).getHours();
          const milestones = [7, 14, 21, 30, 60, 90, 100, 180, 365];
          const isMilestone = milestones.includes(streak) && allHabitsDone;

          let streakChange = 'Đang duy trì';
          let streakColor = 'orange';
          let isStreakWarning = false;

          if (isMilestone) {
            streakChange = streak >= 30 ? '🏆 Kỷ lục mới!' : '🎉 Tuyệt vời!';
            streakColor = 'violet';
          } else if (allHabitsDone) {
            streakChange = '🔥 Đang cháy';
            streakColor = 'amber';
          } else if (hour >= 20 && noneStarted) {
            streakChange = '⚠️ Sắp đứt chuỗi';
            streakColor = 'rose';
            isStreakWarning = true;
          } else if (hour >= 20) {
            streakChange = '⏳ Đừng bỏ lỡ!';
            streakColor = 'orange';
            isStreakWarning = true;
          } else if (habitList.length === 0) {
            streakChange = 'Chưa có thói quen';
          }

          return [
            { label: 'Số dư khả dụng', value: formatMoney(overviewData.quickStats.balance), change: 'Thực tế', trend: 'up', icon: Wallet, color: 'emerald', isBalance: true },
            { label: 'Chi tiêu tháng', value: formatMoney(overviewData.quickStats.monthlySpent), change: expenseChange, trend: 'down', icon: TrendingUp, color: expenseColor },
            { label: 'Tiết kiệm tổng', value: formatMoney(overviewData.quickStats.totalSavings), change: 'Tích lũy', trend: 'up', icon: PiggyBank, color: 'indigo', isSpecial: true },
            { label: 'Chuỗi duy trì', value: `${streak} ngày`, change: streakChange, trend: 'up', icon: Flame, color: streakColor, isStreakWarning },
          ];
        })().map((stat) => {
          const Icon = stat.icon;
          const colorMap: Record<string, { bg: string; text: string; badge: string; icon: string; dot: string }> = {
            emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500 dark:bg-emerald-400' },
            teal:    { bg: 'bg-teal-500/10',    text: 'text-teal-600 dark:text-teal-400',    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',    icon: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',    dot: 'bg-teal-500 dark:bg-teal-400' },
            rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',    icon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',    dot: 'bg-rose-500 dark:bg-rose-400' },
            indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-600 dark:text-indigo-400',  badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',  icon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',  dot: 'bg-indigo-500 dark:bg-indigo-400' },
            violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',  badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',  icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',  dot: 'bg-violet-500 dark:bg-violet-400' },
            amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',   icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',   dot: 'bg-amber-500 dark:bg-amber-400' },
            orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400',  badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',  icon: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',  dot: 'bg-orange-500 dark:bg-orange-400' },
          };
          const c = colorMap[stat.color];
          return (
            <div
              key={stat.label}
              className={`bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-5 sm:p-7 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 relative group ${isPending && stat.label === 'Chuỗi duy trì' ? 'opacity-80' : ''}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${c.icon} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
                </div>
                {(stat as any).isSpecial ? (
                  <button 
                    onClick={() => setShowSavings(!showSavings)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold ${c.badge} border border-transparent hover:border-current transition-all`}
                  >
                    {showSavings ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                ) : (stat as any).isBalance ? (
                  <button 
                    onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold ${c.badge} border border-transparent hover:border-current transition-all`}
                  >
                    {isBalanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold ${c.badge} border border-transparent group-hover:border-current transition-all overflow-hidden ${(stat as any).isStreakWarning ? 'animate-pulse' : ''}`}>
                     {isPending && stat.label === 'Chuỗi duy trì' ? 'Đang cập nhật...' : `${stat.label === 'Chi tiêu tháng' || stat.label === 'Chuỗi duy trì' ? '' : stat.trend === 'up' ? '↑ ' : '↓ '}${stat.change}`}
                  </div>
                )}
              </div>
              <div className="relative">
                <p className="text-xs sm:text-sm font-medium text-foreground/40 mb-1">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xl sm:text-2xl font-heading font-bold tracking-tight ${c.text}`}>
                    {(stat as any).isSpecial 
                      ? (showSavings ? stat.value : '*** ₫') 
                      : (stat as any).isBalance
                      ? (isBalanceVisible ? stat.value : '****** ₫')
                      : stat.value
                    }
                  </p>
                  {isPending && stat.label === 'Chuỗi streaks' && (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Clock className="w-4 h-4 text-orange-400" />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Body Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Biểu đồ hoạt động */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-heading font-bold text-foreground tracking-tight">Hoạt động tuần này</h3>
                <p className="text-sm text-foreground/40 font-medium">Chi tiêu & thu nhập theo ngày</p>
              </div>
              <Link href="/finance" className="text-xs font-bold text-emerald-teal hover:underline flex items-center gap-1">
                Xem chi tiết <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="h-[300px] w-full">
              {isMounted && (
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
              )}
            </div>

            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-slate-100/50 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Chi tiêu</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Thu nhập</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Tiết kiệm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách thói quen hôm nay */}
        <div className="space-y-6">
          <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-heading font-bold text-foreground tracking-tight">Thói quen hôm nay</h3>
                <p className="text-sm text-foreground/40 font-medium">{doneCount}/{habitList.length} hoàn thành</p>
              </div>
              <Link href="/habit" className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </Link>
            </div>

            <div className="flex-1 mt-6 space-y-3">
              <div className="space-y-3">
                {habitList.map((habit) => {
                  const Icon = ICON_MAP[habit.icon] || Circle;
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id, habit.done)}
                      className={`w-full flex items-center justify-between p-4 rounded-[20px] border-2 transition-all duration-300 group ${habit.done ? 'bg-violet-50/50 border-violet-100 shadow-sm' : 'bg-white border-slate-100 hover:border-violet-100 hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${habit.done ? 'bg-violet-600 text-white' : 'bg-slate-50 text-violet-500'}`}>
                          <Icon className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <p className={`text-sm font-bold transition-all ${habit.done ? 'text-violet-900/60' : 'text-foreground'}`}>
                          {habit.name}
                        </p>
                      </div>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${habit.done ? 'bg-violet-600 border-violet-600 shadow-lg shadow-violet-600/30' : 'border-slate-200 group-hover:border-violet-300'}`}>
                        {habit.done && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Tiến độ hôm nay</span>
                  <span className="text-xs font-extrabold text-violet-600">{progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-violet-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'circOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
