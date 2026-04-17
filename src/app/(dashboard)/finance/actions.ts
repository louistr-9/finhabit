'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ==========================================
// QUẢN LÝ GIAO DỊCH (SUPABASE)
// ==========================================

export async function getMonthlyTransactions(year: number, month: number) {
  const supabase = await createClient();

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
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
    .eq('user_id', user.id);

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

  const { data: allTx, error: allErr } = await supabase
    .from('transactions')
    .select('amount, type');

  if (allErr) {
    console.error('Error fetching balance:', allErr.message);
    return { balance: 0, monthlyIncome: 0 };
  }

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


// ==========================================
// TÍNH NĂNG AI (GEMINI)
// ==========================================

function validateCategory(output: string, type: 'income' | 'expense'): string {
  try {
    const expenseCategories = ['Thiết yếu', 'Ăn uống', 'Mua sắm', 'Di chuyển', 'Giải trí', 'Sức khỏe', 'Tiền nhà', 'Chi tiêu khác'];
    const incomeCategories = ['Tiền lương', 'Thu nhập phụ', 'Tiền thưởng', 'Đầu tư', 'Thu nhập khác'];

    const normalizedOutput = (output || '').trim().toLowerCase();

    if (type === 'expense') {
      const match = expenseCategories.find(c => c.toLowerCase() === normalizedOutput);
      return match || 'Chi tiêu khác';
    }

    if (type === 'income') {
      const match = incomeCategories.find(c => c.toLowerCase() === normalizedOutput);
      return match || 'Thu nhập khác';
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
  const lowerTitle = title.toLowerCase();
  const isIncomeKeywords = /nhận|lương|thưởng|được|lãi|\+|thu nhập/.test(lowerTitle);
  const guessedType: 'income' | 'expense' = isIncomeKeywords ? 'income' : 'expense';

  const defaultResult: AICategorizeResult = {
    title,
    amount: 0,
    type: guessedType,
    category: guessedType === 'income' ? 'Thu nhập khác' : 'Chi tiêu khác'
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !title?.trim()) return defaultResult;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  try {
    const prompt = `Bạn là một trợ lý tài chính thông minh trong ứng dụng FinHabit. Phân tích nội dung sau và trả về DUY NHẤT một đối tượng JSON. KHÔNG giải thích, KHÔNG thêm \`\`\`json.

Input: "${title}"

Quy tắc:
1. "type": Chọn "income" (nếu là nhận tiền, lương, thưởng, lãi) hoặc "expense" (nếu là mua sắm, trả tiền, ăn uống, đổ xăng, chi trả).
2. "category": Phải CHÍNH XÁC một trong các từ sau:
   - Dành cho "expense": "Thiết yếu", "Ăn uống", "Mua sắm", "Di chuyển", "Giải trí", "Sức khỏe", "Tiền nhà", "Chi tiêu khác".
   - Dành cho "income": "Tiền lương", "Thu nhập phụ", "Tiền thưởng", "Đầu tư", "Thu nhập khác".
   (Ví dụ: "ăn sáng", "cà phê" -> "Ăn uống"; "mua áo", "mua đồ" -> "Mua sắm"; "đổ xăng", "đi grab" -> "Di chuyển").
3. "title": Tóm tắt ngắn gọn giao dịch (viết hoa chữ cái đầu).
4. "amount": Số tiền (chỉ chứa chữ số, ví dụ 50k -> 50000, 1tr -> 1000000). Nếu không có số tiền thì trả về 0.

Định dạng JSON bắt buộc:
{
  "title": string,
  "amount": number,
  "type": "income" | "expense",
  "category": string
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let outputText = response.text().trim();

    outputText = outputText.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed = JSON.parse(outputText);

    console.log('--- AI TRẢ VỀ GÌ? ---');
    console.log('Input:', title);
    console.log('Parsed:', parsed);

    const aiType = parsed.type?.toLowerCase();
    const resultType: 'income' | 'expense' = (aiType === 'income' || aiType === 'expense')
      ? aiType
      : guessedType;

    return {
      title: parsed.title || title,
      amount: typeof parsed.amount === 'number' ? parsed.amount : 0,
      type: resultType,
      category: validateCategory(parsed.category || '', resultType)
    };
  } catch (error) {
    console.error('Lỗi nhận diện AI (Có thể do hết Quota):', error);

    // Fallback thông minh cục bộ khi API lỗi (ví dụ báo 429 Quota Exceeded do vượt giới hạn request/ngày)
    const lowerTitle = title.toLowerCase();
    let fbType: 'income' | 'expense' = 'expense';
    let fbCategory = 'Chi tiêu khác';

    if (/(ăn|uống|cà phê|cafe|phở|bún|cơm|bánh|sáng|trưa|tối)/.test(lowerTitle)) {
      fbCategory = 'Ăn uống';
    } else if (/(thịt|cá|bhx|siêu thị|đi chợ|rau|củ|quả|gạo|trứng|sữa|bánh mì)/.test(lowerTitle)) {
      fbCategory = 'Thiết yếu';
    } else if (/(mua|áo|quần|giày|dép|balo|sắm|tả|bỉm|sữa)/.test(lowerTitle)) {
      fbCategory = 'Mua sắm';
    } else if (/(xăng|grab|taxi|xe|đi lại|gửi xe)/.test(lowerTitle)) {
      fbCategory = 'Di chuyển';
    } else if (/(lương|thưởng|nhận được|tiền lãi|khen thưởng)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Tiền lương';
    } else if (/(thuốc|khám|viện|sức khỏe|gym|tập)/.test(lowerTitle)) {
      fbCategory = 'Sức khỏe';
    } else if (/(phim|chơi|giải trí|xem|truyện)/.test(lowerTitle)) {
      fbCategory = 'Giải trí';
    } else if (/(nhà|trọ|thuê nhà|tiền nhà|điện|nước|mạng|internet|rác|wifi)/.test(lowerTitle)) {
      fbCategory = 'Tiền nhà';
    }
    else if (/(lương)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Tiền lương';
    }
    else if (/(phụ|nhận được|tiền lãi)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Thu nhập phụ';
    }
    else if (/(thưởng|khen thưởng)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Tiền thưởng';
    }
    else if (/(đầu tư)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Đầu tư';
    }
    else if (/(khác|thu nhập khác)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Thu nhập khác';
    }


    return {
      title,
      amount: 0,
      type: fbType,
      category: validateCategory(fbCategory, fbType)
    };
  }
}