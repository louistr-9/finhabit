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
// PRE-DETECT: Habit vs Transaction
// ==========================================

// Từ khoá tiền tệ — nếu có thì chắc chắn là giao dịch
const MONEY_PATTERNS = /(\d+\s*k\b|\d+\s*tr\b|\d+\s*triệu|\d+\s*nghìn|\d+\s*ngàn|\d+\s*đồng|\d+đ\b|\d+\.?\d*k\b)/i;

// Từ khoá thói quen — nếu có thì ưu tiên thói quen
const HABIT_KEYWORDS = /(đọc sách|học|chạy bộ|chạy|uống nước|uống|gym|tập|thiền|yoga|ngủ|dậy sớm|viết|vẽ|nấu ăn|thói quen|meditat|exercise|read|run|walk|drink|stretching|push.?up|squat|plank)/i;

function preDetectType(text: string): "habit" | "transaction" | "unknown" {
  const hasMoney = MONEY_PATTERNS.test(text);
  const hasHabitKw = HABIT_KEYWORDS.test(text);

  // Nếu có cả 2 → ưu tiên giao dịch (vd: "mua sách 50k")
  if (hasMoney && hasHabitKw) return "transaction";
  // Chỉ có habit keyword → habit
  if (hasHabitKw) return "habit";
  // Chỉ có money → transaction
  if (hasMoney) return "transaction";

  return "unknown";
}

// ==========================================
// AI CATEGORIZATION
// ==========================================

async function categorizeTransaction(input: string) {
  const prompt = `Bạn là trợ lý tài chính. Phân tích giao dịch và trả về JSON (không backticks):
{
  "title": "tên giao dịch ngắn gọn",
  "amount": number (đơn vị VND, 30k=30000, 1tr=1000000, 500=500000),
  "category": "Ăn uống|Di chuyển|Mua sắm|Giải trí|Sức khỏe|Học tập|Hóa đơn|Tiết kiệm|Lương|Thu nhập khác|Chi tiêu khác",
  "tx_type": "expense|income|saving",
  "message": "phản hồi 1 câu thân thiện có emoji"
}
Tin nhắn: "${input}"`;

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

async function categorizeHabit(input: string) {
  const prompt = `Bạn là trợ lý thói quen. Phân tích tin nhắn và trả về JSON (không backticks):
{
  "habit_name": "tên thói quen (ví dụ: Đọc sách, Chạy bộ, Học tiếng Anh, Uống nước)",
  "value": number (số lượng, ví dụ: "30 phút" → 30, "5km" → 5, "2 ly" → 2, mặc định 1),
  "message": "phản hồi 1 câu động viên có emoji"
}
Tin nhắn: "${input}"`;

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
// HABIT MATCHING — tìm thói quen trong DB
// ==========================================

function findMatchingHabit(habits: any[], habitName: string): any | null {
  const name = habitName.toLowerCase().trim();

  // 1) Exact match
  const exact = habits.find((h: any) => h.name.toLowerCase() === name);
  if (exact) return exact;

  // 2) Partial match: DB name chứa trong input hoặc ngược lại
  const partial = habits.find((h: any) => {
    const dbName = h.name.toLowerCase();
    return dbName.includes(name) || name.includes(dbName);
  });
  if (partial) return partial;

  // 3) Keyword match: so sánh từng từ
  const words = name.split(/\s+/);
  const keyword = habits.find((h: any) => {
    const dbWords = h.name.toLowerCase().split(/\s+/);
    return words.some((w: string) => w.length > 2 && dbWords.some((dw: string) => dw.includes(w) || w.includes(dw)));
  });
  return keyword || null;
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
    // COMMANDS
    // =====================
    if (cmd === "/start") {
      await sendTelegram(chatId,
        `🎉 Chào <b>${firstName}</b>!\n\n` +
        `Mình là Robot <b>FinHabit</b> — quản lý tài chính & thói quen.\n\n` +
        `💸 <b>Ghi chi tiêu:</b> <i>"Ăn phở 50k"</i>\n` +
        `🌿 <b>Ghi thói quen:</b> <i>"Đọc sách 30 phút"</i>\n\n` +
        `📊 /status — Tổng quan tài chính\n` +
        `🔥 /habits — Thói quen hôm nay`
      );
      return new Response("OK", { status: 200 });
    }

    if (cmd === "/status") {
      const { data: authData } = await supabase.auth.admin.getUserById(FINHABIT_USER_ID);
      const initial = Number(authData?.user?.user_metadata?.initial_balance || 0);
      const { data: txs } = await supabase.from("transactions").select("amount, type").eq("user_id", FINHABIT_USER_ID);
      let e = 0, i = 0, s = 0;
      (txs || []).forEach((t: any) => {
        if (t.type === "expense") e += t.amount;
        else if (t.type === "income") i += t.amount;
        else s += t.amount;
      });
      await sendTelegram(chatId,
        `🏦 <b>Số dư:</b> <code>${formatVND(initial + i - e - s)}</code>\n` +
        `💸 <b>Chi:</b> ${formatVND(e)}\n` +
        `💰 <b>Thu:</b> ${formatVND(i)}\n` +
        `🐷 <b>Tiết kiệm:</b> ${formatVND(s)}`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    if (cmd === "/habits") {
      const today = getVNDate();
      const { data: habits } = await supabase.from("habits").select("*").eq("user_id", FINHABIT_USER_ID);
      const { data: logs } = await supabase.from("habit_logs").select("*").eq("user_id", FINHABIT_USER_ID).eq("date", today);

      if (!habits || habits.length === 0) {
        await sendTelegram(chatId, `🌿 Bạn chưa tạo thói quen nào trên Web cả!\nTruy cập FinHabit Web để tạo nhé.`, inGroup ? msgId : undefined);
        return new Response("OK", { status: 200 });
      }

      const report = habits.map((h: any) => {
        const log = logs?.find((l: any) => l.habit_id === h.id);
        const logValue = Number(log?.value) || 0;
        const goalValue = Number(h.goal_value) || 1;
        const progress = Math.min(100, Math.round((logValue / goalValue) * 100));
        const icon = progress >= 100 ? "✅" : progress > 0 ? "🔥" : "⏳";
        return `${icon} <b>${h.name}</b>: ${logValue}/${goalValue} ${h.unit} (${progress}%)`;
      });

      await sendTelegram(chatId, `🔥 <b>THÓI QUEN HÔM NAY</b>\n\n${report.join("\n")}`, inGroup ? msgId : undefined);
      return new Response("OK", { status: 200 });
    }

    // Bỏ qua rác trong nhóm
    if (inGroup && !cmd.startsWith("/")) {
      const isAction = /\d/.test(text) || HABIT_KEYWORDS.test(text) || MONEY_PATTERNS.test(text);
      if (!isAction) return new Response("OK", { status: 200 });
    }

    // =====================
    // SMART ROUTING: Pre-detect trước, gọi AI chuyên biệt sau
    // =====================
    await sendTyping(chatId);
    const detected = preDetectType(text);
    console.log(`[PRE-DETECT] "${text}" → ${detected}`);

    // --- HABIT ---
    if (detected === "habit") {
      const aiResult = await categorizeHabit(text);
      if (!aiResult) {
        if (!inGroup) await sendTelegram(chatId, "🤔 Mình chưa hiểu ý bạn lắm. Thử lại nhé!");
        return new Response("OK", { status: 200 });
      }

      const { data: habits } = await supabase.from("habits").select("*").eq("user_id", FINHABIT_USER_ID);
      const habit = findMatchingHabit(habits || [], aiResult.habit_name);

      if (!habit) {
        await sendTelegram(chatId,
          `🤷 Không tìm thấy thói quen "<b>${aiResult.habit_name}</b>" trong danh sách.\n\n` +
          `📋 Thói quen hiện có:\n${(habits || []).map((h: any) => `• ${h.name}`).join("\n") || "(trống)"}\n\n` +
          `💡 Hãy tạo thói quen trên Web trước nhé!`,
          inGroup ? msgId : undefined
        );
        return new Response("OK", { status: 200 });
      }

      const today = getVNDate();
      const { data: existingLog } = await supabase.from("habit_logs").select("*").eq("habit_id", habit.id).eq("date", today).single();

      const addedValue = Number(aiResult.value) || 1;
      const newValue = (Number(existingLog?.value) || 0) + addedValue;

      const { error } = await supabase.from("habit_logs").upsert({
        id: existingLog?.id,
        habit_id: habit.id,
        user_id: FINHABIT_USER_ID,
        date: today,
        value: newValue,
      });

      if (error) throw error;

      const goalValue = Number(habit.goal_value) || 1;
      const progress = Math.min(100, Math.round((newValue / goalValue) * 100));
      const progressBar = progress >= 100 ? "🎉 HOÀN THÀNH!" : `${progress}%`;

      await sendTelegram(chatId,
        `✅ ${inGroup ? `<b>${firstName}</b> — ` : ""}Đã ghi thói quen!\n\n` +
        `🌿 <b>${habit.name}</b>: +${addedValue} ${habit.unit}\n` +
        `📈 Tiến độ: ${newValue}/${goalValue} ${habit.unit} (${progressBar})\n\n` +
        `💬 ${aiResult.message || "Tiếp tục cố gắng nhé! 💪"}`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // --- TRANSACTION ---
    if (detected === "transaction") {
      const aiResult = await categorizeTransaction(text);
      if (!aiResult) {
        if (!inGroup) await sendTelegram(chatId, "🤔 Mình chưa hiểu ý bạn lắm. Thử lại nhé!");
        return new Response("OK", { status: 200 });
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: FINHABIT_USER_ID,
        title: aiResult.title,
        amount: aiResult.amount,
        category: aiResult.category,
        type: aiResult.tx_type,
        date: getVNDate(),
      });

      if (error) throw error;

      const emoji = aiResult.tx_type === "income" ? "💰" : aiResult.tx_type === "saving" ? "🐷" : "💸";
      const label = aiResult.tx_type === "income" ? "Thu nhập" : aiResult.tx_type === "saving" ? "Tiết kiệm" : "Chi tiêu";
      const sign = aiResult.tx_type === "income" ? "+" : "-";

      await sendTelegram(chatId,
        `✅ ${inGroup ? `<b>${firstName}</b> — ` : ""}Đã ghi!\n\n` +
        `${emoji} <b>${aiResult.title}</b>\n` +
        `💵 ${sign}${formatVND(aiResult.amount)}\n` +
        `📂 ${aiResult.category} · ${label}`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // --- UNKNOWN: gửi cho AI chung phân loại ---
    if (!inGroup) {
      await sendTelegram(chatId,
        `🤔 Mình chưa hiểu ý bạn lắm.\n\n` +
        `💡 <b>Thử nhắn:</b>\n` +
        `• <i>"Ăn trưa 50k"</i> — ghi chi tiêu\n` +
        `• <i>"Đọc sách 30 phút"</i> — ghi thói quen\n` +
        `• /habits — xem thói quen hôm nay\n` +
        `• /status — xem tài chính`
      );
    }
    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});
