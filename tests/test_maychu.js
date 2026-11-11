// Chay Code.js that tren Sheet gia. Sheet gia bat chuoc cac tro cua Google Sheets:
// tu doi chuoi ngay thanh Date, chuoi so thanh so, "=..." thanh cong thuc, va bao loi khi ghi qua so hang.
const test = require('node:test');
const assert = require('node:assert/strict');
const { dungMoiTruong } = require('./gia_lap.js');

const K = 'a'.repeat(40);
const gd = (id, sua, kcal = 300, them = {}) => ({ b: 'an', r: { id, ngay: '2026-11-01', gio: '07:30', bua: 'sang', mon: 'Phở bò', luong: '1 tô', kcal, ghi: '', sua, xoa: 0, ...them } });

test('khoa: link dau tien mo so, khoa khac bi chan', () => {
  const { goi } = dungMoiTruong();
  assert.equal(goi({ k: 'ngan', thay: [] }).ok, false);
  assert.equal(goi({ thay: [] }).ok, false);
  assert.equal(goi({ k: K, thay: [] }).ok, true);
  const la = goi({ k: 'b'.repeat(40), thay: [gd('x', 1)] });
  assert.equal(la.ok, false);
  assert.equal(la.loi, 'khoa');
  assert.equal(goi({ k: K, tu: 0, thay: [gd('y', 1)] }).ds.length, 1); // x khong duoc ghi
});

test('hai may: may A ghi, may B keo ve dung', () => {
  const { goi } = dungMoiTruong();
  const a = goi({ k: K, tu: 0, thay: [gd('1', 10, 450, { ghi: 'phở' })] });
  assert.equal(a.ok, true);
  const b = goi({ k: K, tu: 0, thay: [] });
  assert.equal(b.ds.length, 1);
  assert.equal(b.ds[0].r.kcal, 450);
  assert.equal(b.ds[0].r.ghi, 'phở');
  assert.equal(b.tu, a.tu);
  assert.equal(goi({ k: K, tu: b.tu, thay: [] }).ds.length, 0); // khong co gi moi
});

test('Sheets khong lam hong ngay, ghi chu toan so, ghi chu bat dau bang dau =', () => {
  const { goi } = dungMoiTruong();
  goi({ k: K, tu: 0, thay: [gd('1', 1, 1000, { ghi: '=1+1' }), gd('2', 1, 1000, { ghi: '0123' }), gd('3', 1, 1000, { ghi: "'nhay" }), { b: 'hs', r: { id: 'toi', ten: 'A', sinh: '1990-05-01', nhomMau: 'O+', cao: 0, sua: 1, xoa: 0 } }] });
  const ds = goi({ k: K, tu: 0, thay: [] }).ds;
  const r = id => ds.find(m => m.r.id === id).r;
  assert.equal(r('1').ngay, '2026-11-01');
  assert.equal(r('1').ghi, '=1+1');
  assert.equal(r('2').ghi, '0123');
  assert.equal(r('3').ghi, "'nhay");
  assert.equal(r('toi').sinh, '1990-05-01');
  assert.equal(r('toi').cao, 0);
  assert.equal(r('1').gio, '07:30');
});

test('sua moi hon de len, ban cu hon khong de duoc', () => {
  const { goi } = dungMoiTruong();
  goi({ k: K, tu: 0, thay: [gd('1', 10, 1000)] });
  goi({ k: K, tu: 0, thay: [gd('1', 20, 2000)] });
  goi({ k: K, tu: 0, thay: [gd('1', 15, 3000)] });
  const ds = goi({ k: K, tu: 0, thay: [] }).ds;
  assert.equal(ds.length, 1);
  assert.equal(ds[0].r.kcal, 2000);
});

test('xoa khoan lan sang may khac', () => {
  const { goi } = dungMoiTruong();
  const dau = goi({ k: K, tu: 0, thay: [gd('1', 1)] });
  goi({ k: K, tu: 0, thay: [gd('1', 2, 1000, { xoa: 1 })] });
  const sau = goi({ k: K, tu: dau.tu, thay: [] });
  assert.equal(sau.ds[0].r.xoa, 1);
});

test('du lieu sai bi tu choi, du lieu dung cung goi van vao', () => {
  const { goi } = dungMoiTruong();
  const xau = [
    gd('a1', 1, '300'), gd('a2', 1, NaN), gd('a3', 1, 1e12), gd('a4', 1, 300, { ngay: '2026-02-30' }),
    gd('a5', 1, 300, { gio: '25:00' }), gd('a6', 1, 300, { ghi: 'x'.repeat(2001) }), gd('a b', 1), gd('a8', 0), gd('a10', 1, 300, { mon: 5 }),
    { b: 'hs', r: { id: 'a11', sinh: '1990-13-01', sua: 1, xoa: 0 } },
    { b: 'lạ', r: { id: 'a9', sua: 1, xoa: 0 } },
  ];
  const kq = goi({ k: K, tu: 0, thay: [...xau, gd('tot', 1)] });
  assert.equal(kq.ok, true);
  assert.equal(kq.boQua.length, xau.length);
  assert.deepEqual(kq.ds.map(m => m.r.id), ['tot']);
});

test('chi so huyet ap va lan kham luu du', () => {
  const { goi } = dungMoiTruong();
  const kq = goi({ k: K, tu: 0, thay: [
    { b: 'cs', r: { id: 'c1', ngay: '2026-11-02', gio: '06:15', loai: 'huyetap', a: 128, b: 84, c: 72, ghi: '', sua: 1, xoa: 0 } },
    { b: 'ks', r: { id: 'k1', ngay: '2026-10-20', loai: 'tiem', noi: 'VNVC', ten: 'Cúm mùa', ketQua: '', ghi: '', sua: 1, xoa: 0 } },
  ] });
  assert.equal(kq.boQua.length, 0);
  const c = kq.ds.find(m => m.b === 'cs').r;
  assert.deepEqual([c.a, c.b, c.c, c.gio], [128, 84, 72, '06:15']);
  assert.equal(kq.ds.find(m => m.b === 'ks').r.ten, 'Cúm mùa');
});

test('qua 1000 hang van ghi duoc, chu van giu dinh dang', () => {
  const { goi, tabs } = dungMoiTruong();
  let tu = 0;
  for (let lo = 0; lo < 5; lo++) {
    const thay = [];
    for (let i = 0; i < 250; i++) thay.push(gd(`g${lo}-${i}`, 1));
    const kq = goi({ k: K, tu, thay });
    assert.equal(kq.ok, true, kq.loi);
    tu = kq.tu;
  }
  assert.equal(tabs.AN_UONG.luoi.length, 1251);
  const ds = goi({ k: K, tu: 0, thay: [] }).ds;
  assert.equal(ds.length, 1250);
  assert.ok(ds.every(m => m.r.ngay === '2026-11-01'));
});

test('dat mat ma: chi dat duoc 1 lan, sai dinh dang bi tu choi, khong luu mat ma tho', () => {
  const { goi, prop } = dungMoiTruong();
  assert.equal(goi({ k: K, hoiPin: 1 }).coPin, false);
  for (const xau of ['12345', '1234567', 'abcdef', 123456]) assert.equal(goi({ k: K, datPin: xau }).ok, false);
  const kq = goi({ k: K, datPin: '482915' });
  assert.ok(kq.ok && kq.the);
  assert.equal(goi({ k: K, hoiPin: 1 }).coPin, true);
  assert.equal(goi({ k: K, datPin: '111111' }).ok, false);
  assert.ok(!JSON.stringify(prop).includes('482915'));
});

test('co mat ma: link dung ma khong co the thi khong doc ghi duoc gi', () => {
  const { goi } = dungMoiTruong();
  goi({ k: K, tu: 0, thay: [gd('1', 1)] });
  const { the } = goi({ k: K, datPin: '482915' });
  for (const t of [undefined, '', 'gia']) {
    const kq = goi({ k: K, the: t, tu: 0, thay: [gd('2', 1)] });
    assert.equal(kq.loi, 'pin');
    assert.equal(kq.ds, undefined);
  }
  const dung = goi({ k: K, the, tu: 0, thay: [] });
  assert.deepEqual(dung.ds.map(m => m.r.id), ['1']);
});

test('nhap dung mat ma tren may moi thi duoc cap the; sai 5 lan bi khoa ca khi dung', () => {
  const { goi } = dungMoiTruong();
  const { the } = goi({ k: K, datPin: '482915' });
  assert.equal(goi({ k: K, pin: '482915' }).the, the);
  for (let i = 1; i <= 4; i++) {
    const kq = goi({ k: K, pin: '000000' });
    assert.equal(kq.loi, 'saiPin');
    assert.equal(kq.conLai, 5 - i);
  }
  const lan5 = goi({ k: K, pin: '000000' });
  assert.equal(lan5.loi, 'khoaPin');
  assert.equal(lan5.doi, 900000);
  assert.equal(goi({ k: K, pin: '482915' }).loi, 'khoaPin');
  assert.equal(goi({ k: K, the, tu: 0, thay: [] }).ok, true); // may da mo khoa van dong bo binh thuong
});

test('het thoi gian khoa thu lai duoc, lan khoa sau gap doi', () => {
  const { goi, prop } = dungMoiTruong();
  goi({ k: K, datPin: '482915' });
  for (let i = 0; i < 5; i++) goi({ k: K, pin: '000000' });
  prop.PIN_DOI = '1';
  for (let i = 0; i < 4; i++) assert.equal(goi({ k: K, pin: '000000' }).loi, 'saiPin');
  assert.equal(goi({ k: K, pin: '000000' }).doi, 1800000);
  prop.PIN_DOI = '1';
  assert.equal(goi({ k: K, pin: '482915' }).ok, true);
  assert.equal(goi({ k: K, pin: '000000' }).conLai, 4); // dung roi thi dem lai tu dau
});

test('doi mat ma: can the va mat ma cu, the cu het hieu luc, may khac phai nhap lai', () => {
  const { goi } = dungMoiTruong();
  const { the } = goi({ k: K, datPin: '482915' });
  assert.equal(goi({ k: K, pinCu: '482915', pinMoi: '731904' }).loi, 'pin');
  assert.equal(goi({ k: K, the, pinCu: '000000', pinMoi: '731904' }).loi, 'saiPin');
  assert.equal(goi({ k: K, the, pinCu: '482915', pinMoi: '12' }).ok, false);
  const moi = goi({ k: K, the, pinCu: '482915', pinMoi: '731904' });
  assert.ok(moi.ok && moi.the !== the);
  assert.equal(goi({ k: K, the, tu: 0, thay: [] }).loi, 'pin');
  assert.equal(goi({ k: K, pin: '482915' }).loi, 'saiPin');
  assert.equal(goi({ k: K, pin: '731904' }).the, moi.the);
});

test('xoaPin: quen mat ma thi so van con, dat duoc mat ma moi', () => {
  const { goi, ngu } = dungMoiTruong();
  goi({ k: K, tu: 0, thay: [gd('1', 1)] });
  goi({ k: K, datPin: '482915' });
  ngu.xoaPin();
  assert.equal(goi({ k: K, hoiPin: 1 }).coPin, false);
  const { the } = goi({ k: K, datPin: '731904' });
  assert.equal(goi({ k: K, the, tu: 0, thay: [] }).ds.length, 1);
});

test('khoa link sai van bi chan truoc moi viec lien quan mat ma', () => {
  const { goi } = dungMoiTruong();
  goi({ k: K, datPin: '482915' });
  const la = 'b'.repeat(40);
  for (const o of [{ hoiPin: 1 }, { pin: '482915' }, { datPin: '111111' }]) assert.equal(goi({ k: la, ...o }).loi, 'khoa');
});

test('tu dung 4 trang, dung lai trang mac dinh, goi qua lon bi tu choi', () => {
  const { goi, tabs } = dungMoiTruong();
  goi({ k: K, tu: 0, thay: [gd('1', 1)] });
  assert.deepEqual(Object.keys(tabs).sort(), ['AN_UONG', 'CHI_SO', 'HO_SO', 'KHAM_BENH']);
  const nhieu = Array.from({ length: 501 }, (_, i) => gd('n' + i, 1));
  assert.equal(goi({ k: K, tu: 0, thay: nhieu }).ok, false);
});
