# Kế hoạch kiểm thử

## Kiểm thử chức năng

1. Đăng ký email mới; từ chối email trùng và mật khẩu ngắn.
2. Đăng nhập đúng/sai; logout và thử truy cập trang cần xác thực.
3. Tạo khoản chi và khoản thu với danh mục hợp lệ.
4. Từ chối số tiền <= 0, ngày sai và danh mục khác loại.
5. Sửa và xóa giao dịch; bộ lọc tìm kiếm/loại/danh mục/ngày.
6. Xuất CSV và kiểm tra tiêu đề/cột tiếng Việt.
7. Lập ngân sách tổng và ngân sách danh mục; cập nhật cùng khóa không tạo bản trùng.
8. Kiểm tra mức chi dưới 80%, từ 80% đến 100% và vượt ngân sách.
9. Tạo mục tiêu, cập nhật số tích lũy, hoàn thành, tạm dừng và xóa.
10. Thử dùng URL/ID của tài khoản khác: không được xem hoặc sửa dữ liệu.
11. Lọc báo cáo theo khoảng ngày và xuất CSV.
12. Đổi mật khẩu, xác thực mật khẩu cũ và đăng nhập lại.

## Kiểm tra triển khai

- `docker compose config` phải hợp lệ.
- `docker compose up -d --build` tạo application và database.
- `/health` trả trạng thái `ok`.
- Khởi động lại container không làm mất dữ liệu trong named volume.
- Không đưa `.env` thực tế hoặc credential cá nhân vào ZIP/repository.

## Lệnh tự động

```bash
npm test
npm run lint:syntax
```
