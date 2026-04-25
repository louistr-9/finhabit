import { Loader2 } from 'lucide-react';

export default function LoadingDashboard() {
  return (
    <div className="w-full pb-12 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>

      {/* 4 Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-5 sm:p-7 h-[140px] flex flex-col justify-between">
             <div className="flex justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="w-16 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
             </div>
             <div className="space-y-2 mt-4">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
             </div>
          </div>
        ))}
      </div>

      {/* Body Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 sm:p-8 h-[400px]">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-8" />
              <div className="w-full h-[250px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
           </div>
        </div>
        <div>
           <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 sm:p-8 h-[400px]">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
              <div className="space-y-3">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-[76px] rounded-[20px] bg-slate-200 dark:bg-slate-800" />
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
