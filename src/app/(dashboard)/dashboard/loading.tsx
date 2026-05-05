export default function DashboardLoading() {
  return (
    <div className="w-full pb-12 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-40 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="w-64 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-5 sm:p-7 shadow-sm h-40">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="w-16 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Body Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-sm h-[450px]">
            <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded mb-10" />
            <div className="w-full h-[300px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
        <div>
          <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-sm h-[450px]">
            <div className="w-40 h-6 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
            <div className="space-y-4 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-16 rounded-[20px] bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
