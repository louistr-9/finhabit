'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Shield, CreditCard, ChevronRight, User, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Custom Toggle Component
  const Switch = ({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) => (
    <div 
      className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
        checked ? 'bg-emerald-teal' : 'bg-slate-300 dark:bg-slate-700'
      }`}
      onClick={() => onChange(!checked)}
    >
      <motion.div
        className="w-5 h-5 bg-white rounded-full shadow-md"
        layout
        initial={false}
        animate={{
          x: checked ? 20 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </div>
  );

  return (
    <div className="w-full pb-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-bold text-foreground">Cài đặt</h2>
        <p className="text-foreground/60 mt-1">Quản lý tài khoản và tùy chỉnh trải nghiệm của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Cột TRÁI: Profile & Navigation */}
        <div className="col-span-1 space-y-4">
          <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-soft flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-teal to-deep-violet p-1 mb-4 shadow-md">
                <div className="w-full h-full bg-card rounded-full flex items-center justify-center font-heading font-bold text-3xl text-foreground">
                  US
                </div>
              </div>
              <div className="absolute bottom-4 right-0 w-4 h-4 bg-green-500 border-2 border-card rounded-full"></div>
            </div>
            
            <h3 className="font-heading font-bold text-xl text-foreground">User Name</h3>
            <p className="text-foreground/60 text-sm mb-4">user@finhabit.com</p>
            
            <button className="w-full bg-emerald-teal/10 text-emerald-teal hover:bg-emerald-teal hover:text-white transition-colors py-2 rounded-lg font-medium text-sm">
              Chỉnh sửa hồ sơ
            </button>
          </div>

          <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft overflow-hidden">
            <div className="flex flex-col">
              <button className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-[var(--border)] text-foreground">
                <Shield className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                <span className="flex-1 font-medium text-sm">Bảo mật tài khoản</span>
                <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              </button>
              <button className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-[var(--border)] text-foreground">
                <CreditCard className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                <span className="flex-1 font-medium text-sm">Gói đăng ký (Free)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              </button>
              <button className="flex items-center gap-3 p-4 hover:bg-red-50 transition-colors text-left text-red-600 group">
                <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" strokeWidth={1.5} />
                <span className="flex-1 font-medium text-sm">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cột PHẢI: Settings Toggles */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {/* Tùy chỉnh giao diện */}
          <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] bg-slate-50/50">
              <h3 className="font-heading font-semibold text-foreground">Giao diện</h3>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  {isDarkMode ? <Moon className="w-5 h-5" strokeWidth={1.5} /> : <Sun className="w-5 h-5" strokeWidth={1.5} />}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Chế độ hiển thị</h4>
                  <p className="text-sm text-foreground/60">Tự động làm dịu mắt trong bóng tối</p>
                </div>
              </div>
              <Switch checked={isDarkMode} onChange={(v) => {
                setIsDarkMode(v);
                // Giả lập toggle, nếu có next-themes sẽ dùng useTheme
              }} />
            </div>
          </div>

          {/* Cài đặt thông báo */}
          <div className="bg-card border border-[var(--border)] rounded-[var(--radius-xl)] shadow-soft overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] bg-slate-50/50">
              <h3 className="font-heading font-semibold text-foreground">Thông báo</h3>
            </div>
            
            <div className="p-5 flex items-center justify-between border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-teal/10 flex items-center justify-center text-emerald-teal">
                  <Bell className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Thông báo đẩy (Push)</h4>
                  <p className="text-sm text-foreground/60">Nhắc nhở nhập liệu hàng ngày</p>
                </div>
              </div>
              <Switch checked={notifications} onChange={setNotifications} />
            </div>

            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <User className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Báo cáo tuần</h4>
                  <p className="text-sm text-foreground/60">Gửi tổng hợp tài chính vào cuối tuần</p>
                </div>
              </div>
              <Switch checked={weeklyReport} onChange={setWeeklyReport} />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
