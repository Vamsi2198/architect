// Web server for Architect: serves the static files and runs the /api/*
// handlers. Works locally (reads .env) and on Render (env vars from dashboard,
// PORT provided by the platform). Also works on Vercel as a single function.
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env locally, if present (Render injects env vars instead)
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) { /* no .env — rely on environment */ }

const config = require('./api/config.js');
const draft = require('./api/draft.js');
const test = require('./api/test.js');
const fix = require('./api/fix.js');
const importer = require('./api/import.js');
const publish = require('./api/publish.js');
const scenarios = require('./api/scenarios.js');
const chat = require('./api/chat.js');
const mcp = require('./api/mcp.js');

const POST_ROUTES = {
  '/api/draft': draft,
  '/api/test': test,
  '/api/fix': fix,
  '/api/import': importer,
  '/api/publish': publish,
  '/api/scenarios': scenarios,
  '/api/chat': chat,
  '/api/mcp': mcp
};

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.md': 'text/markdown' };
const APPS_DIR = path.join(__dirname, 'apps');
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};

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

const server = http.createServer((req, res) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  const url = req.url.split('?')[0];
  if (url === '/api/config' && req.method === 'GET') return config(req, shim(res));
  if (POST_ROUTES[url] && req.method === 'POST') {
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', () => {
      try { req.body = JSON.parse(raw || '{}'); } catch { req.body = {}; }
      POST_ROUTES[url](req, shim(res));
    });
    return;
  }
  // Generated apps, served at /app/<slug>/
  if (url.startsWith('/app/')) {
    const rel = url.replace(/^\/app\//, '').replace(/\.\./g, '');
    const file = path.join(APPS_DIR, rel === '' || rel.endsWith('/') ? path.join(rel, 'index.html') : rel);
    if (file.startsWith(APPS_DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
      return fs.createReadStream(file).pipe(res);
    }
    res.statusCode = 404;
    return res.end('App not found');
  }
  const file = path.join(__dirname, url === '/' ? 'index.html' : url);
  if (!file.startsWith(__dirname) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404; return res.end('Not found');
  }
  res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Architect: http://localhost:${port}`));
