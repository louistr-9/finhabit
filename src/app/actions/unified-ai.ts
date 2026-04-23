'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient, getCachedUser } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper to get consistent date string for VN (GMT+7)
function getVNDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

export interface TransactionItem {
  title: string;
  amount: number;
  category: string;
  transactionType: 'expense' | 'income' | 'saving';
  date: string;
}

export interface HabitProgressItem {
  habit_id: string;
  habit_name: string;
  current_value: number;
  goal_value: number;
  unit: string;
  icon: string;
  color: string;
}

export type AIParseResult = 
  | { type: 'transaction', data: TransactionItem, message: string }
  | { type: 'batch_transaction', data: TransactionItem[], message: string }
  | { type: 'habit', data: { name: string; goal_value: number; unit: string; group_name: string; icon: string; color: string }, message: string }
  | { type: 'habit_progress', data: HabitProgressItem[], message: string }
  | { type: 'chat', message: string }
  | { type: 'unknown', message: string };

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Context helpers ──────────────────────────────────────────────────────────

export async function getUserHabitsForAI() {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return [];

  const today = getVNDate();

  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, goal_value, unit, icon, color')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (!habits || habits.length === 0) return [];

  const habitIds = habits.map(h => h.id);
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, current_value, completed')
    .eq('date', today)
    .in('habit_id', habitIds);

  const logMap = new Map(logs?.map(l => [l.habit_id, l]) ?? []);

  return habits.map(h => ({
    id: h.id,
    name: h.name,
    goal_value: h.goal_value ?? 1,
    unit: h.unit ?? 'lần',
    icon: h.icon ?? 'Target',
    color: h.color ?? 'text-indigo-500',
    current_value: logMap.get(h.id)?.current_value ?? 0,
    completed: logMap.get(h.id)?.completed ?? false,
  }));
}

// Fetch a lightweight financial summary for chat context
async function getUserFinancialContext(): Promise<string> {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return '(Không có dữ liệu tài chính)';

  const today = getVNDate();
  const [year, month] = today.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Get all transactions this month
  const { data: txs } = await supabase
    .from('transactions')
    .select('amount, type, category')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (!txs || txs.length === 0) return '(Chưa có giao dịch nào tháng này)';

  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const saving = txs.filter(t => t.type === 'saving').reduce((s, t) => s + t.amount, 0);

  // Top 3 spending categories
  const catMap = new Map<string, number>();
  txs.filter(t => t.type === 'expense').forEach(t => {
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount);
  });
  const topCats = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `${cat}: ${(amt / 1000).toFixed(0)}k`)
    .join(', ');

  return `Tháng ${month}/${year} — Thu: ${(income / 1_000_000).toFixed(1)}tr | Chi: ${(expense / 1_000_000).toFixed(1)}tr | Tiết kiệm: ${(saving / 1_000_000).toFixed(1)}tr. Top chi tiêu: ${topCats || 'chưa có'}.`;
}

// ─── Main parse function ──────────────────────────────────────────────────────

export async function parseNaturalLanguage(
  input: string,
  chatHistory: ChatTurn[] = []
): Promise<AIParseResult> {
  const user = await getCachedUser();
  if (!user) throw new Error("Unauthorized");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const today = getVNDate();

  // Fetch context in parallel
  const [habits, financialContext] = await Promise.all([
    getUserHabitsForAI(),
    getUserFinancialContext(),
  ]);

  const habitListStr = habits.length > 0
    ? habits.map(h => `- id="${h.id}" | Tên: "${h.name}" | Mục tiêu: ${h.goal_value} ${h.unit} | Đã làm hôm nay: ${h.current_value} ${h.unit}${h.completed ? ' ✓' : ''}`).join('\n')
    : '(Chưa có thói quen nào)';

  // Build conversation history string (last 6 turns to keep token count low)
  const recentHistory = chatHistory.slice(-6);
  const historyStr = recentHistory.length > 0
    ? '\n\nLỊCH SỬ HỘI THOẠI GẦN ĐÂY:\n' + recentHistory.map(t => `[${t.role === 'user' ? 'User' : 'Bot'}]: ${t.content}`).join('\n')
    : '';

  const prompt = `Bạn là "Robot FinHabit" – trợ lý AI thân thiện, vui tính trong ứng dụng quản lý tài chính & thói quen FinHabit.

PHONG CÁCH TRẢ LỜI:
- Nói tiếng Việt tự nhiên, thân thiện, hơi dí dỏm nhưng chuyên nghiệp.
- Dùng emoji phù hợp (1-2 emoji mỗi câu trả lời).
- Câu ngắn gọn, dễ hiểu. Câu chat thì tối đa 3-4 câu.
- Luôn nhớ lịch sử hội thoại để trả lời mạch lạc, không lặp lại thông tin đã nói.

DỮ LIỆU TÀI CHÍNH THỰC CỦA NGƯỜI DÙNG (dùng để tư vấn cá nhân hóa):
${financialContext}

DANH SÁCH THÓI QUEN HIỆN TẠI (dùng để tra cứu habit_id):
${habitListStr}
${historyStr}

CÁCH PHÂN TÍCH:
Người dùng có thể nhập 5 loại yêu cầu:

1. **Cập nhật tiến độ thói quen** (VD: "đọc sách 15 trang", "chạy bộ 3km", "hoàn thành tập gym")
2. **Nhiều giao dịch** (VD: "Sáng cà phê 25k, trưa cơm 45k")
3. **Giao dịch đơn lẻ** (VD: "Ăn sáng 30k", "Nhận lương 10 triệu")
4. **Thêm thói quen mới** (VD: "Thêm thói quen đọc sách 20 trang")
5. **Câu hỏi / Trò chuyện / Tư vấn** — Bao gồm:
   - Hỏi về tình hình tài chính ("Tháng này tôi chi nhiều chưa?", "Tôi đang tiết kiệm được nhiều không?")
   - Xin lời khuyên ("Tôi nên cắt giảm chỗ nào?", "Mẹo tiết kiệm")
   - Tâm sự, cãi nhau, stress ("Tôi vừa cãi nhau với bạn gái vì tiền", "Tôi đang stress quá")
   - Câu chào hỏi, nói chuyện bình thường
   → Dùng type "chat", trả lời dựa trên lịch sử hội thoại + dữ liệu tài chính thực nếu liên quan.

QUY TẮC:
- Khi user hỏi về tình hình chi tiêu → dùng dữ liệu tài chính thực ở trên để trả lời cụ thể.
- Nếu user tâm sự/stress về tiền → đồng cảm trước, sau đó có thể gợi ý nhẹ nhàng dựa trên data thực.
- Khi nhập số giao dịch: 25k → 25000, 1.5tr → 1500000.
- Nếu chứa ≥2 giao dịch riêng biệt → "batch_transaction".
- Khi nhận diện thói quen: nếu nói "xong"/"done"/"hoàn thành" không kèm số → current_value = goal_value.

DANH MỤC TÀI CHÍNH:
- Chi tiêu (expense): 'Ăn uống', 'Di chuyển', 'Nhà cửa & Hóa đơn', 'Mua sắm', 'Sức khỏe', 'Giải trí & Quan hệ', 'Học tập & Phát triển', 'Chi tiêu khác'
- Thu nhập (income): 'Lương & Thưởng', 'Làm thêm (Freelance)', 'Quà tặng & Thu nhập khác', 'Lãi & Cổ tức'
- Tiết kiệm (saving): 'Quỹ dự phòng', 'Tích lũy dài hạn', 'Đầu tư', 'Bỏ heo/Tiết kiệm tự do'

THUỘC TÍNH THÓI QUEN MỚI:
- Icon: [BookOpen, Dumbbell, Coffee, Heart, Brain, Sparkles, Droplets, Target, Moon, Sun, Apple, Zap, Music, Camera]
- Màu: [text-emerald-500, text-indigo-500, text-rose-500, text-amber-500, text-cyan-500, text-violet-500, text-orange-500]

ĐỊNH DẠNG TRẢ VỀ (CHỈ JSON THUẦN, KHÔNG backticks):

Nếu là CẬP NHẬT TIẾN ĐỘ THÓI QUEN:
{"type":"habit_progress","message":"...","data":[{"habit_id":"...","habit_name":"...","current_value":number,"goal_value":number,"unit":"...","icon":"...","color":"..."}]}

Nếu là NHIỀU giao dịch:
{"type":"batch_transaction","message":"...","data":[{"title":"...","amount":number,"category":"...","transactionType":"expense"|"income"|"saving","date":"${today}"}]}

Nếu là 1 giao dịch:
{"type":"transaction","message":"...","data":{"title":"...","amount":number,"category":"...","transactionType":"expense"|"income"|"saving","date":"${today}"}}

Nếu là Thêm thói quen MỚI:
{"type":"habit","message":"...","data":{"name":"...","goal_value":number,"unit":"...","group_name":"...","icon":"...","color":"..."}}

Nếu là câu hỏi / trò chuyện / tư vấn / tâm sự:
{"type":"chat","message":"Câu trả lời mạch lạc, cá nhân hóa dựa trên dữ liệu thực + lịch sử hội thoại"}

Nếu không hiểu:
{"type":"unknown","message":"Xin lỗi, mình chưa hiểu ý bạn lắm 😅"}

Câu nói hiện tại của người dùng: "${input}"`;

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Không tìm thấy JSON");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("AI Parse Error:", error);
    return { type: 'unknown', message: "Xin lỗi, mình đang gặp trục trặc kỹ thuật. Bạn thử lại sau nhé! 🔧" };
  }
}

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function executeAIAction(parseResult: AIParseResult) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error("Unauthorized");

  if (parseResult.type === 'transaction') {
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      title: parseResult.data.title,
      amount: parseResult.data.amount,
      category: parseResult.data.category,
      type: parseResult.data.transactionType,
      date: parseResult.data.date,
    });
    if (error) throw error;
    revalidatePath('/finance');

  } else if (parseResult.type === 'batch_transaction') {
    const rows = parseResult.data.map(t => ({
      user_id: user.id,
      title: t.title,
      amount: t.amount,
      category: t.category,
      type: t.transactionType,
      date: t.date,
    }));
    const { error } = await supabase.from('transactions').insert(rows);
    if (error) throw error;
    revalidatePath('/finance');

  } else if (parseResult.type === 'habit') {
    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      name: parseResult.data.name,
      goal_value: parseResult.data.goal_value,
      unit: parseResult.data.unit,
      group_name: parseResult.data.group_name,
      icon: parseResult.data.icon,
      color: parseResult.data.color,
      frequency: { type: 'daily' },
    });
    if (error) throw error;
    revalidatePath('/habit');

  } else if (parseResult.type === 'habit_progress') {
    const today = getVNDate();
    for (const item of parseResult.data) {
      const safeValue = Math.min(item.current_value, item.goal_value);
      const isDone = safeValue >= item.goal_value;
      const { error } = await supabase.from('habit_logs').upsert(
        { habit_id: item.habit_id, user_id: user.id, date: today, current_value: safeValue, completed: isDone },
        { onConflict: 'habit_id,date' }
      );
      if (error) throw new Error('Không thể cập nhật tiến độ thói quen');
    }
    revalidatePath('/habit');
  }

  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}
