import { login, signup, signInWithGoogle } from './actions';
import { Shield } from 'lucide-react';

export default async function LoginPage({
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

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-teal to-deep-violet rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-teal/20">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Chào mừng trở lại</h1>
          <p className="text-sm text-foreground/60 mt-1">Đăng nhập để vào không gian cá nhân của bạn</p>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 shadow-soft">
          {/* Error Message */}
          {message && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm font-medium border border-rose-200 dark:border-rose-800/30 text-center">
              {message}
            </div>
          )}

          {/* Google Sign-In Button */}
          <form>
            <button
              formAction={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-[var(--border)] dark:border-slate-600 text-foreground py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] group"
            >
              {/* Google Icon SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Đăng nhập với Google</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <span className="relative bg-card px-3 text-xs text-foreground/40 font-medium">HOẶC DÙNG EMAIL</span>
          </div>

          {/* Email/Password Form */}
          <form className="flex flex-col gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 ml-1 block">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@email.com"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 ml-1 block">Mật khẩu</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40 font-mono tracking-widest"
              />
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                formAction={login}
                className="w-full bg-gradient-to-r from-emerald-teal to-teal-500 hover:from-teal-500 hover:to-emerald-teal text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-emerald-teal/20 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                Đăng Nhập
              </button>

              <button
                formAction={signup}
                className="w-full bg-background border-2 border-[var(--border)] hover:border-emerald-teal/50 hover:bg-emerald-teal/5 text-foreground py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Đăng Ký Tài Khoản Mới
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-foreground/40 mt-8">
          FinHabit © 2026. Secure &amp; Private.
        </p>
      </div>
    </div>
  );
}
