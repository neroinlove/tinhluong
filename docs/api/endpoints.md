# API Documentation

Ngày cập nhật: 2026-06-10
Base URL: `http://localhost:5000`

---

## 👥 Employees

### GET `/api/employees`
Lấy danh sách toàn bộ nhân viên.

**Response (200):**
```json
{
  "employees": [
    {
      "id": "vy",
      "name": "Vy",
      "base_salary": 4700,
      "gas_allowance": 300,
      "responsibility": 600,
      "overtime_rate": 17.5,
      "daily_rate": 157,
      "commission_rate": 2,
      "extra_bonus": 0
    }
  ]
}
```

### POST `/api/employees`
Thêm nhân viên mới. (Tự động loại bỏ HTML tags).

**Request Body:**
```json
{
  "name": "Tên Nhân Viên",
  "base_salary": 4000,
  "gas_allowance": 300
}
```

### PUT `/api/employees/<emp_id>`
Cập nhật thông tin nhân viên (Hỗ trợ chống XSS).

### DELETE `/api/employees/<emp_id>`
Xóa một nhân viên khỏi danh sách.

---

## 💰 Salary Records

### GET `/api/salary/<month>`
Lấy thông tin bảng lương của một tháng cụ thể.
- **month**: Định dạng `YYYY-MM` (ví dụ `2026-06`).

### POST `/api/salary/<month>`
Lưu dữ liệu tính lương của tháng. Tính toán và lưu đè lên file.

### POST `/api/calculate`
Tính lương tạm tính (preview) cho một nhân viên, không lưu vào file.

**Request Body:**
```json
{
  "employee_id": "vy",
  "late_count": 0,
  "overtime_hours": 10,
  "days_off": 0,
  "sales_total": 12570
}
```

---

## 🖼️ Media & Export

### POST `/api/upload-image`
Upload ảnh doanh số KiotViet (Multipart/form-data).

**Request Form:**
- `file`: File ảnh
- `month`: Tháng hiện tại
- `employee_id`: ID nhân viên

**Response (200):**
```json
{
  "message": "Upload thành công",
  "filename": "2026-06_vy.png"
}
```

### POST `/api/export-image`
Nhận dữ liệu ảnh base64 của bảng lương và lưu thẳng ra Desktop của người dùng.

**Request Body:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "filename": "luong_vy_thang06_2026.png"
}
```

**Response (200):**
```json
{
  "message": "Đã lưu ảnh ra Desktop: luong_vy_thang06_2026.png",
  "path": "C:\\Users\\longp\\Desktop\\luong_vy_thang06_2026.png"
}
```
