'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, subDays, addDays, isSameDay } from 'date-fns';
import Link from 'next/link';
import { 
  Home, Coffee, Zap, Wallet, ShoppingBag, ChevronLeft, ChevronRight, 
  Activity, Calendar, Loader2, Pencil, Trash2, X, AlertTriangle, ChevronDown,
  Car, Heart, Theater, BookOpen, HelpCircle, Landmark, Briefcase, 
  Gift, TrendingUp, ShieldCheck, Vault, LineChart, PiggyBank, Coins,
  ArrowDownRight, ArrowUpRight, Plus, MoreVertical, FileText, Lightbulb,
  Settings, Repeat, RotateCcw, Target
} from 'lucide-react';
import { getMonthlyTransactions, addTransaction, addTransactionsBatch, deleteTransaction, deleteAllTransactions, updateTransaction, getBalanceHubData, aiCategorize } from './actions';
import { createRecurringTransaction, deleteRecurringTransaction, toggleRecurringTransaction, getRecurringTransactions, type RecurringTransaction } from './recurringActions';
import { QuickConfig } from './QuickConfig';

const EXPENSE_CATEGORIES = ['Ăn uống', 'Di chuyển', 'Nhà cửa & Hóa đơn', 'Mua sắm', 'Sức khỏe', 'Giải trí & Quan hệ', 'Học tập & Phát triển', 'Chi tiêu khác'];
const INCOME_CATEGORIES = ['Lương & Thưởng', 'Làm thêm (Freelance)', 'Quà tặng & Thu nhập khác', 'Lãi & Cổ tức'];
const SAVING_CATEGORIES = ['Quỹ dự phòng', 'Tích lũy dài hạn', 'Đầu tư', 'Bỏ heo/Tiết kiệm tự do'];

const CATEGORY_MAP: Record<string, { icon: any, color: string, bg: string }> = {
  // Expense
  'Ăn uống': { icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  'Di chuyển': { icon: Car, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  'Nhà cửa & Hóa đơn': { icon: Home, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  'Mua sắm': { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/40' },
  'Sức khỏe': { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  'Giải trí & Quan hệ': { icon: Theater, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/40' },
  'Học tập & Phát triển': { icon: BookOpen, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
  'Chi tiêu khác': { icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  
  // Income
  'Lương & Thưởng': { icon: Landmark, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  'Làm thêm (Freelance)': { icon: Briefcase, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/40' },
  'Quà tặng & Thu nhập khác': { icon: Gift, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  'Lãi & Cổ tức': { icon: TrendingUp, color: 'text-lime-500', bg: 'bg-lime-100 dark:bg-lime-900/40' },

  // Saving
  'Quỹ dự phòng': { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  'Tích lũy dài hạn': { icon: Vault, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  'Đầu tư': { icon: LineChart, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  'Bỏ heo/Tiết kiệm tự do': { icon: PiggyBank, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  'Tiết kiệm khác': { icon: Coins, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
};

interface FinanceClientProps {
  initialBalanceInfo: { 
    balance: number; 
    monthlyIncome: number;
    monthlySpent: number;
    totalSavings: number;
    initialBalance: number;
    monthlyBudget: number;
  };
  initialTransactions: any[];
  initialYear: number;
  initialMonth: number;
  initialRecurring: RecurringTransaction[];
  savingAssets?: any[];
}

export function FinanceClient({ initialBalanceInfo, initialTransactions, initialYear, initialMonth, initialRecurring, savingAssets = [] }: FinanceClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date(initialYear, initialMonth - 1, new Date().getDate()));
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [weekCursor, setWeekCursor] = useState(() => new Date(initialYear, initialMonth - 1, new Date().getDate()));
  
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'saving'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string>('Chi tiêu khác');
  const [isMounted, setIsMounted] = useState(false);

  // Time filter for transaction list
  const [listFilter, setListFilter] = useState<'today' | '7days' | '30days' | 'all'>('today');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showDailyDetailModal, setShowDailyDetailModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'nhap' | 'giaodich' | 'lich'>('nhap');
  const [calendarView, setCalendarView] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  const [showSavingDropdown, setShowSavingDropdown] = useState(false);
  const savingDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedSavingAssetId, setSelectedSavingAssetId] = useState<string>('');

  useEffect(() => {
    if (transactionType === 'saving' && savingAssets.length > 0 && !selectedSavingAssetId) {
      setSelectedSavingAssetId(savingAssets[0].id);
    }
  }, [transactionType, savingAssets, selectedSavingAssetId]);

  // Recurring transactions state
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showQuickConfig, setShowQuickConfig] = useState(false);
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>(initialRecurring);
  const [recurringSubmitting, setRecurringSubmitting] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
    title: '',
    amount: '',
    category: 'Chi tiêu khác',
    type: 'expense' as 'income' | 'expense' | 'saving',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    day_of_month: new Date().getDate(),
    day_of_week: 1,
    asset_id: '',
  });

  const refreshRecurring = async () => {
    const list = await getRecurringTransactions();
    setRecurringList(list);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
        setShowQuickConfig(false);
      }
      if (savingDropdownRef.current && !savingDropdownRef.current.contains(event.target as Node)) {
        setShowSavingDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [allTransactions, setAllTransactions] = useState<any[]>(() => {
    return initialTransactions.map(t => {
      const meta = CATEGORY_MAP[t.category] || CATEGORY_MAP['Khác'] || CATEGORY_MAP['Chi tiêu khác'];
      return { ...t, ...meta };
    });
  });

  const transactionsMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    allTransactions.forEach((t) => {
      const day = parseInt(t.date.split('-')[2], 10);
      if (!map[day]) map[day] = [];
      map[day].push(t);
    });
    return map;
  }, [allTransactions]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const txs = await getMonthlyTransactions(year, month);
      const mappedTxs = txs.map(t => {
        const meta = CATEGORY_MAP[t.category] || CATEGORY_MAP['Khác'] || CATEGORY_MAP['Chi tiêu khác'];
        return { ...t, ...meta };
      });
      setAllTransactions(mappedTxs);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (year !== initialYear || month !== initialMonth) {
      fetchDashboardData();
    }
  }, [year, month]);

  const isSubmittingRef = useRef(false);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);

  const handleAddPending = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const titleInput = formData.get('title') as string;
    const amountStr = formData.get('amount') as string;
    const amount = Number(amountStr.replace(/\D/g, ''));
    const categoryInput = formData.get('category') as string;
    const type = transactionType;
    
    let formDate = formData.get('date') as string;
    if (!formDate) {
      formDate = `${year}-${String(month).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    }
    
    if (!amount) {
      alert("Vui lòng nhập số tiền!");
      return;
    }
    
    setPendingTransactions(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(), // local id
      title: titleInput || categoryInput,
      amount,
      category: categoryInput,
      type,
      date: formDate
    }]);
    
    setAmountDisplay('');
    formRef.current.reset();
    setSelectedCategory(transactionType === 'income' ? 'Thu nhập khác' : 'Chi tiêu khác');
  };

  const handleActionSubmit = async (formData: FormData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const formDate = formData.get('date') as string;
    // default to selectedDate if missing
    if (!formDate) {
      formData.set('date', `${year}-${String(month).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`);
    }
    formData.set('type', transactionType);
    
    try {
      if (editingId) {
        await updateTransaction(editingId, formData);
        setEditingId(null);
      } else {
        if (pendingTransactions.length > 0) {
          const allToSubmit = [...pendingTransactions];
          const amountStr = formData.get('amount') as string;
          const amount = Number(amountStr?.replace(/\D/g, '') || 0);
          if (amount > 0) {
            allToSubmit.push({
              title: (formData.get('title') as string) || (formData.get('category') as string),
              amount,
              category: formData.get('category') as string,
              type: formData.get('type') as 'income'|'expense'|'saving',
              date: formData.get('date') as string
            });
          }
          await addTransactionsBatch(allToSubmit);
          setPendingTransactions([]);
        } else {
          await addTransaction(formData);
        }
      }
      await fetchDashboardData();
      
      if (transactionType === 'saving' && !editingId) {
        const amountStr = formData.get('amount') as string;
        const amount = Number(amountStr?.replace(/\D/g, '') || 0);
        const assetId = formData.get('asset_id') as string;
        const assetName = savingAssets.find(a => a.id === assetId)?.name || 'mục tiêu';
        setSuccessMessage(`Xịn quá! Bạn vừa tích lũy thêm ${amount.toLocaleString('vi-VN')}đ cho ${assetName}.`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      if (formRef.current) formRef.current.reset();
      setAmountDisplay('');
      setSelectedCategory(transactionType === 'income' ? 'Thu nhập khác' : 'Chi tiêu khác');
    } catch (e: any) {
      alert("Lỗi: " + (e.message || "Đã có lỗi xảy ra"));
    }
    setSelectedSavingAssetId(savingAssets[0]?.id || '');
    setIsSubmitting(false);
    isSubmittingRef.current = false;
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setTransactionType(t.type);
    setSelectedCategory(t.category);
    
    const absVal = Math.abs(t.amount);
    setAmountDisplay(formatInputAmount(absVal.toString()));
    setSelectedSavingAssetId(t.asset_id || '');
    
    const form = formRef.current;
    if (form) {
      const titleInput = form.elements.namedItem('title') as HTMLInputElement;
      if (titleInput) titleInput.value = t.title;
      const dateInput = form.elements.namedItem('date') as HTMLInputElement;
      if (dateInput) dateInput.value = t.date;
      const notesInput = form.elements.namedItem('notes') as HTMLTextAreaElement;
      if (notesInput) notesInput.value = t.notes || '';
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmountDisplay(formatInputAmount(val));
  };

  const addQuickAmount = (amount: number) => {
    const current = parseInt(amountDisplay.replace(/\D/g, '') || '0', 10);
    setAmountDisplay(formatInputAmount((current + amount).toString()));
  };

  const formatInputAmount = (val: string) => {
    const numberOnly = val.replace(/\D/g, '');
    if (!numberOnly) return '';
    return parseInt(numberOnly, 10).toLocaleString('vi-VN').replace(/,/g, '.');
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsLoading(true);
    try {
      await deleteTransaction(pendingDeleteId);
      await fetchDashboardData();
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    } catch (e: any) {
      alert(e.message);
    }
    setIsLoading(false);
  };

  const confirmResetAll = async () => {
    setIsLoading(true);
    try {
      await deleteAllTransactions();
      await fetchDashboardData();
      setShowResetAllModal(false);
      setShowSettingsDropdown(false);
    } catch (e: any) {
      alert(e.message);
    }
    setIsLoading(false);
  };

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(recurringForm.amount.replace(/\D/g, ''));
    if (!recurringForm.title.trim() || !amount) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    
    let submitAssetId = recurringForm.asset_id;
    let submitCategory = recurringForm.category;

    if (recurringForm.type === 'saving') {
      if (savingAssets.length === 0) {
        alert('Vui lòng tạo ít nhất một mục tiêu tiết kiệm ở tab Tài sản trước!');
        return;
      }
      if (!submitAssetId) {
        submitAssetId = savingAssets[0].id;
        submitCategory = savingAssets[0].name;
      }
    }

    setRecurringSubmitting(true);
    try {
      await createRecurringTransaction({
        title: recurringForm.title.trim(),
        amount,
        category: submitCategory,
        type: recurringForm.type,
        frequency: recurringForm.frequency,
        day_of_month: recurringForm.frequency === 'monthly' ? recurringForm.day_of_month : undefined,
        day_of_week: recurringForm.frequency === 'weekly' ? recurringForm.day_of_week : undefined,
        asset_id: recurringForm.type === 'saving' ? submitAssetId : null,
      });
      setRecurringForm({ title: '', amount: '', category: 'Chi tiêu khác', type: 'expense', frequency: 'monthly', day_of_month: new Date().getDate(), day_of_week: 1, asset_id: '' });
      await refreshRecurring();
    } catch (e: any) {
      alert(e.message);
    }
    setRecurringSubmitting(false);
  };

  const handleRecurringToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleRecurringTransaction(id, !currentActive);
      await refreshRecurring();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRecurringDelete = async (id: string) => {
    if (!confirm('Xóa khoản định kỳ này?')) return;
    try {
      await deleteRecurringTransaction(id);
      await refreshRecurring();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmountDisplay('');
    if (formRef.current) formRef.current.reset();
    setSelectedCategory(transactionType === 'income' ? 'Thu nhập khác' : 'Chi tiêu khác');
  };

  const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
  const formatMoney = (amount: number) => {
    return moneyFormatter.format(amount).replace('₫', '').trim();
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num;
  };

  // Daily Summary Calculations
  const dailyTransactions = useMemo(() => {
    return transactionsMap[selectedDate] || [];
  }, [selectedDate, transactionsMap]);

  const dailyExpense = dailyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const dailyIncome = dailyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const dailySaving = dailyTransactions.filter(t => t.type === 'saving').reduce((acc, t) => acc + t.amount, 0);
  const dailyBalance = dailyIncome - dailyExpense - dailySaving; // Assuming saving reduces available daily cash flow

  // Filtered transactions for the list
  const filteredListTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Time filter
    const selectedDateObj = new Date(year, month - 1, selectedDate);
    if (listFilter === 'today') {
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === selectedDate && d.getMonth() === month - 1 && d.getFullYear() === year;
      });
    } else if (listFilter === '7days') {
      const past7 = subDays(selectedDateObj, 7);
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return isBefore(d, selectedDateObj) && !isBefore(d, past7) || (d.getDate() === selectedDateObj.getDate());
      });
    } else if (listFilter === '30days') {
      const past30 = subDays(selectedDateObj, 30);
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return isBefore(d, selectedDateObj) && !isBefore(d, past30) || (d.getDate() === selectedDateObj.getDate());
      });
    }
    
    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id));
  }, [allTransactions, listFilter, categoryFilter, selectedDate, year, month]);

  const filteredExpense = useMemo(() => filteredListTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [filteredListTransactions]);
  const filteredIncome = useMemo(() => filteredListTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [filteredListTransactions]);
  const filteredSaving = useMemo(() => filteredListTransactions.filter(t => t.type === 'saving').reduce((acc, t) => acc + t.amount, 0), [filteredListTransactions]);
  const filteredBalance = filteredIncome - filteredExpense - filteredSaving;

  return (
    <div className="w-full pb-10">
      {/* MOBILE TABS (only visible < lg) */}
      <div className="flex lg:hidden bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[24px] mb-6 w-full shadow-inner border border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setMobileTab('nhap')}
          className={`flex-1 py-2 text-[14px] font-bold rounded-[20px] transition-all duration-200 ${mobileTab === 'nhap' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
        >
          Nhập
        </button>
        <button 
          onClick={() => setMobileTab('giaodich')}
          className={`flex-1 py-2 text-[14px] font-bold rounded-[20px] transition-all duration-200 ${mobileTab === 'giaodich' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
        >
          Giao dịch
        </button>
        <button 
          onClick={() => setMobileTab('lich')}
          className={`flex-1 py-2 text-[14px] font-bold rounded-[20px] transition-all duration-200 ${mobileTab === 'lich' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
        >
          Lịch
        </button>
      </div>

      <div className="hidden lg:flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-heading font-bold text-foreground">Quản lý Tài chính</h2>
          <p className="text-foreground/60 mt-1">Quản trị dòng tiền hiệu quả với góc nhìn tổng quan mới.</p>
        </div>
        
        {/* Top Right: Actions */}
        <div className="flex items-center gap-3 hidden sm:flex">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-card rounded-xl p-1.5 border border-[var(--border)] shadow-sm">
            <button 
              onClick={() => {
                const newDate = new Date(year, month - 2, 1);
                setCurrentDate(newDate);
                setWeekCursor(newDate);
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-foreground/60 hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-emerald-teal" />
              <span>Tháng {month}, {year}</span>
            </div>
            <button 
              onClick={() => {
                const newDate = new Date(year, month, 1);
                setCurrentDate(newDate);
                setWeekCursor(newDate);
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-foreground/60 hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Dropdown */}
          <div className="relative" ref={settingsDropdownRef}>
            <button 
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="p-2.5 bg-card hover:bg-slate-100 dark:hover:bg-slate-800 border border-[var(--border)] shadow-sm rounded-xl transition-colors text-foreground/60 hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showSettingsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 bg-card border border-[var(--border)] shadow-xl rounded-xl z-50 overflow-hidden"
                >
                  <div className="p-1.5 flex flex-col">
                    <button 
                      onClick={() => { setShowSettingsDropdown(false); setShowRecurringModal(true); }}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-foreground/80 hover:text-foreground transition-colors w-full text-left"
                    >
                      <Repeat className="w-4 h-4 text-indigo-500" /> Khoản định kỳ
                    </button>
                    <div className="h-[1px] bg-[var(--border)] my-1 mx-2" />
                    
                    {/* Collapsible Quick Config Section */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowQuickConfig(!showQuickConfig); }}
                      className="flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-foreground/80 hover:text-foreground transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Target className="w-4 h-4 text-indigo-500" /> Thiết lập nhanh
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuickConfig ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showQuickConfig && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <QuickConfig 
                            initialBalance={initialBalanceInfo.initialBalance} 
                            monthlyBudget={initialBalanceInfo.monthlyBudget}
                            variant="dropdown"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="h-[1px] bg-[var(--border)] my-1 mx-2" />
                    <button 
                      onClick={() => setShowResetAllModal(true)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 rounded-lg transition-colors w-full text-left"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset toàn bộ
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Add Transaction Form (lg:col-span-4) */}
        <div className={`lg:col-span-4 flex-col gap-6 ${mobileTab === 'nhap' ? 'flex' : 'hidden lg:flex'}`}>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft p-5 xl:p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-emerald-teal/10 flex items-center justify-center text-emerald-teal">
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-heading font-bold text-foreground">
                {editingId ? 'Sửa giao dịch' : 'Thêm giao dịch'}
              </h3>
              {editingId && (
                <button onClick={handleCancelEdit} className="ml-auto p-1.5 text-foreground/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-[var(--border)]">
              <button 
                type="button"
                onClick={() => { setTransactionType('expense'); if (!editingId) setSelectedCategory('Chi tiêu khác'); }}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all ${
                  transactionType === 'expense' 
                    ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm border border-[var(--border)]' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" /> Chi tiêu
              </button>
              <button 
                type="button"
                onClick={() => { setTransactionType('income'); if (!editingId) setSelectedCategory('Thu nhập khác'); }}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all ${
                  transactionType === 'income' 
                    ? 'bg-white dark:bg-slate-700 text-emerald-teal shadow-sm border border-[var(--border)]' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Thu nhập
              </button>
              <button 
                type="button"
                onClick={() => { setTransactionType('saving'); if (!editingId) setSelectedCategory('Bỏ heo/Tiết kiệm tự do'); }}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all ${
                  transactionType === 'saving' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm border border-[var(--border)]' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Vault className="w-3.5 h-3.5" /> Tiết kiệm
              </button>
            </div>

            <form ref={formRef} action={handleActionSubmit} className="space-y-4">
              {transactionType === 'saving' && savingAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-[var(--border)] text-center">
                  <PiggyBank className="w-10 h-10 text-indigo-400 mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-foreground/80 mb-1">Chưa có mục tiêu tiết kiệm</p>
                  <p className="text-xs text-foreground/50 mb-4 max-w-[200px]">Hãy tạo một Heo đất hoặc Sổ tiết kiệm để bắt đầu tích lũy.</p>
                  <Link 
                    href="/finance/assets"
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Tạo khoản tiết kiệm
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider mb-1.5 block">Nội dung</label>
                    <input 
                      type="text" 
                      name="title"
                      required={transactionType !== 'saving'}
                      placeholder={transactionType === 'saving' ? "Không bắt buộc (Tự động lấy tên mục tiêu)" : "Ví dụ: Ăn sáng phở bò..."}
                      className="w-full text-sm bg-background border border-[var(--border)] rounded-xl px-4 py-2.5 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all placeholder:text-foreground/30" 
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider mb-1.5 block">
                      {transactionType === 'saving' ? 'Gửi vào mục tiêu' : 'Danh mục'}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                         {transactionType === 'saving' ? <PiggyBank className="w-3 h-3 text-indigo-500" /> : <ShoppingBag className="w-3 h-3 text-foreground/50" />}
                      </div>
                      {transactionType === 'saving' ? (
                        <div className="relative w-full" ref={savingDropdownRef}>
                          <input type="hidden" name="asset_id" value={selectedSavingAssetId} />
                          <button
                            type="button"
                            onClick={() => setShowSavingDropdown(!showSavingDropdown)}
                            className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all focus:ring-1 text-left ${showSavingDropdown ? 'border-indigo-500 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-[var(--border)] bg-background hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            <span className="truncate font-semibold text-indigo-900 dark:text-indigo-100">
                              {savingAssets.find(a => a.id === selectedSavingAssetId)?.name || 'Chọn loại hình tiết kiệm...'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-foreground/50 transition-transform ${showSavingDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {showSavingDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 top-full mt-2 bg-card border border-[var(--border)] shadow-xl rounded-xl z-50 overflow-hidden max-h-[350px] flex flex-col"
                              >
                                <div className="p-2 overflow-y-auto no-scrollbar">
                                  {/* Tiết kiệm linh hoạt */}
                                  <div className="mb-2">
                                    <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider px-3 mb-1.5 mt-1">Tiết kiệm linh hoạt</h4>
                                    {savingAssets.filter(a => a.symbol !== 'TERM').map(asset => {
                                      const progress = asset.target > 0 ? Math.min(100, (Number(asset.value) / Number(asset.target)) * 100) : 0;
                                      return (
                                        <button
                                          key={asset.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedSavingAssetId(asset.id);
                                            setShowSavingDropdown(false);
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${selectedSavingAssetId === asset.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground'}`}
                                        >
                                          <div className="flex items-center gap-3 w-full overflow-hidden">
                                            <PiggyBank className="w-4 h-4 text-indigo-500 shrink-0" strokeWidth={2} />
                                            <div className="flex-1 truncate">
                                              <span className="block font-medium truncate">{asset.name}</span>
                                              {asset.target > 0 && (
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                  <div className="bg-emerald-teal h-full transition-all" style={{ width: `${progress}%` }} />
                                                </div>
                                              )}
                                            </div>
                                            {asset.target > 0 && (
                                              <span className="text-xs font-bold text-emerald-teal shrink-0 ml-2">
                                                {Math.round(progress)}%
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  
                                  <div className="h-[1px] bg-[var(--border)] my-2 mx-2" />
                                  
                                  {/* Tiết kiệm có kỳ hạn */}
                                  <div className="my-2">
                                    <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider px-3 mb-1.5">Tiết kiệm có kỳ hạn</h4>
                                    
                                    {savingAssets.filter(a => a.symbol === 'TERM').map(asset => {
                                      const progress = asset.target > 0 ? Math.min(100, (Number(asset.value) / Number(asset.target)) * 100) : 0;
                                      return (
                                        <button
                                          key={asset.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedSavingAssetId(asset.id);
                                            setShowSavingDropdown(false);
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${selectedSavingAssetId === asset.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground'}`}
                                        >
                                          <div className="flex items-center gap-3 w-full overflow-hidden">
                                            <Landmark className="w-4 h-4 text-indigo-500 shrink-0" strokeWidth={2} />
                                            <div className="flex-1 truncate">
                                              <span className="block font-medium truncate">{asset.name}</span>
                                              {asset.target > 0 && (
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                  <div className="bg-emerald-teal h-full transition-all" style={{ width: `${progress}%` }} />
                                                </div>
                                              )}
                                            </div>
                                            {asset.target > 0 && (
                                              <span className="text-xs font-bold text-emerald-teal shrink-0 ml-2">
                                                {Math.round(progress)}%
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}

                                    {savingAssets.filter(a => a.symbol === 'TERM').length === 0 && (
                                      <Link href="/finance/assets" className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground/70 transition-colors group">
                                        <div className="flex items-center gap-3">
                                          <Landmark className="w-4 h-4 text-indigo-400" strokeWidth={2} />
                                          <span className="font-medium">Thêm sổ tiết kiệm/gửi NH</span>
                                        </div>
                                        <Plus className="w-4 h-4 text-foreground/30 group-hover:text-foreground/70 transition-colors" />
                                      </Link>
                                    )}
                                  </div>
                                  
                                  <div className="h-[1px] bg-[var(--border)] my-2 mx-2" />
                                  
                                  {/* Quản lý */}
                                  <div className="mt-2 mb-1">
                                    <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider px-3 mb-1.5">Quản lý</h4>
                                    <Link href="/finance/assets" className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground/80 hover:text-foreground transition-colors rounded-lg">
                                      <Settings className="w-4 h-4 text-foreground/50" />
                                      <span className="font-medium">Quản lý các hũ tiết kiệm</span>
                                    </Link>
                                    <Link href="/finance/assets" className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground/80 hover:text-foreground transition-colors rounded-lg">
                                      <Plus className="w-4 h-4 text-foreground/50" />
                                      <span className="font-medium">Thêm hũ mới</span>
                                    </Link>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <select 
                          name="category" 
                          required 
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-xl outline-none transition-all cursor-pointer bg-background focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 appearance-none"
                        >
                          {(transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

              <div>
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider mb-1.5 block">Số tiền</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-emerald-teal/10 flex items-center justify-center">
                     <span className="text-emerald-teal text-xs font-bold">đ</span>
                  </div>
                  <input 
                    type="text" 
                    name="amount"
                    required
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    placeholder="0" 
                    className="w-full pl-12 pr-12 py-2.5 text-sm font-semibold bg-background border border-[var(--border)] rounded-xl outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground/40">VND</span>
                </div>
                {/* Quick Add Buttons */}
                <div className="flex gap-2 mt-2">
                  {[50000, 100000, 200000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => addQuickAmount(amt)}
                      className="flex-1 py-1 bg-slate-50 dark:bg-slate-800 border border-[var(--border)] rounded-lg text-[10px] font-medium text-foreground/60 hover:text-foreground hover:border-foreground/20 transition-colors"
                    >
                      + {formatCompact(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider mb-1.5 block">Ngày giao dịch</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input 
                    type="date" 
                    name="date"
                    required
                    defaultValue={`${year}-${String(month).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-[var(--border)] rounded-xl outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all" 
                  />
                </div>
              </div>

              <div className="pt-2">
                {pendingTransactions.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Hàng chờ ({pendingTransactions.length})</span>
                    </div>
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {pendingTransactions.map((pt) => (
                        <div key={pt.id} className="flex justify-between items-center bg-white dark:bg-slate-800 border border-[var(--border)] p-2 rounded-lg text-sm">
                           <div className="flex items-center gap-2 overflow-hidden">
                             <div className={`w-2 h-2 shrink-0 rounded-full ${pt.type === 'income' ? 'bg-emerald-teal' : pt.type === 'saving' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                             <span className="font-medium truncate max-w-[120px] sm:max-w-[150px]">{pt.title}</span>
                           </div>
                           <div className="flex items-center gap-2 shrink-0">
                             <span className="font-bold">{formatCompact(pt.amount)}</span>
                             <button type="button" onClick={() => setPendingTransactions(prev => prev.filter(x => x.id !== pt.id))} className="text-foreground/40 hover:text-rose-500 p-1">
                                <X className="w-3.5 h-3.5" />
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {!editingId && (
                    <button 
                      type="button" 
                      onClick={handleAddPending}
                      className="flex-[0.8] py-3.5 rounded-xl text-sm font-bold text-foreground bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-[var(--border)]"
                    >
                      <Plus className="w-4 h-4" /> Thêm tiếp
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={isSubmitting || (transactionType === 'saving' && savingAssets.length === 0)}
                    className={`flex-1 py-3.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${editingId ? 'bg-deep-violet' : (transactionType === 'saving' ? 'bg-indigo-600' : 'bg-emerald-teal')}`}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Lưu thay đổi' : (pendingTransactions.length > 0 ? `Lưu tất cả` : 'Lưu giao dịch'))}
                  </button>
                </div>
                {!editingId && pendingTransactions.length === 0 && !successMessage && (
                  <p className="text-center text-[10px] text-foreground/40 mt-3 font-medium flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" /> Nhập xong có thể bấm "Thêm tiếp" để nhập hàng loạt
                  </p>
                )}
                
                <AnimatePresence>
                  {successMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-4 p-3 bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 rounded-xl flex items-start gap-2"
                    >
                      <PiggyBank className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {successMessage}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </>
              )}
            </form>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Calendar & List (lg:col-span-8) */}
        <div className={`lg:col-span-8 flex-col gap-4 ${mobileTab !== 'nhap' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Calendar View - Desktop (Horizontal 7-day) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft p-4 xl:p-5 relative hidden lg:block"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h3 className="text-base font-heading font-bold text-foreground">
                 Chọn ngày để xem chi tiết giao dịch
              </h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setCalendarView('weekly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${calendarView === 'weekly' ? 'bg-emerald-teal text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
                >
                  Xem nhanh
                </button>
                <button 
                  onClick={() => setCalendarView('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${calendarView === 'monthly' ? 'bg-emerald-teal text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
                >
                  Lịch đầy đủ
                </button>
              </div>
            </div>

            <div className="w-full relative">
              {isLoading && (
                 <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/50 backdrop-blur-[2px] rounded-xl">
                   <Loader2 className="w-8 h-8 animate-spin text-emerald-teal" />
                 </div>
              )}
              
              {calendarView === 'monthly' ? (
                <div className="w-full">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-foreground/50">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const monthStart = startOfMonth(currentDate);
                      const monthEnd = endOfMonth(currentDate);
                      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                      const days = eachDayOfInterval({ start: startDate, end: endDate });

                      return days.map((date, i) => {
                        const dayNum = date.getDate();
                        const isCurrentMonth = isSameMonth(date, currentDate);
                        const isSelected = selectedDate === dayNum && isCurrentMonth;
                        const isTodayDate = isMounted && isSameDay(date, new Date());
                        
                        const txs = isCurrentMonth ? (transactionsMap[dayNum] || []) : [];
                        const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                        const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
                        const net = income - expense - (txs.filter(t => t.type === 'saving').reduce((acc, t) => acc + Math.abs(t.amount), 0));

                        return (
                          <div 
                            key={i} 
                            onClick={() => {
                              if (!isCurrentMonth) {
                                setCurrentDate(date);
                                setWeekCursor(date);
                              }
                              setSelectedDate(date.getDate());
                              setListFilter('today');
                            }}
                            className={`min-h-[3rem] sm:min-h-[3.5rem] flex flex-col items-center justify-center py-1 px-0.5 cursor-pointer transition-all rounded-lg bg-card ${isSelected ? 'border-2 border-emerald-teal shadow-sm' : 'border border-[var(--border)] hover:border-emerald-teal/50'} ${isTodayDate && !isSelected ? 'border border-emerald-teal/60' : ''} ${!isCurrentMonth ? 'opacity-40 bg-slate-50 dark:bg-slate-800/50' : ''}`}
                          >
                            <span className={`text-[11px] sm:text-[13px] font-bold ${isSelected ? 'text-emerald-teal' : 'text-foreground'}`}>
                              {dayNum}
                            </span>
                            
                            {isCurrentMonth ? (
                              <span className={`text-[9px] sm:text-[10px] font-bold mt-0.5 ${net > 0 ? 'text-emerald-500' : net < 0 ? 'text-rose-500' : 'text-transparent'}`}>
                                {net !== 0 ? (net > 0 ? '+' : '') + formatCompact(net) : '0'}
                              </span>
                            ) : (
                              <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 text-transparent">0</span>
                            )}

                            <div className="h-1.5 mt-0.5 flex items-center justify-center gap-0.5">
                              {isCurrentMonth && (income > 0 || expense > 0) ? (
                                <>
                                  {income > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                  {expense > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                                </>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setWeekCursor(prev => subDays(prev, 7))} 
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl border border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-foreground/60 hover:text-foreground"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar justify-between px-1">
                    {(() => {
                      const weekStart = startOfWeek(weekCursor, { weekStartsOn: 1 });
                      const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

                      return days.map((date, i) => {
                        const dayNum = date.getDate();
                        const isCurrentMonth = isSameMonth(date, currentDate);
                        const isSelected = selectedDate === dayNum && isCurrentMonth;
                        const isTodayDate = isMounted && isSameDay(date, new Date());
                        
                        const txs = isCurrentMonth ? (transactionsMap[dayNum] || []) : [];
                        const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                        const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
                        const net = income - expense - (txs.filter(t => t.type === 'saving').reduce((acc, t) => acc + Math.abs(t.amount), 0));
                        
                        return (
                          <div 
                            key={i} 
                            onClick={() => {
                              setSelectedDate(dayNum);
                              if (!isCurrentMonth) {
                                setCurrentDate(date);
                                setWeekCursor(date);
                              }
                              setListFilter('today');
                            }}
                            className={`flex-1 min-w-[3.5rem] flex flex-col items-center justify-center py-2 px-1 cursor-pointer transition-all rounded-xl bg-card ${isSelected ? 'border-2 border-emerald-teal shadow-sm' : 'border border-[var(--border)] hover:border-emerald-teal/50'} ${isTodayDate && !isSelected ? 'border border-emerald-teal/60' : ''}`}
                          >
                            <span className={`text-[13px] font-bold ${isSelected ? 'text-emerald-teal' : 'text-foreground'}`}>
                              {dayNum}
                            </span>
                            <span className="text-[10px] font-medium text-foreground/50 mb-1">
                              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]}
                            </span>
                            
                            {isCurrentMonth ? (
                              <span className={`text-[11px] font-bold ${net > 0 ? 'text-emerald-500' : net < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                                {net !== 0 ? (net > 0 ? '+' : '') + formatCompact(net) : '0đ'}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-300 dark:text-slate-700">0đ</span>
                            )}

                            <div className="h-1.5 mt-1 flex items-center justify-center">
                              <span className={`w-1.5 h-1.5 rounded-full ${isCurrentMonth ? (income === 0 && expense === 0 ? 'bg-slate-200 dark:bg-slate-700' : (net >= 0 ? 'bg-emerald-500' : 'bg-rose-500')) : 'bg-slate-200 dark:bg-slate-700'}`} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <button 
                    onClick={() => setWeekCursor(prev => addDays(prev, 7))} 
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl border border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-foreground/60 hover:text-foreground"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-[11px] font-medium text-foreground/60 px-2">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Thu nhập</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Chi tiêu</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" /> Không có giao dịch</div>
            </div>

            {/* Daily Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-[var(--border)] bg-card shadow-sm">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-foreground/60 font-medium">Tổng chi</p>
                  <p className="text-xs sm:text-sm font-bold text-rose-600 mt-0.5">-{formatMoney(dailyExpense)}đ</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-[var(--border)] bg-card shadow-sm">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-foreground/60 font-medium">Tổng thu</p>
                  <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5">+{formatMoney(dailyIncome)}đ</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-[var(--border)] bg-card shadow-sm">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-foreground/60 font-medium truncate">Số dư</p>
                  <p className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${dailyBalance > 0 ? 'text-emerald-600' : dailyBalance < 0 ? 'text-rose-600' : 'text-foreground'}`}>
                    {dailyBalance > 0 ? '+' : ''}{formatMoney(dailyBalance)}đ
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Calendar View - Mobile (Full Month Grid) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft p-4 relative block lg:hidden ${mobileTab === 'lich' ? 'block' : 'hidden'}`}
          >
            <div className="flex justify-between items-center mb-4 px-1">
              <button 
                onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-foreground/60"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-[15px] font-heading font-bold text-foreground">
                 Tháng {month}, {year}
              </h3>
              <button 
                onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-foreground/60"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-foreground/50 mb-2">
              <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const daysInMonth = new Date(year, month, 0).getDate();
                const daysInMonthArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
                const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
                const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
                
                return (
                  <>
                    {blanks.map(i => <div key={`blank-${i}`} className="min-h-[3.5rem] rounded-xl bg-slate-50/50 dark:bg-slate-800/30" />)}
                    {daysInMonthArray.map(dayNum => {
                      const isSelected = selectedDate === dayNum;
                      const isTodayDate = isMounted && isSameDay(new Date(year, month - 1, dayNum), new Date());
                      
                      const txs = transactionsMap[dayNum] || [];
                      const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                      const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
                      const net = income - expense - (txs.filter(t => t.type === 'saving').reduce((acc, t) => acc + Math.abs(t.amount), 0));
                      
                      return (
                        <div 
                          key={`day-${dayNum}`}
                          onClick={() => {
                            setSelectedDate(dayNum);
                            setListFilter('today');
                          }}
                          className={`min-h-[3.5rem] flex flex-col items-center justify-start pt-1.5 pb-1 px-0.5 cursor-pointer transition-all rounded-xl ${isSelected ? 'bg-emerald-teal/10 border-2 border-emerald-teal' : 'bg-card border border-[var(--border)]'} ${isTodayDate && !isSelected ? 'border-emerald-teal/40' : ''}`}
                        >
                          <span className={`text-[12px] font-bold ${isSelected ? 'text-emerald-teal' : 'text-foreground'}`}>
                            {dayNum}
                          </span>
                          <div className="flex flex-col items-center mt-auto w-full gap-[2px]">
                            {net !== 0 ? (
                              <span className={`text-[8px] font-bold w-full truncate px-0.5 ${net > 0 ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 rounded' : net < 0 ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 rounded' : 'text-slate-500'}`}>
                                {net > 0 ? '+' : ''}{formatCompact(net)}
                              </span>
                            ) : (
                              <span className="text-[9px] text-foreground/30 font-medium">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-medium text-foreground/60 px-2">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> + Thu</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> - Chi</div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-[var(--border)]">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-foreground">
                  {['CN', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][new Date(year, month - 1, selectedDate).getDay()]}, {String(selectedDate).padStart(2, '0')}/{String(month).padStart(2, '0')}/{year}
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-rose-50 dark:bg-rose-900/10 p-2 rounded-xl text-center border border-rose-100 dark:border-rose-900/20">
                  <p className="text-[10px] text-foreground/60 mb-0.5">Chi tiêu</p>
                  <p className="text-xs font-bold text-rose-600">-{formatCompact(dailyExpense)}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-xl text-center border border-emerald-100 dark:border-emerald-900/20">
                  <p className="text-[10px] text-foreground/60 mb-0.5">Thu nhập</p>
                  <p className="text-xs font-bold text-emerald-600">+{formatCompact(dailyIncome)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-foreground/60 mb-0.5">Số dư</p>
                  <p className={`text-xs font-bold ${dailyBalance > 0 ? 'text-emerald-600' : dailyBalance < 0 ? 'text-rose-600' : 'text-foreground'}`}>{dailyBalance > 0 ? '+' : ''}{formatCompact(dailyBalance)}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setListFilter('today');
                  setMobileTab('giaodich');
                }}
                className="w-full py-2.5 bg-emerald-teal text-white rounded-xl text-sm font-bold hover:bg-emerald-teal/90 transition-colors"
              >
                Xem {transactionsMap[selectedDate]?.length || 0} giao dịch ngày này
              </button>
            </div>
          </motion.div>

          {/* Transaction List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft p-4 xl:p-5 flex-col flex-1 ${mobileTab === 'giaodich' ? 'flex' : 'hidden lg:flex'}`}
          >
            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <button onClick={() => setListFilter('today')} className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${listFilter === 'today' ? 'bg-emerald-teal text-white border-emerald-teal shadow-md' : 'bg-transparent text-foreground/70 border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Hôm nay</button>
              <button onClick={() => setListFilter('7days')} className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${listFilter === '7days' ? 'bg-emerald-teal text-white border-emerald-teal shadow-md' : 'bg-transparent text-foreground/70 border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800'}`}>7 ngày</button>
              <button onClick={() => setListFilter('30days')} className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${listFilter === '30days' ? 'bg-emerald-teal text-white border-emerald-teal shadow-md' : 'bg-transparent text-foreground/70 border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800'}`}>30 ngày</button>
              <button onClick={() => setListFilter('all')} className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${listFilter === 'all' ? 'bg-emerald-teal text-white border-emerald-teal shadow-md' : 'bg-transparent text-foreground/70 border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Tất cả</button>
            </div>


            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-heading font-bold text-foreground">
                Giao dịch ({filteredListTransactions.length})
              </h3>
              
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-[var(--border)]">
                <button 
                  onClick={() => {
                    const d = new Date(year, month - 1, selectedDate - 1);
                    setCurrentDate(d);
                    setSelectedDate(d.getDate());
                    setListFilter('today');
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-foreground/60"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[12px] font-bold min-w-[70px] text-center">
                  {String(selectedDate).padStart(2, '0')}/{String(month).padStart(2, '0')}
                </span>
                <button 
                  onClick={() => {
                    const d = new Date(year, month - 1, selectedDate + 1);
                    setCurrentDate(d);
                    setSelectedDate(d.getDate());
                    setListFilter('today');
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-foreground/60"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {filteredListTransactions.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center opacity-50">
                  <FileText className="w-10 h-10 mb-3 text-foreground/30" />
                  <p className="text-sm font-medium">Không tìm thấy giao dịch nào</p>
                </div>
              ) : (
                filteredListTransactions.slice(0, 3).map((t, index, arr) => {
                  const Icon = t.icon || Activity;
                  const isIncome = t.type === 'income';
                  const isSaving = t.type === 'saving';
                  const timeString = t.created_at ? new Date(t.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                  
                  const d = new Date(t.date);
                  const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                  
                  let showHeader = false;
                  if (listFilter !== 'today') {
                    if (index === 0) showHeader = true;
                    else {
                      const prevD = new Date(arr[index - 1].date);
                      const prevDateStr = `${String(prevD.getDate()).padStart(2, '0')}/${String(prevD.getMonth() + 1).padStart(2, '0')}/${prevD.getFullYear()}`;
                      showHeader = dateStr !== prevDateStr;
                    }
                  }
                  
                  return (
                    <React.Fragment key={t.id}>
                      {showHeader && (
                        <div className="text-xs font-bold text-foreground/50 mt-3 mb-1 px-1">
                          {dateStr}
                        </div>
                      )}
                      <div 
                        className="group flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-[var(--border)] relative"
                      >
                        <div className={`flex items-center gap-3 w-[45%] sm:w-1/3`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.bg} ${t.color}`}>
                            <Icon className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{t.title}</p>
                            <p className="text-[11px] text-foreground/50 font-medium mt-0.5 truncate">{t.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 flex justify-center items-center">
                          {timeString && <span className="text-[11px] font-medium text-foreground/40">{timeString}</span>}
                        </div>

                        <div className="w-[45%] sm:w-1/3 flex items-center justify-end gap-3">
                          <span className={`text-sm font-bold font-mono whitespace-nowrap ${isIncome ? 'text-emerald-500' : isSaving ? 'text-indigo-600' : 'text-rose-500'}`}>
                            {isIncome ? '+' : isSaving ? '' : '-'}{formatMoney(Math.abs(t.amount))}đ
                          </span>
                          
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-card/80 backdrop-blur-sm p-1 rounded-lg">
                            <button onClick={() => handleEdit(t)} className="p-1.5 text-foreground/40 hover:text-emerald-teal hover:bg-emerald-teal/10 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 text-foreground/40 hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>
            
            {filteredListTransactions.length > 3 && (
              <div className="mt-4 pt-2">
                <button onClick={() => setShowDailyDetailModal(true)} className="w-full py-2.5 rounded-xl border border-emerald-teal/30 text-emerald-teal bg-emerald-teal/5 hover:bg-emerald-teal/10 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors">
                  Xem thêm {filteredListTransactions.length - 3} giao dịch <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>
            )}
          </motion.div>
        </div>

      </div>

      {/* DAILY DETAIL MODAL */}
      <AnimatePresence>
        {showDailyDetailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDailyDetailModal(false)} className="absolute inset-0" />
            
            <motion.div 
              initial={{ y: '100%', opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: '100%', opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full h-[90vh] sm:h-auto sm:max-h-[90vh] max-w-md bg-card sm:border border-[var(--border)] rounded-t-[1.5rem] sm:rounded-2xl shadow-2xl flex flex-col mt-auto sm:mt-0"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] shrink-0">
                <button onClick={() => setShowDailyDetailModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
                <div className="flex flex-col items-center justify-center flex-1">
                  <h3 className="text-[15px] font-bold">
                    {listFilter === 'today' ? `Giao dịch ngày ${String(selectedDate).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}` : 
                     listFilter === '7days' ? 'Giao dịch trong 7 ngày' :
                     listFilter === '30days' ? 'Giao dịch trong 30 ngày' : 
                     'Tất cả giao dịch'}
                  </h3>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-foreground/50 whitespace-nowrap">
                  {filteredListTransactions.length} giao dịch
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                
                {/* Summary Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center text-center">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mb-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <p className="text-[10px] font-medium text-foreground/50 mb-0.5">Tổng chi</p>
                    <p className="text-xs font-bold text-rose-600">-{formatMoney(filteredExpense)}đ</p>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center text-center">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-medium text-foreground/50 mb-0.5">Tổng thu</p>
                    <p className="text-xs font-bold text-emerald-600">{filteredIncome > 0 ? '+' : ''}{formatMoney(filteredIncome)}đ</p>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center text-center">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-1.5">
                      <Wallet className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <p className="text-[10px] font-medium text-foreground/50 mb-0.5">Số dư</p>
                    <p className={`text-xs font-bold ${filteredBalance > 0 ? 'text-emerald-600' : filteredBalance < 0 ? 'text-rose-600' : 'text-foreground'}`}>
                      {filteredBalance > 0 ? '+' : ''}{formatMoney(filteredBalance)}đ
                    </p>
                  </div>
                </div>

                {/* List */}
                <div className="flex flex-col gap-3">
                  {filteredListTransactions.map((t, index, arr) => {
                    const Icon = t.icon || Activity;
                    const isIncome = t.type === 'income';
                    const isSaving = t.type === 'saving';
                    const timeString = t.created_at ? new Date(t.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                    
                    const d = new Date(t.date);
                    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    
                    let showHeader = false;
                    if (listFilter !== 'today') {
                      if (index === 0) showHeader = true;
                      else {
                        const prevD = new Date(arr[index - 1].date);
                        const prevDateStr = `${String(prevD.getDate()).padStart(2, '0')}/${String(prevD.getMonth() + 1).padStart(2, '0')}/${prevD.getFullYear()}`;
                        showHeader = dateStr !== prevDateStr;
                      }
                    }
                    
                    return (
                      <React.Fragment key={t.id}>
                        {showHeader && (
                          <div className="text-[13px] font-bold text-foreground/60 mt-3 mb-1 px-1">
                            {dateStr}
                          </div>
                        )}
                        <div className="flex items-center p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-card shadow-sm hover:border-emerald-teal/30 transition-colors group relative">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${t.bg} ${t.color} mr-3.5`}>
                            <Icon className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-bold text-foreground truncate">{t.title}</p>
                            <p className="text-[11px] text-foreground/50 font-medium mt-0.5">{t.category}</p>
                          </div>
                          <div className="flex flex-col items-end pr-2">
                            <span className={`text-[13px] font-bold font-mono whitespace-nowrap ${isIncome ? 'text-emerald-500' : isSaving ? 'text-indigo-600' : 'text-rose-500'}`}>
                              {isIncome ? '+' : isSaving ? '' : '-'}{formatMoney(Math.abs(t.amount))}đ
                            </span>
                            {timeString && <span className="text-[10px] font-medium text-foreground/40 mt-1">{timeString}</span>}
                          </div>
                          <div className="pl-1 border-l border-[var(--border)]/50 py-1 flex items-center">
                            <button className="p-1.5 text-foreground/30 hover:text-foreground transition-colors group">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {/* Submenu for Edit/Delete (visible on hover) */}
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity absolute right-12 top-1/2 -translate-y-1/2 bg-card/95 backdrop-blur-sm p-1.5 rounded-lg shadow-sm border border-[var(--border)] gap-1">
                              <button onClick={() => { setShowDailyDetailModal(false); handleEdit(t); }} className="p-1.5 text-foreground/50 hover:text-emerald-teal hover:bg-emerald-teal/10 rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => { setShowDailyDetailModal(false); handleDelete(t.id); }} className="p-1.5 text-foreground/50 hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Tip */}
                {dailyExpense > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-emerald-teal/5 border border-emerald-teal/10 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-teal/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-emerald-teal" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-foreground mb-1">Mẹo chi tiêu</h4>
                      <p className="text-[11px] text-foreground/60 leading-relaxed font-medium">
                        Bạn đã chi tiêu {formatMoney(dailyExpense)}đ trong ngày hôm nay. Hãy cố gắng tiết kiệm hơn vào những ngày tiếp theo nhé!
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Footer Link */}
                <div className="mt-8 mb-4">
                  <button 
                    onClick={() => {
                      setShowDailyDetailModal(false);
                      setListFilter('all');
                    }}
                    className="w-full py-3 rounded-xl border border-emerald-teal/30 text-emerald-teal font-bold text-[13px] bg-emerald-teal/5 hover:bg-emerald-teal/10 transition-colors"
                  >
                    Xem tất cả giao dịch
                  </button>
                </div>
                
                <p className="text-center text-[10px] text-foreground/40 font-medium pb-4">
                  Dữ liệu được cập nhật đến 23:59 ngày {String(selectedDate).padStart(2, '0')}/{String(month).padStart(2, '0')}/{year}
                </p>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-sm bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">Xác nhận xóa?</h3>
                <p className="text-sm text-foreground/60 mb-8">Hành động này không thể hoàn tác. Giao dịch này sẽ bị xóa vĩnh viễn.</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Quay lại</button>
                  <button onClick={confirmDelete} disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2 hover:from-rose-700 hover:to-rose-600">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận xóa'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM RESET ALL MODAL */}
      <AnimatePresence>
        {showResetAllModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetAllModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-sm bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                  <RotateCcw className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">Reset toàn bộ dữ liệu?</h3>
                <p className="text-sm text-foreground/60 mb-8">Hành động này <strong className="text-rose-500">KHÔNG THỂ</strong> hoàn tác. Toàn bộ lịch sử giao dịch của bạn sẽ bị xóa sạch khỏi hệ thống.</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setShowResetAllModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Quay lại</button>
                  <button onClick={confirmResetAll} disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2 hover:from-rose-700 hover:to-rose-600">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa tất cả'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECURRING TRANSACTIONS MODAL */}
      <AnimatePresence>
        {showRecurringModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRecurringModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-2xl bg-card border-t sm:border border-[var(--border)] rounded-t-[24px] sm:rounded-[var(--radius-xl)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                    <Repeat className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-heading text-foreground">Khoản định kỳ</h3>
                    <p className="text-xs text-foreground/50">Tự động ghi giao dịch theo lịch</p>
                  </div>
                </div>
                <button onClick={() => setShowRecurringModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-foreground/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Add new form */}
                <form onSubmit={handleRecurringSubmit} className="p-5 border-b border-[var(--border)] space-y-4">
                  <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Thêm khoản mới</p>
                  
                  {/* Type toggle */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                    {(['expense', 'income', 'saving'] as const).map(t => (
                      <button key={t} type="button"
                        onClick={() => setRecurringForm(f => ({
                          ...f, type: t,
                          category: t === 'income' ? 'Lương & Thưởng' : t === 'saving' ? (savingAssets[0]?.name || 'Bỏ heo') : 'Chi tiêu khác',
                          asset_id: t === 'saving' ? (savingAssets[0]?.id || '') : ''
                        }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${recurringForm.type === t ? 'bg-white dark:bg-slate-700 shadow-sm ' + (t === 'income' ? 'text-emerald-600' : t === 'saving' ? 'text-indigo-600' : 'text-rose-600') : 'text-foreground/50'}`}
                      >
                        {t === 'expense' ? 'Chi tiêu' : t === 'income' ? 'Thu nhập' : 'Tiết kiệm'}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Title */}
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Tên khoản</label>
                      <input
                        type="text" required
                        value={recurringForm.title}
                        onChange={e => setRecurringForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Ví dụ: Lương tháng, Tiền nhà..."
                        className="w-full text-sm bg-background border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all"
                      />
                    </div>
                    {/* Amount */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Số tiền</label>
                      <input
                        type="text" required
                        value={recurringForm.amount}
                        onChange={e => setRecurringForm(f => ({ ...f, amount: formatInputAmount(e.target.value) }))}
                        placeholder="0"
                        className="w-full text-sm font-semibold bg-background border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all"
                      />
                    </div>
                    {/* Category / Asset */}
                    {recurringForm.type === 'saving' ? (
                      <div>
                        <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Gửi vào mục tiêu / Heo đất</label>
                        {savingAssets.length > 0 ? (
                          <select
                            value={recurringForm.asset_id || savingAssets[0]?.id}
                            onChange={e => {
                              const selected = savingAssets.find(a => a.id === e.target.value);
                              setRecurringForm(f => ({ ...f, asset_id: e.target.value, category: selected?.name || 'Bỏ heo' }))
                            }}
                            className="w-full text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all appearance-none font-bold"
                          >
                            {savingAssets.map(asset => (
                              <option key={asset.id} value={asset.id}>
                                {asset.name} (Số dư: {new Intl.NumberFormat('vi-VN').format(Number(asset.value))}đ)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full text-[13px] bg-rose-50 text-rose-600 border border-rose-200 rounded-xl px-3 py-2.5 font-medium">
                            Chưa có mục tiêu. Hãy tạo trong phần Tài sản trước.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Danh mục</label>
                        <select
                          value={recurringForm.category}
                          onChange={e => setRecurringForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full text-sm bg-background border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all appearance-none"
                        >
                          {(recurringForm.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {/* Frequency */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Chu kỳ</label>
                      <select
                        value={recurringForm.frequency}
                        onChange={e => setRecurringForm(f => ({ ...f, frequency: e.target.value as any }))}
                        className="w-full text-sm bg-background border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all appearance-none"
                      >
                        <option value="daily">Mỗi ngày</option>
                        <option value="weekly">Mỗi tuần</option>
                        <option value="monthly">Mỗi tháng</option>
                      </select>
                    </div>
                    {/* Day picker */}
                    {recurringForm.frequency === 'monthly' && (
                      <div>
                        <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Ngày trong tháng</label>
                        <input type="number" min={1} max={28}
                          value={recurringForm.day_of_month}
                          onChange={e => setRecurringForm(f => ({ ...f, day_of_month: Number(e.target.value) }))}
                          className="w-full text-sm bg-background border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all"
                        />
                      </div>
                    )}
                    {recurringForm.frequency === 'weekly' && (
                      <div>
                        <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Thứ trong tuần</label>
                        <select
                          value={recurringForm.day_of_week}
                          onChange={e => setRecurringForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}
                          className="w-full text-sm bg-background border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all appearance-none"
                        >
                          <option value={0}>Chủ Nhật</option>
                          <option value={1}>Thứ Hai</option>
                          <option value={2}>Thứ Ba</option>
                          <option value={3}>Thứ Tư</option>
                          <option value={4}>Thứ Năm</option>
                          <option value={5}>Thứ Sáu</option>
                          <option value={6}>Thứ Bảy</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={recurringSubmitting}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {recurringSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Thêm khoản định kỳ</>}
                  </button>
                </form>

                {/* List */}
                <div className="p-5">
                  <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">Danh sách ({recurringList.length})</p>
                  {recurringList.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                      <Repeat className="w-8 h-8 mb-2" />
                      <p className="text-sm font-medium">Chưa có khoản định kỳ nào</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recurringList.map(r => {
                        const typeColor = r.type === 'income' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : r.type === 'saving' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
                        const freqLabel = r.frequency === 'daily' ? 'Mỗi ngày' : r.frequency === 'weekly' ? `Mỗi thứ ${r.day_of_week === 0 ? 'CN' : r.day_of_week}` : `Ngày ${r.day_of_month} hàng tháng`;
                        return (
                          <div key={r.id} className={`flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] transition-all ${r.is_active ? 'bg-card' : 'bg-slate-50 dark:bg-slate-800/30 opacity-60'}`}>
                            <div className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${typeColor}`}>
                              {r.type === 'income' ? 'Thu' : r.type === 'saving' ? 'Tiết' : 'Chi'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{r.title}</p>
                              <p className="text-xs text-foreground/50">{freqLabel} · {formatCompact(r.amount)}đ</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Toggle switch */}
                              <button
                                onClick={() => handleRecurringToggle(r.id, r.is_active)}
                                className={`w-9 h-5 relative rounded-full transition-colors flex items-center px-0.5 ${r.is_active ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                              >
                                <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${r.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                              <button onClick={() => handleRecurringDelete(r.id)} className="p-1.5 text-foreground/40 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
