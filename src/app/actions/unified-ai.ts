'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient, getCachedUser } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper to get consistent date string for VN (GMT+7)
function getVNDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

export type AIParseResult = 
  | { type: 'transaction', data: { title: string; amount: number; category: string; transactionType: 'expense' | 'income' | 'saving'; date: string }, message: string }
  | { type: 'habit', data: { name: string; goal_value: number; unit: string; group_name: string; icon: string; color: string }, message: string }
  | { type: 'chat', message: string }
  | { type: 'unknown', message: string };

export async function parseNaturalLanguage(input: string): Promise<AIParseResult> {
  const user = await getCachedUser();
  if (!user) throw new Error("Unauthorized");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const today = getVNDate();

  const prompt = `Bạn là "Robot FinHabit" – trợ lý AI thân thiện, vui tính trong ứng dụng quản lý tài chính & thói quen FinHabit.

PHONG CÁCH TRẢ LỜI:
- Nói tiếng Việt tự nhiên, thân thiện, hơi dí dỏm nhưng chuyên nghiệp.
- Dùng emoji phù hợp (1-2 emoji mỗi câu trả lời).
- Câu ngắn gọn, dễ hiểu. Tối đa 2-3 câu cho mỗi "message".

CÁCH PHÂN TÍCH:
Người dùng có thể nhập 3 loại yêu cầu:

1. **Giao dịch tài chính** (VD: "Ăn sáng 30k", "Nhận lương 10 triệu", "Gửi tiết kiệm 5tr")
2. **Thói quen mới** (VD: "Thêm thói quen đọc sách 20 trang", "Tôi muốn tập gym 30 phút")
3. **Câu hỏi / Trò chuyện** (VD: "Tôi nên tiết kiệm bao nhiêu?", "Xin chào", "Cho tôi mẹo quản lý chi tiêu")

DANH MỤC TÀI CHÍNH:
- Chi tiêu (expense): 'Ăn uống', 'Di chuyển', 'Nhà cửa & Hóa đơn', 'Mua sắm', 'Sức khỏe', 'Giải trí & Quan hệ', 'Học tập & Phát triển', 'Chi tiêu khác'
- Thu nhập (income): 'Lương & Thưởng', 'Làm thêm (Freelance)', 'Quà tặng & Thu nhập khác', 'Lãi & Cổ tức'
- Tiết kiệm (saving): 'Quỹ dự phòng', 'Tích lũy dài hạn', 'Đầu tư', 'Bỏ heo/Tiết kiệm tự do'

GỢI Ý LOGIC:
- "Gửi mẹ 2 triệu tiền tiết kiệm" hoặc "Trích quỹ dự phòng" → Type: saving
- "Nhận tiền" hoặc "Lương" → Type: income
- Khoản chi xài → Type: expense

THUỘC TÍNH THÓI QUEN:
- Icon: [BookOpen, Dumbbell, Coffee, Heart, Brain, Sparkles, Droplets, Target, Moon, Sun, Apple, Zap, Music, Camera]
- Màu: [text-emerald-500, text-indigo-500, text-rose-500, text-amber-500, text-cyan-500, text-violet-500, text-orange-500]

ĐỊNH DẠNG TRẢ VỀ (CHỈ JSON, KHÔNG backticks):

Nếu là Giao dịch:
{
  "type": "transaction",
  "message": "Lời nhận xét thân thiện về giao dịch vừa nhập (VD: 'Ăn sáng ngon miệng nhé! 🍜')",
  "data": {
    "title": "Tên giao dịch",
    "amount": number,
    "category": "Danh mục từ danh sách trên",
    "transactionType": "expense" | "income" | "saving",
    "date": "${today}"
  }
}

Nếu là Thói quen:
{
  "type": "habit",
  "message": "Lời động viên thân thiện (VD: 'Tuyệt vời! Đọc sách giúp tâm hồn phong phú hơn 📚')",
  "data": {
    "name": "Tên thói quen",
    "goal_value": number,
    "unit": "Đơn vị",
    "group_name": "Nhóm",
    "icon": "Icon name",
    "color": "Color class"
  }
}

Nếu là câu hỏi / trò chuyện:
{
  "type": "chat",
  "message": "Câu trả lời hữu ích, thân thiện. Có thể đưa ra mẹo tài chính hoặc thói quen tốt."
}

Nếu không hiểu:
{
  "type": "unknown",
  "message": "Xin lỗi, mình chưa hiểu ý bạn lắm. Bạn có thể thử nói kiểu: 'Ăn trưa 50k' hoặc 'Thêm thói quen chạy bộ 3km' nhé! 😊"
}

Câu nói của người dùng: "${input}"`;

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Không tìm thấy JSON trong phản hồi của AI");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("AI Parse Error:", error);
    return { type: 'unknown', message: "Xin lỗi, mình đang gặp trục trặc kỹ thuật. Bạn thử lại sau nhé! 🔧" };
  }
}

export async function executeAIAction(parseResult: AIParseResult) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error("Unauthorized");

  if (parseResult.type === 'transaction') {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        title: parseResult.data.title,
        amount: parseResult.data.amount,
        category: parseResult.data.category,
        type: parseResult.data.transactionType,
        date: parseResult.data.date
      });
    
    if (error) throw error;
    revalidatePath('/finance');
  } else if (parseResult.type === 'habit') {
    const { error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: parseResult.data.name,
        goal_value: parseResult.data.goal_value,
        unit: parseResult.data.unit,
        group_name: parseResult.data.group_name,
        icon: parseResult.data.icon,
        color: parseResult.data.color,
        frequency: { type: 'daily' }
      });
    
    if (error) throw error;
    revalidatePath('/habit');
  }

  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}
