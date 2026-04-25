'use strict';
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: 'real_estate' | 'cash' | 'gold' | 'stock' | 'crypto' | 'saving' | 'other';
  symbol: string | null;
  value: number;
  purchase_price: number;
  quantity: number | null;
  target_amount: number | null;
  target_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function addAsset(data: {
  name: string;
  type: Asset['type'];
  symbol?: string;
  value: number;
  purchase_price: number;
  quantity?: number;
  target_amount?: number;
  target_date?: string;
  description?: string;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('Not authenticated');
  }

  const { data: newAsset, error } = await supabase
    .from('assets')
    .insert({
      user_id: user.user.id,
      name: data.name,
      type: data.type,
      symbol: data.symbol || null,
      value: data.value,
      purchase_price: data.purchase_price,
      quantity: data.quantity || null,
      target_amount: data.target_amount || null,
      target_date: data.target_date || null,
      description: data.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding asset:', error);
    return { success: false, error: error.message };
  }

  // Create an initial transaction if the asset is a saving with an initial balance
  if (data.type === 'saving' && data.value > 0) {
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.user.id,
      title: `Khởi tạo: ${data.name}`,
      amount: data.value,
      category: data.name,
      type: 'saving',
      date: new Date().toISOString().split('T')[0],
      asset_id: newAsset.id
    });
    
    if (txError) {
      console.error('Error creating initial transaction for saving asset:', txError);
    }
  }

  revalidatePath('/finance');
  revalidatePath('/finance/assets');
  revalidatePath('/finance/net-worth');
  
  return { success: true, asset: newAsset as Asset };
}

export async function deleteAsset(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting asset:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/finance/assets');
  revalidatePath('/finance/net-worth');
  return { success: true };
}
