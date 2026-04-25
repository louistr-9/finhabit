import React from 'react';

export default function LoadingFinance() {
  return (
    <div className="w-full pb-10 animate-pulse">
      {/* Mobile Tabs */}
      <div className="flex lg:hidden bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[24px] mb-6 w-full h-11">
      </div>

      {/* Header */}
      <div className="hidden lg:flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Form */}
        <div className="lg:col-span-4 flex-col gap-6 hidden lg:flex">
           <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-5 xl:p-6 h-[500px]">
             <div className="flex items-center gap-2 mb-5">
               <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
               <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
             </div>
             <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl mb-5" />
             <div className="space-y-4">
               <div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                  <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
               </div>
               <div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                  <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
               </div>
               <div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                  <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
               </div>
               <div className="flex gap-2 mt-4">
                  <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
               </div>
             </div>
           </div>
        </div>

        {/* Right Column Calendar & List */}
        <div className="lg:col-span-8 flex-col gap-4 flex">
           {/* Calendar */}
           <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-4 xl:p-5 h-[120px] hidden lg:block">
             <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
             <div className="flex gap-2 h-[60px]">
               <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
               <div className="flex-1 rounded-xl bg-slate-200 dark:bg-slate-800" />
               <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
             </div>
           </div>
           
           {/* Summary Cards */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-card border border-[var(--border)] rounded-2xl p-4 h-[90px]">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                  <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
           </div>
           
           {/* List */}
           <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-4 xl:p-5 h-[300px]">
              <div className="flex justify-between mb-4">
                 <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                 <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
              <div className="space-y-3">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex justify-between items-center h-16 rounded-xl bg-slate-200 dark:bg-slate-800 px-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-300 dark:bg-slate-700" />
                        <div className="space-y-1.5">
                           <div className="w-24 h-4 rounded bg-slate-300 dark:bg-slate-700" />
                           <div className="w-16 h-3 rounded bg-slate-300 dark:bg-slate-700" />
                        </div>
                     </div>
                     <div className="w-20 h-5 rounded bg-slate-300 dark:bg-slate-700" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
