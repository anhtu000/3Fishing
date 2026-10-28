// Shore art (v1.15): everything above the waterline that is not the dock: distant range, far and
// near banks, trees and the three landmarks, plus the small sprites for the light ambient effects
// (birds, chimney smoke, butterflies). Same house style as the pets: one outline colour, a soft
// gradient per shape, a shaded side and a few light strokes. Underwater art stays in scenery.ts.
import type { PondPalette } from './scenery';
import { OUTLINE, circle, darken, ellipse, f, flat, lighten, line, linear, mix, nextId, path, radial, svg } from './svg';

export type Piece = { w: number; h: number; svg: string };

function piece(w: number, h: number, build: (id: string, defs: string[]) => string): Piece {
  const id = nextId('h');
  const defs: string[] = [];
  const body = build(id, defs);
  return { w, h, svg: svg(w, h, defs.join(''), body) };
}

/** Small deterministic random numbers, so the art is the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A smooth ridge line through points (x, y) as a path segment list (Catmull-Rom to cubic). */
function smooth(pts: [number, number][]) {
  let d = `L${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

function clip(defs: string[], id: string, d: string) {
  defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return `url(#${id})`;
}

// ---------------- Distant range (all ponds) ----------------

/**
 * The farthest layer, between the sky and the far bank: a pale range in the sky colour (aerial
 * perspective), so the scene has three depths instead of two.
 */
export function horizon(p: PondPalette): Piece {
  const w = 1600;
  // Taller than the far bank so its ridge shows above it (the far banks reach 210-350 px up).
  const h = p.land === 'meadow' ? 300 : 440;
  return piece(w, h, (id, defs) => {
    const col = mix(p.skyBottom, p.hillFar, p.land === 'peaks' ? 0.55 : 0.4);
    defs.push(linear(`${id}g`, [[0, lighten(col, 0.25)], [1, col]]));
    const r = rng(p.land === 'meadow' ? 3 : p.land === 'gorge' ? 5 : 9);
    const pts: [number, number][] = [];
    const n = p.land === 'meadow' ? 9 : 14;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w;
      const base = p.land === 'meadow' ? 36 : p.land === 'gorge' ? 14 : 22;
      const amp = p.land === 'meadow' ? 56 : 90;
      pts.push([x, base + (i % 2 ? 0.55 : 0) * amp + r() * amp * 0.6]);
    }
    const ridge = p.land === 'meadow' ? `M${smooth(pts).slice(1)}` : `M${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' L')}`;
    const d = `M0,${h} L${ridge.slice(1)} L${w},${h} Z`;
    // snow on the far peaks, soft haze at the foot
    let caps = '';
    if (p.land === 'peaks')
      for (let i = 1; i < pts.length - 1; i++) {
        const [x, y] = pts[i];
        if (y > pts[i - 1][1] || y > pts[i + 1][1]) continue;
        caps += flat(`M${f(x)},${f(y)} L${f(x + 30)},${f(y + 34)} L${f(x + 12)},${f(y + 26)} L${f(x)},${f(y + 38)} L${f(x - 14)},${f(y + 24)} L${f(x - 30)},${f(y + 34)} Z`, '#ffffff', 'opacity="0.85"');
      }
    defs.push(linear(`${id}z`, [[0, '#ffffff', 0], [1, '#ffffff', 0.55]]));
    return flat(d, `url(#${id}g)`) + line(ridge, lighten(col, 0.35), 3, 'opacity="0.8"') + caps + flat(`M0,${h - 90} L${w},${h - 90} L${w},${h} L0,${h} Z`, `url(#${id}z)`);
  });
}

// ---------------- Cozy Pond ----------------

/** Far meadow: rolling hills with a patchwork of fields, hedgerows and tiny trees. */
export function meadowFar(p: PondPalette): Piece {
  const w = 1600;
  const h = 260;
  return piece(w, h, (id, defs) => {
    const col = p.hillFar;
    const tops: [number, number][] = [[0, 110], [180, 62], [380, 104], [560, 52], [760, 96], [960, 58], [1160, 100], [1360, 66], [1600, 104]];
    const d = `M0,${h} ${smooth(tops)} L${w},${h} Z`;
    defs.push(linear(`${id}g`, [[0, lighten(col, 0.2)], [0.6, col], [1, darken(col, 0.06)]]));
    const cl = clip(defs, `${id}c`, d);
    const r = rng(11);
    let fields = '';
    // diagonal field bands, alternating tones
    for (let i = -4; i < 30; i++) {
      const x = i * 70;
      const tone = i % 3 === 0 ? lighten(col, 0.16) : i % 3 === 1 ? darken(col, 0.08) : mix(col, '#e8d77a', 0.25);
      fields += flat(`M${x},${h} L${x + 140},40 L${x + 210},40 L${x + 70},${h} Z`, tone, 'opacity="0.55"');
    }
    // hedgerows following the slopes
    let hedges = '';
    for (let i = 0; i < 9; i++) {
      const y = 120 + i * 16;
      hedges += line(`M0,${y} q200,${-20 + r() * 40} 400,${-10 + r() * 20} t400,0 t400,0 t400,0`, darken(col, 0.25), 3.2, 'opacity="0.45" stroke-dasharray="2 7"');
    }
    // tiny trees along the ridges
    let trees = '';
    for (let i = 0; i < 26; i++) {
      const x = 30 + i * 60 + r() * 30;
      const t = tops.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a));
      const y = t[1] + 18 + r() * 40;
      trees += line(`M${f(x)},${f(y)} v8`, p.trunk, 2.4) + circle(x, y - 3, 7 + r() * 3, i % 4 ? p.tree : p.treeDark, true, 'stroke-width="2.2"');
    }
    return flat(d, `url(#${id}g)`) + `<g clip-path="${cl}">${fields}${hedges}${trees}</g>` + line(`M${smooth(tops).slice(1)}`, OUTLINE, 4) + line(`M${smooth(tops.map(([x, y]) => [x, y + 6] as [number, number])).slice(1)}`, '#ffffff', 3, 'opacity="0.45"');
  });
}

/** Near meadow bank: grassy edge made of blades, bushes with flowers, wildflowers and clover. */
export function meadowNear(p: PondPalette): Piece {
  const w = 1600;
  const h = 260;
  return piece(w, h, (id, defs) => {
    const col = p.hillNear;
    const r = rng(21);
    // top edge: a soft curve with grass blades sticking up
    const base = (x: number) => 150 - 22 * Math.sin(x / 210) - 14 * Math.sin(x / 97 + 1);
    let top = `M0,${h} L0,${f(base(0))}`;
    for (let x = 0; x <= w; x += 12) {
      const y = base(x);
      top += ` L${f(x + 4)},${f(y - 6 - r() * 10)} L${f(x + 8)},${f(y)}`;
    }
    top += ` L${w},${h} Z`;
    defs.push(linear(`${id}g`, [[0, lighten(col, 0.16)], [0.5, col], [1, darken(col, 0.12)]]));
    const cl = clip(defs, `${id}c`, top);
    // inner texture: darker blades lower down, light streaks
    let blades = '';
    for (let i = 0; i < 120; i++) {
      const x = r() * w;
      const y = base(x) + 20 + r() * 90;
      blades += `M${f(x)},${f(y)} q${f(1 + r() * 3)},-8 ${f(r() * 6 - 3)},-14 `;
    }
    // bushes (clusters of 3 round blobs) with flowers
    let bushes = '';
    for (let i = 0; i < 9; i++) {
      const x = 80 + i * 180 + r() * 60;
      const y = base(x) + 10;
      const bc = i % 2 ? p.tree : mix(p.tree, p.hillNear, 0.4);
      defs.push(radial(`${id}b${i}`, [[0, lighten(bc, 0.25)], [1, darken(bc, 0.12)]], 0.35, 0.3, 0.8));
      bushes += path(`M${f(x - 40)},${f(y + 8)} C${f(x - 46)},${f(y - 18)} ${f(x - 20)},${f(y - 30)} ${f(x - 6)},${f(y - 20)} C${f(x)},${f(y - 40)} ${f(x + 34)},${f(y - 36)} ${f(x + 34)},${f(y - 14)} C${f(x + 50)},${f(y - 12)} ${f(x + 50)},${f(y + 8)} ${f(x + 36)},${f(y + 10)} Z`, `url(#${id}b${i})`, 'stroke-width="3.4"');
      bushes += flat(`M${f(x - 30)},${f(y + 6)} C${f(x)},${f(y - 2)} ${f(x + 30)},${f(y)} ${f(x + 40)},${f(y + 8)} Z`, darken(bc, 0.2), 'opacity="0.4"');
      for (let k = 0; k < 4; k++) bushes += circle(x - 24 + k * 16 + r() * 6, y - 18 - r() * 12, 3.2, ['#ffffff', '#ff9ec4', '#ffd23f', '#ff7a7a'][(i + k) % 4], false);
    }
    // wildflowers: stem + head
    let flowers = '';
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = base(x) + 24 + r() * 70;
      const c = ['#ffffff', '#ffd23f', '#ff9ec4', '#b89cff', '#7fc6ff'][i % 5];
      flowers += line(`M${f(x)},${f(y + 10)} q-2,-6 0,-12`, darken(col, 0.2), 2) + circle(x, y - 3, 4, c, true, 'stroke-width="1.8"') + circle(x, y - 3, 1.5, i % 5 === 1 ? '#ff9e3d' : '#ffe36e', false);
    }
    return flat(top, `url(#${id}g)`) + `<g clip-path="${cl}">${line(blades, darken(col, 0.2), 2.2, 'opacity="0.55"')}${flowers}</g>` + line(top.replace(/^M0,260 L/, 'M').replace(/ L1600,260 Z$/, ''), OUTLINE, 3.6) + bushes;
  });
}

/** Cozy Pond landmark: a timber-framed cottage with a shingle roof, warm windows, flowers and a path. */
export function cottage(): Piece {
  return piece(240, 200, (id, defs) => {
    defs.push(linear(`${id}r`, [[0, '#ff8a76'], [1, '#d9503f']]));
    defs.push(linear(`${id}w`, [[0, '#fff6e2'], [1, '#f1dcb8']]));
    defs.push(radial(`${id}l`, [[0, '#fff3b0'], [1, '#ffc65a']], 0.5, 0.5, 0.7));
    const roofD = 'M30,114 L120,40 L210,114 Z';
    const roofClip = clip(defs, `${id}rc`, roofD);
    let shingles = '';
    for (let row = 0; row < 6; row++) {
      const y = 56 + row * 11;
      for (let x = 20 + (row % 2) * 9; x < 220; x += 18) shingles += `M${x},${y} q9,8 18,0 `;
    }
    const win = (x: number) =>
      path(`M${x},122 L${x + 28},122 L${x + 28},150 L${x},150 Z`, `url(#${id}l)`, 'stroke-width="3"') +
      line(`M${x + 14},122 L${x + 14},150 M${x},136 L${x + 28},136`, OUTLINE, 2.6) +
      path(`M${x - 8},120 L${x},122 L${x},150 L${x - 8},152 Z`, '#6fae7a', 'stroke-width="2.4"') +
      path(`M${x + 36},120 L${x + 28},122 L${x + 28},150 L${x + 36},152 Z`, '#6fae7a', 'stroke-width="2.4"') +
      path(`M${x - 2},150 L${x + 30},150 L${x + 28},158 L${x},158 Z`, '#a8703f', 'stroke-width="2.4"') +
      circle(x + 5, 148, 3.5, '#ff8fab', false) + circle(x + 14, 147, 3.5, '#ffd23f', false) + circle(x + 23, 148, 3.5, '#ffffff', false);
    return (
      // chimney (smoke comes from the game, as particles)
      path('M160,70 L160,34 L184,34 L184,88 Z', '#c9a48a') + line('M160,46 h24 M160,58 h24 M172,34 v12 M166,46 v12 M178,58 v12', darken('#c9a48a', 0.25), 1.8) + path('M156,28 L188,28 L188,36 L156,36 Z', '#8a6a52', 'stroke-width="3"') +
      // walls with timber frame and a stone base
      path('M46,106 L194,106 L194,184 L46,184 Z', `url(#${id}w)`) +
      line('M46,118 L194,118 M80,106 L80,184 M160,106 L160,184 M46,168 L80,150 M194,168 L160,150', '#a8703f', 4) +
      path('M42,172 L198,172 L198,188 L42,188 Z', '#b9b4c8', 'stroke-width="3"') + line('M62,172 v16 M86,180 h20 M120,172 v8 M150,180 v8 M176,172 v16', darken('#b9b4c8', 0.25), 2) +
      // roof with shingle rows, a ridge and a light edge
      path(roofD, `url(#${id}r)`) + `<g clip-path="${roofClip}">${line(shingles, darken('#d9503f', 0.25), 2.2, 'opacity="0.7"')}${flat('M120,40 L210,114 L170,114 Z', '#2a1840', 'opacity="0.15"')}</g>` + line('M30,114 L120,40 L210,114', OUTLINE, 4.5) + line('M44,108 L120,48', '#ffffff', 3, 'opacity="0.45"') +
      // round-top door with a lamp, windows
      path('M106,184 L106,146 C106,134 134,134 134,146 L134,184 Z', '#b07a4a') + line('M113,146 v36 M120,142 v40 M127,146 v36', darken('#b07a4a', 0.25), 1.8) + circle(129, 166, 2.5, '#ffe36e', true, 'stroke-width="1.6"') +
      circle(146, 140, 5, `url(#${id}l)`, true, 'stroke-width="2.2"') + line('M146,134 v-6', OUTLINE, 2.2) +
      win(56) + win(164) +
      // path to the water and a picket fence
      flat('M106,186 C104,192 96,196 92,200 L148,200 C142,196 136,192 134,186 Z', '#e9d59e') +
      line('M4,176 L40,176 M200,176 L236,176 M4,186 L40,186 M200,186 L236,186', '#ffffff', 4) +
      [10, 24, 38, 204, 218, 232].map((x) => path(`M${x - 4},196 L${x - 4},168 L${x},162 L${x + 4},168 L${x + 4},196 Z`, '#ffffff', 'stroke-width="2.6"')).join('') +
      // a little mailbox
      line('M226,196 v-18', '#8a6a52', 3) + path('M218,166 L234,166 L234,178 L218,178 Z', '#7fc6ff', 'stroke-width="2.4"') + path('M234,168 l6,-3 v6 Z', '#ff6b6b', 'stroke-width="1.6"')
    );
  });
}

/** Big leafy tree: canopy of overlapping blobs, light on top, shaded below, a few apples. */
export function oakTree(p: PondPalette): Piece {
  return piece(160, 200, (id, defs) => {
    defs.push(linear(`${id}k`, [[0, lighten(p.trunk, 0.15)], [1, darken(p.trunk, 0.15)]], 0, 0, 1, 0));
    const blobs: [number, number, number][] = [[50, 92, 34], [110, 92, 34], [80, 70, 40], [44, 60, 28], [116, 58, 28], [80, 36, 30]];
    let canopy = '';
    blobs.forEach(([x, y, rr], i) => {
      defs.push(radial(`${id}c${i}`, [[0, lighten(p.tree, 0.28)], [0.7, p.tree], [1, p.treeDark]], 0.38, 0.3, 0.8));
      canopy += circle(x, y, rr, `url(#${id}c${i})`, true, 'stroke-width="3.6"');
    });
    return (
      path('M70,190 C72,160 70,130 62,112 L74,108 C80,124 82,140 84,150 C88,136 94,120 104,110 L112,116 C100,132 94,156 92,190 Z', `url(#${id}k)`) +
      line('M76,180 q2,-20 0,-40 M86,176 q-2,-14 2,-30', darken(p.trunk, 0.3), 2) +
      canopy +
      // shaded underside and leaf ticks
      flat('M20,98 C40,126 120,128 142,96 C138,118 116,130 80,130 C46,130 24,118 20,98 Z', p.treeDark, 'opacity="0.45"') +
      line('M40,80 q8,-6 16,0 M70,56 q8,-6 16,0 M98,80 q8,-6 16,0 M60,100 q8,-6 16,0 M100,104 q8,-6 16,0', p.treeDark, 2.6, 'opacity="0.7"') +
      line('M52,44 q8,-6 16,0 M86,22 q8,-6 16,0 M30,58 q6,-5 12,0', lighten(p.tree, 0.45), 2.6, 'opacity="0.8"') +
      (p.land === 'meadow' ? [[56, 84], [104, 70], [86, 104], [120, 96], [70, 50]].map(([x, y]) => circle(x, y, 5, '#ff6b6b', true, 'stroke-width="2"') + circle(x - 1.5, y - 1.5, 1.4, '#ffffff', false)).join('') : '')
    );
  });
}




/** Pine with shaded tiers (snow on the tiers at the Frozen Lake). */
export function pineTree(p: PondPalette): Piece {
  return piece(130, 220, (id, defs) => {
    defs.push(linear(`${id}t`, [[0, lighten(p.tree, 0.18)], [1, darken(p.tree, 0.1)]], 0, 0, 1, 0));
    const tiers: [number, number, number][] = [[8, 74, 34], [44, 132, 46], [92, 188, 58]];
    let out = path('M58,180 L72,180 L74,216 L56,216 Z', p.trunk);
    for (const [top, bottom, half] of tiers) {
      const d = `M65,${top} L${65 + half},${bottom} C${65 + half * 0.5},${bottom + 6} ${65 - half * 0.5},${bottom + 6} ${65 - half},${bottom} Z`;
      out += path(d, `url(#${id}t)`, 'stroke-width="3.6"') + flat(`M65,${top} L${65 + half},${bottom} C${65 + half * 0.6},${bottom + 5} ${65 + half * 0.2},${bottom + 6} 65,${bottom + 6} Z`, '#2a1840', 'opacity="0.15"');
      out += line(`M${65 - half * 0.5},${bottom - 10} l8,-6 M${65 + half * 0.3},${bottom - 14} l6,-5`, lighten(p.tree, 0.4), 2.4, 'opacity="0.7"');
      if (p.snow) out += path(`M65,${top} L${f(65 + half * 0.55)},${f(top + (bottom - top) * 0.55)} C${65 + 10},${f(top + (bottom - top) * 0.62)} ${65 - 6},${f(top + (bottom - top) * 0.5)} ${65 - 12},${f(top + (bottom - top) * 0.6)} L${f(65 - half * 0.55)},${f(top + (bottom - top) * 0.55)} Z`, '#ffffff', 'stroke-width="2.8"');
    }
    return out;
  });
}




// ---------------- Ambient effect sprites ----------------

/** Little bird seen from far: a dark "m" stroke (the game flaps it by squashing it). */
export function bird(): Piece {
  return piece(40, 20, () => line('M3,12 Q10,2 20,12 Q30,2 37,12', '#4a3b5c', 3.4));
}

/** Soft smoke puff. */
export function puff(): Piece {
  return piece(40, 40, (id, defs) => {
    defs.push(radial(`${id}p`, [[0, '#ffffff', 0.95], [0.6, '#ffffff', 0.6], [1, '#ffffff', 0]]));
    return circle(20, 20, 19, `url(#${id}p)`, false);
  });
}

/** Butterfly with two-tone wings (the game flaps it by squashing it). */
export function butterfly(): Piece {
  return piece(30, 24, () =>
    path('M15,12 C8,2 1,4 3,10 C4,14 10,14 15,12 Z', '#ffb3d1', 'stroke-width="1.8"') + path('M15,12 C22,2 29,4 27,10 C26,14 20,14 15,12 Z', '#ffb3d1', 'stroke-width="1.8"') +
    path('M15,13 C10,20 5,20 6,16 Z', '#ffe36e', 'stroke-width="1.6"') + path('M15,13 C20,20 25,20 24,16 Z', '#ffe36e', 'stroke-width="1.6"') + line('M15,8 v10', OUTLINE, 2),
  );
}
void ellipse;

// ================= v1.15 redesign (29/10): Misty Creek and Frozen Lake =================

/** Bumpy treetop edge along a ridge: small round crowns side by side (for forest silhouettes). */
function crownEdge(x0: number, x1: number, y: (x: number) => number, size: number, r: () => number) {
  let d = '';
  for (let x = x0; x < x1; x += size * (0.9 + r() * 0.5)) {
    const s = size * (0.7 + r() * 0.6);
    const yy = y(x) - s * (0.3 + r() * 0.4);
    d += `M${f(x - s)},${f(y(x) + s)} C${f(x - s)},${f(yy - s * 0.3)} ${f(x + s)},${f(yy - s * 0.3)} ${f(x + s)},${f(y(x) + s)} Z `;
  }
  return d;
}

/**
 * Misty Creek far side (dusk): three forest ridges stepping back into the haze, each one paler,
 * crowned with treetops, with fog lying between them and a pagoda roof on the middle ridge.
 */
export function mistyFar(p: PondPalette): Piece {
  const w = 1600;
  const h = 360;
  return piece(w, h, (id, defs) => {
    const r = rng(61);
    const layers: { base: number; amp: number; col: string; size: number }[] = [
      { base: 120, amp: 50, col: mix(p.hillFar, p.skyBottom, 0.45), size: 16 },
      { base: 190, amp: 40, col: mix(p.hillFar, p.hillNear, 0.3), size: 20 },
      { base: 260, amp: 30, col: p.hillNear, size: 26 },
    ];
    defs.push(linear(`${id}fog`, [[0, '#ffffff', 0], [1, '#ffffff', 0.75]]));
    let out = '';
    layers.forEach((L, i) => {
      const ph = r() * 6;
      const y = (x: number) => L.base - L.amp * (0.5 + 0.5 * Math.sin(x / (260 + i * 60) + ph)) - 12 * Math.sin(x / 90 + ph * 2);
      let ridge = `M0,${h} L0,${f(y(0))}`;
      for (let x = 0; x <= w; x += 20) ridge += ` L${x},${f(y(x))}`;
      ridge += ` L${w},${h} Z`;
      defs.push(linear(`${id}l${i}`, [[0, lighten(L.col, 0.1)], [1, darken(L.col, 0.05)]]));
      out += flat(ridge, `url(#${id}l${i})`) + flat(crownEdge(0, w, y, L.size, r), L.col);
      if (i === 2) out += line(ridge.replace(/^M0,360 L/, 'M').replace(/ L1600,360 Z$/, ''), OUTLINE, 3.4, 'opacity="0.0"');
      if (i === 1) {
        // a little pagoda roof peeking out of the trees
        const x = 1060;
        const yy = y(x) - 10;
        out += path(`M${x - 34},${yy} L${x + 34},${yy} L${x + 22},${yy - 12} L${x - 22},${yy - 12} Z`, darken(L.col, 0.3), 'stroke-width="2.4"') +
          path(`M${x - 26},${yy - 18} L${x + 26},${yy - 18} L${x + 16},${yy - 28} L${x - 16},${yy - 28} Z`, darken(L.col, 0.3), 'stroke-width="2.4"') +
          line(`M${x},${yy - 28} v-10`, darken(L.col, 0.4), 2.4) + flat(`M${x - 14},${yy} h28 v10 h-28 Z`, darken(L.col, 0.2)) + circle(x, yy + 4, 3, '#ffd98a', false);
      }
      // fog band in front of each ridge
      out += flat(`M0,${L.base - 10} L${w},${L.base - 20} L${w},${L.base + 50} L0,${L.base + 60} Z`, `url(#${id}fog)`, `opacity="${0.55 - i * 0.12}"`);
    });
    return out;
  });
}

/** Misty near bank: mossy boulders, ferns, bamboo, glowing mushrooms and stone lanterns. */
export function mistyNear(p: PondPalette): Piece {
  const w = 1600;
  const h = 260;
  return piece(w, h, (id, defs) => {
    const r = rng(71);
    const base = (x: number) => 170 - 14 * Math.sin(x / 180) - 8 * Math.sin(x / 63 + 2);
    let top = `M0,${h} L0,${f(base(0))}`;
    for (let x = 0; x <= w; x += 20) top += ` L${x},${f(base(x))}`;
    top += ` L${w},${h} Z`;
    defs.push(linear(`${id}g`, [[0, mix(p.weed2, p.hillNear, 0.35)], [1, darken(p.hillNear, 0.1)]]));
    defs.push(radial(`${id}glow`, [[0, '#ffe9a8', 0.9], [1, '#ffe9a8', 0]]));
    defs.push(radial(`${id}mg`, [[0, '#bff5e0', 0.8], [1, '#bff5e0', 0]]));
    let out = flat(top, `url(#${id}g)`) + line(top.replace(/^M0,260 L/, 'M').replace(/ L1600,260 Z$/, ''), OUTLINE, 3.6);
    // bamboo clumps
    for (const x0 of [140, 700, 1250]) {
      for (let k = 0; k < 4; k++) {
        const x = x0 + k * 14;
        const tall = 90 + r() * 50;
        const y0 = base(x) + 6;
        out += path(`M${x - 4},${f(y0)} L${x - 4},${f(y0 - tall)} L${x + 4},${f(y0 - tall)} L${x + 4},${f(y0)} Z`, k % 2 ? '#7ab08f' : '#8cc29f', 'stroke-width="2.6"');
        for (let j = 1; j < 4; j++) out += line(`M${x - 4},${f(y0 - (tall * j) / 4)} h8`, '#4f8a6a', 2.2);
        out += path(`M${x + 4},${f(y0 - tall * 0.8)} q16,-6 24,4 q-12,2 -24,-4 Z`, '#7ab08f', 'stroke-width="2"');
      }
    }
    // mossy boulders
    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 240 + r() * 80;
      const y = base(x) + 8;
      const rw = 34 + r() * 20;
      defs.push(radial(`${id}r${i}`, [[0, lighten(p.rock, 0.2)], [1, darken(p.rock, 0.15)]], 0.35, 0.3, 0.8));
      out += path(`M${f(x - rw)},${f(y + 10)} C${f(x - rw)},${f(y - rw * 0.9)} ${f(x + rw)},${f(y - rw * 0.9)} ${f(x + rw)},${f(y + 10)} Z`, `url(#${id}r${i})`, 'stroke-width="3.2"');
      out += path(`M${f(x - rw * 0.8)},${f(y - rw * 0.35)} C${f(x - rw * 0.4)},${f(y - rw * 0.8)} ${f(x + rw * 0.5)},${f(y - rw * 0.8)} ${f(x + rw * 0.7)},${f(y - rw * 0.4)} C${f(x + rw * 0.3)},${f(y - rw * 0.5)} ${f(x - rw * 0.3)},${f(y - rw * 0.5)} ${f(x - rw * 0.8)},${f(y - rw * 0.35)} Z`, p.weed2, 'stroke-width="2.2"');
    }
    // ferns
    for (let i = 0; i < 12; i++) {
      const x = r() * w;
      const y = base(x) + 12;
      for (const a of [-50, -25, 0, 25, 50]) {
        const rad = ((a - 90) * Math.PI) / 180;
        const ex = x + Math.cos(rad) * 30;
        const ey = y + Math.sin(rad) * 30;
        out += line(`M${f(x)},${f(y)} Q${f((x + ex) / 2 + a * 0.1)},${f((y + ey) / 2 - 6)} ${f(ex)},${f(ey)}`, p.weed, 3.2);
      }
    }
    // stone lanterns with a warm glow
    for (const x of [420, 980, 1480]) {
      const y = base(x) + 4;
      out += circle(x, y - 46, 34, `url(#${id}glow)`, false) +
        path(`M${x - 10},${y} L${x + 10},${y} L${x + 7},${y - 26} L${x - 7},${y - 26} Z`, '#a3a6c4', 'stroke-width="2.8"') +
        path(`M${x - 13},${y - 26} L${x + 13},${y - 26} L${x + 13},${y - 44} L${x - 13},${y - 44} Z`, '#b9bcd6', 'stroke-width="2.8"') +
        path(`M${x - 7},${y - 30} L${x + 7},${y - 30} L${x + 7},${y - 41} L${x - 7},${y - 41} Z`, '#ffd98a', 'stroke-width="2"') +
        path(`M${x - 20},${y - 44} L${x + 20},${y - 44} L${x + 8},${y - 56} L${x - 8},${y - 56} Z`, '#8f93b6', 'stroke-width="2.8"') + circle(x, y - 59, 4, '#8f93b6', true, 'stroke-width="2.2"');
    }
    // glowing mushrooms
    for (let i = 0; i < 10; i++) {
      const x = r() * w;
      const y = base(x) + 14 + r() * 30;
      out += circle(x, y - 4, 14, `url(#${id}mg)`, false) + path(`M${f(x - 7)},${f(y - 2)} C${f(x - 7)},${f(y - 12)} ${f(x + 7)},${f(y - 12)} ${f(x + 7)},${f(y - 2)} Z`, '#9ff0d0', 'stroke-width="2"') + line(`M${f(x)},${f(y - 2)} v6`, '#e6fff4', 2.4) + circle(x - 2, y - 7, 1.4, '#ffffff', false);
    }
    return out;
  });
}

/** Misty landmark: an old stone arch bridge over the creek, mossy, with two hanging lanterns. */
export function stoneBridge(p: PondPalette): Piece {
  return piece(320, 180, (id, defs) => {
    defs.push(linear(`${id}s`, [[0, lighten(p.rock, 0.18)], [1, darken(p.rock, 0.12)]]));
    defs.push(radial(`${id}l`, [[0, '#fff3c4', 0.95], [0.5, '#ffd98a', 0.5], [1, '#ffd98a', 0]]));
    const archD = 'M10,176 L10,96 C60,92 120,58 160,58 C200,58 260,92 310,96 L310,176 L262,176 C258,130 214,100 160,100 C106,100 62,130 58,176 Z';
    const cl = clip(defs, `${id}c`, archD);
    let stones = '';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1 - i / 8);
      const x1 = 160 + Math.cos(a) * 102;
      const y1 = 176 - Math.sin(a) * 76;
      const x2 = 160 + Math.cos(a) * 124;
      const y2 = 176 - Math.sin(a) * 100;
      stones += `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)} `;
    }
    const lantern = (x: number) =>
      circle(x, 116, 26, `url(#${id}l)`, false) + line(`M${x},90 v14`, OUTLINE, 2) +
      path(`M${x - 8},104 L${x + 8},104 L${x + 10},126 L${x - 10},126 Z`, '#ff9a6b', 'stroke-width="2.4"') + line(`M${x - 9},110 h18 M${x - 9},118 h18`, '#d9603f', 1.6) + path(`M${x - 6},126 h12 v4 h-12 Z`, '#5b4a6a', 'stroke-width="1.8"');
    return (
      flat(archD, `url(#${id}s)`) +
      `<g clip-path="${cl}">${line(stones, darken(p.rock, 0.25), 2.4)}${line('M10,112 C60,108 120,76 160,76 C200,76 260,108 310,112 M24,140 h30 M266,140 h30 M20,160 h24 M276,160 h26', darken(p.rock, 0.2), 2.2, 'opacity="0.7"')}${flat('M200,58 C240,64 280,92 310,96 L310,176 L262,176 C258,140 236,112 200,104 Z', '#2a1840', 'opacity="0.14"')}</g>` +
      line(archD.slice(0, -2), OUTLINE, 4) +
      // railing posts and moss
      line('M10,96 C60,92 120,58 160,58 C200,58 260,92 310,96', OUTLINE, 4) +
      [20, 60, 100, 140, 180, 220, 260, 300].map((x) => {
        const t = (x - 10) / 300;
        const yy = 96 - Math.sin(t * Math.PI) * 38;
        return path(`M${x - 5},${f(yy)} L${x - 5},${f(yy - 18)} L${x + 5},${f(yy - 18)} L${x + 5},${f(yy)} Z`, lighten(p.rock, 0.1), 'stroke-width="2.4"');
      }).join('') +
      line('M12,80 C62,76 120,42 160,42 C200,42 258,76 308,80', OUTLINE, 3.4) +
      flat('M14,94 C40,90 60,84 80,80 C70,90 50,96 30,100 Z M200,62 C220,64 240,70 256,78 C240,80 220,74 204,70 Z', p.weed2) +
      line('M70,104 q-2,14 2,24 M250,102 q2,16 -2,26 M120,86 q0,10 2,18', p.weed, 2.6) +
      lantern(110) + lantern(214)
    );
  });
}

/** Misty tree: a weeping willow with long hanging fronds. */
export function willow(p: PondPalette): Piece {
  return piece(170, 230, (id, defs) => {
    defs.push(radial(`${id}c`, [[0, lighten(p.tree, 0.3)], [0.7, p.tree], [1, p.treeDark]], 0.4, 0.3, 0.8));
    const r = rng(81);
    // fronds fall from the whole crown, in front of it, in three tones
    let fronds = '';
    for (let i = 0; i < 22; i++) {
      const x = 14 + i * 6.6;
      const y0 = 40 + Math.abs(i - 11) * 2.4;
      const len = 70 + r() * 70 - Math.abs(i - 11) * 2;
      const sway = (r() - 0.3) * 14;
      const c = [p.tree, lighten(p.tree, 0.15), p.treeDark][i % 3];
      fronds += path(`M${f(x - 4)},${f(y0)} C${f(x - 5 + sway)},${f(y0 + len * 0.5)} ${f(x - 3 + sway)},${f(y0 + len * 0.9)} ${f(x + sway)},${f(y0 + len)} C${f(x + 3 + sway)},${f(y0 + len * 0.9)} ${f(x + 5 + sway)},${f(y0 + len * 0.5)} ${f(x + 4)},${f(y0)} Z`, c, 'stroke-width="2"');
      fronds += line(`M${f(x + sway * 0.5)},${f(y0 + len * 0.3)} l-4,4 M${f(x + sway * 0.7)},${f(y0 + len * 0.55)} l4,4`, lighten(p.tree, 0.4), 1.6, 'opacity="0.8"');
    }
    return (
      path('M76,226 C78,190 74,160 66,120 L80,114 C86,150 90,170 92,190 C94,170 100,150 108,122 L118,128 C106,160 100,196 100,226 Z', p.trunk) +
      line('M84,200 q2,-16 0,-30 M94,206 q-2,-12 2,-24', darken(p.trunk, 0.3), 2) +
      path('M8,60 C4,30 40,10 84,14 C128,10 166,30 162,60 C150,72 20,72 8,60 Z', `url(#${id}c)`) +
      fronds +
      line('M40,30 q10,-8 20,0 M84,22 q10,-8 20,0 M116,34 q10,-8 20,0', lighten(p.tree, 0.45), 2.6, 'opacity="0.8"')
    );
  });
}

/**
 * Frozen Lake far side (redesigned 29/10): a slate rock cliff all along the far shore, with thick
 * pillow snow on its top and ledges, and one big frozen waterfall pouring from a notch in the cliff:
 * ice columns that widen as they fall, icicles hanging from a ledge, and an ice mound at the foot.
 * The big fall sits right of centre (x 880-990 of 1600) so phones in portrait see it; a second one
 * further right (1220-1300) shows on wide screens, where the HUD chips cover the centre.
 */
export function glacierFar(p: PondPalette): Piece {
  const w = 1600;
  const h = 380;
  return piece(w, h, (id, defs) => {
    const r = rng(93);
    defs.push(linear(`${id}rock`, [[0, '#a9b8d4'], [1, '#6f80a6']]));
    defs.push(linear(`${id}ice`, [[0, '#ffffff'], [0.35, '#dff6ff'], [1, '#8fcdef']]));
    defs.push(linear(`${id}col`, [[0, '#bfe8ff'], [0.5, '#ffffff'], [1, '#a8dcf6']], 0, 0, 1, 0));
    // cliff top line: irregular, with a notch where the fall starts
    const top = (x: number) => {
      const notch = x > 880 && x < 990 ? 26 * Math.sin(((x - 880) / 110) * Math.PI) : x > 1220 && x < 1300 ? 22 * Math.sin(((x - 1220) / 80) * Math.PI) : 0;
      return 150 + 26 * Math.sin(x / 170) + 14 * Math.sin(x / 61 + 1) + notch;
    };
    let cliff = `M0,${h} L0,${f(top(0))}`;
    for (let x = 0; x <= w; x += 16) cliff += ` L${x},${f(top(x))}`;
    cliff += ` L${w},${h} Z`;
    const cl = clip(defs, `${id}c`, cliff);
    // rock detail: vertical cracks, darker right faces, two snowy ledges
    let rock = '';
    for (let i = 0; i < 26; i++) {
      const x = i * 64 + r() * 30;
      rock += line(`M${f(x)},${f(top(x) + 20)} l${f(r() * 10 - 5)},${f(40 + r() * 60)} l${f(r() * 10 - 5)},${f(30 + r() * 50)}`, '#5c6c92', 2.4, 'opacity="0.7"');
      rock += flat(`M${f(x + 10)},${f(top(x + 10))} L${f(x + 40)},${f(top(x + 40))} L${f(x + 34)},${h} L${f(x + 16)},${h} Z`, '#2a1840', 'opacity="0.1"');
    }
    const ledge = (y: number) => {
      let d = '';
      for (let x = 0; x < w; x += 140 + r() * 80) {
        const lw = 60 + r() * 70;
        d += path(`M${f(x)},${f(y)} C${f(x + 10)},${f(y - 10)} ${f(x + lw - 10)},${f(y - 10)} ${f(x + lw)},${f(y)} C${f(x + lw * 0.7)},${f(y + 7)} ${f(x + lw * 0.3)},${f(y + 7)} ${f(x)},${f(y)} Z`, '#ffffff', 'stroke-width="2.4"');
      }
      return d;
    };
    rock += ledge(250) + ledge(318);
    // thick pillow snow along the top with a dripping edge and a blue underside
    let snow = `M0,${f(top(0) - 18)}`;
    for (let x = 0; x <= w; x += 40) snow += ` Q${x + 20},${f(Math.min(top(x), top(x + 40)) - 34)} ${x + 40},${f(top(x + 40) - 18)}`;
    let drip = '';
    for (let x = w; x >= 0; x -= 20) drip += ` L${x},${f(top(x) + 6 + ((x / 20) % 3) * 7)}`;
    const snowD = `${snow}${drip} Z`;
    const snowCap = path(snowD, '#ffffff', 'stroke-width="3.4"') + flat(`M0,${f(top(0))}${Array.from({ length: 81 }, (_, i) => ` L${i * 20},${f(top(i * 20) + 2)}`).join('')}${drip} Z`, '#c9daf0', 'opacity="0.8"');
    // snowy pines on the cliff top
    let pines = '';
    for (const x of [140, 260, 520, 640, 1140, 1380, 1480]) {
      const y = top(x) - 22;
      const s = 0.8 + r() * 0.5;
      pines += path(`M${x},${f(y - 50 * s)} L${f(x + 16 * s)},${f(y)} L${f(x - 16 * s)},${f(y)} Z`, p.treeDark, 'stroke-width="2.6"') + path(`M${x},${f(y - 50 * s)} L${f(x + 7 * s)},${f(y - 30 * s)} L${f(x - 7 * s)},${f(y - 30 * s)} Z`, '#ffffff', 'stroke-width="2"');
    }
    // frozen waterfalls: columns that widen as they fall, highlights, icicle fringe, ice mound
    const frozenFall = (fx0: number, fx1: number, ledgeY: number) => {
      const mid = (fx0 + fx1) / 2;
      const fallD = `M${fx0 + 8},${f(top(fx0 + 8) + 4)} C${fx0 + 30},${f(top(mid) + 10)} ${fx1 - 30},${f(top(mid) + 10)} ${fx1 - 8},${f(top(fx1 - 8) + 4)} L${fx1 + 24},${h} L${fx0 - 24},${h} Z`;
      const fcl = clip(defs, `${id}fc${fx0}`, fallD);
      let columns = '';
      const n = Math.round((fx1 - fx0 + 48) / 24);
      for (let k = 0; k < n; k++) {
        const x = fx0 - 20 + k * 24;
        columns += path(`M${x + 8},120 C${x + 4},220 ${x - 4},300 ${x - 8},${h} L${x + 20},${h} C${x + 18},300 ${x + 16},220 ${x + 18},120 Z`, `url(#${id}col)`, 'stroke="#7fb8e0" stroke-width="2"');
        columns += line(`M${x + 12},170 C${x + 10},230 ${x + 6},290 ${x + 4},350`, '#ffffff', 3, 'opacity="0.9"');
      }
      let icicles = '';
      for (let x = fx0 - 10; x < fx1 + 14; x += 10) icicles += path(`M${x - 4},${ledgeY} L${x + 4},${ledgeY} L${x},${ledgeY + 14 + ((x * 3) % 14)} Z`, '#e6f8ff', 'stroke="#7fb8e0" stroke-width="1.6"');
      return (
        flat(fallD, `url(#${id}ice)`) + `<g clip-path="${fcl}">${columns}</g>` + line(fallD.replace(/ Z$/, ''), OUTLINE, 3.4) +
        path(`M${fx0 - 30},${ledgeY} C${fx0},${ledgeY - 8} ${fx1},${ledgeY - 8} ${fx1 + 30},${ledgeY} C${fx1},${ledgeY + 6} ${fx0},${ledgeY + 6} ${fx0 - 30},${ledgeY} Z`, '#ffffff', 'stroke-width="2.4"') + icicles +
        path(`M${fx0 - 60},${h} C${fx0 - 40},344 ${fx1 + 40},344 ${fx1 + 60},${h} Z`, `url(#${id}ice)`, 'stroke-width="3"') + flat(`M${fx0 - 30},366 C${fx0},350 ${fx0 + 40},348 ${fx0 + 60},352 C${fx0 + 30},356 ${fx0},362 ${fx0 - 30},372 Z`, '#ffffff', 'opacity="0.8"') +
        flat(`M${mid - 10},200 l3,9 9,3 -9,3 -3,9 -3,-9 -9,-3 9,-3 Z`, '#ffffff')
      );
    };
    const fall = frozenFall(880, 990, 252) + frozenFall(1220, 1300, 270);
    // two thin frozen trickles elsewhere on the cliff
    const trickle = (x: number) => path(`M${x - 6},${f(top(x) + 4)} C${x - 8},${f(top(x) + 60)} ${x - 10},300 ${x - 12},${h} L${x + 10},${h} C${x + 8},300 ${x + 6},${f(top(x) + 60)} ${x + 6},${f(top(x) + 4)} Z`, `url(#${id}ice)`, 'stroke-width="2.6"') + line(`M${x},${f(top(x) + 20)} L${x - 2},${h - 10}`, '#ffffff', 2.4, 'opacity="0.9"');
    return flat(cliff, `url(#${id}rock)`) + `<g clip-path="${cl}">${rock}</g>` + line(cliff.replace(/^M0,380 L/, 'M').replace(/ L1600,380 Z$/, ''), OUTLINE, 3.6) + trickle(330) + trickle(1520) + fall + snowCap + pines;
  });
}

/** Frozen near bank: soft snow with blue shade, glowing ice crystal clusters, snowy shrubs. */
export function frostBank(p: PondPalette): Piece {
  const w = 1600;
  const h = 220;
  return piece(w, h, (id, defs) => {
    const r = rng(101);
    defs.push(linear(`${id}s`, [[0, '#ffffff'], [1, p.hillNear]]));
    defs.push(radial(`${id}g`, [[0, '#b8f0ff', 0.8], [1, '#b8f0ff', 0]]));
    const base = (x: number) => 128 - 20 * Math.sin(x / 200) - 10 * Math.sin(x / 77 + 1);
    let top = `M0,${h} L0,${f(base(0))}`;
    for (let x = 0; x <= w; x += 20) top += ` L${x},${f(base(x))}`;
    top += ` L${w},${h} Z`;
    const cl = clip(defs, `${id}c`, top);
    let shade = '';
    for (let i = 0; i < 8; i++) shade += flat(`M${i * 200 + 110},${h} C${i * 200 + 130},${f(base(i * 200 + 130) + 10)} ${i * 200 + 200},${f(base(i * 200 + 200) + 4)} ${i * 200 + 260},${h} Z`, '#9fb4dc', 'opacity="0.3"');
    let out = flat(top, `url(#${id}s)`) + `<g clip-path="${cl}">${shade}</g>` + line(top.replace(/^M0,220 L/, 'M').replace(/ L1600,220 Z$/, ''), OUTLINE, 3.6);
    // snowy shrubs
    for (let i = 0; i < 8; i++) {
      const x = 90 + i * 200 + r() * 50;
      const y = base(x) + 8;
      out += path(`M${f(x - 30)},${f(y + 6)} C${f(x - 34)},${f(y - 16)} ${f(x - 10)},${f(y - 26)} ${f(x)},${f(y - 16)} C${f(x + 8)},${f(y - 30)} ${f(x + 34)},${f(y - 20)} ${f(x + 30)},${f(y + 6)} Z`, p.treeDark, 'stroke-width="3"') +
        path(`M${f(x - 28)},${f(y - 6)} C${f(x - 20)},${f(y - 20)} ${f(x - 6)},${f(y - 22)} ${f(x)},${f(y - 14)} C${f(x + 10)},${f(y - 26)} ${f(x + 26)},${f(y - 18)} ${f(x + 28)},${f(y - 8)} C${f(x + 10)},${f(y - 10)} ${f(x - 10)},${f(y - 8)} ${f(x - 28)},${f(y - 6)} Z`, '#ffffff', 'stroke-width="2.4"');
    }
    // glowing ice crystals
    for (let i = 0; i < 7; i++) {
      const x = 180 + i * 220 + r() * 60;
      const y = base(x) + 10;
      out += circle(x, y - 16, 30, `url(#${id}g)`, false);
      for (const [dx, hh, lean] of [[-10, 26, -6], [0, 40, 2], [10, 22, 7]]) out += path(`M${f(x + dx - 6)},${f(y)} L${f(x + dx + lean)},${f(y - hh)} L${f(x + dx + 6)},${f(y)} Z`, '#cfefff', 'stroke-width="2.4"') + flat(`M${f(x + dx + lean)},${f(y - hh)} L${f(x + dx - 6)},${f(y)} L${f(x + dx)},${f(y)} Z`, '#ffffff', 'opacity="0.7"');
    }
    // sparkles
    for (let i = 0; i < 20; i++) {
      const x = (i * 211) % w;
      const y = base(x) + 20 + ((i * 37) % 60);
      out += flat(`M${x},${y - 6} L${x + 1.6},${y - 1.6} L${x + 6},${y} L${x + 1.6},${y + 1.6} L${x},${y + 6} L${x - 1.6},${y + 1.6} L${x - 6},${y} L${x - 1.6},${y - 1.6} Z`, '#ffffff');
    }
    return out;
  });
}

/** Frozen landmark: a log cabin with a thick snowy roof, warm windows, a wreath and a woodpile. */
export function logCabin(): Piece {
  return piece(260, 200, (id, defs) => {
    defs.push(linear(`${id}w`, [[0, '#b98258'], [1, '#8a5a3a']]));
    defs.push(radial(`${id}l`, [[0, '#fff3b0'], [1, '#ffb84d']], 0.5, 0.5, 0.7));
    defs.push(radial(`${id}gl`, [[0, '#ffd98a', 0.6], [1, '#ffd98a', 0]]));
    let logs = '';
    for (let i = 0; i < 6; i++) {
      const y = 108 + i * 14;
      logs += path(`M34,${y} L226,${y} L226,${y + 14} L34,${y + 14} Z`, `url(#${id}w)`, 'stroke-width="2.4"') + line(`M44,${y + 7} h40 M120,${y + 5} h30 M170,${y + 9} h40`, darken('#8a5a3a', 0.25), 1.6, 'opacity="0.7"');
      logs += circle(30, y + 7, 7, '#d9a77a', true, 'stroke-width="2"') + circle(30, y + 7, 3, '#b98258', false) + circle(230, y + 7, 7, '#d9a77a', true, 'stroke-width="2"') + circle(230, y + 7, 3, '#b98258', false);
    }
    const win = (x: number) => circle(x + 16, 136, 30, `url(#${id}gl)`, false) + path(`M${x},122 L${x + 32},122 L${x + 32},150 L${x},150 Z`, `url(#${id}l)`, 'stroke-width="3"') + line(`M${x + 16},122 v28 M${x},136 h32`, OUTLINE, 2.4) + path(`M${x - 4},150 L${x + 36},150 L${x + 34},156 L${x - 2},156 Z`, '#ffffff', 'stroke-width="2.2"');
    return (
      // stone chimney (smoke from the game)
      path('M184,90 L184,26 L208,26 L208,96 Z', '#a3a6c4') + line('M184,40 h24 M184,56 h24 M184,72 h24 M196,26 v14 M190,40 v16 M202,56 v16', darken('#a3a6c4', 0.25), 1.8) + path('M180,20 L212,20 C214,26 210,28 196,28 C182,28 178,26 180,20 Z', '#ffffff', 'stroke-width="2.6"') +
      logs +
      // door with a wreath, windows
      path('M114,192 L114,146 C114,136 146,136 146,146 L146,192 Z', '#7a4b3a') + line('M122,146 v44 M130,142 v48 M138,146 v44', darken('#7a4b3a', 0.25), 1.6) +
      circle(130, 158, 9, 'none', true, 'stroke="#4f9a6a" stroke-width="5"') + circle(130, 150, 2.6, '#ff6b6b', false) +
      win(56) + win(172) +
      // thick snowy roof with a drip edge and icicles
      path('M14,112 L130,42 L246,112 C226,122 210,110 196,120 C180,128 168,114 150,122 C134,130 120,116 104,124 C88,130 74,116 58,124 C42,130 28,118 14,112 Z', '#ffffff', 'stroke-width="4"') +
      flat('M130,42 L246,112 C226,122 210,110 196,120 L150,74 Z', '#c9daf0', 'opacity="0.6"') +
      [40, 72, 100, 160, 188, 220].map((x, i) => path(`M${x - 3},${118 + (i % 2) * 3} L${x + 3},${118 + (i % 2) * 3} L${x},${130 + (i % 3) * 4} Z`, '#e6f6ff', 'stroke-width="1.6"')).join('') +
      // woodpile and a lantern post
      [0, 1, 2].map((k) => circle(222 + k * 12, 186, 6, '#d9a77a', true, 'stroke-width="2"')).join('') + [0, 1].map((k) => circle(228 + k * 12, 175, 6, '#d9a77a', true, 'stroke-width="2"')).join('') + path('M216,180 C224,170 254,170 260,180 Z', '#ffffff', 'stroke-width="2"') +
      line('M14,196 v-40', '#5b4a3a', 3) + circle(14, 150, 14, `url(#${id}gl)`, false) + path('M8,142 h12 v14 h-12 Z', '#ffd98a', 'stroke-width="2"') + path('M6,140 h16 l-4,-6 h-8 Z', '#5b4a3a', 'stroke-width="1.8"')
    );
  });
}
