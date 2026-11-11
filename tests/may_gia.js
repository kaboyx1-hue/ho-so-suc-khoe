// May chu thu tren may: chay Code.js that voi Sheet gia, phuc vu luon app.
// Chay: node tests/may_gia.js  roi mo http://localhost:8881 ; app goi /exec thay cho Google.
// Xem Sheet gia: GET /sheet
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { dungMoiTruong } = require('./gia_lap.js');

const { goi, tabs } = dungMoiTruong();
const GOC = path.join(__dirname, '..');
const KIEU = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/exec' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(goi(JSON.parse(body))));
    });
    return;
  }
  if (url.pathname === '/sheet') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Object.fromEntries(Object.values(tabs).map(t => [t.ten, t.luoi]))));
    return;
  }
  const tep = path.join(GOC, url.pathname === '/' ? 'index.html' : path.normalize(url.pathname));
  if (!tep.startsWith(GOC) || !fs.existsSync(tep) || fs.statSync(tep).isDirectory()) { res.writeHead(404); res.end(); return; }
  let noi = fs.readFileSync(tep);
  // Cho app goi /exec cung may: noi them 'self' vao CSP
  if (tep.endsWith('index.html')) noi = noi.toString().replace('connect-src ', "connect-src 'self' ");
  res.writeHead(200, { 'Content-Type': KIEU[path.extname(tep)] || 'application/octet-stream' });
  res.end(noi);
}).listen(8881, () => console.log('http://localhost:8881'));
