# Thiết kế cơ sở dữ liệu

## Thực thể

| Bảng | Mục đích | Trường quan trọng |
|---|---|---|
| `users` | Tài khoản | `id`, `full_name`, `email`, `password_hash` |
| `categories` | Danh mục thu/chi cá nhân | `user_id`, `name`, `type`, `icon`, `color`, `is_active` |
| `transactions` | Khoản thu/chi phát sinh | `user_id`, `category_id`, `type`, `title`, `amount`, `transaction_date`, `payment_method` |
| `budgets` | Ngân sách tháng | `user_id`, `category_id` nullable, `month`, `amount` |
| `savings_goals` | Mục tiêu tiết kiệm | `user_id`, `title`, `target_amount`, `current_amount`, `target_date`, `status` |
| `audit_logs` | Nhật ký thao tác | `user_id`, `action`, `entity_type`, `details`, `created_at` |

## Quan hệ

- Một người dùng có nhiều danh mục, giao dịch, ngân sách, mục tiêu và nhật ký.
- Một danh mục có thể được tham chiếu bởi nhiều giao dịch và ngân sách.
- Giao dịch tham chiếu một danh mục cùng loại thu/chi.
- Ngân sách có thể là ngân sách tổng (`category_id IS NULL`) hoặc ngân sách theo danh mục.

## Lưu ý

- Số tiền dùng kiểu `NUMERIC(14,2)` thay vì floating point.
- Có index theo user và ngày giao dịch để hỗ trợ dashboard/lọc.
- Xóa tài khoản sẽ xóa dữ liệu cá nhân theo `ON DELETE CASCADE`.
- Không lưu số tài khoản, mật khẩu ngân hàng hoặc thông tin xác thực ví điện tử.
