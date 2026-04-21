'use client';

import React, { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, X, Send, Loader2, Check, Wallet, 
  CheckSquare, Calendar, MessageCircle, RotateCcw,
  BookOpen, Dumbbell, Coffee, Heart, Brain, Droplets, Target, Moon, Sun, Apple, Zap, Music, Camera
} from 'lucide-react';
import { parseNaturalLanguage, executeAIAction, AIParseResult } from '@/app/actions/unified-ai';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Dumbbell, Coffee, Heart, Brain, Sparkles, Droplets, 
  Target, Moon, Sun, Apple, Zap, Music, Camera
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parseResult?: AIParseResult;
  confirmed?: boolean;
  timestamp: Date;
}

const QUICK_HINTS = [
  '☕ Cà phê sáng 25k',
  '💰 Nhận lương 15tr',
  '📖 Đọc sách 20 trang',
  '💡 Mẹo tiết kiệm',
];

export function AIChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();
  const [executingId, setExecutingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Xin chào! 👋 Mình là Robot FinHabit — trợ lý tài chính & thói quen của bạn. Bạn có thể nói tự nhiên, ví dụ: "Ăn trưa 50k" hoặc "Thêm thói quen chạy bộ 5km". Hỏi gì cũng được nhé! 😊',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isPending || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    startTransition(async () => {
      try {
        const result = await parseNaturalLanguage(messageText);
        
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: result.message || '',
          parseResult: result.type !== 'chat' && result.type !== 'unknown' ? result : undefined,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMsg]);
      } catch {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Xin lỗi, đã có lỗi xảy ra. Bạn thử lại nhé! 🔧',
          timestamp: new Date()
        }]);
      } finally {
        isSubmittingRef.current = false;
      }
    });
  }, [input, isPending, startTransition]);

  const handleConfirm = async (msg: ChatMessage) => {
    if (!msg.parseResult || executingId) return;
    setExecutingId(msg.id);
    
    try {
      await executeAIAction(msg.parseResult);
      
      // Mark message as confirmed
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, confirmed: true } : m));
      
      // Add success message
      setMessages(prev => [...prev, {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: '✅ Đã lưu thành công! Dữ liệu đã được cập nhật.',
        timestamp: new Date()
      }]);
      
      router.refresh();
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '❌ Lưu thất bại. Vui lòng thử lại.',
        timestamp: new Date()
      }]);
    } finally {
      setExecutingId(null);
    }
  };

  const handleReset = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Cuộc trò chuyện mới! 🔄 Mình sẵn sàng giúp bạn. Nhập giao dịch, thói quen, hoặc hỏi bất cứ điều gì nhé!',
      timestamp: new Date()
    }]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-teal to-deep-violet text-white shadow-lg shadow-emerald-teal/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
          >
            <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-teal/20 animate-ping opacity-50" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Chat Modal */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-lg bg-card border border-[var(--border)] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-card/80 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-teal to-deep-violet flex items-center justify-center shadow-md shadow-emerald-teal/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-heading font-bold text-foreground">Robot FinHabit</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] text-foreground/40 font-medium">Đang hoạt động</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleReset}
                    className="h-9 w-9 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors"
                    title="Cuộc trò chuyện mới"
                  >
                    <RotateCcw className="h-4 w-4 text-foreground/40" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="h-9 w-9 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4 text-foreground/40" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      'flex gap-2.5',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {/* Bot Avatar */}
                    {msg.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-teal to-deep-violet flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    
                    <div className={cn(
                      'max-w-[80%] space-y-2',
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    )}>
                      {/* Message Bubble */}
                      <div className={cn(
                        'px-4 py-2.5 text-[13px] leading-relaxed',
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-emerald-teal to-emerald-teal/90 text-white rounded-2xl rounded-tr-md shadow-sm' 
                          : 'bg-foreground/[0.04] text-foreground rounded-2xl rounded-tl-md border border-[var(--border)]'
                      )}>
                        {msg.content}
                      </div>

                      {/* Action Card (Transaction or Habit) */}
                      {msg.parseResult && !msg.confirmed && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-card rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden"
                        >
                          <div className="p-4">
                            {msg.parseResult.type === 'transaction' ? (
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center",
                                  msg.parseResult.data.transactionType === 'income' ? 'bg-emerald-500/10' : msg.parseResult.data.transactionType === 'saving' ? 'bg-indigo-500/10' : 'bg-rose-500/10'
                                )}>
                                  <Wallet className={cn("h-5 w-5", 
                                    msg.parseResult.data.transactionType === 'income' ? 'text-emerald-500' : msg.parseResult.data.transactionType === 'saving' ? 'text-indigo-500' : 'text-rose-500'
                                  )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{msg.parseResult.data.title}</p>
                                  <p className="text-[10px] text-foreground/40">{msg.parseResult.data.category} · {msg.parseResult.data.date}</p>
                                </div>
                                <p className={cn("text-base font-bold font-heading shrink-0",
                                  msg.parseResult.data.transactionType === 'income' ? 'text-emerald-500' : msg.parseResult.data.transactionType === 'saving' ? 'text-indigo-500' : 'text-rose-500'
                                )}>
                                  {msg.parseResult.data.transactionType === 'income' ? '+' : '-'}{msg.parseResult.data.amount.toLocaleString('vi-VN')}đ
                                </p>
                              </div>
                            ) : msg.parseResult.type === 'habit' ? (
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                  {(() => {
                                    const Icon = ICON_MAP[msg.parseResult.data.icon] || Target;
                                    return <Icon className={cn("h-5 w-5", msg.parseResult.data.color)} />;
                                  })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{msg.parseResult.data.name}</p>
                                  <p className="text-[10px] text-foreground/40">{msg.parseResult.data.group_name} · Hàng ngày</p>
                                </div>
                                <p className="text-base font-bold font-heading text-violet-500 shrink-0">
                                  {msg.parseResult.data.goal_value} {msg.parseResult.data.unit}
                                </p>
                              </div>
                            ) : null}
                          </div>

                          {/* Confirm/Cancel Buttons */}
                          <div className="flex border-t border-[var(--border)]">
                            <button 
                              onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id || (m.parseResult = undefined, true)))}
                              disabled={executingId === msg.id}
                              className="flex-1 py-2.5 text-xs font-semibold text-foreground/50 hover:bg-foreground/5 transition-colors disabled:opacity-50 border-r border-[var(--border)]"
                            >
                              Bỏ qua
                            </button>
                            <button 
                              onClick={() => handleConfirm(msg)}
                              disabled={executingId === msg.id}
                              className="flex-[2] py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {executingId === msg.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Xác nhận & Lưu
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Confirmed badge */}
                      {msg.confirmed && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                          <Check className="h-3 w-3" /> Đã lưu
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className={cn(
                        'text-[9px] text-foreground/25 px-1',
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      )}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isPending && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-teal to-deep-violet flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-foreground/[0.04] border border-[var(--border)] rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Quick Hints (only show when no conversation yet) */}
              {messages.length <= 1 && (
                <div className="px-5 pb-2 flex flex-wrap gap-1.5 shrink-0">
                  {QUICK_HINTS.map(hint => (
                    <button 
                      key={hint}
                      onClick={() => handleSend(hint)}
                      disabled={isPending}
                      className="text-[11px] font-medium bg-foreground/[0.04] text-foreground/60 px-3 py-1.5 rounded-full hover:bg-emerald-teal/10 hover:text-emerald-teal transition-colors border border-transparent hover:border-emerald-teal/20 disabled:opacity-50"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="px-4 py-3 border-t border-[var(--border)] bg-card/80 backdrop-blur-xl shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    disabled={isPending}
                    className="flex-1 bg-foreground/[0.04] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-teal/40 focus:ring-2 focus:ring-emerald-teal/10 transition-all placeholder:text-foreground/30 disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isPending}
                    className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-teal to-emerald-teal/80 text-white flex items-center justify-center disabled:opacity-40 disabled:grayscale transition-all shadow-md shadow-emerald-teal/20 hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 translate-x-0.5 -translate-y-0.5" />}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
