'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getMonthlyTransactions(year: number, month: number) {
  const supabase = await createClient();

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // Lấy ngày cuối tháng chính xác
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error.message);
    return [];
  }

  return transactions ?? [];
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const titleInput = formData.get('title') as string;
  const amountStr = formData.get('amount') as string;
  const amount = Number(amountStr.replace(/\D/g, ''));
  const categoryInput = formData.get('category') as string;
  const type = formData.get('type') as 'income' | 'expense';
  const date = formData.get('date') as string;

  // Nếu không có nội dung, tự động chuyển về danh mục "Khác" và lấy tên danh mục làm tiêu đề
  let category = categoryInput;
  let title = titleInput?.trim();

  if (!title) {
    category = type === 'income' ? 'Thu nhập khác' : 'Chi tiêu khác';
    title = category;
  }

  if (!amount || !category || !type || !date) {
    throw new Error('Thiếu thông tin giao dịch quan trọng (Số tiền/Danh mục)');
  }

  const { error } = await supabase
    .from('transactions')
    .insert({ user_id: user.id, title, amount, category, type, date });

  if (error) {
    console.error('Error adding transaction:', error.message);
    throw new Error('Không thể thêm giao dịch: ' + error.message);
  }

  revalidatePath('/finance');
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // RLS extra safety

  if (error) {
    console.error('Error deleting transaction:', error.message);
    throw new Error('Không thể xóa giao dịch');
  }

  revalidatePath('/finance');
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const titleInput = formData.get('title') as string;
  const amountStr = formData.get('amount') as string;
  const amount = Number(amountStr.replace(/\D/g, ''));
  const categoryInput = formData.get('category') as string;
  const type = formData.get('type') as 'income' | 'expense';
  const date = formData.get('date') as string;

  let category = categoryInput;
  let title = titleInput?.trim();

  if (!title) {
    category = type === 'income' ? 'Thu nhập khác' : 'Chi tiêu khác';
    title = category;
  }

  if (!amount || !category || !type || !date) {
    throw new Error('Thiếu thông tin giao dịch quan trọng (Số tiền/Danh mục)');
  }

  const { error } = await supabase
    .from('transactions')
    .update({ title, amount, category, type, date })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating transaction:', error.message);
    throw new Error('Không thể cập nhật giao dịch: ' + error.message);
  }

  revalidatePath('/finance');
}

export async function getBalanceHubData() {
  const supabase = await createClient();

  // Tổng số dư: tất cả thời gian
  const { data: allTx, error: allErr } = await supabase
    .from('transactions')
    .select('amount, type');

  if (allErr) {
    console.error('Error fetching balance:', allErr.message);
    return { balance: 0, monthlyIncome: 0 };
  }

  // Thu nhập tháng này
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: monthTx, error: monthErr } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('type', 'income')
    .gte('date', startDate)
    .lte('date', endDate);

  let balance = 0;
  (allTx ?? []).forEach((t) => {
    balance += t.type === 'income' ? t.amount : -t.amount;
  });

  const monthlyIncome = (monthTx ?? []).reduce((sum, t) => sum + t.amount, 0);

  return { balance, monthlyIncome };
}

// AI Categorization Action
import { GoogleGenAI } from '@google/genai';

/**
 * Hàm kiểm tra và chuẩn hóa danh mục từ AI trả về
 */
function validateCategory(output: string, type: 'income' | 'expense'): string {
  try {
    const expenseCategories = ['Thiết yếu', 'Ăn uống', 'Mua sắm', 'Di chuyển', 'Giải trí', 'Sức khỏe', 'Chi tiêu khác'];
    const incomeCategories = ['Tiền lương', 'Thu nhập phụ', 'Tiền thưởng', 'Đầu tư', 'Thu nhập khác'];

    if (type === 'expense') {
      return expenseCategories.includes(output) ? output : 'Chi tiêu khác';
    }

    if (type === 'income') {
      return incomeCategories.includes(output) ? output : 'Thu nhập khác';
    }

    return 'Chi tiêu khác';
  } catch (error) {
    console.error('Lỗi khi xử lý danh mục từ AI:', error);
    return type === 'income' ? 'Thu nhập khác' : 'Chi tiêu khác';
  }
}

export interface AICategorizeResult {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export async function aiCategorize(title: string): Promise<AICategorizeResult> {
  const defaultResult: AICategorizeResult = {
    title,
    amount: 0,
    type: 'expense',
    category: 'Chi tiêu khác'
  };


  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !title?.trim()) return defaultResult;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `Role: Bạn là chuyên gia phân tích dữ liệu tài chính cho ứng dụng "FinHabit".
Task: Phân tích nội dung giao dịch để trích xuất thông tin.

Xác định Loại (type): 
- 'income': Nhận tiền, lương, thưởng, bán đồ, lãi đầu tư.
- 'expense': Trả tiền, mua sắm, ăn uống, chi trả dịch vụ.

Chọn Danh mục (category):
- Nếu là 'expense': [Thiết yếu, Ăn uống, Mua sắm, Di chuyển, Giải trí, Sức khỏe, Chi tiêu khác].
- Nếu là 'income': [Tiền lương, Thu nhập phụ, Tiền thưởng, Đầu tư, Thu nhập khác].

Định dạng đầu ra (JSON duy nhất):
{
  "title": "Tên ngắn gọn của giao dịch (viết hoa chữ cái đầu)",
  "amount": number (chỉ lấy số, quy đổi 'k', 'tr' sang đồng. VD: 50k -> 50000),
  "type": "income" hoặc "expense",
  "category": "Tên danh mục chính xác từ danh sách"
}

Ràng buộc:
- Nếu không có số tiền, amount = 0.
- KHÔNG trả về văn bản giải thích. Không bọc trong code block.
- JSON phải parse được ngay.

Nội dung: "${title}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let outputText = response.text?.trim() || '{}';
    outputText = outputText.replace(/^```json/, '').replace(/```$/, '').replace(/^```/, '').trim();

    const parsed = JSON.parse(outputText);
    const resultType: 'income' | 'expense' = parsed.type === 'income' ? 'income' : 'expense';

    return {
      title: parsed.title || title,
      amount: typeof parsed.amount === 'number' ? parsed.amount : 0,
      type: resultType,
      category: validateCategory(parsed.category || '', resultType)
    };
  } catch (error) {
    console.error('Lỗi AI Categorize:', error);
    return defaultResult;
  }
}
