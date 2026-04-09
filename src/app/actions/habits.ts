'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeHabitAction(habitId: string) {
  const supabase = await createClient();

  // 1. Kiểm tra Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Bạn cần đăng nhập để thao tác');
  }

  // 2. Gọi Supabase RPC
  const { error: rpcError } = await supabase.rpc('complete_habit_and_save', {
    habit_id_param: habitId 
  });

  if (rpcError) {
    throw new Error(`Xử lý hoàn thành thói quen thất bại: ${rpcError.message}`);
  }

  // 3. Clear Cache cập nhật cả 2 trang Dữ liệu (Vì tiền cũng thay đổi)
  revalidatePath('/habits'); 
  revalidatePath('/finance');
  
  return { success: true };
}
