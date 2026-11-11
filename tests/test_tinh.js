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

test('danh gia huyet ap, duong huyet, SpO2, nhiet do', () => {
  assert.equal(T.danhGia('huyetap', 115, 75).chu, 'Bình thường');
  assert.equal(T.danhGia('huyetap', 125, 75).chu, 'Hơi cao');
  assert.equal(T.danhGia('huyetap', 125, 85).chu, 'Cao độ 1');
  assert.equal(T.danhGia('huyetap', 145, 85).muc, 2);
  assert.equal(T.danhGia('huyetap', 185, 100).chu, 'Rất cao, nên đi khám ngay');
  assert.equal(T.danhGia('huyetap', 85, 55).chu, 'Thấp');
  assert.equal(T.danhGia('huyetap', 120, 0), null);
  assert.equal(T.danhGia('duong', 6.1).chu, 'Tiền tiểu đường');
  assert.equal(T.danhGia('spo2', 93).muc, 1);
  assert.equal(T.danhGia('nhiet', 38.9).chu, 'Sốt cao');
  assert.equal(T.danhGia('can', 60), null);
});

test('calo can: tu tinh khi du thong tin, uu tien so tu dat', () => {
  const hs = { sinh: '1996-01-01', gioi: 'nu', cao: 160, vanDong: 1.375 };
  // 10*55 + 6.25*160 - 5*30 - 161 = 1239 -> x1.375 = 1703.6 -> 1700
  assert.equal(T.kcalCan(hs, 55, '2026-11-11'), 1700);
  assert.equal(T.kcalCan({ ...hs, mucKcal: 1500 }, 55, '2026-11-11'), 1500);
  assert.equal(T.kcalCan({ ...hs, gioi: '' }, 55, '2026-11-11'), 0);
  assert.equal(T.kcalCan(hs, 0, '2026-11-11'), 0);
  assert.equal(T.nuocCan({}, 60), 2100);
  assert.equal(T.nuocCan({ mucNuoc: 2500 }, 60), 2500);
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

test('chi so: moi nhat theo ngay gio, nuoc cong don ca ngay', () => {
  const ds = [
    { id: '1', ngay: '2026-11-10', gio: '07:00', loai: 'can', a: 60, sua: 5, xoa: 0 },
    { id: '2', ngay: '2026-11-11', gio: '06:00', loai: 'can', a: 59.5, sua: 1, xoa: 0 },
    { id: '3', ngay: '2026-11-11', gio: '08:00', loai: 'nuoc', a: 250, sua: 1, xoa: 0 },
    { id: '4', ngay: '2026-11-11', gio: '10:00', loai: 'nuoc', a: 500, sua: 1, xoa: 0 },
    { id: '5', ngay: '2026-11-11', gio: '11:00', loai: 'nuoc', a: 500, sua: 1, xoa: 1 },
  ];
  assert.equal(T.moiNhat(ds, 'can').a, 59.5);
  assert.equal(T.congNgay2(ds, 'nuoc', '2026-11-11'), 750);
  assert.equal(T.moiNhat(ds, 'duong'), null);
});

test('gop: ban sua sau thang, moc luon tang', () => {
  const kho = { a: { id: 'a', sua: 10 } };
  T.gop(kho, { id: 'a', sua: 5, x: 1 });
  assert.equal(kho.a.x, undefined);
  T.gop(kho, { id: 'a', sua: 11, x: 2 });
  assert.equal(kho.a.x, 2);
  assert.equal(T.moc({ sua: 100 }, 50), 101);
});
