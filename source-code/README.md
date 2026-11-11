# Student Wallet — Quản lý chi tiêu hằng ngày của sinh viên

Website giúp sinh viên ghi chép các khoản thu và chi, phân loại giao dịch, lập ngân sách theo tháng, theo dõi mục tiêu tiết kiệm và xem báo cáo tài chính cá nhân.

## Công nghệ

- Node.js 22 + Express 4
- EJS, HTML, CSS, JavaScript responsive
- PostgreSQL 16
- Docker Compose
- Session lưu trong PostgreSQL, mật khẩu băm bằng bcrypt

## Chạy bằng Docker Desktop

1. Cài Docker Desktop và khởi động Docker Engine. Nếu bản web cũ đang chiếm cổng 3000, dừng container cũ bằng `docker compose down` trong thư mục cũ (không dùng `-v`).
2. Giải nén dự án, mở thư mục `source-code` bằng VS Code.
3. Tạo tệp cấu hình:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Mở `.env`, thay `SESSION_SECRET`, `DB_PASSWORD`, `STUDENT_PASSWORD` bằng giá trị riêng. Nếu cổng 3000 đã có ứng dụng sử dụng, đặt `APP_PORT=3001` (hoặc cổng trống khác) để thay cổng trên máy; cổng Node.js bên trong container vẫn là 3000.
5. Tại thư mục có `compose.yaml`, chạy:

   ```powershell
   docker compose up -d --build
   ```

6. Mở `http://localhost:3000`, hoặc `http://localhost:3001` nếu `APP_PORT=3001`. Compose sử dụng volume `student-daily-expense_database-data`. **Đừng dùng `docker compose down -v` khi cần giữ dữ liệu.**

Tài khoản demo được tạo tự động khi `CREATE_DEMO_DATA=true`:

- Email: `student@dailybudget.local`
- Mật khẩu: `Student@12345`

Hãy đổi mật khẩu demo trong **Tài khoản của tôi** khi sử dụng lâu dài. Người dùng có thể tự đăng ký tài khoản riêng. Mỗi tài khoản chỉ truy cập dữ liệu của chính mình.

## Chức năng

1. Đăng ký, đăng nhập, đăng xuất, cập nhật hồ sơ và đổi mật khẩu.
2. Dashboard tổng hợp khoản thu, khoản chi, chênh lệch thu–chi, ngân sách tháng, biểu đồ 7 ngày, biểu đồ so sánh 3/6/12 tháng, cơ cấu danh mục thu/chi, xu hướng lũy kế tháng hiện tại so với tháng trước và nhận định nhanh từ dữ liệu thật.
3. Ghi nhận khoản thu/chi: tên giao dịch, số tiền, ngày, danh mục, phương thức, nơi phát sinh và ghi chú.
4. Tìm kiếm, lọc theo loại giao dịch/danh mục/khoảng ngày, phân trang và xuất CSV.
5. Quản lý danh mục thu và chi; ẩn danh mục tùy chỉnh mà không làm mất lịch sử.
6. Thiết lập ngân sách tổng hoặc ngân sách theo danh mục cho từng tháng; theo dõi phần đã dùng và vượt mức.
7. Tạo mục tiêu tiết kiệm, cập nhật số tiền đã tích lũy, tạm dừng/tiếp tục và hoàn thành mục tiêu.
8. Báo cáo theo khoảng ngày, phân bổ theo danh mục và phương thức thanh toán; xuất CSV.
9. Nhật ký thao tác tài khoản.

## Cấu trúc thư mục

- `src/routes/`: route đăng nhập, giao dịch, danh mục, ngân sách, mục tiêu, báo cáo, cài đặt.
- `src/views/`: giao diện EJS.
- `src/public/`: CSS và JavaScript phía trình duyệt.
- `src/services/`: xác thực và nhật ký hoạt động.
- `database/schema.sql`: cấu trúc cơ sở dữ liệu.
- `postman/`: OpenAPI và Postman collection.
- `docs/`: mô tả phạm vi, cơ sở dữ liệu, hướng dẫn sử dụng, kiểm thử và sơ đồ.

## Kiểm tra mã nguồn

Cài dependency bằng `npm install`, sau đó chạy:

```bash
npm test
npm run lint:syntax
npm run lint:templates
```

Để chạy trực tiếp ngoài Docker, tạo `.env`, đặt `DB_HOST=localhost`, tạo PostgreSQL theo thông tin trong `.env`, chạy `database/schema.sql`, rồi chạy `npm start`.

## Nâng cấp dashboard mà không mất dữ liệu

Nếu đã chạy bản cũ, **nên cập nhật trực tiếp vào thư mục `source-code` đang sử dụng**, giữ lại `.env`, `compose.yaml` đã chỉnh riêng và volume PostgreSQL. Giải nén ZIP mới, chạy `CAP_NHAT_VAO_DU_AN_CU.bat` ở cấp ngoài và nhập đường dẫn `source-code` cũ. Công cụ chỉ sao chép 6 file liên quan dashboard và tự tạo bản sao lưu file cũ. Sau đó tại terminal của dự án cũ chạy `docker compose up -d --build`, rồi Ctrl+F5 trang Tổng quan. Xem hướng dẫn đầy đủ tại `HUONG_DAN_CAP_NHAT.md`.

Các biểu đồ chỉ phản ánh giao dịch đã ghi vào hệ thống; tháng không có giao dịch sẽ không có cột hay lát biểu đồ. Không tự động nhập số liệu giả để tạo biểu đồ đẹp.

## Phạm vi chưa triển khai

Ứng dụng hiện tập trung vào ghi chép tài chính cá nhân. Chưa có kết nối ngân hàng tự động, đồng bộ ví điện tử, OCR hóa đơn, thanh toán, chia sẻ ví nhóm hoặc tư vấn đầu tư. Không nên xem dữ liệu demo là dữ liệu giao dịch thật.
