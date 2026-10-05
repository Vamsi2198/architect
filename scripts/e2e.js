// End-to-end verification of the Architect flow.
// Usage: node scripts/e2e.js [baseUrl]
// Checks: draft -> blueprint has data tables -> scenarios -> test run -> publish -> app is served and well-formed.
const BASE = process.argv[2] || 'http://localhost:3000';

let passed = 0, failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`  PASS  ${name}${detail ? ' — ' + detail : ''}`); }
  else { failed++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
};

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const j = await r.json().catch(() => null);
  return { status: r.status, json: j };
}

(async () => {
  const desc = 'A todo app where users add tasks with due dates, mark them done, and filter tasks by today or this week.';

  console.log(`\n1) DRAFT — POST /api/draft`);
  const draft = await post('/api/draft', { description: desc, framework: 'Bring your own' });
  ok('draft returns 200', draft.status === 200, `HTTP ${draft.status}`);
  const lanes = draft.json && Array.isArray(draft.json.lanes) ? draft.json.lanes : null;
  ok('blueprint has 4 lanes', lanes && lanes.length === 4, lanes ? lanes.map(l => l.id).join(',') : 'no lanes');
  const dataLane = lanes && lanes.find(l => l.id === 'data');
  const tables = dataLane ? dataLane.items.filter(i => /create\s+table/i.test(i.code || '')) : [];
  ok('data lane has CREATE TABLE code', tables.length >= 1, `${tables.length} table(s): ${tables.map(t => t.title).join(', ')}`);
  ok('name derived', !!(draft.json && draft.json.name), draft.json && draft.json.name);

  console.log(`\n2) TABLES — blueprint table SQL parses`);
  let cols = 0;
  tables.forEach(t => { const m = (t.code.match(/\(([^)]*)\)/) || [])[1]; if (m) cols += m.split(',').length; });
  ok('table columns parseable', cols >= 3, `${cols} columns across ${tables.length} table(s)`);

  console.log(`\n3) SCENARIOS — POST /api/scenarios`);
  const sc = await post('/api/scenarios', { blueprint: lanes, framework: 'Bring your own' });
  const scenarios = sc.json && Array.isArray(sc.json.scenarios) ? sc.json.scenarios : [];
  ok('returns 200', sc.status === 200, `HTTP ${sc.status}`);
  ok('5+ scenarios generated', scenarios.length >= 5, `${scenarios.length} scenarios`);
  const todoSpecific = scenarios.filter(s => /task|todo|due|done/i.test(s)).length;
  ok('scenarios are app-specific (mention tasks/todo)', todoSpecific >= 1, `${todoSpecific}/${scenarios.length} mention the domain`);

  console.log(`\n4) TEST — POST /api/test (first scenario)`);
  const t = await post('/api/test', { scenario: scenarios[0], blueprint: lanes, framework: 'Bring your own' });
  ok('returns 200', t.status === 200, `HTTP ${t.status}`);
  ok('status pass|fail', t.json && ['pass', 'fail'].includes(t.json.status), t.json && t.json.status);
  ok('trace present', !!(t.json && Array.isArray(t.json.trace) && t.json.trace.length), `${t.json && t.json.trace ? t.json.trace.length : 0} steps`);

  console.log(`\n5) PUBLISH — POST /api/publish (staging)`);
  const p = await post('/api/publish', { name: draft.json.name || 'todo app', blueprint: lanes, env: 'staging' });
  ok('returns 200', p.status === 200, `HTTP ${p.status}${p.json && p.json.error ? ' — ' + p.json.error : ''}`);
  const appUrl = p.json && p.json.url;
  ok('url returned', !!appUrl, appUrl || 'none');

  console.log(`\n6) DEPLOYED APP — fetch and validate the generated app`);
  if (appUrl) {
    const r = await fetch(BASE + appUrl);
    const html = await r.text();
    ok('app serves HTTP 200', r.status === 200, `HTTP ${r.status}`);
    ok('has doctype + html', /<!doctype html>/i.test(html) && /<\/html>\s*$/i.test(html.trim()), `${(html.length / 1024).toFixed(1)} KB`);
    ok('no mustache placeholders left', !(/\{\{[^}]+\}\}/.test(html) || /TODO:insert/i.test(html)));
    ok('contains real UI markup', /<table|<div|<button/i.test(html));
    const rendered = (html.match(/<tr/gi) || []).length;
    ok('has some static rows', rendered >= 1, `${rendered} <tr> tags (rows may also render from JS)`);
    const mockRows = (html.match(/\{\s*(id|task|title|name)\s*:/gi) || []).length;
    ok('mock data present in JS', mockRows >= 5, `${mockRows} data objects`);
    const hasTable = tables.some(tb => html.toLowerCase().includes((tb.title || '').toLowerCase().split(' ')[0]));
    ok('mentions blueprint table name', hasTable, tables.map(x => x.title).join(','));

    console.log(`\n7) RUNTIME — render the app in headless Chrome`);
    try {
      const { execSync } = require('child_process');
      const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      const dom = execSync(
        `"${chrome}" --headless --disable-gpu --dump-dom "${BASE}${appUrl}" 2>nul`,
        { maxBuffer: 8 * 1024 * 1024, timeout: 30000, shell: true, windowsHide: true }
      ).toString();
      ok('JS ran without blanking the page', dom.length > 2000, `${(dom.length / 1024).toFixed(1)} KB rendered DOM`);
      const liveRows = (dom.match(/<tr/gi) || []).length + (dom.match(/<li/gi) || []).length;
      ok('data rows rendered at runtime', liveRows >= 5, `${liveRows} tr+li elements after JS`);
      ok('interactive controls rendered', (dom.match(/<button/gi) || []).length >= 2);
      ok('no uncaught-error placeholder', !/undefined is not a function|\[object Object\]/.test(dom));
    } catch (e) {
      ok('headless render (skipped if Chrome missing)', false, e.message.slice(0, 80));
    }
  }

  console.log(`\n${failed === 0 ? 'ALL GREEN' : 'FAILURES PRESENT'} — ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error('E2E crashed:', e.message); process.exit(1); });
