// Supabase Edge Function: telegram-webhook
// Hỗ trợ: Tài chính + Thói quen (Multi-user & Shared Mode)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const FINHABIT_USER_ID = Deno.env.get("FINHABIT_USER_ID")!;

// ==========================================
// HELPERS
// ==========================================

function getVNDate(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

async function sendTelegram(chatId: number, text: string, replyTo?: number) {
  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyTo) body.reply_to_message_id = replyTo;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sendTyping(chatId: number) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function isGroup(chatType: string): boolean {
  return chatType === "group" || chatType === "supergroup";
}

// ==========================================
// AI CATEGORIZATION (Finance + Habits)
// ==========================================

async function processWithAI(input: string) {
  const today = getVNDate();
  const prompt = `Bạn là trợ lý FinHabit. Phân tích tin nhắn và trả về JSON.

PHÂN LOẠI:
1. GIAO DỊCH (type: 'transaction'): 
   - 'expense': Ăn uống, Di chuyển, Mua sắm, Sức khỏe, ...
   - 'income': Lương, Freelance, Quà tặng, ...
   - 'saving': Tiết kiệm, Đầu tư.
2. THÓI QUEN (type: 'habit'): 
   - Ví dụ: "Chạy bộ 5km", "Đã đọc sách 30p", "Uống nước".
   - Trả về 'habit_name' (tên thói quen) và 'value' (số lượng).

TRẢ VỀ JSON (không backticks):
{
  "type": "transaction" | "habit" | "unknown",
  "data": {
    "title": "string (cho giao dịch)",
    "amount": number (cho giao dịch),
    "category": "string",
    "tx_type": "expense|income|saving",
    "habit_name": "string (cho thói quen)",
    "value": number (cho thói quen, mặc định 1 nếu không rõ)
  },
  "message": "phản hồi thân thiện 1 câu có emoji"
}

Tin nhắn: "${input}"
Ngày: ${today}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

// ==========================================
// MAIN HANDLER
// ==========================================
Deno.serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = await req.json();
    const message = body?.message;
    if (!message?.text || !message?.from?.id) return new Response("OK", { status: 200 });

    const chatId: number = message.chat.id;
    const msgId: number = message.message_id;
    const text: string = message.text.trim();
    const firstName: string = message.from?.first_name || "bạn";
    const chatType: string = message.chat?.type || "private";
    const inGroup = isGroup(chatType);
    const cmd = text.replace(/@\w+/, "").trim();

    // =====================
    // /start, /help, /status, /today, /month (Giữ nguyên hoặc cập nhật)
    // =====================
    if (cmd === "/start") {
      await sendTelegram(chatId, `🎉 Chào <b>${firstName}</b>!\n\nMình là Robot FinHabit.\n📝 Nhắn: <i>"Phở 50k"</i> hoặc <i>"Chạy bộ 5km"</i> để mình ghi nhé!`);
      return new Response("OK", { status: 200 });
    }

    if (cmd === "/status") {
      const { data: authData } = await supabase.auth.admin.getUserById(FINHABIT_USER_ID);
      const initial = Number(authData?.user?.user_metadata?.initial_balance || 0);
      const { data: txs } = await supabase.from("transactions").select("amount, type").eq("user_id", FINHABIT_USER_ID);
      let e = 0, i = 0, s = 0;
      (txs || []).forEach((t: any) => {
        if (t.type === "expense") e += t.amount; else if (t.type === "income") i += t.amount; else s += t.amount;
      });
      await sendTelegram(chatId, `🏦 <b>Số dư:</b> <code>${formatVND(initial + i - e - s)}</code>\n💸 <b>Chi:</b> ${formatVND(e)}\n🐷 <b>Tiết kiệm:</b> ${formatVND(s)}`, inGroup ? msgId : undefined);
      return new Response("OK", { status: 200 });
    }

    // =====================
    // /habits (Xem thói quen hôm nay)
    // =====================
    if (cmd === "/habits") {
      const today = getVNDate();
      const { data: habits } = await supabase.from("habits").select("*").eq("user_id", FINHABIT_USER_ID);
      const { data: logs } = await supabase.from("habit_logs").select("*").eq("user_id", FINHABIT_USER_ID).eq("date", today);

      if (!habits || habits.length === 0) {
        await sendTelegram(chatId, `🌿 Bạn chưa tạo thói quen nào trên Web cả!`, inGroup ? msgId : undefined);
        return new Response("OK", { status: 200 });
      }

      const report = habits.map((h: any) => {
        const log = logs?.find((l: any) => l.habit_id === h.id);
        const progress = log ? Math.min(100, Math.round((log.value / h.goal_value) * 100)) : 0;
        const icon = progress >= 100 ? "✅" : "⏳";
        return `${icon} <b>${h.name}</b>: ${log?.value || 0}/${h.goal_value} ${h.unit} (${progress}%)`;
      });

      await sendTelegram(chatId, `🔥 <b>THÓI QUEN HÔM NAY</b>\n\n${report.join("\n")}`, inGroup ? msgId : undefined);
      return new Response("OK", { status: 200 });
    }

    // Bỏ qua rác trong nhóm
    if (inGroup && !cmd.startsWith("/")) {
      const isAction = /\d/.test(text) || /(đã|xong|rồi|nước|sách|gym|chạy)/i.test(text);
      if (!isAction) return new Response("OK", { status: 200 });
    }

    // =====================
    // XỬ LÝ AI
    // =====================
    await sendTyping(chatId);
    const result = await processWithAI(text);
    if (!result || result.type === "unknown") {
      if (!inGroup) await sendTelegram(chatId, "🤔 Mình chưa hiểu ý bạn lắm.");
      return new Response("OK", { status: 200 });
    }

    // Case 1: Ghi giao dịch tài chính
    if (result.type === "transaction") {
      const { error } = await supabase.from("transactions").insert({
        user_id: FINHABIT_USER_ID,
        title: result.data.title,
        amount: result.data.amount,
        category: result.data.category,
        type: result.data.tx_type,
        date: getVNDate(),
      });
      if (error) throw error;
      const emoji = result.data.tx_type === "income" ? "💰" : result.data.tx_type === "saving" ? "🐷" : "💸";
      await sendTelegram(chatId, `✅ <b>${firstName}</b> đã ghi:\n${emoji} ${result.data.title}: ${formatVND(result.data.amount)}`, inGroup ? msgId : undefined);
    } 
    
    // Case 2: Ghi thói quen
    else if (result.type === "habit") {
      const habitName = result.data.habit_name.toLowerCase();
      // Tìm thói quen tương ứng trong DB
      const { data: habits } = await supabase.from("habits").select("*").eq("user_id", FINHABIT_USER_ID);
      const habit = habits?.find((h: any) => h.name.toLowerCase().includes(habitName) || habitName.includes(h.name.toLowerCase()));

      if (!habit) {
        await sendTelegram(chatId, `🤷‍♂️ Mình không tìm thấy thói quen "<b>${result.data.habit_name}</b>" trên Web. Bạn tạo trước nhé!`, inGroup ? msgId : undefined);
        return new Response("OK", { status: 200 });
      }

      const today = getVNDate();
      const { data: existingLog } = await supabase.from("habit_logs").select("*").eq("habit_id", habit.id).eq("date", today).single();

      const newValue = (existingLog?.value || 0) + result.data.value;
      const { error } = await supabase.from("habit_logs").upsert({
        id: existingLog?.id,
        habit_id: habit.id,
        user_id: FINHABIT_USER_ID,
        date: today,
        value: newValue
      });

      if (error) throw error;
      const progress = Math.min(100, Math.round((newValue / habit.goal_value) * 100));
      await sendTelegram(chatId, `✅ <b>${firstName}</b> — Đã cập nhật thói quen!\n\n🌿 <b>${habit.name}</b>: +${result.data.value} ${habit.unit}\n📈 Tiến độ: ${newValue}/${habit.goal_value} (${progress}%)\n\n💬 ${result.message}`, inGroup ? msgId : undefined);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("OK", { status: 200 });
  }
});
