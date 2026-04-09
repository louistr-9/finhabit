'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, CheckSquare, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalQuickAction } from './GlobalQuickAction';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Finance', icon: Wallet, href: '/finance' },
  { label: 'Habit', icon: CheckSquare, href: '/habit' },
  { label: 'Báo cáo', icon: BarChart3, href: '/report' },
  { label: 'Cài đặt', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[var(--border)] bg-[var(--background)] px-4 py-8 flex flex-col">
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
                "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-slate-50 text-emerald-teal shadow-soft" 
                  : "text-foreground/70 hover:bg-slate-50 hover:text-emerald-teal"
              )}
            >
              <Icon 
                strokeWidth={1.5}
                className={cn(
                  "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-emerald-teal" : "text-foreground/50"
                )} 
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Summary - Bottom */}
      <div className="mt-auto flex flex-col gap-4">
        <GlobalQuickAction />
        
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 shadow-soft hover:shadow-soft-hover transition-all cursor-pointer bg-card">
          <div className="h-10 w-10 rounded-full bg-deep-violet/10 text-deep-violet flex items-center justify-center font-bold font-heading shrink-0">
            US
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold text-foreground">User</p>
            <p className="truncate text-xs text-foreground/60">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
