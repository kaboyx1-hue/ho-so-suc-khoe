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

  // Cac loai chi so. a/b la 2 o so cua mot lan do (dv: don vi tung o).
  // Da: moi vung mot loai, 1 lan do ra ca do am lan do nhon (%). Phong: dieu kien phong luc do da.
  const da = ten => ({ ten: 'Da ' + ten, icon: '🧴', o: ['Độ ẩm', 'Độ nhờn'], dv: ['%', '%'], le: 1, nhom: 'da' });
  T.LOAI = {
    can: { ten: 'Cân nặng', icon: '⚖️', o: ['Cân nặng'], dv: ['kg'], le: 1 },
    da_tran: da('trán'), da_mui: da('mũi'), da_ma: da('má'), da_cam: da('cằm'),
    phong: { ten: 'Phòng lúc đo', icon: '🌡️', o: ['Nhiệt độ phòng', 'Độ ẩm phòng'], dv: ['°C', '%'], le: 1, nhom: 'da' },
    pu: { ten: 'Phản ứng', icon: '😣', o: ['Triệu chứng', 'Mức độ'], dv: ['', ''], le: 0, nhom: 'pu' },
  };
  T.VUNG_DA = ['da_tran', 'da_mui', 'da_ma', 'da_cam'];

  // Khoang so hop ly. cung: vuot thi khong cho luu (may chu cung chan). mem: hoi lai cho chac.
  const KHOANG = {
    can: { a: { cung: [2, 300], mem: [25, 200] } },
    da: { a: { cung: [0, 100], mem: [5, 95] }, b: { cung: [0, 100], mem: [1, 90] } },
    phong: { a: { cung: [-10, 60], mem: [10, 42] }, b: { cung: [0, 100], mem: [15, 98] } },
  };
  // Tra { loi } (khong cho luu), { hoi } (bat thuong, hoi lai) hoac null.
  T.kiemSo = (loai, r) => {
    const L = T.LOAI[loai];
    const k = L && (KHOANG[loai] || KHOANG[L.nhom]);
    if (!k) return null;
    let hoi = null;
    for (const [i, o] of ['a', 'b'].entries()) {
      const v = r[o];
      if (!k[o] || !v) continue;
      const ten = `${L.o[i]} ${T.hienSo(v, 1)} ${L.dv[i]}`;
      if (v < k[o].cung[0] || v > k[o].cung[1]) return { loi: `${ten} không thể đúng, hãy kiểm tra lại` };
      if (!hoi && (v < k[o].mem[0] || v > k[o].mem[1])) hoi = { hoi: `${ten} khác thường. Có gõ nhầm không? Vẫn lưu?` };
    }
    return hoi;
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

  // Calo can moi ngay: Mifflin-St Jeor nhan he so van dong. Thieu thong tin thi tra 0.
  T.kcalCan = (hs, kg, homNay) => {
    if (!hs) return 0;
    if (hs.mucKcal) return hs.mucKcal;
    const tuoi = T.tuoi(hs.sinh, homNay);
    if (!kg || !hs.cao || !tuoi || (hs.gioi !== 'nam' && hs.gioi !== 'nu')) return 0;
    const nen = 10 * kg + 6.25 * hs.cao - 5 * tuoi + (hs.gioi === 'nam' ? 5 : -161);
    return Math.round(nen * (hs.vanDong || 1.375) / 10) * 10;
  };

  const conSong = x => !x.xoa;
  const sauHon = (x, y) => (x.ngay + (x.gio || '')).localeCompare(y.ngay + (y.gio || '')) || x.sua - y.sua;

  T.anTrongNgay = (dsAn, ngay) => dsAn.filter(x => conSong(x) && x.ngay === ngay).sort(sauHon);
  T.tongAn = ds => ds.reduce((s, x) => ({ kcal: s.kcal + (x.kcal || 0), dam: s.dam + (x.dam || 0), bot: s.bot + (x.bot || 0), beo: s.beo + (x.beo || 0) }),
    { kcal: 0, dam: 0, bot: 0, beo: 0 });

  T.csLoai = (dsCs, loai) => dsCs.filter(x => conSong(x) && x.loai === loai).sort(sauHon);
  T.moiNhat = (dsCs, loai) => { const ds = T.csLoai(dsCs, loai); return ds[ds.length - 1] || null; };

  // Mon da an truoc day: lay lan moi nhat cua moi ten mon, de goi y va tu dien calo.
  T.monCu = dsAn => {
    const theoTen = {};
    for (const x of dsAn.filter(conSong).sort(sauHon)) theoTen[x.mon.trim().toLowerCase()] = x;
    return Object.values(theoTen).reverse();
  };

  // ---- Danh muc mon an: khop ten mo theo tu khoa ----
  // Bo dau de khop ca khi go khong dau ("rau muong"). Van hien ten goc co dau.
  T.boDau = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const tuCua = s => String(s).toLowerCase().normalize('NFC').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  // Tach "Cơm, thịt kho; rau muống" thanh tung mon.
  T.tachMon = s => String(s).split(/[,;\n]+/).map(x => x.trim().replace(/\s+/g, ' ')).filter(Boolean);

  // Cac co cua mot mon de luu kem ban ghi an (chu, '' = chua phan loai). Danh muc goi co sua bo la "sua".
  const chuCo = v => (v === undefined || v === null || v === '' ? '' : String(v));
  T.coMon = m => ({
    histamine: chuCo(m && m.histamine), duongHuyet: chuCo(m && m.duongHuyet),
    // danh muc ghi sua bo o truong "sua" (0/1); ban ghi an thi "sua" la moc thoi gian sua, khong phai sua bo
    suaBo: chuCo(m && (m.suaBo !== undefined ? m.suaBo : m.sua === 0 || m.sua === 1 ? m.sua : '')),
    nhomBeo: (m && m.nhomBeo) || '', loaiDuong: (m && m.loaiDuong) || '',
  });

  // Chi muc: moi tu dem xuat hien o bao nhieu ten mon. Tu cang hiem trong so cang cao ("muống" > "rau").
  T.chiMuc = dsMon => {
    const df = {}, dfKd = {};
    const mon = dsMon.map(m => {
      const tu = tuCua(m.mon);
      const kd = tu.map(T.boDau);
      new Set(tu).forEach(t => { df[t] = (df[t] || 0) + 1; });
      new Set(kd).forEach(t => { dfKd[t] = (dfKd[t] || 0) + 1; });
      return { m, tu, kd, ten: ` ${tu.join(' ')} `, tenKd: ` ${kd.join(' ')} ` };
    });
    return { mon, df, dfKd, n: dsMon.length };
  };
  const RO = 0.75; // ung vien thu 2 duoi 75% diem ung vien 1 thi coi la ro rang

  // Tra { kq: 'ro'|'mo'|'khong', chon, ungVien }. Go co dau thi so co dau, go khong dau thi so khong dau.
  T.khopMon = (chuoi, cm) => {
    const q0 = tuCua(chuoi);
    if (!q0.length) return { kq: 'khong', chon: null, ungVien: [] };
    const coDau = q0.some(t => T.boDau(t) !== t);
    const q = coDau ? q0 : q0.map(T.boDau);
    const df = coDau ? cm.df : cm.dfKd;
    const w = t => Math.log(1 + cm.n / (df[t] || 0.5));
    // Chu khong co trong ten mon nao ("nhà làm", "ngon") thi bo qua, khong keo diem xuong
    const tongQ = [...new Set(q)].filter(t => df[t]).reduce((s, t) => s + w(t), 0);
    if (!tongQ) return { kq: 'khong', chon: null, ungVien: [] };
    const ds = [];
    for (const x of cm.mon) {
      const tu = coDau ? x.tu : x.kd;
      const ten = coDau ? x.ten : x.tenKd;
      if (ten.trim() === q.join(' ')) { ds.push({ m: x.m, d: 1e6 }); continue; } // trung ten
      let khop = 0;
      for (const t of new Set(q)) if (tu.includes(t)) khop += w(t);
      if (!khop || khop < tongQ * 0.5) continue; // phan lon tu khoa phai co trong ten mon
      const tongX = [...new Set(tu)].reduce((s, t) => s + w(t), 0);
      // Cac tu lien nhau dung thu tu nhu trong ten mon ("thịt kho") duoc cong them
      let lien = 0;
      for (let i = 0; i + 1 < q.length; i++) if (ten.includes(` ${q[i]} ${q[i + 1]} `)) lien += 0.5 * (w(q[i]) + w(q[i + 1]));
      // Ten mon Viet mo dau bang loai mon (canh, bun, pho...): chu dau trung nhau duoc cong them
      if (tu[0] === q[0] && df[q[0]]) lien += 0.5 * w(q[0]);
      ds.push({ m: x.m, d: (khop + lien) * (0.6 + 0.4 * khop / tongX) * (khop / tongQ) }); // thieu tu da go thi bi tru
    }
    ds.sort((a, b) => b.d - a.d);
    if (!ds.length) return { kq: 'khong', chon: null, ungVien: [] };
    // Chu dau la loai mon ("canh rau củ"): mon diem cao nhat khong co chu do ma co mon khac mo dau dung chu do -> hoi lai
    const tuOf = x => cm.mon.find(y => y.m === x.m) || { tu: [], kd: [] };
    const dauCua = x => (coDau ? tuOf(x).tu : tuOf(x).kd);
    const dungLoai = ds.find(x => dauCua(x)[0] === q[0]);
    if (dungLoai && ds[0] !== dungLoai && !dauCua(ds[0]).includes(q[0]) && ds[0].d < 1e6) {
      return { kq: 'mo', chon: null, ungVien: [dungLoai, ...ds.filter(x => x !== dungLoai)].slice(0, 6).map(x => x.m) };
    }
    if (ds.length === 1 || ds[1].d < ds[0].d * RO) return { kq: 'ro', chon: ds[0].m, ungVien: ds.slice(1, 4).map(x => x.m) };
    return { kq: 'mo', chon: null, ungVien: ds.filter(x => x.d >= ds[0].d * RO).slice(0, 6).map(x => x.m) };
  };

  // Nguon tra cuu = mon tung an (so lieu cua chinh minh, uu tien) + danh muc. Trung ten thi giu mon tung an.
  T.nguonMon = (dsAn, danhMuc) => {
    const cu = T.monCu(dsAn);
    const daCo = new Set(cu.map(x => x.mon.trim().toLowerCase()));
    return cu.concat(danhMuc.filter(m => !daCo.has(m.mon.trim().toLowerCase())));
  };

  // ---- Diem histamine uoc luong (khong phai so do y khoa, khong co nguong chuan) ----
  const DIEM_HIS = { 0: 0, 1: 1, 2: 3 }; // muc cao nang hon han: vai mon nang du "tran nguong"
  T.diemMon = x => (x.histamine === '' || x.histamine === undefined || x.histamine === null ? null : DIEM_HIS[x.histamine] || 0);
  // Diem theo bua va ca ngay; chuaPhanLoai = so mon khong ro muc (khong tinh vao diem).
  T.diemNgay = dsAnNgay => {
    const bua = {};
    let tong = 0, chuaPhanLoai = 0, coCao = 0;
    for (const x of dsAnNgay) {
      const d = T.diemMon(x);
      if (d === null) { chuaPhanLoai++; continue; }
      bua[x.bua] = (bua[x.bua] || 0) + d;
      tong += d;
      if (String(x.histamine) === '2') coCao++;
    }
    return { bua, tong, chuaPhanLoai, coCao };
  };
  // Ngay dau tien co mon da phan loai histamine: truoc ngay nay diem khong dang tin.
  T.ngayBatDauHis = dsAn => dsAn.filter(x => !x.xoa && T.diemMon(x) !== null).map(x => x.ngay).sort()[0] || '';

  // Dem co da mun trong ngay. Khong gop thanh 1 diem: moi co la mot co che khac nhau.
  T.coDaNgay = dsAnNgay => {
    const c = { duongCao: 0, suaBo: 0, omega6: 0, omega3: 0 };
    for (const x of dsAnNgay) {
      if (String(x.duongHuyet) === '2') c.duongCao++;
      if (String(x.suaBo) === '1') c.suaBo++;
      if (x.nhomBeo === 'omega6') c.omega6++;
      if (x.nhomBeo === 'omega3') c.omega3++;
    }
    return c;
  };

  // Goi y mon muc histamine thap, mon minh tung an len truoc.
  T.goiYCanBang = (dsAn, danhMuc, n = 6) => {
    const daAn = new Set(T.monCu(dsAn).map(x => x.mon.trim().toLowerCase()));
    const thap = danhMuc.filter(m => m.histamine === 0 && m.kcal >= 30 && !/chưa nấu/i.test(m.mon)); // bo nguyen lieu song
    const quen = thap.filter(m => daAn.has(m.mon.trim().toLowerCase()));
    return quen.concat(thap.filter(m => !daAn.has(m.mon.trim().toLowerCase()))).slice(0, n);
  };

  // ---- Phan ung co the: luu o bang chi so, loai 'pu', a = cac trieu chung (moi trieu chung 1 bit), b = muc do 1-3 ----
  // KHONG doi thu tu danh sach nay: vi tri trong danh sach chinh la bit da luu tren Sheet. Them moi thi them vao cuoi.
  T.TRIEU_CHUNG = [
    ['Ngứa', '🤚'], ['Đỏ, nóng mặt', '🔥'], ['Nổi mẩn, mề đay', '🔴'], ['Nổi mụn mới', '🟠'], ['Da đổ dầu nhiều', '💧'],
    ['Đau đầu', '🤕'], ['Nghẹt mũi, hắt hơi', '🤧'], ['Đầy bụng, khó tiêu', '🫃'], ['Tim đập nhanh', '💓'], ['Mệt, uể oải', '😮‍💨'],
  ];
  T.MUC_PU = ['', 'Nhẹ', 'Vừa', 'Nặng'];
  T.trieuChung = a => T.TRIEU_CHUNG.filter((_, i) => (a >> i) & 1);
  T.batTat = (a, i) => a ^ (1 << i);

  const phut = (ngay, gio) => {
    const [y, m, d] = ngay.split('-').map(Number);
    const [h, p] = (gio || '12:00').split(':').map(Number);
    return new Date(y, m - 1, d, h, p).getTime();
  };
  // Mon an trong khoang `gioTruoc` gio truoc luc phan ung (gom ca luc phan ung), moi nhat truoc.
  T.monTruoc = (dsAn, pu, gioTruoc = 24) => {
    const t = phut(pu.ngay, pu.gio);
    return dsAn.filter(x => !x.xoa && phut(x.ngay, x.gio) <= t && phut(x.ngay, x.gio) > t - gioTruoc * 3600000)
      .sort((a, b) => phut(b.ngay, b.gio) - phut(a.ngay, a.gio));
  };
  // Mon hay di truoc phan ung: dem so lan phan ung co mon do trong 24 gio truoc. Chi la trung hop thoi gian, khong phai nguyen nhan.
  T.monHayGap = (dsAn, dsPu, toiThieu = 2) => {
    const dem = {};
    for (const pu of dsPu.filter(x => !x.xoa && x.loai === 'pu')) {
      const daDem = new Set();
      for (const x of T.monTruoc(dsAn, pu)) {
        const k = x.mon.trim().toLowerCase();
        if (daDem.has(k)) continue;
        daDem.add(k);
        dem[k] = dem[k] || { mon: x.mon, lan: 0, histamine: x.histamine };
        dem[k].lan++;
      }
    }
    // Kem so ngay da an mon do: mon ngay nao cung an (com trang) thi dung nhien hay gap, de nguoi xem tu can nhac
    for (const x of Object.values(dem)) x.soNgayAn = new Set(dsAn.filter(a => !a.xoa && a.mon.trim().toLowerCase() === x.mon.trim().toLowerCase()).map(a => a.ngay)).size;
    return Object.values(dem).filter(x => x.lan >= toiThieu).sort((a, b) => b.lan - a.lan || a.soNgayAn - b.soNgayAn || a.mon.localeCompare(b.mon));
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
