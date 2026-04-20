'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  BookOpen, Dumbbell, Coffee, Heart, Brain, Sparkles, Droplets, 
  Target, Moon, Sun, Apple, Zap, Music, Camera, Circle, Code,
  Check, Flame, Trophy, Plus, Loader2, X, ChevronRight, ChevronLeft, Bell, Link2, Info, Pencil, Trash2, AlertTriangle,
  Footprints, Bike, Waves, Wallet, PiggyBank, Wind, Eye, Ban, Gamepad2, Frown, ArrowUp, Tv, Smartphone, Activity, MinusCircle
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { toggleHabit, addHabit, updateHabit, deleteHabit, aiSuggestHabit, updateHabitValue, getHabitMonthlyHistory, getHabitAchievements, getGlobalHistory } from './actions';

const ICON_MAP: Record<string, any> = {
  BookOpen, Dumbbell, Coffee, Heart, Brain, Sparkles, Droplets, 
  Target, Moon, Sun, Apple, Zap, Music, Camera, Circle, Code,
  Flame, Trophy, Bell, Footprints, Bike, Waves, Wallet, PiggyBank, Wind, Eye, Ban, Gamepad2, Frown, ArrowUp, Tv, Smartphone, Activity, MinusCircle
};

const HABIT_SUGGESTIONS: Record<string, {name: string, icon: string, color: string, unit: string, goal: number}[]> = {
  'Phổ biến': [
    { name: 'Đi bộ', icon: 'Footprints', color: 'text-emerald-500', unit: 'bước', goal: 10000 },
    { name: 'Ngủ', icon: 'Moon', color: 'text-indigo-500', unit: 'h', goal: 8 },
    { name: 'Uống nước', icon: 'Droplets', color: 'text-cyan-500', unit: 'ml', goal: 2000 },
    { name: 'Thiền', icon: 'Brain', color: 'text-violet-500', unit: 'phút', goal: 15 },
    { name: 'Chạy bộ', icon: 'Zap', color: 'text-orange-500', unit: 'km', goal: 5 },
    { name: 'Đứng', icon: 'Activity', color: 'text-amber-500', unit: 'h', goal: 12 },
    { name: 'Đạp xe', icon: 'Bike', color: 'text-emerald-500', unit: 'km', goal: 15 },
    { name: 'Tập thể dục', icon: 'Dumbbell', color: 'text-rose-500', unit: 'phút', goal: 45 },
    { name: 'Calo hoạt động', icon: 'Flame', color: 'text-orange-500', unit: 'kcal', goal: 500 },
    { name: 'Đốt calo', icon: 'Flame', color: 'text-rose-500', unit: 'kcal', goal: 300 },
    { name: 'Tập luyện', icon: 'Activity', color: 'text-indigo-500', unit: 'phút', goal: 60 }
  ],
  'Sức khỏe': [
    { name: 'Đi bộ', icon: 'Footprints', color: 'text-emerald-500', unit: 'bước', goal: 10000 },
    { name: 'Ngủ', icon: 'Moon', color: 'text-indigo-500', unit: 'h', goal: 8 },
    { name: 'Uống nước', icon: 'Droplets', color: 'text-cyan-500', unit: 'ml', goal: 2000 },
    { name: 'Thiền', icon: 'Brain', color: 'text-violet-500', unit: 'phút', goal: 15 },
    { name: 'Chạy bộ', icon: 'Zap', color: 'text-orange-500', unit: 'km', goal: 5 },
    { name: 'Đứng', icon: 'Activity', color: 'text-amber-500', unit: 'h', goal: 12 },
    { name: 'Đạp xe', icon: 'Bike', color: 'text-emerald-500', unit: 'km', goal: 15 },
    { name: 'Tập thể dục', icon: 'Dumbbell', color: 'text-rose-500', unit: 'phút', goal: 45 },
    { name: 'Giảm tinh bột', icon: 'MinusCircle', color: 'text-rose-500', unit: 'phần', goal: 2 },
    { name: 'Giảm Caffeine', icon: 'Coffee', color: 'text-amber-500', unit: 'ly', goal: 1 }
  ],
  'Thể thao': [
    { name: 'Đi bộ', icon: 'Footprints', color: 'text-emerald-500', unit: 'bước', goal: 10000 },
    { name: 'Chạy', icon: 'Zap', color: 'text-orange-500', unit: 'km', goal: 5 },
    { name: 'Căng cơ', icon: 'Activity', color: 'text-indigo-500', unit: 'phút', goal: 10 },
    { name: 'Đứng', icon: 'Activity', color: 'text-amber-500', unit: 'h', goal: 12 },
    { name: 'Yoga', icon: 'Brain', color: 'text-violet-500', unit: 'phút', goal: 30 },
    { name: 'Đạp xe', icon: 'Bike', color: 'text-emerald-500', unit: 'km', goal: 15 },
    { name: 'Bơi lội', icon: 'Waves', color: 'text-cyan-500', unit: 'm', goal: 1000 },
    { name: 'Đốt calo', icon: 'Flame', color: 'text-rose-500', unit: 'kcal', goal: 500 },
    { name: 'Tập luyện', icon: 'Activity', color: 'text-indigo-500', unit: 'phút', goal: 60 },
    { name: 'Tập thể dục', icon: 'Dumbbell', color: 'text-rose-500', unit: 'phút', goal: 45 },
    { name: 'Tập yếm khí', icon: 'Dumbbell', color: 'text-orange-500', unit: 'phút', goal: 45 }
  ],
  'Lối sống': [
    { name: 'Theo dõi chi tiêu', icon: 'Wallet', color: 'text-emerald-500', unit: 'lần', goal: 1 },
    { name: 'Tiết kiệm', icon: 'PiggyBank', color: 'text-emerald-500', unit: 'k', goal: 50 },
    { name: 'Ăn ít đường', icon: 'Apple', color: 'text-rose-500', unit: 'g', goal: 25 },
    { name: 'Hít thở', icon: 'Wind', color: 'text-cyan-500', unit: 'lần', goal: 10 },
    { name: 'Thiền', icon: 'Brain', color: 'text-violet-500', unit: 'phút', goal: 15 },
    { name: 'Đọc sách', icon: 'BookOpen', color: 'text-indigo-500', unit: 'trang', goal: 15 },
    { name: 'Học tập', icon: 'BookOpen', color: 'text-indigo-500', unit: 'h', goal: 2 },
    { name: 'Nhìn lại ngày mới', icon: 'Eye', color: 'text-amber-500', unit: 'lần', goal: 1 },
    { name: 'Rèn luyện tâm trí', icon: 'Brain', color: 'text-violet-500', unit: 'phút', goal: 20 },
    { name: 'Uống nước', icon: 'Droplets', color: 'text-cyan-500', unit: 'ml', goal: 2000 },
    { name: 'Ăn trái cây', icon: 'Apple', color: 'text-emerald-500', unit: 'phần', goal: 2 }
  ],
  'Từ bỏ': [
    { name: 'Bớt tinh bột', icon: 'MinusCircle', color: 'text-rose-500', unit: 'phần', goal: 2 },
    { name: 'Bớt đường', icon: 'MinusCircle', color: 'text-rose-500', unit: 'g', goal: 25 },
    { name: 'Bớt Caffeine', icon: 'Coffee', color: 'text-amber-500', unit: 'ly', goal: 1 },
    { name: 'Bớt nước ngọt', icon: 'MinusCircle', color: 'text-orange-500', unit: 'lon', goal: 0 },
    { name: 'Bớt rượu bia', icon: 'Ban', color: 'text-indigo-500', unit: 'ly', goal: 0 },
    { name: 'Giảm hút thuốc', icon: 'Ban', color: 'text-slate-500', unit: 'điếu', goal: 0 },
    { name: 'Chơi game ít lại', icon: 'Gamepad2', color: 'text-violet-500', unit: 'h', goal: 1 },
    { name: 'Bớt than vãn', icon: 'Frown', color: 'text-rose-500', unit: 'lần', goal: 0 },
    { name: 'Bớt ngồi nhiều', icon: 'ArrowUp', color: 'text-emerald-500', unit: 'phút', goal: 300 },
    { name: 'Xem TV ít lại', icon: 'Tv', color: 'text-slate-500', unit: 'h', goal: 1 },
    { name: 'Bớt mạng xã hội', icon: 'Smartphone', color: 'text-indigo-500', unit: 'phút', goal: 60 }
  ]
};

interface Habit {
  id: string;
  name: string;
  group_name?: string | null;
  icon: string;
  color: string;
  unit: string;
  goal_value: number;
  current_value: number;
  done: boolean;
}

// Removed MonthlyHeatmap as requested to match the new card design

function CalendarHeatmap({ 
    month, 
    year, 
    history, 
    onPrev, 
    onNext 
}: { 
    month: number, 
    year: number, 
    history: any[],
    onPrev: () => void,
    onNext: () => void
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const blanks = (firstDay === 0) ? 6 : firstDay - 1;

  const dayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Tháng {month}/{year}
        </h4>
        <div className="flex gap-2">
            <button onClick={onPrev} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-foreground/50"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={onNext} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-foreground/50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {dayHeaders.map(d => (
            <div key={d} className="text-[10px] font-bold text-foreground/20 text-center mb-1">{d}</div>
        ))}
        {Array(blanks).fill(0).map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square" />
        ))}
        {history.map((day, i) => (
            <div 
                key={i}
                className={`aspect-square rounded-sm transition-all group relative ${
                    day.level === 0 ? 'bg-slate-100 dark:bg-white/5' : 
                    day.level === 1 ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                    day.level === 2 ? 'bg-indigo-300 dark:bg-indigo-700/50' :
                    day.level === 3 ? 'bg-indigo-500 dark:bg-indigo-500/70' : 
                    'bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.3)]'
                }`}
            >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white dark:bg-slate-800 text-deep-violet dark:text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-100 dark:border-slate-700">
                    {day.date}: {day.count} hoàn thành
                </div>
            </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-foreground/40 pt-2 border-t border-slate-100 dark:border-white/10">
            <span>Mức độ đạt được</span>
            <div className="flex items-center gap-1">
                <span>Ít</span>
                {[0,1,2,3,4].map(l => (
                    <div key={l} className={`w-2 h-2 rounded-sm ${
                        l === 0 ? 'bg-slate-100 dark:bg-white/5' : 
                        l === 1 ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                        l === 2 ? 'bg-indigo-300 dark:bg-indigo-700/50' :
                        l === 3 ? 'bg-indigo-500 dark:bg-indigo-500/70' : 
                        'bg-indigo-600 dark:bg-indigo-400'
                    }`} />
                ))}
                <span>Nhiều</span>
            </div>
      </div>
    </div>
  );
}


export default function HabitClient({ initialHabits, dateStr }: { initialHabits: Habit[], dateStr: string }) {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isPending, startTransition] = useTransition();

  // Modal & Edit State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSuggestionGallery, setShowSuggestionGallery] = useState(false);
  const [activeTab, setActiveTab] = useState('Phổ biến');
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDateToLog, setSelectedDateToLog] = useState(dateStr);
  const [activeHabitToLog, setActiveHabitToLog] = useState<Habit | null>(null);
  const [logValue, setLogValue] = useState("");
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [activeGroupFilter, setActiveGroupFilter] = useState("Tất cả");
  const [achievements, setAchievements] = useState<{
    longestStreak: number;
    currentStreak: number;
    todayCompletionRate: number;
  }>({ longestStreak: 0, currentStreak: 0, todayCompletionRate: 0 });

  const fetchAchievements = async () => {
    const data = await getHabitAchievements();
    setAchievements({
        longestStreak: data.longestStreak,
        currentStreak: data.currentStreak || 0,
        todayCompletionRate: data.todayCompletionRate
    });
  };

  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [monthlyHistory, setMonthlyHistory] = useState<any[]>([]);

  const fetchHistory = async (m: number, y: number) => {
    const hist = await getGlobalHistory(m, y);
    setMonthlyHistory(hist);
  };

  useEffect(() => {
    fetchAchievements();
    fetchHistory(viewMonth, viewYear);
  }, [habits, viewMonth, viewYear]);

  // Midnight Monitor: Auto-reset highlights when crossing 00:00
  useEffect(() => {
    const initialDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    
    const timer = setInterval(() => {
      const now = new Date();
      const currentDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
      
      if (currentDate !== initialDate) {
        console.log("Day changed! Refreshing Habit page for midnight reset.");
        window.location.reload(); 
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, []);

  const existingGroups = Array.from(new Set(habits.map(h => h.group_name).filter(Boolean))) as string[];

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
        setViewMonth(12);
        setViewYear(viewYear - 1);
    } else {
        setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
        setViewMonth(1);
        setViewYear(viewYear + 1);
    } else {
        setViewMonth(viewMonth + 1);
    }
  };

  const handleToggleHabit = (id: string, currentDone: boolean, e: React.MouseEvent) => {
    // Optimistic UI update
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const nextState = !currentDone;
    const nextValue = nextState ? habit.goal_value : 0;

    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: nextState, current_value: nextValue } : h));

    if (nextState) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x, y },
        colors: ['#0D9488', '#6D28D9', '#EAB308', '#F43F5E']
      });
    }

    // Background server call
    startTransition(async () => {
      await toggleHabit(id, nextState, dateStr);
      router.refresh();
      fetchAchievements();
    });
  };

  // Form & AI State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Target",
    color: "text-emerald-500",
    unit: "lần",
    goalValue: 1,
    frequency: { type: "daily" as const },
    reminderTime: "",
    linkedCategory: "",
    groupName: ""
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const AVAILABLE_ICONS = ["BookOpen", "Dumbbell", "Coffee", "Heart", "Brain", "Sparkles", "Droplets", "Target", "Moon", "Sun", "Apple", "Zap", "Music", "Camera", "Flame", "Footprints", "Bike", "Waves", "Wallet", "PiggyBank", "Wind", "Eye", "Ban", "Gamepad2", "Frown", "ArrowUp", "Tv", "Smartphone", "Activity", "MinusCircle"];
  const AVAILABLE_COLORS = [
    { name: "Emerald", class: "text-emerald-500", bg: "bg-emerald-50", solid: "bg-emerald-500", shadow: "shadow-emerald-500/30" },
    { name: "Indigo", class: "text-indigo-500", bg: "bg-indigo-50", solid: "bg-indigo-500", shadow: "shadow-indigo-500/30" },
    { name: "Rose", class: "text-rose-500", bg: "bg-rose-50", solid: "bg-rose-500", shadow: "shadow-rose-500/30" },
    { name: "Amber", class: "text-amber-500", bg: "bg-amber-50", solid: "bg-amber-500", shadow: "shadow-amber-500/30" },
    { name: "Cyan", class: "text-cyan-500", bg: "bg-cyan-50", solid: "bg-cyan-500", shadow: "shadow-cyan-500/30" },
    { name: "Violet", class: "text-violet-500", bg: "bg-violet-50", solid: "bg-violet-500", shadow: "shadow-violet-500/30" },
    { name: "Orange", class: "text-orange-500", bg: "bg-orange-50", solid: "bg-orange-500", shadow: "shadow-orange-500/30" },
    { name: "Slate", class: "text-slate-500", bg: "bg-slate-50", solid: "bg-slate-500", shadow: "shadow-slate-500/30" }
  ];

  const FINANCE_CATEGORIES = ['Thiết yếu', 'Ăn uống', 'Mua sắm', 'Di chuyển', 'Giải trí', 'Sức khỏe', 'Chi tiêu khác'];

  const openEditModal = (habit: any) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description || "",
      icon: habit.icon,
      color: habit.color,
      unit: habit.unit || "lần",
      frequency: habit.frequency || { type: "daily" },
      reminderTime: habit.reminder_time || "",
      linkedCategory: habit.linked_finance_category || "",
      goalValue: habit.goal_value || 0,
      groupName: habit.group_name || ""
    });
    setIsEditingGroup(false);
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setShowSuggestionGallery(true);
  };

  const openCustomModal = () => {
    setEditingHabit(null);
    setFormData({
      name: "",
      description: "",
      icon: "Target",
      color: "text-emerald-500",
      unit: "lần",
      frequency: { type: "daily" as const },
      reminderTime: "",
      linkedCategory: "",
      goalValue: 0,
      groupName: ""
    });
    setIsEditingGroup(false);
    setShowSuggestionGallery(false);
    setShowAddModal(true);
  };

  const openSuggestModal = (suggestion: {name: string, icon: string, color: string, unit?: string, goal?: number, group_name?: string}) => {
    setEditingHabit(null);
    setFormData({
      name: suggestion.name,
      description: "",
      icon: suggestion.icon,
      color: suggestion.color,
      unit: suggestion.unit || "lần",
      goalValue: suggestion.goal || 1,
      frequency: { type: "daily" as const },
      reminderTime: "",
      linkedCategory: "",
      groupName: suggestion.group_name || ""
    });
    setIsEditingGroup(false);
    setShowSuggestionGallery(false);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    startTransition(async () => {
      try {
        if (editingHabit) {
            await updateHabit(editingHabit.id, {
                name: formData.name,
                icon: formData.icon,
                color: formData.color,
                description: formData.description,
                frequency: formData.frequency,
                reminder_time: formData.reminderTime || undefined,
                linked_finance_category: formData.linkedCategory || undefined,
                goal_value: formData.goalValue || undefined,
                group_name: formData.groupName || undefined
            });
        } else {
            await addHabit(
                formData.name,
                formData.icon,
                formData.color,
                formData.description,
                formData.frequency,
                formData.reminderTime || undefined,
                formData.linkedCategory || undefined,
                formData.goalValue || 1,
                formData.unit || 'lần'
            );
        }
        setShowAddModal(false);
        setEditingHabit(null);
      } catch (err) {
        alert("Không thể " + (editingHabit ? "cập nhật" : "thêm") + " thói quen. Vui lòng thử lại.");
      }
    });
  };

  const handleDeleteHabit = async () => {
    if (!deletingId) return;
    startTransition(async () => {
        try {
            await deleteHabit(deletingId);
            setShowDeleteModal(false);
            setDeletingId(null);
        } catch (err) {
            alert("Không thể xóa thói quen.");
        }
    });
  };

  const handleLogProgress = async () => {
    if (!activeHabitToLog || !logValue) return;
    const val = Number(logValue);
    
    startTransition(async () => {
        try {
            await updateHabitValue(activeHabitToLog.id, val, activeHabitToLog.goal_value, selectedDateToLog);
            setShowLogModal(false);
            setLogValue("");
        } catch (err) {
            alert("Không thể ghi nhận số liệu.");
        }
    });
  };

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const suggestion = await aiSuggestHabit(aiPrompt);
      if (suggestion) {
        setFormData({
          ...formData,
          name: suggestion.name || formData.name,
          description: suggestion.description || formData.description,
          icon: suggestion.icon || formData.icon,
          color: suggestion.color || formData.color,
          unit: suggestion.unit || formData.unit,
          goalValue: suggestion.goal_value || formData.goalValue
        });
        setAiPrompt("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Thói quen</h2>
          <p className="text-foreground/60 mt-0.5 text-sm sm:text-base">Xây dựng cuộc sống kỷ luật mỗi ngày.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-emerald-500/20 shadow-lg hover:translate-y-[-2px] active:translate-y-0 transition-all font-heading w-full sm:w-auto"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
          Thêm thói quen
        </button>
      </div>

      {/* Group Navigation Tabs */}
      <div className="mb-8 flex overflow-x-auto hide-scrollbar gap-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {["Tất cả", ...existingGroups].map((groupName) => {
          const isActive = activeGroupFilter === groupName;
          const count = groupName === "Tất cả" 
            ? habits.length 
            : habits.filter(h => h.group_name === groupName).length;

          return (
            <button
              key={groupName}
              onClick={() => setActiveGroupFilter(groupName)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border ${
                isActive 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                  : 'bg-white dark:bg-slate-900 text-foreground/50 border-[var(--border)] hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              {groupName}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-foreground/40'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showSuggestionGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuggestionGallery(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-card w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)] flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-[var(--border)] flex flex-col gap-4 sticky top-0 bg-card z-10 shrink-0">
                <div className="flex items-center justify-between">
                  <button onClick={() => setShowSuggestionGallery(false)} className="p-2 -ml-2 text-foreground/70 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <h3 className="text-lg font-heading font-bold flex-1 text-center">Tạo thói quen</h3>
                  <div className="w-9 h-9"></div> {/* Spacer for centering */}
                </div>
                
                {/* Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 -mx-2 px-2 snap-x">
                  {Object.keys(HABIT_SUGGESTIONS).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all snap-start ${
                        activeTab === tab 
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20' 
                          : 'bg-slate-100 dark:bg-slate-800 text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 pb-24">
                {(HABIT_SUGGESTIONS[activeTab] || []).map((sugg, idx) => {
                  const SuggIcon = ICON_MAP[sugg.icon] || Target;
                  return (
                    <button 
                      key={idx}
                      onClick={() => openSuggestModal(sugg)}
                      className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-[var(--border)] rounded-2xl transition-all shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center ${sugg.color}`}>
                          <SuggIcon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <span className="font-semibold text-foreground">{sugg.name}</span>
                      </div>
                      <div className="flex items-center text-emerald-teal opacity-50 group-hover:opacity-100 transition-opacity">
                        <Heart className="w-4 h-4 mr-1 fill-emerald-teal" />
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Custom Bottom Button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-card via-card to-transparent pointer-events-none flex justify-center">
                <button 
                  onClick={openCustomModal}
                  className="pointer-events-auto bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-3.5 rounded-full font-semibold shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all w-full max-w-[250px]"
                >
                  Tùy chỉnh
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (() => {
          const FormIcon = ICON_MAP[formData.icon] || Target;
          const bgThemeClass = AVAILABLE_COLORS.find(c => c.class === formData.color)?.bg || "bg-emerald-50";
          const solidThemeClass = AVAILABLE_COLORS.find(c => c.class === formData.color)?.solid || "bg-emerald-500";
          const shadowThemeClass = AVAILABLE_COLORS.find(c => c.class === formData.color)?.shadow || "shadow-emerald-500/30";

          return (
            <div className="fixed inset-0 z-[60] flex flex-col sm:items-center sm:justify-center bg-[#f8f7fb] dark:bg-slate-950 sm:bg-slate-900/60 sm:backdrop-blur-sm sm:p-4">
              <motion.div 
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative bg-[#f8f7fb] dark:bg-slate-950 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
              >
                {/* HEADER */}
                <div className="pt-12 pb-4 px-4 sm:pt-6 flex items-center justify-between sticky top-0 bg-[#f8f7fb]/80 dark:bg-slate-950/80 backdrop-blur-md z-20">
                  <button onClick={() => setShowAddModal(false)} className="p-2 -ml-2 text-foreground flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ChevronRight className="w-6 h-6 rotate-180" />
                  </button>
                  <div className="flex items-center gap-2">
                    <FormIcon className={`w-5 h-5 ${formData.color}`} />
                    <h3 className="font-heading font-bold text-lg">{formData.name || (editingHabit ? 'Sửa thói quen' : 'Tạo thói quen')}</h3>
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center">
                    {/* Placeholder for header right action if needed */}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 hide-scrollbar">
                  
                  {/* BLOCK 1: Basic Info */}
                  <div className="bg-white dark:bg-card rounded-[24px] p-4 shadow-sm border border-[var(--border)]">
                    <div className="flex gap-4 items-center">
                      <div className={`w-16 h-16 shrink-0 rounded-[18px] flex items-center justify-center ${bgThemeClass}`}>
                        <FormIcon className={`w-8 h-8 ${formData.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <input 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full text-base font-bold bg-transparent border-none focus:ring-0 p-0 text-foreground placeholder:text-foreground/40 focus:outline-none"
                          placeholder={formData.name || "Tên thói quen"}
                        />
                      </div>
                    </div>
                    
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

                     <div className="flex items-center justify-between pb-4">
                      <span className="font-semibold text-sm">Màu sắc</span>
                      <div className="flex items-center gap-1 overflow-hidden hide-scrollbar max-w-[200px]">
                        {AVAILABLE_COLORS.slice(0, 3).map((c) => (
                          <button
                            key={c.class}
                            type="button"
                            onClick={() => setFormData({...formData, color: c.class})}
                            className={`w-6 h-6 shrink-0 rounded-full transition-all flex items-center justify-center ${formData.color === c.class ? `${c.solid} shadow-sm scale-110` : 'opacity-20 ' + c.solid}`}
                          >
                          </button>
                        ))}
                        {AVAILABLE_COLORS.map(c => c.class).includes(formData.color) && !AVAILABLE_COLORS.slice(0,3).map(c=>c.class).includes(formData.color) && (
                          <button type="button" className={`w-6 h-6 shrink-0 rounded-full transition-all flex items-center justify-center shadow-sm scale-110 ${solidThemeClass}`}></button>
                        )}
                        <ChevronRight className="w-4 h-4 ml-1 text-foreground/40" />
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />

                    <div className="flex flex-col gap-3 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Nhóm</span>
                        <div 
                          className="flex items-center gap-1 cursor-pointer"
                          onClick={() => setIsEditingGroup(true)}
                        >
                          {!isEditingGroup ? (
                            <>
                              <span className={`text-sm font-semibold transition-colors ${formData.groupName ? 'text-indigo-500' : 'text-foreground/30'}`}>
                                {formData.groupName || '(Tùy chọn)'}
                              </span>
                              <ChevronRight className="w-4 h-4 text-foreground/20" />
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                               <input 
                                 autoFocus
                                 className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-sm font-semibold text-foreground focus:ring-1 focus:ring-indigo-500 outline-none w-32"
                                 value={formData.groupName}
                                 onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                                 onBlur={() => {
                                   if (!formData.groupName) setIsEditingGroup(false);
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') setIsEditingGroup(false);
                                 }}
                                 placeholder="Tên nhóm..."
                               />
                               <Check 
                                 className="w-4 h-4 text-emerald-500" 
                                 onClick={(e) => { e.stopPropagation(); setIsEditingGroup(false); }} 
                               />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isEditingGroup && existingGroups.length > 0 && !formData.groupName && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {existingGroups.map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, groupName: g});
                                setIsEditingGroup(false);
                              }}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs font-bold text-foreground/60 hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />

                    {/* Danh sách icon (Dạng mini) */}
                    <div className="flex flex-col gap-3">
                      <span className="font-semibold text-sm">Chọn hình ảnh</span>
                      <div className="grid grid-cols-7 gap-2">
                        {AVAILABLE_ICONS.slice(0, 14).map((iconName) => {
                          const IconComp = ICON_MAP[iconName] || Circle;
                          return (
                            <button
                              key={iconName}
                              type="button"
                              onClick={() => setFormData({...formData, icon: iconName})}
                              className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                                formData.icon === iconName 
                                  ? `${solidThemeClass} text-white shadow-md` 
                                  : 'bg-slate-50 dark:bg-slate-800 text-foreground/50 hover:bg-slate-100'
                              }`}
                            >
                              <IconComp className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* BLOCK 2: Value & Unit */}
                  <div className="bg-white dark:bg-card rounded-[24px] p-4 shadow-sm border border-[var(--border)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Mục tiêu</span>
                      <div className="flex items-center gap-2">
                         <div className="bg-slate-100 dark:bg-slate-800 text-foreground px-3 py-1.5 rounded-lg flex items-center">
                           <input
                             type="number"
                             value={formData.goalValue || ''}
                             onChange={(e) => setFormData({...formData, goalValue: Number(e.target.value)})}
                             className="w-12 text-center text-sm font-bold bg-transparent border-none outline-none focus:ring-0 p-0"
                             placeholder="1"
                           />
                         </div>
                         <span className="text-xs font-semibold text-foreground/70">/ Ngày</span>
                      </div>
                    </div>
                    
                    <div className="h-px bg-slate-100 dark:bg-slate-800" />
                    
                    <div className="space-y-2">
                        <span className="font-semibold text-sm">Đơn vị đo</span>
                        <div className="flex flex-wrap gap-2">
                            {['lần', 'km', 'm', 'bước', 'h', 'phút', 'ml', 'ly', 'trang', 'kcal', 'k', 'g', 'phần'].map(u => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => setFormData({...formData, unit: u})}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                        formData.unit === u 
                                          ? `${solidThemeClass} text-white shadow-md` 
                                          : 'bg-slate-100 dark:bg-slate-800 text-foreground/60 hover:text-foreground'
                                    }`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>
                  </div>

                  {/* BLOCK 3: Reminders */}
                  <div className="bg-white dark:bg-card rounded-[24px] p-4 shadow-sm border border-[var(--border)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Nhắc nhở qua Gmail</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={!!formData.reminderTime} onChange={(e) => {
                           if (!e.target.checked) setFormData({...formData, reminderTime: ""});
                           else setFormData({...formData, reminderTime: "20:30"});
                        }} />
                        <div className={`w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${formData.reminderTime ? solidThemeClass : ''}`}></div>
                      </label>
                    </div>
                    
                    {formData.reminderTime && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground/80">Thời gian</span>
                          <div className={`w-8 h-6 rounded-md flex items-center justify-center text-white ${solidThemeClass}`}>
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex">
                           <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${bgThemeClass} ${formData.color.replace('text-', 'bg-').replace('500', '500')}`}>
                             <input type="time" value={formData.reminderTime} onChange={(e) => setFormData({...formData, reminderTime: e.target.value})} className="bg-transparent border-none text-white outline-none cursor-pointer p-0" />
                           </div>
                        </div>
                      </>
                    )}

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Liên kết Tài chính</span>
                      <div className="flex items-center gap-1">
                        <select
                            value={formData.linkedCategory}
                            onChange={(e) => setFormData({...formData, linkedCategory: e.target.value})}
                            className="bg-transparent text-sm font-semibold text-foreground/60 focus:outline-none appearance-none cursor-pointer text-right w-24"
                          >
                            <option value="">(Bỏ qua)</option>
                            {FINANCE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronRight className="w-4 h-4 text-foreground/40 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* FOOTER SAVE BUTTON */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#f8f7fb] via-[#f8f7fb] to-transparent dark:from-slate-950 dark:via-slate-950 pointer-events-none flex justify-center z-10">
                  <button 
                    onClick={handleSubmit}
                    disabled={isPending}
                    className={`pointer-events-auto text-white px-8 py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all w-full flex items-center justify-center gap-2 text-base ${isPending ? 'opacity-50' : 'hover:scale-105'} ${solidThemeClass} ${shadowThemeClass}`}
                  >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu lại'}
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột TRÁI: Danh sách Habit */}
        <div className="lg:col-span-2">
          {habits.length === 0 ? (
            <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-12 text-center shadow-sm">
              <EmptyState 
                title="Sổ tay thói quen trống" 
                description="Bấm 'Thêm thói quen' ở trên để bắt đầu hành trình kỷ luật của bạn." 
                icon={<Target className="h-10 w-10 text-emerald-teal" strokeWidth={1.5} />}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {habits
                .filter(habit => activeGroupFilter === "Tất cả" || habit.group_name === activeGroupFilter)
                .map((habit) => {
                const IconComponent = ICON_MAP[habit.icon] || Code;
                const progressPct = Math.min(100, Math.round((habit.current_value / habit.goal_value) * 100));
                const theme = AVAILABLE_COLORS.find(c => c.class === habit.color) || AVAILABLE_COLORS[0];

                return (
                  <motion.div
                    layout
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onPointerDown={(e) => {
                      const startX = e.clientX;
                      const startTime = Date.now();
                      const rect = e.currentTarget.getBoundingClientRect();
                      let hasMoved = false;

                      const updateHandler = (pe: PointerEvent) => {
                        const dx = Math.abs(pe.clientX - startX);
                        if (dx > 5) hasMoved = true;

                        if (hasMoved) {
                          const x = Math.max(0, Math.min(pe.clientX - rect.left, rect.width));
                          const pct = x / rect.width;
                          const newVal = Math.round(pct * habit.goal_value);
                          setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, current_value: newVal, done: newVal >= habit.goal_value } : h));
                        }
                      };
                      
                      const stopHandler = (pe: PointerEvent) => {
                        window.removeEventListener('pointermove', updateHandler);
                        window.removeEventListener('pointerup', stopHandler);
                        
                        const duration = Date.now() - startTime;
                        const dx = Math.abs(pe.clientX - startX);

                        if (!hasMoved && dx < 10 && duration < 350) {
                          // It's a CLICK
                          setActiveHabitToLog(habit);
                          setLogValue("");
                          setShowLogModal(true);
                        } else if (hasMoved) {
                          // It's a DRAG - Finalize with server
                          const finalX = Math.max(0, Math.min(pe.clientX - rect.left, rect.width));
                          const finalVal = Math.round((finalX / rect.width) * habit.goal_value);
                          startTransition(() => {
                             updateHabitValue(habit.id, finalVal, habit.goal_value, dateStr);
                          });
                        }
                      };

                      window.addEventListener('pointermove', updateHandler);
                      window.addEventListener('pointerup', stopHandler);
                    }}
                    className="group relative h-20 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-white/5 cursor-ew-resize touch-none"
                  >
                    {/* Progress Fill Background */}
                    <motion.div 
                        initial={false}
                        animate={{ width: `${progressPct}%` }}
                        className={`absolute inset-0 z-0 ${theme.solid} opacity-100 shadow-inner pointer-events-none`}
                        style={{ borderRight: progressPct > 0 ? '2px solid rgba(0,0,0,0.1)' : 'none' }}
                    />

                    {/* Content Layer */}
                    <div className="relative z-10 w-full h-full flex items-center justify-between px-5 pointer-events-none select-none">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${progressPct > 5 ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-800 shadow-sm ' + habit.color}`}>
                           <IconComponent className="w-5 h-5 transition-colors" />
                        </div>
                        <h4 className={`font-bold transition-colors ${progressPct > 18 ? 'text-white' : 'text-foreground'}`}>
                          {habit.name}
                        </h4>
                      </div>

                      <div className={`flex flex-col items-end`}>
                        <span className={`text-[13px] font-bold transition-colors ${progressPct > 85 ? 'text-white' : 'text-foreground/60'}`}>
                            {habit.current_value}/{habit.goal_value} {habit.unit}
                        </span>
                        
                        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                            <button 
                                onClick={(e) => { e.stopPropagation(); openEditModal(habit); }} 
                                className={`p-1.5 transition-colors ${progressPct > 90 ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-indigo-500'}`}
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingId(habit.id); setShowDeleteModal(true); }} 
                                className={`p-1.5 transition-colors ${progressPct > 90 ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-rose-500'}`}
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cột PHẢI: Heatmap & Gamification */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-deep-violet rounded-[2.5rem] p-8 text-white shadow-soft relative overflow-hidden">
             <Trophy className="absolute -right-6 -bottom-6 w-40 h-40 opacity-10" />
             <h3 className="text-xl font-heading font-semibold mb-8 relative z-10 flex items-center gap-3">
               <Trophy className="w-6 h-6 text-yellow-300" strokeWidth={1.5} />
               Thành tích
             </h3>
             
             <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                    <p className="text-white/60 text-[10px] uppercase tracking-wider mb-2 font-bold">Hoàn thành</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-mono">{achievements.todayCompletionRate}</span>
                        <span className="text-sm opacity-60">%</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                    <p className="text-white/60 text-[10px] uppercase tracking-wider mb-2 font-bold">Chuỗi streaks</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-mono">{achievements.currentStreak}</span>
                        <span className="text-sm opacity-60">ngày</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* NHỊP ĐỘ HOẠT ĐỘNG CARD */}
          <div className="bg-card border border-[var(--border)] rounded-[2.5rem] p-8 shadow-soft">
              <CalendarHeatmap 
                month={viewMonth}
                year={viewYear}
                history={monthlyHistory}
                onPrev={handlePrevMonth}
                onNext={handleNextMonth}
              />
          </div>
        </div>
      </div>

      {/* LOG PROGRESS MODAL */}
      <AnimatePresence>
        {showLogModal && activeHabitToLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-card border border-[var(--border)] rounded-[2rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${AVAILABLE_COLORS.find(c => c.class === activeHabitToLog.color)?.solid || 'bg-emerald-500'}`}>
                    {(() => {
                        const Icon = ICON_MAP[activeHabitToLog.icon] || Target;
                        return <Icon className="w-8 h-8 text-white" />;
                    })()}
                </div>
                
                <h3 className="text-xl font-heading font-bold text-foreground mb-1">{activeHabitToLog.name}</h3>
                <p className="text-sm text-foreground/40 mb-8">
                    Ghi nhận cho ngày {selectedDateToLog === dateStr ? 'hôm nay' : selectedDateToLog}
                </p>
                
                <div className="w-full flex flex-col gap-6">
                    <div className="flex items-end justify-center gap-2">
                        <input 
                            autoFocus
                            type="number"
                            value={logValue}
                            onChange={(e) => setLogValue(e.target.value)}
                            className="w-24 text-center text-4xl font-bold bg-transparent border-b-2 border-[var(--border)] focus:border-emerald-500 outline-none p-2"
                        />
                        <span className="text-lg font-bold text-foreground/40 pb-2">{activeHabitToLog.unit}</span>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowLogModal(false)}
                            className="flex-1 px-4 py-3 rounded-2xl border border-[var(--border)] text-sm font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Đóng
                        </button>
                        <button 
                            onClick={handleLogProgress}
                            disabled={isPending}
                            className={`flex-1 px-4 py-3 rounded-2xl text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center ${AVAILABLE_COLORS.find(c => c.class === activeHabitToLog.color)?.solid || 'bg-emerald-500'}`}
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ghi nhận"}
                        </button>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-card border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                   <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">Xác nhận xóa?</h3>
                <p className="text-sm text-foreground/60 mb-8">
                  Hành động này không thể hoàn tác. Mọi lịch sử theo dõi của thói quen này sẽ biến mất.
                </p>
                
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-[var(--border)] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleDeleteHabit}
                    disabled={isPending}
                    className="flex-1 px-4 py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xóa ngay"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
