# AG Prompt Patterns

Use these prompt patterns when turning DEC bugs into Antigravity-ready implementation requests.

Keep prompts narrow, deterministic, and scoped to the correct layer.

## Core prompt structure

Use this structure unless a shorter one is enough:

### Issue
Describe the visible bug precisely.

### Expected behavior
Describe the correct behavior precisely.

### Implementation guidance
Point AG to the correct surface/layer and clarify scope.

### Constraints
State what must remain unchanged.

### Verification
State what to check after the fix.

---

## Pattern 1: UI bug fix

Issue:
[describe the visible UI bug precisely]

Expected behavior:
[describe exactly how the UI should look or behave]

Implementation guidance:
Fix this in the live UI layer for [component/view/tool]. Keep the change narrowly scoped to the affected area.

Constraints:
Do not change unrelated layout, logic, theme, or neighboring components.

Verification:
Confirm the target UI now matches the expected behavior and no unrelated visual changes were introduced.

---

## Pattern 2: PDF/export mismatch

Issue:
In the exported PDF, [describe the mismatch precisely]. The live UI currently behaves correctly.

Expected behavior:
The exported PDF should match the live UI for this element/metric/card.

Implementation guidance:
Fix this in the export/PDF render layer, not the live UI layer. Preserve the current live UI appearance.

Constraints:
Do not change the live UI. Do not alter unrelated PDF sections or scoring/data logic.

Verification:
Compare the updated exported PDF against the current UI and confirm this mismatch is resolved without introducing new layout regressions.

---

## Pattern 3: Text wrapping incorrectly in PDF

Issue:
In the exported PDF, [label/value/metric] wraps onto multiple lines even though it appears correctly on one line in the live UI.

Expected behavior:
This text block should remain visually grouped and render on one line when space allows, matching the live UI presentation.

Implementation guidance:
Fix this at the export/PDF rendering layer. Treat the affected text block as an atomic visual group and preserve the existing UI grouping.

Constraints:
Do not globally change typography, spacing, or unrelated cards unless required. Keep the live UI unchanged.

Verification:
Export again and confirm the affected text block no longer breaks incorrectly and that nearby metrics/cards still render correctly.

---

## Pattern 4: Wrong conditional label in repeated items

Issue:
The label "[label]" is being shown on multiple items in [list/card group], but it should not.

Expected behavior:
Only [the first item / items matching a specific condition] should render this label. All other items must render without it.

Implementation guidance:
Fix the conditional display logic in the repeated render path for this list/card group. Make the display rule deterministic and scoped to the intended condition.

Constraints:
Do not change item order, suggestion logic, or unrelated labels.

Verification:
Confirm the label appears only on the intended item(s) and nowhere else in that repeated list.

---

## Pattern 5: Interactive control leaking into PDF/export

Issue:
An interactive control such as [button/control name] is appearing in the exported PDF.

Expected behavior:
This control should remain visible in the interactive UI if needed, but it must not appear in the exported PDF.

Implementation guidance:
Exclude this element from the export/PDF layer only. Keep the interactive UI behavior unchanged.

Constraints:
Do not remove the control from the live UI. Do not affect nearby text, layout, or other export content.

Verification:
Export again and confirm the control no longer appears in the PDF while the live UI still behaves normally.

---

## Pattern 6: Wrong outer background / shell theme

Issue:
The background outside the main body/container is using the wrong theme/style in [tool/view/variant].

Expected behavior:
The outer shell/background should match [reference tool/variant].

Implementation guidance:
Fix the outer shell/root/background layer của tool/view này. Nếu layer này dùng chung với các tool khác, CHỈ sửa cho tool hiện tại. Nêu các tool khác vào mục "Next Potential Steps" để xử lý sau.

Constraints:
Do not redesign the inner content panel. Keep the existing card/content layout unchanged unless needed for consistency.

Verification:
Confirm the outer background now matches the intended reference and check sibling tools that share the same shell logic.

---

## Pattern 7: Shared-component consistency fix

Issue:
[describe the inconsistency] appears to come from a shared component or shared shell layer.

Expected behavior:
Tool/view hiện tại sử dụng shared component này phải render chính xác.

Implementation guidance:
Sửa lỗi tại shared component/shell level nhưng chỉ kiểm tra tác động trên tool hiện tại. Liệt kê các tool khác dùng shared component này vào danh sách gợi ý sửa tiếp theo.

Constraints:
Do not change local behavior in unrelated components. Keep the fix limited to the shared source of truth.

Verification:
Check at least the original affected tool and the closest sibling tool that shares the same component/shell.

---

## Pattern 8: “Fix did not work” rewrite

Issue:
The previous fix did not resolve the bug. The issue still appears in [exact artifact/surface].

Expected behavior:
[describe the exact expected result]

Implementation guidance:
Re-evaluate the target layer. This appears to be a [export/UI/shared-component/conditional-logic] issue, so apply the fix there instead of repeating the previous approach.

Constraints:
Keep unaffected behavior unchanged. Do not widen scope without evidence.

Verification:
Confirm the issue is resolved in the exact artifact where it previously remained visible, and verify no new regressions were introduced.

---

## Compression rules

When the user wants a shorter prompt:
- keep only the exact symptom
- state the correct surface
- define expected behavior
- add one strong scope guard

## Quality checks

Before returning a prompt, verify that it:
- names the exact bug
- names the exact surface
- states the expected behavior
- protects unrelated behavior
- does not use vague wording unless the user wants open-ended design changes
