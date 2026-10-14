// Screenshots of a build in headless Chromium, for visual checks.
//   node tools/shot.mjs dist/web out/ [hash] [w]x[h]@[dpr] ...
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';

const [dir = 'dist/web', outDir = 'shots', hash = '', ...sizes] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.png': 'image/png', '.json': 'application/json' };
const root = resolve(dir);
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(root, p);
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const port = server.address().port;
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const list = sizes.length ? sizes : ['390x844@2', '1280x720@1'];
for (const s of list) {
  const [, w, h, d] = s.match(/(\d+)x(\d+)@?([\d.]+)?/);
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(d ?? 1), hasTouch: +w < +h });
  const logs = [];
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto(`http://localhost:${port}/index.html${hash}`);
  await page.waitForTimeout(+(process.env.WAIT ?? 2500));
  const file = join(outDir, `shot-${w}x${h}.png`);
  await page.screenshot({ path: file });
  console.log(file, logs.filter((l) => !l.startsWith('debug')).slice(0, 12).join(' | '));
  await page.close();
}
await browser.close();
server.close();
