# Kiến trúc Student Wallet

Trình duyệt giao tiếp HTTP với ứng dụng Node.js/Express. Express phục vụ giao diện EJS, CSS/JavaScript tĩnh và route nghiệp vụ. PostgreSQL lưu tài khoản, danh mục, giao dịch, ngân sách, mục tiêu tiết kiệm và audit log. Docker Compose quản lý hai service `application` và `database` trong mạng bridge; dữ liệu PostgreSQL được lưu ở named volume `database-data`.

Session được lưu trong PostgreSQL qua `connect-pg-simple`. Mật khẩu người dùng được băm bằng bcrypt. Mỗi truy vấn nghiệp vụ phải giới hạn theo `user_id` đang đăng nhập.
