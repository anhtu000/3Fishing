// Poki store thumbnails, v1.16 art (cat C2 in the raincoat, v1.15 pets and shore). Three options:
//   A  Legendary catch at sunset: the cat yanks the glowing Golden Duckfish out of the pond, a
//      duckling cheers from a lily pad (the v1.14 idea, redrawn and with a pet).
//   B  Hatch at dusk: an egg bursts open on a lily pad and the Sunny Axolotl pops out, the cat
//      fishes from the dock (shows both halves of "Hatch & Fish").
//   C  Close-up: the cat's face fills the tile, the golden fish is right next to it (reads best at
//      small tile sizes).
// Poki spec: square, at least 628 px, full bleed, no text, no border, one clear foreground subject,
// colours away from Poki's #83FFE7 page.
//   bun tools/art/thumbnails.ts <outDir> [size]   ->  thumb_A.png, thumb_B.png, thumb_C.png (+ .svg)
import sharp from '/home/claude/.npm-global/lib/node_modules/sharp/dist/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { FISH_ART, fishSize, fishSvg } from '../../src/render/fish.ts';
import { eggSvg, itemSvg } from '../../src/render/items.ts';
import { petSvg } from '../../src/render/pets.ts';
import { commonPieces, hatPieces, sceneryPieces } from '../../src/render/scenery.ts';

const [outDir = '/tmp/claude-0/thumbs', sizeArg = '1024', only = 'ABC'] = process.argv.slice(2);
const S = Number(sizeArg);
const INK = '#3b2a4d';

/** Places an SVG string at x, y with size w x h (keeps its own viewBox). */
function place(svg: string, x: number, y: number, w: number, h: number, extra = '') {
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const vb = /viewBox="([^"]+)"/.exec(svg)![1];
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" ${extra}>${inner}</svg>`;
}

const rot = (x: number, y: number, ox: number, oy: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [ox + (x - ox) * Math.cos(a) - (y - oy) * Math.sin(a), oy + (x - ox) * Math.sin(a) + (y - oy) * Math.cos(a)];
};

const pieces = commonPieces();
const cozy = sceneryPieces('cozy');
const hat = hatPieces().rain;

/** The cat on its 200 x 220 canvas at (x, y) scale s, tilted `tilt` degrees about its feet. Returns svg and paw. */
function cat(x: number, y: number, s: number, tilt: number) {
  const ox = x + 100 * s;
  const oy = y + 200 * s;
  const svg = `<g transform="rotate(${tilt} ${ox} ${oy})">${place(pieces.cat.svg, x, y, 200 * s, 220 * s)}${place(hat.svg, x, y, 200 * s, 220 * s)}</g>`;
  const paw = rot(x + 126 * s, y + 150 * s, ox, oy, tilt);
  return { svg, paw };
}

/** The rod, bent by a big fish: from the paw up to `tip`. */
function rod(paw: number[], tip: number[], bend: number[], w = 1) {
  const [px, py] = paw;
  const d = `M${px - 34 * w},${py + 60 * w} Q${bend[0]},${bend[1]} ${tip[0]},${tip[1]}`;
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${24 * w}" stroke-linecap="round"/>
<path d="${d}" fill="none" stroke="#c98a4b" stroke-width="${12 * w}" stroke-linecap="round"/>
<circle cx="${px}" cy="${py + 4 * w}" r="${24 * w}" fill="#5b6178" stroke="${INK}" stroke-width="${7 * w}"/>
<circle cx="${tip[0]}" cy="${tip[1]}" r="${10 * w}" fill="#ff6b6b" stroke="${INK}" stroke-width="${5 * w}"/>`;
}

/** A fish mirrored to face left, turned `deg`, centred at cx, cy, width w. Returns svg and mouth. */
function fish(id: string, cx: number, cy: number, w: number, deg: number) {
  const a = FISH_ART[id];
  const fs = fishSize(a);
  const h = (w * fs.h) / fs.w;
  const svg = `<g transform="rotate(${deg} ${cx} ${cy})"><g transform="translate(${2 * cx} 0) scale(-1 1)">${place(fishSvg(a), cx - w / 2, cy - h / 2, w, h)}</g></g>`;
  const mouth = rot(cx - w * 0.44, cy + 6, cx, cy, deg);
  return { svg, mouth, h };
}

/** Light rays around a point (Legendary glow, hatch burst). */
function rays(cx: number, cy: number, r: number, n: number, color: string, alpha: number, spin = 0) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = ((i / n) * 360 + spin) * (Math.PI / 180);
    const a1 = a0 + (Math.PI / n) * 0.9;
    d += `M${cx},${cy} L${cx + Math.cos(a0) * r},${cy + Math.sin(a0) * r} L${cx + Math.cos(a1) * r},${cy + Math.sin(a1) * r} Z `;
  }
  return `<path d="${d}" fill="${color}" opacity="${alpha}"/>`;
}

const sparkle = (x: number, y: number, sz: number) => place(itemSvg('sparkle'), x - sz / 2, y - sz / 2, sz, sz);

/** Water drops thrown up in an arc around (cx, y). */
function splash(cx: number, y: number, spread: number, n = 14, seed = 1) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.06 + (i / (n - 1)) * 0.88);
    const r = spread * (0.45 + ((i * 7 + seed) % 5) * 0.14);
    const x = cx + Math.cos(a) * r * 1.4;
    const yy = y + 4 + Math.sin(a) * r;
    const sz = 8 + ((i + seed) % 3) * 6;
    out += `<circle cx="${x}" cy="${yy}" r="${sz}" fill="#ffffff" stroke="${INK}" stroke-width="4"/>`;
  }
  // the crown of water where it broke the surface
  out += `<path d="M${cx - spread * 0.9},${y + 6} Q${cx - spread * 0.55},${y - spread * 0.5} ${cx - spread * 0.35},${y - spread * 0.05} Q${cx - spread * 0.15},${y - spread * 0.75} ${cx},${y - spread * 0.1} Q${cx + spread * 0.18},${y - spread * 0.7} ${cx + spread * 0.38},${y - spread * 0.05} Q${cx + spread * 0.6},${y - spread * 0.45} ${cx + spread * 0.9},${y + 6} Z" fill="#ffffff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  return out;
}

function wave(y: number, stroke = '#ffffff', w = 10) {
  let d = `M0,${y}`;
  for (let x = 0; x < 1024; x += 128) d += ` Q${x + 64},${y - 14} ${x + 128},${y}`;
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`;
}

const DEFS = `<defs>
  <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb05e"/><stop offset="0.6" stop-color="#ff8fa3"/><stop offset="1" stop-color="#ffc9a8"/></linearGradient>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2f7a"/><stop offset="0.55" stop-color="#8a4fa8"/><stop offset="1" stop-color="#f08aa0"/></linearGradient>
  <linearGradient id="day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fa3f0"/><stop offset="1" stop-color="#bfe3ff"/></linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7fc4"/><stop offset="1" stop-color="#16346a"/></linearGradient>
  <linearGradient id="seaDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a5fb0"/><stop offset="1" stop-color="#1a2050"/></linearGradient>
  <radialGradient id="gold" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6c2" stop-opacity="1"/><stop offset="0.45" stop-color="#ffe27a" stop-opacity="0.7"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>
  <radialGradient id="pinkGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fffbe0" stop-opacity="1"/><stop offset="0.45" stop-color="#ffd1ef" stop-opacity="0.75"/><stop offset="1" stop-color="#ffd1ef" stop-opacity="0"/></radialGradient>
</defs>`;

const frame = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${DEFS}${body}</svg>`;

// ---------- A: Legendary catch at sunset ----------
function optionA() {
  const WATER = 812;
  const deck = WATER - 34;
  const s = 2.55;
  const c = cat(-14, deck - 200 * s, s, -6);
  const f = fish('golden_duckfish', 752, 262, 500, 12);
  const tip = [c.paw[0] + 190, c.paw[1] - 330];
  return frame(`
<rect width="1024" height="1024" fill="url(#sunset)"/>
${place(pieces.sun.svg, 760, 70, 220, 220, 'opacity="0.55"')}
${place(cozy.hillsFar.svg, -300, WATER - 250, 1600, 260)}
${place(cozy.hillsNear.svg, -200, WATER - 150, 1600, 260)}
<rect y="${WATER}" width="1024" height="${1024 - WATER}" fill="url(#sea)"/>
${wave(WATER + 2)}
<ellipse cx="746" cy="262" rx="360" ry="320" fill="url(#gold)"/>
${rays(746, 262, 380, 14, '#fff3b0', 0.2, 8)}
${sparkle(930, 120, 70)}${sparkle(470, 130, 48)}${sparkle(975, 470, 46)}${sparkle(560, 460, 36)}
<path d="M${tip[0]},${tip[1]} L${f.mouth[0]},${f.mouth[1]}" fill="none" stroke="#ffffff" stroke-width="5"/>
${f.svg}
${splash(700, WATER, 120, 16, 2)}
${place(pieces.lily.svg, 760, WATER + 70, 230, 107)}
${place(petSvg('reed_duckling'), 770, WATER - 82, 200, 200)}
${place(cozy.dock.svg, -330, deck - 70 * 2.1, 360 * 2.1, 300 * 2.1)}
${c.svg}
${rod(c.paw, tip, [c.paw[0] + 70, c.paw[1] - 250])}
`);
}

// ---------- B: hatch at dusk ----------
function optionB() {
  const WATER = 770;
  const deck = WATER - 34;
  const s = 2.25;
  const c = cat(-40, deck - 200 * s, s, -2);
  // Egg on a big lily pad, right of the dock: bottom shell stays, the top shell flies off.
  const ew = 300;
  const eh = (ew * 170) / 140;
  const ex = 575;
  const ey = WATER + 40 - eh * 0.82;
  const crackY = ey + eh * 0.5;
  const zig = [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 1].map((u, i) => [ex - 10 + u * (ew + 20), crackY + (i % 2 ? -22 : 14)]);
  const zigPath = zig.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const bottomClip = `${zigPath} L${ex + ew + 20},${ey + eh + 10} L${ex - 10},${ey + eh + 10} Z`;
  const topClip = `${zigPath} L${ex + ew + 20},${ey - 10} L${ex - 10},${ey - 10} Z`;
  const egg = eggSvg(4);
  const petCx = ex + ew / 2;
  const petCy = crackY - 120;
  const tip = [c.paw[0] + 250, c.paw[1] - 300];
  const bob = [tip[0] + 10, WATER + 8];
  const stars = [
    [90, 90, 5], [220, 170, 3], [400, 70, 4], [520, 190, 3], [700, 60, 5], [880, 140, 3], [960, 60, 4], [330, 260, 3], [980, 300, 3],
  ].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff7d6"/>`).join('');
  return frame(`
<defs>
  <clipPath id="eggBottom"><path d="${bottomClip}"/></clipPath>
  <clipPath id="eggTop"><path d="${topClip}"/></clipPath>
  <clipPath id="eggShape"><ellipse cx="${ex + ew / 2}" cy="${ey + eh * 0.56}" rx="${ew * 0.47}" ry="${eh * 0.46}"/></clipPath>
</defs>
<rect width="1024" height="1024" fill="url(#dusk)"/>
${stars}
${place(pieces.moon.svg, 60, 40, 200, 200)}
${place(sceneryPieces('cozy').hillsFar.svg, -300, WATER - 230, 1600, 260, 'opacity="0.85"')}
<rect y="${WATER}" width="1024" height="${1024 - WATER}" fill="url(#seaDusk)"/>
${wave(WATER + 2, '#d9e4ff', 8)}
<ellipse cx="${petCx}" cy="${petCy}" rx="380" ry="360" fill="url(#pinkGlow)"/>
${rays(petCx, petCy, 460, 16, '#fff2c4', 0.32, 4)}
${[[petCx - 230, petCy - 170, 64], [petCx + 210, petCy - 210, 56], [petCx + 260, petCy + 40, 44], [petCx - 270, petCy + 60, 40], [petCx - 40, petCy - 290, 46]].map(([x, y, z]) => sparkle(x, y, z)).join('')}
${place(pieces.lily.svg, ex - 110, WATER - 30, 520, 242)}
${place(petSvg('sunny_axolotl'), petCx - 175, petCy - 175, 350, 350)}
<g clip-path="url(#eggBottom)">${place(egg, ex, ey, ew, eh)}</g>
<path d="${zigPath}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round" clip-path="url(#eggShape)"/>
<g transform="translate(150 -330) rotate(30 ${ex + ew / 2} ${crackY})"><g clip-path="url(#eggTop)">${place(egg, ex, ey, ew, eh)}</g><path d="${zigPath}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round" clip-path="url(#eggShape)"/></g>
${[[ex - 40, crackY - 110, 30, 20], [ex + ew + 30, crackY - 80, 26, -30], [ex + 20, crackY - 230, 22, 50]].map(([x, y, r, a]) => `<path d="M${x},${y} q${r * 0.6},${-r * 0.5} ${r},${-r * 0.2} l${-r * 0.2},${r * 0.9} q${-r * 0.5},${r * 0.1} ${-r * 0.8},${-r * 0.7} Z" transform="rotate(${a} ${x} ${y})" fill="#fff1a8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`).join('')}
${place(cozy.dock.svg, -260, deck - 70 * 1.9, 360 * 1.9, 300 * 1.9)}
<path d="M${tip[0]},${tip[1]} Q${tip[0] + 30},${(tip[1] + bob[1]) / 2} ${bob[0]},${bob[1] - 10}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.9"/>
${place(itemSvg('bobber'), bob[0] - 22, bob[1] - 46, 44, 60)}
${c.svg}
${rod(c.paw, tip, [c.paw[0] + 120, c.paw[1] - 200], 0.9)}
`);
}

// ---------- C: close-up ----------
function optionC() {
  const s = 4.3;
  const c = cat(-200, 250, s, -7);
  const WATER = 800;
  const f = fish('golden_duckfish', 790, 430, 400, 28);
  const tip = [700, 120];
  const clouds = place(pieces.cloud.svg, 520, 40, 260, 130) + place(pieces.cloud.svg, -40, 120, 220, 110, 'opacity="0.9"');
  return frame(`
<rect width="1024" height="1024" fill="url(#day)"/>
${clouds}
${place(cozy.hillsFar.svg, -400, WATER - 220, 1600, 260)}
<rect y="${WATER}" width="1024" height="${1024 - WATER}" fill="url(#sea)"/>
${wave(WATER + 2)}
<ellipse cx="790" cy="430" rx="330" ry="300" fill="url(#gold)"/>
${rays(790, 430, 360, 14, '#fff3b0', 0.3, 12)}
${sparkle(960, 210, 64)}${sparkle(610, 600, 44)}${sparkle(980, 560, 40)}${sparkle(560, 250, 34)}
${splash(840, WATER, 110, 14, 3)}
<path d="M${tip[0]},${tip[1]} L${f.mouth[0]},${f.mouth[1]}" fill="none" stroke="#ffffff" stroke-width="6"/>
${f.svg}
${c.svg}
${rod(c.paw, tip, [c.paw[0] + 330, c.paw[1] - 170], 1.35)}
${place(pieces.lily.svg, 800, 900, 230, 107)}
${place(petSvg('reed_duckling'), 815, 760, 190, 190)}
`);
}

mkdirSync(outDir, { recursive: true });
const opts: Record<string, () => string> = { A: optionA, B: optionB, C: optionC };
for (const k of only.split('')) {
  const svg = opts[k]();
  writeFileSync(`${outDir}/thumb_${k}.svg`, svg);
  await sharp(Buffer.from(svg), { density: 72 * (S / 1024) }).resize(S, S).png().toFile(`${outDir}/thumb_${k}.png`);
  console.log('wrote', `${outDir}/thumb_${k}.png`);
}
