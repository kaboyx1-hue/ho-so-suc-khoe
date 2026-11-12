// Kho bien the mon an: NGUYEN LIEU x CACH NAU, sinh ra ten mon + calo + muc histamine + co da mun.
// Muc dich: go "thit heo" thi app bay ra du cach che bien (luoc, kho, chien, nuong...) de chon.
//
// So lieu dinh duong: uoc tinh tren 100g nguyen lieu DA NAU CHIN (khong tinh dau/duong them), theo
// cac bang thanh phan thuc pham pho bien (USDA FoodData Central, Bang thanh phan thuc pham Viet Nam);
// CHUA doi chieu tung so voi Vien Dinh Duong. Cach nau cong them dau/duong/bot cho 1 phan an.
// Muc histamine nguyen lieu theo cung cach da dung trong mon-an.js:
//   thit heo 1 (nguon truc tiep: "Thịt heo luộc" = 1), bo/ga 0, vit 1, trung 1, ca trang 1,
//   ca thu/ngu/nuc/com/trich 2 (nhom scombroid), tom/muc/cua/ngheu/oc 1, noi tang 1, dau phu 0, nam 1,
//   rau 0 (tru ca tim, cai bo xoi = 1). Cach nau: KHO (nuoc mam, nau lau) = 2 nhu "Thịt kho tàu",
//   "Cá kho tộ", "Bò kho"; rim, rang, sot ca chua = it nhat 1. Tat ca la SUY LUAN, khong phai so do.
// Them nguyen lieu hoac cach nau: chi can them 1 dong vao NL hoac CACH ben duoi.
(function (goc) {
  // [ten, nhom, gam 1 phan, kcal, dam, bot, beo /100g, histamine, nhomBeo, cac cach nau]
  const THIT = ['luộc', 'hấp', 'nướng', 'chiên', 'chiên giòn', 'xào', 'kho', 'rim', 'áp chảo'];
  const CA = ['chiên', 'chiên giòn', 'kho', 'hấp', 'nướng', 'sốt cà chua', 'áp chảo'];
  const HAI_SAN = ['hấp', 'luộc', 'nướng', 'xào', 'chiên giòn', 'rang'];
  const RAU = ['luộc', 'xào', 'hấp', 'canh'];
  const CU = ['luộc', 'hấp', 'chiên', 'nướng'];
  const NL = [
    ['Thịt heo nạc', 'thit', 100, 190, 28, 0, 8.5, 1, 'trung-tinh', THIT],
    ['Thịt heo ba chỉ', 'thit', 100, 450, 14, 0, 44, 1, 'trung-tinh', ['luộc', 'nướng', 'chiên', 'kho', 'rim', 'quay']],
    ['Sườn heo', 'thit', 150, 280, 22, 0, 21, 1, 'trung-tinh', ['nướng', 'chiên', 'rim', 'kho', 'ram mặn', 'hấp']],
    ['Giò heo (chân giò)', 'thit', 150, 230, 20, 0, 16, 1, 'trung-tinh', ['luộc', 'kho', 'hầm', 'chiên giòn']],
    ['Thịt heo xay', 'thit', 100, 260, 22, 0, 19, 1, 'trung-tinh', ['xào', 'rim', 'hấp', 'chiên']],
    ['Gan heo', 'thit', 100, 165, 26, 4, 4.4, 1, 'trung-tinh', ['xào', 'luộc', 'chiên']],
    ['Thịt bò thăn', 'thit', 100, 220, 30, 0, 10, 0, 'trung-tinh', ['xào', 'nướng', 'áp chảo', 'luộc', 'hấp']],
    ['Bắp bò', 'thit', 100, 200, 30, 0, 8, 0, 'trung-tinh', ['luộc', 'hầm', 'kho', 'xào']],
    ['Thịt bò xay', 'thit', 100, 250, 26, 0, 15, 0, 'trung-tinh', ['xào', 'nướng', 'áp chảo']],
    ['Đùi gà', 'thit', 150, 230, 24, 0, 15, 0, 'trung-tinh', ['luộc', 'hấp', 'nướng', 'chiên', 'chiên giòn', 'kho', 'rim', 'quay']],
    ['Ức gà', 'thit', 150, 165, 31, 0, 3.6, 0, 'trung-tinh', ['luộc', 'hấp', 'nướng', 'chiên', 'chiên giòn', 'xào', 'áp chảo']],
    ['Cánh gà', 'thit', 150, 290, 27, 0, 19, 0, 'trung-tinh', ['nướng', 'chiên', 'chiên giòn', 'rim', 'luộc']],
    ['Chân gà', 'thit', 100, 215, 19, 0.2, 15, 0, 'trung-tinh', ['luộc', 'hấp', 'nướng', 'chiên']],
    ['Thịt vịt', 'thit', 150, 330, 19, 0, 28, 1, 'trung-tinh', ['luộc', 'nướng', 'quay', 'kho', 'xào']],
    ['Trứng gà', 'trung', 100, 155, 13, 1.1, 11, 1, 'trung-tinh', ['luộc', 'chiên', 'ốp la', 'hấp', 'kho', 'xào']],
    ['Trứng vịt', 'trung', 140, 185, 13, 1.5, 14, 1, 'trung-tinh', ['luộc', 'chiên', 'kho']],
    ['Trứng cút', 'trung', 50, 158, 13, 0.4, 11, 1, 'trung-tinh', ['luộc', 'kho', 'chiên']],
    ['Cá lóc', 'ca', 150, 120, 23, 0, 3, 1, 'trung-tinh', [...CA, 'canh chua']],
    ['Cá rô phi', 'ca', 150, 128, 26, 0, 2.7, 1, 'trung-tinh', CA],
    ['Cá basa', 'ca', 150, 130, 18, 0, 6, 1, 'trung-tinh', [...CA, 'canh chua']],
    ['Cá diêu hồng', 'ca', 150, 128, 26, 0, 2.7, 1, 'trung-tinh', [...CA, 'canh chua']],
    ['Cá thu', 'ca', 150, 260, 24, 0, 18, 2, 'omega3', CA],
    ['Cá ngừ', 'ca', 150, 184, 30, 0, 6, 2, 'omega3', CA],
    ['Cá nục', 'ca', 150, 170, 22, 0, 9, 2, 'omega3', CA],
    ['Cá cơm', 'ca', 100, 131, 20, 0, 5, 2, 'omega3', ['chiên', 'chiên giòn', 'kho', 'rim']],
    ['Cá hồi', 'ca', 150, 206, 22, 0, 12, 1, 'omega3', ['áp chảo', 'nướng', 'hấp', 'sốt cà chua', 'chiên']],
    ['Tôm', 'haisan', 150, 99, 24, 0.2, 0.3, 1, 'trung-tinh', HAI_SAN],
    ['Mực', 'haisan', 150, 110, 18, 3, 2, 1, 'trung-tinh', HAI_SAN],
    ['Cua', 'haisan', 150, 97, 19, 0, 1.5, 1, 'trung-tinh', ['hấp', 'luộc', 'rang', 'canh']],
    ['Ghẹ', 'haisan', 150, 97, 19, 0, 1.5, 1, 'trung-tinh', ['hấp', 'luộc', 'rang']],
    ['Nghêu', 'haisan', 150, 148, 26, 5, 2, 1, 'trung-tinh', ['hấp', 'xào', 'canh']],
    ['Sò điệp', 'haisan', 150, 111, 21, 5, 0.8, 1, 'trung-tinh', ['hấp', 'nướng', 'xào']],
    ['Ốc', 'haisan', 150, 90, 16, 2, 1.4, 1, 'trung-tinh', ['hấp', 'luộc', 'xào']],
    ['Đậu phụ', 'dau', 150, 76, 8, 1.9, 4.8, 0, 'omega6', ['chiên', 'sốt cà chua', 'hấp', 'luộc', 'kho']],
    ['Nấm', 'rau', 150, 30, 3, 4, 0.4, 1, 'trung-tinh', ['xào', 'luộc', 'hấp', 'canh', 'nướng']],
    ['Rau muống', 'rau', 150, 20, 2.6, 3, 0.2, 0, 'trung-tinh', RAU],
    ['Cải ngọt', 'rau', 150, 13, 1.5, 2, 0.2, 0, 'trung-tinh', RAU],
    ['Cải thìa', 'rau', 150, 13, 1.5, 2.2, 0.2, 0, 'trung-tinh', RAU],
    ['Bắp cải', 'rau', 150, 25, 1.3, 6, 0.1, 0, 'trung-tinh', RAU],
    ['Bông cải xanh', 'rau', 150, 35, 2.4, 7, 0.4, 0, 'trung-tinh', ['luộc', 'xào', 'hấp']],
    ['Súp lơ trắng', 'rau', 150, 23, 1.8, 4, 0.5, 0, 'trung-tinh', ['luộc', 'xào', 'hấp']],
    ['Mồng tơi', 'rau', 150, 19, 1.8, 3.4, 0.3, 0, 'trung-tinh', ['canh', 'luộc', 'xào']],
    ['Rau dền', 'rau', 150, 23, 2.5, 4, 0.3, 0, 'trung-tinh', ['canh', 'luộc', 'xào']],
    ['Bí xanh', 'rau', 150, 13, 0.4, 3, 0.2, 0, 'trung-tinh', ['canh', 'luộc', 'xào']],
    ['Bí đỏ', 'cu', 150, 26, 1, 6.5, 0.1, 0, 'trung-tinh', ['canh', 'luộc', 'hấp', 'xào']],
    ['Su su', 'rau', 150, 19, 0.8, 4.5, 0.1, 0, 'trung-tinh', ['luộc', 'xào', 'canh']],
    ['Đậu cô ve', 'rau', 150, 31, 1.8, 7, 0.2, 0, 'trung-tinh', ['luộc', 'xào', 'hấp']],
    ['Mướp', 'rau', 150, 20, 1.2, 4.4, 0.2, 0, 'trung-tinh', ['canh', 'xào']],
    ['Cà tím', 'rau', 150, 25, 1, 6, 0.2, 1, 'trung-tinh', ['nướng', 'xào', 'hấp']],
    ['Đậu bắp', 'rau', 150, 33, 1.9, 7, 0.2, 0, 'trung-tinh', ['luộc', 'hấp', 'xào']],
    ['Giá đỗ', 'rau', 100, 30, 3, 6, 0.2, 0, 'trung-tinh', ['xào', 'luộc']],
    ['Cải bó xôi', 'rau', 150, 23, 2.9, 3.6, 0.4, 1, 'trung-tinh', ['luộc', 'xào', 'canh']],
    ['Cà rốt', 'cu', 100, 41, 0.9, 10, 0.2, 0, 'trung-tinh', ['luộc', 'xào', 'hấp']],
    ['Khoai tây', 'cu', 150, 87, 1.9, 20, 0.1, 0, 'trung-tinh', [...CU, 'xào']],
    ['Khoai lang', 'cu', 150, 86, 1.6, 20, 0.1, 0, 'trung-tinh', CU],
    ['Khoai môn', 'cu', 150, 112, 1.5, 26, 0.2, 0, 'trung-tinh', ['luộc', 'hấp', 'canh']],
    ['Bắp (ngô)', 'cu', 150, 96, 3.4, 21, 1.5, 0, 'trung-tinh', ['luộc', 'nướng', 'xào']],
  ];

  // Cach nau: cong them cho 1 PHAN (khong phai /100g). his = muc histamine toi thieu sau khi nau.
  // dh = tai duong huyet toi thieu, ld = loai duong, o6 = them dau thuc vat (omega-6).
  const CACH = {
    'luộc': {}, 'hấp': {}, 'hầm': {},
    'nướng': { bot: 4, dh: 1, ld: 'duong-tinh-luyen-them' }, // uop duong/mat ong
    'chiên': { beo: 10, o6: 1 },
    'chiên giòn': { bot: 15, beo: 15, o6: 1, dh: 1, ld: 'tinh-bot-tinh-che' },
    'xào': { beo: 7, o6: 1 },
    'áp chảo': { beo: 5, o6: 1 },
    'ốp la': { beo: 5, o6: 1 },
    'quay': { beo: 5, bot: 2 },
    'kho': { bot: 6, his: 2, dh: 1, ld: 'duong-tinh-luyen-them' }, // nuoc mam + nuoc mau, nau lau
    'rim': { bot: 8, beo: 3, his: 1, dh: 1, ld: 'duong-tinh-luyen-them' },
    'ram mặn': { bot: 8, beo: 5, his: 1, dh: 1, ld: 'duong-tinh-luyen-them' },
    'rang': { bot: 3, beo: 5, his: 1 },
    'sốt cà chua': { bot: 6, beo: 5, his: 1, o6: 1, dh: 1, ld: 'duong-tu-nhien-co-xo' }, // ca chua: nguon bat dong, giu muc 1
    'canh': { canh: 1 },
    'canh chua': { canh: 1, bot: 6, his: 1, dh: 1, ld: 'duong-tu-nhien-co-xo' },
  };
  const tenMon = (ten, cach) => {
    if (cach === 'canh') return `Canh ${ten.toLowerCase()}`;
    if (cach === 'canh chua') return `Canh chua ${ten.toLowerCase()}`;
    return `${ten} ${cach}`;
  };
  const lam1 = v => Math.round(v * 10) / 10;

  const MON = [];
  for (const [ten, nhom, gam, kcal, dam, bot, beo, his, nhomBeo, cachs] of NL) {
    for (const cach of cachs) {
      const c = CACH[cach];
      if (!c) throw new Error('Thieu cach nau: ' + cach);
      // Canh: 1 to, cai trong to bang ~2/3 phan an thuong (con lai la nuoc)
      const g = c.canh ? Math.round(gam * 2 / 3) : gam;
      const d = lam1(dam * g / 100), b = lam1(bot * g / 100 + (c.bot || 0)), e = lam1(beo * g / 100 + (c.beo || 0));
      const luong = c.canh ? '1 tô' : nhom === 'trung' ? (ten === 'Trứng gà' ? '2 quả' : ten === 'Trứng vịt' ? '2 quả' : '5 quả') : `${gam}g`;
      const dh = Math.max(nhom === 'cu' ? 1 : 0, c.dh || 0);
      MON.push({
        mon: tenMon(ten, cach), luong,
        kcal: Math.round(kcal * g / 100 + (c.bot || 0) * 4 + (c.beo || 0) * 9),
        dam: d, bot: b, beo: e,
        histamine: Math.max(his, c.his || 0),
        lyDo: `${ten} mức ${his}${c.his && c.his > his ? `, cách ${cach} nâng lên ${c.his}` : ''} (suy luận theo nguyên liệu và cách nấu)`,
        nguon: 'suy-luan', bienThe: 1,
        duongHuyet: dh, sua: 0,
        nhomBeo: nhomBeo === 'omega3' || nhomBeo === 'omega6' ? nhomBeo : c.o6 ? 'omega6' : 'trung-tinh',
        loaiDuong: c.ld || (nhom === 'cu' ? 'duong-tu-nhien-co-xo' : 'khong-dang-ke'),
      });
    }
  }

  if (typeof module !== 'undefined') module.exports = MON;
  else goc.MON_BIEN_THE = MON;
})(this);
