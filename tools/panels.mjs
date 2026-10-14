// Opens each menu in a dev preset and screenshots it, portrait and landscape.
//   node tools/panels.mjs dist/web out/ "#dev-rich"
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const [dir = 'dist/web', outDir = 'panels', hash = '#dev-rich', sizesArg = '390x844@2,1280x720@1'] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.mp3': 'audio/mpeg' };
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
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const logs = [];
for (const size of sizesArg.split(',')) {
  const [, w, h, d] = size.match(/(\d+)x(\d+)@?([\d.]+)?/);
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(d ?? 1) });
  page.on('console', (m) => m.type() !== 'log' && logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto(`http://localhost:${server.address().port}/index.html${hash}`);
  await page.waitForFunction(() => window.__play);
  await page.waitForTimeout(1500);
  const panels = {
    upgrades: 'p.hud && p.open(() => M.upgradesPanel(p, p.ctx))',
  };
  void panels;
  for (const name of ['upgrades', 'pets', 'dex', 'map', 'quests', 'egg', 'daily']) {
    await page.evaluate((n) => {
      const p = window.__play;
      const a = p.hud.act;
      if (n === 'egg') a.egg(0);
      else if (n === 'daily') p.openDaily();
      else a[n]();
    }, name);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${outDir}/${w}x${h}-${name}.png` });
    await page.evaluate(() => window.__play.panel?.close());
    await page.waitForTimeout(400);
  }
  await page.close();
}
console.log(logs.join('\n') || 'no console warnings/errors');
await browser.close();
server.close();
