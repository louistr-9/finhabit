'use server';

import { createClient, getCachedUser } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to get consistent date string for VN (GMT+7)
function getVNTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}
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

  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const titleInput = formData.get('title') as string;
  const amountStr = formData.get('amount') as string;
  const amount = Number(amountStr.replace(/\D/g, ''));
  const categoryInput = formData.get('category') as string;
  const type = formData.get('type') as 'income' | 'expense' | 'saving';
  const date = formData.get('date') as string;

  let category = categoryInput;
  let title = titleInput?.trim();

  if (!title) {
    if (type === 'income') category = 'Quà tặng & Thu nhập khác';
    else if (type === 'saving') category = 'Bỏ heo/Tiết kiệm tự do';
    else category = 'Chi tiêu khác';
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

  const user = await getCachedUser();
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

  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const titleInput = formData.get('title') as string;
  const amountStr = formData.get('amount') as string;
  const amount = Number(amountStr.replace(/\D/g, ''));
  const categoryInput = formData.get('category') as string;
  const type = formData.get('type') as 'income' | 'expense' | 'saving';
  const date = formData.get('date') as string;

  let category = categoryInput;
  let title = titleInput?.trim();

  if (!title) {
    if (type === 'income') category = 'Quà tặng & Thu nhập khác';
    else if (type === 'saving') category = 'Bỏ heo/Tiết kiệm tự do';
    else category = 'Chi tiêu khác';
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
  const user = await getCachedUser();
  if (!user) return { balance: 0, monthlyIncome: 0, monthlySpent: 0, totalSavings: 0 };

  const { data: allTx, error: allErr } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', user.id);

  if (allErr) {
    console.error('Error fetching balance:', allErr.message);
    return { balance: 0, monthlyIncome: 0 };
  }

  const today = getVNTime();
  const [year, month] = today.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: monthIncomeTx } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('type', 'income')
    .gte('date', startDate)
    .lte('date', `${endDate}T23:59:59.999Z`);

  const { data: monthSpentTx } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', user.id)
    .in('type', ['expense', 'saving'])
    .gte('date', startDate)
    .lte('date', `${endDate}T23:59:59.999Z`);

  const initialBalance = Number(user.user_metadata?.initial_balance) || 0;
  let balance = initialBalance;
  let totalSavings = 0;
  (allTx ?? []).forEach((t) => {
    if (t.type === 'income') {
      balance += t.amount;
    } else {
      balance -= t.amount;
      if (t.type === 'saving') {
        totalSavings += t.amount;
      }
    }
  });

  const monthlyIncome = (monthIncomeTx ?? []).reduce((sum, t) => sum + t.amount, 0);
  const monthlySpent = (monthSpentTx ?? []).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return { balance, monthlyIncome, monthlySpent, totalSavings };
}

export async function getWeeklyOverview() {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return [];

  const todayStr = getVNTime();
  const localToday = new Date();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = getVNTime(sevenDaysAgo);
  const endDate = todayStr;

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', `${endDate}T23:59:59.999Z`);

  const txMap = new Map<string, { spend: number, income: number, saving: number }>();
  (transactions ?? []).forEach(t => {
    // Normalize date string to YYYY-MM-DD to handle ISO timestamps from database
    const d = t.date.split('T')[0];
    const existing = txMap.get(d) || { spend: 0, income: 0, saving: 0 };
    if (t.type === 'expense') existing.spend += t.amount;
    else if (t.type === 'saving') existing.saving += t.amount;
    else existing.income += t.amount;
    txMap.set(d, existing);
  });

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const chartData = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = getVNTime(d);
    const dayName = dayNames[d.getDay()];
    const stats = txMap.get(dStr) || { spend: 0, income: 0, saving: 0 };
    chartData.push({
      name: dayName,
      fullDate: dStr,
      spend: stats.spend,
      income: stats.income,
      saving: stats.saving
    });
  }

  return chartData;
}


// ==========================================
// TÍNH NĂNG AI (GEMINI)
// ==========================================

function validateCategory(output: string, type: 'income' | 'expense' | 'saving'): string {
  try {
    const expenseCategories = ['Ăn uống', 'Di chuyển', 'Nhà cửa & Hóa đơn', 'Mua sắm', 'Sức khỏe', 'Giải trí & Quan hệ', 'Học tập & Phát triển', 'Chi tiêu khác'];
    const incomeCategories = ['Lương & Thưởng', 'Làm thêm (Freelance)', 'Quà tặng & Thu nhập khác', 'Lãi & Cổ tức'];
    const savingCategories = ['Quỹ dự phòng', 'Tích lũy dài hạn', 'Đầu tư', 'Bỏ heo/Tiết kiệm tự do'];

    const normalizedOutput = (output || '').trim().toLowerCase();

    if (type === 'expense') {
      const match = expenseCategories.find(c => c.toLowerCase() === normalizedOutput);
      return match || 'Chi tiêu khác';
    }

    if (type === 'income') {
      const match = incomeCategories.find(c => c.toLowerCase() === normalizedOutput);
      return match || 'Quà tặng & Thu nhập khác';
    }

    if (type === 'saving') {
      const match = savingCategories.find(c => c.toLowerCase() === normalizedOutput);
      return match || 'Bỏ heo/Tiết kiệm tự do';
    }

    return 'Chi tiêu khác';
  } catch (error) {
    console.error('Lỗi khi xử lý danh mục từ AI:', error);
    return type === 'income' ? 'Quà tặng & Thu nhập khác' : 'Chi tiêu khác';
  }
}

export interface AICategorizeResult {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'saving';
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
    category: guessedType === 'income' ? 'Quà tặng & Thu nhập khác' : 'Chi tiêu khác'
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !title?.trim()) return defaultResult;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  try {
    const prompt = `Bạn là một trợ lý tài chính thông minh trong ứng dụng FinHabit. Phân tích nội dung sau và trả về DUY NHẤT một đối tượng JSON. KHÔNG giải thích, KHÔNG thêm \`\`\`json.

Input: "${title}"

Quy tắc:
1. "type": Chọn "income" (nếu là nhận tiền, lương, thưởng, lãi), "expense" (chi trả, mua sắm) hoặc "saving" (tiết kiệm, gửi quỹ, đầu tư tích lũy).
2. "category": Phải CHÍNH XÁC một trong các từ sau:
   - Dành cho "expense": "Ăn uống", "Di chuyển", "Nhà cửa & Hóa đơn", "Mua sắm", "Sức khỏe", "Giải trí & Quan hệ", "Học tập & Phát triển", "Chi tiêu khác".
   - Dành cho "income": "Lương & Thưởng", "Làm thêm (Freelance)", "Quà tặng & Thu nhập khác", "Lãi & Cổ tức".
   - Dành cho "saving": "Quỹ dự phòng", "Tích lũy dài hạn", "Đầu tư", "Bỏ heo/Tiết kiệm tự do".
3. "title": Tóm tắt ngắn gọn giao dịch (viết hoa chữ cái đầu).
4. "amount": Số tiền (chỉ chứa chữ số, ví dụ 50k -> 50000, 1tr -> 1000000). Nếu không có số tiền thì trả về 0.

Định dạng JSON bắt buộc:
{
  "title": string,
  "amount": number,
  "type": "income" | "expense" | "saving",
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
    const resultType: 'income' | 'expense' | 'saving' = (aiType === 'income' || aiType === 'expense' || aiType === 'saving')
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
      fbCategory = 'Ăn uống'; // Changed from 'Thiết yếu' to 'Ăn uống' or 'Chi tiêu khác'
    } else if (/(mua|áo|quần|giày|dép|balo|sắm|tả|bỉm|sữa)/.test(lowerTitle)) {
      fbCategory = 'Mua sắm';
    } else if (/(xăng|grab|taxi|xe|đi lại|gửi xe)/.test(lowerTitle)) {
      fbCategory = 'Di chuyển';
    } else if (/(lương|thưởng|nhận được|tiền lãi|khen thưởng)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Lương & Thưởng';
    } else if (/(thuốc|khám|viện|sức khỏe|gym|tập)/.test(lowerTitle)) {
      fbCategory = 'Sức khỏe';
    } else if (/(phim|chơi|giải trí|xem|truyện)/.test(lowerTitle)) {
      fbCategory = 'Giải trí & Quan hệ';
    } else if (/(nhà|trọ|thuê nhà|tiền nhà|điện|nước|mạng|internet|rác|wifi)/.test(lowerTitle)) {
      fbCategory = 'Nhà cửa & Hóa đơn';
    }
    else if (/(lương)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Lương & Thưởng';
    }
    else if (/(phụ|nhận được|tiền lãi)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Quà tặng & Thu nhập khác';
    }
    else if (/(thưởng|khen thưởng)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Lương & Thưởng';
    }
    else if (/(đầu tư)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Lãi & Cổ tức';
    }
    else if (/(khác|thu nhập khác)/.test(lowerTitle)) {
      fbType = 'income';
      fbCategory = 'Quà tặng & Thu nhập khác';
    }


    return {
      title,
      amount: 0,
      type: fbType,
      category: validateCategory(fbCategory, fbType)
    };
  }
}