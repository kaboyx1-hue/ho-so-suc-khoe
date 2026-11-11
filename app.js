'use strict';
const KHOA_KHO = 'hssk_v1';
const KHOA_PIN = 'hssk_pin';
const BUA = [['sang', 'Bữa sáng', '🌅'], ['trua', 'Bữa trưa', '☀️'], ['toi', 'Bữa tối', '🌙'], ['phu', 'Ăn vặt, đồ uống', '🍪']];
const LOAI_KHAM = [['kham', 'Khám bệnh', '🏥'], ['xetnghiem', 'Xét nghiệm', '🧪'], ['tiem', 'Tiêm chủng', '💉'], ['thuoc', 'Đơn thuốc', '💊']];
const NHOM_MAU = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VAN_DONG = [['1.2', 'Ít vận động'], ['1.375', 'Nhẹ, 1–3 buổi/tuần'], ['1.55', 'Vừa, 3–5 buổi/tuần'], ['1.725', 'Nhiều, 6–7 buổi/tuần']];
const MAU_LOAI = { can: '#2f80ed', huyetap: '#e03131', duong: '#c2255c', nhip: '#f03e3e', spo2: '#1098ad', nhiet: '#f76707', ngu: '#7048e8', nuoc: '#1c7ed6', buoc: '#37b24d', eo: '#e69500' };

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const taoId = () => Date.now().toString(36) + '-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
const GIAM = matchMedia('(prefers-reduced-motion:reduce)');

// ---- Luu tren may ----
let S = docKho();
let tab = 'tq', ngay = T.homNay(), loaiCs = 'can';
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

async function goiMay(o) {
  const kiemSoat = new AbortController();
  const dongHo = setTimeout(() => kiemSoat.abort(), 45000);
  try {
    const tl = await fetch(`https://script.google.com/macros/s/${S.lk.id}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // kieu nay trinh duyet khong hoi truoc, Google chiu duoc
      body: JSON.stringify({ k: S.lk.k, ...o }),
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
    if (!kq.ok) throw new Error(kq.loi === 'khoa' ? 'Link riêng không đúng, nhờ mở lại đúng link' : kq.loi);

    const biTuChoi = new Set(kq.boQua || []);
    let daNhan = 0;
    for (const m of gui) {
      // Sua tiep trong luc dang gui thi van giu cho, lan sau gui ban moi hon.
      if (S[m.b][m.r.id].sua === m.r.sua && !biTuChoi.has(m.r.id)) { delete S.ban[m.b + ':' + m.r.id]; daNhan++; }
    }
    for (const m of kq.ds) if (S[m.b]) T.gop(S[m.b], m.r);
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
const K = { che: '', so: '', pin1: '', cu: '', sai: 0, ban: false };
const TIEU_DE = {
  nhap: 'Nhập mật mã', nhapMay: 'Nhập mật mã', dat1: 'Đặt mật mã 6 số', dat2: 'Nhập lại mật mã',
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
  K.che = ''; K.so = ''; K.sai = 0;
  dongBo();
  ve(true);
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
  return kq.loi || 'Có lỗi, hãy thử lại';
}
async function kiemMay(goiY = '') {
  $('khoa').hidden = false;
  K.che = 'kiem'; K.so = '';
  $('kTieuDe').textContent = 'Hồ Sơ Sức Khoẻ';
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
function vaoApp() {
  if (!S.lk) return;
  if (P) moKhoa('nhap');
  else kiemMay();
}
const LUONG = {
  async nhap(so) {
    if (await banPin(so, P.muoi) === P.bam) { moApp(); return; }
    K.sai++;
    if (K.sai < 5) { saiRung(`Sai mật mã, còn ${5 - K.sai} lần`); return; }
    boP();
    K.sai = 0;
    moKhoa('nhapMay', 'Sai 5 lần. Cần có mạng để kiểm tra lại mật mã.');
  },
  async nhapMay(so) {
    const kq = await goiMay({ pin: so });
    if (!kq.ok) { saiRung(chuLoi(kq)); return; }
    await luuP(so, kq.the);
    moApp();
  },
  dat1(so) { K.pin1 = so; moKhoa('dat2', 'Nhập lại lần nữa cho chắc'); },
  async dat2(so) {
    if (so !== K.pin1) { moKhoa('dat1', 'Hai lần không giống nhau, hãy đặt lại'); return; }
    const kq = await goiMay({ datPin: so });
    K.pin1 = '';
    if (!kq.ok) { moKhoa('nhapMay', 'Hồ sơ này đã có mật mã'); return; }
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
  if (!L) return '';
  if (x.loai === 'huyetap') return `${x.a}/${x.b}`;
  return T.hienSo(x.a, L.le || 0);
}
const iconBua = b => (BUA.find(x => x[0] === b) || BUA[3])[2];

function dongAn(x) {
  const phu = [x.luong, x.dam || x.bot || x.beo ? `Đạm ${x.dam || 0}g · Bột ${x.bot || 0}g · Béo ${x.beo || 0}g` : '', x.ghi].filter(Boolean).join(' · ');
  return `<button class="dong" data-sua="an:${esc(x.id)}"><span class="oh" style="--n:#fff3e0;--m:#f97316">${iconBua(x.bua)}</span>
    <span class="giua"><div class="ten">${esc(x.mon)}</div><div class="phu">${esc(x.gio ? x.gio + (phu ? ' · ' + phu : '') : phu)}</div></span>
    <span class="so">${x.kcal ? T.hienSo(x.kcal) + ' kcal' : ''}</span></button>`;
}
function dongCs(x) {
  const L = T.LOAI[x.loai] || { ten: x.loai, icon: '•', dv: '' };
  const phu = [x.gio, x.loai === 'huyetap' && x.c ? `nhịp ${x.c}` : '', x.ghi].filter(Boolean).join(' · ');
  return `<button class="dong" data-sua="cs:${esc(x.id)}"><span class="oh" style="--n:${MAU_LOAI[x.loai] || '#888'}1c;--m:${MAU_LOAI[x.loai] || '#888'}">${L.icon}</span>
    <span class="giua"><div class="ten">${esc(L.ten)}</div><div class="phu">${esc(phu)}</div></span>
    <span class="so">${giaTri(x)} <small>${esc(L.dv)}</small>${dgHtml(T.danhGia(x.loai, x.a, x.b))}</span></button>`;
}
function dongKs(x) {
  const l = LOAI_KHAM.find(k => k[0] === x.loai) || LOAI_KHAM[0];
  const phu = [x.ngay.split('-').reverse().join('/'), x.noi, x.ketQua].filter(Boolean).join(' · ');
  return `<button class="dong" data-sua="ks:${esc(x.id)}"><span class="oh" style="--n:#eef2ff;--m:#7c3aed">${l[2]}</span>
    <span class="giua"><div class="ten">${esc(x.ten || l[1])}</div><div class="phu">${esc(phu)}</div></span></button>`;
}

function veHomNay() {
  const hs = hoSo();
  const kg = canNang();
  const an = T.anTrongNgay(ds('an'), ngay);
  const tong = T.tongAn(an);
  const can = T.kcalCan(hs, kg, T.homNay());
  const nuoc = T.congNgay2(ds('cs'), 'nuoc', ngay);
  const nuocCan = T.nuocCan(hs, kg);
  const p = can ? Math.min(100, tong.kcal / can * 100) : 0;
  const vong = `<div class="vongbox"><svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="nen" cx="60" cy="60" r="52" pathLength="100"/>
      <circle class="day ${can && tong.kcal > can ? 'vuot' : ''}" cx="60" cy="60" r="52" pathLength="100" style="stroke-dasharray:${p} 100"/></svg>
      <div class="vongchu"><b>${dem(tong.kcal)}</b>kcal đã ăn</div></div>`;
  const ben = can
    ? `<div>Mục tiêu<b>${dem(can)} kcal</b></div><div>${tong.kcal > can ? 'Đã vượt' : 'Còn ăn được'}<b>${dem(Math.abs(can - tong.kcal))} kcal</b></div>`
    : `<div>Điền chiều cao, ngày sinh, giới tính và cân nặng để app tính lượng calo nên ăn mỗi ngày.</div><button data-lam="suaHs">Điền hồ sơ</button>`;

  const oCs = ['can', 'huyetap', 'duong', 'nhip', 'ngu', 'spo2', 'nhiet', 'eo'].map(l => {
    const x = T.moiNhat(ds('cs'), l);
    if (!x) return '';
    const L = T.LOAI[l];
    const dg = l === 'can' ? T.bmi(x.a, hs && hs.cao) : T.danhGia(l, x.a, x.b);
    return `<button class="ocs" style="--m:${MAU_LOAI[l]}" data-xemcs="${l}"><span class="nhan">${L.icon} ${L.ten}</span>
      <b>${giaTri(x)} <small>${L.dv}</small></b>${l === 'can' && dg ? `<span class="dg m${dg.muc}">BMI ${T.hienSo(dg.so, 1)} · ${dg.chu}</span>` : dgHtml(dg)}</button>`;
  }).join('');

  const luuY = hs && (hs.diUng || hs.benh) ? `<section class="the khancap"><h2>⚠️ Lưu ý sức khoẻ</h2>
      ${hs.diUng ? `<div class="dongtt"><span>Dị ứng</span><b>${esc(hs.diUng)}</b></div>` : ''}
      ${hs.benh ? `<div class="dongtt"><span>Bệnh nền</span><b>${esc(hs.benh)}</b></div>` : ''}</section>` : '';

  return `<section class="hero">
      <div class="vongcal">${vong}<div class="calben">${ben}</div></div>
      <div class="nuoc"><span>💧 ${dem(nuoc)}/${T.hienSo(nuocCan)} ml</span>
        <div class="vach"><i style="width:${Math.min(100, nuoc / nuocCan * 100)}%"></i></div>
        <button data-lam="themNuoc">+250 ml</button></div>
    </section>
    <section class="nhanhbon">
      <button data-lam="themAn" style="--n:#fff0e6;--m:#f97316"><span>🍽️</span>Bữa ăn</button>
      <button data-themcs="can" style="--n:#e7f0ff;--m:#2f80ed"><span>⚖️</span>Cân nặng</button>
      <button data-themcs="huyetap" style="--n:#ffeaea;--m:#e03131"><span>🩺</span>Huyết áp</button>
      <button data-lam="themKs" style="--n:#eef2ff;--m:#7c3aed"><span>🏥</span>Khám, tiêm</button>
    </section>
    <section class="the"><h2>Ăn uống ${ngay === T.homNay() ? 'hôm nay' : 'ngày ' + ddmm(ngay)}<button data-tab="an">Xem chi tiết</button></h2>
      ${an.length ? `<div class="nhom">${an.map(dongAn).join('')}</div>` : '<div class="trong"><span>🥗</span>Chưa ghi bữa nào. Bấm dấu + để ghi món vừa ăn.</div>'}</section>
    <section class="the"><h2>Chỉ số gần nhất<button data-tab="cs">Tất cả</button></h2>
      ${oCs ? `<div class="oluoi">${oCs}</div>` : '<div class="trong"><span>📈</span>Chưa có chỉ số nào. Bắt đầu bằng cân nặng hoặc huyết áp.</div>'}</section>
    ${luuY}`;
}

function veAn() {
  const hs = hoSo();
  const an = T.anTrongNgay(ds('an'), ngay);
  const tong = T.tongAn(an);
  const can = T.kcalCan(hs, canNang(), T.homNay());
  const g = tong.dam + tong.bot + tong.beo;
  const vach = g ? `<div class="vach"><i style="width:${tong.dam / g * 100}%;background:#e8590c"></i><i style="width:${tong.bot / g * 100}%;background:#f2c94c"></i><i style="width:${tong.beo / g * 100}%;background:#2f80ed"></i></div>` : '';

  const nhom = BUA.map(([b, ten, icon]) => {
    const mon = an.filter(x => x.bua === b);
    const k = mon.reduce((s, x) => s + (x.kcal || 0), 0);
    return `<div class="bua"><span>${icon} ${ten} ${k ? `<small>· ${T.hienSo(k)} kcal</small>` : ''}</span><button data-thembua="${b}">+ Thêm</button></div>
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
    <section>${nhom}</section>
    <section class="the" style="margin-top:14px"><h2>Calo 7 ngày<small>${trungBinh.length ? 'TB ' + T.hienSo(trungBinh.reduce((a, b) => a + b, 0) / trungBinh.length) + ' kcal' : ''}</small></h2>
      <div class="cot">${can ? `<span class="muc" style="bottom:${can / max * 100}%" title="Mục tiêu"></span>` : ''}${cot}</div>
      <div class="truc">${ngays.map(n => `<span>${n.slice(8, 10)}</span>`).join('')}</div></section>`;
}

// Bieu do duong cho 1 hoac 2 chuoi so (huyet ap co 2 duong)
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

function veCs() {
  const L = T.LOAI[loaiCs];
  const locs = `<div class="locs">${Object.entries(T.LOAI).map(([k, v]) =>
    `<button class="loc ${k === loaiCs ? 'on' : ''}" data-loaics="${k}">${v.icon} ${v.ten}</button>`).join('')}</div>`;
  const tat = T.csLoai(ds('cs'), loaiCs);
  const mau = MAU_LOAI[loaiCs];
  let dau;
  if (L.cong) {
    // Nuoc, buoc chan: cong theo ngay, xem 14 ngay gan nhat
    const ngays = Array.from({ length: 14 }, (_, i) => T.congNgay(T.homNay(), i - 13));
    const theoNgay = ngays.map(n => T.congNgay2(ds('cs'), loaiCs, n));
    const can = loaiCs === 'nuoc' ? T.nuocCan(hoSo(), canNang()) : 0;
    const max = Math.max(...theoNgay, can, 1) * 1.1;
    dau = `<div class="nhan">Hôm nay</div><div class="solon">${T.hienSo(theoNgay[13])} <small>${L.dv}${can ? ' / ' + T.hienSo(can) : ''}</small></div>
      <div class="cot" style="margin-top:12px">${can ? `<span class="muc" style="bottom:${can / max * 100}%"></span>` : ''}${theoNgay.map((v, i) =>
        `<i class="${i === 13 ? 'nay' : ''}" style="height:${v ? Math.max(3, v / max * 100) : 0}%" title="${ddmm(ngays[i])}: ${T.hienSo(v)}"></i>`).join('')}</div>
      <div class="truc"><span>${ddmm(ngays[0])}</span><span>${ddmm(ngays[7])}</span><span>Hôm nay</span></div>`;
  } else if (tat.length) {
    const cuoi = tat[tat.length - 1];
    const hs = hoSo();
    const dg = loaiCs === 'can' ? T.bmi(cuoi.a, hs && hs.cao) : T.danhGia(loaiCs, cuoi.a, cuoi.b);
    const gan = tat.slice(-30);
    const chuoi = loaiCs === 'huyetap' ? [gan.map(x => x.a), gan.map(x => x.b)] : [gan.map(x => x.a)];
    const truoc = tat.length > 1 ? tat[tat.length - 2] : null;
    const doi = truoc && loaiCs !== 'huyetap' ? cuoi.a - truoc.a : 0;
    dau = `<div class="nhan">Lần gần nhất · ${tenNgay(cuoi.ngay)}${cuoi.gio ? ' ' + cuoi.gio : ''}</div>
      <div class="solon">${giaTri(cuoi)} <small>${L.dv}</small></div>
      ${loaiCs === 'can' && dg ? `<span class="dg m${dg.muc}">BMI ${T.hienSo(dg.so, 1)} · ${dg.chu}</span>` : dgHtml(dg)}
      ${doi ? `<span class="nhan"> · ${doi > 0 ? '+' : ''}${T.hienSo(doi, L.le || 0)} so với lần trước</span>` : ''}
      ${loaiCs === 'can' && !(hs && hs.cao) ? '<p class="ghichu">Điền chiều cao ở Hồ sơ để xem BMI.</p>' : ''}
      ${veDuong(chuoi, mau)}`;
  } else {
    dau = `<div class="trong"><span>${L.icon}</span>Chưa ghi ${L.ten.toLowerCase()} lần nào.</div>`;
  }

  // Danh sach, moi nhat len dau, nhom theo ngay
  let ra = '', ngayCu = '', dong = [];
  const dongNgay = () => { if (ngayCu) ra += `<div class="ngay"><span>${tenNgay(ngayCu)}</span></div><div class="nhom">${dong.join('')}</div>`; };
  for (const x of tat.slice().reverse().slice(0, 120)) {
    if (x.ngay !== ngayCu) { dongNgay(); ngayCu = x.ngay; dong = []; }
    dong.push(dongCs(x));
  }
  dongNgay();

  return `${locs}<section class="the">${dau}
      <button class="btn rong" style="margin-top:14px" data-themcs="${loaiCs}">+ Ghi ${L.ten.toLowerCase()}</button>
      <p class="ghichu">Đánh giá chỉ để tham khảo theo ngưỡng phổ biến, không thay lời khuyên của bác sĩ.</p></section>${ra}`;
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
      ${tt('Nước nên uống/ngày', `${T.hienSo(T.nuocCan(hs, kg))} ml`)}
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
  if (b === 'an') return { ...goc, bua: them.bua || buaTheoGio(goc.gio), mon: '', luong: '', kcal: 0, dam: 0, bot: 0, beo: 0 };
  if (b === 'cs') return { ...goc, loai: them.loai || loaiCs, a: 0, b: 0, c: 0 };
  if (b === 'ks') return { id: goc.id, xoa: 0, ngay: T.homNay(), loai: 'kham', noi: '', ten: '', ketQua: '', ghi: '' };
  return { id: 'toi', xoa: 0, ten: '', sinh: '', gioi: '', cao: 0, nhomMau: '', diUng: '', benh: '', thuoc: '', lienHe: '', ghi: '', vanDong: 1.375, mucKcal: 0, mucNuoc: 0 };
}

const oChu = (t, nhan, ph = '') => `<label class="o"><span>${nhan}</span><input data-truong="${t}" value="${esc(F.r[t] || '')}" placeholder="${esc(ph)}" maxlength="200" autocomplete="off"></label>`;
const oDai = (t, nhan, ph = '') => `<label class="o"><span>${nhan}</span><textarea data-truong="${t}" placeholder="${esc(ph)}" maxlength="2000">${esc(F.r[t] || '')}</textarea></label>`;
const oSo = (t, nhan, dv) => `<label class="o"><span>${nhan}</span><div class="codv"><input data-truong="${t}" data-kieu="so" inputmode="decimal" value="${F.r[t] ? String(F.r[t]).replace('.', ',') : ''}" autocomplete="off"><em>${dv}</em></div></label>`;
const oNgayGio = () => `<div class="hang2"><label class="o"><span>Ngày</span><input type="date" data-truong="ngay" value="${F.r.ngay}" max="${T.homNay()}"></label>
  <label class="o"><span>Giờ</span><input type="time" data-truong="gio" value="${F.r.gio || ''}"></label></div>`;
const chips = (truong, ds) => `<div class="chips" data-nhom="${truong}">${ds.map(([v, nhan, icon]) =>
  `<button type="button" class="${String(F.r[truong]) === String(v) ? 'on' : ''}" data-chon="${v}">${icon ? `<span>${icon}</span>` : ''}${nhan}</button>`).join('')}</div>`;

const FORM = {
  an() {
    const cu = T.monCu(ds('an')).slice(0, 12);
    return chips('bua', BUA.map(([v, n, i]) => [v, n.replace('Ăn vặt, đồ uống', 'Ăn vặt'), i])) +
      (F.moi && cu.length ? `<div class="moncu">${cu.map(x => `<button type="button" data-moncu="${esc(x.id)}">${esc(x.mon)}${x.kcal ? ' · ' + T.hienSo(x.kcal) : ''}</button>`).join('')}</div>` : '') +
      `<label class="o"><span>Món ăn</span><input data-truong="mon" id="fMon" list="dsMon" value="${esc(F.r.mon)}" placeholder="Ví dụ: Phở bò" maxlength="200" autocomplete="off"></label>
      <datalist id="dsMon">${T.monCu(ds('an')).map(x => `<option value="${esc(x.mon)}">`).join('')}</datalist>
      <div class="hang2">${oChu('luong', 'Lượng', '1 tô, 200g…')}${oSo('kcal', 'Calo', 'kcal')}</div>
      <details ${F.r.dam || F.r.bot || F.r.beo ? 'open' : ''}><summary>Đạm, tinh bột, chất béo</summary>
        <div class="hang3">${oSo('dam', 'Đạm', 'g')}${oSo('bot', 'Tinh bột', 'g')}${oSo('beo', 'Béo', 'g')}</div></details>
      ${oNgayGio()}${oChu('ghi', 'Ghi chú', 'Cảm thấy thế nào sau khi ăn…')}`;
  },
  cs() {
    const L = T.LOAI[F.r.loai];
    const o = L.o.map((nhan, i) => oSo('abc'[i], nhan, i === 2 ? 'lần/phút' : L.dv)).join('');
    return chips('loai', Object.entries(T.LOAI).map(([k, v]) => [k, v.ten, v.icon])) +
      (L.o.length > 1 ? `<div class="hang3">${o}</div>` : o) +
      (F.r.loai === 'nuoc' ? `<div class="moncu">${[150, 250, 330, 500].map(v => `<button type="button" data-dien="${v}">${v} ml</button>`).join('')}</div>` : '') +
      `<div id="fDg"></div>${oNgayGio()}${oChu('ghi', 'Ghi chú', F.r.loai === 'duong' ? 'Lúc đói / sau ăn 2 giờ…' : '')}`;
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
      `<div class="hang2">${oSo('mucKcal', 'Calo mục tiêu', 'kcal')}${oSo('mucNuoc', 'Nước mục tiêu', 'ml')}</div>
      <p class="ghichu" style="margin-top:-4px">Để trống thì app tự tính theo cân nặng, chiều cao, tuổi.</p>` +
      oDai('ghi', 'Ghi chú khác');
  },
};
const TEN_HOP = { an: 'Ghi bữa ăn', cs: 'Ghi chỉ số', ks: 'Khám, xét nghiệm, tiêm', hs: 'Hồ sơ của tôi' };

function moHop(b, r, them) {
  F = { b, moi: !r, r: r ? { ...r } : macDinh(b, them) };
  if (b === 'hs') F.r = { ...macDinh('hs'), ...F.r };
  $('fTieuDe').textContent = (r && b !== 'hs' ? 'Sửa: ' : '') + TEN_HOP[b];
  veThanHop();
  $('fXoa').hidden = F.moi || b === 'hs';
  $('hop').classList.remove('dangdong');
  $('hop').showModal();
  $('hop').querySelector('.thanhop').scrollTop = 0;
  luuTrang('push', { hop: 1 });
}
function veThanHop() {
  $('fThan').innerHTML = FORM[F.b]();
  veDanhGiaHop();
}
// Chep o nhap vao F.r (chips da ghi thang vao F.r luc bam)
function docHop() {
  $('fThan').querySelectorAll('[data-truong]').forEach(el => {
    F.r[el.dataset.truong] = el.dataset.kieu === 'so' ? T.docSo(el.value) : el.value.trim();
  });
}
function veDanhGiaHop() {
  const o = $('fDg');
  if (!o) return;
  docHop();
  o.innerHTML = dgHtml(F.r.loai === 'can' ? T.bmi(F.r.a, (hoSo() || {}).cao) : T.danhGia(F.r.loai, F.r.a, F.r.b));
}
function dongHopMuot() {
  if (history.state && history.state.hop) history.back();
  else dongHopThat();
}
function dongHopThat() {
  const h = $('hop');
  if (!h.open || h.classList.contains('dangdong')) return;
  document.body.appendChild($('toast'));
  h.classList.add('dangdong');
  setTimeout(() => { h.close(); h.classList.remove('dangdong'); }, GIAM.matches ? 0 : 200);
}

function luuHop() {
  docHop();
  const r = F.r;
  if (r.ngay !== undefined && F.b !== 'hs' && !/^\d{4}-\d{2}-\d{2}$/.test(r.ngay)) { baoLoi('Bạn chưa chọn ngày'); return; }
  if (F.b === 'an' && !r.mon) { baoLoi('Bạn chưa nhập tên món'); return; }
  if (F.b === 'cs' && !r.a) { baoLoi('Bạn chưa nhập số đo'); return; }
  if (F.b === 'cs' && r.loai === 'huyetap' && !r.b) { baoLoi('Huyết áp cần cả số trên và số dưới'); return; }
  if (F.b === 'ks' && !r.ten) { baoLoi('Bạn chưa nhập nội dung'); return; }
  if (F.b === 'hs' && r.sinh && r.sinh > T.homNay()) { baoLoi('Ngày sinh chưa đúng'); return; }
  const { b, moi } = F;
  const cu = S[b][r.id];
  ghi(b, { ...r });
  dongHopMuot();
  if (b === 'an' && (tab === 'tq' || tab === 'an')) ngay = r.ngay;
  if (b === 'cs') loaiCs = r.loai;
  ve(true);
  if (moi) {
    bao(b === 'hs' ? 'Đã lưu hồ sơ' : 'Đã lưu', () => moHop(b, S[b][r.id]), false, 'Sửa');
    tungHat();
  } else {
    bao('Đã lưu thay đổi', cu ? () => { ghi(b, { ...S[b][r.id], ...cu }); ve(true); } : null);
  }
  if (navigator.vibrate) navigator.vibrate(12);
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
    if (K.che.startsWith('nhap')) boP();
    kiemMay(QUEN);
  },
  ngayLui() { ngay = T.congNgay(ngay, -1); huong = -1; luuTrang('replace'); ve(true); },
  ngayToi() { if (ngay < T.homNay()) { ngay = T.congNgay(ngay, 1); huong = 1; luuTrang('replace'); ve(true); } },
  themMoi() { if (tab === 'cs') moHop('cs'); else if (tab === 'hs') moHop('ks'); else moHop('an'); },
  themAn() { moHop('an'); },
  themKs() { moHop('ks'); },
  suaHs() { moHop('hs', S.hs.toi); },
  themNuoc() {
    const id = taoId();
    ghi('cs', { id, ngay, gio: T.gioNay(), loai: 'nuoc', a: 250, b: 0, c: 0, ghi: '', xoa: 0 });
    ve();
    bao('Đã thêm 250 ml nước', () => { ghi('cs', { ...S.cs[id], xoa: 1 }); ve(); });
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
  else if (d.xemcs) { loaiCs = d.xemcs; tab = 'cs'; luuTrang('push'); ve(true); scrollTo(0, 0); }
  else if (d.loaics) { loaiCs = d.loaics; luuTrang('replace'); ve(true); }
  else if (d.chon !== undefined) {
    const truong = el.parentElement.dataset.nhom;
    docHop();
    F.r[truong] = truong === 'vanDong' ? Number(d.chon) : d.chon;
    if (F.b === 'cs' && truong === 'loai') { F.r.a = F.r.b = F.r.c = 0; veThanHop(); return; } // moi loai co o nhap khac
    el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el));
  }
  else if (d.moncu) {
    const x = S.an[d.moncu];
    for (const t of ['mon', 'luong', 'kcal', 'dam', 'bot', 'beo']) {
      const o = $('fThan').querySelector(`[data-truong="${t}"]`);
      if (o) o.value = x[t] ? String(x[t]).replace('.', ',') : '';
    }
    if (x.dam || x.bot || x.beo) $('fThan').querySelector('details').open = true;
  }
  else if (d.dien) { const o = $('fThan').querySelector('[data-truong="a"]'); o.value = d.dien; }
});

$('fForm').addEventListener('submit', e => { e.preventDefault(); luuHop(); });
$('hop').addEventListener('cancel', e => { e.preventDefault(); dongHopMuot(); });
$('hop').addEventListener('close', () => { if (history.state && history.state.hop) history.back(); });
$('fThan').addEventListener('input', e => {
  if (e.target.dataset.kieu === 'so') veDanhGiaHop();
  // Go dung ten mon da an thi tu dien calo neu o calo con trong
  if (e.target.id === 'fMon') {
    const x = T.monCu(ds('an')).find(m => m.mon.trim().toLowerCase() === e.target.value.trim().toLowerCase());
    const oKcal = $('fThan').querySelector('[data-truong="kcal"]');
    if (x && !oKcal.value) {
      for (const t of ['luong', 'kcal', 'dam', 'bot', 'beo']) {
        const o = $('fThan').querySelector(`[data-truong="${t}"]`);
        if (o && !o.value && x[t]) o.value = String(x[t]).replace('.', ',');
      }
    }
  }
});

// ---- Khoi dong ----
window.addEventListener('hashchange', () => {
  nhanLinkTuDiaChi();
  history.replaceState({ tab, ngay, loaiCs, sau: 0 }, '');
  ve();
  if (S.lk && !P && $('khoa').hidden) vaoApp();
  dongBo();
});
document.addEventListener('keydown', e => {
  if ($('khoa').hidden) return;
  if (/^\d$/.test(e.key)) bamPhim(e.key);
  else if (e.key === 'Backspace') xoaPhim();
});
window.addEventListener('online', () => { trangThai.loi = ''; dongBo(); });
window.addEventListener('storage', e => { if (e.key === KHOA_KHO) { S = docKho(); ve(); } });
// Roi app thi che man hinh; quay lai sau 1 phut phai nhap lai mat ma.
let lucAn = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lucAn = Date.now();
    if (S.lk && P) document.body.classList.add('che');
    return;
  }
  document.body.classList.remove('che');
  if (S.lk && P && $('khoa').hidden && Date.now() - lucAn > 60000) moKhoa('nhap');
  if (ngay > T.homNay()) ngay = T.homNay();
  veAnToan();
  dongBo();
});
setInterval(() => { if (!document.hidden) dongBo(); }, 60000);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');

nhanLinkTuDiaChi();
history.replaceState({ tab, ngay, loaiCs, sau: 0 }, '');
vaoApp();
ve(true);
if ($('khoa').hidden) dongBo();
