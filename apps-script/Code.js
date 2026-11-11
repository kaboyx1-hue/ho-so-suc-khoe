// May chu cua Ho So Suc Khoe: luu du lieu vao Google Sheet cua chinh script nay.
// Khong co mat khau trong file nay. Khoa rieng duoc giu trong Script Properties.

const BANG = {
  hs: { ten: 'HO_SO', cot: ['id', 'ten', 'sinh', 'gioi', 'cao', 'nhomMau', 'diUng', 'benh', 'thuoc', 'lienHe', 'ghi', 'vanDong', 'mucKcal', 'mucNuoc', 'sua', 'xoa', 'rev'],
    chu: ['id', 'ten', 'sinh', 'gioi', 'nhomMau', 'diUng', 'benh', 'thuoc', 'lienHe', 'ghi'] },
  cs: { ten: 'CHI_SO', cot: ['id', 'ngay', 'gio', 'loai', 'a', 'b', 'c', 'ghi', 'sua', 'xoa', 'rev'], chu: ['id', 'ngay', 'gio', 'loai', 'ghi'] },
  an: { ten: 'AN_UONG', cot: ['id', 'ngay', 'gio', 'bua', 'mon', 'luong', 'kcal', 'dam', 'bot', 'beo', 'ghi', 'sua', 'xoa', 'rev'],
    chu: ['id', 'ngay', 'gio', 'bua', 'mon', 'luong', 'ghi'] },
  ks: { ten: 'KHAM_BENH', cot: ['id', 'ngay', 'loai', 'noi', 'ten', 'ketQua', 'ghi', 'sua', 'xoa', 'rev'], chu: ['id', 'ngay', 'loai', 'noi', 'ten', 'ketQua', 'ghi'] },
};
const TOI_DA_MOI_LAN = 500;

function doGet() {
  return ContentService.createTextOutput('Ho So Suc Khoe dang chay.');
}

function doPost(e) {
  try {
    return tra_(xuLy_(JSON.parse(e.postData.contents)));
  } catch (loi) {
    return tra_({ ok: false, loi: String(loi && loi.message || loi) });
  }
}

function tra_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function xuLy_(goi) {
  const khoa = goi && goi.k;
  if (typeof khoa !== 'string' || !/^[\w-]{32,128}$/.test(khoa)) return { ok: false, loi: 'khoa' };

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const kho = PropertiesService.getScriptProperties();
    const daCo = kho.getProperty('KHOA');
    if (!daCo) kho.setProperty('KHOA', khoa); // link rieng dau tien mo so; ai khac khong biet dia chi nay
    else if (daCo !== khoa) return { ok: false, loi: 'khoa' };

    // Mat ma: link rieng thoi chua du, phai co "the" duoc cap sau khi nhap dung mat ma.
    const pin = kho.getProperty('PIN');
    if (goi.hoiPin) return { ok: true, coPin: !!pin };
    if (goi.datPin !== undefined) {
      if (pin) return { ok: false, loi: 'da co mat ma' };
      if (!pinHopLe_(goi.datPin)) return { ok: false, loi: 'mat ma phai du 6 so' };
      return { ok: true, the: luuPin_(kho, goi.datPin) };
    }
    if (goi.pin !== undefined) return thuPin_(kho, goi.pin, pin);
    if (pin && goi.the !== theCua_(pin)) return { ok: false, loi: 'pin' };
    if (goi.pinMoi !== undefined) {
      if (!pinHopLe_(goi.pinMoi)) return { ok: false, loi: 'mat ma phai du 6 so' };
      const cu = thuPin_(kho, goi.pinCu, pin);
      return cu.ok ? { ok: true, the: luuPin_(kho, goi.pinMoi) } : cu;
    }

    const thay = Array.isArray(goi.thay) ? goi.thay : [];
    if (thay.length > TOI_DA_MOI_LAN) return { ok: false, loi: 'qua nhieu ban ghi' };
    const tu = Number(goi.tu) || 0;
    let rev = Number(kho.getProperty('REV')) || 0;

    // Khong co gi moi thi khoi doc Sheet, moi may tu dong hoi 1 phut 1 lan.
    if (!thay.length && tu === rev) return { ok: true, ds: [], tu: rev, boQua: [] };

    const boQua = [];
    const theoBang = {};
    for (const m of thay) {
      if (!hopLe_(m)) { boQua.push(m && m.r && m.r.id); continue; }
      (theoBang[m.b] = theoBang[m.b] || []).push(m.r);
    }

    const ds = [];
    for (const b of Object.keys(BANG)) {
      const sh = bangCua_(b);
      const cot = BANG[b].cot;
      const hang = doc_(sh, b);
      const viTri = {};
      hang.forEach((r, i) => { viTri[r.id] = i; });

      for (const r of theoBang[b] || []) {
        const i = viTri[r.id];
        if (i !== undefined && hang[i].sua > r.sua) continue; // ban tren Sheet moi hon
        const moi = Object.assign({}, r, { rev: ++rev });
        const dong = cot.map(c => giaTriO_(b, c, moi[c]));
        if (i !== undefined) {
          sh.getRange(i + 2, 1, 1, cot.length).setValues([dong]);
          hang[i] = moi;
        } else {
          nhoiHang_(sh, b, hang.length + 2);
          sh.getRange(hang.length + 2, 1, 1, cot.length).setValues([dong]);
          viTri[r.id] = hang.length;
          hang.push(moi);
        }
      }
      for (const r of hang) if (r.rev > tu) ds.push({ b, r });
    }

    kho.setProperty('REV', String(rev));
    return { ok: true, ds, tu: rev, boQua };
  } finally {
    lock.releaseLock();
  }
}

const pinHopLe_ = p => typeof p === 'string' && /^\d{6}$/.test(p);

function bam_(s) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8));
}
const theCua_ = pin => bam_(pin + ':the');

// Chi luu ban bam kem muoi, khong luu mat ma. Doi mat ma thi moi the cu het hieu luc.
function luuPin_(kho, p) {
  const muoi = Utilities.getUuid();
  const pin = muoi + '.' + bam_(muoi + ':' + p);
  kho.setProperty('PIN', pin);
  kho.setProperty('PIN_SAI', '0');
  kho.setProperty('PIN_DOI', '0');
  return theCua_(pin);
}

// Sai 5 lan khoa 15 phut, moi 5 lan sai tiep thoi gian khoa gap doi, toi da 1 ngay.
function thuPin_(kho, p, pin) {
  if (!pin) return { ok: false, loi: 'chua co mat ma' };
  const bayGio = Date.now();
  const doi = Number(kho.getProperty('PIN_DOI')) || 0;
  if (bayGio < doi) return { ok: false, loi: 'khoaPin', doi: doi - bayGio };

  const [muoi, bam] = pin.split('.');
  if (pinHopLe_(p) && bam_(muoi + ':' + p) === bam) {
    kho.setProperty('PIN_SAI', '0');
    return { ok: true, the: theCua_(pin) };
  }
  const sai = (Number(kho.getProperty('PIN_SAI')) || 0) + 1;
  kho.setProperty('PIN_SAI', String(sai));
  if (sai % 5) return { ok: false, loi: 'saiPin', conLai: 5 - sai % 5 };
  const lau = Math.min(86400000, 900000 * 2 ** (sai / 5 - 1));
  kho.setProperty('PIN_DOI', String(bayGio + lau));
  return { ok: false, loi: 'khoaPin', doi: lau };
}

// Dinh dang chu thuan khong du: Sheets that van tinh "=1+1" thanh 2 va nuot dau ' o dau.
// Them mot dau ' phia truoc thi Sheets giu nguyen van va khong luu dau nay.
function giaTriO_(b, c, v) {
  if (v === undefined) return '';
  return BANG[b].chu.includes(c) && /^[=+\-@']/.test(v) ? "'" + v : v;
}

// Kiem theo kieu cot: cot chu nhan chuoi, cot so nhan so. Bang co ngay thi ngay phai that.
function hopLe_(m) {
  const r = m && m.r;
  const bg = m && BANG[m.b];
  if (!r || !bg || typeof r.id !== 'string' || !/^[\w-]{1,48}$/.test(r.id)) return false;
  if (!(Number.isFinite(r.sua) && r.sua > 0) || (r.xoa !== 0 && r.xoa !== 1)) return false;
  for (const c of bg.cot) {
    if (c === 'id' || c === 'sua' || c === 'xoa' || c === 'rev' || r[c] === undefined) continue;
    const v = r[c];
    if (bg.chu.includes(c) ? !(typeof v === 'string' && v.length <= 2000) : !(typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e9)) return false;
  }
  if (bg.cot.includes('ngay') && !ngayThat_(r.ngay)) return false;
  if (r.sinh && !ngayThat_(r.sinh)) return false;
  if (r.gio && !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.gio)) return false;
  return true;
}

function ngayThat_(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function bangCua_(b) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const { ten, cot, chu } = BANG[b];
  // File Sheet tao bang lenh (chua tung mo tren trinh duyet) co the bao "Sheet ... not found"
  // khi doc danh sach trang: luc do bo qua trang mac dinh, tao thang trang moi.
  let sh = null, dsTrang = null;
  try { sh = ss.getSheetByName(ten); dsTrang = ss.getSheets(); } catch (e) { /* file chua dung xong */ }
  if (sh) return sh;

  // Dung lai trang trong mac dinh cua file moi, khong de thua "Sheet1".
  const dau = dsTrang && dsTrang[0];
  const laTrangMacDinh = !!dau && dau.getLastRow() === 0 && !Object.values(BANG).some(x => x.ten === dau.getName());
  if (laTrangMacDinh) { sh = dau; sh.setName(ten); }
  else sh = ss.insertSheet(ten);

  sh.getRange(1, 1, 1, cot.length).setValues([cot]).setFontWeight('bold');
  sh.setFrozenRows(1);
  // Dinh dang chu thuan: Sheets khong tu doi "2026-11-01" thanh ngay.
  dinhDangChu_(sh, b, 1, sh.getMaxRows());
  return sh;
}

function dinhDangChu_(sh, b, tuHang, soHang) {
  const { cot, chu } = BANG[b];
  for (const c of chu) sh.getRange(tuHang, cot.indexOf(c) + 1, soHang, 1).setNumberFormat('@');
}

// File Sheet moi chi co 1000 hang, ghi qua do se bao loi.
function nhoiHang_(sh, b, hang) {
  const max = sh.getMaxRows();
  if (hang <= max) return;
  sh.insertRowsAfter(max, 1000);
  dinhDangChu_(sh, b, max + 1, 1000);
}

function doc_(sh, b) {
  const { cot, chu } = BANG[b];
  const dong = sh.getLastRow() - 1;
  if (dong < 1) return [];
  return sh.getRange(2, 1, dong, cot.length).getValues().map(v => {
    const r = {};
    cot.forEach((c, i) => { r[c] = chu.includes(c) ? String(v[i]) : Number(v[i]) || 0; });
    return r;
  });
}

// Quen mat ma: chay ham nay trong trinh soan thao, so van con nguyen, mo app se dat mat ma moi.
function xoaPin() {
  const kho = PropertiesService.getScriptProperties();
  ['PIN', 'PIN_SAI', 'PIN_DOI'].forEach(k => kho.deleteProperty(k));
  Logger.log('Da xoa mat ma.');
}

// Chay 1 lan trong trinh soan thao de cap quyen cho script doc ghi Sheet nay.
function capQuyen() {
  Object.keys(BANG).forEach(bangCua_);
  Logger.log('Xong. Sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
}
