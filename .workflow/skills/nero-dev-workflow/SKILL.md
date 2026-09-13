# nero-dev-workflow — Coordinator Skill

**Version:** 1.0.0  
**Project:** tinhluong (Công Cụ Tính Lương Nhân Viên)  
**Role:** Coordinator — điều phối Claude, Codex, Antigravity theo event

---

## 0. Khởi động bắt buộc (trước mọi task)

1. Đọc `.workflow/policy.md` — source of truth về rules, modes, approval gates.
2. Kiểm tra handoff hiện hành trong `.workflow/handoff/` nếu có.
3. Đọc `.agents/AG_DECISION_RULES.md` nếu cần heuristic ra quyết định.
4. Truy xuất lessons liên quan trong `.agents/AG_LESSONS.jsonl` theo tags/files/symptoms.

Sau đó output:

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

---

## 1. Event Routing

### Event: `continue` (tiếp tục task hiện hành)

**Điều kiện:** Yêu cầu mở rộng scope trong cùng task đang `executing`.

**Hành động:**
1. Cập nhật handoff (`target_files`, `constraints`, `acceptance`).
2. Gửi follow-up tới Dispatch đang active (nếu có Orca).
3. KHÔNG tạo Run mới — task vẫn là task cũ.

---

### Event: `new-task` (task mới)

**Điều kiện:** Yêu cầu tạo tính năng mới, fix mới, hoặc task độc lập.

**Hành động:**
1. Copy `.workflow/handoff/TASK_TEMPLATE.md` → `.workflow/handoff/TASK-<id>.md`
2. Điền đầy đủ: `task_id`, `mode`, `agent_override`, `target_files`, `constraints`, `acceptance`.
3. Kiểm tra approval gate (xem §2).
4. Dispatch qua Orca orchestration (nếu có); hoặc thực thi trực tiếp nếu mode `quick`.

---

### Event: `scope-update`

**Điều kiện:** Trong khi executing, phát hiện cần sửa file ngoài `target_files`.

**Hành động:**
1. **KHÔNG tự sửa** file ngoài scope.
2. Ghi vào `next_potential_steps` của handoff.
3. Báo cáo cho user và chờ confirm trước khi mở rộng scope.

---

### Event: `approval-required`

**Điều kiện:** Task động đến bất kỳ mục nào trong danh sách approval gate của `policy.md`:
- merge to main
- deploy / restart service
- schema change phá vỡ tương thích
- xóa / ghi đè `data/records/`
- thay đổi `data/employees.json` production

**Hành động:**
1. Cập nhật handoff: `state: approval-required`, `approval_gate: required`.
2. Dừng hoàn toàn — không tự thực hiện hành động gate.
3. Báo cáo rõ ràng cho user: **hành động cần approve là gì**, **rủi ro là gì**.
4. Chờ user resolve. Sau khi resolved: resume task.

---

## 2. Approval Gate Checklist

Trước khi thực thi bất kỳ hành động nào, kiểm tra:

```
[ ] Hành động này có merge code không?          → gate nếu yes
[ ] Hành động này có deploy/restart không?      → gate nếu yes
[ ] Hành động này thay đổi schema employees?    → gate nếu phá vỡ compat
[ ] Hành động này ghi/xóa data/records/?        → gate nếu yes
[ ] Hành động này thêm dependency mới không?    → gate nếu yes
```

---

## 3. Handoff Protocol

### Tạo handoff mới
```sh
cp .workflow/handoff/TASK_TEMPLATE.md .workflow/handoff/TASK-$(date +%Y%m%d-%H%M).md
```

### Fields bắt buộc khi dispatch
- `task_id` — unique, mô tả ngắn
- `state` — `executing`
- `mode` — từ router.json
- `target_files` — danh sách chính xác
- `constraints` — ít nhất "Isolation First"
- `acceptance` — tiêu chí hoàn thành rõ ràng

### Fields bắt buộc khi done
- `state: done`
- `next_potential_steps` — gợi ý tiếp theo

---

## 4. Skill Stack Reference

| File | Khi nào đọc |
|------|------------|
| `.workflow/policy.md` | **Luôn đọc đầu tiên** |
| `.agents/AG_DECISION_RULES.md` | Khi cần heuristic ra quyết định |
| `.agents/dec-debug-playbook.md` | Khi debug / chẩn đoán lỗi hệ thống |
| `.agents/AG_LESSONS.jsonl` | Filter theo tags/files/symptoms — không quét toàn bộ |
| `.agents/ag-prompt-patterns.md` | Khi viết prompt cho worker agent |
| `.brain/brain.json` | Khi cần context dự án, API, business rules |

---

## 5. Post-task Housekeeping

1. Sửa lỗi chính xong → hỏi user: "Fix confirmed?"
2. Nếu confirmed:
   - Gợi ý `next_potential_steps`
   - Append lesson vào `.agents/AG_LESSONS.jsonl` nếu reusable
   - Update `.agents/dec-debug-playbook.md` nếu là pattern khái quát
3. Update handoff: `state: done`

---

## 6. Business Rules nhanh (tinhluong)

- **Tiền tệ:** đơn vị `k` (ngàn đồng). `4700` = 4,700,000 VND
- **Đi trễ:** mặc định 5k/phút
- **Ngày nghỉ = 0:** tự động cộng 9 giờ OT
- **Nhân viên đặc biệt:** An không có xăng xe (0k)
- **Cấu hình động Hòa:** từ tháng 2026-06, cấu hình giống Vy và Ly
- **OCR:** Tesseract.js — 3 chiến lược parse KiotViet
- **Export:** lưu ảnh ra Desktop qua Flask `/api/export-image`
