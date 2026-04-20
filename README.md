# 💎 FinHabit - Smart Finance & Habit Tracker

[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

**FinHabit** là một nền tảng quản lý tài chính cá nhân và theo dõi thói quen hiện đại, được tích hợp trí tuệ nhân tạo (AI) để giúp người dùng tối ưu hóa lối sống và tài chính một cách thông minh và tinh tế.

---

## ✨ Tính Năng Nổi Bật

### 🤖 Trợ Lý Tài Chính AI (Google Gemini)
*   **Tự động phân loại**: AI tự động nhận diện và phân loại giao dịch từ mô tả của người dùng (ví dụ: "ăn sáng 50k" -> Danh mục: Ăn uống).
*   **Xử lý ngôn ngữ tự nhiên**: Hiểu các câu lệnh phức tạp và tự động tách thông tin về số tiền, tiêu đề và loại giao dịch.
*   **Cơ chế Fallback thông minh**: Đảm bảo hệ thống vẫn hoạt động mượt mà ngay cả khi AI hết quota bằng logic Regex tối ưu.

### 🔥 Theo Dõi Thói Quen (Habit Streaks)
*   **Hệ thống Streak chuyên sâu**: Tính toán chuỗi thói quen (streak) dựa trên ngưỡng hoàn thành 50% mỗi ngày.
*   **Heatmap đóng góp**: Trực quan hóa tiến trình thói quen qua biểu đồ nhiệt tương tự GitHub.
*   **Gợi ý thói quen từ AI**: Đề xuất thói quen khoa học dựa trên mục tiêu cá nhân của bạn.

### 📊 Dashboard Tổng Quan & Analytics
*   **Insight 2-trong-1**: Theo dõi cả biến động số dư tài chính và tỉ lệ hoàn thành thói quen trên cùng một giao diện.
*   **Biểu đồ tương tác**: Sử dụng Recharts để hiển thị xu hướng thu chi hàng tuần/tháng một cách sinh động.
*   **Thông báo Real-time**: Cập nhật trạng thái ngay lập tức khi thói quen được hoàn thành.

### 🎨 Trải Nghiệm Người Dùng Cao Cấp
*   **Giao diện Glassmorphism**: Thiết kế hiện đại với hiệu ứng mờ kính và độ sâu tinh tế.
*   **Animation mượt mà**: Tích hợp Framer Motion cho mọi chuyển động và chuyển cảnh.
*   **Dark Mode chuẩn**: Tối ưu cho trải nghiệm ban đêm, giúp bảo vệ mắt và tăng tính thẩm mỹ.

---

## 🛠 Công Nghệ Sử Dụng

| Lớp | Công Nghệ |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19 |
| **Backend** | Supabase (PostgreSQL, Auth, SSR) |
| **AI Engine** | Google Gemini (Gemini 2.5 Flash) |
| **Styling** | Tailwind CSS v4, Framer Motion |
| **Visualization** | Recharts, Lucide Icons |

---

## 🚀 Cài Đặt & Chạy Thử

### 1. Clone Project
```bash
git clone https://github.com/your-username/finhabit.git
cd finhabit
```

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường
Tạo file `.env.local` ở thư mục gốc và cung cấp các thông tin sau:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Khởi Chạy Dev Server
```bash
npm run dev
```
Truy cập tại: `http://localhost:3000`

---

## 📸 Ảnh Chụp Màn Hình (Sắp có)
*Dashboard, Finance Page, Habit Tracker, và AI Assistant sẽ được hiển thị tại đây.*

---

## 📝 Giấy Phép
Dự án được phát hành dưới giấy phép **MIT**.

---

**FinHabit** - *Habits Build Your Life, Finance Secures Your Future.* 🚀
