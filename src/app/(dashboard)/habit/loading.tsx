import React from 'react';

export default function LoadingHabit() {
  return (
    <div className="w-full pb-10 animate-pulse">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="flex items-center gap-2">
          <div className="hidden sm:block h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Tabs and Date Picker */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex items-center gap-2">
          {[1, 2, 3].map(i => (
             <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
          ))}
        </div>
        <div className="lg:col-span-1 hidden lg:flex lg:justify-end">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Habit List */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-card border border-[var(--border)] rounded-[24px] p-5 h-[90px] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                   <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                   <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        {/* Right Sidebar (Stats & Heatmap) */}
        <div className="space-y-6 hidden lg:block">
          <div className="bg-card border border-[var(--border)] rounded-[24px] p-6 h-[250px]">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
            <div className="flex justify-between items-end h-[100px] mb-4">
               {[1,2,3,4,5,6,7].map(i => (
                  <div key={i} className="w-8 bg-slate-200 dark:bg-slate-800 rounded-t-md" style={{ height: `${Math.random() * 80 + 20}%` }} />
               ))}
            </div>
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl mt-6" />
          </div>

          <div className="bg-card border border-[var(--border)] rounded-[24px] p-6 h-[300px]">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
            <div className="grid grid-cols-7 gap-1">
               {Array(35).fill(0).map((_, i) => (
                 <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-sm" />
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
