// Plays the web build in headless Chromium like a player would (real mouse input), and takes
// screenshots of each key moment. Also reports console errors.
//   node tools/play.mjs dist/web out/ [seconds] [w]x[h]@[dpr]
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';

const [dir = 'dist/web', outDir = 'play', secs = '90', size = '390x844@2', hash = ''] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const root = resolve(dir);
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(root, p);
  if (!existsSync(f)) return res.writeHead(404), res.end();
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const [, w, h, d] = size.match(/(\d+)x(\d+)@?([\d.]+)?/);
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(d ?? 1) });
const logs = [];
page.on('console', (m) => m.type() !== 'log' && logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(`http://localhost:${server.address().port}/index.html${hash}`);
await page.waitForFunction(() => window.__play, null, { timeout: 30000 });
await page.waitForTimeout(800);

const st = () =>
  page.evaluate(() => {
    const p = window.__play;
    const f = p.fishing;
    return { phase: f.phase, power: f.power, tension: f.tension, green: f.greenRange, progress: f.progress, holding: f.holding, modal: p.modal, coins: p.s.coins, catches: p.s.stats.catches, step: p.step, tut: p.s.tutorial.join(','), ready: p.s.eggs.findIndex((e) => e && e.left <= 0), boss: p.pg.bossReady, k: p.vp.scale / p.vp.dpr, dex: Object.keys(p.s.dex).length, pets: Object.keys(p.s.pets).length };
  });
const toCss = async (x, y) => {
  const k = await page.evaluate(() => window.__play.vp.scale / window.__play.vp.dpr);
  return { x: x * k, y: y * k };
};
const clickUnits = async (x, y) => {
  const p = await toCss(x, y);
  await page.mouse.click(p.x, p.y);
};
const shots = new Set();
const shot = async (name) => {
  if (shots.has(name)) return;
  shots.add(name);
  await page.screenshot({ path: `${outDir}/${String(shots.size).padStart(2, '0')}-${name}.png` });
};
const water = { x: +w * 0.62, y: +h * 0.72 };
let down = false;
const press = async () => {
  if (!down) {
    await page.mouse.move(water.x, water.y);
    await page.mouse.down();
    down = true;
  }
};
const release = async () => {
  if (down) {
    await page.mouse.up();
    down = false;
  }
};
const end = Date.now() + +secs * 1000;
let wantPower = 0.85;
let lastCatches = 0;
let panelsDone = false;
while (Date.now() < end) {
  const s = await st();
  if (s.modal > 0) {
    await release();
    await page.waitForTimeout(900);
    await shot(`modal-c${s.catches}`);
    // Dismiss cards and hatch reveals: click the centre-bottom area (Yay button / dim).
    await page.waitForTimeout(700);
    const s2 = await st();
    if (s2.modal > 0) {
      await shot(`modal2-c${s2.catches}`);
      const yay = await page.evaluate(() => {
        const sc = window.__play;
        const list = sc.children.list.filter((o) => o.type === 'Container' && o.depth >= 1300);
        return list.length;
      });
      void yay;
      await page.mouse.click(+w / 2, +h * 0.42 + 380 * s.k);
      await page.waitForTimeout(300);
      await page.mouse.click(+w * 0.5, +h * 0.06);
      await page.keyboard.press('Escape');
    }
    continue;
  }
  if (s.ready >= 0 && s.phase === 'ready') {
    const pos = await page.evaluate((i) => ({ x: window.__play.hud.eggs[i].btn.x, y: window.__play.hud.eggs[i].btn.y }), s.ready);
    await shot('egg-ready');
    await clickUnits(pos.x, pos.y);
    await page.waitForTimeout(500);
    continue;
  }
  if (s.step === 'upgrade' && s.phase === 'ready') {
    await shot('coach-upgrade');
    const b = await page.evaluate(() => ({ x: window.__play.hud.bottom[0].x, y: window.__play.hud.bottom[0].y }));
    await clickUnits(b.x, b.y);
    await page.waitForTimeout(700);
    await shot('panel-upgrades');
    // Buy the rod upgrade (first row buy button).
    const p = await page.evaluate(() => {
      const panel = window.__play.panel;
      const buttons = panel.content.list.filter((o) => o.opts && o.opts.icon === 'item:coin');
      const b = buttons[0];
      return { x: panel.box.x + b.x, y: panel.box.y + b.y };
    });
    await clickUnits(p.x, p.y);
    await page.waitForTimeout(400);
    await shot('panel-upgrades-bought');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    continue;
  }
  if (!panelsDone && s.catches >= 12 && s.phase === 'ready') {
    panelsDone = true;
    for (const [i, name] of [[1, 'pets'], [2, 'dex'], [3, 'map']]) {
      const b = await page.evaluate((k) => ({ x: window.__play.hud.bottom[k].x, y: window.__play.hud.bottom[k].y }), i);
      await clickUnits(b.x, b.y);
      await page.waitForTimeout(700);
      await shot(`panel-${name}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    continue;
  }
  if (s.boss && s.phase === 'ready') {
    await shot('boss-ready');
    const b = await page.evaluate(() => ({ x: window.__play.hud.boss.x, y: window.__play.hud.boss.y }));
    await clickUnits(b.x, b.y);
    await page.waitForTimeout(2000);
    continue;
  }
  switch (s.phase) {
    case 'ready':
      if (s.catches !== lastCatches) lastCatches = s.catches;
      wantPower = 0.3 + Math.random() * 0.65;
      await release();
      await page.waitForTimeout(60);
      await press();
      break;
    case 'charging':
      if (s.power > 0.5) await shot('charging');
      if (s.power >= wantPower) await release();
      break;
    case 'flying':
      await release();
      break;
    case 'waiting':
      await shot('waiting');
      break;
    case 'bite':
      await shot('bite');
      await press();
      break;
    case 'reeling': {
      if (s.progress > 0.5) await shot(s.green[1] - s.green[0] < 0.35 ? 'reeling-boss' : 'reeling');
      const [lo, hi] = s.green;
      if (down && s.tension > hi - 0.05) await release();
      else if (!down && s.tension < lo + 0.08) await press();
      break;
    }
    default:
      await release();
  }
  await page.waitForTimeout(25);
}
await release();
const final = await st();
await page.screenshot({ path: `${outDir}/zz-final.png` });
console.log(JSON.stringify(final));
console.log(logs.slice(0, 30).join('\n') || 'no console warnings/errors');
await browser.close();
server.close();
