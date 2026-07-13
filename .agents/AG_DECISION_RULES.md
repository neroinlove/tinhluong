# AG_DECISION_RULES.md

This file defines mandatory behavior rules for AG when working in DEC.

## 1. Pre-task mandatory steps

Before doing ANY task:

1. Luôn bám sát `SKILL.md` (luật lõi)
2. Chỉ mở playbook (`dec-debug-playbook.md`) hoặc file này (`AG_DECISION_RULES.md`) khi cần tra cứu heuristic hoặc quy tắc ra quyết định cụ thể
3. Chỉ truy xuất lesson liên quan trong `AG_LESSONS.jsonl` theo:
   - tags
   - files
   - symptoms
   - surfaces

Then output:
 
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

Do NOT jump into solution immediately.

## 2. Diagnosis discipline

Always separate:

- symptom (what is seen)
- expected behavior (what should happen)
- root cause hypothesis (why it happens)

Never mix them.

## 3. Scope control

Always explicitly decide:

- Isolation (Default): Fix file được yêu cầu trước. Tuyệt đối không sửa lan.
- Godmode (Triggered): Fix toàn hệ thống/shared level nếu được chỉ định.

Rules:
- If only one tool/surface affected → keep local.
- If multiple tools/components affected → **IDENTIFY** but do NOT fix all at once. Suggest them in "Next Potential Steps".
- Always prioritize user confirmation for the current fix before suggesting the next one.

## 4. Fix principles

- Fix the correct layer (UI vs export vs shell)
- **Sửa Gốc - Không Sửa Ngọn:** Luôn fix lỗi tại file nguồn/template gốc (ví dụ: `UltiTemp.html`, `ToolListening`) ngay cả khi error được phát hiện ở file kết quả/output.
- Do NOT “visually patch” symptoms without understanding cause
- Do NOT introduce global changes for local problems
- Always preserve working parts

## 5. Regression protection (MANDATORY)

Every fix must include regression checks:

- what must remain unchanged
- which other tools/components might be affected
- what to verify after fix

If no regression section → task is incomplete

## 6. Prompt writing standard

When writing a fix prompt:

Must include:

- exact symptom
- exact location (UI / PDF / component / file)
- target layer
- scope (local/system)
- constraints (what must NOT change)
- regression checks

Avoid:
- vague language
- broad instructions
- “make it better” type requests

## 7. Post-task learning

After finishing:

1. Sửa lỗi chính.
2. Yêu cầu xác nhận (Fix confirmed?).
3. Nếu confirmed: Gợi ý các file liên quan (Next Potential Steps).
4. Append lesson to `AG_LESSONS.jsonl` (Housekeeping).
5. Nếu pattern lặp lại: Update `dec-debug-playbook.md`.

## 8. What NOT to do

- Do không bỏ qua các quy tắc trong `SKILL.md` (luật lõi) và không bỏ qua các heuristic/pattern trong playbook khi cần chẩn đoán lỗi mang tính hệ thống.
- Do not debug from scratch if similar case exists
- Do not log noise into lessons
- Do not over-generalize from one case

## 9. Output format (standard)

Every response must follow:

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
