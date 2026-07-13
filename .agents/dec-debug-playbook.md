# DEC Debug Playbook

Use this file as a compact diagnostic and learning reference for common DEC debugging situations.

These are heuristics, not hard rules. Always prioritize current evidence.

## 1. First-pass triage

For any issue, identify:

- symptom
- current behavior
- expected behavior
- surface
- likely scope
- likely failure layer

### Surface
Choose the main surface first:

- live UI
- exported PDF
- print/export layer
- outer shell/background
- repeated list/card
- shared component
- single-tool variant
- cross-tool shared layer

### Scope
Estimate whether the issue is:

- local to one component
- local to one tool
- export-only
- UI-only
- shared across sibling tools
- likely a regression

### Failure layer
Infer the most likely layer:

- presentation layer
- export/render layer
- conditional rendering layer
- state/data binding layer
- shared shell/theme layer
- integration/runtime layer
- prompt/spec layer

## 2. Common DEC heuristics

### UI correct, PDF wrong
Usually points to the export/render layer.  
Mọi thứ dùng transform/scale cho UI -> mặc định phải suspect sẽ phá PDF

Common causes:
- export uses a different render context
- print/export CSS differs from screen CSS
- width constraints differ
- font metrics differ in export
- hidden interactive elements are not excluded from export
- export template is not using the same grouping assumptions as the UI

Default response:
- keep live UI unchanged
- target export/PDF only
- name the exact block that must match the UI
- add a regression check for other exported metrics/cards

### Text wraps in PDF but not in UI
Usually caused by:
- insufficient available width
- break opportunity between label and value
- missing atomic grouping
- line-height/font-size mismatch
- export engine rendering differences

Preferred fix direction:
- treat the metric block as atomic
- preserve visual grouping
- avoid broad global typography changes
- scope the fix to the affected metric/card if possible

### Wrong background outside main container
Usually points to:
- body/root/app shell background
- shared theme wrapper
- variant-specific shell override

Preferred fix direction:
- target the outer shell layer
- do not only restyle the inner content container
- check sibling tools that share the same shell/theme logic

### Wrong label shown in repeated items
Usually points to:
- overly broad conditional display logic
- index-based rule not enforced
- mapping/render loop rule attached to all items
- stale suggestion transformation logic

Preferred fix direction:
- state the display rule deterministically
- specify whether the condition is index-based or data-based
- explicitly say what all non-matching items must do

### Button or interactive control appears in exported PDF
Usually points to:
- export layer not excluding interactive-only elements
- print/export visibility rules incomplete
- export template reusing UI component without hiding controls

Preferred fix direction:
- remove the control from export only
- keep the interactive UI unchanged
- verify no other interactive-only elements leak into export

### Zoom and Focus Mode Issues
Usually points to:
- **Border Thickening:** `zoom` or `scale` increases border-width visually. Fix: use `calc(1px / var(--zoom-factor))` or similar inverse scaling.
- **Visual Flicker/Blink:** Transitions between zoomed states are visible. Fix: use a `zoom-pending` class with `visibility: hidden` and `transition: none` while computing.
- **Initial Fit Failure:** Layout hasn't settled after container size changes. Fix: use `double-requestAnimationFrame` or a small `setTimeout` (100ms) before measurement.
- **Transition Interference:** CSS transitions (e.g. `all 0.3s`) return stale `getBoundingClientRect()` values. Fix: disable transitions during measurements.

### AG says fixed but nothing changed
Usually means:
- prompt was underspecified
- wrong surface was targeted
- wrong variant was modified
- fix was applied to UI but bug is in export
- shared component was not actually changed
- the visible path uses a different render path than assumed

Preferred response:
- rewrite the prompt more narrowly
- state the exact artifact where the bug remains
- state what must remain unchanged
- add verification language

## 3. When to suspect a shared issue

Suspect a shared component or shared shell issue when:

- multiple tools show the same visual inconsistency
- the problem affects outer background, common cards, or shell styling
- one design variant looks correct and another does not
- the same metric/card pattern breaks in multiple places
- the user explicitly asks for consistency across tools

When shared impact is likely:
- say so explicitly
- Xác định các file anh em bị ảnh hưởng.
- **KHÔNG** sửa ngay lập tức.
- Nêu rõ các file này trong phần "Next Potential Steps".
- Đề xuất sửa hệ thống chỉ khi ở chế chế độ Godmode.

## 4. When to keep scope local

Prefer a local fix when:

- the issue appears only in one PDF/export path
- only one repeated list has incorrect label behavior
- only one card/metric is wrapping incorrectly
- only one tool variant shows the issue
- evidence does not support broader propagation

When local impact is likely:
- keep the prompt narrow
- protect all unrelated behavior
- avoid redesigning shared layers without evidence

## 5. Repeat-failure protocol

If the user says a prior fix did not work:

1. Assume the previous prompt may have targeted the wrong layer
2. Restate the exact remaining symptom
3. Identify the precise artifact where the issue still appears
4. Rewrite the prompt with tighter scope
5. Add specific verification checks
6. Do not simply paraphrase the old prompt

## 6. Output preference

Prefer compact outputs.

Default structure:
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

Use longer reasoning only when the user clearly needs it.

## 7. Learning loop (mandatory)

This playbook is not only for thinking. It is also part of the DEC learning system.

### Before starting any task
AG must:

1. Bám sát `SKILL.md` (luật lõi)
2. Chỉ mở playbook này khi cần heuristic hoặc pattern chẩn đoán
3. Chỉ truy xuất lesson liên quan trong `AG_LESSONS.jsonl` theo:
   - tags
   - files
   - symptoms
   - surfaces
4. Summarize the relevant risks before proposing a fix
5. Avoid re-debugging from scratch if a known pattern already exists

### After completing any task
AG must decide whether the task produced a reusable lesson.

If yes:
1. Append one structured lesson to `AG_LESSONS.jsonl`
2. Update this playbook only if the lesson reveals a reusable generalized pattern
3. Mark whether the result is:
   - `local fix only`
   - `system pattern`

### Do not write noise
Do not log:
- trivial steps
- temporary observations
- vague commentary
- one-off notes with no reuse value

Only log lessons that improve future work.

### Required lesson fields
Each lesson must include:

- date
- issue
- symptom
- root_cause
- fix
- avoid
- regression_checks
- files
- tags
- scope

## 8. Lessons log format

Preferred file: `AG_LESSONS.jsonl`

Each line should be one JSON object.

Example:

```json
{"date":"2026-04-02","issue":"PDF metric text wraps incorrectly","symptom":"value and label split across two lines in exported PDF but not live UI","root_cause":"export render width and grouping differ from browser layout","fix":"treat metric row as atomic and scope export-only layout fix to the affected card","avoid":"do not apply broad global typography changes when only export is broken","regression_checks":["live UI unchanged","PDF metric card matches UI","other metric cards still export correctly"],"files":["Template/DashboardTemp.html","Template/Dashboard.css"],"tags":["pdf","layout","export","regression"],"scope":"system pattern"}```

## 9. Decision handoff expectation

When AG reports a diagnosis or a fix plan, it should explicitly say:

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
## 10. Recommended companion files

This playbook works best with:

dec-debug-playbook.md -> core debug thinking
AG_LESSONS.jsonl -> reusable case memory
AG_DECISION_RULES.md -> behavior rules before and after execution

If only one file exists, this playbook still helps.
If all three exist, AG becomes more consistent and less likely to repeat old mistakes.