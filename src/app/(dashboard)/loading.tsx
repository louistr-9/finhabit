import { Loader2 } from 'lucide-react';

export default function LoadingDashboard() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-emerald-teal animate-spin" />
      <span className="text-foreground/50 font-medium font-heading animate-pulse">Đang tải dữ liệu...</span>
    </div>
  );
}
