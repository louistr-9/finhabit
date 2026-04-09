'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ArrowUpRight, ArrowDownRight, Coffee, ShoppingBag, Zap, Wallet, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// Thay đổi mảng này thành [] để xem Empty State
const DUMMY_TRANSACTIONS = [
  { id: 1, title: 'Cà phê The Coffee House', amount: -55000, date: 'Hôm nay, 08:30', icon: Coffee, category: 'Ăn uống', color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 2, title: 'Thanh toán tiền điện', amount: -1250000, date: 'Hôm qua, 14:00', icon: Zap, category: 'Hóa đơn', color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 3, title: 'Lương tháng 9', amount: 15200000, date: '12/09/2026', icon: Wallet, category: 'Thu nhập', color: 'text-emerald-teal', bg: 'bg-emerald-teal/20' },
  { id: 4, title: 'Mua sắm áo khoác', amount: -850000, date: '10/09/2026', icon: ShoppingBag, category: 'Mua sắm', color: 'text-purple-600', bg: 'bg-purple-100' },
];

export default function FinancePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<typeof DUMMY_TRANSACTIONS>([]);

  useEffect(() => {
    // Simulator API Call
    const timer = setTimeout(() => {
      setTransactions(DUMMY_TRANSACTIONS);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-bold text-foreground">Quản lý Tài chính</h2>
        <p className="text-foreground/60 mt-1">Theo dõi số dư và các giao dịch gần đây của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* --- Cột TRÁI: Credit Card & Thống kê --- */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Mock Credit Card */}
          <div className="relative w-full h-56 rounded-2xl p-6 overflow-hidden text-white shadow-soft hover:shadow-soft-hover transition-all duration-300">
            {/* Card Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-deep-violet to-emerald-teal opacity-95"></div>
            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-teal/30 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <p className="font-heading font-medium tracking-widest text-white/80">FINHABIT</p>
                <CreditCard className="w-8 h-8 text-white/80" strokeWidth={1.5} />
              </div>
              
              <div>
                <p className="text-xs text-white/70 mb-1">Số dư hiện tại</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-heading font-bold tracking-tight">12.500.000</span>
                  <span className="text-sm">VND</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm text-white/80 font-mono">
                <span>**** **** **** 8888</span>
                <span>12/28</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-[var(--border)] rounded-[var(--radius-lg)] p-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-teal/10 flex items-center justify-center mb-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-teal" strokeWidth={2} />
              </div>
              <p className="text-xs text-foreground/60 mb-1">Thu nhập (Tháng)</p>
              <p className="font-bold text-foreground">15.2M</p>
            </div>
            <div className="bg-card border border-[var(--border)] rounded-[var(--radius-lg)] p-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                <ArrowDownRight className="w-4 h-4 text-red-500" strokeWidth={2} />
              </div>
              <p className="text-xs text-foreground/60 mb-1">Chi tiêu (Tháng)</p>
              <p className="font-bold text-foreground">2.7M</p>
            </div>
          </div>
        </div>

        {/* --- Cột PHẢI: Lịch sử giao dịch --- */}
        <div className="col-span-1 md:col-span-2">
          <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft overflow-hidden h-full">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-heading font-semibold text-foreground">Giao dịch gần đây</h3>
              <button className="text-foreground/50 hover:text-emerald-teal transition-colors">
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                // Skeletons
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                // Empty State
                <div className="py-12">
                  <EmptyState 
                    title="Chưa có giao dịch nào" 
                    description="Hãy thêm giao dịch đầu tiên của bạn để bắt đầu theo dõi dòng tiền nhé!" 
                    icon={<Wallet className="h-10 w-10" strokeWidth={1.5} />}
                  />
                  <div className="flex justify-center">
                    <button className="bg-emerald-teal text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                      Thêm giao dịch
                    </button>
                  </div>
                </div>
              ) : (
                // Lịch sử giao dịch thật
                <motion.div 
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  {transactions.map((transaction) => {
                    const Icon = transaction.icon;
                    const isIncome = transaction.amount > 0;
                    return (
                      <motion.div 
                        key={transaction.id}
                        variants={item}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${transaction.bg} ${transaction.color} shadow-sm group-hover:scale-105 transition-transform`}>
                            <Icon className="w-6 h-6" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{transaction.title}</p>
                            <p className="text-xs text-foreground/60">{transaction.category} • {transaction.date}</p>
                          </div>
                        </div>
                        <div className={`font-semibold font-mono ${isIncome ? 'text-emerald-teal' : 'text-foreground'}`}>
                          {isIncome ? '+' : ''}{formatMoney(transaction.amount)}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
