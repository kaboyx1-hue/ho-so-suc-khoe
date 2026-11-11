# Hồ Sơ Sức Khoẻ

Sổ sức khoẻ cá nhân dùng trên điện thoại: thông tin khẩn cấp (nhóm máu, dị ứng, bệnh nền, thuốc, người liên hệ), chỉ số (cân nặng/BMI, huyết áp, đường huyết, nhịp tim, SpO₂, nhiệt độ, giấc ngủ, nước, bước chân, vòng eo), nhật ký ăn uống có calo và đạm/tinh bột/béo, lịch sử khám bệnh, xét nghiệm, tiêm chủng.

Mở được khi mất mạng. Mục nhập lúc mất mạng nằm chờ trên máy, có mạng tự gửi lên Google Sheet riêng của bạn.

## Cấu trúc

| Phần | Vai trò |
|---|---|
| `index.html`, `app.js` | Giao diện |
| `tinh.js` | BMI, đánh giá chỉ số, calo cần mỗi ngày, gộp dữ liệu (không đụng giao diện) |
| `sw.js`, `manifest.webmanifest` | Mở được khi mất mạng, thêm ra màn hình chính |
| `apps-script/` | Máy chủ: Google Apps Script gắn với Sheet riêng |
| `tests/` | Kiểm thử: `node --test "tests/test_*.js"`. Thử cả app với Sheet giả: `node tests/may_gia.js` rồi mở http://localhost:8881 |

## Cài đặt lần đầu (làm 1 lần)

1. Tạo Google Sheet mới, đặt tên tuỳ ý (vd "HO SO SUC KHOE").
2. Trong Sheet: **Tiện ích mở rộng → Apps Script**. Xoá hết chữ có sẵn, dán toàn bộ `apps-script/Code.js`.
3. Bấm ⚙ **Project Settings**, bật "Show appsscript.json", mở file đó và dán nội dung `apps-script/appsscript.json`.
4. Chọn hàm `capQuyen` → **Run** → cho phép quyền. Sheet sẽ có 4 trang: HO_SO, CHI_SO, AN_UONG, KHAM_BENH.
5. **Deploy → New deployment → Web app**: Execute as *Me*, Who has access *Anyone*. Chép **Deployment ID**. Phải tạo trong trình soạn thảo, bản tạo bằng lệnh `clasp` từng bị Google chặn.
6. Tự tạo một khoá ngẫu nhiên (ít nhất 32 ký tự chữ/số), ví dụ chạy:
   `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`
7. Link riêng của bạn: `https://<tên-github>.github.io/ho-so-suc-khoe/#<Deployment ID>.<khoá>`
   Mở link này trên điện thoại, đặt mật mã 6 số, rồi "Thêm vào màn hình chính".

Link riêng đầu tiên mở sổ sẽ khoá sổ vào khoá đó; link khác khoá không đọc ghi được gì.

## Bảo mật

Repo công khai và **không chứa dữ liệu nào**. Phần sau dấu `#` của link không được trình duyệt gửi lên GitHub. Ngoài link còn mật mã 6 số: máy chủ chỉ giữ bản băm, sai 5 lần khoá 15 phút, thời gian khoá tăng dần. Quên mật mã: chạy hàm `xoaPin` trong Apps Script, dữ liệu không mất. Dữ liệu lưu sẵn trên máy không được mã hoá, mật mã ở máy chỉ che màn hình.

Đổi khoá khi nghi lộ link: Apps Script → Project Settings → Script Properties, xoá `KHOA`, rồi mở link riêng mới.

## Lưu ý

Các đánh giá (BMI theo ngưỡng người châu Á, huyết áp, đường huyết lúc đói, SpO₂, nhiệt độ) chỉ để tham khảo, không thay chẩn đoán của bác sĩ. Calo cần mỗi ngày tính theo công thức Mifflin-St Jeor nhân mức vận động; muốn số khác thì tự điền ở Hồ sơ.

## Phát hành

- Giao diện: đẩy lên `main`, GitHub Pages tự cập nhật. Đổi `KHO` trong `sw.js` mỗi lần đổi danh sách tệp.
- Máy chủ: dán lại `Code.js`, rồi Deploy → Manage deployments → sửa bản đang dùng → New version (giữ nguyên link).
