// Supabase Edge Function: telegram-webhook
// Dùng chung 1 tài khoản (FINHABIT_USER_ID) — phù hợp gia đình/bạn bè
// Ai nhắn cũng ghi vào cùng 1 account, không cần đăng nhập

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
// AI CATEGORIZATION
// ==========================================

async function categorizeWithAI(input: string) {
  const today = getVNDate();
  const prompt = `Bạn là trợ lý tài chính FinHabit. Phân tích tin nhắn và trả về JSON.

DANH MỤC:
- Chi tiêu (expense): 'Ăn uống', 'Di chuyển', 'Nhà cửa & Hóa đơn', 'Mua sắm', 'Sức khỏe', 'Giải trí & Quan hệ', 'Học tập & Phát triển', 'Chi tiêu khác'
- Thu nhập (income): 'Lương & Thưởng', 'Làm thêm (Freelance)', 'Quà tặng & Thu nhập khác', 'Lãi & Cổ tức'
- Tiết kiệm (saving): 'Quỹ dự phòng', 'Tích lũy dài hạn', 'Đầu tư', 'Bỏ heo/Tiết kiệm tự do'

QUY TẮC: "30k"=30000, "1tr"=1000000. Số đơn lẻ < 1000 → nhân 1000.

TRẢ VỀ JSON (không backticks):
{"title":"string","amount":number,"category":"string","type":"expense|income|saving","message":"phản hồi thân thiện 1-2 câu có emoji"}

Nếu không hiểu: {"title":"","amount":0,"category":"","type":"unknown","message":"hướng dẫn"}

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

function fallbackCategorize(input: string) {
  const lower = input.toLowerCase();
  let amount = 0;
  const trM = lower.match(/([\d.,]+)\s*tr(iệu)?/);
  const kM = lower.match(/([\d.,]+)\s*k/);
  if (trM) amount = parseFloat(trM[1].replace(",", ".")) * 1000000;
  else if (kM) amount = parseFloat(kM[1].replace(",", ".")) * 1000;
  else { const n = lower.match(/(\d+)/); if (n) { const v = parseInt(n[1]); amount = v < 1000 ? v * 1000 : v; } }

  let type: "income" | "expense" | "saving" = "expense";
  let category = "Chi tiêu khác";
  const title = input.replace(/[\d.,]+\s*(k|tr|triệu|đ|dong|đồng)?/gi, "").trim() || input;

  if (/(lương|thưởng|nhận|thu nhập|lãi)/i.test(lower)) { type = "income"; category = "Lương & Thưởng"; }
  else if (/(tiết kiệm|gửi|quỹ|tích lũy|đầu tư)/i.test(lower)) { type = "saving"; category = "Bỏ heo/Tiết kiệm tự do"; }
  else if (/(ăn|uống|cà phê|cafe|phở|cơm|bún|bánh|sáng|trưa|tối|nhậu)/i.test(lower)) category = "Ăn uống";
  else if (/(xăng|grab|taxi|xe|gửi xe|đi lại)/i.test(lower)) category = "Di chuyển";
  else if (/(mua|áo|quần|giày|sắm)/i.test(lower)) category = "Mua sắm";
  else if (/(thuốc|khám|gym|tập)/i.test(lower)) category = "Sức khỏe";
  else if (/(điện|nước|nhà|trọ|wifi|internet)/i.test(lower)) category = "Nhà cửa & Hóa đơn";
  else if (/(phim|chơi|giải trí|karaoke)/i.test(lower)) category = "Giải trí & Quan hệ";
  else if (/(học|sách|khóa)/i.test(lower)) category = "Học tập & Phát triển";

  return { title: title.charAt(0).toUpperCase() + title.slice(1), amount, category, type, message: "" };
}

// ==========================================
// MAIN HANDLER
// ==========================================
Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", service: "FinHabit Bot" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

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

    // Xóa @botname khỏi lệnh
    const cmd = text.replace(/@\w+/, "").trim();

    // =====================
    // /start
    // =====================
    if (cmd === "/start") {
      if (inGroup) {
        await sendTelegram(chatId,
          `👋 <b>Chào cả nhà!</b>\n\n` +
          `Mình là Robot FinHabit — trợ lý tài chính chung.\n\n` +
          `💸 Mọi người cứ nhắn giao dịch tự nhiên:\n` +
          `• <code>Ăn sáng 30k</code>\n` +
          `• <code>Tiền điện 500k</code>\n` +
          `• <code>Nhận lương 15tr</code>\n\n` +
          `📊 Xem tổng: /today · /month\n` +
          `📖 Trợ giúp: /help`,
          msgId
        );
      } else {
        await sendTelegram(chatId,
          `🎉 Chào <b>${firstName}</b>!\n\n` +
          `Mình là <b>Robot FinHabit</b> — trợ lý tài chính cá nhân.\n\n` +
          `📝 Nhắn tự nhiên:\n` +
          `• <code>Ăn sáng 30k</code> → Ghi chi tiêu\n` +
          `• <code>Nhận lương 15tr</code> → Ghi thu nhập\n` +
          `• <code>Tiết kiệm 1tr</code> → Ghi tiết kiệm\n\n` +
          `📊 Xem dữ liệu: /today · /month\n` +
          `📖 Trợ giúp: /help\n\n` +
          `💡 Thêm bot vào nhóm bạn bè để cùng nhập!`
        );
      }
      return new Response("OK", { status: 200 });
    }

    // =====================
    // /help
    // =====================
    if (cmd === "/help") {
      await sendTelegram(chatId,
        `📖 <b>Hướng dẫn FinHabit Bot</b>\n\n` +
        `<b>💸 Ghi chi tiêu:</b>\n` +
        `• <code>Ăn trưa 50k</code>\n` +
        `• <code>Đổ xăng 200k</code>\n` +
        `• <code>Tiền trọ 3tr</code>\n\n` +
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
    // /today
    // =====================
    if (cmd === "/today") {
      const today = getVNDate();
      const { data: txs } = await supabase
        .from("transactions").select("title, amount, type")
        .eq("user_id", FINHABIT_USER_ID).eq("date", today);

      if (!txs || txs.length === 0) {
        await sendTelegram(chatId, `📅 Hôm nay chưa có giao dịch nào. 😊`, inGroup ? msgId : undefined);
        return new Response("OK", { status: 200 });
      }

      let tE = 0, tI = 0, tS = 0;
      const lines = txs.map((t: any) => {
        const e = t.type === "income" ? "💰" : t.type === "saving" ? "🐷" : "💸";
        if (t.type === "expense") tE += t.amount;
        else if (t.type === "income") tI += t.amount;
        else tS += t.amount;
        return `${e} ${t.title}: ${formatVND(t.amount)}`;
      });

      await sendTelegram(chatId,
        `📅 <b>Hôm nay</b> (${today})\n\n` + lines.join("\n") + "\n\n" +
        `━━━━━━━━━━━━━━\n` +
        `💸 Chi: <b>${formatVND(tE)}</b>\n` +
        `💰 Thu: <b>${formatVND(tI)}</b>\n` +
        `🐷 TK: <b>${formatVND(tS)}</b>`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // =====================
    // /month
    // =====================
    if (cmd === "/month") {
      const today = getVNDate();
      const [year, month] = today.split("-");
      const start = `${year}-${month}-01`;
      const last = new Date(parseInt(year), parseInt(month), 0).getDate();
      const end = `${year}-${month}-${String(last).padStart(2, "0")}`;

      const { data: txs } = await supabase
        .from("transactions").select("amount, type")
        .eq("user_id", FINHABIT_USER_ID).gte("date", start).lte("date", end);

      let tE = 0, tI = 0, tS = 0;
      (txs || []).forEach((t: any) => {
        if (t.type === "expense") tE += t.amount;
        else if (t.type === "income") tI += t.amount;
        else tS += t.amount;
      });

      await sendTelegram(chatId,
        `📊 <b>Tháng ${month}/${year}</b>\n\n` +
        `📝 Giao dịch: <b>${txs?.length || 0}</b>\n` +
        `💰 Thu: <b>${formatVND(tI)}</b>\n` +
        `💸 Chi: <b>${formatVND(tE)}</b>\n` +
        `🐷 TK: <b>${formatVND(tS)}</b>\n\n` +
        `💵 Còn lại: <b>${formatVND(tI - tE - tS)}</b>`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // =====================
    // /status (Số dư & Tổng quan)
    // =====================
    if (cmd === "/status") {
      await sendTyping(chatId);

      // 1. Lấy số dư ban đầu từ Metadata
      const { data: authData } = await supabase.auth.admin.getUserById(FINHABIT_USER_ID);
      const initialBalance = Number(authData?.user?.user_metadata?.initial_balance || 0);

      // 2. Tính tổng các loại giao dịch
      const { data: allTxs } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", FINHABIT_USER_ID);

      let totalExpense = 0, totalIncome = 0, totalSaving = 0;
      (allTxs || []).forEach((t: any) => {
        if (t.type === "expense") totalExpense += t.amount;
        else if (t.type === "income") totalIncome += t.amount;
        else if (t.type === "saving") totalSaving += t.amount;
      });

      const currentBalance = initialBalance + totalIncome - totalExpense - totalSaving;

      await sendTelegram(chatId,
        `🏦 <b>TÌNH HÌNH TÀI CHÍNH</b>\n` +
        `━━━━━━━━━━━━━━\n\n` +
        `💰 <b>Số dư hiện tại:</b>\n` +
        `└ <code>${formatVND(currentBalance)}</code>\n\n` +
        `💸 <b>Tổng chi tiêu:</b>\n` +
        `└ <code>${formatVND(totalExpense)}</code>\n\n` +
        `🐷 <b>Tổng tiết kiệm:</b>\n` +
        `└ <code>${formatVND(totalSaving)}</code>\n\n` +
        `📈 <b>Tổng thu nhập:</b>\n` +
        `└ <code>${formatVND(totalIncome)}</code>\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `💡 <i>Dữ liệu đồng bộ với web FinHabit.</i>`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // =====================
    // Bỏ qua chat thường trong nhóm
    // =====================
    if (inGroup && !cmd.startsWith("/")) {
      const looksLikeTx = /\d+\s*(k|tr|triệu|đ|đồng)/i.test(text) || /\d{2,}/.test(text);
      if (!looksLikeTx) return new Response("OK", { status: 200 });
    }

    // =====================
    // Xử lý giao dịch
    // =====================
    await sendTyping(chatId);

    let result = await categorizeWithAI(text);
    if (!result || !result.title) result = fallbackCategorize(text);

    if (result.type === "unknown" || !result.amount || result.amount <= 0) {
      if (inGroup) return new Response("OK", { status: 200 });
      await sendTelegram(chatId, result.message || `🤔 Thử: <code>Ăn sáng 30k</code>`);
      return new Response("OK", { status: 200 });
    }

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
      await sendTelegram(chatId, `❌ Lỗi lưu. Thử lại!`, inGroup ? msgId : undefined);
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
    console.error("Error:", err);
    return new Response("Internal Error", { status: 500 });
  }
});
