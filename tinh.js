// Phan tinh toan va gop du lieu. Khong dung toi giao dien, de test duoc bang node.
// Nguong danh gia chi de tham khao, khong thay cho chan doan cua bac si.
(function (goc) {
  const T = {};
  const hai = n => String(n).padStart(2, '0');

  // Ngay theo gio cua may, KHONG dung toISOString (lech sang ngay hom truoc luc 0-7h gio VN).
  T.homNay = (d = new Date()) => `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
  T.gioNay = (d = new Date()) => `${hai(d.getHours())}:${hai(d.getMinutes())}`;
  T.congNgay = (ngay, n) => {
    const [y, m, d] = ngay.split('-').map(Number);
    return T.homNay(new Date(y, m - 1, d + n));
  };
  T.tuoi = (sinh, homNay) => {
    if (!sinh) return 0;
    const [y, m, d] = sinh.split('-').map(Number);
    const [y2, m2, d2] = homNay.split('-').map(Number);
    return y2 - y - (m2 < m || (m2 === m && d2 < d) ? 1 : 0);
  };
  T.hienSo = (n, le = 0) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: le });
  T.docSo = s => {
    const n = Number(String(s == null ? '' : s).trim().replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  // Cac loai chi so. a/b/c la 3 o so cua mot lan do; cong = cong don ca ngay thay vi lay lan moi nhat.
  T.LOAI = {
    can: { ten: 'Cân nặng', icon: '⚖️', dv: 'kg', o: ['Cân nặng'], le: 1 },
    huyetap: { ten: 'Huyết áp', icon: '🩺', dv: 'mmHg', o: ['Tâm thu', 'Tâm trương', 'Nhịp tim'] },
    duong: { ten: 'Đường huyết', icon: '🩸', dv: 'mmol/L', o: ['Đường huyết lúc đói'], le: 1 },
    nhip: { ten: 'Nhịp tim', icon: '❤️', dv: 'lần/phút', o: ['Nhịp tim lúc nghỉ'] },
    spo2: { ten: 'SpO₂', icon: '🫁', dv: '%', o: ['SpO₂'] },
    nhiet: { ten: 'Nhiệt độ', icon: '🌡️', dv: '°C', o: ['Nhiệt độ'], le: 1 },
    ngu: { ten: 'Giấc ngủ', icon: '😴', dv: 'giờ', o: ['Số giờ ngủ'], le: 1 },
    nuoc: { ten: 'Nước uống', icon: '💧', dv: 'ml', o: ['Lượng nước'], cong: 1 },
    buoc: { ten: 'Bước chân', icon: '👟', dv: 'bước', o: ['Số bước'], cong: 1 },
    eo: { ten: 'Vòng eo', icon: '📏', dv: 'cm', o: ['Vòng eo'], le: 1 },
  };

  // Moi danh gia: { chu, muc } voi muc 0 = tot, 1 = can de y, 2 = nen di kham.
  const muc = (chu, m) => ({ chu, muc: m });

  // BMI theo nguong WHO cho nguoi chau A.
  T.bmi = (kg, cm) => {
    if (!kg || !cm) return null;
    const so = kg / (cm / 100) ** 2;
    const dg = so < 18.5 ? muc('Thiếu cân', 1) : so < 23 ? muc('Bình thường', 0) : so < 25 ? muc('Thừa cân', 1) : muc('Béo phì', 2);
    return { so: Math.round(so * 10) / 10, ...dg };
  };

  T.danhGia = (loai, a, b) => {
    if (!a) return null;
    switch (loai) {
      case 'huyetap':
        if (!b) return null;
        if (a >= 180 || b >= 120) return muc('Rất cao, nên đi khám ngay', 2);
        if (a < 90 || b < 60) return muc('Thấp', 1);
        if (a >= 140 || b >= 90) return muc('Cao độ 2', 2);
        if (a >= 130 || b >= 80) return muc('Cao độ 1', 1);
        if (a >= 120) return muc('Hơi cao', 1);
        return muc('Bình thường', 0);
      case 'duong':
        return a < 3.9 ? muc('Thấp', 2) : a < 5.6 ? muc('Bình thường', 0) : a < 7 ? muc('Tiền tiểu đường', 1) : muc('Cao', 2);
      case 'nhip':
        return a < 50 ? muc('Chậm', 1) : a <= 100 ? muc('Bình thường', 0) : muc('Nhanh', 1);
      case 'spo2':
        return a >= 95 ? muc('Bình thường', 0) : a >= 90 ? muc('Hơi thấp', 1) : muc('Thấp, nên đi khám', 2);
      case 'nhiet':
        return a < 35 ? muc('Thân nhiệt thấp', 2) : a <= 37.5 ? muc('Bình thường', 0) : a <= 38.5 ? muc('Sốt nhẹ', 1) : muc('Sốt cao', 2);
      case 'ngu':
        return a < 6 ? muc('Ngủ ít', 1) : a <= 9 ? muc('Đủ giấc', 0) : muc('Ngủ nhiều', 1);
      default: return null;
    }
  };

  // Calo can moi ngay: Mifflin-St Jeor nhan he so van dong. Thieu thong tin thi tra 0.
  T.kcalCan = (hs, kg, homNay) => {
    if (!hs) return 0;
    if (hs.mucKcal) return hs.mucKcal;
    const tuoi = T.tuoi(hs.sinh, homNay);
    if (!kg || !hs.cao || !tuoi || (hs.gioi !== 'nam' && hs.gioi !== 'nu')) return 0;
    const nen = 10 * kg + 6.25 * hs.cao - 5 * tuoi + (hs.gioi === 'nam' ? 5 : -161);
    return Math.round(nen * (hs.vanDong || 1.375) / 10) * 10;
  };

  // Nuoc moi ngay: tu dat, khong thi 35 ml moi kg, chua co can nang thi 2000 ml.
  T.nuocCan = (hs, kg) => (hs && hs.mucNuoc) || (kg ? Math.round(kg * 35 / 50) * 50 : 2000);

  const conSong = x => !x.xoa;
  const sauHon = (x, y) => (x.ngay + (x.gio || '')).localeCompare(y.ngay + (y.gio || '')) || x.sua - y.sua;

  T.anTrongNgay = (dsAn, ngay) => dsAn.filter(x => conSong(x) && x.ngay === ngay).sort(sauHon);
  T.tongAn = ds => ds.reduce((s, x) => ({ kcal: s.kcal + (x.kcal || 0), dam: s.dam + (x.dam || 0), bot: s.bot + (x.bot || 0), beo: s.beo + (x.beo || 0) }),
    { kcal: 0, dam: 0, bot: 0, beo: 0 });

  T.csLoai = (dsCs, loai) => dsCs.filter(x => conSong(x) && x.loai === loai).sort(sauHon);
  T.moiNhat = (dsCs, loai) => { const ds = T.csLoai(dsCs, loai); return ds[ds.length - 1] || null; };
  T.congNgay2 = (dsCs, loai, ngay) => dsCs.reduce((s, x) => s + (conSong(x) && x.loai === loai && x.ngay === ngay ? x.a || 0 : 0), 0);

  // Mon da an truoc day: lay lan moi nhat cua moi ten mon, de goi y va tu dien calo.
  T.monCu = dsAn => {
    const theoTen = {};
    for (const x of dsAn.filter(conSong).sort(sauHon)) theoTen[x.mon.trim().toLowerCase()] = x;
    return Object.values(theoTen).reverse();
  };

  // Gop ban ghi tu may chu vao kho cua may nay. Ban nao sua sau thi thang.
  T.gop = (kho, b) => {
    const cu = kho[b.id];
    if (!cu || b.sua >= cu.sua) kho[b.id] = b;
  };
  // Luon lon hon lan sua truoc, ke ca khi dong ho may nay chay cham hon may kia.
  T.moc = (cu, bayGio = Date.now()) => Math.max(bayGio, cu ? cu.sua + 1 : 0);

  if (typeof module !== 'undefined') module.exports = T;
  else goc.T = T;
})(this);
