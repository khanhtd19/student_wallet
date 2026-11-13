# Student Wallet – Quản lý chi tiêu hằng ngày của sinh viên

**Student Wallet** là website hỗ trợ sinh viên quản lý tài chính cá nhân. Hệ thống cho phép ghi chép thu nhập, chi tiêu, theo dõi số dư, phân loại giao dịch, lập ngân sách theo tháng và xây dựng mục tiêu tiết kiệm.

Dự án được xây dựng nhằm giúp sinh viên kiểm soát dòng tiền, theo dõi thói quen chi tiêu và chủ động hơn trong việc quản lý tài chính cá nhân.

---

## 1. Giới thiệu dự án

| Thông tin | Nội dung |
|---|---|
| Tên dự án | Student Wallet |
| Chủ đề | Quản lý chi tiêu hằng ngày của sinh viên |
| Phiên bản | 2.0 |
| Loại ứng dụng | Website |
| Backend | Node.js, Express |
| Frontend | EJS, CSS, JavaScript |
| Cơ sở dữ liệu | PostgreSQL 16 |
| Triển khai | Docker Compose |

## 2. Giao diện hệ thống

Student Wallet sử dụng giao diện đơn giản, tập trung vào việc hiển thị thông tin tài chính và giúp người dùng thao tác thuận tiện.

Các khu vực giao diện chính:

- Trang đăng nhập và đăng ký.
- Dashboard tổng quan tài chính.
- Quản lý danh mục thu và chi.
- Quản lý thông tin tài khoản.
- Các khu vực quản lý giao dịch, ngân sách và mục tiêu tiết kiệm.

## 3. Chức năng chính

### 3.1. Quản lý tài khoản
- Đăng ký tài khoản mới.
- Đăng nhập và đăng xuất.
- Cập nhật thông tin cá nhân.
- Thay đổi mật khẩu.
- Tách biệt dữ liệu giữa các tài khoản.

### 3.2. Quản lý giao dịch thu và chi
- Thêm giao dịch thu nhập và chi tiêu.
- Chỉnh sửa và xóa giao dịch.
- Tìm kiếm giao dịch.
- Lọc theo loại giao dịch, danh mục và thời gian.
- Phân trang danh sách giao dịch.
- Xuất dữ liệu giao dịch ra CSV.

### 3.3. Quản lý danh mục
- Phân loại khoản thu và khoản chi.
- Cung cấp các danh mục phù hợp với sinh viên.
- Tạo danh mục cá nhân.
- Chỉnh sửa và ẩn danh mục.

Một số danh mục tiêu biểu: ăn uống, đi lại, học tập, nhà ở, sức khỏe, giải trí, học bổng, lương làm thêm và trợ cấp.

### 3.4. Quản lý ngân sách
- Thiết lập ngân sách theo tháng.
- Tạo ngân sách tổng hoặc theo danh mục.
- Theo dõi số tiền đã sử dụng.
- Cảnh báo khi sử dụng gần hết hoặc vượt ngân sách.

### 3.5. Mục tiêu tiết kiệm
- Tạo mục tiêu tiết kiệm cá nhân.
- Thiết lập số tiền mục tiêu.
- Cập nhật số tiền đã tích lũy.
- Theo dõi tiến độ thực hiện mục tiêu.

### 3.6. Dashboard và báo cáo
- Theo dõi tổng thu nhập và tổng chi tiêu.
- Xem số dư và ngân sách còn lại.
- Biểu đồ thu – chi theo thời gian.
- Phân tích chi tiêu theo danh mục.
- Theo dõi nguồn thu nhập.
- Xem báo cáo tài chính cá nhân.

### 3.7. Sao lưu và khôi phục dữ liệu
- Xuất dữ liệu tài chính thành tệp JSON.
- Khôi phục dữ liệu từ tệp sao lưu.
- Tạo bản sao lưu an toàn trước khi khôi phục.
- Yêu cầu xác nhận mật khẩu và thao tác xác nhận khôi phục.

---

## 4. Công nghệ sử dụng

| Công nghệ | Vai trò |
|---|---|
| Node.js | Môi trường chạy JavaScript phía máy chủ |
| Express.js | Xây dựng backend và xử lý các yêu cầu |
| EJS | Hiển thị giao diện website |
| HTML, CSS, JavaScript | Xây dựng giao diện và tương tác |
| PostgreSQL 16 | Quản lý dữ liệu |
| Docker | Đóng gói môi trường ứng dụng |
| Docker Compose | Quản lý các dịch vụ của hệ thống |
| Adminer | Hỗ trợ quản lý cơ sở dữ liệu |

## 5. Yêu cầu cài đặt

Trước khi chạy dự án, cần chuẩn bị:

- Node.js phiên bản 20 trở lên.
- Docker Desktop.
- Visual Studio Code (khuyến nghị).
- Git (nếu lấy mã nguồn từ GitHub).

## 6. Hướng dẫn chạy dự án bằng Docker

### Bước 1. Khởi động Docker Desktop

Mở Docker Desktop và chờ Docker Engine hoạt động bình thường.

### Bước 2. Mở mã nguồn

Mở thư mục `source-code` bằng Visual Studio Code.

### Bước 3. Tạo tệp môi trường

Mở Terminal tại thư mục `source-code`, chạy lệnh PowerShell:

```powershell
Copy-Item .env.example .env
```

### Bước 4. Cấu hình biến môi trường

Mở tệp `.env` và thay đổi các giá trị sau bằng thông tin riêng:

```env
SESSION_SECRET=your_private_session_secret
DB_PASSWORD=your_private_database_password
STUDENT_PASSWORD=your_private_demo_password
```

Không sử dụng các giá trị mẫu khi triển khai thực tế. Không tải tệp `.env` chứa thông tin bí mật lên GitHub.

### Bước 5. Khởi chạy ứng dụng

Tại Terminal trong thư mục `source-code`, chạy:

```bash
docker compose up -d --build
```

Chờ Docker hoàn tất quá trình tạo và khởi động các container.

Có thể kiểm tra trạng thái bằng lệnh:

```bash
docker compose ps
```

### Bước 6. Truy cập website

Mở trình duyệt và truy cập:

**Website:** http://localhost:3000

**Adminer:** http://localhost:8080

Adminer dùng để hỗ trợ quản lý cơ sở dữ liệu PostgreSQL.

---

## 7. Tài khoản demo

Khi cấu hình `CREATE_DEMO_DATA=true`, hệ thống có thể khởi tạo tài khoản demo theo cấu hình môi trường.

| Thông tin | Giá trị mặc định |
|---|---|
| Email | student@dailybudget.local |
| Mật khẩu | Student@12345 |

Mật khẩu thực tế có thể phụ thuộc vào giá trị `STUDENT_PASSWORD` trong tệp `.env`.

Nên đổi mật khẩu demo trước khi sử dụng lâu dài. Người dùng cũng có thể đăng ký tài khoản mới để quản lý dữ liệu cá nhân.

---

## 8. Cấu trúc thư mục

```text
student_wallet/
│
├── source-code/
│   ├── src/
│   ├── public/
│   ├── views/
│   ├── tests/
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── documents/
│   ├── use-case.mmd
│   ├── erd.mmd
│   └── deployment.mmd
│
└── reference/
    └── Tài liệu tham khảo dự án
```

*Lưu ý: Cấu trúc trên mang tính khái quát. Tên thư mục và tệp thực tế có thể khác tùy theo phiên bản mã nguồn.*

## 9. Kiểm tra mã nguồn

Nếu muốn kiểm tra bằng Node.js trực tiếp, mở Terminal tại thư mục `source-code` và chạy lần lượt:

```bash
npm install
npm test
npm run lint:syntax
npm run lint:templates
```

Các lệnh kiểm tra tương ứng với những script được cấu hình trong `package.json`.

Nếu một lệnh không tồn tại trong phiên bản mã nguồn hiện tại, hãy kiểm tra mục `scripts` trong `package.json`.

## 10. Lưu trữ dữ liệu

Dự án sử dụng PostgreSQL để lưu trữ dữ liệu. Khi chạy bằng Docker Compose, dữ liệu cơ sở dữ liệu được quản lý thông qua Docker Volume.

Một số lưu ý:

- Không xóa Docker Volume nếu vẫn cần giữ dữ liệu.
- Không chia sẻ tệp `.env` công khai.
- Nên sao lưu dữ liệu định kỳ.
- Có thể sử dụng chức năng sao lưu JSON của hệ thống để xuất dữ liệu tài chính.

**Lưu ý:** Không sử dụng lệnh `docker compose down -v` nếu chưa có bản sao lưu và chưa thực sự muốn xóa dữ liệu trong Volume.

## 11. Phạm vi và hạn chế

### Trong phạm vi
- Quản lý tài khoản cá nhân.
- Ghi chép thu nhập và chi tiêu.
- Phân loại giao dịch.
- Quản lý ngân sách theo tháng.
- Theo dõi mục tiêu tiết kiệm.
- Báo cáo và thống kê tài chính.
- Sao lưu và khôi phục dữ liệu.

### Ngoài phạm vi
- Kết nối API ngân hàng.
- Tự động đồng bộ ví điện tử.
- Thanh toán trực tuyến.
- Quét hóa đơn bằng OCR.
- Chia sẻ ví nhóm.
- Cho vay và tư vấn đầu tư.
- Ứng dụng di động native.

## 12. Định hướng phát triển

Trong tương lai, Student Wallet có thể được mở rộng với các chức năng:

- Tích hợp kết nối ngân hàng khi đáp ứng yêu cầu bảo mật.
- Quét hóa đơn và tự động nhận diện khoản chi.
- Phát triển ứng dụng di động.
- Bổ sung thông báo nhắc nhở ngân sách.
- Nâng cao khả năng phân tích thói quen chi tiêu.

---

## 13. Thông tin dự án

**Student Wallet – Quản lý chi tiêu hằng ngày của sinh viên**

Dự án phục vụ mục đích học tập và thực hành xây dựng ứng dụng web, quản lý cơ sở dữ liệu và triển khai bằng Docker.

