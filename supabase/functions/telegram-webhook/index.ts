// Supabase Edge Function: telegram-webhook
// Group → owner account | Private → linked account | Full AI parity

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const OWNER_USER_ID = Deno.env.get("FINHABIT_USER_ID")!;

function getVNDate() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}
function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}
function isGroup(t: string) { return t === "group" || t === "supergroup"; }

async function sendMsg(chatId: number, text: string, replyTo?: number) {
  const body: Record<string, unknown> = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyTo) body.reply_to_message_id = replyTo;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
async function sendTyping(chatId: number) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

type Supabase = ReturnType<typeof createClient>;
type ChatTurn = { role: string; content: string };

async function getLinkedUserId(sb: Supabase, chatId: number): Promise<{ userId: string; history: ChatTurn[] } | null> {
  const { data } = await sb.from("telegram_users").select("user_id, chat_history").eq("telegram_chat_id", chatId).single();
  if (!data) return null;
  return { userId: data.user_id, history: data.chat_history || [] };
}

async function saveHistory(sb: Supabase, chatId: number, history: ChatTurn[]) {
  await sb.from("telegram_users").update({ chat_history: history.slice(-12) }).eq("telegram_chat_id", chatId);
}

async function getHabits(sb: Supabase, userId: string) {
  const today = getVNDate();
  const { data: habits } = await sb.from("habits").select("id,name,goal_value,unit,icon,color").eq("user_id", userId).order("created_at");
  if (!habits?.length) return [];
  const { data: logs } = await sb.from("habit_logs").select("habit_id,current_value,completed").eq("date", today).in("habit_id", habits.map(h => h.id));
  const logMap = new Map(logs?.map(l => [l.habit_id, l]) ?? []);
  return habits.map(h => ({
    id: h.id, name: h.name,
    goal_value: h.goal_value ?? 1, unit: h.unit ?? "lần",
    icon: h.icon ?? "Target", color: h.color ?? "text-indigo-500",
    current_value: logMap.get(h.id)?.current_value ?? 0,
    completed: logMap.get(h.id)?.completed ?? false,
  }));
}

async function getFinCtx(sb: Supabase, userId: string) {
  const today = getVNDate();
  const [year, month] = today.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  const { data: txs } = await sb.from("transactions").select("amount,type,category").eq("user_id", userId).gte("date", start).lte("date", end);
  if (!txs?.length) return "(Chưa có giao dịch nào tháng này)";
  const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const saving = txs.filter(t => t.type === "saving").reduce((s, t) => s + t.amount, 0);
  const catMap = new Map<string, number>();
  txs.filter(t => t.type === "expense").forEach(t => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount));
  const top = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, a]) => `${c}: ${(a / 1000).toFixed(0)}k`).join(", ");
  return `Tháng ${month}/${year} — Thu: ${(income / 1e6).toFixed(1)}tr | Chi: ${(expense / 1e6).toFixed(1)}tr | Tiết kiệm: ${(saving / 1e6).toFixed(1)}tr. Top chi: ${top || "chưa có"}.`;
}

async function callAI(input: string, habits: Awaited<ReturnType<typeof getHabits>>, finCtx: string, history: ChatTurn[]) {
  const today = getVNDate();
  const habitStr = habits.length
    ? habits.map(h => `- id="${h.id}" | "${h.name}" | Mục tiêu: ${h.goal_value} ${h.unit} | Đã làm: ${h.current_value}${h.completed ? " ✓" : ""}`).join("\n")
    : "(Chưa có thói quen nào)";
  const histStr = history.slice(-6).length
    ? "\n\nLỊCH SỬ:\n" + history.slice(-6).map(t => `[${t.role === "user" ? "User" : "Bot"}]: ${t.content}`).join("\n")
    : "";

  const prompt = `Bạn là "Robot FinHabit" – trợ lý AI thân thiện quản lý tài chính & thói quen.
PHONG CÁCH: Tiếng Việt tự nhiên, dí dỏm, 1-2 emoji, câu ngắn gọn. Nhớ lịch sử hội thoại.

DỮ LIỆU TÀI CHÍNH: ${finCtx}
THÓI QUEN: ${habitStr}${histStr}

PHÂN TÍCH 5 loại:
1. Tiến độ thói quen: "chạy bộ 3km", "đọc sách 15 trang", "hoàn thành gym"
2. Nhiều giao dịch: "sáng cà phê 25k, trưa cơm 45k"
3. 1 giao dịch: "ăn sáng 30k", "nhận lương 10tr"
4. Thêm thói quen mới: "thêm thói quen đọc sách"
5. Chat/tư vấn/tâm sự → type "chat"

QUY TẮC: 25k=25000, 1.5tr=1500000. ≥2 giao dịch → batch_transaction. "xong"/"hoàn thành" không số → current_value=goal_value.

DANH MỤC expense: Ăn uống, Di chuyển, Nhà cửa & Hóa đơn, Mua sắm, Sức khỏe, Giải trí & Quan hệ, Học tập & Phát triển, Chi tiêu khác
DANH MỤC income: Lương & Thưởng, Làm thêm (Freelance), Quà tặng & Thu nhập khác, Lãi & Cổ tức
DANH MỤC saving: Quỹ dự phòng, Tích lũy dài hạn, Đầu tư, Bỏ heo/Tiết kiệm tự do

JSON THUẦN (không backtick):
habit_progress: {"type":"habit_progress","message":"...","data":[{"habit_id":"...","habit_name":"...","current_value":0,"goal_value":0,"unit":"...","icon":"...","color":"..."}]}
batch_transaction: {"type":"batch_transaction","message":"...","data":[{"title":"...","amount":0,"category":"...","transactionType":"expense","date":"${today}"}]}
transaction: {"type":"transaction","message":"...","data":{"title":"...","amount":0,"category":"...","transactionType":"expense","date":"${today}"}}
habit: {"type":"habit","message":"...","data":{"name":"...","goal_value":0,"unit":"...","group_name":"...","icon":"...","color":"..."}}
chat: {"type":"chat","message":"..."}
unknown: {"type":"unknown","message":"Xin lỗi, mình chưa hiểu 😅"}

Câu nói: "${input}"`;

  const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
    method: "POST", 
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({ 
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Bạn là Robot FinHabit. Luôn phản hồi bằng JSON thuần." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data?.choices?.[0]?.message?.content || "";
  return JSON.parse(text);
}

async function execute(sb: Supabase, userId: string, result: Record<string, unknown>): Promise<string> {
  const today = getVNDate();

  if (result.type === "transaction") {
    const d = result.data as Record<string, unknown>;
    const { error } = await sb.from("transactions").insert({ user_id: userId, title: d.title, amount: d.amount, category: d.category, type: d.transactionType, date: today });
    if (error) throw error;
    const emoji = d.transactionType === "income" ? "💰" : d.transactionType === "saving" ? "🐷" : "💸";
    const sign = d.transactionType === "income" ? "+" : "-";
    const label = d.transactionType === "income" ? "Thu nhập" : d.transactionType === "saving" ? "Tiết kiệm" : "Chi tiêu";
    return `✅ Đã ghi!\n\n${emoji} <b>${d.title}</b>\n💵 ${sign}${formatVND(d.amount as number)}\n📂 ${d.category} · ${label}\n\n💬 ${result.message}`;
  }

  if (result.type === "batch_transaction") {
    const items = result.data as Record<string, unknown>[];
    await sb.from("transactions").insert(items.map(t => ({ user_id: userId, title: t.title, amount: t.amount, category: t.category, type: t.transactionType, date: today })));
    const lines = items.map(t => `${t.transactionType === "income" ? "💰" : t.transactionType === "saving" ? "🐷" : "💸"} ${t.title}: ${formatVND(t.amount as number)}`);
    return `✅ Đã ghi ${items.length} giao dịch!\n\n${lines.join("\n")}\n\n💬 ${result.message}`;
  }

  if (result.type === "habit_progress") {
    const items = result.data as Record<string, unknown>[];
    for (const item of items) {
      const safe = Math.min(item.current_value as number, item.goal_value as number);
      await sb.from("habit_logs").upsert(
        { habit_id: item.habit_id, user_id: userId, date: today, current_value: safe, completed: safe >= (item.goal_value as number) },
        { onConflict: "habit_id,date" }
      );
    }
    const lines = items.map(i => `${(i.current_value as number) >= (i.goal_value as number) ? "✅" : "🔄"} ${i.habit_name}: ${i.current_value}/${i.goal_value} ${i.unit}`);
    return `✅ Cập nhật tiến độ!\n\n${lines.join("\n")}\n\n💬 ${result.message}`;
  }

  if (result.type === "habit") {
    const d = result.data as Record<string, unknown>;
    await sb.from("habits").insert({ user_id: userId, name: d.name, goal_value: d.goal_value, unit: d.unit, group_name: d.group_name, icon: d.icon, color: d.color, frequency: { type: "daily" } });
    return `✅ Đã thêm thói quen!\n\n🎯 <b>${d.name}</b> — ${d.goal_value} ${d.unit}/ngày\n\n💬 ${result.message}`;
  }

  return `💬 ${result.message || "🤔 Mình chưa hiểu ý bạn lắm!"}`;
}

// Commands
async function cmdToday(sb: Supabase, userId: string, chatId: number, replyTo?: number) {
  const today = getVNDate();
  const { data: txs } = await sb.from("transactions").select("title,amount,type").eq("user_id", userId).eq("date", today);
  if (!txs?.length) { await sendMsg(chatId, "📭 Hôm nay chưa có giao dịch nào.", replyTo); return; }
  let net = 0;
  const lines = txs.map(t => { net += t.type === "income" ? t.amount : -t.amount; return `${t.type === "income" ? "💰" : t.type === "saving" ? "🐷" : "💸"} ${t.title}: ${t.type === "income" ? "+" : "-"}${formatVND(t.amount)}`; });
  await sendMsg(chatId, `📅 <b>HÔM NAY</b> (${today})\n\n${lines.join("\n")}\n\n📊 <b>Tổng:</b> ${formatVND(Math.abs(net))}`, replyTo);
}

async function cmdMonth(sb: Supabase, userId: string, chatId: number, replyTo?: number) {
  const today = getVNDate();
  const [year, month] = today.split("-").map(Number);
  const { data: txs } = await sb.from("transactions").select("amount,type").eq("user_id", userId).gte("date", `${year}-${String(month).padStart(2, "0")}-01`);
  let e = 0, i = 0, s = 0;
  (txs || []).forEach(t => { if (t.type === "expense") e += t.amount; else if (t.type === "income") i += t.amount; else s += t.amount; });
  await sendMsg(chatId, `📆 <b>THÁNG ${month}/${year}</b>\n\n💰 Thu: ${formatVND(i)}\n💸 Chi: ${formatVND(e)}\n🐷 Tiết kiệm: ${formatVND(s)}\n\n📊 <b>Còn lại:</b> ${formatVND(i - e - s)}`, replyTo);
}

async function cmdStatus(sb: Supabase, userId: string, chatId: number, replyTo?: number) {
  const { data: auth } = await sb.auth.admin.getUserById(userId);
  const init = Number(auth?.user?.user_metadata?.initial_balance || 0);
  const { data: txs } = await sb.from("transactions").select("amount,type").eq("user_id", userId);
  let e = 0, i = 0, s = 0;
  (txs || []).forEach(t => { if (t.type === "expense") e += t.amount; else if (t.type === "income") i += t.amount; else s += t.amount; });
  await sendMsg(chatId, `📊 <b>TỔNG QUAN</b>\n\n🏦 <b>Số dư:</b> <code>${formatVND(init + i - e - s)}</code>\n💸 Chi: ${formatVND(e)}\n💰 Thu: ${formatVND(i)}\n🐷 Tiết kiệm: ${formatVND(s)}`, replyTo);
}

async function cmdHabits(sb: Supabase, userId: string, chatId: number, replyTo?: number) {
  const habits = await getHabits(sb, userId);
  if (!habits.length) { await sendMsg(chatId, "📭 Chưa có thói quen nào. Vào app để tạo nhé!", replyTo); return; }
  const lines = habits.map(h => {
    const pct = h.goal_value > 0 ? Math.round(h.current_value / h.goal_value * 100) : 0;
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    return `${h.completed ? "✅" : pct > 0 ? "🔄" : "⬜"} <b>${h.name}</b>: ${h.current_value}/${h.goal_value} ${h.unit}\n   ${bar} ${pct}%`;
  });
  await sendMsg(chatId, `🎯 <b>THÓI QUEN HÔM NAY</b>\n\n${lines.join("\n\n")}`, replyTo);
}

Deno.serve(async (req: Request) => {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let debugChatId: number | null = null;
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message?.text || !message?.from?.id) return new Response("OK", { status: 200 });

    const chatId: number = message.chat.id;
    debugChatId = chatId;
    const msgId: number = message.message_id;
    const text: string = message.text.trim();
    const firstName: string = message.from?.first_name || "bạn";
    const chatType: string = message.chat?.type || "private";
    const inGroup = isGroup(chatType);
    const cmd = text.replace(/@\w+/, "").trim();

    // /start
    if (cmd === "/start") {
      await sendMsg(chatId,
        `🎉 Chào <b>${firstName}</b>! Mình là <b>FinHabit Bot</b>.\n\n` +
        `📝 Nhắn tin tự nhiên để ghi chi tiêu, thói quen:\n` +
        `• <code>Ăn phở 50k</code>\n• <code>Sáng cà phê 25k, trưa cơm 45k</code>\n` +
        `• <code>Chạy bộ 5km</code>\n• <code>Tháng này tôi chi nhiều không?</code>\n\n` +
        `<b>Lệnh:</b>\n/today /month /status /habits /help`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    if (cmd === "/help") {
      await sendMsg(chatId,
        `📖 <b>FinHabit Bot</b>\n\nNhắn tự nhiên — AI hiểu hết!\n\n` +
        `<b>Lệnh:</b>\n/today — Giao dịch hôm nay\n/month — Tháng này\n/status — Số dư\n/habits — Thói quen hôm nay`,
        inGroup ? msgId : undefined
      );
      return new Response("OK", { status: 200 });
    }

    // Determine userId: group → owner, private → linked or prompt
    let userId: string;
    let history: ChatTurn[] = [];
    let saveHistoryForChat: ((h: ChatTurn[]) => Promise<void>) | null = null;

    if (inGroup) {
      // Group: always use owner account
      userId = OWNER_USER_ID;
    } else {
      // Private: use linked account, fallback to owner account
      const linked = await getLinkedUserId(sb, chatId);
      if (linked) {
        userId = linked.userId;
        history = linked.history;
        saveHistoryForChat = (h) => saveHistory(sb, chatId, h);
      } else if (OWNER_USER_ID) {
        // Owner using bot in private without linking → use owner account
        userId = OWNER_USER_ID;
      } else {
        await sendMsg(chatId,
          `⚠️ Tài khoản chưa liên kết!\n\nVào <b>FinHabit → Cài đặt → Liên kết Telegram</b> và nhập Chat ID:\n<code>${chatId}</code>`
        );
        return new Response("OK", { status: 200 });
      }
    }

    // Commands
    const replyTo = inGroup ? msgId : undefined;
    if (cmd === "/today") { await cmdToday(sb, userId, chatId, replyTo); return new Response("OK", { status: 200 }); }
    if (cmd === "/month") { await cmdMonth(sb, userId, chatId, replyTo); return new Response("OK", { status: 200 }); }
    if (cmd === "/status") { await cmdStatus(sb, userId, chatId, replyTo); return new Response("OK", { status: 200 }); }
    if (cmd === "/habits") { await cmdHabits(sb, userId, chatId, replyTo); return new Response("OK", { status: 200 }); }

    // Group: filter out casual messages not related to finance/habits
    if (inGroup && !cmd.startsWith("/")) {
      const hasNum = /\d/.test(text);
      const hasKw = /(ăn|uống|mua|trả|nạp|đổ|gửi|nhận|lương|tiền|phí|vé|grab|shopee|cafe|cà phê|tiết kiệm|freelance|chạy|đọc|tập|gym|bộ|sách|km|trang|lần|ly)/i.test(text);
      if (!hasNum && !hasKw) return new Response("OK", { status: 200 });
    }

    // AI
    await sendTyping(chatId);
    const [habits, finCtx] = await Promise.all([getHabits(sb, userId), getFinCtx(sb, userId)]);
    const result = await callAI(text, habits, finCtx, history);
    const reply = await execute(sb, userId, result);
    await sendMsg(chatId, reply, replyTo);

    // Save chat history only for private chats
    if (saveHistoryForChat) {
      await saveHistoryForChat([...history, { role: "user", content: text }, { role: "assistant", content: String(result.message || "") }]);
    }

    return new Response("OK", { status: 200 });
  } catch (err: unknown) {
    console.error("Error:", err);
    if (debugChatId) {
      try { await sendMsg(debugChatId, `❌ Lỗi: ${err instanceof Error ? err.message : String(err)}`); } catch (_) {}
    }
    return new Response("OK", { status: 200 });
  }
});
