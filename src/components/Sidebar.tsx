'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wallet, CheckSquare, BarChart3,
  LogOut, ChevronUp, Bell, CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlobalQuickAction } from './GlobalQuickAction';
import { logout } from '@/app/(auth)/login/actions';

const navItems = [
  { label: 'Tổng quan', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Tài chính', icon: Wallet, href: '/finance' },
  { label: 'Thói quen', icon: CheckSquare, href: '/habit' },
  { label: 'Báo cáo', icon: BarChart3, href: '/report' },
];

interface SidebarProps {
  displayName: string;
  avatarUrl: string | null;
  email: string;
}

// Mini toggle switch for sidebar popup
function MiniSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 shrink-0 ${
        checked ? 'bg-emerald-teal' : 'bg-slate-300'
      }`}
    >
      <motion.div
        className="w-4 h-4 bg-white rounded-full shadow-sm"
        layout
        initial={false}
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </div>
  );
}

export function Sidebar({ displayName, avatarUrl, email }: SidebarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[var(--border)] bg-[var(--background)] px-4 py-8 hidden lg:flex flex-col">
      {/* Brand */}
      <div className="mb-10 flex items-center px-4 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-emerald-teal flex items-center justify-center mr-3">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <h1 className="text-xl font-heading font-bold text-foreground">FinHabit</h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-slate-50 text-emerald-teal shadow-soft'
                  : 'text-foreground/70 hover:bg-slate-50 hover:text-emerald-teal'
              )}
            >
              <Icon
                strokeWidth={1.5}
                className={cn(
                  'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-emerald-teal' : 'text-foreground/50'
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto flex flex-col gap-3">
        <GlobalQuickAction />

        {/* User card + popup menu */}
        <div ref={menuRef} className="relative">

          {/* Popup — hiện phía trên user card */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-card border border-[var(--border)] rounded-xl shadow-soft-hover overflow-hidden z-50"
              >
                {/* Thông báo đẩy */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-teal/10 flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5 text-emerald-teal" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Thông báo đẩy</p>
                    <p className="text-[10px] text-foreground/50 truncate">Nhắc nhở nhập liệu</p>
                  </div>
                  <MiniSwitch checked={notifications} onChange={() => setNotifications(p => !p)} />
                </div>

                {/* Gói đăng ký */}
                <button className="group flex w-full items-center gap-3 px-4 py-3 border-b border-[var(--border)] hover:bg-slate-50 transition-colors text-left">
                  <div className="w-7 h-7 rounded-lg bg-deep-violet/10 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-deep-violet" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Gói đăng ký</p>
                    <p className="text-[10px] text-foreground/50 truncate">Free Plan</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-teal/10 text-emerald-teal px-2 py-0.5 rounded-full shrink-0">
                    Free
                  </span>
                </button>

                {/* Đăng xuất */}
                <form action={logout}>
                  <button
                    type="submit"
                    className="group flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors duration-150"
                  >
                    <LogOut
                      strokeWidth={1.5}
                      className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                    />
                    Đăng xuất
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User card — click để toggle */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl border p-3 shadow-soft transition-all duration-200 bg-card text-left',
              menuOpen
                ? 'border-emerald-teal/40 bg-emerald-teal/5'
                : 'border-[var(--border)] hover:border-emerald-teal/30 hover:bg-emerald-teal/5'
            )}
          >
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 relative">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-teal to-deep-violet flex items-center justify-center text-white font-bold font-heading text-sm">
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs text-foreground/50">{email}</p>
            </div>

            {/* Chevron */}
            <motion.div
              animate={{ rotate: menuOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <ChevronUp className="h-4 w-4 text-foreground/40" />
            </motion.div>
          </button>
        </div>
      </div>
    </aside>
  );
}
