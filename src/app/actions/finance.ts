'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  
  // 1. Kiểm tra Security - Đảm bảo User đã đăng nhập
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');
  }

  // 2. Parse & Code Validation an toàn
  const amount = Number(formData.get('amount'));
  const category = formData.get('category') as string;
  const type = formData.get('type') as 'income' | 'expense';
  const date = (formData.get('date') as string) || new Date().toISOString();

  if (isNaN(amount) || amount <= 0) {
    throw new Error('Số tiền (amount) phải là một số dương lớn hơn 0');
  }

  // 3. Thêm Transaction vào Supabase DB
  const { error: insertError } = await supabase
    .from('transactions')
    .insert([
      {
        user_id: user.id,
        amount,
        category,
        type,
        date
      }
    ]);

  if (insertError) {
    throw new Error(`Thêm giao dịch thất bại: ${insertError.message}`);
  }

  // 4. Tự động cập nhật giao diện (Clear cache)
  revalidatePath('/finance');
  
  return { success: true };
}
