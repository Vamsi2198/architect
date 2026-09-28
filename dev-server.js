// Local dev server: serves the static files and runs /api/* exactly like
// Vercel does, loading variables from .env. Not used in production.
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env (no dependency — simple KEY=VALUE parser)
for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const config = require('./api/config.js');
const draft = require('./api/draft.js');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };

function shim(res) {
  res.status = c => { res.statusCode = c; return res; };
  res.json = obj => {
    const body = JSON.stringify(obj);
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
    res.end(body);
    return res;
  };
  return res;
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/config' && req.method === 'GET') return config(req, shim(res));
  if (url === '/api/draft' && req.method === 'POST') {
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', () => { try { req.body = JSON.parse(raw || '{}'); } catch { req.body = {}; } draft(req, shim(res)); });
    return;
  }
  const file = path.join(__dirname, url === '/' ? 'index.html' : url);
  if (!file.startsWith(__dirname) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404; return res.end('Not found');
  }
  res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(3000, () => console.log('Architect dev server: http://localhost:3000'));
