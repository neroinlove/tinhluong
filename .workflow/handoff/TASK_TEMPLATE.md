# Task Handoff Template
#
# Copy file này thành: .workflow/handoff/TASK-<task_id>.md
# Xóa dòng comment (#) trước khi dùng.

task_id: example
state: idle
# state options: idle | executing | review | approval-required | done

mode: normal
# mode options: normal | quick | deep

agent_override: auto
# agent_override options: auto | claude | codex | antigravity

owner: coordinator
# owner: agent hiện đang giữ task

approval_gate: none
# approval_gate options: none | required
# Đặt "required" khi task động đến: merge, deploy, schema change, data deletion

next_event: user_request
# next_event: sự kiện tiếp theo dự kiến

target_files: []
# Liệt kê chính xác các file được phép sửa, ví dụ:
# target_files:
#   - app.py
#   - static/js/app.js

constraints: "Isolation First — chỉ sửa file trong target_files. Không tự mở rộng scope."

acceptance: ""
# Mô tả tiêu chí hoàn thành task, ví dụ:
# acceptance: "API endpoint /api/calculate trả về đúng khi days_off=0"

related_lessons: []
# Lessons liên quan từ .agents/AG_LESSONS.jsonl (filter by tags/files/symptoms)

next_potential_steps: []
# Files/components liên quan có thể cần sửa tiếp, KHÔNG tự sửa ngay
