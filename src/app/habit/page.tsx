'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, Flame, Trophy, Target, BookOpen, Dumbbell, Coffee, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

const INITIAL_HABITS = [
  { id: 1, name: 'Đọc sách 30p', icon: BookOpen, streak: 12, done: false, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 2, name: 'Tập gym', icon: Dumbbell, streak: 5, done: false, color: 'text-orange-600', bg: 'bg-orange-100' },
  { id: 3, name: 'Uống 2L nước', icon: Coffee, streak: 14, done: true, color: 'text-cyan-600', bg: 'bg-cyan-100' },
];

export default function HabitPage() {
  const [habits, setHabits] = useState(INITIAL_HABITS);

  // set to [] to test EmptyState
  // const [habits, setHabits] = useState<typeof INITIAL_HABITS>([]);

  const handleToggleHabit = (id: number, e: React.MouseEvent) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextState = !h.done;
        // If checking a habit, trigger confetti!
        if (nextState) {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const x = (rect.left + rect.width / 2) / window.innerWidth;
          const y = (rect.top + rect.height / 2) / window.innerHeight;
          
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { x, y },
            colors: ['#0D9488', '#6D28D9', '#EAB308', '#F43F5E']
          });
        }
        return { ...h, done: nextState };
      }
      return h;
    }));
  };

  return (
    <div className="w-full pb-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-heading font-bold text-foreground">Thói quen</h2>
          <p className="text-foreground/60 mt-1">Xây dựng cuộc sống kỷ luật mỗi ngày.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" strokeWidth={2} />
          Mục tiêu mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột TRÁI: Danh sách Habit */}
        <div className="lg:col-span-2">
          {habits.length === 0 ? (
            <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-12 text-center shadow-sm">
              <EmptyState 
                title="Sổ tay thói quen trống" 
                description="Bắt đầu thói quen đầu tiên của bạn ngay hôm nay để thấy sự thay đổi lớn nhỏ!" 
                icon={<Target className="h-10 w-10 text-emerald-teal" strokeWidth={1.5} />}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => (
                <motion.div
                  layout
                  key={habit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                    habit.done 
                      ? 'border-emerald-teal/30 bg-emerald-teal/5 shadow-sm' 
                      : 'border-[var(--border)] bg-card hover:border-emerald-teal/50 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${habit.bg} ${habit.color}`}>
                      <habit.icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className={`font-semibold text-lg transition-colors duration-300 ${habit.done ? 'text-emerald-teal line-through decoration-emerald-teal/30' : 'text-foreground'}`}>
                        {habit.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-orange-500 mt-0.5">
                        <Flame className="w-4 h-4 fill-orange-500 text-orange-500 text-xs" strokeWidth={1.5} />
                        {habit.streak} ngày
                      </div>
                    </div>
                  </div>

                  {/* Interactive Checkbox */}
                  <div 
                    onClick={(e) => handleToggleHabit(habit.id, e)}
                    className={`group cursor-pointer relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      habit.done 
                        ? 'border-emerald-teal bg-emerald-teal' 
                        : 'border-slate-300 hover:border-emerald-teal'
                    }`}
                  >
                    <AnimatePresence>
                      {habit.done && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Ring highlight effect on focus/hover */}
                    <div className={`absolute inset-0 -m-1 rounded-full border border-emerald-teal opacity-0 transition-all duration-300 ${
                      habit.done ? '' : 'group-hover:opacity-30 group-hover:scale-110'
                    }`}></div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Cột PHẢI: Heatmap & Gamification */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-deep-violet rounded-[var(--radius-xl)] p-6 text-white shadow-soft relative overflow-hidden">
             {/* Decorative */}
             <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
             
             <h3 className="text-lg font-heading font-semibold mb-6 relative z-10 flex items-center gap-2">
               <Trophy className="w-5 h-5 text-yellow-300" strokeWidth={1.5} />
               Thành tích
             </h3>
             
             <div className="grid grid-cols-2 gap-4 relative z-10">
               <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center border border-white/20">
                 <p className="text-white/70 text-xs mb-1">Chuỗi dài nhất</p>
                 <p className="font-bold text-2xl font-mono">14<span className="text-sm font-sans font-normal ml-1">ngày</span></p>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center border border-white/20">
                 <p className="text-white/70 text-xs mb-1">Tỷ lệ hoàn thành</p>
                 <p className="font-bold text-2xl font-mono">85<span className="text-sm font-sans font-normal ml-1">%</span></p>
               </div>
             </div>
          </div>

          <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-sm">
            <h3 className="text-sm font-medium text-foreground/60 mb-4">Hoạt động tháng 9</h3>
            
            {/* Mocking a heatmap grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 30 }).map((_, i) => {
                // Random intensity
                const intensity = Math.random();
                let bg = 'bg-slate-100 dark:bg-slate-800';
                if (intensity > 0.8) bg = 'bg-emerald-teal';
                else if (intensity > 0.4) bg = 'bg-emerald-teal/60';
                else if (intensity > 0.2) bg = 'bg-emerald-teal/30';
                
                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-sm ${bg} hover:ring-2 ring-deep-violet/30 transition-all cursor-pointer`}
                    title={`Day ${i + 1}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between items-center text-xs text-foreground/40 mt-3 px-1">
              <span>Ít</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-teal/30"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-teal/60"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-teal"></div>
              </div>
              <span>Nhiều</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
