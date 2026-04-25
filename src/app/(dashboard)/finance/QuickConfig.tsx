'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Target, Save, Loader2, CheckCircle2, Activity } from 'lucide-react';
import { updateProfile } from '../settings/actions';
import { useRouter } from 'next/navigation';

interface QuickConfigProps {
  initialBalance: number;
  monthlyBudget: number;
  variant?: 'card' | 'dropdown';
}

export function QuickConfig({ initialBalance, monthlyBudget, variant = 'card' }: QuickConfigProps) {
  const router = useRouter();
  const [balanceStr, setBalanceStr] = useState(initialBalance.toLocaleString('vi-VN'));
  const [budgetStr, setBudgetStr] = useState(monthlyBudget.toLocaleString('vi-VN'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) { setBalanceStr(''); return; }
    setBalanceStr(parseInt(val, 10).toLocaleString('vi-VN'));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) { setBudgetStr(''); return; }
    setBudgetStr(parseInt(val, 10).toLocaleString('vi-VN'));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('initial_balance', balanceStr.replace(/\D/g, ''));
      formData.append('monthly_budget', budgetStr.replace(/\D/g, ''));
      await updateProfile(formData);
      setShowSuccess(true);
      router.refresh();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className={variant === 'card' ? "space-y-4" : "p-4 space-y-4 pt-1"}>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
          <Wallet className="w-3 h-3" /> Số dư ban đầu
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={balanceStr}
            onChange={handleBalanceChange}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30">đ</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> Ngân sách tháng
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={budgetStr}
            onChange={handleBudgetChange}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-bold text-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30">đ</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSubmitting}
        className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
          showSuccess 
            ? 'bg-emerald-500 text-white' 
            : 'bg-foreground text-background hover:opacity-90'
        }`}
      >
        {isSubmitting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : showSuccess ? (
          <>
            <CheckCircle2 className="w-3 h-3" /> Đã lưu
          </>
        ) : (
          <>
            <Save className="w-3 h-3" /> Lưu thiết lập
          </>
        )}
      </button>
    </div>
  );

  if (variant === 'dropdown') return content;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft p-5 xl:p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <Target className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <h3 className="text-base font-heading font-bold text-foreground">
          Cấu hình nhanh
        </h3>
      </div>
      {content}
    </motion.div>
  );
}
