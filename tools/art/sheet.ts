// Renders art to a contact sheet PNG for review: bun tools/art/sheet.ts fish /tmp/out.png
import sharp from '/home/claude/.npm-global/lib/node_modules/sharp/dist/index.mjs';
import { FISH_ART, fishSvg, fishSize } from '../../src/render/fish.ts';

const [kind = 'fish', out = '/tmp/claude-0/sheet.png', bg = '#7fc6dc'] = process.argv.slice(2);
type Item = { name: string; svg: string; w: number; h: number };
let items: Item[] = [];
if (kind === 'fish') items = Object.entries(FISH_ART).map(([k, a]) => ({ name: k, svg: fishSvg(a), ...fishSize(a) }));
else {
  const mod = await import(`../../src/render/${kind}.ts`);
  items = mod.previewItems();
}
const cell = 300, cols = 4, scale = 1;
const rows = Math.ceil(items.length / cols);
const comps: any[] = [];
for (let i = 0; i < items.length; i++) {
  const it = items[i];
  const png = await sharp(Buffer.from(it.svg), { density: 72 * scale }).png().toBuffer();
  const meta = await sharp(png).metadata();
  const s = Math.min((cell - 20) / meta.width!, (cell - 50) / meta.height!, 1.6);
  const resized = await sharp(png).resize(Math.round(meta.width! * s), Math.round(meta.height! * s)).png().toBuffer();
  const m2 = await sharp(resized).metadata();
  const x = (i % cols) * cell + Math.round((cell - m2.width!) / 2);
  const y = Math.floor(i / cols) * cell + Math.round((cell - 30 - m2.height!) / 2);
  comps.push({ input: resized, left: x, top: y });
  const label = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="30"><text x="${cell / 2}" y="20" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#1b2b3a">${it.name}</text></svg>`;
  comps.push({ input: Buffer.from(label), left: (i % cols) * cell, top: Math.floor(i / cols) * cell + cell - 32 });
}
await sharp({ create: { width: cols * cell, height: rows * cell, channels: 4, background: bg } }).composite(comps).png().toFile(out);
console.log('wrote', out, items.length);
