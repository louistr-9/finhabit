import { signup } from './actions';
import { Shield, User, Mail, Lock, Landmark, Wallet } from 'lucide-react';
import Link from 'next/link';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 -left-1/4 w-[50vw] h-[50vw] bg-emerald-teal/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-[50vw] h-[50vw] bg-deep-violet/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-teal to-deep-violet rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-teal/20">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground text-center">Bắt đầu hành trình mới</h1>
          <p className="text-sm text-foreground/60 mt-1 text-center">Tạo tài khoản FinHabit để quản lý tài chính thông minh</p>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-[var(--border)] rounded-2xl p-8 shadow-soft">
          {/* Error Message */}
          {message && (
            <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm font-medium border border-rose-200 dark:border-rose-800/30 text-center">
              {message}
            </div>
          )}

          <form action={signup} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Họ và Tên
              </label>
              <input
                name="fullName"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@email.com"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Mật khẩu
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40 font-mono tracking-widest"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Initial Balance */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" /> Số dư ban đầu
                </label>
                <div className="relative">
                  <input
                    name="initialBalance"
                    type="number"
                    defaultValue="0"
                    className="w-full bg-background/50 border border-[var(--border)] rounded-xl pl-4 pr-10 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30">VND</span>
                </div>
              </div>

              {/* Monthly Budget */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Ngân sách tháng
                </label>
                <div className="relative">
                  <input
                    name="monthlyBudget"
                    type="number"
                    defaultValue="5000000"
                    className="w-full bg-background/50 border border-[var(--border)] rounded-xl pl-4 pr-10 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30">VND</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-teal to-teal-500 hover:from-teal-500 hover:to-emerald-teal text-white py-3.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-teal/20 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2"
            >
              Tạo Tài Khoản
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-sm text-foreground/60">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-emerald-teal font-semibold hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-foreground/40 mt-8">
          Bằng cách đăng ký, bạn đồng ý với Điều khoản của FinHabit.
        </p>
      </div>
    </div>
  );
}
