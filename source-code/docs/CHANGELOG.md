# Nhật ký chuyển đổi dự án

## 2.0.0 — Student Wallet

- Thay toàn bộ nhận diện và nội dung giao diện cũ bằng thương hiệu Student Wallet.
- Chuyển mô hình nghiệp vụ sang quản lý tài chính cá nhân, dữ liệu được tách riêng theo từng tài khoản.
- Loại bỏ các thực thể vận hành cửa hàng; thay bằng giao dịch thu chi, ngân sách và mục tiêu tiết kiệm.
- Tạo các bảng users, categories, transactions, budgets, savings_goals và audit_logs.
- Bổ sung đăng ký/đăng nhập tài khoản riêng và giới hạn dữ liệu theo user ID.
- Bổ sung tạo/sửa/xóa giao dịch thu chi, lọc dữ liệu và xuất CSV.
- Bổ sung ngân sách tổng/theo danh mục và mục tiêu tiết kiệm.
- Bổ sung dashboard, phân tích theo danh mục/phương thức và lịch sử hoạt động.
- Cấu hình Docker Compose gồm ứng dụng web và PostgreSQL; không cần dịch vụ lưu trữ tệp riêng.
