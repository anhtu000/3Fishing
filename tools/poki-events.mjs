// Plays the Poki build with a fake PokiSDK that records every call, like the Inspector event log,
// then checks the event order rules (no gameplayStart on load, no back-to-back duplicates).
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.mp3': 'audio/mpeg' };
// Usage: node tools/poki-events.mjs [dist/poki]   (run after npm run build)
const root = resolve(process.argv[2] ?? 'dist/poki');
const server = createServer((req, res) => { let p = req.url.split('?')[0].split('#')[0]; if (p.endsWith('/')) p += 'index.html'; const f = join(root, p); if (!existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f)); }).listen(0);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
// Block the real SDK and install a recording fake, like the Poki Inspector event log.
await ctx.route('**/game-cdn.poki.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
await ctx.addInitScript(() => {
  const log = (window.__ev = []);
  const ev = (n) => log.push(n);
  window.PokiSDK = {
    init: () => Promise.resolve(),
    gameLoadingFinished: () => ev('gameLoadingFinished'),
    gameplayStart: () => ev('gameplayStart'),
    gameplayStop: () => ev('gameplayStop'),
    commercialBreak: (onStart) => { ev('commercialBreak'); return new Promise((r) => { onStart && onStart(); setTimeout(r, 300); }); },
    rewardedBreak: (o) => { ev('rewardedBreak'); return new Promise((r) => { o && o.onStart && o.onStart(); setTimeout(() => r(true), 300); }); },
  };
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForTimeout(4000);
const log = () => page.evaluate(() => window.__ev.join(' > '));
console.log('after load:', await log());
// first input: hold then release on water
await page.mouse.move(250, 600); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
await page.waitForTimeout(500);
console.log('after first input:', await log());
// open Upgrades via its button (bottom-left) then ESC
await page.waitForTimeout(6000);
await page.mouse.click(48, 800);
await page.waitForTimeout(800);
await page.keyboard.press('Escape');
await page.waitForTimeout(1500);
// ESC pause and resume
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
await page.keyboard.press('Escape');
await page.waitForTimeout(1500);
const all = await page.evaluate(() => window.__ev);
console.log('full log:', all.join(' > '));
const dup = all.filter((e, i) => i > 0 && (e === 'gameplayStart' || e === 'gameplayStop') && all[i - 1] === e);
console.log('back-to-back duplicates:', dup.length);
console.log(errs.join('\n') || 'no errors');
await browser.close(); server.close();
