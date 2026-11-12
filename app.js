'use strict';
const KHOA_KHO = 'hssk_v1';
const KHOA_PIN = 'hssk_pin';
const BUA = [['sang', 'Bữa sáng', '🌅'], ['trua', 'Bữa trưa', '☀️'], ['toi', 'Bữa tối', '🌙'], ['phu', 'Ăn vặt, đồ uống', '🍪']];
const LOAI_KHAM = [['kham', 'Khám bệnh', '🏥'], ['xetnghiem', 'Xét nghiệm', '🧪'], ['tiem', 'Tiêm chủng', '💉'], ['thuoc', 'Đơn thuốc', '💊']];
const NHOM_MAU = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VAN_DONG = [['1.2', 'Ít vận động'], ['1.375', 'Nhẹ, 1–3 buổi/tuần'], ['1.55', 'Vừa, 3–5 buổi/tuần'], ['1.725', 'Nhiều, 6–7 buổi/tuần']];
const MAU_LOAI = { can: '#2f80ed', da_tran: '#0ca678', da_mui: '#e8590c', da_ma: '#c2255c', da_cam: '#7048e8', phong: '#868e96', pu: '#d6336c' };
const MAU_AM = '#1c7ed6', MAU_NHON = '#e69500', MAU_HIS = '#e03131';
const KHOA_SAI = 'hssk_pinsai';
const KHOA_NHAP = 'hssk_nhapdo'; // muc dang ghi do luc roi app, mo khoa xong mo lai dung cho
const MON = T.gopDanhMuc((typeof MON_AN_HISTAMINE !== 'undefined' && MON_AN_HISTAMINE) || [], (typeof MON_BIEN_THE !== 'undefined' && MON_BIEN_THE) || []);
const HIS_CHU = ['His thấp', 'His trung bình', 'His cao'];
const MIEN_TRU_HIS = 'Điểm histamine chỉ là ước lượng tương đối (món thấp 0, trung bình 1, cao 3), không phải số đo y khoa. Không có ngưỡng chuẩn chung: mức chịu đựng khác nhau theo từng người. Mức của đa số món Việt là suy ra theo nguyên liệu, chưa được đo trực tiếp.';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const taoId = () => Date.now().toString(36) + '-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
const GIAM = matchMedia('(prefers-reduced-motion:reduce)');

// ---- Luu tren may ----
let S = docKho();
let tab = 'tq', ngay = T.homNay(), loaiCs = 'can', vungDa = '';
const LOAI_XEM = ['can', 'da', 'pu']; // tab Chi so: can nang, da (gom 4 vung + phong)
let F = null; // muc dang mo trong hop nhap: { b, moi, r }
let trangThai = { dang: false, loi: '', luc: 0 };
let huong = 0;

function docKho() {
  let o = null;
  try { o = JSON.parse(localStorage.getItem(KHOA_KHO)); } catch (e) { /* hong thi tao moi, Sheet van con ban day du */ }
  return Object.assign({ hs: {}, cs: {}, an: {}, ks: {}, ban: {}, tu: 0, lk: null }, o);
}
function luuKho() {
  try { localStorage.setItem(KHOA_KHO, JSON.stringify(S)); }
  catch (e) { baoLoi('Máy hết chỗ lưu, mục vừa nhập có thể mất nếu tắt app'); }
}
function ghi(b, r) {
  r.sua = T.moc(S[b][r.id]);
  S[b][r.id] = r;
  S.ban[b + ':' + r.id] = 1;
  luuKho();
  henDongBo(800);
}
const ds = b => Object.values(S[b]);
const hoSo = () => (S.hs.toi && !S.hs.toi.xoa ? S.hs.toi : null);
const canNang = () => (T.moiNhat(ds('cs'), 'can') || {}).a || 0;

// ---- Dong bo ----
function docLink(s) {
  const m = /([\w-]{20,})\.([\w-]{32,128})\s*$/.exec(String(s).split('#').pop());
  return m ? { id: m[1], k: m[2] } : null;
}
function nhanLinkTuDiaChi() {
  const lk = docLink(location.hash);
  if (lk && (!S.lk || S.lk.k !== lk.k || S.lk.id !== lk.id)) {
    if (S.lk) { S.tu = 0; boP(); } // doi so khac thi keo lai tu dau
    S.lk = lk;
    luuKho();
  }
}
let henGio = 0;
function henDongBo(ms) { clearTimeout(henGio); henGio = setTimeout(dongBo, ms); }

// Dia chi may chu cua so (khong phai khoa): may moi nhap dung mat ma thi may chu tra khoa ve.
const MAY_ID = 'AKfycbxHVYYzafR5RR7QsDLWmC3rDQVL6nB58Nq86_nM1KZX70wEaYsLN0WtCU2Wk1bpLFjk';
async function goiMay(o) {
  const kiemSoat = new AbortController();
  const dongHo = setTimeout(() => kiemSoat.abort(), 45000);
  try {
    const tl = await fetch(`https://script.google.com/macros/s/${S.lk ? S.lk.id : MAY_ID}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // kieu nay trinh duyet khong hoi truoc, Google chiu duoc
      body: JSON.stringify({ k: S.lk ? S.lk.k : '', ...o }),
      signal: kiemSoat.signal,
    });
    return await tl.json();
  } finally { clearTimeout(dongHo); }
}

async function dongBo() {
  if (!S.lk || !P) { veDongBo(); return; }
  if (trangThai.dang) return;
  trangThai.dang = true;
  veDongBo();
  let conNua = false;
  try {
    const gui = Object.keys(S.ban).slice(0, 200).map(x => {
      const i = x.indexOf(':');
      const b = x.slice(0, i);
      return { b, r: S[b] && S[b][x.slice(i + 1)] };
    }).filter(m => m.r);

    const kq = await goiMay({ the: P.the, thay: gui, tu: S.tu });
    if (kq.loi === 'pin') {
      boP();
      trangThai.dang = false;
      moKhoa('nhapMay', 'Mật mã đã đổi ở máy khác, hãy nhập mật mã mới');
      return;
    }
    if (!kq.ok) throw new Error(kq.loi === 'khoa' ? 'Link riêng không đúng, nhờ mở lại đúng link' : chuLoi(kq));

    const biTuChoi = new Set(kq.boQua || []);
    let daNhan = 0;
    for (const m of gui) {
      // Sua tiep trong luc dang gui thi van giu cho, lan sau gui ban moi hon.
      if (S[m.b][m.r.id].sua === m.r.sua && !biTuChoi.has(m.r.id)) { delete S.ban[m.b + ':' + m.r.id]; daNhan++; }
    }
    for (const m of kq.ds) if (S[m.b]) T.gop(S[m.b], m.r);
    // Ban vua gui cu hon ban may khac sua sau (vd dong ho may nay cham): may chu giu ban kia, bao cho biet.
    const cu = (kq.cu || []).map(x => S[x.b] && S[x.b][x.id]).filter(Boolean);
    if (cu.length) {
      console.warn('Xung dot dong bo, giu ban cua may khac:', kq.cu);
      bao(`${cu.length} mục vừa được sửa ở máy khác sau bạn, app giữ bản mới hơn: ${cu.slice(0, 3).map(tenMuc).join(', ')}`, null, true);
    }
    S.tu = kq.tu;
    luuKho();
    trangThai.loi = biTuChoi.size ? `${biTuChoi.size} mục không lưu được lên Sheet` : '';
    trangThai.luc = Date.now();
    conNua = daNhan > 0 && Object.keys(S.ban).length > 0;
    if (kq.ds.length) veAnToan();
  } catch (e) {
    const loiMang = e.name === 'AbortError' || e.name === 'TypeError' || e.name === 'SyntaxError';
    trangThai.loi = navigator.onLine === false ? '' : loiMang ? 'Chưa gửi được, sẽ tự thử lại' : e.message;
  }
  trangThai.dang = false;
  veDongBo();
  if (conNua) henDongBo(100);
}

function veDongBo() {
  const el = $('dongbo');
  const cho = Object.keys(S.ban).length;
  el.className = trangThai.loi ? 'loi' : trangThai.dang ? 'dang' : '';
  if (!S.lk) el.textContent = 'Chỉ lưu trên máy này. Mở bằng link riêng để lưu lên Sheet';
  else if (!P) el.textContent = 'Chưa nhập mật mã';
  else if (trangThai.loi) el.textContent = `${trangThai.loi}${cho ? ` · ${cho} mục chờ gửi` : ''}`;
  else if (trangThai.dang) el.textContent = 'Đang đồng bộ…';
  else if (cho) el.textContent = `${cho} mục chờ gửi, có mạng sẽ tự gửi`;
  else if (trangThai.luc) el.textContent = 'Đã lưu lên Sheet lúc ' + new Date(trangThai.luc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  else el.textContent = '';
}

// ---- Mat ma 6 so (giong Hu Chi Tieu) ----
let P = null; // { muoi, bam, the }
try { P = JSON.parse(localStorage.getItem(KHOA_PIN)); } catch (e) { /* hong thi nhap lai qua may chu */ }
const K = { che: '', so: '', pin1: '', cu: '', ban: false };
// So lan nhap sai luu trong may: tai lai trang khong dat lai duoc ve 0.
const soSai = () => Number(localStorage.getItem(KHOA_SAI)) || 0;
const datSai = n => { try { localStorage.setItem(KHOA_SAI, String(n)); } catch (e) { /* het cho thi thoi */ } };
const TIEU_DE = {
  canLink: 'Hồ Sơ Sức Khoẻ', moPin: 'Nhập mật mã', nhap: 'Nhập mật mã', nhapMay: 'Nhập mật mã', dat1: 'Đặt mật mã 6 số', dat2: 'Nhập lại mật mã',
  doiCu: 'Nhập mật mã hiện tại', doiMoi1: 'Nhập mật mã mới', doiMoi2: 'Nhập lại mật mã mới',
};
const QUEN = 'Vào Apps Script chạy hàm xoaPin, rồi mở lại app để đặt mật mã mới. Dữ liệu không mất.';

function boP() {
  P = null;
  try { localStorage.removeItem(KHOA_PIN); } catch (e) { /* lan sau may chu tu chan */ }
}
async function banPin(pin, muoi) {
  const ma = new TextEncoder();
  const khoa = await crypto.subtle.importKey('raw', ma.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bit = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: ma.encode(muoi), iterations: 150000, hash: 'SHA-256' }, khoa, 256);
  return [...new Uint8Array(bit)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function luuP(pin, the) {
  const muoi = taoId();
  P = { muoi, bam: await banPin(pin, muoi), the };
  try { localStorage.setItem(KHOA_PIN, JSON.stringify(P)); } catch (e) { baoLoi('Máy hết chỗ lưu'); }
}
function veCham() {
  document.querySelectorAll('#kCham i').forEach((c, i) => c.classList.toggle('day', i < K.so.length));
}
function moKhoa(che, chu = '') {
  if ($('hop').open) $('hop').close();
  document.body.classList.remove('che');
  K.che = che; K.so = '';
  $('khoa').hidden = false;
  $('kLink').hidden = true;
  $('kTieuDe').textContent = TIEU_DE[che];
  $('kChu').textContent = chu;
  $('kCham').style.visibility = $('kPhim').style.visibility = '';
  const phu = che.startsWith('nhap') ? 'Quên mật mã?' : che.startsWith('doi') ? 'Huỷ' : '';
  $('kPhu').textContent = phu;
  $('kPhu').style.visibility = phu ? '' : 'hidden';
  veCham();
}
function moApp() {
  $('khoa').hidden = true;
  K.che = ''; K.so = '';
  dongBo();
  ve(true);
  moLaiNhapDo();
}
// Roi app luc dang ghi do: cat lai noi dung hop nhap (ca khi he dieu hanh tat han app chay nen).
function giuNhapDo() {
  if (!$('hop').open || !F) return;
  docHop();
  const { cm, ...giu } = F; // chi muc mon tinh lai duoc, khong luu
  try { localStorage.setItem(KHOA_NHAP, JSON.stringify(giu)); } catch (e) { /* het cho thi thoi */ }
}
function moLaiNhapDo() {
  let giu = null;
  try { giu = JSON.parse(localStorage.getItem(KHOA_NHAP)); } catch (e) { /* hong thi bo */ }
  localStorage.removeItem(KHOA_NHAP);
  if (!giu || !FORM[giu.b] || $('hop').open) return;
  F = giu;
  hienHop(F.moi ? null : S[F.b][F.r.id]);
  bao('Đã mở lại phần bạn đang ghi dở');
}
function saiRung(chu) {
  K.so = '';
  veCham();
  $('kChu').textContent = chu;
  const c = $('kCham');
  c.classList.remove('sai');
  void c.offsetWidth;
  c.classList.add('sai');
  if (navigator.vibrate) navigator.vibrate(120);
}
function chuLoi(kq) {
  if (kq.loi === 'saiPin') return `Sai mật mã, còn ${kq.conLai} lần`;
  if (kq.loi === 'khoaPin') return `Sai nhiều lần, thử lại sau ${Math.ceil(kq.doi / 60000)} phút`;
  if (kq.loi === 'khoa') return 'Link riêng không đúng';
  if (kq.loi === 'chua co mat ma') return 'Sổ chưa có mật mã, hãy mở bằng link riêng để đặt';
  if (kq.loi === 'chuaKhoa') return 'Sổ chưa có khoá. Vào Apps Script chạy hàm capQuyen';
  return kq.loi || 'Có lỗi, hãy thử lại';
}
async function kiemMay(goiY = '') {
  $('khoa').hidden = false;
  K.che = 'kiem'; K.so = '';
  $('kTieuDe').textContent = 'Hồ Sơ Sức Khoẻ';
  $('kLink').hidden = true;
  $('kChu').textContent = 'Đang kiểm tra…';
  $('kCham').style.visibility = $('kPhim').style.visibility = 'hidden';
  $('kPhu').style.visibility = 'hidden';
  try {
    const kq = await goiMay({ hoiPin: 1 });
    if (!kq.ok) throw new Error(chuLoi(kq));
    if (kq.coPin) moKhoa('nhapMay', goiY);
    else moKhoa('dat1', 'Mỗi lần mở app sẽ cần mật mã này. Chọn số dễ nhớ với bạn, khó đoán với người khác.');
  } catch (e) {
    K.che = 'loiMang';
    $('kChu').textContent = e.name === 'Error' ? e.message : 'Lần đầu trên máy này cần có mạng';
    $('kPhu').textContent = 'Thử lại';
    $('kPhu').style.visibility = '';
  }
}
// May chua co link rieng (vd bieu tuong man hinh chinh mo trang khong kem link): khoa, khong cho dung.
function canLink(chu) {
  moKhoa('canLink', chu || 'Máy này chưa có link riêng nên chưa mở được. Hãy mở đúng link riêng, hoặc dán link vào ô dưới rồi bấm Mở.');
  $('kCham').style.visibility = $('kPhim').style.visibility = 'hidden';
  $('kLink').hidden = false;
  $('kPhu').textContent = 'Mở';
  $('kPhu').style.visibility = '';
}
function vaoApp() {
  if (!S.lk) { moKhoa('moPin'); $('kPhu').textContent = 'Dùng link riêng'; $('kPhu').style.visibility = ''; return; }
  if (P) moKhoa('nhap');
  else kiemMay();
}
const LUONG = {
  async nhap(so) {
    if (await banPin(so, P.muoi) === P.bam) { datSai(0); moApp(); return; }
    const sai = soSai() + 1;
    datSai(sai);
    if (sai < 5) { saiRung(`Sai mật mã, còn ${5 - sai} lần`); return; }
    // Sai 5 lan: bo ban bam tren may, tu gio phai hoi may chu (may chu khoa 15 phut, tang dan).
    boP();
    datSai(0);
    moKhoa('nhapMay', 'Sai 5 lần. Cần có mạng để kiểm tra lại mật mã.');
  },
  async moPin(so) {
    let kq;
    try { kq = await goiMay({ moPin: so }); } catch (e) { saiRung('Lần đầu trên máy này cần có mạng'); return; }
    if (kq.loi === 'chua co mat ma') { K.pin1 = so; moKhoa('dat2', 'Bước cuối: nhập lại đúng 6 số vừa rồi để lưu làm mật mã của sổ'); return; }
    if (!kq.ok) { saiRung(chuLoi(kq)); return; }
    S.lk = { id: MAY_ID, k: kq.k };
    luuKho();
    await luuP(so, kq.the);
    datSai(0);
    moApp();
  },
  async nhapMay(so) {
    const kq = await goiMay({ pin: so });
    if (!kq.ok) { saiRung(chuLoi(kq)); return; }
    await luuP(so, kq.the);
    datSai(0);
    moApp();
  },
  dat1(so) { K.pin1 = so; moKhoa('dat2', 'Nhập lại lần nữa cho chắc'); },
  async dat2(so) {
    if (so !== K.pin1) { moKhoa('dat1', 'Hai lần không giống nhau, hãy đặt lại'); return; }
    const kq = await goiMay(S.lk ? { datPin: so } : { moDat: so });
    K.pin1 = '';
    if (!kq.ok) { if (S.lk) moKhoa('nhapMay', 'Hồ sơ này đã có mật mã'); else vaoApp(); return; }
    if (!S.lk) { S.lk = { id: MAY_ID, k: kq.k }; luuKho(); }
    await luuP(so, kq.the);
    moApp();
  },
  async doiCu(so) {
    if (await banPin(so, P.muoi) !== P.bam) { saiRung('Sai mật mã'); return; }
    K.cu = so;
    moKhoa('doiMoi1');
  },
  doiMoi1(so) { K.pin1 = so; moKhoa('doiMoi2'); },
  async doiMoi2(so) {
    if (so !== K.pin1) { moKhoa('doiMoi1', 'Hai lần không giống nhau, hãy nhập lại'); return; }
    const kq = await goiMay({ the: P.the, pinCu: K.cu, pinMoi: so });
    K.cu = K.pin1 = '';
    if (!kq.ok) { moKhoa('doiCu', chuLoi(kq)); return; }
    await luuP(so, kq.the);
    $('khoa').hidden = true;
    K.che = ''; K.so = '';
    bao('Đã đổi mật mã. Máy khác sẽ phải nhập mật mã mới');
  },
};
async function bamPhim(d) {
  if (K.ban || !LUONG[K.che] || K.so.length >= 6) return;
  K.so += d;
  veCham();
  if (K.so.length < 6) return;
  K.ban = true;
  await new Promise(r => setTimeout(r, 130));
  try { await LUONG[K.che](K.so); } catch (e) { saiRung('Chưa kết nối được, hãy thử lại'); }
  K.ban = false;
}
function xoaPhim() {
  if (K.ban) return;
  K.so = K.so.slice(0, -1);
  veCham();
}

// ---- Quay lai: moi man hinh la 1 buoc lich su, nut back dien thoai di chung duong ----
const doSau = () => (history.state && history.state.sau) || 0;
function luuTrang(kieu, them) {
  const st = { tab, ngay, loaiCs, sau: doSau() + (kieu === 'push' ? 1 : 0), ...them };
  if (kieu === 'push') history.pushState(st, '');
  else history.replaceState(st, '');
}
function capNhatLui() { $('lui').hidden = doSau() === 0; }
function moTab(tabMoi) {
  if (tabMoi === 'tq') {
    if (doSau()) { history.go(-doSau()); return; }
    tab = 'tq'; ve(true); scrollTo(0, 0);
    return;
  }
  const tuGoc = tab === 'tq' && !doSau();
  tab = tabMoi;
  luuTrang(tuGoc ? 'push' : 'replace');
  ve(true);
  scrollTo(0, 0);
}
window.addEventListener('popstate', e => {
  if ($('hop').open) { dongHopThat(); luuTrang('replace'); capNhatLui(); return; }
  const s = e.state || { tab: 'tq', ngay, loaiCs }; // buoc do mo link rieng (doi #) khong co trang thai: coi la trang chu
  tab = s.tab; ngay = s.ngay; loaiCs = s.loaiCs;
  ve(true);
  scrollTo(0, 0);
});

// ---- Ve man hinh ----
const THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const ddmm = n => `${n.slice(8, 10)}/${n.slice(5, 7)}`;
function tenNgay(n) {
  const nay = T.homNay();
  if (n === nay) return 'Hôm nay';
  if (n === T.congNgay(nay, -1)) return 'Hôm qua';
  const [y, m, d] = n.split('-').map(Number);
  return `${THU[new Date(y, m - 1, d).getDay()]}, ${ddmm(n)}${String(y) === nay.slice(0, 4) ? '' : '/' + y}`;
}

function ve(hieuUng) {
  const coNgay = tab === 'tq' || tab === 'an';
  $('tieude').textContent = coNgay ? tenNgay(ngay) : tab === 'cs' ? 'Chỉ số sức khoẻ' : 'Hồ sơ sức khoẻ';
  $('ngayToi').disabled = ngay >= T.homNay();
  document.body.dataset.tab = tab;
  document.body.classList.toggle('coNgay', coNgay);
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
  const tr = $('trang');
  tr.className = hieuUng ? 'hieuung' : '';
  tr.style.setProperty('--dx', huong * 28 + 'px');
  tr.style.setProperty('--dy', huong ? '0' : '12px');
  huong = 0;
  tr.innerHTML = { tq: veHomNay, an: veAn, cs: veCs, hs: veHs }[tab]();
  capNhatLui();
  dichViTri();
  veDongBo();
  if (hieuUng) demSo();
}
// So chay tu 0 len khi doi man hinh. Trinh duyet dung khung hinh (app bi che) thi van chot dung so.
const dem = (n, le = 0) => `<span data-dem="${n}" data-le="${le}">${T.hienSo(n, le)}</span>`;
let henDem = 0;
function demSo() {
  const ds = [...document.querySelectorAll('#trang [data-dem]')].map(el => ({ el, toi: Number(el.dataset.dem), le: Number(el.dataset.le) }));
  const chot = () => ds.forEach(m => { m.el.textContent = T.hienSo(m.toi, m.le); });
  clearTimeout(henDem);
  if (GIAM.matches || !ds.length) return;
  henDem = setTimeout(chot, 1100);
  const dau = performance.now();
  const buoc = t => {
    const p = Math.min(1, (t - dau) / 900);
    const e = 1 - (1 - p) ** 3;
    for (const m of ds) m.el.textContent = T.hienSo(m.toi * e, p < 1 ? 0 : m.le);
    if (p < 1) requestAnimationFrame(buoc);
  };
  requestAnimationFrame(buoc);
}

function veAnToan() {
  if (document.activeElement && document.activeElement.closest('#trang input')) veDongBo();
  else ve();
}
function dichViTri() {
  const el = document.querySelector('.tab.on');
  if (el) $('viTri').style.transform = `translateX(${el.offsetLeft + el.offsetWidth / 2 - 27}px)`;
}
window.addEventListener('resize', dichViTri);

const dgHtml = d => (d ? `<span class="dg m${d.muc}">${esc(d.chu)}</span>` : '');
function giaTri(x) {
  const L = T.LOAI[x.loai];
  if (!L) return T.hienSo(x.a || 0, 1);
  if (L.o.length > 1) return L.o.map((_, i) => (x['ab'[i]] ? `${T.hienSo(x['ab'[i]], L.le)}${L.dv[i]}` : '–')).join(' · ');
  return T.hienSo(x.a, L.le || 0);
}
const tenMuc = x => esc(x.mon || (T.LOAI[x.loai] || {}).ten || x.ten || 'Hồ sơ');
// Muc histamine + co da mun cua 1 mon (huy hieu chu, co la bieu tuong de khong lan voi mau histamine).
const hisHtml = x => (x.histamine === '' || x.histamine === undefined ? '' : `<span class="dg m${x.histamine}">${HIS_CHU[x.histamine]}</span>`);
const coHtml = x => [String(x.duongHuyet) === '2' ? ['🍬', 'Tải đường cao'] : null, String(x.suaBo) === '1' ? ['🥛', 'Có sữa bò'] : null,
  x.nhomBeo === 'omega6' ? ['🍟', 'Nhiều omega-6'] : null, x.nhomBeo === 'omega3' ? ['🐟', 'Giàu omega-3'] : null]
  .filter(Boolean).map(([i, t]) => `<i class="co" title="${t}" aria-label="${t}">${i}</i>`).join('');
const nguongHis = () => (hoSo() || {}).mucHistamine || 0;
const iconBua = b => (BUA.find(x => x[0] === b) || BUA[3])[2];

function dongAn(x) {
  const phu = [x.luong + ((x.phan || 1) !== 1 ? ` (${T.tenPhan(x.phan).toLowerCase()})` : ''), x.dam || x.bot || x.beo ? `Đạm ${x.dam || 0}g · Bột ${x.bot || 0}g · Béo ${x.beo || 0}g` : '', x.ghi].filter(Boolean).join(' · ');
  return `<button class="dong" data-sua="an:${esc(x.id)}"><span class="oh" style="--n:#fff3e0;--m:#f97316">${iconBua(x.bua)}</span>
    <span class="giua"><div class="ten">${esc(x.mon)} ${coHtml(x)}</div><div class="phu">${esc(x.gio ? x.gio + (phu ? ' · ' + phu : '') : phu)}</div></span>
    <span class="so">${x.kcal ? T.hienSo(x.kcal) + ' kcal' : ''}${hisHtml(x)}</span></button>`;
}
function dongPu(x, coMon) {
  const tc = T.trieuChung(x.a);
  const mon = coMon ? T.monTruoc(ds('an'), x) : [];
  return `<button class="dong" data-sua="cs:${esc(x.id)}"><span class="oh" style="--n:#d6336c1c;--m:#d6336c">${tc.length ? tc[0][1] : '😣'}</span>
    <span class="giua"><div class="ten">${esc(tc.map(t => t[0]).join(', ') || 'Phản ứng')}</div><div class="phu">${esc([x.gio, x.ghi].filter(Boolean).join(' · '))}</div>
    ${coMon ? `<div class="phu montruoc">${mon.length ? 'Ăn trong 24 giờ trước: ' + mon.map(m => `${esc(m.mon)}${m.histamine === '2' ? ' <b class="hcao">His cao</b>' : ''}`).join(', ') : 'Không ghi món nào trong 24 giờ trước'}</div>` : ''}</span>
    <span class="so"><span class="dg m${x.b > 2 ? 2 : x.b > 1 ? 1 : 0}">${T.MUC_PU[x.b] || ''}</span></span></button>`;
}
function dongCs(x) {
  if (x.loai === 'pu') return dongPu(x);
  const L = T.LOAI[x.loai] || { ten: x.loai, icon: '•', o: [''], dv: [''] };
  const phu = [x.gio, x.ghi].filter(Boolean).join(' · ');
  return `<button class="dong" data-sua="cs:${esc(x.id)}"><span class="oh" style="--n:${MAU_LOAI[x.loai] || '#888'}1c;--m:${MAU_LOAI[x.loai] || '#888'}">${L.icon}</span>
    <span class="giua"><div class="ten">${esc(L.ten)}</div><div class="phu">${esc(phu)}</div></span>
    <span class="so">${giaTri(x)}${L.o.length === 1 ? ` <small>${esc(L.dv[0])}</small>` : ''}</span></button>`;
}
function dongKs(x) {
  const l = LOAI_KHAM.find(k => k[0] === x.loai) || LOAI_KHAM[0];
  const phu = [x.ngay.split('-').reverse().join('/'), x.noi, x.ketQua].filter(Boolean).join(' · ');
  return `<button class="dong" data-sua="ks:${esc(x.id)}"><span class="oh" style="--n:#eef2ff;--m:#7c3aed">${l[2]}</span>
    <span class="giua"><div class="ten">${esc(x.ten || l[1])}</div><div class="phu">${esc(phu)}</div></span></button>`;
}

// Khoi diem histamine ngay: diem tho, nguong neu tu dat, vuot thi canh bao do.
function khoiHis(an, nho) {
  const d = T.diemNgay(an);
  const ng = nguongHis();
  const vuot = ng && d.tong > ng;
  const vach = ng ? `<div class="vach"><i class="${vuot ? 'vuot' : ''}" style="width:${Math.min(100, d.tong / ng * 100)}%"></i></div>` : '';
  return { d, ng, vuot, html: `<div class="nuoc his"><span>🧪 Histamine ước lượng <b>${dem(d.tong)}</b>${ng ? ` / ${ng}` : ''}</span>${vach}
      ${nho ? '' : vuot ? '<span class="dg m2">Vượt ngưỡng</span>' : ''}</div>` };
}
// Can goi y mon nhe khi: da dat nguong va diem tu 80% nguong; chua dat nguong thi khi da co mon muc cao.
const canGoiY = k => (k.ng ? k.d.tong >= k.ng * 0.8 : k.d.coCao > 0);
function khoiGoiY() {
  const gy = T.goiYCanBang(ds('an'), MON, 8);
  if (!gy.length) return '';
  return `<section class="the"><h2>Gợi ý cho bữa tiếp theo<small>món histamine thấp</small></h2>
      <div class="moncu boc" style="margin:0">${gy.map(m => `<button type="button" data-ghimon="${esc(m.mon)}">${esc(m.mon)}</button>`).join('')}</div>
      <p class="ghichu">Chỉ là gợi ý, món bạn từng ăn được xếp trước. Bấm một món để ghi nhanh.</p></section>`;
}

function veHomNay() {
  const hs = hoSo();
  const kg = canNang();
  const an = T.anTrongNgay(ds('an'), ngay);
  const tong = T.tongAn(an);
  const can = T.kcalCan(hs, kg, T.homNay());
  const his = khoiHis(an);
  const puNgay = T.csLoai(ds('cs'), 'pu').filter(x => x.ngay === ngay);
  const p = can ? Math.min(100, tong.kcal / can * 100) : 0;
  const vong = `<div class="vongbox"><svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="nen" cx="60" cy="60" r="52" pathLength="100"/>
      <circle class="day ${can && tong.kcal > can ? 'vuot' : ''}" cx="60" cy="60" r="52" pathLength="100" style="stroke-dasharray:${p} 100"/></svg>
      <div class="vongchu"><b>${dem(tong.kcal)}</b>kcal đã ăn</div></div>`;
  const ben = can
    ? `<div>Mục tiêu<b>${dem(can)} kcal</b></div><div>${tong.kcal > can ? 'Đã vượt' : 'Còn ăn được'}<b>${dem(Math.abs(can - tong.kcal))} kcal</b></div>`
    : `<div>Điền chiều cao, ngày sinh, giới tính và cân nặng để app tính lượng calo nên ăn mỗi ngày.</div><button data-lam="suaHs">Điền hồ sơ</button>`;

  const oCs = ['can', ...T.VUNG_DA].map(l => {
    const x = T.moiNhat(ds('cs'), l);
    if (!x) return '';
    const L = T.LOAI[l];
    const dg = l === 'can' ? T.bmi(x.a, hs && hs.cao) : null;
    return `<button class="ocs" style="--m:${MAU_LOAI[l]}" data-xemcs="${l === 'can' ? 'can' : 'da'}" data-vung="${l}"><span class="nhan">${L.icon} ${L.ten}</span>
      <b>${giaTri(x)}${l === 'can' ? ` <small>${L.dv[0]}</small>` : ''}</b>${l === 'can' ? `<span class="dg m${dg ? dg.muc : 0}">${dg ? `BMI ${T.hienSo(dg.so, 1)} · ${dg.chu}` : ''}</span>` : `<span class="nhan">ẩm · nhờn · ${tenNgay(x.ngay)}</span>`}</button>`;
  }).join('');

  const luuY = hs && (hs.diUng || hs.benh) ? `<section class="the khancap"><h2>⚠️ Lưu ý sức khoẻ</h2>
      ${hs.diUng ? `<div class="dongtt"><span>Dị ứng</span><b>${esc(hs.diUng)}</b></div>` : ''}
      ${hs.benh ? `<div class="dongtt"><span>Bệnh nền</span><b>${esc(hs.benh)}</b></div>` : ''}</section>` : '';

  return `<section class="hero">
      <div class="vongcal">${vong}<div class="calben">${ben}</div></div>
      ${his.html}
    </section>
    <section class="nhanhbon">
      <button data-lam="themAn" style="--n:#fff0e6;--m:#f97316"><span>🍽️</span>Bữa ăn</button>
      <button data-themcs="can" style="--n:#e7f0ff;--m:#2f80ed"><span>⚖️</span>Cân nặng</button>
      <button data-lam="themDa" style="--n:#e6f7f0;--m:#0ca678"><span>🧴</span>Đo da</button>
      <button data-themcs="pu" style="--n:#fdeef4;--m:#d6336c"><span>😣</span>Phản ứng</button>
      <button data-lam="themKs" style="--n:#eef2ff;--m:#7c3aed"><span>🏥</span>Khám, tiêm</button>
    </section>
    ${his.vuot ? `<section class="the canhbao"><span class="dg m2">Điểm histamine hôm nay ${T.hienSo(his.d.tong, 1)} đã vượt ngưỡng ${his.ng} bạn tự đặt</span>
      <p class="ghichu">${MIEN_TRU_HIS}</p></section>` : ''}
    ${canGoiY(his) ? khoiGoiY() : ''}
    ${puNgay.length ? `<section class="the"><h2>Phản ứng ${ngay === T.homNay() ? 'hôm nay' : 'ngày ' + ddmm(ngay)}<button data-xemcs="pu">Xem lại</button></h2>
      <div class="nhom">${puNgay.map(x => dongPu(x, true)).join('')}</div></section>` : ''}
    <section class="the"><h2>Ăn uống ${ngay === T.homNay() ? 'hôm nay' : 'ngày ' + ddmm(ngay)}<button data-tab="an">Xem chi tiết</button></h2>
      ${an.length ? `<div class="nhom">${an.map(dongAn).join('')}</div>` : '<div class="trong"><span>🥗</span>Chưa ghi bữa nào. Bấm dấu + để ghi món vừa ăn. Gõ nhiều món cách nhau bằng dấu phẩy.</div>'}</section>
    <section class="the"><h2>Chỉ số gần nhất<button data-tab="cs">Tất cả</button></h2>
      ${oCs ? `<div class="oluoi">${oCs}</div>` : '<div class="trong"><span>📈</span>Chưa có chỉ số nào. Bắt đầu bằng cân nặng hoặc đo da.</div>'}</section>
    ${luuY}`;
}

function veAn() {
  const hs = hoSo();
  const an = T.anTrongNgay(ds('an'), ngay);
  const tong = T.tongAn(an);
  const can = T.kcalCan(hs, canNang(), T.homNay());
  const g = tong.dam + tong.bot + tong.beo;
  const vach = g ? `<div class="vach"><i style="width:${tong.dam / g * 100}%;background:#e8590c"></i><i style="width:${tong.bot / g * 100}%;background:#f2c94c"></i><i style="width:${tong.beo / g * 100}%;background:#2f80ed"></i></div>` : '';

  const his = khoiHis(an, true);
  const co = T.coDaNgay(an);
  const dongCo = [['🍬', 'tải đường cao', co.duongCao], ['🥛', 'có sữa bò', co.suaBo], ['🍟', 'nhiều omega-6', co.omega6], ['🐟', 'giàu omega-3', co.omega3]]
    .filter(x => x[2]).map(([i, t, n]) => `<span>${i} ${n} món ${t}</span>`).join('');
  const nhom = BUA.map(([b, ten, icon]) => {
    const mon = an.filter(x => x.bua === b);
    const k = mon.reduce((s, x) => s + (x.kcal || 0), 0);
    const d = his.d.bua[b];
    return `<div class="bua"><span>${icon} ${ten} ${k ? `<small>· ${T.hienSo(k)} kcal</small>` : ''}${d ? ` <small>· 🧪 ${T.hienSo(d, 1)}</small>` : ''}</span><button data-thembua="${b}">+ Thêm</button></div>
      ${mon.length ? `<div class="nhom">${mon.map(dongAn).join('')}</div>` : ''}`;
  }).join('');

  // 7 ngay toi ngay dang xem
  const ngays = Array.from({ length: 7 }, (_, i) => T.congNgay(ngay, i - 6));
  const kcal = ngays.map(n => T.tongAn(T.anTrongNgay(ds('an'), n)).kcal);
  const max = Math.max(...kcal, can, 1) * 1.1;
  const cot = kcal.map((v, i) => `<i class="${i === 6 ? 'nay' : ''}" style="height:${v ? Math.max(3, v / max * 100) : 0}%" title="${ddmm(ngays[i])}: ${T.hienSo(v)} kcal"></i>`).join('');
  const trungBinh = kcal.filter(Boolean);

  return `<section class="the">
      <div class="tong">
        <div style="--n:#e6f7f4;--m:#0f766e"><b>${dem(tong.kcal)}</b>kcal${can ? ` / ${T.hienSo(can)}` : ''}</div>
        <div style="--n:#fff0e6;--m:#e8590c"><b>${dem(tong.dam)}g</b>Đạm</div>
        <div style="--n:#fff8db;--m:#c99700"><b>${dem(tong.bot)}g</b>Tinh bột</div>
        <div style="--n:#e7f0ff;--m:#2f80ed"><b>${dem(tong.beo)}g</b>Chất béo</div>
      </div>${vach}</section>
    <section class="the"><h2>Histamine và da trong ngày</h2>${his.html}
      ${his.vuot ? `<p><span class="dg m2">Vượt ngưỡng ${his.ng} bạn tự đặt</span></p>` : ''}
      ${!his.ng ? '<p class="ghichu">Đặt ngưỡng ở Hồ sơ nếu muốn được báo khi vượt mức. Hãy chọn số theo cảm nhận cơ thể của bạn qua thời gian.</p>' : ''}
      ${his.d.chuaPhanLoai ? `<p class="ghichu">${his.d.chuaPhanLoai} món chưa nhận diện được mức histamine nên không tính điểm.</p>` : ''}
      ${dongCo ? `<div class="dongco">${dongCo}</div>` : ''}
      <p class="ghichu">${MIEN_TRU_HIS} Biểu tượng 🍬🥛🍟🐟 là các yếu tố có nghiên cứu liên quan tới mụn và da dầu, tách riêng khỏi histamine.</p></section>
    ${canGoiY(his) && ngay === T.homNay() ? khoiGoiY() : ''}
    <section>${nhom}</section>
    <section class="the" style="margin-top:14px"><h2>Calo 7 ngày<small>${trungBinh.length ? 'TB ' + T.hienSo(trungBinh.reduce((a, b) => a + b, 0) / trungBinh.length) + ' kcal' : ''}</small></h2>
      <div class="cot">${can ? `<span class="muc" style="bottom:${can / max * 100}%" title="Mục tiêu"></span>` : ''}${cot}</div>
      <div class="truc">${ngays.map(n => `<span>${n.slice(8, 10)}</span>`).join('')}</div></section>`;
}

// Bieu do duong cho 1 chuoi so (can nang)
function veDuong(chuoi, mau) {
  const tat = chuoi.flat();
  if (chuoi[0].length < 2) return '';
  let nho = Math.min(...tat), lon = Math.max(...tat);
  if (nho === lon) { nho -= 1; lon += 1; }
  const W = 320, H = 100, n = chuoi[0].length;
  const x = i => 4 + i / (n - 1) * (W - 34);
  const y = v => 8 + (1 - (v - nho) / (lon - nho)) * (H - 16);
  const diem = c => c.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const vung = `<polygon class="vung" fill="url(#vungDo)" points="${x(0)},${H} ${diem(chuoi[0])} ${x(n - 1)},${H}"/>`;
  const vet = chuoi.map((c, k) => `<polyline class="vet" pathLength="1" stroke="${mau}" stroke-opacity="${k ? .55 : 1}" style="filter:drop-shadow(0 0 4px ${mau})" points="${diem(c)}"/>`).join('');
  const cuoi = chuoi.map(c => `<circle cx="${x(n - 1)}" cy="${y(c[n - 1])}" r="9" fill="${mau}" opacity=".25" class="cham"/><circle cx="${x(n - 1)}" cy="${y(c[n - 1])}" r="4" fill="#fff" stroke="${mau}" stroke-width="2"/>`).join('');
  return `<svg class="dothi" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs><linearGradient id="vungDo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mau}" stop-opacity=".35"/><stop offset="1" stop-color="${mau}" stop-opacity="0"/></linearGradient></defs>${vung}${vet}${cuoi}
    <text x="${W}" y="12" text-anchor="end">${T.hienSo(lon, 1)}</text><text x="${W}" y="${H - 2}" text-anchor="end">${T.hienSo(nho, 1)}</text></svg>`;
}

// Doi chieu theo ngay: do am, do nhon (1 vung) va do am phong (duong), diem histamine (cot) cung truc ngay.
// Truoc ngay bat dau ghi muc histamine thi khong ve cot, ke vach danh dau.
function veDoiChieu(vung) {
  // Truc ngay tu lan dau co so lieu (da hoac histamine), toi thieu 14, toi da 30 ngay
  const dau = [T.ngayBatDauHis(ds('an')), ...T.csLoai(ds('cs'), vung).map(x => x.ngay)].filter(Boolean).sort()[0] || T.homNay();
  let soNgay = 1;
  while (soNgay < 30 && T.congNgay(T.homNay(), -soNgay + 1) > dau) soNgay++;
  soNgay = Math.max(14, soNgay);
  const ngays = Array.from({ length: soNgay }, (_, i) => T.congNgay(T.homNay(), i - soNgay + 1));
  const tb = (loai, o, n) => {
    const v = ds('cs').filter(x => !x.xoa && x.loai === loai && x.ngay === n && x[o]).map(x => x[o]);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const am = ngays.map(n => tb(vung, 'a', n)), nhon = ngays.map(n => tb(vung, 'b', n)), phong = ngays.map(n => tb('phong', 'b', n));
  const batDau = T.ngayBatDauHis(ds('an'));
  const his = ngays.map(n => (batDau && n >= batDau ? T.diemNgay(T.anTrongNgay(ds('an'), n)).tong : null));
  const soDo = [...am, ...nhon].filter(v => v !== null);
  if (!soDo.length) return '';
  const W = 320, H = 150, DAY = 112; // phan tren cho duong %, 30px duoi cho cot histamine
  const tatPt = [...soDo, ...phong.filter(v => v !== null)];
  let nho = Math.min(...tatPt), lon = Math.max(...tatPt);
  if (lon - nho < 10) { nho -= 5; lon += 5; }
  const x = i => 6 + i / (soNgay - 1) * (W - 40);
  const y = v => 6 + (1 - (v - nho) / (lon - nho)) * (DAY - 12);
  // Noi cac lan do (khong do moi ngay), moi lan do co 1 cham
  const duong = (c, mau, them = '') => {
    const d = c.map((v, i) => (v === null ? null : [x(i).toFixed(1), y(v).toFixed(1)])).filter(Boolean);
    return (d.length > 1 ? `<polyline class="vet" pathLength="1" stroke="${mau}" ${them} points="${d.map(p => p.join(',')).join(' ')}"/>` : '') +
      (them ? '' : d.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="2.6" fill="${mau}"/>`).join(''));
  };
  const maxHis = Math.max(3, ...his.filter(v => v !== null));
  const cw = (W - 40) / soNgay * 0.6;
  const cot = his.map((v, i) => (v ? `<rect x="${(x(i) - cw / 2).toFixed(1)}" y="${(H - v / maxHis * 30).toFixed(1)}" width="${cw.toFixed(1)}" height="${(v / maxHis * 30).toFixed(1)}" rx="1.5" fill="${MAU_HIS}" opacity=".7"/>` : '')).join('');
  const iBd = batDau ? ngays.indexOf(batDau) : -1;
  const puNgay = ngays.map(n => Math.max(0, ...T.csLoai(ds('cs'), 'pu').filter(p => p.ngay === n).map(p => p.b)));
  const dauPu = puNgay.map((m, i) => (m ? `<path d="M${(x(i) - 4).toFixed(1)},2 h8 l-4,${4 + m * 2} z" fill="#d6336c"/>` : '')).join('');
  const vach = iBd > 0 ? `<line x1="${x(iBd)}" x2="${x(iBd)}" y1="0" y2="${H}" style="stroke:var(--mo)" stroke-dasharray="3 3"/><text x="${x(iBd) + 3}" y="${H - 34}">bắt đầu ghi histamine</text>` : '';
  return `<svg class="dothi" viewBox="0 0 ${W} ${H}" aria-label="Đối chiếu da với histamine 30 ngày">
    <line x1="0" x2="${W - 34}" y1="${DAY + 4}" y2="${DAY + 4}" style="stroke:var(--mo);opacity:.25"/>${cot}${vach}
    ${duong(phong, '#adb5bd', 'stroke-dasharray="4 3" stroke-width="1.5"')}${duong(am, MAU_AM)}${duong(nhon, MAU_NHON)}${dauPu}
    <text x="${W}" y="12" text-anchor="end">${T.hienSo(lon)}%</text><text x="${W}" y="${DAY}" text-anchor="end">${T.hienSo(nho)}%</text>
</svg>
    <div class="chuthich"><span style="--m:${MAU_AM}">Độ ẩm da</span><span style="--m:${MAU_NHON}">Độ nhờn da</span><span class="net" style="--m:#adb5bd">Độ ẩm phòng</span><span class="o" style="--m:${MAU_HIS}">Điểm histamine</span><span class="tg">▼ Phản ứng</span></div>
    <div class="truc"><span>${ddmm(ngays[0])}</span><span>${ddmm(ngays[soNgay >> 1])}</span><span>Hôm nay</span></div>`;
}

function dsTheoNgay(tat) {
  let ra = '', ngayCu = '', dong = [];
  const dongNgay = () => { if (ngayCu) ra += `<div class="ngay"><span>${tenNgay(ngayCu)}</span></div><div class="nhom">${dong.join('')}</div>`; };
  for (const x of tat.slice().reverse().slice(0, 120)) {
    if (x.ngay !== ngayCu) { dongNgay(); ngayCu = x.ngay; dong = []; }
    dong.push(dongCs(x));
  }
  dongNgay();
  return ra;
}

function veCs() {
  if (!LOAI_XEM.includes(loaiCs)) loaiCs = 'can';
  const locs = `<div class="locs">${[['can', '⚖️ Cân nặng'], ['da', '🧴 Da'], ['pu', '😣 Phản ứng']].map(([k, ten]) =>
    `<button class="loc ${k === loaiCs ? 'on' : ''}" data-loaics="${k}">${ten}</button>`).join('')}</div>`;
  return locs + (loaiCs === 'da' ? veDa() : loaiCs === 'pu' ? vePu() : veCan());
}

function vePu() {
  const tat = T.csLoai(ds('cs'), 'pu');
  const gap = T.monHayGap(ds('an'), tat);
  const khoiGap = tat.length < 3
    ? '<p class="ghichu">Ghi từ 3 lần phản ứng trở lên, app sẽ đếm món nào hay được ăn trong 24 giờ trước đó.</p>'
    : gap.length ? `<h2 style="margin-top:14px">Món hay ăn trước khi có phản ứng</h2><div class="nhom">${gap.slice(0, 8).map(x =>
      `<div class="dong"><span class="giua"><div class="ten">${esc(x.mon)} ${hisHtml(x)}</div>
        <div class="phu">trước ${x.lan}/${tat.length} lần phản ứng · đã ăn ${x.soNgayAn} ngày</div></span></div>`).join('')}</div>
      <p class="ghichu">Đây chỉ là trùng hợp về thời gian, không chứng minh món đó gây phản ứng. Món ngày nào cũng ăn thì đương nhiên hay gặp: hãy so "trước bao nhiêu lần phản ứng" với "đã ăn bao nhiêu ngày".</p>`
      : '<p class="ghichu">Chưa thấy món nào lặp lại trước các lần phản ứng.</p>';
  let ra = '', ngayCu = '', dong = [];
  const dongNgay = () => { if (ngayCu) ra += `<div class="ngay"><span>${tenNgay(ngayCu)}</span></div><div class="nhom">${dong.join('')}</div>`; };
  for (const x of tat.slice().reverse().slice(0, 120)) {
    if (x.ngay !== ngayCu) { dongNgay(); ngayCu = x.ngay; dong = []; }
    dong.push(dongPu(x, true));
  }
  dongNgay();
  return `<section class="the">${tat.length ? `<div class="nhan">${tat.length} lần phản ứng đã ghi</div>` : '<div class="trong"><span>😣</span>Chưa ghi phản ứng nào. Khi thấy ngứa, đỏ mặt, nổi mẩn, nổi mụn… hãy ghi lại ngay.</div>'}
      <button class="btn rong" style="margin-top:12px" data-themcs="pu">+ Ghi phản ứng</button>${khoiGap}</section>${ra}`;
}

function veCan() {
  const L = T.LOAI.can;
  const tat = T.csLoai(ds('cs'), 'can');
  let dau;
  if (tat.length) {
    const cuoi = tat[tat.length - 1];
    const hs = hoSo();
    const dg = T.bmi(cuoi.a, hs && hs.cao);
    const truoc = tat.length > 1 ? tat[tat.length - 2] : null;
    const doi = truoc ? cuoi.a - truoc.a : 0;
    dau = `<div class="nhan">Lần gần nhất · ${tenNgay(cuoi.ngay)}${cuoi.gio ? ' ' + cuoi.gio : ''}</div>
      <div class="solon">${giaTri(cuoi)} <small>kg</small></div>
      ${dg ? `<span class="dg m${dg.muc}">BMI ${T.hienSo(dg.so, 1)} · ${dg.chu}</span>` : ''}
      ${doi ? `<span class="nhan"> · ${doi > 0 ? '+' : ''}${T.hienSo(doi, 1)} so với lần trước</span>` : ''}
      ${!(hs && hs.cao) ? '<p class="ghichu">Điền chiều cao ở Hồ sơ để xem BMI.</p>' : ''}
      ${veDuong([tat.slice(-30).map(x => x.a)], MAU_LOAI.can)}`;
  } else {
    dau = `<div class="trong"><span>${L.icon}</span>Chưa ghi cân nặng lần nào.</div>`;
  }
  return `<section class="the">${dau}
      <button class="btn rong" style="margin-top:14px" data-themcs="can">+ Ghi cân nặng</button>
      <p class="ghichu">BMI theo ngưỡng người châu Á, chỉ để tham khảo, không thay lời khuyên của bác sĩ.</p></section>${dsTheoNgay(tat)}`;
}

function veDa() {
  const coDo = T.VUNG_DA.filter(v => T.moiNhat(ds('cs'), v));
  if (!T.VUNG_DA.includes(vungDa)) vungDa = coDo[0] || T.VUNG_DA[0];
  const chonVung = `<div class="chips" data-vungda="1">${T.VUNG_DA.map(v =>
    `<button type="button" class="${v === vungDa ? 'on' : ''}" data-chonvung="${v}">${T.LOAI[v].ten.replace('Da ', '')}</button>`).join('')}</div>`;
  const cuoi = T.moiNhat(ds('cs'), vungDa);
  const phong = T.moiNhat(ds('cs'), 'phong');
  const bd = veDoiChieu(vungDa);
  const dau = cuoi ? `<div class="nhan">${T.LOAI[vungDa].ten} · lần gần nhất ${tenNgay(cuoi.ngay)}${cuoi.gio ? ' ' + cuoi.gio : ''}</div>
      <div class="solon">${giaTri(cuoi)}</div><div class="nhan">độ ẩm · độ nhờn${phong && phong.ngay === cuoi.ngay ? ` · phòng ${giaTri(phong)}` : ''}</div>
      ${bd || '<p class="ghichu">Đo thêm vài ngày để thấy biểu đồ.</p>'}`
    : `<div class="trong"><span>🧴</span>Chưa đo ${T.LOAI[vungDa].ten.toLowerCase()} lần nào.</div>`;
  const tat = ds('cs').filter(x => !x.xoa && (x.loai === vungDa || x.loai === 'phong')).sort((a, b) => (a.ngay + a.gio).localeCompare(b.ngay + b.gio) || a.sua - b.sua);
  return `${chonVung}<section class="the">${dau}
      <button class="btn rong" style="margin-top:14px" data-lam="themDa">+ Đo da</button>
      <p class="ghichu">Đây là công cụ tự quan sát tương quan của riêng bạn, không phải xác nhận y khoa. Histamine làm giãn mạch da và tác động lên tuyến bã nhờn đã được thấy trong nghiên cứu sinh lý, nhưng chưa được kiểm chứng trên lâm sàng cho từng người. Nhiệt độ và độ ẩm phòng cũng làm số đo da thay đổi, nên app ghi kèm để bạn đối chiếu.</p></section>${dsTheoNgay(tat)}`;
}

function veHs() {
  const hs = hoSo() || {};
  const kg = canNang();
  const tuoi = T.tuoi(hs.sinh, T.homNay());
  const bmi = T.bmi(kg, hs.cao);
  const can = T.kcalCan(hs.id ? hs : null, kg, T.homNay());
  const tt = (nhan, gt) => (gt ? `<div class="dongtt"><span>${nhan}</span><b>${gt}</b></div>` : '');
  const sdt = s => esc(s).replace(/(\+?\d[\d .]{7,}\d)/g, m => `<a href="tel:${m.replace(/[ .]/g, '')}">${m}</a>`);
  const vd = VAN_DONG.find(v => Number(v[0]) === hs.vanDong);
  const kham = ds('ks').filter(x => !x.xoa).sort((a, b) => b.ngay.localeCompare(a.ngay) || b.sua - a.sua);

  const lienKet = S.lk
    ? `<p class="nhan" style="margin:0 0 10px">Máy này đang lưu lên Google Sheet của bạn.</p>
      <button class="btn rong" data-lam="dongBoNgay">Đồng bộ ngay</button>
      <button class="btn rong" data-lam="doiPin">Đổi mật mã</button>
      <button class="btn rong" data-lam="khoaNgay">Khoá app ngay</button>`
    : `<p class="nhan" style="margin:0 0 10px">Máy này chưa nối Sheet, dữ liệu chỉ nằm trên máy. Dán link riêng vào đây nếu app chưa tự nhận.</p>
      <input id="fLink" placeholder="Dán link riêng" autocomplete="off"><button class="btn rong" data-lam="noiLink">Nối Sheet</button>`;

  return `<section class="the khancap"><h2>🆘 Thông tin khẩn cấp<button data-lam="suaHs">Sửa</button></h2>
      ${hs.ten || hs.nhomMau || hs.diUng || hs.lienHe ? `
      ${tt('Họ tên', esc(hs.ten || ''))}
      ${tt('Tuổi', tuoi ? `${tuoi} tuổi` + (hs.gioi ? ` · ${hs.gioi === 'nam' ? 'Nam' : 'Nữ'}` : '') : '')}
      ${tt('Nhóm máu', esc(hs.nhomMau || ''))}
      ${tt('Dị ứng', esc(hs.diUng || ''))}
      ${tt('Bệnh nền', esc(hs.benh || ''))}
      ${tt('Thuốc đang dùng', esc(hs.thuoc || ''))}
      ${tt('Liên hệ khẩn cấp', sdt(hs.lienHe || ''))}`
      : '<div class="trong" style="padding:10px"><span>📋</span>Chưa có thông tin. Điền nhóm máu, dị ứng, người liên hệ để dùng khi cần gấp.</div><button class="btn rong" data-lam="suaHs">Điền hồ sơ</button>'}
    </section>
    <section class="the"><h2>Cơ thể</h2>
      ${tt('Chiều cao', hs.cao ? `${T.hienSo(hs.cao)} cm` : '<span class="nhan">chưa điền</span>')}
      ${tt('Cân nặng', kg ? `${T.hienSo(kg, 1)} kg` : '<span class="nhan">chưa ghi</span>')}
      ${tt('BMI', bmi ? `${T.hienSo(bmi.so, 1)} ${dgHtml(bmi)}` : '')}
      ${tt('Vận động', vd ? vd[1] : '')}
      ${tt('Calo nên ăn/ngày', can ? `${T.hienSo(can)} kcal${hs.mucKcal ? ' (tự đặt)' : ''}` : '')}
      ${tt('Ngưỡng histamine/ngày', hs.mucHistamine ? `${T.hienSo(hs.mucHistamine)} điểm (tự đặt)` : '<span class="nhan">chưa đặt</span>')}
      ${hs.ghi ? tt('Ghi chú', esc(hs.ghi)) : ''}
    </section>
    <section class="the"><h2>Khám bệnh, xét nghiệm, tiêm chủng<button data-lam="themKs">+ Thêm</button></h2>
      ${kham.length ? `<div class="nhom">${kham.map(dongKs).join('')}</div>` : '<div class="trong"><span>🏥</span>Chưa có lần khám nào.</div>'}
    </section>
    <section class="the"><h2>Lưu trữ</h2>${lienKet}</section>`;
}

// ---- Hop nhap ----
function buaTheoGio(gio) {
  const h = Number(gio.slice(0, 2));
  return h < 10 ? 'sang' : h >= 11 && h < 14 ? 'trua' : h >= 17 && h < 21 ? 'toi' : 'phu';
}
function macDinh(b, them = {}) {
  const coNgay = tab === 'tq' || tab === 'an';
  const goc = { id: taoId(), xoa: 0, ngay: coNgay ? ngay : T.homNay(), gio: T.gioNay(), ghi: '' };
  if (b === 'an') return { ...goc, bua: them.bua || buaTheoGio(goc.gio), mon: them.mon || '', luong: '', kcal: 0, dam: 0, bot: 0, beo: 0, ...T.coMon(null), phan: 1 };
  if (b === 'cs') return { ...goc, loai: them.loai || 'can', a: 0, b: 0, c: 0 };
  if (b === 'da') return { ...goc };
  if (b === 'ks') return { id: goc.id, xoa: 0, ngay: T.homNay(), loai: 'kham', noi: '', ten: '', ketQua: '', ghi: '' };
  return { id: 'toi', xoa: 0, ten: '', sinh: '', gioi: '', cao: 0, nhomMau: '', diUng: '', benh: '', thuoc: '', lienHe: '', ghi: '', vanDong: 1.375, mucKcal: 0, mucHistamine: 0 };
}

const oChu = (t, nhan, ph = '') => `<label class="o"><span>${nhan}</span><input data-truong="${t}" value="${esc(F.r[t] || '')}" placeholder="${esc(ph)}" maxlength="200" autocomplete="off"></label>`;
const oDai = (t, nhan, ph = '') => `<label class="o"><span>${nhan}</span><textarea data-truong="${t}" placeholder="${esc(ph)}" maxlength="2000">${esc(F.r[t] || '')}</textarea></label>`;
const oSo = (t, nhan, dv) => `<label class="o"><span>${nhan}</span><div class="codv"><input data-truong="${t}" data-kieu="so" inputmode="decimal" value="${F.r[t] ? String(F.r[t]).replace('.', ',') : ''}" autocomplete="off"><em>${dv}</em></div></label>`;
const oNgayGio = () => `<div class="hang2"><label class="o"><span>Ngày</span><input type="date" data-truong="ngay" value="${F.r.ngay}" max="${T.homNay()}"></label>
  <label class="o"><span>Giờ</span><input type="time" data-truong="gio" value="${F.r.gio || ''}"></label></div>`;
const chips = (truong, ds) => `<div class="chips" data-nhom="${truong}">${ds.map(([v, nhan, icon]) =>
  `<button type="button" class="${String(F.r[truong]) === String(v) ? 'on' : ''}" data-chon="${v}">${icon ? `<span>${icon}</span>` : ''}${nhan}</button>`).join('')}</div>`;

// Dong "da nhan dien" duoi o ten mon: ro thi hien ten + muc, mo thi cho chon, khong khop thi bao.
function khopHtml() {
  const k = F.khop;
  if (!k) return '';
  if (k.nhieu) {
    // Nhieu mon: hien ngay tung mon nhan ra la gi, chon it/vua/nhieu tung mon o buoc Xem lai
    const dong = T.tachMon(F.r.mon).map(go => {
      const kk = T.khopMon(go, F.cm);
      const m = kk.kq === 'ro' ? kk.chon : null;
      return `<div class="xemlai"><b>${esc(m ? m.mon : go)}</b>${m ? `<div class="phu">${[m.luong, m.kcal ? T.hienSo(m.kcal) + ' kcal' : ''].filter(Boolean).map(esc).join(' · ')}</div><div>${hisHtml(T.coMon(m))} ${coHtml(T.coMon(m))}</div>`
        : `<div class="phu canh">${kk.kq === 'mo' ? 'Có vài món gần giống, chọn ở bước Xem lại' : 'Chưa nhận diện, vẫn lưu được'}</div>`}</div>`;
    }).join('');
    return `<p class="khop">Bữa này có ${k.nhieu} món:</p>${dong}<p class="khop">Bấm <b>Xem lại</b> để chọn Ít/Vừa/Nhiều từng món rồi lưu.</p>`;
  }
  if (F.chon) return `<p class="khop">Đã nhận diện: <b>${esc(F.chon.mon)}</b> ${hisHtml(T.coMon(F.chon))} ${coHtml(T.coMon(F.chon))}
      ${k.ungVien.length ? '<button type="button" data-lam="doiMon">Đổi</button>' : ''}</p>${k.moDoi ? chonMonHtml(k.ungVien, 'chonmon') : ''}`;
  if (k.kq === 'mo') return `<p class="khop">Bạn muốn ghi món nào?</p>${chonMonHtml(k.ungVien, 'chonmon')}`;
  if (k.kq === 'khong' && k.go) return `<p class="khop canh">Chưa nhận diện: ${esc(k.go)}. Vẫn lưu được, tự điền calo nếu muốn.</p>`;
  return '';
}
const phanHtml = (phan, attr) => `<div class="chips phan">${T.PHAN.map(([v, ten]) =>
  `<button type="button" class="${v === (phan || 1) ? 'on' : ''}" ${attr}="${v}">${ten}</button>`).join('')}</div>`;
const chonMonHtml = (ds2, kieu, tien = '') => `<div class="moncu boc">${ds2.map((m, j) =>
  `<button type="button" data-${kieu}="${tien}${j}">${esc(m.mon)}${m.kcal ? ' · ' + T.hienSo(m.kcal) : ''}</button>`).join('')}</div>`;

const FORM = {
  an() {
    const cu = T.monCu(ds('an')).slice(0, 12);
    return chips('bua', BUA.map(([v, n, i]) => [v, n.replace('Ăn vặt, đồ uống', 'Ăn vặt'), i])) +
      (F.moi && cu.length ? `<div class="moncu">${cu.map(x => `<button type="button" data-moncu="${esc(x.id)}">${esc(x.mon)}${x.kcal ? ' · ' + T.hienSo(x.kcal) : ''}</button>`).join('')}</div>` : '') +
      `<label class="o"><span>Món ăn (nhiều món thì cách nhau bằng dấu phẩy)</span><input data-truong="mon" id="fMon" value="${esc(F.r.mon)}" placeholder="Ví dụ: Cơm, thịt kho tàu, rau muống" maxlength="400" autocomplete="off"></label>
      ${F.moi ? '<button type="button" class="lienket" data-lam="themMonO">+ Thêm món</button>' : '<button type="button" class="lienket" data-lam="themVaoBua">+ Thêm món khác vào bữa này</button>'}
      <div id="fKhop">${khopHtml()}</div>
      <div id="fMot" ${F.khop && F.khop.nhieu ? 'hidden' : ''}><div class="o"><span>Ăn ít hay nhiều? (Vừa = 1 phần như cột Lượng)</span></div>${phanHtml(F.r.phan, 'data-phan')}
      <div id="fSo"><div class="hang2">${oChu('luong', 'Lượng', '1 tô, 200g…')}${oSo('kcal', 'Calo', 'kcal')}</div>
      <details ${F.r.dam || F.r.bot || F.r.beo ? 'open' : ''}><summary>Đạm, tinh bột, chất béo</summary>
        <div class="hang3">${oSo('dam', 'Đạm', 'g')}${oSo('bot', 'Tinh bột', 'g')}${oSo('beo', 'Béo', 'g')}</div></details></div></div>
      ${oNgayGio()}${oChu('ghi', 'Ghi chú', 'Cảm thấy thế nào sau khi ăn…')}`;
  },
  // Xem lai truoc khi luu nhieu mon: moi mon 1 dong, mon mo ho phai chon, tong ca bua o cuoi.
  anNhieu() {
    const tong = T.tongAn(F.nhieu.map(x => (x.m ? T.nhanPhan(x.m, x.phan) : {})));
    const diem = T.diemNgay(F.nhieu.map(x => ({ ...T.coMon(x.m), bua: F.r.bua, phan: x.phan })));
    const dong = F.nhieu.map((x, i) => {
      const m = x.m ? { ...x.m, ...T.nhanPhan(x.m, x.phan) } : null;
      const tren = m ? `<b>${esc(m.mon)}</b>${x.go.toLowerCase() !== m.mon.toLowerCase() ? ` <small>(bạn gõ: ${esc(x.go)})</small>` : ''}` : `<b>${esc(x.go)}</b>`;
      const duoi = m ? `<div class="phu">${[m.luong, m.kcal ? T.hienSo(m.kcal) + ' kcal' : '', m.dam || m.bot || m.beo ? `Đạm ${m.dam || 0}g · Bột ${m.bot || 0}g · Béo ${m.beo || 0}g` : ''].filter(Boolean).map(esc).join(' · ')}</div>
          <div>${hisHtml(T.coMon(m))} ${coHtml(T.coMon(m))} ${x.ungVien.length ? `<button type="button" class="lienket" data-nhieudoi="${i}">Đổi</button>` : ''}</div>
          ${phanHtml(x.phan, `data-nphan="${i}" data-v`)}`
        : x.kq === 'mo' && !x.giu ? '<div class="phu canh">Chọn đúng món:</div>'
          : '<div class="phu canh">Chưa nhận diện: lưu với calo 0, sửa sau được.</div>';
      const chon = (!m && x.kq === 'mo' && !x.giu) || x.moDoi
        ? chonMonHtml(x.ungVien, 'nchon', i + ':') + `<button type="button" class="lienket" data-nchon="${i}:-1">Không phải các món trên, giữ tên tôi gõ</button>` : '';
      return `<div class="xemlai">${tren}${duoi}${chon}</div>`;
    }).join('');
    return `<p class="nhan" style="margin:0 0 8px">${BUA.find(b => b[0] === F.r.bua)[1]} · ${tenNgay(F.r.ngay)}${F.r.gio ? ' ' + F.r.gio : ''}</p>${dong}
      <div class="xemlai tongxl"><b>Cả bữa: ${T.hienSo(tong.kcal)} kcal</b><div class="phu">Đạm ${T.hienSo(tong.dam)}g · Bột ${T.hienSo(tong.bot)}g · Béo ${T.hienSo(tong.beo)}g · 🧪 điểm histamine ${T.hienSo(diem.tong, 1)}</div></div>
      <button type="button" class="btn rong" data-lam="nhieuQuay">← Sửa lại danh sách món</button>
      <p class="ghichu">Số calo là ước tính theo khẩu phần phổ biến, mức histamine chỉ để tham khảo.</p>`;
  },
  cs() {
    if (F.r.loai === 'pu') return FORM.pu();
    const L = T.LOAI[F.r.loai];
    const o = L.o.map((nhan, i) => oSo('ab'[i], nhan, L.dv[i])).join('');
    return `<p class="nhan" style="margin:0 0 10px">${L.icon} ${L.ten}</p>` + (L.o.length > 1 ? `<div class="hang2">${o}</div>` : o) +
      `<div id="fDg"></div>${oNgayGio()}${oChu('ghi', 'Ghi chú', L.nhom === 'da' ? 'Trước/sau rửa mặt, sau khi bôi kem…' : '')}`;
  },
  // Phan ung: bam chon nhieu trieu chung, chon muc do.
  pu() {
    return `<div class="o"><span>Bạn đang bị gì? (chọn được nhiều)</span></div>
      <div class="chips">${T.TRIEU_CHUNG.map(([ten, icon], i) => `<button type="button" class="${(F.r.a >> i) & 1 ? 'on' : ''}" data-tc="${i}"><span>${icon}</span>${ten}</button>`).join('')}</div>
      <div class="o"><span>Mức độ</span></div>${chips('b', [[1, 'Nhẹ'], [2, 'Vừa'], [3, 'Nặng']])}
      ${oNgayGio()}${oChu('ghi', 'Ghi chú', 'Vùng nào, kéo dài bao lâu, triệu chứng khác…')}
      <p class="ghichu">App sẽ tự liệt kê các món bạn ăn trong 24 giờ trước lúc này.</p>`;
  },
  // Mot lan do da: dien vung nao co do, kem nhiet do va do am phong luc do.
  da() {
    const hang = T.VUNG_DA.map(v => `<div class="vungdo"><span>${T.LOAI[v].ten.replace('Da ', '')}</span>${oSo(v + '_a', 'Độ ẩm', '%')}${oSo(v + '_b', 'Độ nhờn', '%')}</div>`).join('');
    return `<p class="ghichu" style="margin:0 0 10px">Điền vùng nào bạn đo, bỏ trống vùng không đo.</p>${hang}
      <div class="vungdo"><span>Phòng</span>${oSo('phong_a', 'Nhiệt độ', '°C')}${oSo('phong_b', 'Độ ẩm', '%')}</div>
      ${oNgayGio()}${oChu('ghi', 'Ghi chú', 'Trước/sau rửa mặt, sau khi bôi kem…')}`;
  },
  ks() {
    return chips('loai', LOAI_KHAM) + oChu('ten', 'Nội dung', 'Khám tổng quát, vắc xin cúm…') + oChu('noi', 'Nơi khám, bác sĩ') +
      `<label class="o"><span>Ngày</span><input type="date" data-truong="ngay" value="${F.r.ngay}"></label>` +
      oDai('ketQua', 'Kết quả, chẩn đoán, thuốc được kê') + oChu('ghi', 'Ghi chú', 'Hẹn tái khám…');
  },
  hs() {
    return oChu('ten', 'Họ tên') +
      `<div class="hang2"><label class="o"><span>Ngày sinh</span><input type="date" data-truong="sinh" value="${F.r.sinh}" max="${T.homNay()}"></label>
      ${oSo('cao', 'Chiều cao', 'cm')}</div>` +
      '<div class="o"><span>Giới tính</span></div>' + chips('gioi', [['nam', 'Nam'], ['nu', 'Nữ']]) +
      '<div class="o"><span>Nhóm máu</span></div>' + chips('nhomMau', NHOM_MAU.map(m => [m, m]).concat([['', 'Chưa biết']])) +
      oDai('diUng', 'Dị ứng (thuốc, thức ăn…)', 'Ví dụ: penicillin, hải sản') +
      oDai('benh', 'Bệnh nền, tiền sử', 'Ví dụ: huyết áp cao, mổ ruột thừa 2015') +
      oDai('thuoc', 'Thuốc đang dùng', 'Tên thuốc, liều, giờ uống') +
      oChu('lienHe', 'Người liên hệ khẩn cấp', 'Tên – số điện thoại') +
      '<div class="o"><span>Mức vận động</span></div>' + chips('vanDong', VAN_DONG) +
      `<div class="hang2">${oSo('mucKcal', 'Calo mục tiêu', 'kcal')}${oSo('mucHistamine', 'Ngưỡng histamine/ngày', 'điểm')}</div>
      <p class="ghichu" style="margin-top:-4px">Calo để trống thì app tự tính theo cân nặng, chiều cao, tuổi. Ngưỡng histamine không có số chuẩn chung, để trống thì app chỉ hiện điểm, không báo vượt. Nếu đặt, hãy chọn theo cảm nhận cơ thể của bạn qua thời gian.</p>` +
      oDai('ghi', 'Ghi chú khác');
  },
};
const TEN_HOP = { an: 'Ghi bữa ăn', cs: 'Ghi chỉ số', da: 'Đo da', ks: 'Khám, xét nghiệm, tiêm', hs: 'Hồ sơ của tôi' };

function moHop(b, r, them) {
  localStorage.removeItem(KHOA_NHAP);
  F = { b, moi: !r, r: r ? { ...r } : macDinh(b, them) };
  if (b === 'hs') F.r = { ...macDinh('hs'), ...F.r };
  if (b === 'an') {
    F.cm = T.chiMuc(T.nguonMon(ds('an'), MON));
    if (F.r.mon && F.moi) khopLai(); // ghi nhanh tu goi y
  }
  hienHop(r);
}
function hienHop(r) {
  const b = F.b;
  if (b === 'an' && !F.cm) F.cm = T.chiMuc(T.nguonMon(ds('an'), MON));
  $('fTieuDe').textContent = (r && b !== 'hs' ? 'Sửa: ' : '') + TEN_HOP[b];
  veThanHop();
  $('fXoa').hidden = F.moi || b === 'hs';
  $('hop').classList.remove('dangdong');
  $('hop').showModal();
  $('hop').querySelector('.thanhop').scrollTop = 0;
  luuTrang('push', { hop: 1 });
}
function veThanHop() {
  $('fThan').innerHTML = FORM[F.nhieu ? 'anNhieu' : F.b]();
  $('hop').querySelector('.luu').textContent = F.nhieu ? `Lưu ${F.nhieu.length} món` : F.khop && F.khop.nhieu ? 'Xem lại' : 'Lưu';
  veDanhGiaHop();
}
// Khop lai ten mon dang go. Mon ro rang thi dien so (chi dien o con trong hoac o do app dien truoc do).
function khopLai() {
  const go = F.r.mon || '';
  const phan = T.tachMon(go);
  if (phan.length > 1) { F.khop = { nhieu: phan.length }; F.chon = null; return; }
  const k = T.khopMon(phan[0] || '', F.cm);
  F.khop = { ...k, go: phan[0] || '' };
  datChon(k.kq === 'ro' ? k.chon : null);
}
function datChon(m) {
  const truoc = F.chon;
  F.chon = m;
  Object.assign(F.r, T.coMon(m));
  // So cua mon (1 phan vua) nhan theo phan dang chon. O nao nguoi dung tu go thi giu nguyen.
  const theoPhan = x => (x ? { luong: x.luong || '', ...T.nhanPhan(x, F.r.phan || 1) } : {});
  const cu = theoPhan(truoc), moi = theoPhan(m);
  for (const t of ['luong', 'kcal', 'dam', 'bot', 'beo']) {
    const cuTuDien = truoc && F.r[t] === cu[t];
    if (m && (!F.r[t] || cuTuDien)) F.r[t] = moi[t] || (t === 'luong' ? '' : 0);
    else if (!m && cuTuDien) F.r[t] = t === 'luong' ? '' : 0;
  }
}
// Doi it/vua/nhieu: nhan lai calo, dam, bot, beo dang co theo ti le
function doiPhan(moi) {
  docHop();
  const cu = F.r.phan || 1;
  Object.assign(F.r, T.nhanPhan(F.r, moi / cu), { phan: moi });
  $('fThan').querySelectorAll('[data-phan]').forEach(b => b.classList.toggle('on', Number(b.dataset.phan) === moi));
  veKhop();
}
function veKhop() {
  $('fKhop').innerHTML = khopHtml();
  $('fMot').hidden = !!(F.khop && F.khop.nhieu);
  $('hop').querySelector('.luu').textContent = F.khop && F.khop.nhieu ? 'Xem lại' : 'Lưu';
  for (const t of ['luong', 'kcal', 'dam', 'bot', 'beo']) {
    const o = $('fThan').querySelector(`[data-truong="${t}"]`);
    if (o && document.activeElement !== o) o.value = F.r[t] ? String(F.r[t]).replace('.', ',') : '';
  }
  if (F.r.dam || F.r.bot || F.r.beo) $('fThan').querySelector('details').open = true;
}
// Chep o nhap vao F.r (chips da ghi thang vao F.r luc bam)
function docHop() {
  if (F.nhieu) return; // man xem lai khong co o nhap
  $('fThan').querySelectorAll('[data-truong]').forEach(el => {
    F.r[el.dataset.truong] = el.dataset.kieu === 'so' ? T.docSo(el.value) : el.value.trim();
  });
}
function veDanhGiaHop() {
  const o = $('fDg');
  if (!o) return;
  docHop();
  o.innerHTML = F.r.loai === 'can' ? dgHtml(T.bmi(F.r.a, (hoSo() || {}).cao)) : '';
}
function dongHopMuot() {
  if (history.state && history.state.hop) history.back();
  else dongHopThat();
}
function dongHopThat() {
  localStorage.removeItem(KHOA_NHAP);
  const h = $('hop');
  if (!h.open || h.classList.contains('dangdong')) return;
  document.body.appendChild($('toast'));
  h.classList.add('dangdong');
  setTimeout(() => { h.close(); h.classList.remove('dangdong'); }, GIAM.matches ? 0 : 200);
}

// So khac thuong thi hoi lai, so vo ly thi chan. Tra true neu duoc luu.
function soOn(loai, r) {
  const k = T.kiemSo(loai, r);
  if (k && k.loi) { baoLoi(k.loi); return false; }
  return !(k && k.hoi) || confirm(k.hoi);
}

function luuHop() {
  docHop();
  const r = F.r;
  if (r.ngay !== undefined && F.b !== 'hs' && !/^\d{4}-\d{2}-\d{2}$/.test(r.ngay)) { baoLoi('Bạn chưa chọn ngày'); return; }
  if (F.b === 'an' && !F.nhieu && !r.mon) { baoLoi('Bạn chưa nhập tên món'); return; }
  if (F.b === 'an' && !F.nhieu && T.tachMon(r.mon).length > 1) { moXemLai(); return; } // ca khi dang sua: mon dau thay mon nay, mon sau them vao bua
  if (F.b === 'an' && F.nhieu) { luuNhieu(); return; }
  if (F.b === 'da') { luuDa(); return; }
  if (F.b === 'cs' && r.loai === 'pu' && !r.a) { baoLoi('Bạn chưa chọn triệu chứng nào'); return; }
  if (F.b === 'cs' && r.loai === 'pu' && !r.b) { baoLoi('Bạn chưa chọn mức độ'); return; }
  if (F.b === 'cs' && !r.a && !r.b) { baoLoi('Bạn chưa nhập số đo'); return; }
  if (F.b === 'cs' && !soOn(r.loai, r)) return;
  if (F.b === 'ks' && !r.ten) { baoLoi('Bạn chưa nhập nội dung'); return; }
  if (F.b === 'hs' && r.sinh && r.sinh > T.homNay()) { baoLoi('Ngày sinh chưa đúng'); return; }
  if (F.b === 'an' && F.chon) r.mon = F.chon.mon;
  const { b, moi } = F;
  const cu = S[b][r.id];
  ghi(b, { ...r });
  dongHopMuot();
  if (b === 'an' && (tab === 'tq' || tab === 'an')) ngay = r.ngay;
  if (b === 'cs') { loaiCs = r.loai === 'can' || r.loai === 'pu' ? r.loai : 'da'; if (r.loai !== 'can' && r.loai !== 'phong') vungDa = r.loai; }
  ve(true);
  if (moi) {
    const chuaNhan = b === 'an' && r.histamine === '' && !r.kcal;
    bao(b === 'hs' ? 'Đã lưu hồ sơ' : chuaNhan ? `Đã lưu. Chưa nhận diện: ${r.mon}` : 'Đã lưu', () => moHop(b, S[b][r.id]), false, 'Sửa');
    tungHat();
  } else {
    bao('Đã lưu thay đổi', cu ? () => { ghi(b, { ...S[b][r.id], ...cu }); ve(true); } : null);
  }
  if (navigator.vibrate) navigator.vibrate(12);
}

// Nhieu mon bang dau phay: tach, khop tung mon, chuyen sang man xem lai.
function moXemLai() {
  F.nhieu = T.tachMon(F.r.mon).map(go => {
    const k = T.khopMon(go, F.cm);
    return { go, kq: k.kq, m: k.kq === 'ro' ? k.chon : null, ungVien: k.kq === 'ro' ? [k.chon, ...k.ungVien] : k.ungVien, phan: 1 };
  });
  veThanHop();
  $('hop').querySelector('.thanhop').scrollTop = 0;
}
function luuNhieu() {
  const thieu = F.nhieu.filter(x => !x.m && x.kq === 'mo' && !x.giu);
  if (thieu.length) { baoLoi(`Hãy chọn món cho: ${thieu.map(x => x.go).join(', ')}`); return; }
  const goc = F.r;
  const cu = F.moi ? null : S.an[goc.id]; // dang sua: mon dau ghi de len muc nay, cac mon sau la muc moi
  const ids = F.nhieu.map((x, i) => {
    const m = x.m;
    const r = { id: i === 0 && cu ? cu.id : taoId(), xoa: 0, ngay: goc.ngay, gio: goc.gio, bua: goc.bua, ghi: goc.ghi || '',
      mon: m ? m.mon : x.go, luong: (m && m.luong) || '', ...(m ? T.nhanPhan(m, x.phan) : { kcal: 0, dam: 0, bot: 0, beo: 0 }), ...T.coMon(m),
      phan: x.phan };
    ghi('an', r);
    return r.id;
  });
  const chuaNhan = F.nhieu.filter(x => !x.m).map(x => x.go);
  dongHopMuot();
  if (tab === 'tq' || tab === 'an') ngay = goc.ngay;
  ve(true);
  bao(`Đã lưu ${ids.length} món${chuaNhan.length ? `. Chưa nhận diện: ${chuaNhan.join(', ')}` : ''}`,
    () => { ids.forEach(id => ghi('an', cu && id === cu.id ? { ...S.an[id], ...cu } : { ...S.an[id], xoa: 1 })); ve(); });
  tungHat();
  if (navigator.vibrate) navigator.vibrate(12);
}
// Mot lan do da: moi vung co so thanh 1 ban ghi, phong thanh 1 ban ghi; cung ngay gio.
function luuDa() {
  const r = F.r;
  const moi = [...T.VUNG_DA, 'phong'].map(v => ({ loai: v, a: r[v + '_a'] || 0, b: r[v + '_b'] || 0 })).filter(x => x.a || x.b);
  if (!moi.some(x => x.loai !== 'phong')) { baoLoi('Bạn chưa nhập số đo vùng da nào'); return; }
  for (const x of moi) if (!soOn(x.loai, x)) return;
  const ids = moi.map(x => {
    const id = taoId();
    ghi('cs', { id, xoa: 0, ngay: r.ngay, gio: r.gio, loai: x.loai, a: x.a, b: x.b, c: 0, ghi: r.ghi || '' });
    return id;
  });
  dongHopMuot();
  loaiCs = 'da';
  vungDa = moi.find(x => x.loai !== 'phong').loai;
  ve(true);
  bao(`Đã lưu ${moi.filter(x => x.loai !== 'phong').length} vùng da`, () => { ids.forEach(id => ghi('cs', { ...S.cs[id], xoa: 1 })); ve(); });
  tungHat();
}

// ---- Thong bao, hieu ung ----
let henToast = 0, HOAN_TAC = null;
function bao(chu, hoanTac, loi, nhanNut = 'Hoàn tác') {
  const t = $('toast');
  t.className = loi ? 'loi' : '';
  t.innerHTML = `<i class="dau">${loi ? '!' : '✓'}</i><span>${esc(chu)}</span>` + (hoanTac ? `<button data-lam="hoanTac">${nhanNut}</button>` : '');
  t.hidden = false;
  ($('hop').open && !$('hop').classList.contains('dangdong') ? $('hop') : document.body).appendChild(t);
  HOAN_TAC = hoanTac || null;
  clearTimeout(henToast);
  henToast = setTimeout(() => { t.hidden = true; HOAN_TAC = null; }, hoanTac ? 6000 : 2500);
}
const baoLoi = chu => bao(chu, null, true);

function tungHat() {
  if (GIAM.matches) return;
  const r = $('them').getBoundingClientRect();
  const mau = Object.values(MAU_LOAI);
  for (let i = 0; i < 14; i++) {
    const h = document.createElement('i');
    const goc = i / 14 * Math.PI * 2 + Math.random() * .3;
    const xa = 70 + Math.random() * 70;
    h.className = 'hat';
    h.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${mau[i % mau.length]};--x:${Math.cos(goc) * xa}px;--y:${Math.sin(goc) * xa - 50}px`;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 900);
  }
}
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.dong,.loc,.btn,.chips button,.tab,.nhanhbon button,.ocs');
  if (!el || GIAM.matches) return;
  const r = el.getBoundingClientRect();
  const g = document.createElement('i');
  g.className = 'gon';
  g.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
  el.appendChild(g);
  setTimeout(() => g.remove(), 600);
});

// ---- Nut bam ----
const LAM = {
  quayLai() { history.back(); },
  khoaNgay() { moKhoa('nhap'); },
  doiPin() { moKhoa('doiCu'); },
  phuKhoa() {
    if (K.che.startsWith('doi')) { $('khoa').hidden = true; K.che = ''; K.so = ''; K.cu = K.pin1 = ''; return; }
    if (K.che === 'moPin') { canLink(); return; }
    if (K.che === 'canLink') {
      const s = $('kLink').value;
      if (!s.trim()) { $('kLink').focus(); return; }
      const lk = docLink(s.trim());
      if (!lk) { canLink('Link vừa dán không đúng, hãy chép lại cả link'); return; }
      // Mo thang, khong cho su kien doi dia chi (dia chi trung link cu thi su kien khong chay -> bam khong thay gi)
      S.lk = lk; luuKho();
      history.replaceState(history.state, '', '#' + lk.id + '.' + lk.k);
      vaoApp(); dongBo();
      return;
    }
    if (K.che.startsWith('nhap')) boP();
    kiemMay(QUEN);
  },
  ngayLui() { ngay = T.congNgay(ngay, -1); huong = -1; luuTrang('replace'); ve(true); },
  ngayToi() { if (ngay < T.homNay()) { ngay = T.congNgay(ngay, 1); huong = 1; luuTrang('replace'); ve(true); } },
  themMoi() { if (tab === 'cs') { if (loaiCs === 'da') moHop('da'); else moHop('cs', null, { loai: loaiCs === 'pu' ? 'pu' : 'can' }); } else if (tab === 'hs') moHop('ks'); else moHop('an'); },
  themAn() { moHop('an'); },
  themKs() { moHop('ks'); },
  suaHs() { moHop('hs', S.hs.toi); },
  themDa() { moHop('da'); },
  themMonO() {
    const o = $('fMon');
    if (o.value.trim() && !/,\s*$/.test(o.value)) o.value = o.value.trim() + ', ';
    o.focus();
    o.setSelectionRange(o.value.length, o.value.length);
  },
  themVaoBua() {
    const o = $('fMon');
    o.value = o.value.replace(/[\s,]+$/, '') + ', ';
    o.focus();
    o.setSelectionRange(o.value.length, o.value.length);
  },
  doiMon() { F.khop.moDoi = !F.khop.moDoi; veKhop(); },
  nhieuQuay() {
    F.r.mon = F.nhieu.map(x => (x.m ? x.m.mon : x.go)).join(', ');
    F.nhieu = null;
    khopLai();
    veThanHop();
  },
  dongHop() { dongHopMuot(); },
  dongBoNgay() { trangThai.loi = ''; dongBo(); },
  noiLink() {
    const lk = docLink($('fLink').value);
    if (!lk) { baoLoi('Link này chưa đúng'); return; }
    S.lk = lk; S.tu = 0; boP(); luuKho(); ve(); vaoApp();
  },
  xoaMuc() {
    const { b } = F;
    const cu = S[b][F.r.id];
    dongHopMuot();
    if (!cu) return;
    ghi(b, { ...cu, xoa: 1 });
    ve();
    bao('Đã xoá', () => { ghi(b, { ...S[b][cu.id], xoa: 0 }); ve(); });
  },
  hoanTac() {
    const f = HOAN_TAC;
    $('toast').hidden = true;
    HOAN_TAC = null;
    if (f) f();
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('button');
  if (!el) return;
  const d = el.dataset;
  if (d.lam) LAM[d.lam]();
  else if (d.phim) bamPhim(d.phim);
  else if (d.xoaso) xoaPhim();
  else if (d.tab) moTab(d.tab);
  else if (d.sua) { const [b, id] = d.sua.split(':'); moHop(b, S[b][id]); }
  else if (d.themcs) moHop('cs', null, { loai: d.themcs });
  else if (d.thembua) moHop('an', null, { bua: d.thembua });
  else if (d.xemcs) { loaiCs = d.xemcs; if (d.vung && d.vung !== 'can') vungDa = d.vung; tab = 'cs'; luuTrang('push'); ve(true); scrollTo(0, 0); }
  else if (d.chonvung) { vungDa = d.chonvung; ve(); }
  else if (d.phan !== undefined) doiPhan(Number(d.phan));
  else if (d.nphan !== undefined) { F.nhieu[d.nphan].phan = Number(d.v); veThanHop(); }
  else if (d.tc !== undefined) { F.r.a = T.batTat(F.r.a || 0, Number(d.tc)); el.classList.toggle('on'); }
  else if (d.ghimon) moHop('an', null, { mon: d.ghimon });
  else if (d.chonmon !== undefined) { docHop(); datChon(F.khop.ungVien[d.chonmon]); F.khop.moDoi = false; $('fMon').value = F.r.mon = F.chon.mon; veKhop(); }
  else if (d.nhieudoi !== undefined) { const x = F.nhieu[d.nhieudoi]; x.moDoi = !x.moDoi; veThanHop(); }
  else if (d.nchon !== undefined) {
    const [i, j] = d.nchon.split(':').map(Number);
    const x = F.nhieu[i];
    x.m = j < 0 ? null : x.ungVien[j];
    x.giu = j < 0;
    x.moDoi = false;
    veThanHop();
  }
  else if (d.loaics) { loaiCs = d.loaics; luuTrang('replace'); ve(true); }
  else if (d.chon !== undefined) {
    const truong = el.parentElement.dataset.nhom;
    docHop();
    F.r[truong] = truong === 'vanDong' || truong === 'b' ? Number(d.chon) : d.chon;
    if (F.b === 'cs' && truong === 'loai') { F.r.a = F.r.b = F.r.c = 0; veThanHop(); return; } // moi loai co o nhap khac
    el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el));
  }
  else if (d.moncu) {
    const x = S.an[d.moncu];
    docHop();
    F.r.mon = x.mon;
    F.khop = { kq: 'ro', chon: x, ungVien: [], go: x.mon };
    F.chon = null;
    const goc = T.coBan(x);
    F.r.luong = goc.luong || '';
    Object.assign(F.r, T.nhanPhan(goc, F.r.phan || 1));
    datChon(goc);
    $('fMon').value = x.mon;
    veKhop();
  }
});

let henKhop = 0;
$('fForm').addEventListener('submit', e => { e.preventDefault(); luuHop(); });
$('hop').addEventListener('cancel', e => { e.preventDefault(); dongHopMuot(); });
$('hop').addEventListener('close', () => { if (history.state && history.state.hop) history.back(); });
$('fThan').addEventListener('input', e => {
  if (e.target.dataset.kieu === 'so') veDanhGiaHop();
  // Go ten mon: tra danh muc + mon tung an, ro rang thi tu dien calo, mo ho thi cho chon
  if (e.target.id === 'fMon') {
    clearTimeout(henKhop);
    henKhop = setTimeout(() => { if (!F || F.b !== 'an' || F.nhieu) return; docHop(); khopLai(); veKhop(); }, 250);
  }
});

// ---- Khoi dong ----
window.addEventListener('hashchange', () => {
  nhanLinkTuDiaChi();
  history.replaceState({ tab, ngay, loaiCs, sau: 0 }, '');
  ve();
  if (S.lk && (K.che === 'canLink' || (!P && $('khoa').hidden))) vaoApp();
  dongBo();
});
document.addEventListener('keydown', e => {
  if ($('khoa').hidden) return;
  if (K.che === 'canLink') { if (e.key === 'Enter') LAM.phuKhoa(); return; }
  if (/^\d$/.test(e.key)) bamPhim(e.key);
  else if (e.key === 'Backspace') xoaPhim();
});
window.addEventListener('online', () => { trangThai.loi = ''; dongBo(); });
window.addEventListener('storage', e => { if (e.key === KHOA_KHO) { S = docKho(); ve(); } });
// Roi app (tat man hinh, chuyen app khac) thi che man hinh; quay lai luon phai nhap mat ma, nhu khoa iPhone.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (S.lk && P) { giuNhapDo(); document.body.classList.add('che'); }
    return;
  }
  if (S.lk && P && $('khoa').hidden) moKhoa('nhap'); // hien man mat ma truoc roi moi bo che, khong lo du lieu
  document.body.classList.remove('che');
  if (ngay > T.homNay()) ngay = T.homNay();
  veAnToan();
  dongBo();
});
setInterval(() => { if (!document.hidden) dongBo(); }, 60000);
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // Co ban moi (sw moi vua nam quyen) thi tai lai ngay luc dang o man khoa, khong bat nguoi dung tat mo app 2 lan.
  const daCo = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (daCo && !$('khoa').hidden && !K.ban) location.reload();
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
}

nhanLinkTuDiaChi();
history.replaceState({ tab, ngay, loaiCs, sau: 0 }, '');
vaoApp();
ve(true);
if ($('khoa').hidden) dongBo();
