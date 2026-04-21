// Supabase Edge Function: telegram-webhook
// Bot FinHabit — Quản lý tài chính qua Telegram

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

function getStartOfMonth(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
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
// AI CATEGORIZATION
// ==========================================

async function categorizeWithAI(input: string) {
  const prompt = `Bạn là trợ lý tài chính Việt Nam. Phân tích giao dịch từ tin nhắn.

QUY TẮC SỐ TIỀN:
- "30k" = 30.000 VND
- "1tr" hoặc "1 triệu" = 1.000.000 VND
- "500" (số lẻ 3 chữ số trở xuống) = nhân 1000, tức 500.000 VND
- "1500" = 1.500.000 VND (nếu không có đơn vị)

LOẠI GIAO DỊCH:
- expense: ăn uống, cà phê, grab, mua sắm, hóa đơn, sửa xe, thuốc...
- income: lương, freelance, thưởng, được cho tiền...
- saving: tiết kiệm, gửi quỹ, đầu tư...

DANH MỤC: Ăn uống, Di chuyển, Mua sắm, Giải trí, Sức khỏe, Học tập & Phát triển, Hóa đơn & Dịch vụ, Tiết kiệm, Lương, Thu nhập khác, Chi tiêu khác

Trả về JSON (không backticks):
{
  "title": "tên giao dịch ngắn gọn",
  "amount": số tiền (number, đơn vị VND),
  "category": "danh mục",
  "type": "expense|income|saving",
  "message": "phản hồi thân thiện 1 câu có emoji"
}

Tin nhắn: "${input}"`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
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
    
    if (data.error) {
      console.error("AI API Error:", data.error);
      return null;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch (e) {
    console.error("AI Error:", e);
  }
  return null;
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
    // /start
    // =====================
    if (cmd === "/start") {
      await sendTelegram(chatId,
        `🎉 Chào <b>${firstName}</b>!\n\n` +
        `Mình là <b>FinHabit Bot</b> — trợ lý tài chính của bạn.\n\n` +
        `📝 Chỉ cần nhắn tin tự nhiên, mình sẽ ghi lại giúp!\n\n` +
        `<b>💸 Ghi chi tiêu:</b>\n` +
        `• <code>Ăn phở 50k</code>\n` +
        `• <code>Grab 30k</code>\n` +
        `• <code>Cà phê 25k</code>\n\n` +
        `<b>💰 Ghi thu nhập:</b>\n` +
        `• <code>Nhận lương 15tr</code>\n` +
        `• <code>Freelance 2tr</code>\n\n` +
        `<b>🐷 Ghi tiết kiệm:</b>\n` +
        `• <code>Tiết kiệm 1tr</code>\n` +
        `• <code>Gửi quỹ dự phòng 500k</code>\n\n` +
        `<b>📊 Báo cáo:</b>\n` +
        `• /today — Tổng hôm nay\n` +
        `• /month — Tổng tháng này\n` +
        `• /status — Số dư & Tổng quan\n\n` +
        `<b>💡 Mẹo:</b>\n` +
        `• "30k" = 30.000đ\n` +
        `• "1tr" = 1.000.000đ\n` +
        `• "500" = 500.000đ`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // =====================
    // /help
    // =====================
    if (cmd === "/help") {
      await sendTelegram(chatId,
        `📖 <b>Hướng dẫn sử dụng FinHabit Bot</b>\n\n` +
        `Nhắn tin tự nhiên để ghi chi tiêu/thu nhập.\n\n` +
        `<b>Ví dụ:</b>\n` +
        `• <code>Ăn sáng 30k</code>\n` +
        `• <code>Lương tháng 4 15tr</code>\n` +
        `• <code>Tiết kiệm 2tr</code>\n\n` +
        `<b>Lệnh:</b>\n` +
        `• /today — Chi tiêu hôm nay\n` +
        `• /month — Chi tiêu tháng này\n` +
        `• /status — Số dư & tổng quan\n` +
        `• /help — Hướng dẫn này`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // =====================
    // /status
    // =====================
    if (cmd === "/status") {
      const { data: authData } = await supabase.auth.admin.getUserById(FINHABIT_USER_ID);
      const initial = Number(authData?.user?.user_metadata?.initial_balance || 0);
      const { data: txs } = await supabase.from("transactions").select("amount, type").eq("user_id", FINHABIT_USER_ID);

      let totalExpense = 0, totalIncome = 0, totalSaving = 0;
      (txs || []).forEach((t: any) => {
        if (t.type === "expense") totalExpense += t.amount;
        else if (t.type === "income") totalIncome += t.amount;
        else if (t.type === "saving") totalSaving += t.amount;
      });

      const balance = initial + totalIncome - totalExpense - totalSaving;

      await sendTelegram(chatId,
        `📊 <b>TỔNG QUAN TÀI CHÍNH</b>\n\n` +
        `🏦 <b>Số dư hiện tại:</b> <code>${formatVND(balance)}</code>\n\n` +
        `💸 Tổng chi: ${formatVND(totalExpense)}\n` +
        `💰 Tổng thu: ${formatVND(totalIncome)}\n` +
        `🐷 Tiết kiệm: ${formatVND(totalSaving)}`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // =====================
    // /today
    // =====================
    if (cmd === "/today") {
      const today = getVNDate();
      const { data: txs } = await supabase
        .from("transactions")
        .select("title, amount, type, category")
        .eq("user_id", FINHABIT_USER_ID)
        .eq("date", today);

      if (!txs || txs.length === 0) {
        await sendTelegram(chatId, "📭 Hôm nay chưa có giao dịch nào.", inGroup ? msgId : undefined);
        return new Response("OK", { status: 200 });
      }

      let total = 0;
      const lines = txs.map((t: any) => {
        const sign = t.type === "income" ? "+" : "-";
        total += t.type === "income" ? t.amount : -t.amount;
        const emoji = t.type === "income" ? "💰" : t.type === "saving" ? "🐷" : "💸";
        return `${emoji} ${t.title}: ${sign}${formatVND(t.amount)}`;
      });

      await sendTelegram(chatId,
        `📅 <b>HÔM NAY</b> (${today})\n\n` +
        lines.join("\n") +
        `\n\n📊 <b>Tổng:</b> ${formatVND(Math.abs(total))}`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // =====================
    // /month
    // =====================
    if (cmd === "/month") {
      const startOfMonth = getStartOfMonth();
      const { data: txs } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", FINHABIT_USER_ID)
        .gte("date", startOfMonth);

      let expense = 0, income = 0, saving = 0;
      (txs || []).forEach((t: any) => {
        if (t.type === "expense") expense += t.amount;
        else if (t.type === "income") income += t.amount;
        else saving += t.amount;
      });

      await sendTelegram(chatId,
        `📆 <b>THÁNG NÀY</b>\n\n` +
        `💸 Chi tiêu: ${formatVND(expense)}\n` +
        `💰 Thu nhập: ${formatVND(income)}\n` +
        `🐷 Tiết kiệm: ${formatVND(saving)}\n\n` +
        `📊 <b>Còn lại:</b> ${formatVND(income - expense - saving)}`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // =====================
    // Bỏ qua rác trong nhóm
    // =====================
    if (inGroup && !cmd.startsWith("/")) {
      const hasNumber = /\d/.test(text);
      const hasKeyword = /(ăn|uống|mua|trả|nạp|đổ|gửi|nhận|lương|tiền|phí|vé|grab|shopee|cafe|cà phê|tiết kiệm|freelance)/i.test(text);
      if (!hasNumber && !hasKeyword) return new Response("OK", { status: 200 });
    }

    // =====================
    // XỬ LÝ AI — Ghi giao dịch
    // =====================
    await sendTyping(chatId);
    const result = await categorizeWithAI(text);

    if (!result) {
      if (!inGroup) {
        await sendTelegram(chatId, `❌ Lỗi: Hệ thống AI không phản hồi hoặc đang bận. Vui lòng thử lại sau giây lát.`);
      }
      return new Response("OK", { status: 200 });
    }

    if (!result.amount || result.amount <= 0) {
      if (!inGroup) {
        await sendTelegram(chatId,
          `🤔 Mình chưa hiểu ý bạn lắm.\n\n` +
          `💡 Thử nhắn kiểu:\n` +
          `• <code>Ăn trưa 50k</code>\n` +
          `• <code>Grab đi làm 30k</code>\n` +
          `• <code>Lương tháng 4 15tr</code>`
        );
      }
      return new Response("OK", { status: 200 });
    }

    // Lưu vào DB
    const { error } = await supabase.from("transactions").insert({
      user_id: FINHABIT_USER_ID,
      title: result.title,
      amount: result.amount,
      category: result.category,
      type: result.type,
      date: getVNDate(),
    });

    if (error) {
      console.error("DB Error:", error);
      await sendTelegram(chatId, `❌ Lỗi lưu vào cơ sở dữ liệu: ${error.message}`, inGroup ? msgId : undefined);
      return new Response("OK", { status: 200 });
    }


    const emoji = result.type === "income" ? "💰" : result.type === "saving" ? "🐷" : "💸";
    const label = result.type === "income" ? "Thu nhập" : result.type === "saving" ? "Tiết kiệm" : "Chi tiêu";
    const sign = result.type === "income" ? "+" : "-";

    let reply = inGroup ? `✅ <b>${firstName}</b> — ` : `✅ `;
    reply += `Đã ghi!\n\n`;
    reply += `${emoji} <b>${result.title}</b>\n`;
    reply += `💵 ${sign}${formatVND(result.amount)}\n`;
    reply += `📂 ${result.category} · ${label}`;
    if (result.message) reply += `\n\n💬 ${result.message}`;

    await sendTelegram(chatId, reply, inGroup ? msgId : undefined);
    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("OK", { status: 200 });
  }
});
