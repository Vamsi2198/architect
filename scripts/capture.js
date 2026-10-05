// Walks the Architect app in headless Chrome and captures screenshots of every step.
// Usage: node scripts/capture.js   (server must be running on :3000)
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const DESC = 'A todo app where users add tasks with due dates, mark them done, and filter tasks by today or this week.';

fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitFor(fn, timeout, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { if (await fn()) return true; } catch (e) {}
    await sleep(500);
  }
  console.log('TIMEOUT waiting for:', label);
  return false;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--window-size=1460,950', '--force-device-scale-factor=1', '--lang=en-US']
  });
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text().slice(0, 200)); });
  page.on('pageerror', e => console.log('PAGE EXCEPTION:', String(e).slice(0, 200)));
  await page.setViewport({ width: 1440, height: 900 });
  const shot = async name => { await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('shot:', name); };

  // 1. Home (click through tour → role → client first)
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await shot('00-tour');
  const roleBtn = await page.$('[data-a="startRole"][data-v="define"]') || await page.$('[data-a="startRole"]');
  if (roleBtn) { await roleBtn.click(); await sleep(900); }
  await page.waitForSelector('#prompt', { timeout: 10000 });
  await sleep(500);
  await shot('01-home');

  // 2. Type description
  await page.click('#prompt');
  await page.type('#prompt', DESC, { delay: 5 });
  await sleep(300);
  await shot('02-description');

  // 3. Draft
  await page.click('[data-a="draft"]');
  await waitFor(() => page.$('[data-a="stage"]'), 60000, 'stages nav');
  await shot('03-blueprint-drafting');
  // wait until drafting finishes (overlay text disappears)
  await waitFor(() => page.evaluate(() => !/Drafting the blueprint/.test(document.body.innerText)), 150000, 'draft complete');
  await sleep(1500);
  await shot('04-blueprint-done');

  // 4. Chat
  await page.evaluate(() => act('go','chat'));
  await sleep(500);
  await page.click('#chatIn');
  await page.type('#chatIn', 'Review my blueprint in one short paragraph.', { delay: 5 });
  await page.click('[data-a="chatSend"]');
  await waitFor(() => page.$('.msg.a'), 180000, 'chat reply');
  await sleep(1500);
  await shot('05-chat');

  // 5. Agents
  await page.evaluate(() => act('go','agents'));
  await sleep(800);
  await shot('06-agents');

  // 6. Preview + comment
  await page.evaluate(() => act('openStage','preview'));
  await sleep(800);
  await shot('07-preview');
  await page.click('[data-a="cmode"]');
  await sleep(400);
  const row = await page.$('[data-a="pin"][data-v]');
  if (row) { await row.click(); await sleep(400); }
  const cin = await page.$('#cin');
  if (cin) {
    await cin.type('Can we show the due date more prominently?', { delay: 5 });
    await page.click('[data-a="addC"]');
    await sleep(600);
  }
  await shot('08-preview-comment');

  // 7. Test: run first scenario
  await page.evaluate(() => act('openStage','test'));
  await sleep(1500);
  await shot('09-test-scenarios');
  const sc = await page.$('[data-a="openT"]');
  if (sc) {
    await sc.click();
    await waitFor(() => page.evaluate(() => /Pass|Fail/.test(document.body.innerText.match(/Running…|Not run|Pass|Fail/g)?.join(' ') || '')), 40000, 'scenario result');
    await sleep(1000);
  }
  await shot('10-test-ran');

  // 8. Deploy tab + GitHub connect
  await page.evaluate(() => act('openStage','deploy'));
  await sleep(600);
  const gh = await page.$('[data-a="ghConnect"]');
  if (gh) { await gh.click(); await sleep(600); }
  await shot('11-deploy');

  // 9. Deploy to staging (switch to builder role first � defines can't deploy)
  await page.evaluate(() => { S.role = 'build'; render(); });
  await sleep(400);
  await page.click('[data-a="deployGo"]');
  const ok = await waitFor(() => page.$('a[href^="/app/"]'), 300000, 'deploy link');
  await sleep(1500);
  await shot('12-deploy-done');

  // 10. Open the live app
  if (ok) {
    const href = await page.$eval('a[href^="/app/"]', a => a.getAttribute('href'));
    console.log('live app:', href);
    await page.goto(BASE + href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(1500);
    await shot('13-live-app');
  }

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('CAPTURE FAILED:', e.message); process.exit(1); });
