'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, CheckSquare, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Tổng quan', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Tài chính', icon: Wallet, href: '/finance' },
  { label: 'Thói quen', icon: CheckSquare, href: '/habit' },
  { label: 'Báo cáo', icon: BarChart3, href: '/report' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/80 backdrop-blur-xl border-t border-[var(--border)] px-4 py-2 safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors"
            >
              <div 
                className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-emerald-teal/10 text-emerald-teal scale-110" : "text-slate-400"
                )}
              >
                <Icon strokeWidth={isActive ? 2.5 : 1.5} className="w-6 h-6" />
              </div>
              <span 
                className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive ? "text-emerald-teal opacity-100" : "text-slate-400 opacity-60"
                )}
              >
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-1 w-1 h-1 rounded-full bg-emerald-teal"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
