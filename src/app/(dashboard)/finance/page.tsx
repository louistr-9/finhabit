'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Zap, Wallet, ShoppingBag, ChevronLeft, ChevronRight, Activity, Calendar, Loader2 } from 'lucide-react';
import { getMonthlyTransactions, addTransaction, getBalanceHubData } from './actions';

const EXPENSE_CATEGORIES = ['Thiết yếu', 'Ăn uống', 'Mua sắm', 'Di chuyển', 'Giải trí', 'Sức khỏe', 'Khác'];
const INCOME_CATEGORIES = ['Tiền lương', 'Thu nhập phụ', 'Tiền thưởng', 'Khác'];

const CATEGORY_MAP: Record<string, { icon: any, color: string, bg: string }> = {
  'Thiết yếu': { icon: Zap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  'Ăn uống': { icon: Coffee, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  'Mua sắm': { icon: ShoppingBag, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40' },
  'Di chuyển': { icon: Activity, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  'Giải trí': { icon: Activity, color: 'text-pink-500 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/40' },
  'Sức khỏe': { icon: Activity, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  'Tiền lương': { icon: Wallet, color: 'text-emerald-teal', bg: 'bg-emerald-teal/20 dark:bg-emerald-teal/30' },
  'Thu nhập phụ': { icon: Wallet, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/20 dark:bg-emerald-500/30' },
  'Tiền thưởng': { icon: Zap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600/20 dark:bg-emerald-600/30' },
  'Khác': { icon: Activity, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

export default function FinancePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const TODAY = new Date().getDate();

  const [selectedDate, setSelectedDate] = useState<number>(TODAY);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  
  const [transactionsMap, setTransactionsMap] = useState<Record<number, any[]>>({});
  const [balanceData, setBalanceData] = useState({ balance: 0, monthlyIncome: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const txs = await getMonthlyTransactions(year, month);
      const hub = await getBalanceHubData();
      
      setBalanceData(hub);

      const map: Record<number, any[]> = {};
      txs.forEach((t) => {
        const day = parseInt(t.date.split('-')[2], 10);
        if (!map[day]) map[day] = [];
        const meta = CATEGORY_MAP[t.category] || CATEGORY_MAP['Khác'];
        map[day].push({ ...t, ...meta, amount: t.type === 'expense' ? -t.amount : t.amount });
      });
      setTransactionsMap(map);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [year, month]);

  const handleActionSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    formData.append('date', formattedDate);
    formData.append('type', transactionType);
    
    try {
      await addTransaction(formData);
      await fetchDashboardData();
      (document.getElementById('finance-form') as HTMLFormElement).reset();
    } catch (e) {
      alert("Đã có lỗi xảy ra");
    }
    setIsSubmitting(false);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', '');
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num;
  };

  const selectedTransactions = useMemo(() => {
    return transactionsMap[selectedDate] || [];
  }, [selectedDate, transactionsMap]);

  return (
    <div className="w-full pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-bold text-foreground">Quản lý Tài chính</h2>
        <p className="text-foreground/60 mt-1">Quản trị dòng tiền hiệu quả với góc nhìn tổng quan mới.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6 items-start">
        
        {/* COMPONENT 1: Control Panel (Col-span 1) */}
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-6 w-full">
          {/* Top: Balance Hub Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative w-full rounded-[var(--radius-xl)] p-6 overflow-hidden text-white shadow-soft transition-all duration-300 group flex flex-col min-h-[160px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-teal via-teal-600 to-deep-violet opacity-95"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute inset-0 backdrop-blur-[2px] bg-black/5"></div>
            
            <div className="relative z-10 flex flex-col justify-center h-full">
              <div className="flex justify-between items-start mb-4">
                <span className="font-heading font-bold tracking-widest text-[#FFFFFF]/90 text-[11px] uppercase border border-white/20 bg-white/10 px-2 py-1 rounded shadow-sm">FinHabit</span>
              </div>
              
              <div>
                <p className="text-xs font-medium text-white/80 mb-1">Tổng số dư</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl xl:text-4xl font-heading font-bold tracking-tight text-[#FFFFFF]">
                    {isLoading ? '---' : formatMoney(balanceData.balance)}
                  </span>
                  {!isLoading && <span className="text-xl font-semibold opacity-80 text-[#FFFFFF]">đ</span>}
                </div>
                
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-md">
                  <span className="text-[11px] font-medium text-[#FFFFFF]/80">Thu nhập tháng này:</span>
                  <span className="text-[11px] font-bold text-emerald-300 drop-shadow-sm">
                    {isLoading ? '--' : `+${formatCompact(balanceData.monthlyIncome)}`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom: Transaction Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft p-5"
          >
            <h3 className="text-base font-heading font-semibold text-foreground mb-4">Nhập liệu mới</h3>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
              <button 
                onClick={() => setTransactionType('expense')}
                className={`flex-1 py-1.5 text-xs xl:text-sm font-medium rounded-md transition-all ${
                  transactionType === 'expense' 
                    ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Chi tiêu
              </button>
              <button 
                onClick={() => setTransactionType('income')}
                className={`flex-1 py-1.5 text-xs xl:text-sm font-medium rounded-md transition-all ${
                  transactionType === 'income' 
                    ? 'bg-white dark:bg-slate-700 text-emerald-teal shadow-sm' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Thu nhập
              </button>
            </div>

            <form id="finance-form" action={handleActionSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] xl:text-xs font-semibold text-foreground/70 mb-1.5 block">Nội dung</label>
                <input 
                  type="text" 
                  name="title"
                  required
                  placeholder="Vd: Ăn sáng phở bò..." 
                  className="w-full text-[13px] bg-background border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all placeholder:text-foreground/30" 
                />
              </div>

              <div>
                <label className="text-[11px] xl:text-xs font-semibold text-foreground/70 mb-1.5 block">Danh mục</label>
                <select name="category" required className="w-full text-[13px] bg-background border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all cursor-pointer">
                  {(transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] xl:text-xs font-semibold text-foreground/70 mb-1.5 block">Số tiền</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/50 pointer-events-none">VND</span>
                  <input 
                    type="number" 
                    name="amount"
                    required
                    placeholder="0" 
                    step="10000"
                    className="w-full pl-11 pr-3 py-2 text-[13px] bg-background border border-[var(--border)] rounded-lg outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all font-mono" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-2 bg-gradient-to-r flex justify-center items-center gap-2 from-emerald-teal to-teal-500 hover:from-teal-500 hover:to-emerald-teal text-white py-2.5 rounded-lg text-[13px] xl:text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hoàn tất nhập liệu'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* COMPONENT 2: Interactive Financial Calendar (Col-span 2) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 lg:col-span-2 bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft p-5 xl:p-6 flex flex-col min-h-[400px] h-full"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-heading font-semibold text-foreground">Lịch giao dịch</h3>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-[var(--border)]">
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-foreground/60 hover:text-foreground shadow-sm bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-[110px] text-center">Tháng {month}, {year}</span>
              <button 
                onClick={() => setCurrentDate(new Date(year, month, 1))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-foreground/60 hover:text-foreground shadow-sm bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full flex-1 flex flex-col relative">
            {isLoading && (
               <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/50 backdrop-blur-[2px] rounded-xl">
                 <Loader2 className="w-6 h-6 animate-spin text-emerald-teal" />
               </div>
            )}
            <div className="grid grid-cols-7 mb-3">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-foreground/50">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2 flex-1">
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === TODAY && new Date().getMonth() + 1 === month && new Date().getFullYear() === year;
                const isPast = day < TODAY && new Date().getMonth() + 1 === month && new Date().getFullYear() === year;
                const isSelected = selectedDate === day;
                
                const dailyTransactions = transactionsMap[day] || [];
                const income = dailyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                const expense = dailyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
                
                let baseBg = 'bg-background hover:bg-slate-50 dark:hover:bg-slate-800/50';
                let borderClass = 'border-[var(--border)] border-dashed sm:border-solid hover:border-[var(--border)]';
                
                if (isToday) {
                  baseBg = 'bg-emerald-teal/5 dark:bg-emerald-teal/10';
                  borderClass = 'border-emerald-teal/30';
                } else if (isPast) {
                  baseBg = 'bg-slate-50 dark:bg-slate-900/40 text-foreground/60';
                }

                if (isSelected) {
                  baseBg = 'bg-deep-violet/5 dark:bg-deep-violet/10 shadow-sm';
                  borderClass = 'border-deep-violet/50 ring-1 ring-deep-violet/20';
                }
                
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDate(day)}
                    className={`group relative aspect-square sm:aspect-auto sm:min-h-[75px] xl:min-h-[85px] p-1.5 xl:p-2 flex flex-col justify-between border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${baseBg} ${borderClass}`}
                  >
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-[1.5px] bg-gradient-to-br from-emerald-teal to-deep-violet -z-10">
                      <div className="w-full h-full bg-card rounded-[10px]"></div>
                    </div>
                    
                    <span className={`text-[11px] sm:text-xs xl:text-sm font-medium z-10 ${
                      isSelected ? 'text-deep-violet font-bold' : 
                      isToday ? 'text-emerald-teal font-bold' : ''
                    }`}>
                      {day}
                    </span>
                    
                    <div className="flex flex-col gap-[2px] xl:gap-1 z-10 mt-auto items-start">
                      {income > 0 && (
                         <span className="text-[9px] xl:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight">+{formatCompact(income)}</span>
                      )}
                      {expense > 0 && (
                         <span className="text-[9px] xl:text-[11px] font-semibold text-rose-600 dark:text-rose-400 leading-tight">-{formatCompact(expense)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* COMPONENT 3: Recent Transactions (Col-span 1) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-1 lg:col-span-1 bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft p-5 h-full min-h-[400px] flex flex-col relative"
        >
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border)]">
            <h3 className="text-sm xl:text-base font-heading font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-teal" />
              Giao dịch: {selectedDate}/{month}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
               <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                 <Loader2 className="w-6 h-6 animate-spin text-emerald-teal mb-3" />
                 <span className="text-xs font-medium">Đang tải dữ liệu...</span>
               </div>
            ) : selectedTransactions.length === 0 ? (
               <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                  <div className="w-12 h-12 rounded-full border border-dashed border-foreground/30 flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">Không có giao dịch<br/>nào trong ngày này.</span>
               </div>
            ) : (
              selectedTransactions.map((transaction) => {
                const Icon = transaction.icon;
                const isIncome = transaction.type === 'income';
                return (
                  <div 
                    key={transaction.id}
                    className="group flex flex-col p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border border-[var(--border)] hover:border-emerald-teal/30 shadow-sm"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-9 h-9 xl:w-10 xl:h-10 shrink-0 rounded-full flex items-center justify-center ${transaction.bg} ${transaction.color} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4 h-4 xl:w-5 xl:h-5" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs xl:text-sm text-foreground truncate">{transaction.title}</p>
                        <p className="text-[10px] xl:text-[11px] font-medium text-foreground/50 truncate tracking-wide mt-0.5">{transaction.category}</p>
                      </div>
                    </div>
                    <div className={`mt-2 text-right text-xs xl:text-sm font-bold font-mono ${isIncome ? 'text-emerald-500' : 'text-rose-600'}`}>
                      {isIncome ? '+' : ''}{formatMoney(Math.abs(transaction.amount))} đ
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
