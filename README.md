# Student Wallet — Quản lý chi tiêu hằng ngày của sinh viên

Website hỗ trợ sinh viên ghi chép thu nhập và chi tiêu, theo dõi số dư, phân loại khoản tiền, lập ngân sách theo tháng, đặt mục tiêu tiết kiệm và xem báo cáo tài chính cá nhân.

## Chạy dự án bằng Docker Desktop

1. Mở Docker Desktop và chờ Docker Engine hoạt động.
2. Mở thư mục `source-code` bằng VS Code.
3. Tạo tệp cấu hình từ mẫu:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Mở `.env`, thay `SESSION_SECRET`, `DB_PASSWORD` và `STUDENT_PASSWORD` bằng giá trị riêng.
5. Trong Terminal tại thư mục `source-code`, chạy:

   ```powershell
   docker compose up -d --build
   ```

6. Truy cập `http://localhost:3000`.

Tài khoản demo mặc định (khi `CREATE_DEMO_DATA=true`):

- Email: `student@dailybudget.local`
- Mật khẩu: `Student@12345`

Đổi mật khẩu demo trước khi sử dụng lâu dài. Có thể đăng ký tài khoản mới; dữ liệu của mỗi tài khoản được tách riêng.

## Chức năng chính

- Quản lý tài khoản sinh viên và dữ liệu tài chính riêng.
- Ghi, sửa, xóa khoản thu và khoản chi hằng ngày.
- Danh mục thu/chi phù hợp với sinh viên như ăn uống, đi lại, học tập, nhà ở, làm thêm, học bổng và trợ cấp.
- Tìm kiếm, lọc, phân trang và xuất CSV giao dịch.
- Lập ngân sách tổng hoặc theo danh mục từng tháng, theo dõi tiến độ và cảnh báo gần/vượt mức.
- Tạo mục tiêu tiết kiệm và cập nhật số tiền đã tích lũy.
- Dashboard tổng quan, báo cáo theo thời gian, danh mục và phương thức thanh toán.
- Lịch sử thao tác tài khoản.

## Cấu trúc

- `source-code/`: mã nguồn Node.js/Express/EJS, PostgreSQL, Docker Compose, kiểm thử và hướng dẫn.
- `documents/`: sơ đồ Use Case, ERD và Deployment dạng Mermaid.
- `reference/`: phiếu yêu cầu COMP1305 được giữ lại để tham khảo yêu cầu quản lý dự án; đây không phải đặc tả nghiệp vụ tài chính của website.

## Kiểm tra mã nguồn

Tại thư mục `source-code`, sau khi cài Node.js 20 trở lên:

```bash
npm install
npm test
npm run lint:syntax
npm run lint:templates
```

## Phạm vi hiện tại

Website tập trung vào quản lý chi tiêu cá nhân. Chưa kết nối ngân hàng hoặc ví điện tử tự động, chưa có OCR biên lai, chia sẻ ví nhóm, thanh toán, cho vay hay tư vấn đầu tư. Dữ liệu demo chỉ phục vụ trình diễn.
