# Claude Operating Rules — tinhluong

> Đọc file này **trước tiên** trước bất kỳ task nào trong project này.

## 1. Workflow Source of Truth

Đọc `.workflow/policy.md` để nắm toàn bộ rules, modes và approval gates.  
Kiểm tra handoff hiện hành trong `.workflow/handoff/` trước khi bắt đầu.

## 2. Scope — Isolation First (Default)

- **Chỉ sửa file** được liệt kê trong handoff `target_files`.
- Nếu phát hiện file liên quan cần sửa → liệt kê vào "Next Potential Steps", **không tự sửa**.
- Godmode (sửa hàng loạt) chỉ khi user nói rõ từ khóa trigger.

## 3. Approval Gates — KHÔNG tự bypass

Dừng và báo cáo user ngay khi task động đến:

- Merge vào `main`
- Deploy hoặc restart service
- Thay đổi schema `data/employees.json` (phá vỡ compat)
- Xóa hoặc ghi đè `data/records/`
- Thêm dependency mới vào `requirements.txt`

## 4. Reporting — Tiếng Việt, format chuẩn

Mọi response phải bao gồm:

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

## 5. Context Reference

| Cần biết | Đọc file |
|----------|---------|
| Project context, API, business rules | `.brain/brain.json` |
| Heuristic debug | `.agents/dec-debug-playbook.md` |
| Decision rules | `.agents/AG_DECISION_RULES.md` |
| Lessons đã học | `.agents/AG_LESSONS.jsonl` (filter theo tags) |
| Prompt patterns | `.agents/ag-prompt-patterns.md` |

## 6. Tech Stack Nhanh

- **Backend:** Flask (Python), `app.py`
- **Frontend:** Vanilla JS, `static/js/app.js`
- **Template:** `templates/dashboard.html`
- **DB:** Local JSON — `data/employees.json` + `data/records/YYYY-MM.json`
- **Tiền tệ:** đơn vị `k` (ngàn đồng). `4700` = 4,700,000 VND
- **OCR:** Tesseract.js (client-side)
- **Export:** `/api/export-image` → lưu ra Desktop user
