export default function AssetsLoading() {
  return (
    <div className="w-full pb-12 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="w-32 h-10 bg-slate-200 dark:bg-slate-800 rounded-[14px]" />
      </div>

      {/* Overview Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 shadow-sm min-h-[300px]">
          <div className="w-40 h-6 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 shadow-sm min-h-[300px] flex flex-col justify-center">
           <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
           <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
           <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>

      {/* Asset List Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[24px] p-5 shadow-sm h-48">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-[14px]" />
                  <div className="space-y-2">
                     <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                     <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
               </div>
               <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
