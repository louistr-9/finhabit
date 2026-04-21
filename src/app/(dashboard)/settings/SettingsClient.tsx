'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Image as ImageIcon, Wallet, ShieldCheck, Loader2, Eye, EyeOff, Target } from 'lucide-react';
import { updateProfile } from './actions';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SettingsClientProps {
  initialData: {
    fullName: string;
    avatarUrl: string;
    initialBalance: number;
    monthlyBudget: number;
    email: string;
  };
}

export function SettingsClient({ initialData }: SettingsClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVisible, setIsVisible] = useLocalStorage('isBalanceVisible', false);

  const [formData, setFormData] = useState({
    fullName: initialData.fullName,
    avatarUrl: initialData.avatarUrl,
    initialBalanceStr: initialData.initialBalance ? initialData.initialBalance.toLocaleString('vi-VN') : '',
    monthlyBudgetStr: initialData.monthlyBudget ? initialData.monthlyBudget.toLocaleString('vi-VN') : '',
  });

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digits
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setFormData({ ...formData, initialBalanceStr: '' });
      return;
    }
    const num = parseInt(rawValue, 10);
    setFormData({ ...formData, initialBalanceStr: num.toLocaleString('vi-VN') });
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setFormData({ ...formData, monthlyBudgetStr: '' });
      return;
    }
    const num = parseInt(rawValue, 10);
    setFormData({ ...formData, monthlyBudgetStr: num.toLocaleString('vi-VN') });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('full_name', formData.fullName);
      data.append('avatar_url', formData.avatarUrl);
      data.append('initial_balance', formData.initialBalanceStr);
      data.append('monthly_budget', formData.monthlyBudgetStr);

      await updateProfile(data);
      setSuccessMsg('Đã lưu thay đổi thành công!');
      
      // Force Next.js to re-fetch server components so dashboard reflects new budget
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">Tài khoản</h1>
        <p className="text-foreground/60 mt-2">Quản lý thông tin cá nhân và thiết lập số dư ban đầu.</p>
      </div>

      {/* Balance Display Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-gradient-to-br from-emerald-teal to-deep-violet rounded-2xl p-6 shadow-soft text-white flex items-center justify-between"
      >
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Số dư ban đầu</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-heading font-bold tracking-tight min-w-[120px]">
              {isVisible ? `${formData.initialBalanceStr || '0'} đ` : '****** đ'}
            </span>
            <button 
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title={isVisible ? "Ẩn số dư" : "Hiện số dư"}
            >
              {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="hidden sm:block opacity-20">
          <Wallet className="w-16 h-16" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-[var(--border)] rounded-2xl p-6 shadow-soft"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (Readonly) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Email đăng nhập</p>
              <p className="text-sm text-foreground/60">{initialData.email}</p>
            </div>
            <div className="sm:ml-auto">
              <span className="text-xs font-medium px-2.5 py-1 bg-emerald-teal/10 text-emerald-teal rounded-full">
                Đã xác thực
              </span>
            </div>
          </div>

          <div className="h-px bg-[var(--border)] w-full"></div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-teal" /> Biệt danh
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Nhập biệt danh của bạn"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-background px-4 py-3 text-sm focus:border-emerald-teal focus:outline-none focus:ring-1 focus:ring-emerald-teal transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="avatarUrl" className="text-sm font-medium text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-teal" /> Đường dẫn Avatar (URL)
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    id="avatarUrl"
                    name="avatarUrl"
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-background px-4 py-3 text-sm focus:border-emerald-teal focus:outline-none focus:ring-1 focus:ring-emerald-teal transition-all"
                  />
                  <p className="text-xs text-foreground/50 mt-1">
                    Dán link ảnh đại diện của bạn vào đây. Để trống sẽ dùng ảnh mặc định.
                  </p>
                </div>
                {/* Avatar Preview */}
                <div className="w-16 h-16 rounded-full border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center bg-slate-50 relative">
                  {formData.avatarUrl ? (
                    <Image src={formData.avatarUrl} alt="Preview" fill className="object-cover" unoptimized />
                  ) : (
                    <User className="w-6 h-6 text-slate-300" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="initialBalance" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-deep-violet" /> Số dư ban đầu
              </label>
              <div className="relative">
                <input
                  id="initialBalance"
                  name="initialBalance"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formData.initialBalanceStr}
                  onChange={handleBalanceChange}
                  className="w-full rounded-xl border border-[var(--border)] bg-background pl-4 pr-12 py-3 text-sm focus:border-deep-violet focus:outline-none focus:ring-1 focus:ring-deep-violet transition-all font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground/50">
                  đ
                </span>
              </div>
              <p className="text-xs text-foreground/50 mt-1">
                Số dư hiện có trước khi dùng FinHabit. Số dư khả dụng = Số dư ban đầu + (Thu - Chi - Tiết kiệm).
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="monthlyBudget" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" /> Ngân sách tháng
              </label>
              <div className="relative">
                <input
                  id="monthlyBudget"
                  name="monthlyBudget"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ví dụ: 5.000.000"
                  value={formData.monthlyBudgetStr}
                  onChange={handleBudgetChange}
                  className="w-full rounded-xl border border-[var(--border)] bg-background pl-4 pr-12 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold text-orange-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground/50">
                  đ
                </span>
              </div>
              <p className="text-xs text-foreground/50 mt-1">
                Mức chi tiêu tối đa dự kiến trong tháng. Dùng để cảnh báo sức khỏe tài chính trên Dashboard.
              </p>
            </div>
            
            <div className="pt-6 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    {isVisible ? <Eye className="w-4 h-4 text-emerald-teal" /> : <EyeOff className="w-4 h-4 text-emerald-teal" />}
                    Ẩn số dư trên toàn ứng dụng
                  </label>
                  <p className="text-xs text-foreground/50 mt-1">
                    Khi bật, các con số quan trọng sẽ hiển thị dưới dạng *** để bảo vệ quyền riêng tư.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!isVisible}
                  onClick={() => setIsVisible(!isVisible)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-teal focus:ring-offset-2 ${!isVisible ? 'bg-emerald-teal' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!isVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-100">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-teal rounded-lg text-sm border border-emerald-100">
              {successMsg}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-[var(--border)] flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-teal to-deep-violet px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
