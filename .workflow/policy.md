# Workflow Policy — tinhluong

> **Source of truth** cho tất cả agents (Claude, Codex, Antigravity).  
> Đọc file này trước bất kỳ task nào.

## Agents & Vai trò

| Agent | Vai trò |
|-------|---------|
| Antigravity | Coordinator — đọc policy, điều phối handoff, activation approval gate |
| Claude | Worker — analysis, refactor, phức tạp logic |
| Codex | Worker — quick edits, scope hẹp, repetitive changes |

## Modes

| Mode | Tag | Khi nào dùng |
|------|-----|-------------|
| `normal` | _(default)_ | Phân tích → code → regression check → report |
| `quick` | `@quick` | Code trực tiếp, scope đã rõ, không cần phân tích sâu |
| `deep` | `@deep` | Phân tích toàn bộ codebase trước khi code |

## Agent Override

Thêm tag vào prompt để chỉ định agent:
- `@claude` → force route to Claude
- `@codex` → force route to Codex
- `@antigravity` → force route to Antigravity

## Approval Gates (MANDATORY — không agent nào được tự bypass)

Các hành động sau **bắt buộc phải dừng và chờ user resolve**:

- Merge vào `main`
- Deploy hoặc restart service
- Thay đổi schema `data/employees.json` có phá vỡ tương thích
- Xóa hoặc ghi đè `data/records/` (dữ liệu lương)
- Thay đổi cấu hình nhân viên production (`employees.json`)

Khi gặp approval gate: tạo handoff với `approval_gate: required` và báo cáo cho user.

## Scope Default: Isolation First

- Chỉ sửa file được liệt kê trong handoff `target_files`.
- Nếu phát hiện file liên quan cần sửa: **liệt kê vào "Next Steps"**, không tự sửa.
- Godmode (sửa hàng loạt) chỉ kích hoạt khi user dùng từ khóa trigger rõ ràng.

## Reporting Standard

Mọi response phải theo format:

```
- Operational Mode:
- Quick diagnosis:
- Likely layer:
- Likely scope:
- Matching lessons:
- Fix direction:
- Must remain unchanged:
- Regression checks:
- Lesson to append? yes/no
- Next Potential Steps:
```

Báo cáo bằng **Tiếng Việt**.

## Business Context

- Tech: Flask (Python) + Vanilla JS + Local JSON storage
- Tiền tệ: đơn vị **ngàn đồng (k)**. VD: `4700` = 4,700,000 VND
- Data path: `data/employees.json` (config), `data/records/YYYY-MM.json` (lương)
- Không thêm dependency mới vào `requirements.txt` nếu không có approval.
