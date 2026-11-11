# Hướng dẫn sử dụng Student Wallet

## Tạo tài khoản và đăng nhập

Mở website, chọn **Tạo tài khoản miễn phí**, nhập họ tên, email và mật khẩu tối thiểu 8 ký tự. Mỗi tài khoản có vùng dữ liệu riêng. Có thể dùng tài khoản demo trong `.env.example` để trình diễn.

## Thêm giao dịch

1. Chọn **Thêm giao dịch**.
2. Chọn **Khoản chi** hoặc **Khoản thu**.
3. Nhập tên, số tiền, ngày và danh mục tương ứng.
4. Chọn phương thức thanh toán; có thể thêm nơi phát sinh và ghi chú.
5. Nhấn **Lưu giao dịch**.

Danh mục được lọc theo loại thu/chi. Không dùng số âm; khoản chi và khoản thu đều nhập số tiền dương.

## Lọc và xuất giao dịch

Vào **Thu & chi**, có thể tìm theo nội dung, lọc theo loại, danh mục, ngày bắt đầu và ngày kết thúc. Nút **Xuất CSV** tải dữ liệu theo bộ lọc hiện tại.

## Quản lý ngân sách

Vào **Ngân sách**, chọn tháng, phạm vi ngân sách và số tiền giới hạn. Chọn ngân sách tổng để so với toàn bộ khoản chi hoặc chọn một danh mục cụ thể. Nếu lưu lại đúng tháng và phạm vi, mức cũ được cập nhật.

## Mục tiêu tiết kiệm

Vào **Mục tiêu tiết kiệm**, tạo tên mục tiêu, số tiền cần đạt, số đã có và ngày dự kiến. Khi tích lũy thêm, nhập lại số tiền hiện đã tiết kiệm rồi chọn **Cập nhật**. Có thể tạm dừng/tiếp tục hoặc xóa mục tiêu.

## Báo cáo

Chọn khoảng ngày tại **Báo cáo & phân tích** để xem tổng thu, tổng chi, chênh lệch, phân bổ chi theo danh mục và phương thức thanh toán. Có thể xuất CSV.

## Tài khoản và riêng tư

Trong **Tài khoản**, đổi tên hiển thị hoặc mật khẩu. Các route đều lọc theo user ID từ session; không sử dụng ID người dùng gửi từ trình duyệt để quyết định quyền sở hữu dữ liệu.
