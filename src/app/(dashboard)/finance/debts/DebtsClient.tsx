'use client';

import React, { useState, useMemo } from 'react';
import type { Debt } from './actions';
import { addDebt, updateDebtPayment, deleteDebt } from './actions';
import { 
  Plus, Search, MoreHorizontal, User, Calendar, FileText, 
  Wallet, TrendingUp, Handshake, CheckCircle2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface DebtsClientProps {
  initialDebts: Debt[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function calculateProgress(paid: number, total: number) {
  if (total === 0) return 0;
  return Math.min(Math.round((paid / total) * 100), 100);
}

export default function DebtsClient({ initialDebts }: DebtsClientProps) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [activeTab, setActiveTab] = useState<'lent' | 'borrowed'>('lent');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<Debt | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    type: 'lent' as 'lent' | 'borrowed',
    contact_name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    group_name: 'Bạn bè',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Derived state
  const lentDebts = useMemo(() => debts.filter(d => d.type === 'lent'), [debts]);
  const borrowedDebts = useMemo(() => debts.filter(d => d.type === 'borrowed'), [debts]);

  const totalLent = lentDebts.filter(d => d.status === 'active').reduce((acc, d) => acc + (d.amount - d.paid_amount), 0);
  const totalBorrowed = borrowedDebts.filter(d => d.status === 'active').reduce((acc, d) => acc + (d.amount - d.paid_amount), 0);
  const netPosition = totalLent - totalBorrowed;

  const activeDebtsLentCount = lentDebts.filter(d => d.status === 'active').length;
  const activeDebtsBorrowedCount = borrowedDebts.filter(d => d.status === 'active').length;

  const displayedList = useMemo(() => {
    let list = activeTab === 'lent' ? lentDebts : borrowedDebts;
    
    if (statusFilter !== 'all') {
      list = list.filter(d => d.status === statusFilter);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(d => d.contact_name.toLowerCase().includes(term) || d.notes?.toLowerCase().includes(term));
    }
    
    return list;
  }, [activeTab, lentDebts, borrowedDebts, statusFilter, searchTerm]);

  // Handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.contact_name || !addForm.amount) return;

    setIsSubmitting(true);
    try {
      const res = await addDebt({
        ...addForm,
        amount: Number(addForm.amount.replace(/[^0-9]/g, '')),
        due_date: addForm.due_date || null,
      });

      if (res.success && res.debt) {
        setDebts(prev => [res.debt, ...prev]);
        setShowAddModal(false);
        setAddForm({
          type: 'lent',
          contact_name: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          due_date: '',
          notes: '',
          group_name: 'Bạn bè',
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal || !paymentAmount) return;

    setIsSubmitting(true);
    try {
      const amt = Number(paymentAmount.replace(/[^0-9]/g, ''));
      const res = await updateDebtPayment(showPaymentModal.id, amt, paymentDate);
      
      if (res.success) {
        setDebts(prev => prev.map(d => {
          if (d.id === showPaymentModal.id) {
            const newPaid = Number(d.paid_amount) + amt;
            return {
              ...d,
              paid_amount: newPaid,
              status: newPaid >= Number(d.amount) ? 'completed' : 'active'
            };
          }
          return d;
        }));
        setShowPaymentModal(null);
        setPaymentAmount('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-20 lg:pb-10 animate-fade-in max-w-7xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">Nợ & Cho vay</h1>
          <p className="text-sm text-foreground/60 mt-1">Quản lý các khoản nợ phải trả và khoản tiền bạn đã cho người khác vay.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-card text-sm font-medium hover:bg-slate-50 transition-colors">
            <FileText className="w-4 h-4" />
            Lịch sử tất cả
          </button>
          <button 
            onClick={() => { setAddForm(prev => ({...prev, type: activeTab})); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lent */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Handshake className="w-20 h-20" />
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Bạn đã cho vay</p>
          <h3 className="text-3xl font-bold font-heading">{formatCurrency(totalLent)}</h3>
          <p className="text-white/80 text-xs mt-2">{activeDebtsLentCount} khoản vay đang hoạt động</p>
        </div>

        {/* Borrowed */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet className="w-20 h-20" />
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Bạn đang nợ</p>
          <h3 className="text-3xl font-bold font-heading">{formatCurrency(totalBorrowed)}</h3>
          <p className="text-white/80 text-xs mt-2">{activeDebtsBorrowedCount} khoản nợ đang hoạt động</p>
        </div>

        {/* Net Position */}
        <div className="bg-card border border-[var(--border)] rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className={cn("w-20 h-20", netPosition >= 0 ? 'text-emerald-500' : 'text-rose-500')} />
          </div>
          <p className="text-foreground/60 text-sm font-medium mb-1">Vị thế ròng</p>
          <h3 className={cn("text-3xl font-bold font-heading", netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {netPosition > 0 ? '+' : ''}{formatCurrency(netPosition)}
          </h3>
          <p className="text-foreground/60 text-xs mt-2">Bạn đang ở vị thế {netPosition >= 0 ? 'có lợi' : 'bất lợi'}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm">
        {/* Tabs & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('lent')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'lent' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-foreground/60 hover:text-foreground"
              )}
            >
              Cho vay ({lentDebts.length})
            </button>
            <button
              onClick={() => setActiveTab('borrowed')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'borrowed' ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" : "text-foreground/60 hover:text-foreground"
              )}
            >
              Tôi nợ ({borrowedDebts.length})
            </button>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input 
                type="text" 
                placeholder={activeTab === 'lent' ? "Tìm kiếm người vay..." : "Tìm kiếm chủ nợ..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="completed">Đã hoàn tất</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {displayedList.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-10 h-10 text-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Chưa có khoản nào</h3>
              <p className="text-sm text-foreground/50 max-w-sm mx-auto mb-6">
                Bạn chưa có khoản {activeTab === 'lent' ? 'cho vay' : 'nợ'} nào. Nhấn Thêm mới để bắt đầu ghi chú.
              </p>
              <button 
                onClick={() => { setAddForm(prev => ({...prev, type: activeTab})); setShowAddModal(true); }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
              >
                + Thêm khoản đầu tiên
              </button>
            </div>
          ) : (
            displayedList.map(debt => {
              const progress = calculateProgress(debt.paid_amount, debt.amount);
              const remaining = debt.amount - debt.paid_amount;
              const isCompleted = debt.status === 'completed';

              return (
                <div key={debt.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-[var(--border)] hover:border-indigo-200 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
                  {/* Left info */}
                  <div className="flex items-center gap-3 md:w-1/4 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{debt.contact_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-foreground/60 truncate max-w-[120px]">{debt.notes || 'Không có ghi chú'}</span>
                        {debt.group_name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium whitespace-nowrap">
                            {debt.group_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Stats */}
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-[11px] text-foreground/50 uppercase tracking-wider mb-1">Tổng {activeTab === 'lent' ? 'cho vay' : 'nợ'}</p>
                      <p className="font-semibold text-foreground">{formatCurrency(debt.amount)}</p>
                    </div>
                    
                    <div>
                      <p className="text-[11px] text-foreground/50 uppercase tracking-wider mb-1">Đã trả</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(debt.paid_amount)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-foreground/50 uppercase tracking-wider mb-1">Còn lại</p>
                      <p className={cn("font-semibold", isCompleted ? "text-emerald-600" : "text-rose-600")}>
                        {formatCurrency(remaining)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-foreground/50 uppercase tracking-wider mb-1">Hạn trả</p>
                      {debt.due_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-foreground/50" />
                          <p className="text-sm font-medium">{new Date(debt.due_date).toLocaleDateString('vi-VN')}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/50">—</p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar (Mobile absolute, Desktop inline) */}
                  <div className="md:w-32 flex flex-col justify-center shrink-0">
                     <div className="flex justify-between items-end mb-1 text-[11px] font-medium text-foreground/60">
                       <span>Tiến độ</span>
                       <span>{progress}%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         className={cn("h-full rounded-full transition-all duration-1000", isCompleted ? "bg-emerald-500" : "bg-indigo-500")}
                       />
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {!isCompleted ? (
                      <button 
                        onClick={() => setShowPaymentModal(debt)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Ghi nhận
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg text-xs font-medium border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã thanh toán
                      </div>
                    )}
                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-foreground/40 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Debt Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold">Thêm khoản {addForm.type === 'lent' ? 'cho vay' : 'nợ'} mới</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-foreground/50 hover:text-foreground bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2">
                  <button type="button" onClick={() => setAddForm(prev => ({...prev, type: 'lent'}))} className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", addForm.type === 'lent' ? "bg-white dark:bg-slate-700 shadow text-indigo-600" : "text-foreground/60")}>Cho vay</button>
                  <button type="button" onClick={() => setAddForm(prev => ({...prev, type: 'borrowed'}))} className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", addForm.type === 'borrowed' ? "bg-white dark:bg-slate-700 shadow text-rose-600" : "text-foreground/60")}>Tôi nợ</button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Người {addForm.type === 'lent' ? 'vay' : 'cho vay'} <span className="text-red-500">*</span></label>
                  <input required value={addForm.contact_name} onChange={e => setAddForm({...addForm, contact_name: e.target.value})} className="w-full px-3 py-2 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Ví dụ: Nam" />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Số tiền <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input required value={addForm.amount} onChange={e => setAddForm({...addForm, amount: e.target.value})} type="number" className="w-full px-3 py-2 pr-8 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="2000000" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 font-medium">đ</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground/70 mb-1">Ngày <span className="text-red-500">*</span></label>
                    <input required type="date" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} className="w-full px-3 py-2 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/70 mb-1">Hạn trả <span className="text-foreground/40 font-normal">(không bắt buộc)</span></label>
                    <input type="date" value={addForm.due_date} onChange={e => setAddForm({...addForm, due_date: e.target.value})} className="w-full px-3 py-2 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Nhóm</label>
                  <div className="flex flex-wrap gap-2">
                    {['Gia đình', 'Bạn bè', 'Đồng nghiệp', 'Khác'].map(group => (
                      <button key={group} type="button" onClick={() => setAddForm({...addForm, group_name: group})} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors", addForm.group_name === group ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300" : "bg-transparent border-[var(--border)] text-foreground/60 hover:bg-slate-50")}>
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Ghi chú</label>
                  <input value={addForm.notes} onChange={e => setAddForm({...addForm, notes: e.target.value})} className="w-full px-3 py-2 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Mục đích..." />
                </div>

                <div className="pt-2">
                  <button disabled={isSubmitting} type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Đang lưu...' : 'Lưu khoản ' + (addForm.type === 'lent' ? 'cho vay' : 'nợ')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold">Ghi nhận thanh toán</h3>
                <button onClick={() => setShowPaymentModal(null)} className="p-1 text-foreground/50 hover:text-foreground bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-[var(--border)]">
                   <p className="text-xs text-foreground/60 mb-1">{showPaymentModal.type === 'lent' ? 'Nhận tiền từ' : 'Trả tiền cho'}</p>
                   <p className="font-semibold text-foreground">{showPaymentModal.contact_name}</p>
                   <div className="flex justify-between mt-2 pt-2 border-t border-[var(--border)]">
                      <span className="text-xs text-foreground/60">Còn lại cần thanh toán:</span>
                      <span className="text-xs font-semibold text-rose-500">{formatCurrency(showPaymentModal.amount - showPaymentModal.paid_amount)}</span>
                   </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Số tiền thanh toán <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input required autoFocus value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" className="w-full px-3 py-2 pr-8 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Nhập số tiền..." />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 font-medium">đ</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                     <button type="button" onClick={() => setPaymentAmount((showPaymentModal.amount - showPaymentModal.paid_amount).toString())} className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-foreground/70 hover:bg-slate-200 transition-colors">Thanh toán toàn bộ</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Ngày thanh toán <span className="text-red-500">*</span></label>
                  <input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>

                <div className="pt-2">
                  <button disabled={isSubmitting || !paymentAmount} type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Đang lưu...' : 'Xác nhận thanh toán'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
