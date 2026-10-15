// Poki store thumbnail from the game's own art (Poki spec: square, at least 628 px, full bleed,
// no text, no border, one clear foreground subject, colours away from Poki's #83FFE7 page).
//   bun tools/art/thumbnail.ts out/thumbnail.png [size]
import sharp from '/home/claude/.npm-global/lib/node_modules/sharp/dist/index.mjs';
import { FISH_ART, fishSize, fishSvg } from '../../src/render/fish.ts';
import { itemSvg, eggSvg } from '../../src/render/items.ts';
import { petSvg } from '../../src/render/pets.ts';
import { commonPieces, hatPieces, sceneryPieces } from '../../src/render/scenery.ts';

const [out = '/tmp/claude-0/thumbnail.png', sizeArg = '1024'] = process.argv.slice(2);
const S = Number(sizeArg);

/** Places an SVG string inside the canvas at x, y with width w (height keeps the aspect). */
function place(svg: string, x: number, y: number, w: number, h: number, extra = '') {
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const vb = /viewBox="([^"]+)"/.exec(svg)![1];
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" ${extra}>${inner}</svg>`;
}

const pieces = commonPieces();
const cozy = sceneryPieces('cozy');
const duck = FISH_ART.golden_duckfish;
const fs = fishSize(duck);
const fishW = 640;
const fishH = (fishW * fs.h) / fs.w;

const drops = Array.from({ length: 14 }, (_, i) => {
  const a = Math.PI * (1.05 + (i / 13) * 0.9);
  const r = 60 + (i % 4) * 30;
  const x = 560 + Math.cos(a) * r * 1.6;
  const y = 742 + Math.sin(a) * r * 0.9;
  const s = 8 + (i % 3) * 6;
  return `<circle cx="${x}" cy="${y}" r="${s}" fill="#ffffff" stroke="#3b2a4d" stroke-width="4"/>`;
}).join('');

const sparkles = [
  [300, 250, 70],
  [770, 210, 56],
  [840, 420, 44],
  [210, 470, 40],
].map(([x, y, s]) => place(itemSvg('sparkle'), x - s / 2, y - s / 2, s, s)).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb36b"/><stop offset="0.6" stop-color="#ff8fa3"/><stop offset="1" stop-color="#ffc9a8"/></linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7fc4"/><stop offset="1" stop-color="#16346a"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6c2" stop-opacity="0.95"/><stop offset="1" stop-color="#fff6c2" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1024" height="1024" fill="url(#sky)"/>
${place(pieces.sun.svg, 760, 60, 220, 220)}
${place(cozy.hillsFar.svg, -300, 520, 1600, 260)}
${place(cozy.hillsNear.svg, -500, 560, 1600, 260)}
<rect y="740" width="1024" height="284" fill="url(#sea)"/>
<path d="M0,742 Q64,728 128,742 T256,742 T384,742 T512,742 T640,742 T768,742 T896,742 T1024,742" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
<ellipse cx="520" cy="420" rx="360" ry="330" fill="url(#glow)"/>
${sparkles}
<path d="M470,470 Q640,440 772,322" fill="none" stroke="#ffffff" stroke-width="4"/>
${place(fishSvg(duck), 520 - fishW / 2, 360 - fishH / 2, fishW, fishH, 'transform="rotate(-14 520 360)"')}
${drops}
${place(pieces.lilyFlower.svg, 700, 760, 300, 140)}
${place(petSvg('puddle_frog'), 760, 600, 200, 200)}
${place(eggSvg(4), 860, 860, 110, 134, 'transform="rotate(12 915 927)"')}
${place(cozy.dock.svg, -120, 720, 520, 434)}
${place(pieces.cat.svg, 40, 500, 330, 363)}
${place(hatPieces().rain.svg, 40, 500, 330, 363)}
<path d="M250,746 Q330,560 470,470" fill="none" stroke="#3b2a4d" stroke-width="17" stroke-linecap="round"/>
<path d="M250,746 Q330,560 470,470" fill="none" stroke="#c98a4b" stroke-width="9" stroke-linecap="round"/>
<circle cx="283" cy="680" r="17" fill="#5b6178" stroke="#3b2a4d" stroke-width="5"/>
<circle cx="470" cy="470" r="8" fill="#ff6b6b" stroke="#3b2a4d" stroke-width="4"/>
</svg>`;

await sharp(Buffer.from(svg), { density: 72 * (S / 1024) }).resize(S, S).png().toFile(out);
console.log('wrote', out);
