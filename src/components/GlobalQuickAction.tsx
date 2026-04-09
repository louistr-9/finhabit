'use client';

import { useState } from 'react';
import { Plus, Wallet, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalQuickAction() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[calc(100%+16px)] left-0 min-w-[200px] p-2 bg-card rounded-[var(--radius-lg)] shadow-soft-hover border border-[var(--border)] z-50 flex flex-col gap-1"
          >
            <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:bg-slate-50 hover:text-emerald-teal rounded-md transition-colors text-left group">
              <div className="bg-emerald-teal/10 p-1.5 rounded-md group-hover:bg-emerald-teal/20 transition-colors">
                <Wallet className="h-4 w-4 text-emerald-teal" strokeWidth={1.5} />
              </div>
              Thêm giao dịch
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:bg-slate-50 hover:text-deep-violet rounded-md transition-colors text-left group">
              <div className="bg-deep-violet/10 p-1.5 rounded-md group-hover:bg-deep-violet/20 transition-colors">
                <CheckSquare className="h-4 w-4 text-deep-violet" strokeWidth={1.5} />
              </div>
              Thêm thói quen
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-teal text-white py-3 shadow-soft hover:shadow-soft-hover hover:bg-emerald-teal/90 transition-all duration-300"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </motion.div>
        <span className="font-medium font-heading">Tạo mới</span>
      </button>
      
      {/* Background overlay when open for mobile mostly, or just close when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
