// Chay Code.js that tren Sheet gia. Sheet gia bat chuoc cac tro cua Google Sheets:
// tu doi chuoi ngay thanh Date, chuoi so thanh so, "=..." thanh cong thuc, va bao loi khi ghi qua so hang.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

// khoa: gia lap chu da chay capQuyen (null = so chua co khoa).
function dungMoiTruong(khoa = 'a'.repeat(40)) {
  const tabs = {};
  const moiTab = ten => {
    const t = {
      ten, luoi: [], chu: {}, maxHang: 1000,
      getName: () => t.ten,
      setName: n => { delete tabs[t.ten]; t.ten = n; tabs[n] = t; },
      getLastRow: () => t.luoi.length,
      getLastColumn: () => Math.max(0, ...t.luoi.map(d => d.length)),
      getMaxRows: () => t.maxHang,
      setFrozenRows() {},
      insertRowsAfter: (sau, n) => { t.maxHang += n; },
      getRange(h, c, soH = 1, soC = 1) {
        if (h + soH - 1 > t.maxHang) throw new Error('ngoai pham vi');
        return {
          setFontWeight() { return this; },
          setNumberFormat(f) { if (f === '@') for (let i = 0; i < soH; i++) t.chu[`${h + i}:${c}`] = 1; return this; },
          setValues(v) {
            v.forEach((dong, i) => dong.forEach((x, j) => {
              const hang = h + i - 1;
              while (t.luoi.length <= hang) t.luoi.push([]);
              let gt = x;
              if (typeof x === 'string') {
                // Da doi chieu voi Sheet that 02/11/2026: dinh dang chu van bi tinh cong thuc va nuot dau '
                if (x.startsWith("'")) gt = x.slice(1);
                else if (x.startsWith('=')) gt = '#FORMULA';
                else if (!t.chu[`${h + i}:${c + j}`]) {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(x)) gt = new Date(x);
                  else if (/^\d+$/.test(x)) gt = Number(x);
                }
              }
              t.luoi[hang][c + j - 1] = gt;
            }));
            return this;
          },
          getValues() {
            const ra = [];
            for (let i = 0; i < soH; i++) {
              const dong = [];
              for (let j = 0; j < soC; j++) {
                const x = (t.luoi[h + i - 1] || [])[c + j - 1];
                dong.push(x === undefined ? '' : x);
              }
              ra.push(dong);
            }
            return ra;
          },
        };
      },
    };
    tabs[ten] = t;
    return t;
  };
  moiTab('Sheet1');

  const ss = {
    getSheetByName: n => tabs[n] || null,
    getSheets: () => Object.values(tabs),
    insertSheet: moiTab,
    getUrl: () => 'x',
  };
  const prop = khoa ? { KHOA: khoa } : {};
  const ngu = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in prop ? prop[k] : null), setProperty: (k, v) => { prop[k] = v; }, deleteProperty: k => { delete prop[k]; } }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (a, s) => crypto.createHash(a).update(s, 'utf8').digest(),
      base64EncodeWebSafe: b => Buffer.from(b).toString('base64url'),
      getUuid: () => crypto.randomUUID(),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: s => ({ s, setMimeType() { return this; } }),
    },
    Logger: { log() {} },
    console,
  };
  vm.createContext(ngu);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script/Code.js'), 'utf8'), ngu);
  const goi = o => JSON.parse(ngu.doPost({ postData: { contents: JSON.stringify(o) } }).s);
  return { goi, tabs, prop, ngu };
}

module.exports = { dungMoiTruong };
