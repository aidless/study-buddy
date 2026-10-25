const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ymd = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

(async () => {
  const APP = process.env.APP_URL || 'http://127.0.0.1:4173';
  const out = process.env.OUT || path.join(__dirname, '..', 'landing', 'assets');
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none', '--hide-scrollbars'],
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(APP + '/', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('input[placeholder="起个名字"]', { timeout: 30000 });
  await page.type('input[placeholder="起个名字"]', '小研');
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('创建账号'));
    if (b) b.click();
  });
  await page.waitForSelector('.app', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));
  const user = await page.evaluate(() => JSON.parse(localStorage.getItem('dx_user')));

  const now = new Date();
  const today = ymd(now);
  const tasks = [
    { id: 'demo-t1', coupleId: user.coupleId, owner_id: user.id, title: '数学一 · 高数极限 20 题', date: today, time: '09:00', done: true },
    { id: 'demo-t2', coupleId: user.coupleId, owner_id: user.id, title: '英语一 · 2019 阅读精读', date: today, time: '14:00', done: true },
    { id: 'demo-t3', coupleId: user.coupleId, owner_id: user.id, title: '408 · 操作系统进程调度', date: today, time: '19:00', done: false },
  ];
  const focus = [];
  for (let i = 0; i < 20; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const n = i < 3 ? 2 : (i % 4 === 0 ? 0 : 1);
    for (let j = 0; j < n; j++) {
      d.setHours(9 + j * 4, 10, 0, 0);
      focus.push({ id: `demo-f${i}-${j}`, coupleId: user.coupleId, userId: user.id,
        durationSec: 1500, taskId: null, startedAt: d.toISOString(), status: 'done', note: null });
    }
  }
  const checkins = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    checkins.push({ id: `demo-c${i}`, coupleId: user.coupleId, userId: user.id,
      date: ymd(d), note: '', at: d.toISOString() });
  }
  await page.evaluate(({ tasks, focus, checkins }) => {
    localStorage.setItem('dx_tasks', JSON.stringify(tasks));
    localStorage.setItem('dx_focus', JSON.stringify(focus));
    localStorage.setItem('dx_checkins', JSON.stringify(checkins));
    const cid = JSON.parse(localStorage.getItem('dx_user')).coupleId;
    localStorage.setItem('dx_target_score', JSON.stringify({ [cid]: 350 }));
    localStorage.setItem('dx_subj_target', JSON.stringify({ [cid]: { pol: 70, eng: 65, math: 105, cs408: 110 } }));
  }, { tasks, focus, checkins });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.app', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  const clickTab = async (label) => {
    const ok = await page.evaluate((label) => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().endsWith(label));
      if (!b) return false;
      b.click();
      return true;
    }, label);
    if (!ok) { console.log('missing tab', label); return false; }
    await new Promise(r => setTimeout(r, 900));
    return true;
  };

  await page.screenshot({ path: `${out}/today.png` });
  for (const [label, file] of [['专注', 'focus'], ['备考', 'plan'], ['进度', 'progress']]) {
    if (await clickTab(label)) await page.screenshot({ path: `${out}/${file}.png` });
  }
  await clickTab('今日');
  const tree = await page.evaluate(() => {
    const el = [...document.querySelectorAll('button, .more-item, div')].find(x => x.textContent.trim() === '树洞');
    if (!el) return false;
    el.click();
    return true;
  });
  if (tree) { await new Promise(r => setTimeout(r, 600)); await page.screenshot({ path: `${out}/mood.png` }); }
  await browser.close();
  console.log('shots written to', out);
})().catch(e => { console.error(e); process.exit(1); });
