const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../tinh.js');

test('ngay: cong ngay qua thang/nam, tuoi tinh dung truoc va sau sinh nhat', () => {
  assert.equal(T.congNgay('2026-12-31', 1), '2027-01-01');
  assert.equal(T.congNgay('2026-03-01', -1), '2026-02-28');
  assert.equal(T.tuoi('1990-11-12', '2026-11-11'), 35);
  assert.equal(T.tuoi('1990-11-11', '2026-11-11'), 36);
  assert.equal(T.tuoi('', '2026-11-11'), 0);
});

test('docSo nhan dau phay, bo so am va chu', () => {
  assert.equal(T.docSo('65,5'), 65.5);
  assert.equal(T.docSo('-3'), 0);
  assert.equal(T.docSo('abc'), 0);
  assert.equal(T.docSo(''), 0);
});

test('BMI theo nguong chau A', () => {
  assert.deepEqual(T.bmi(65, 170), { so: 22.5, chu: 'Bình thường', muc: 0 });
  assert.equal(T.bmi(70, 170).chu, 'Thừa cân');
  assert.equal(T.bmi(80, 170).chu, 'Béo phì');
  assert.equal(T.bmi(50, 170).chu, 'Thiếu cân');
  assert.equal(T.bmi(0, 170), null);
});

test('kiem so: chan so phi sinh ly, hoi lai so khac thuong, so binh thuong khong hoi', () => {
  assert.equal(T.kiemSo('can', { a: 62.5 }), null);
  assert.ok(T.kiemSo('can', { a: 650 }).loi);
  assert.ok(T.kiemSo('can', { a: 210 }).hoi);
  assert.equal(T.kiemSo('da_tran', { a: 45, b: 20 }), null);
  assert.ok(T.kiemSo('da_ma', { a: 45, b: 120 }).loi);
  assert.ok(T.kiemSo('da_ma', { a: 2, b: 20 }).hoi);
  assert.ok(T.kiemSo('phong', { a: 70, b: 60 }).loi);
  assert.equal(T.kiemSo('phong', { a: 28, b: 75 }), null);
  assert.equal(T.kiemSo('huyetap', { a: 999 }), null); // loai da bo: khong con trong app
});

test('calo can: tu tinh khi du thong tin, uu tien so tu dat', () => {
  const hs = { sinh: '1996-01-01', gioi: 'nu', cao: 160, vanDong: 1.375 };
  // 10*55 + 6.25*160 - 5*30 - 161 = 1239 -> x1.375 = 1703.6 -> 1700
  assert.equal(T.kcalCan(hs, 55, '2026-11-11'), 1700);
  assert.equal(T.kcalCan({ ...hs, mucKcal: 1500 }, 55, '2026-11-11'), 1500);
  assert.equal(T.kcalCan({ ...hs, gioi: '' }, 55, '2026-11-11'), 0);
  assert.equal(T.kcalCan(hs, 0, '2026-11-11'), 0);
});

test('tong an trong ngay bo mon da xoa va ngay khac; mon cu lay lan moi nhat', () => {
  const ds = [
    { id: '1', ngay: '2026-11-11', gio: '07:00', mon: 'Phở', kcal: 450, dam: 20, sua: 1, xoa: 0 },
    { id: '2', ngay: '2026-11-11', gio: '12:00', mon: 'Cơm gà', kcal: 600, sua: 1, xoa: 0 },
    { id: '3', ngay: '2026-11-11', gio: '13:00', mon: 'Trà sữa', kcal: 350, sua: 1, xoa: 1 },
    { id: '4', ngay: '2026-11-10', gio: '07:00', mon: 'phở ', kcal: 400, sua: 1, xoa: 0 },
  ];
  const ngay = T.anTrongNgay(ds, '2026-11-11');
  assert.deepEqual(ngay.map(x => x.id), ['1', '2']);
  assert.deepEqual(T.tongAn(ngay), { kcal: 1050, dam: 20, bot: 0, beo: 0 });
  const cu = T.monCu(ds);
  assert.equal(cu.find(x => x.mon.trim().toLowerCase() === 'phở').kcal, 450);
  assert.equal(cu.some(x => x.mon === 'Trà sữa'), false);
});

test('chi so: moi nhat theo ngay gio, bo muc da xoa', () => {
  const ds = [
    { id: '1', ngay: '2026-11-10', gio: '07:00', loai: 'can', a: 60, sua: 5, xoa: 0 },
    { id: '2', ngay: '2026-11-11', gio: '06:00', loai: 'can', a: 59.5, sua: 1, xoa: 0 },
    { id: '3', ngay: '2026-11-11', gio: '08:00', loai: 'can', a: 70, sua: 1, xoa: 1 },
  ];
  assert.equal(T.moiNhat(ds, 'can').a, 59.5);
  assert.equal(T.moiNhat(ds, 'da_tran'), null);
});

test('gop: ban sua sau thang, moc luon tang', () => {
  const kho = { a: { id: 'a', sua: 10 } };
  T.gop(kho, { id: 'a', sua: 5, x: 1 });
  assert.equal(kho.a.x, undefined);
  T.gop(kho, { id: 'a', sua: 11, x: 2 });
  assert.equal(kho.a.x, 2);
  assert.equal(T.moc({ sua: 100 }, 50), 101);
});

const M = require('../mon-an.js');
const B = require('../bien-the.js');
const TAT = T.gopDanhMuc(M, B);
const cm = T.chiMuc(TAT);
const khop = q => T.khopMon(q, cm);

test('danh muc mon: du truong, khong trung ten, muc histamine 0/1/2', () => {
  assert.ok(M.length >= 200);
  assert.equal(new Set(M.map(m => m.mon.toLowerCase())).size, M.length);
  for (const m of M) {
    assert.ok([0, 1, 2].includes(m.histamine), m.mon);
    assert.ok(typeof m.kcal === 'number' && m.kcal >= 0, m.mon);
  }
});

test('khop: go dung ten mon thi nhan luon; chi 1 mon co du chu thi chon luon; go khong dau van khop', () => {
  assert.equal(khop('Phở bò').chon.mon, 'Phở bò');
  assert.equal(khop('pho bo').chon.mon, 'Phở bò');
  assert.equal(khop('cà phê').chon.mon, 'Cà phê');
  assert.equal(khop('cà phê sữa').chon.mon, 'Cà phê sữa đá');
  assert.equal(khop('thịt kho tàu').chon.mon, 'Thịt kho tàu (thịt kho trứng)');
  assert.equal(khop('bánh xèo chay nhà làm').chon.mon, 'Bánh xèo'); // chu la khong keo diem xuong
});

test('khop: go ten nguyen lieu thi bay ra MOI cach che bien de chon, khong doan bua', () => {
  const heo = khop('thịt heo');
  assert.equal(heo.kq, 'mo');
  const ten = heo.ungVien.map(m => m.mon);
  for (const c of ['Thịt heo nạc luộc', 'Thịt heo nạc kho', 'Thịt heo nạc chiên', 'Thịt heo ba chỉ nướng', 'Thịt heo xay xào']) assert.ok(ten.includes(c), c);
  assert.ok(ten.length >= 20);
  assert.ok(heo.ungVien.every(m => /thịt/i.test(m.mon) && /heo/i.test(m.mon)));
  assert.equal(khop('thit heo').ungVien.length, ten.length); // khong dau ra cung danh sach
  const rau = khop('rau muống');
  assert.equal(rau.kq, 'mo');
  assert.deepEqual(rau.ungVien.map(m => m.mon).sort(), ['Canh rau muống', 'Rau muống hấp', 'Rau muống luộc', 'Rau muống xào'].sort());
  assert.ok(khop('gà').ungVien.length >= 20);
  const k = khop('cải');
  assert.equal(k.kq, 'mo');
  assert.ok(k.ungVien.every(m => /cải/i.test(m.mon)));
  assert.equal(khop('cơm').kq, 'mo');
  const canh = khop('canh rau củ'); // canh hay rau cu luoc: hoi lai, mon canh dung dau
  assert.equal(canh.kq, 'mo');
  assert.match(canh.ungVien[0].mon, /^Canh/);
});

test('kho bien the: du truong, khong trung ten, muc histamine theo cach nau, so hop ly', () => {
  assert.ok(B.length >= 200);
  assert.equal(new Set(B.map(m => m.mon.toLowerCase())).size, B.length);
  const tim = t => B.find(m => m.mon === t);
  assert.equal(tim('Thịt heo nạc luộc').histamine, 1);
  assert.equal(tim('Thịt heo nạc kho').histamine, 2); // kho = nuoc mam nau lau, nhu Thit kho tau
  assert.equal(tim('Ức gà luộc').histamine, 0);
  assert.equal(tim('Cá thu hấp').histamine, 2);
  assert.equal(tim('Rau muống luộc').histamine, 0);
  assert.ok(tim('Thịt heo nạc chiên').kcal > tim('Thịt heo nạc luộc').kcal); // chien them dau
  assert.equal(tim('Thịt heo nạc chiên').nhomBeo, 'omega6');
  assert.equal(tim('Cá thu chiên').nhomBeo, 'omega3');
  for (const m of B) {
    assert.ok(m.kcal > 0 && m.kcal < 1500, m.mon);
    if (m.kcal >= 50) assert.ok(Math.abs(m.dam * 4 + m.bot * 4 + m.beo * 9 - m.kcal) / m.kcal < 0.25, m.mon + ' calo lech dam/bot/beo'); // rau it calo: lam tron + chat xo
  }
  assert.equal(TAT.length, M.length + B.length - B.filter(b => M.some(m => m.mon.toLowerCase() === b.mon.toLowerCase())).length);
});

test('khop mo: khong khop thi tra khong, khong tu dien so lieu', () => {
  assert.deepEqual(khop('xyz abc'), { kq: 'khong', chon: null, ungVien: [] });
  assert.equal(khop('   ').kq, 'khong');
});

test('tach nhieu mon bang dau phay, bo phan rong; mon tung an uu tien hon danh muc', () => {
  assert.deepEqual(T.tachMon('Cơm,  thịt kho tàu ,, rau muống xào;canh'), ['Cơm', 'thịt kho tàu', 'rau muống xào', 'canh']);
  const an = [{ id: '1', mon: 'Phở bò', kcal: 600, ngay: '2026-11-01', sua: 1, xoa: 0 }];
  const nguon = T.nguonMon(an, TAT);
  assert.equal(nguon.filter(m => m.mon === 'Phở bò').length, 1);
  assert.equal(T.khopMon('phở bò', T.chiMuc(nguon)).chon.kcal, 600);
});

test('co mon: lay dung muc, sua bo doc tu truong sua cua danh muc, khong co thi de trong', () => {
  const ca = M.find(m => /^Cá thu/.test(m.mon));
  assert.deepEqual(T.coMon(ca), { histamine: '2', duongHuyet: '0', suaBo: '0', nhomBeo: 'omega3', loaiDuong: 'khong-dang-ke' });
  assert.deepEqual(T.coMon(null), { histamine: '', duongHuyet: '', suaBo: '', nhomBeo: '', loaiDuong: '' });
  assert.equal(T.coMon({ histamine: 0 }).histamine, '0'); // 0 la "thap", khong phai trong
});

test('diem histamine: ngay toan mon thap = 0; vai mon cao van diem cao; mon chua phan loai khong tinh', () => {
  const x = (bua, h) => ({ bua, histamine: h });
  assert.equal(T.diemNgay([x('sang', '0'), x('trua', '0'), x('toi', '0')]).tong, 0);
  const d = T.diemNgay([x('sang', '0'), x('trua', '2'), x('trua', '1'), x('toi', '2'), x('phu', '')]);
  assert.equal(d.tong, 7);
  assert.deepEqual(d.bua, { sang: 0, trua: 4, toi: 3 });
  assert.equal(d.chuaPhanLoai, 1);
  assert.equal(d.coCao, 2);
  assert.equal(T.ngayBatDauHis([{ ngay: '2026-11-05', histamine: '' }, { ngay: '2026-11-07', histamine: '1' }, { ngay: '2026-11-06', histamine: '0' }]), '2026-11-06');
});

test('co da mun dem rieng tung co che; goi y can bang chi lay mon thap, mon tung an len truoc', () => {
  assert.deepEqual(T.coDaNgay([{ duongHuyet: '2', suaBo: '1', nhomBeo: 'omega6' }, { duongHuyet: '1', nhomBeo: 'omega3' }]),
    { duongCao: 1, suaBo: 1, omega6: 1, omega3: 1 });
  const thap = M.find(m => m.histamine === 0 && m.kcal >= 30);
  const gy = T.goiYCanBang([{ id: '1', mon: thap.mon, ngay: '2026-11-01', sua: 1, xoa: 0 }], M, 5);
  assert.equal(gy[0].mon, thap.mon);
  assert.ok(gy.every(m => m.histamine === 0));
});

test('phan ung: trieu chung luu dang bit, bat tat dung, danh sach khong doi thu tu', () => {
  let a = 0;
  a = T.batTat(a, 0); a = T.batTat(a, 3);
  assert.deepEqual(T.trieuChung(a).map(x => x[0]), ['Ngứa', 'Nổi mụn mới']);
  a = T.batTat(a, 0);
  assert.deepEqual(T.trieuChung(a).map(x => x[0]), ['Nổi mụn mới']);
  assert.equal(T.TRIEU_CHUNG[0][0], 'Ngứa'); // doi thu tu se doc sai du lieu cu tren Sheet
  assert.equal(T.TRIEU_CHUNG[9][0], 'Mệt, uể oải');
});

test('phan ung: mon trong 24 gio truoc, dem mon hay gap kem so ngay da an', () => {
  const an = [
    { mon: 'Cá thu', ngay: '2026-11-10', gio: '19:00', histamine: '2' },
    { mon: 'Cơm trắng', ngay: '2026-11-10', gio: '19:00', histamine: '0' },
    { mon: 'Cơm trắng', ngay: '2026-11-11', gio: '12:00', histamine: '0' },
    { mon: 'Kim chi', ngay: '2026-11-12', gio: '12:00', histamine: '2' },
    { mon: 'Cá thu', ngay: '2026-11-12', gio: '19:00', histamine: '2' },
    { mon: 'Phở bò', ngay: '2026-11-09', gio: '07:00', histamine: '1' }, // qua 24 gio
    { mon: 'Cá thu', ngay: '2026-11-13', gio: '08:00', histamine: '2', xoa: 1 },
  ];
  const pu1 = { loai: 'pu', ngay: '2026-11-11', gio: '08:00', a: 1, b: 2 };
  const pu2 = { loai: 'pu', ngay: '2026-11-13', gio: '07:00', a: 4, b: 1 };
  assert.deepEqual(T.monTruoc(an, pu1).map(x => x.mon), ['Cá thu', 'Cơm trắng']);
  assert.deepEqual(T.monTruoc(an, pu2).map(x => x.mon), ['Cá thu', 'Kim chi']);
  const gap = T.monHayGap(an, [pu1, pu2, { ...pu2, xoa: 1 }]);
  assert.deepEqual(gap.map(x => [x.mon, x.lan, x.soNgayAn]), [['Cá thu', 2, 2]]);
});

test('phan an: nhan dung, quy ve 1 phan, diem histamine nhan theo phan', () => {
  assert.deepEqual(T.nhanPhan({ kcal: 450, dam: 25, bot: 55, beo: 12.5 }, 1.5), { kcal: 675, dam: 37.5, bot: 82.5, beo: 18.8 });
  const an = { mon: 'Phở bò', kcal: 225, dam: 12.5, bot: 27.5, beo: 6, phan: 0.5 };
  assert.equal(T.coBan(an).kcal, 450);
  assert.equal(T.coBan({ mon: 'cũ', kcal: 300 }).kcal, 300); // dong cu khong co phan
  assert.equal(T.tenPhan(0.5), 'Ít');
  assert.equal(T.tenPhan(0), 'Vừa');
  assert.equal(T.diemNgay([{ bua: 'trua', histamine: '2', phan: 1.5 }, { bua: 'toi', histamine: '1', phan: 0.5 }]).tong, 5);
});
