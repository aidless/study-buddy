const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

const APP = process.env.APP_URL || 'http://127.0.0.1:4173';
const OUT = process.env.FRAMES_DIR || path.join(os.tmpdir(), 'study-buddy-demo-frames');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(APP + '/?demo=1', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 900));

  await page.evaluate(() => {
    const cap = document.createElement('div');
    cap.id = 'demo-cap';
    cap.style.cssText = 'position:fixed;left:16px;right:16px;bottom:92px;z-index:99999;background:rgba(24,35,29,.9);color:#fff;padding:10px 14px;border-radius:12px;font:600 13.5px/1.5 -apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans CJK SC",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.18);opacity:0;transition:opacity .25s;pointer-events:none;';
    document.body.appendChild(cap);
    window.__setCap = (text) => { cap.textContent = text; cap.style.opacity = '1'; };
    window.__setCap('打开就有今天该做的 3 件事');
  });

  const setCap = (text) => page.evaluate((t) => window.__setCap(t), text);
  const clickText = (text) => page.evaluate((t) => {
    const els = [...document.querySelectorAll('button, .more-item, .task, .t-check')];
    const el = els.find((x) => (x.textContent || '').trim().includes(t));
    if (!el) return false;
    el.click();
    return true;
  }, text);
  const clickTask = () => page.evaluate(() => {
    const row = [...document.querySelectorAll('.task')].find((x) => x.textContent.includes('408'));
    if (!row) return false;
    const c = row.querySelector('.t-check');
    if (!c) return false;
    c.click();
    return true;
  });
  const clickTab = (label) => page.evaluate((label) => {
    const b = [...document.querySelectorAll('.tabs button')].find((x) => x.textContent.trim().endsWith(label));
    if (!b) return false;
    b.click();
    return true;
  }, label);

  let capturing = true;
  let n = 0;
  const capture = (async () => {
    while (capturing) {
      const name = path.join(OUT, `frame-${String(n++).padStart(5, '0')}.png`);
      await page.screenshot({ path: name });
      await sleep(180);
    }
  })();

  const timeline = (async () => {
    await sleep(3500);
    await clickTask();
    await setCap('勾掉一件，完成率立刻更新');
    await sleep(4000);
    await clickTab('专注');
    await setCap('25 分钟专注 + 5 分钟休息');
    await sleep(4000);
    await clickTab('进度');
    await setCap('热力图告诉你：这周真的在走');
    await sleep(5000);
    await clickTab('今日');
    await clickText('树洞');
    await setCap('树洞：只她可见，写完就关');
    await sleep(5000);
    await clickText('不存了');
    await clickTab('备考');
    await setCap('11408 的方向感：倒计时、目标分、单科');
    await sleep(5000);
    await clickTab('今日');
    await setCap('打开就能用，数据默认留在本机');
    await sleep(3000);
    capturing = false;
  })();

  await timeline;
  await capture;
  await browser.close();
  console.log('frames', n);
})().catch((e) => { console.error(e); process.exit(1); });
