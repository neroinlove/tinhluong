# Agent Rules

## Reporting
- Sau khi hoàn thành bất kỳ công việc nào, phải báo cáo chi tiết đến người dùng bằng Tiếng Việt.

## Workflow (nero-dev-workflow)
- Trước khi bắt đầu bất kỳ task nào: đọc `.workflow/policy.md` (source of truth).
- Kiểm tra handoff hiện hành trong `.workflow/handoff/` để lấy `target_files` và `constraints`.
- Scope mặc định: **Isolation First** — chỉ sửa file trong handoff `target_files`. Đề xuất file liên quan vào "Next Potential Steps", không tự mở rộng.
- Approval gate bắt buộc (KHÔNG tự bypass): merge, deploy, schema change, data deletion trong `data/records/`.
- Coordinator skill: `.workflow/skills/nero-dev-workflow/SKILL.md`
