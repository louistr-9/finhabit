import { login, signup } from './actions';
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
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-teal to-deep-violet rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-teal/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Welcome to FinHabit</h1>
          <p className="text-sm text-foreground/60 mt-1">Đăng nhập để vào không gian cá nhân</p>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 shadow-soft">
          <form className="flex flex-col gap-4">
            {message && (
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm font-medium border border-rose-200 dark:border-rose-800/30 text-center">
                {message}
              </div>
            )}
            
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

            <div className="flex flex-col gap-3 mt-4">
              <button
                formAction={login}
                className="w-full bg-gradient-to-r from-emerald-teal to-teal-500 hover:from-teal-500 hover:to-emerald-teal text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-emerald-teal/20 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                Đăng Nhập
              </button>
              
              <div className="relative flex items-center justify-center my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]"></div>
                </div>
                <span className="relative bg-card px-3 text-xs text-foreground/40 font-medium">HOẶC</span>
              </div>

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
          FinHabit © 2026. Secure & Private.
        </p>
      </div>
    </div>
  );
}
