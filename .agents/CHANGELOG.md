# CHANGELOG

## v1.4.0 - 2026-04-03
- Bổ sung các **Heuristic Xử lý Zoom và Focus Mode** vào `dec-debug-playbook.md`:
  - Kỹ thuật **Non-scaling border**: Sử dụng `calc(1px / zoom)` để giữ viền 1px không bị dày lên khi phóng to.
  - Kỹ thuật **Zoom-pending visibility toggle**: Ẩn phần tử trong lúc tính toán Zoom để loại bỏ hiện tượng "nháy" (flicker).
  - Kỹ thuật **Layout Settlement Timing**: Sử dụng `setTimeout(100ms)` hoặc `double-rAF` để đảm bảo trình duyệt đã tính toán xong khung nhìn (viewport) trước khi đo đạc kích thước Zoom.
  - Kỹ thuật **Transition Interference**: Vô hiệu hóa CSS transitions trong lúc đo đạc để tránh lấy sai giá trị `getBoundingClientRect()`.
 
+## v1.3.0 - 2026-04-03
- Triển khai **Chế độ vận hành mặc định: Isolation First**:
  - Tuyệt đối chỉ sửa file được yêu cầu, không tự ý sửa lan sang các sibling tools/shared files.
  - Quy trình 3 bước: Sửa -> Xác nhận -> Gợi ý file tiếp theo.
  - Thêm mục `Operational Mode` và `Next Potential Steps` vào form báo cáo chuẩn.
- Bổ sung quy tắc **Sửa Gốc, Không Sửa Ngọn (Source-fix Only)**: Luôn fix lỗi từ file nguồn/template (như `UltiTemp.html`, `ToolListening`) để đảm bảo không tái diễn lỗi ở các file output sau này, tuyệt đối không sửa trực tiếp file kết quả (như `result.html`).
- Bổ sung cơ chế **Godmode**: Cho phép sửa hàng loạt và đồng bộ hệ thống khi có từ khóa trigger.
- Cập nhật quy trình Housekeeping: Tách biệt việc tự động cập nhật nhật ký (logs) khỏi giới hạn Isolation của file chức năng.

## v1.2.0 - 2026-04-02
 
+## v1.1.3 - 2026-04-02
+- đồng bộ triệt để `AG_DECISION_RULES.md` với `SKILL.md` (luật lõi)
+- sửa các rule gây hiểu lầm về việc "đọc mọi tài liệu" (no full read/scan bypass)
+- thống nhất form báo cáo ở mọi vị trí trong file rules
+
 
+## v1.1.2 - 2026-04-02
+- chuẩn hóa form báo cáo bắt buộc trên tất cả các file (`SKILL.md`, `dec-debug-playbook.md`, `AG_DECISION_RULES.md`)
+- bổ sung trường `Matching lessons:` vào mẫu tóm tắt và mẫu báo cáo để đảm bảo kết nối memory
+

## v1.1.1 - 2026-04-02
- sửa "hiểu nhầm quan trọng" về cơ chế nạp ngữ cảnh:
  - xác định `SKILL.md` là luật lõi duy nhất (Single Source of Truth)
  - playbook và decision rules chỉ mở khi thật sự cần heuristic
  - lessons chỉ truy xuất có chọn lọc, không quét toàn bộ (no full scan)
- loại bỏ mọi wording gây hiểu lầm là "đọc toàn bộ file" (read full) trong playbook và rules

## v1.1.0 - 2026-04-02
- chính thức xác định skill theo mode `executor-debugger`
- bổ sung lifecycle tư duy: create -> test -> deploy -> learn -> promote -> refactor
- thêm quy tắc lesson promotion: promote khi lặp lại >= 3 lần hoặc đủ giá trị khái quát
- chuẩn hóa cấu trúc skill thành các lớp:
  - SKILL.md
  - dec-debug-playbook.md
  - AG_DECISION_RULES.md
  - AG_LESSONS.jsonl
  - metadata.json
  - CHANGELOG.md
- định hướng tối ưu context (vẫn còn wording cũ cần clean up ở v1.1.1)

## v1.0.1 - 2026-04-02
- thêm AG_DECISION_RULES.md mẫu
- thêm AG_LESSONS.jsonl seed ban đầu
- thêm learning loop sau task:
  - append lesson nếu reusable
  - update playbook nếu phát hiện pattern khái quát

## v1.0.0 - 2026-04-02
- khởi tạo skill `dec-dev-operator`
- xác định vai trò:
  - thực thi
  - debug
  - QA
  - chống regression
- thêm quy tắc vận hành cốt lõi:
  - không regression
  - không hardcode mong manh
  - không sửa lan ngoài phạm vi
  - nếu liên quan PDF/export phải bám UI thật
- thêm form báo cáo chuẩn:
  - Quick diagnosis
  - Likely layer
  - Likely scope
  - Fix direction
  - Must remain unchanged
  - Regression checks
  - Lesson to append? yes/no
