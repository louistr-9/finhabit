'use client';

import React, { useState, useMemo } from 'react';
import type { Asset } from './actions';
import { addAsset, deleteAsset } from './actions';
import { createRecurringTransaction } from '../recurringActions';
import { 
  Plus, Search, MoreHorizontal, Building2, Coins, CircleDollarSign, 
  Briefcase, Wallet, TrendingUp, TrendingDown, X, Trash2, Lightbulb, Bitcoin, RefreshCcw, PiggyBank,
  ChevronRight, ArrowLeft, Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Tooltip as RechartsTooltip } from 'recharts';

interface AssetsClientProps {
  initialAssets: Asset[];
  cashBalance: number;
}

const ASSET_TYPES = {
  real_estate: { label: 'Bất động sản', icon: Building2, color: '#F59E0B', bg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
  cash: { label: 'Tiền mặt', icon: Coins, color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
  gold: { label: 'Vàng', icon: CircleDollarSign, color: '#EAB308', bg: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' },
  stock: { label: 'Chứng khoán', icon: Briefcase, color: '#8B5CF6', bg: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' },
  crypto: { label: 'Tiền ảo', icon: Bitcoin, color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
  saving: { label: 'Tiết kiệm / Bỏ heo', icon: PiggyBank, color: '#6366F1', bg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' },
  other: { label: 'Khác', icon: Wallet, color: '#64748B', bg: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400' },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

// Format input value with thousand separators (1000000 -> 1.000.000)
function formatMoneyInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(num));
}

// Parse formatted money back to raw number string
function parseMoneyInput(formatted: string): string {
  return formatted.replace(/[^0-9]/g, '');
}

// Generate dummy data for mini charts to make it look like the design
function generateDummyChartData() {
  const data = [];
  let current = 100;
  for (let i = 0; i < 20; i++) {
    current = current + (Math.random() - 0.4) * 10;
    data.push({ value: current });
  }
  return data;
}

export default function AssetsClient({ initialAssets, cashBalance }: AssetsClientProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncCashFlow, setSyncCashFlow] = useState(true);
  const [step, setStep] = useState(1);
  const [autoSave, setAutoSave] = useState(false);
  
  const [addForm, setAddForm] = useState({
    name: '',
    type: 'cash' as Asset['type'],
    symbol: '',
    value: '',
    purchase_price: '',
    quantity: '',
    description: '',
    target_amount: '',
    target_date: '',
    autoSaveAmount: '',
    autoSaveFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    autoSaveDay: '1',
  });

  const isSaving = addForm.type === 'saving';

  const isDynamicAsset = addForm.type === 'stock' || addForm.type === 'crypto' || addForm.type === 'gold';
  const isCash = addForm.type === 'cash';

  // Calculate totals
  const totalValue = useMemo(() => assets.reduce((sum, asset) => sum + Number(asset.value), 0), [assets]);
  const totalPurchasePrice = useMemo(() => assets.reduce((sum, asset) => sum + Number(asset.purchase_price), 0), [assets]);
  const totalProfit = totalValue - totalPurchasePrice;
  const totalProfitPercent = totalPurchasePrice > 0 ? (totalProfit / totalPurchasePrice) * 100 : 0;

  // Pie chart data
  const pieData = useMemo(() => {
    const grouped = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + Number(asset.value);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([type, value]) => ({
        name: ASSET_TYPES[type as Asset['type']].label,
        value,
        color: ASSET_TYPES[type as Asset['type']].color,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const displayedAssets = useMemo(() => {
    if (filterType === 'all') return assets;
    return assets.filter(a => a.type === filterType);
  }, [assets, filterType]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name) return;

    setIsSubmitting(true);
    try {
      let finalValue = Number(parseMoneyInput(addForm.value) || 0);

      // Cash: auto-use balance from Dòng tiền (if synced)
      if (isCash && syncCashFlow) {
        finalValue = cashBalance;
      }
      // Fetch live price if it's dynamic (stock, crypto, gold)
      else if (isDynamicAsset) {
        const sym = addForm.type === 'gold' ? 'SJC' : addForm.symbol;
        if (!sym && addForm.type !== 'gold') {
          alert('Vui lòng nhập mã tài sản (Symbol).');
          setIsSubmitting(false);
          return;
        }
        const res = await fetch(`/api/assets/live-price?type=${addForm.type}&symbol=${sym || 'SJC'}`);
        const data = await res.json();
        if (data.price) {
          const qty = Number(addForm.quantity) || 1;
          finalValue = data.price * qty;
        } else {
          alert('Không thể lấy giá trị từ API, vui lòng thử lại.');
          setIsSubmitting(false);
          return;
        }
      }

      const res = await addAsset({
        name: addForm.name,
        type: addForm.type,
        symbol: addForm.type === 'gold' ? 'SJC' : (addForm.symbol || undefined),
        value: finalValue,
        purchase_price: isCash ? 0 : Number(parseMoneyInput(addForm.purchase_price) || '0'),
        quantity: isCash ? undefined : (addForm.quantity ? Number(addForm.quantity) : undefined),
        description: isCash ? (syncCashFlow ? 'sync:cashflow' : 'manual') : addForm.description,
        target_amount: addForm.target_amount ? Number(parseMoneyInput(addForm.target_amount)) : undefined,
        target_date: addForm.target_date || undefined,
      });

      if (res.success && res.asset) {
        // Handle Auto-Save for Saving type
        if (isSaving && autoSave && addForm.autoSaveAmount) {
          try {
            await createRecurringTransaction({
              title: `Gửi tự động: ${addForm.name}`,
              amount: Number(parseMoneyInput(addForm.autoSaveAmount)),
              category: 'Tiết kiệm / Bỏ heo',
              type: 'saving',
              frequency: addForm.autoSaveFrequency,
              day_of_month: addForm.autoSaveFrequency === 'monthly' ? Number(addForm.autoSaveDay) : undefined,
              day_of_week: addForm.autoSaveFrequency === 'weekly' ? Number(addForm.autoSaveDay) : undefined,
              asset_id: res.asset.id,
            });
          } catch (e) {
            console.error('Failed to create recurring transaction', e);
          }
        }

        setAssets(prev => [res.asset!, ...prev]);
        setShowAddModal(false);
        setStep(1);
        setAutoSave(false);
        setAddForm({
          name: '',
          type: 'cash',
          symbol: '',
          value: '',
          purchase_price: '',
          quantity: '',
          description: '',
          target_amount: '',
          target_date: '',
          autoSaveAmount: '',
          autoSaveFrequency: 'monthly',
          autoSaveDay: '1',
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const updatedAssets = await Promise.all(assets.map(async (asset) => {
        // Auto-update synced cash assets with latest balance
        if (asset.type === 'cash' && asset.description === 'sync:cashflow') {
          return { ...asset, value: cashBalance };
        }
        if ((asset.type === 'stock' || asset.type === 'crypto' || asset.type === 'gold') && asset.symbol) {
          try {
            const res = await fetch(`/api/assets/live-price?type=${asset.type}&symbol=${asset.symbol}`);
            const data = await res.json();
            if (data.price) {
              return { ...asset, value: data.price * (asset.quantity || 1) };
            }
          } catch (e) {
            console.error('Failed to fetch price for', asset.symbol);
          }
        }
        return asset;
      }));
      setAssets(updatedAssets);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài sản này? Dữ liệu không thể khôi phục.')) return;
    try {
      const res = await deleteAsset(id);
      if (res.success) {
        setAssets(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Logic for asset allocation suggestion
  const getSuggestion = () => {
    if (assets.length === 0) return null;
    const sorted = [...pieData].sort((a, b) => b.value - a.value);
    const topAsset = sorted[0];
    const topPercentage = (topAsset.value / totalValue) * 100;
    
    if (topPercentage > 50) {
      return `Bạn đang tập trung quá nhiều vào ${topAsset.name} (${topPercentage.toFixed(0)}%). Cân nhắc đa dạng hóa sang các loại hình khác để giảm thiểu rủi ro.`;
    }
    return `Danh mục tài sản của bạn đang được phân bổ khá tốt. Tiếp tục duy trì kỷ luật tích lũy nhé.`;
  };

  return (
    <div className="w-full pb-20 lg:pb-10 animate-fade-in max-w-7xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">Tài sản</h1>
          <p className="text-sm text-foreground/60 mt-1">Quản lý và theo dõi các tài sản bạn đang sở hữu.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={refreshPrices}
            disabled={isRefreshing}
            className="flex items-center justify-center p-2.5 rounded-xl border border-[var(--border)] bg-card text-foreground/60 hover:text-foreground hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Làm mới giá trị"
          >
            <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin text-indigo-600")} />
          </button>
          <button className="flex items-center justify-center p-2.5 rounded-xl border border-[var(--border)] bg-card text-foreground/60 hover:text-foreground hover:bg-slate-50 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm tài sản
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Assets Overview Card */}
        <div className="lg:col-span-1 bg-card border border-[var(--border)] rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-foreground/60 text-sm font-medium flex items-center gap-2">
                Tổng giá trị tài sản
              </p>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold font-heading">{formatCurrency(totalValue)}</h3>
            {totalPurchasePrice > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", totalProfit >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
                  {totalProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {totalProfit >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%
                </div>
                <span className="text-xs text-foreground/50">so với giá gốc ({formatCurrency(totalPurchasePrice)})</span>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex items-center gap-6">
            <div className="w-28 h-28 shrink-0 relative">
              {!isMounted ? (
                <div className="w-full h-full" />
              ) : pieData.length > 0 ? (
                // @ts-ignore
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full rounded-full border-8 border-slate-100 dark:border-slate-800" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-foreground/70 truncate max-w-[80px]">{item.name}</span>
                  </div>
                  <span className="font-semibold">{((item.value / totalValue) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestion Card */}
        {pieData.length > 0 && (
          <div className="bg-indigo-900/40 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden text-indigo-50">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Lightbulb className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-2 text-indigo-200 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold">Gợi ý phân bổ tài sản</h4>
            </div>
            <p className="text-xs text-indigo-100/80 leading-relaxed mb-4 relative z-10">
              {getSuggestion()}
            </p>
            <button className="text-xs font-medium text-indigo-300 hover:text-white transition-colors relative z-10">
              Xem chi tiết
            </button>
          </div>
        )}

      {/* Assets List */}
      <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterType('all')}
              className={cn("px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors", filterType === 'all' ? "bg-indigo-600 text-white" : "bg-card border border-[var(--border)] text-foreground/70 hover:bg-slate-50")}
            >
              Tất cả
            </button>
            {Object.entries(ASSET_TYPES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={cn("px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors", filterType === key ? "bg-indigo-600 text-white" : "bg-card border border-[var(--border)] text-foreground/70 hover:bg-slate-50")}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedAssets.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-card border border-[var(--border)] rounded-2xl border-dashed">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Chưa có tài sản nào</h3>
                <p className="text-sm text-foreground/50 max-w-sm mx-auto mb-4">
                  Thêm tài sản đầu tiên để bắt đầu xây dựng danh mục đầu tư của bạn.
                </p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  + Thêm tài sản
                </button>
              </div>
            ) : (
              displayedAssets.map(asset => {
                const config = ASSET_TYPES[asset.type];
                const Icon = config.icon;
                const profit = asset.value - asset.purchase_price;
                const profitPercent = asset.purchase_price > 0 ? (profit / asset.purchase_price) * 100 : 0;
                const isProfitable = profit >= 0;
                const chartData = generateDummyChartData();

                // Compute unit price for display
                const unitPrice = asset.quantity && asset.quantity > 0 ? asset.value / asset.quantity : asset.value;
                const unitLabel = asset.type === 'gold' ? 'lượng' : asset.type === 'stock' ? 'CP' : asset.type === 'crypto' ? asset.symbol || 'coin' : '';
                const isDynamic = (asset.type === 'stock' || asset.type === 'crypto' || asset.type === 'gold') && asset.symbol;

                return (
                  <div key={asset.id} className="bg-card border border-[var(--border)] rounded-2xl p-5 hover:border-indigo-200 transition-all group flex flex-col">
                    {/* Header: Icon + Name + Symbol + Delete */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground truncate max-w-[130px]">{asset.name}</h4>
                            {asset.symbol && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {asset.symbol}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground/50">{config.label}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(asset.id)}
                        className="p-1.5 hover:bg-rose-100 text-foreground/30 hover:text-rose-600 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa tài sản"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Total Value */}
                    <h3 className="text-xl font-bold font-heading mb-1">{formatCurrency(asset.value)}</h3>

                    {/* Profit: show both % and VND amount */}
                    {asset.purchase_price > 0 && (
                      <div className={cn("flex items-center gap-2 text-xs font-medium mb-3", isProfitable ? "text-emerald-600" : "text-rose-600")}>
                        {isProfitable ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isProfitable ? '+' : ''}{profitPercent.toFixed(2)}%</span>
                        <span className="text-foreground/30">•</span>
                        <span>{isProfitable ? '+' : ''}{formatCurrency(profit)}</span>
                      </div>
                    )}

                    {/* Detail Stats Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-[11px]">
                      {isDynamic && (
                        <>
                          <div className="flex justify-between col-span-2">
                            <span className="text-foreground/50">Giá thị trường</span>
                            <span className="font-semibold text-foreground">{formatCurrency(unitPrice)}/{unitLabel}</span>
                          </div>
                        </>
                      )}
                      {asset.purchase_price > 0 && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-foreground/50">Giá vốn</span>
                          <span className="font-medium text-foreground/80">{formatCurrency(asset.purchase_price)}</span>
                        </div>
                      )}
                      {asset.quantity && asset.quantity > 0 && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-foreground/50">Số lượng</span>
                          <span className="font-medium text-foreground/80">{asset.quantity} {unitLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Mini Line Chart */}
                    <div className="mt-auto h-10 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                      {!isMounted ? (
                        <div className="w-full h-full" />
                      ) : (
                        // @ts-ignore
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={isProfitable ? '#10B981' : '#F43F5E'} 
                            strokeWidth={2} 
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                    <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-between items-center text-[10px] text-foreground/40">
                      <span>Cập nhật: {new Date(asset.updated_at).toLocaleDateString('vi-VN')}</span>
                      {isDynamic && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>}
                      {asset.type === 'cash' && asset.description === 'sync:cashflow' && (
                        <span className="flex items-center gap-1 text-blue-500"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Đồng bộ Dòng tiền</span>
                      )}
                      {asset.type === 'cash' && asset.description === 'manual' && (
                        <span className="flex items-center gap-1 text-amber-500">Thủ công</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
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
                <h3 className="font-semibold">Thêm tài sản mới</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-foreground/50 hover:text-foreground bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
                
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-medium text-foreground/70 mb-1">Loại tài sản <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(ASSET_TYPES).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setAddForm({...addForm, type: key as Asset['type']})}
                              className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] transition-all",
                                addForm.type === key ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300" : "bg-transparent border-[var(--border)] text-foreground/60 hover:bg-slate-50"
                              )}
                            >
                              <Icon className="w-4 h-4 mb-1" />
                              {config.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {!isSaving && (
                      <div className="space-y-4">
                        {/* === CASH MODE: Simplified form with sync toggle === */}
                        {isCash ? (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-foreground/70 mb-1">Tên tài sản <span className="text-red-500">*</span></label>
                              <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder={syncCashFlow ? 'VD: Tiền mặt trong ví, Số dư chính...' : 'VD: Quỹ dự phòng, Tiết kiệm riêng...'} />
                            </div>

                            {/* Sync Toggle */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                              <div className="flex items-center gap-2.5">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", syncCashFlow ? "bg-blue-100 dark:bg-blue-900/40" : "bg-slate-200 dark:bg-slate-700")}>
                                  <RefreshCcw className={cn("w-4 h-4", syncCashFlow ? "text-blue-600 dark:text-blue-400" : "text-slate-500")} />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-foreground">Đồng bộ với Dòng tiền</p>
                                  <p className="text-[10px] text-foreground/50">{syncCashFlow ? 'Tự động cập nhật từ thu/chi' : 'Nhập giá trị thủ công'}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSyncCashFlow(!syncCashFlow)}
                                className={cn(
                                  "relative w-10 h-[22px] rounded-full transition-colors duration-200",
                                  syncCashFlow ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                                )}
                              >
                                <span className={cn(
                                  "absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
                                  syncCashFlow ? "translate-x-[22px]" : "translate-x-0.5"
                                )} />
                              </button>
                            </div>

                            {/* Value display: synced or manual */}
                            {syncCashFlow ? (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-foreground/70 mb-1">Giá trị hiện tại</label>
                                  <input disabled value={formatCurrency(cashBalance)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg text-sm text-foreground/60 cursor-not-allowed" />
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                  <p className="text-xs text-blue-700 dark:text-blue-300">
                                    💡 Giá trị được <strong>tính tự động</strong> từ số dư Dòng tiền (Tổng Thu nhập − Tổng Chi tiêu). Số liệu luôn chính xác theo từng giao dịch.
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-foreground/70 mb-1">Giá trị <span className="text-red-500">*</span></label>
                                  <input required value={addForm.value} onChange={e => setAddForm({...addForm, value: formatMoneyInput(e.target.value)})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="0 đ" />
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-500/20">
                                  <p className="text-xs text-amber-700 dark:text-amber-300">
                                    ⚠️ Giá trị này <strong>không đồng bộ</strong> với Dòng tiền. Bạn cần cập nhật thủ công khi có thay đổi.
                                  </p>
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {/* === DYNAMIC ASSETS (Stock, Crypto, Gold, Other) === */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-foreground/70 mb-1">Tên tài sản <span className="text-red-500">*</span></label>
                                <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="VD: Căn hộ Vinhomes, Vàng SJC..." />
                              </div>
                              {isDynamicAsset ? (
                                <div>
                                  <label className="block text-xs font-medium text-foreground/70 mb-1">Mã (Symbol) {addForm.type !== 'gold' && <span className="text-red-500">*</span>}</label>
                                  <input value={addForm.type === 'gold' ? 'SJC' : addForm.symbol} readOnly={addForm.type === 'gold'} required={addForm.type !== 'gold'} onChange={e => setAddForm({...addForm, symbol: e.target.value.toUpperCase()})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder={addForm.type === 'gold' ? 'SJC (tự động)' : 'VD: HPG, BTC...'} />
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-xs font-medium text-foreground/70 mb-1">Giá trị hiện tại <span className="text-red-500">*</span></label>
                                  <input required value={addForm.value} onChange={e => setAddForm({...addForm, value: formatMoneyInput(e.target.value)})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="0 đ" />
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-xs font-medium text-foreground/70 mb-1">Số lượng {isDynamicAsset && <span className="text-red-500">*</span>}</label>
                                <input required={isDynamicAsset} value={addForm.quantity} onChange={e => setAddForm({...addForm, quantity: e.target.value})} type="number" step="0.0001" className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder={isDynamicAsset ? 'Bắt buộc nhập số lượng' : 'Tùy chọn'} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground/70 mb-1">Giá mua (Vốn / Giá gốc)</label>
                                <input value={addForm.purchase_price} onChange={e => setAddForm({...addForm, purchase_price: formatMoneyInput(e.target.value)})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="0 đ" />
                              </div>
                            </div>

                            {isDynamicAsset && (
                              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                  💡 Giá trị hiện tại sẽ được hệ thống tự động tải từ Internet (Dữ liệu Live) dựa trên Mã Symbol và Số lượng.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                        
                        <div className="pt-2">
                          <button disabled={isSubmitting} type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Đang lưu...' : 'Lưu tài sản'}
                          </button>
                        </div>
                      </div>
                    )}

                    {isSaving && (
                      <div className="pt-2">
                        <button type="button" onClick={() => setStep(2)} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                          Tiếp tục thiết lập Hũ
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && isSaving && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <button type="button" onClick={() => setStep(1)} className="p-1 text-foreground/50 hover:text-foreground bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h4 className="font-semibold text-sm">Bước 2: Thiết lập thông tin</h4>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground/70 mb-1.5">Hình thức tiết kiệm</label>
                      <div className="flex gap-2 mb-4">
                        <button 
                          type="button" 
                          onClick={() => setAddForm({...addForm, symbol: 'FLEX'})} 
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border", 
                            (!addForm.symbol || addForm.symbol === 'FLEX') 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300" 
                              : "bg-transparent border-[var(--border)] text-foreground/60 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <PiggyBank className="w-4 h-4" />
                          <span>Linh hoạt (Bỏ heo)</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setAddForm({...addForm, symbol: 'TERM'})} 
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border", 
                            addForm.symbol === 'TERM' 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300" 
                              : "bg-transparent border-[var(--border)] text-foreground/60 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <Landmark className="w-4 h-4" />
                          <span>Có kỳ hạn (Gửi NH)</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground/70 mb-1">Tên mục tiêu / hũ <span className="text-red-500">*</span></label>
                      <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder={addForm.symbol === 'TERM' ? "VD: Sổ tiết kiệm Techcombank..." : "VD: Quỹ du lịch Phú Quốc..."} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground/70 mb-1">
                          {addForm.symbol === 'TERM' ? 'Số tiền gửi (Gốc)' : 'Số dư ban đầu'}
                        </label>
                        <input value={addForm.value} onChange={e => setAddForm({...addForm, value: formatMoneyInput(e.target.value)})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="0 đ" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground/70 mb-1">
                          {addForm.symbol === 'TERM' ? 'Lãi suất (%/năm) ' : 'Số tiền mục tiêu '}
                          <span className="text-foreground/40 font-normal">(Tuỳ chọn)</span>
                        </label>
                        {addForm.symbol === 'TERM' ? (
                          <input value={addForm.quantity} onChange={e => setAddForm({...addForm, quantity: e.target.value})} type="number" step="0.1" className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="VD: 6.5" />
                        ) : (
                          <input value={addForm.target_amount} onChange={e => setAddForm({...addForm, target_amount: formatMoneyInput(e.target.value)})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="0 đ" />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground/70 mb-1">
                        {addForm.symbol === 'TERM' ? 'Ngày đáo hạn ' : 'Ngày dự kiến hoàn thành '}
                        <span className="text-foreground/40 font-normal">(Tuỳ chọn)</span>
                      </label>
                      <input type="date" value={addForm.target_date} onChange={e => setAddForm({...addForm, target_date: e.target.value})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-foreground/80" />
                    </div>

                    <div className="pt-2">
                      <button type="button" onClick={() => setStep(3)} disabled={!addForm.name} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                        Tiếp tục cấu hình tự động
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && isSaving && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <button type="button" onClick={() => setStep(2)} className="p-1 text-foreground/50 hover:text-foreground bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h4 className="font-semibold text-sm">Bước 3: Cấu hình tự động</h4>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center">
                          <PiggyBank className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Tự động trích tiền vào hũ</p>
                          <p className="text-[11px] text-indigo-700/70 dark:text-indigo-300/70">Hệ thống sẽ tự động trừ vào Dòng tiền</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoSave(!autoSave)}
                        className={cn(
                          "relative w-12 h-6 rounded-full transition-colors duration-200",
                          autoSave ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                        )}
                      >
                        <span className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                          autoSave ? "translate-x-7" : "translate-x-1"
                        )} />
                      </button>
                    </div>

                    {autoSave && (
                      <div className="space-y-4 p-4 border border-[var(--border)] rounded-xl bg-slate-50 dark:bg-slate-800/30">
                        <div>
                          <label className="block text-xs font-medium text-foreground/70 mb-1">Số tiền mỗi kỳ <span className="text-red-500">*</span></label>
                          <input required value={addForm.autoSaveAmount} onChange={e => setAddForm({...addForm, autoSaveAmount: formatMoneyInput(e.target.value)})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="0 đ" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-foreground/70 mb-1">Chu kỳ</label>
                            <select value={addForm.autoSaveFrequency} onChange={e => setAddForm({...addForm, autoSaveFrequency: e.target.value as 'daily'|'weekly'|'monthly'})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                              <option value="daily">Hàng ngày</option>
                              <option value="weekly">Hàng tuần</option>
                              <option value="monthly">Hàng tháng</option>
                            </select>
                          </div>
                          {addForm.autoSaveFrequency !== 'daily' && (
                            <div>
                              <label className="block text-xs font-medium text-foreground/70 mb-1">
                                {addForm.autoSaveFrequency === 'weekly' ? 'Vào thứ' : 'Vào ngày'}
                              </label>
                              <select value={addForm.autoSaveDay} onChange={e => setAddForm({...addForm, autoSaveDay: e.target.value})} className="w-full px-3 py-2.5 bg-background border border-[var(--border)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                                {addForm.autoSaveFrequency === 'weekly' ? (
                                  <>
                                    <option value="1">Thứ 2</option>
                                    <option value="2">Thứ 3</option>
                                    <option value="3">Thứ 4</option>
                                    <option value="4">Thứ 5</option>
                                    <option value="5">Thứ 6</option>
                                    <option value="6">Thứ 7</option>
                                    <option value="0">Chủ nhật</option>
                                  </>
                                ) : (
                                  Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>Ngày {d}</option>
                                  ))
                                )}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button disabled={isSubmitting || (autoSave && !addForm.autoSaveAmount)} type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                        {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất & Lưu'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
