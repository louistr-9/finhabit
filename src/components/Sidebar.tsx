'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wallet, CheckSquare, BarChart3,
  LogOut, Bell, CreditCard, ChevronUp, ChevronDown, User, Palette, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { logout } from '@/app/(auth)/login/actions';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type NavItem = {
  label: string;
  icon: any;
  href?: string;
  subItems?: { label: string; href: string; isBeta?: boolean; isComingSoon?: boolean }[];
};

const navItems: NavItem[] = [
  { label: 'Tổng quan', icon: LayoutDashboard, href: '/dashboard' },
  { 
    label: 'Tài chính', icon: Wallet, 
    subItems: [
      { label: 'Dòng tiền', href: '/finance' },
      { label: 'Tài sản', href: '/finance/assets', isBeta: true },
      { label: 'Nợ & Cho vay', href: '/finance/debts', isBeta: true },
      { label: 'Net Worth', href: '/net-worth', isComingSoon: true },
    ]
  },
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

// Custom dropdown for theme selection
function ThemeDropdown({ theme, setTheme }: { theme: string; setTheme: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = [
    { id: 'light', label: 'Sáng' },
    { id: 'dark', label: 'Tối' },
    { id: 'warm', label: 'Ấm' }
  ];
  
  const current = options.find(o => o.id === theme) || options[0];
  const others = options.filter(o => o.id !== theme);

  return (
    <div className="relative flex items-center">
      <button 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/50 hover:text-foreground transition-colors outline-none cursor-pointer"
      >
        <span>{current.label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 bg-card border border-[var(--border)] rounded-md shadow-lg overflow-hidden z-[60] min-w-[70px]"
          >
            {others.map((opt) => (
              <button
                key={opt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(opt.id);
                  setOpen(false);
                }}
                className="w-full text-right px-3 py-2 text-[11px] font-medium text-foreground/70 hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// SubMenuItem for rendering child links
function SubMenuItem({ 
  item, 
  pathname, 
  onNavClick 
}: { 
  item: NavItem; 
  pathname: string; 
  onNavClick?: () => void 
}) {
  const isFinanceRoute = pathname.startsWith('/finance');
  const [expanded, setExpanded] = useState(isFinanceRoute);
  
  const isActiveGroup = item.subItems?.some(sub => pathname === sub.href) || isFinanceRoute;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
          isActiveGroup && !expanded
            ? 'bg-slate-50 text-emerald-teal shadow-soft'
            : 'text-foreground/70 hover:bg-slate-50 hover:text-emerald-teal'
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon
            strokeWidth={1.5}
            className={cn(
              'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
              isActiveGroup && !expanded ? 'text-emerald-teal' : 'text-foreground/50'
            )}
          />
          <span>{item.label}</span>
        </div>
        <ChevronDown 
          className={cn("w-4 h-4 transition-transform duration-200", expanded && "rotate-180")} 
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 pl-11 pr-2 pb-1">
              {item.subItems?.map(sub => {
                const isSubActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onNavClick}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isSubActive 
                        ? 'text-emerald-teal bg-emerald-teal/10' 
                        : 'text-foreground/60 hover:text-foreground hover:bg-slate-50'
                    )}
                  >
                    <span>{sub.label}</span>
                    {sub.isBeta && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-teal/10 text-emerald-teal border border-emerald-teal/20 font-bold uppercase tracking-wider">
                        Beta
                      </span>
                    )}
                    {sub.isComingSoon && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600 border border-amber-200 font-bold uppercase tracking-wider whitespace-nowrap">
                        Sắp ra mắt
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sidebar content — dùng chung cho cả Desktop và Mobile Drawer
function SidebarContent({
  displayName, avatarUrl, email, pathname, onNavClick
}: SidebarProps & { pathname: string; onNavClick?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark', 'warm');
      if (theme !== 'light') {
        document.documentElement.classList.add(theme);
      }
    }
  }, [theme]);

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
    <>
      {/* Brand */}
      <Link href="/dashboard" className="mb-10 flex items-center px-4 shrink-0 group">
        <div className="relative h-9 w-9 mr-3 transition-transform duration-300 group-hover:scale-110">
          <Image 
            src="/logo.png" 
            alt="FinHabit Logo" 
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-xl font-heading font-bold flex items-center tracking-tight">
          <span className="text-brand-indigo dark:text-blue-400">Fin</span>
          <span className="text-brand-lime">Habit</span>
        </h1>
      </Link>

      {/* Navigation */}
      <nav className="space-y-2 flex-1 overflow-y-auto py-2 pr-2 scrollbar-hide">
        {navItems.map((item) => {
          if (item.subItems) {
             return <SubMenuItem key={item.label} item={item} pathname={pathname} onNavClick={onNavClick} />;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onNavClick}
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
      <div className="mt-auto flex flex-col gap-2">
        {/* User card + popup menu */}
        <div ref={menuRef} className="relative">

          {/* Popup */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-card border border-[var(--border)] rounded-xl shadow-soft-hover overflow-hidden z-50 py-1"
              >
                {/* Tài khoản */}
                <Link
                  href="/settings"
                  onClick={() => { setMenuOpen(false); onNavClick?.(); }}
                  className="group flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-indigo-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">Tài khoản</p>
                    <p className="text-[11px] text-foreground/50 truncate">Quản lý cá nhân</p>
                  </div>
                </Link>

                {/* Thông báo đẩy */}
                <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-teal/10 flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5 text-emerald-teal" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">Thông báo đẩy</p>
                    <p className="text-[11px] text-foreground/50 truncate">Nhắc nhở nhập liệu</p>
                  </div>
                  <MiniSwitch checked={notifications} onChange={() => setNotifications(p => !p)} />
                </div>

                {/* Màu chủ đề */}
                <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)]">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Palette className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">Giao diện</p>
                  </div>
                  <ThemeDropdown theme={theme} setTheme={setTheme} />
                </div>

                {/* Gói đăng ký */}
                <button className="group flex w-full items-center gap-3 px-4 py-3 border-t border-[var(--border)] hover:bg-slate-50 transition-colors text-left">
                  <div className="w-7 h-7 rounded-lg bg-deep-violet/10 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-deep-violet" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">Gói đăng ký</p>
                    <p className="text-[11px] text-foreground/50 truncate">Free Plan</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-teal/10 text-emerald-teal px-2 py-0.5 rounded-full shrink-0">
                    Free
                  </span>
                </button>
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

        <div className="h-px w-full bg-[var(--border)] my-1"></div>

        {/* Đăng xuất */}
        <form action={logout}>
          <button
            type="submit"
            className="group flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-150"
          >
            <LogOut
              strokeWidth={1.5}
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Đăng xuất
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar({ displayName, avatarUrl, email }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile: Hamburger trigger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 right-4 z-50 lg:hidden h-10 w-10 rounded-xl bg-card border border-[var(--border)] shadow-soft flex items-center justify-center hover:bg-foreground/5 transition-colors"
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5 text-foreground/70" />
      </button>

      {/* Mobile: Drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-[80] h-screen w-72 border-r border-[var(--border)] bg-[var(--background)] px-4 py-8 flex flex-col lg:hidden shadow-2xl rounded-r-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-lg hover:bg-foreground/5 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-foreground/50" />
              </button>

              <SidebarContent
                displayName={displayName}
                avatarUrl={avatarUrl}
                email={email}
                pathname={pathname}
                onNavClick={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: Fixed sidebar (unchanged) */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[var(--border)] bg-[var(--background)] px-4 py-8 hidden lg:flex flex-col">
        <SidebarContent
          displayName={displayName}
          avatarUrl={avatarUrl}
          email={email}
          pathname={pathname}
        />
      </aside>
    </>
  );
}
