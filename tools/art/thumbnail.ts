// Poki store thumbnail from the game's own art (Poki spec: square, at least 628 px, full bleed,
// no text, no border, one clear foreground subject, colours away from Poki's #83FFE7 page).
//   bun tools/art/thumbnail.ts out/thumbnail.png [size]
import sharp from '/home/claude/.npm-global/lib/node_modules/sharp/dist/index.mjs';
import { FISH_ART, fishSize, fishSvg } from '../../src/render/fish.ts';
import { itemSvg } from '../../src/render/items.ts';
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

// One hero: the cat, big and mid-yank, with the golden fish it just hooked leaping out of the water.
// (Poki: one clear foreground subject, the main character in its default look, a dynamic pose,
// readable at small tile sizes.)
const CAT = { x: 6, y: 352, s: 3.0 }; // cat art is 200 x 220
const cat = (lx: number, ly: number) => [CAT.x + lx * CAT.s, CAT.y + ly * CAT.s];
const [px, py] = cat(127, 149); // paws on the rod
const fishW = 470;
const fishH = (fishW * fs.h) / fs.w;
const FISH = { cx: 700, cy: 300, rot: 16 };
// Mouth of the (mirrored) fish, where the line ends: the beak point, turned with the fish.
const rad = (FISH.rot * Math.PI) / 180;
const [mx, my] = [-fishW * 0.44, 6];
const mouth = [FISH.cx + mx * Math.cos(rad) - my * Math.sin(rad), FISH.cy + mx * Math.sin(rad) + my * Math.cos(rad)];
const tip = [px + 230, py - 360];
const WATER = 880;

const drops = Array.from({ length: 16 }, (_, i) => {
  const a = Math.PI * (1.08 + (i / 15) * 0.84);
  const r = 70 + (i % 4) * 34;
  const x = 760 + Math.cos(a) * r * 1.5;
  const y = WATER + 4 + Math.sin(a) * r * 1.1;
  const sz = 9 + (i % 3) * 7;
  return `<circle cx="${x}" cy="${y}" r="${sz}" fill="#ffffff" stroke="#3b2a4d" stroke-width="4"/>`;
}).join('');

const sparkles = [
  [905, 150, 70],
  [470, 150, 50],
  [960, 420, 46],
].map(([x, y, sz]) => place(itemSvg('sparkle'), x - sz / 2, y - sz / 2, sz, sz)).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb36b"/><stop offset="0.65" stop-color="#ff8fa3"/><stop offset="1" stop-color="#ffc9a8"/></linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7fc4"/><stop offset="1" stop-color="#16346a"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6c2" stop-opacity="0.95"/><stop offset="1" stop-color="#fff6c2" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1024" height="1024" fill="url(#sky)"/>
${place(cozy.hillsFar.svg, -300, WATER - 230, 1600, 260)}
<rect y="${WATER}" width="1024" height="${1024 - WATER}" fill="url(#sea)"/>
<path d="M0,${WATER + 2} Q64,${WATER - 12} 128,${WATER + 2} T256,${WATER + 2} T384,${WATER + 2} T512,${WATER + 2} T640,${WATER + 2} T768,${WATER + 2} T896,${WATER + 2} T1024,${WATER + 2}" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
<ellipse cx="${FISH.cx}" cy="${FISH.cy}" rx="330" ry="290" fill="url(#glow)"/>
${sparkles}
<path d="M${tip[0]},${tip[1]} L${mouth[0]},${mouth[1]}" fill="none" stroke="#ffffff" stroke-width="5"/>
<g transform="rotate(${FISH.rot} ${FISH.cx} ${FISH.cy})">
  <g transform="translate(${2 * FISH.cx} 0) scale(-1 1)">${place(fishSvg(duck), FISH.cx - fishW / 2, FISH.cy - fishH / 2, fishW, fishH)}</g>
</g>
${drops}
${place(cozy.dock.svg, -260, WATER - 70, 700, 584)}
<g transform="rotate(-6 ${CAT.x + 100 * CAT.s} ${CAT.y + 200 * CAT.s})">
${place(pieces.cat.svg, CAT.x, CAT.y, 200 * CAT.s, 220 * CAT.s)}
${place(hatPieces().rain.svg, CAT.x, CAT.y, 200 * CAT.s, 220 * CAT.s)}
</g>
<path d="M${px - 40},${py + 70} Q${px + 60},${py - 230} ${tip[0]},${tip[1]}" fill="none" stroke="#3b2a4d" stroke-width="26" stroke-linecap="round"/>
<path d="M${px - 40},${py + 70} Q${px + 60},${py - 230} ${tip[0]},${tip[1]}" fill="none" stroke="#c98a4b" stroke-width="14" stroke-linecap="round"/>
<circle cx="${px - 4}" cy="${py + 6}" r="26" fill="#5b6178" stroke="#3b2a4d" stroke-width="7"/>
<circle cx="${tip[0]}" cy="${tip[1]}" r="11" fill="#ff6b6b" stroke="#3b2a4d" stroke-width="5"/>
</svg>`;

await sharp(Buffer.from(svg), { density: 72 * (S / 1024) }).resize(S, S).png().toFile(out);
console.log('wrote', out);
