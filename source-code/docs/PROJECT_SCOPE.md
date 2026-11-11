# Phạm vi sản phẩm — Student Wallet

## 1. Vấn đề

Sinh viên thường phát sinh nhiều khoản thu và chi nhỏ trong ngày như ăn uống, đi lại, học tập, tiền trọ, mua sắm và giải trí. Khi chỉ ghi nhớ hoặc ghi rời rạc, người dùng khó biết tổng chi trong tháng, nhóm chi nào đang chiếm nhiều tiền và ngân sách còn lại bao nhiêu.

## 2. Mục tiêu

Cung cấp công cụ web đơn giản để sinh viên ghi nhận giao dịch, phân loại, lập giới hạn chi tiêu theo tháng, theo dõi mục tiêu tiết kiệm và tự xem báo cáo.

## 3. Vai trò

- Sinh viên/người dùng: đăng ký tài khoản, quản lý hồ sơ, giao dịch, danh mục, ngân sách, mục tiêu tiết kiệm và báo cáo của chính mình.
- Hệ thống: xác thực tài khoản, lưu dữ liệu, tính tổng thu/chi và cảnh báo ngân sách.

Không có vai trò nhân viên bán hàng hay khách mua hàng trong đề tài mới.

## 4. Chức năng trong phạm vi

- Đăng ký, đăng nhập, đăng xuất, đổi mật khẩu.
- Ghi nhận khoản thu và khoản chi theo ngày.
- Danh mục mặc định và danh mục cá nhân.
- Tìm kiếm, lọc, phân trang và xuất CSV giao dịch.
- Ngân sách tổng và ngân sách theo danh mục theo từng tháng.
- Cảnh báo mức sử dụng ngân sách (80% trở lên) và vượt ngân sách.
- Mục tiêu tiết kiệm và cập nhật tiến độ.
- Báo cáo theo khoảng ngày, nhóm chi tiêu, phương thức thanh toán.
- Dashboard và nhật ký thao tác.

## 5. Ngoài phạm vi hiện tại

- Kết nối tài khoản ngân hàng và tự động tải giao dịch.
- Tích hợp API ví điện tử hoặc tự động đối soát.
- OCR hóa đơn/biên lai.
- Chia sẻ ngân sách giữa nhiều người hoặc ví nhóm.
- Thanh toán, cho vay, đầu tư và tư vấn tài chính.
- Ứng dụng di động native.

## 6. Quy tắc nghiệp vụ chính

1. Mỗi giao dịch thuộc một người dùng, một danh mục và có loại `INCOME` hoặc `EXPENSE`.
2. Danh mục phải thuộc đúng tài khoản và cùng loại với giao dịch.
3. Số tiền giao dịch và ngân sách phải lớn hơn 0; tiền tiết kiệm hiện tại không âm.
4. Ngân sách được xác định theo tháng (ngày đầu tháng) và có thể áp dụng tổng hoặc một danh mục chi.
5. Mỗi người dùng chỉ truy vấn/sửa/xóa dữ liệu của chính mình.
6. Danh mục có giao dịch đã dùng được ẩn, không xóa vật lý để tránh mất lịch sử.
7. Khi cập nhật tiến độ tiết kiệm đạt/vượt mục tiêu, hệ thống chuyển trạng thái sang hoàn thành.

## 7. Chỉ số có thể demo

- Tổng thu, tổng chi, chênh lệch thu–chi trong tháng.
- Tỷ lệ sử dụng ngân sách và số tiền còn lại/vượt mức.
- Chi tiêu theo danh mục và phương thức thanh toán.
- Tiến độ từng mục tiêu tiết kiệm.
