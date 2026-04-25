import React from 'react';
import { Rocket, LineChart, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Net Worth - Sắp ra mắt | FinHabit',
  description: 'Tính năng quản lý Giá trị tài sản ròng đang được phát triển.',
};

export default function NetWorthPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-teal/20 blur-3xl rounded-full w-32 h-32 mx-auto"></div>
        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[var(--border)] shadow-xl inline-flex items-center justify-center">
          <LineChart className="w-16 h-16 text-emerald-teal" strokeWidth={1.5} />
          <div className="absolute -top-3 -right-3 bg-amber-400 text-amber-950 p-2 rounded-full shadow-lg rotate-12">
            <Rocket className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground mb-4">
        Net Worth <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-teal to-indigo-500">Sắp ra mắt!</span>
      </h1>
      
      <p className="text-base text-foreground/60 max-w-lg mb-8 leading-relaxed">
        Chúng tôi đang xây dựng hệ thống theo dõi <strong>Giá trị tài sản ròng (Net Worth)</strong> mạnh mẽ nhất. 
        Tính năng này sẽ tự động tổng hợp Dòng tiền, Tài sản và Nợ của bạn để mang lại bức tranh tài chính toàn cảnh và chính xác tuyệt đối.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/70">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Đang trong giai đoạn phát triển</span>
        </div>
      </div>
    </div>
  );
}
