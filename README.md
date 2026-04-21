# 💎 FinHabit — Smart Finance & Habit Tracker

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Telegram](https://img.shields.io/badge/Telegram_Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/your_bot)

> **FinHabit** là nền tảng quản lý tài chính cá nhân và theo dõi thói quen hiện đại, tích hợp AI hội thoại và Telegram Bot để giúp người dùng tối ưu hóa tài chính gia đình một cách thông minh nhất.

---

## ✨ Tính Năng Nổi Bật

### 🤖 1. AIChatbot (Trợ lý hội thoại)
*   **Conversational AI**: Không chỉ là parser đơn giản, Chatbot hỗ trợ hội thoại có lịch sử tin nhắn.
*   **3 Chế độ thông minh**:
    *   **Giao dịch**: "Ăn sáng 30k", "Vừa nhận lương 15tr".
    *   **Thói quen**: "Mình muốn tạo thói quen tập gym mỗi sáng".
    *   **Tư vấn**: Hỏi đáp về tình hình tài chính hoặc lời khuyên sức khỏe.
*   **Action Cards**: Hiển thị thẻ xác nhận trực quan ngay trong chat trước khi lưu dữ liệu.

### 📱 2. Telegram Bot (Shared Household Mode)
*   **Family Sync**: Chế độ dùng chung cho gia đình. Một người làm chủ, cả nhà nhắn tin vào nhóm chung, dữ liệu tự động đổ về 1 tài khoản.
*   **Smart Filtering**: Bot tự động bỏ qua các tin nhắn nói chuyện phiếm, chỉ "lắng nghe" và xử lý các tin nhắn có số tiền hoặc giao dịch.
*   **AI Categorization**: Tự động phân loại danh mục ngay từ tin nhắn Telegram bằng Gemini 1.5-Flash.
*   **Báo cáo nhanh**: Gửi `/today` hoặc `/month` ngay trong Telegram để xem tổng chi tiêu cả nhà.

### 📊 3. Dashboard Tổng Quan & Cảnh Báo
*   **Thống kê thời gian thực**: Số dư, Chi tiêu, Tiết kiệm, Chuỗi thói quen.
*   **Financial Health Alert**: Tự động đổi màu cảnh báo dựa trên ngân sách tháng (Teal → Orange → Rose).
*   **Streak Tracking**: Tag chuỗi duy trì nhấp nháy khi sắp đứt chuỗi (sau 20:00).
*   **Privacy Mode**: Ẩn/hiện số dư để bảo mật khi sử dụng ở nơi công cộng.

### 🔥 4. Theo Dõi Thói Quen (Habits)
*   **Hệ thống Streak**: Tính chuỗi dựa trên ngưỡng hoàn thành ≥ 50%.
*   **Heatmap**: Trực quan hóa tiến trình kiểu GitHub Contributions.
*   **Hiệu ứng Confetti**: Ăn mừng khi hoàn thành tất cả mục tiêu trong ngày 🎉.

---

## 🛠 Công Nghệ Sử Dụng

| Lớp | Công Nghệ | Phiên bản |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router, Turbopack) | 16.2.3 |
| **Backend** | Supabase (Postgres, Auth, SSR, Edge Functions) | Latest |
| **AI Engine** | Google Gemini (1.5-Flash) | Latest |
| **Telegram API**| Telegram Webhook + Edge Functions | Latest |
| **Styling** | Tailwind CSS v4 + Framer Motion | Latest |

---

## 🚀 Telegram Bot Setup (Dành cho gia đình)

Để sử dụng Bot cho cả nhà ghi chép vào cùng 1 tài khoản:

1.  **Tạo Bot**: Qua `@BotFather`, lấy `TELEGRAM_BOT_TOKEN`.
2.  **Tắt Privacy Mode**: Chat với `@BotFather` → `/setprivacy` → Chọn Bot → **Disable**.
3.  **Deploy Edge Function**:
    ```bash
    npx supabase functions deploy telegram-webhook --no-verify-jwt
    ```
4.  **Cấu hình Secret**:
    ```bash
    supabase secrets set TELEGRAM_BOT_TOKEN=... GEMINI_API_KEY=... FINHABIT_USER_ID=...
    ```
5.  **Thêm vào nhóm**: Thêm Bot vào nhóm gia đình/bạn bè và bắt đầu nhắn: *"Cafe 30k"*!

---

## 📁 Cấu Trúc Dự Án

```
src/
├── app/
│   ├── (dashboard)/         # Dashboard, Finance, Habits, Settings
│   ├── actions/             # Unified AI & Server Actions
│   └── globals.css          # Design tokens & Themes
├── components/
│   ├── AIChatbot.tsx       # Conversational Interface
│   └── ...                 # UI Components
supabase/
└── functions/
    └── telegram-webhook/    # Logic Telegram Bot (Edge Function)
```

---

## 📝 Giấy Phép & Tác Giả

Dự án được phát hành dưới giấy phép **MIT**.

<div align="center">

**FinHabit** — *Habits Build Your Life, Finance Secures Your Future.* 🚀

</div>
