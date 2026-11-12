# Hồ Sơ Sức Khoẻ

Sổ sức khoẻ cá nhân dùng trên điện thoại: thông tin khẩn cấp (nhóm máu, dị ứng, bệnh nền, thuốc, người liên hệ), cân nặng/BMI, đo da (độ ẩm, độ nhờn từng vùng, kèm nhiệt độ và độ ẩm phòng), nhật ký ăn uống có calo, đạm/tinh bột/béo, mức histamine và các yếu tố liên quan mụn (danh mục 211 món Việt có sẵn, gõ nhiều món cách nhau dấu phẩy), lịch sử khám bệnh, xét nghiệm, tiêm chủng.

Mở được khi mất mạng. Mục nhập lúc mất mạng nằm chờ trên máy, có mạng tự gửi lên Google Sheet riêng của bạn.

## Cấu trúc

| Phần | Vai trò |
|---|---|
| `index.html`, `app.js` | Giao diện |
| `tinh.js` | BMI, kiểm số đo, calo cần mỗi ngày, khớp tên món, điểm histamine, gộp dữ liệu (không đụng giao diện) |
| `mon-an.js` | Danh mục món ăn tham khảo (calo, histamine, cờ da mụn). Không đồng bộ lên Sheet |
| `sw.js`, `manifest.webmanifest` | Mở được khi mất mạng, thêm ra màn hình chính |
| `apps-script/` | Máy chủ: Google Apps Script gắn với Sheet riêng |
| `tests/` | Kiểm thử: `node --test "tests/test_*.js"`. Thử cả app với Sheet giả: `node tests/may_gia.js` rồi mở http://localhost:8881 |

## Cài đặt lần đầu (làm 1 lần)

1. Tạo Google Sheet mới, đặt tên tuỳ ý (vd "HO SO SUC KHOE").
2. Trong Sheet: **Tiện ích mở rộng → Apps Script**. Xoá hết chữ có sẵn, dán toàn bộ `apps-script/Code.js`.
3. Bấm ⚙ **Project Settings**, bật "Show appsscript.json", mở file đó và dán nội dung `apps-script/appsscript.json`.
4. Chọn hàm `capQuyen` → **Run** → cho phép quyền. Sheet sẽ có 4 trang: HO_SO, CHI_SO, AN_UONG, KHAM_BENH. Hàm này tạo luôn **khoá riêng** và in ra ở nhật ký thực thi (Execution log): chép lại, giữ kín.
5. **Deploy → New deployment → Web app**: Execute as *Me*, Who has access *Anyone*. Chép **Deployment ID**. Phải tạo trong trình soạn thảo, bản tạo bằng lệnh `clasp` từng bị Google chặn.
6. Link riêng của bạn: `https://<tên-github>.github.io/ho-so-suc-khoe/#<Deployment ID>.<khoá>`
   Mở link này trên điện thoại, đặt mật mã 6 số, rồi "Thêm vào màn hình chính".

Sổ chỉ nhận đúng khoá do `capQuyen` tạo (chỉ chủ tài khoản Google chạy được), không ai mở trước để chiếm sổ được. Bản cũ trước 12/11/2026 (sổ tự nhận khoá của link mở đầu tiên) vẫn giữ nguyên khoá đã nhận.

## Bảo mật

Repo công khai và **không chứa dữ liệu nào**. Phần sau dấu `#` của link không được trình duyệt gửi lên GitHub. Ngoài link còn mật mã 6 số: máy chủ chỉ giữ bản băm, sai 5 lần khoá 15 phút, thời gian khoá tăng dần. Quên mật mã: chạy hàm `xoaPin` trong Apps Script, dữ liệu không mất. Số lần nhập sai trên máy được lưu lại (tải lại trang không xoá được), sai 5 lần thì phải hỏi máy chủ. Dữ liệu lưu sẵn trên máy không được mã hoá, mật mã ở máy chỉ che màn hình: ai cầm được điện thoại đã mở khoá và biết dùng công cụ trình duyệt vẫn đọc được, nên hãy đặt khoá màn hình điện thoại.

Đổi khoá khi nghi lộ link: chạy hàm `doiKhoa` trong Apps Script, chép khoá mới ở nhật ký thực thi, mở app bằng link mới. Link cũ hết dùng được.

## Lưu ý

BMI theo ngưỡng người châu Á chỉ để tham khảo, không thay chẩn đoán của bác sĩ. Điểm histamine là ước lượng tương đối (món thấp 0, trung bình 1, cao 3), không phải số đo y khoa và không có ngưỡng chuẩn chung; mức của đa số món Việt là suy ra theo nguyên liệu. Calo trong danh mục là ước tính theo khẩu phần phổ biến, chưa đối chiếu Bảng thành phần thực phẩm Việt Nam. Đo da là công cụ tự quan sát tương quan, không phải xác nhận y khoa. Calo cần mỗi ngày tính theo công thức Mifflin-St Jeor nhân mức vận động; muốn số khác thì tự điền ở Hồ sơ.

## Phát hành

- Giao diện: đẩy lên `main`, GitHub Pages tự cập nhật. Đổi `KHO` trong `sw.js` mỗi lần đổi danh sách tệp.
- Máy chủ: dán lại `Code.js`, rồi Deploy → Manage deployments → sửa bản đang dùng → New version (giữ nguyên link).
