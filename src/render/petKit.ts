// Art v2 helpers: same outline colour and friendly shapes as v1, plus volume:
// a base gradient, a clipped form shadow, rim light, texture strokes inside the shape, layered eyes.
import { OUTLINE, OUTLINE_W, circle, darken, ellipse, f, flat, lighten, line, linear, mix, nextId, path, radial } from './svg';

export { OUTLINE, OUTLINE_W, circle, darken, ellipse, f, flat, lighten, line, linear, mix, nextId, path, radial };

export interface Base {
  id: string;
  defs: string[];
}

let n = 0;
export function uid(b: Base, p: string) {
  n += 1;
  return `${b.id}${p}${n}`;
}

/** Soft top-left lit gradient for a body colour. */
export function bodyGrad(b: Base, c: string, cx = 0.38, cy = 0.3) {
  const g = uid(b, 'bg');
  b.defs.push(radial(g, [
    [0, lighten(c, 0.32)],
    [0.55, c],
    [1, darken(c, 0.16)],
  ], cx, cy, 0.85));
  return `url(#${g})`;
}

/**
 * A shaded shape: fill, then everything in `inside` clipped to the shape (shadows, markings, fur),
 * then the outline on top so the inner detail never spills over the edge.
 * shadow: a path for the form shadow (drawn in a darker tone, soft).
 */
export function shape(b: Base, d: string, fill: string, o: { inside?: string; shadow?: string; shadowColor?: string; rim?: boolean; outline?: string; width?: number } = {}) {
  const clip = uid(b, 'cl');
  b.defs.push(`<clipPath id="${clip}"><path d="${d}"/></clipPath>`);
  const blur = `${b.id}soft`;
  if (!b.defs.some((d) => d.includes(`id="${blur}"`))) b.defs.push(`<filter id="${blur}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>`);
  const sh = o.shadow ? flat(o.shadow, o.shadowColor ?? '#2a1840', `opacity="0.2" filter="url(#${blur})"`) : '';
  return (
    flat(d, fill) +
    `<g clip-path="url(#${clip})">${sh}${o.inside ?? ''}</g>` +
    // rim light: inner light edge on the top-left, done as an offset white stroke clipped to the shape
    (o.rim === false ? '' : `<g clip-path="url(#${clip})">${line(d, '#ffffff', 6, 'opacity="0.28" transform="translate(3,3)"')}</g>`) +
    line(d, o.outline ?? OUTLINE, o.width ?? OUTLINE_W)
  );
}

/** Short fur strokes along a curve-ish area, drawn in a darker tone (use inside a clipped shape). */
export function furStrokes(points: [number, number, number][], color: string, w = 2.2, opacity = 0.35) {
  // each point: x, y, angle in degrees; draws a small tapered tick
  let d = '';
  for (const [x, y, a] of points) {
    const r = (a * Math.PI) / 180;
    const dx = Math.cos(r) * 7;
    const dy = Math.sin(r) * 7;
    d += `M${f(x)},${f(y)} q${f(dx * 0.4 - dy * 0.25)},${f(dy * 0.4 + dx * 0.25)} ${f(dx)},${f(dy)} `;
  }
  return line(d, color, w, `opacity="${opacity}"`);
}

/** Layered eye: sclera with lid shadow, gradient iris, pupil, two glints and a lower reflection. */
export function eye2(b: Base, cx: number, cy: number, r: number, iris: string, look = 0.12) {
  const g = uid(b, 'ir');
  b.defs.push(radial(g, [
    [0, lighten(iris, 0.55)],
    [0.55, iris],
    [1, darken(iris, 0.45)],
  ], 0.5, 0.75, 0.75));
  const clip = uid(b, 'ec');
  b.defs.push(`<clipPath id="${clip}"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/></clipPath>`);
  const ix = cx + r * look;
  const ir = r * 0.8;
  return (
    circle(cx, cy, r, '#ffffff', false) +
    `<g clip-path="url(#${clip})">` +
    circle(ix, cy + r * 0.08, ir, `url(#${g})`, false) +
    circle(ix, cy + r * 0.1, ir * 0.52, '#1d1029', false) +
    // lid shadow
    ellipse(cx, cy - r * 0.95, r * 1.2, r * 0.55, '#2a1840', false, 'opacity="0.14"') +
    // lower iris shine
    path(`M${f(ix - ir * 0.6)},${f(cy + r * 0.45)} Q${f(ix)},${f(cy + r * 0.95)} ${f(ix + ir * 0.6)},${f(cy + r * 0.45)}`, 'none', `stroke="${lighten(iris, 0.7)}" stroke-width="${f(r * 0.14)}" opacity="0.7"`) +
    '</g>' +
    circle(cx, cy, r, 'none', true, `stroke-width="${f(OUTLINE_W * 0.9)}"`) +
    // upper lash line, thicker
    line(`M${f(cx - r * 1.02)},${f(cy - r * 0.1)} Q${f(cx)},${f(cy - r * 1.32)} ${f(cx + r * 1.02)},${f(cy - r * 0.1)}`, OUTLINE, OUTLINE_W * 1.0) +
    circle(ix + ir * 0.32, cy - ir * 0.3, ir * 0.3, '#ffffff', false) +
    circle(ix - ir * 0.35, cy + ir * 0.38, ir * 0.13, '#ffffff', false, 'opacity="0.9"') +
    circle(ix + ir * 0.5, cy + ir * 0.12, ir * 0.08, '#ffffff', false, 'opacity="0.8"')
  );
}

/** Soft gradient blush. */
export function blush(b: Base, cx: number, cy: number, rx: number, ry: number, c = '#ff6f9f') {
  const g = uid(b, 'bl');
  b.defs.push(radial(g, [
    [0, c, 0.6],
    [1, c, 0],
  ]));
  return ellipse(cx, cy, rx, ry, `url(#${g})`, false) + line(`M${f(cx - rx * 0.35)},${f(cy - 1)} l3,-3 M${f(cx)},${f(cy)} l3,-3 M${f(cx + rx * 0.35)},${f(cy - 1)} l3,-3`, '#ffffff', 1.6, 'opacity="0.55"');
}

/** Four-point sparkle. */
export function sparkle(x: number, y: number, r: number, color: string, opacity = 1) {
  const k = r * 0.28;
  return flat(`M${f(x)},${f(y - r)} Q${f(x + k)},${f(y - k)} ${f(x + r)},${f(y)} Q${f(x + k)},${f(y + k)} ${f(x)},${f(y + r)} Q${f(x - k)},${f(y + k)} ${f(x - r)},${f(y)} Q${f(x - k)},${f(y - k)} ${f(x)},${f(y - r)} Z`, color, `opacity="${opacity}"`);
}

/** Specular highlight blob. */
export function gloss(cx: number, cy: number, rx: number, ry: number, rot = -25, opacity = 0.55) {
  return ellipse(cx, cy, rx, ry, '#ffffff', false, `opacity="${opacity}" transform="rotate(${rot} ${f(cx)} ${f(cy)})"`);
}

/** Same rarity look as v1 (pets.ts rarityLayers), copied so the preview matches the game. */
export function rarityLayers(b: Base, rarity: number): { back: string; front: string } {
  let back = ellipse(100, 188, 58, 9, '#1d2a44', false, 'opacity="0.18"');
  let front = '';
  if (rarity >= 1) {
    const g = `${b.id}rgGround`;
    const col = ['#ffffff', '#7fe0b0', '#7fc6ff', '#c79bff', '#ffd23f'][rarity];
    b.defs.push(radial(g, [[0, col, 0.55], [1, col, 0]]));
    back = ellipse(100, 186, 84, 16, `url(#${g})`, false) + back;
  }
  if (rarity >= 2) {
    const a = `${b.id}rgAura`;
    const col = ['', '', '#8fd0ff', '#c9a4ff', '#ffe27a'][rarity];
    b.defs.push(radial(a, [[0, col, rarity === 4 ? 0.75 : 0.6], [0.6, col, rarity === 4 ? 0.35 : 0.25], [1, col, 0]]));
    back = circle(100, 104, 96, `url(#${a})`, false) + back;
  }
  if (rarity === 4) {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const a1 = ang - 0.11;
      const a2 = ang + 0.11;
      rays += `M100,104 L${f(100 + Math.cos(a1) * 98)},${f(104 + Math.sin(a1) * 98)} L${f(100 + Math.cos(a2) * 98)},${f(104 + Math.sin(a2) * 98)} Z `;
    }
    const rg = `${b.id}rgRays`;
    b.defs.push(radial(rg, [[0, '#fff3b0', 0.9], [0.75, '#fff3b0', 0.45], [1, '#fff3b0', 0]]));
    back = flat(rays, `url(#${rg})`) + back;
    back += ellipse(100, 188, 62, 11, 'none', false, 'stroke="#ffcf3a" stroke-width="4" opacity="0.8"');
  }
  if (rarity === 1) front += sparkle(170, 46, 9, '#ffffff', 0.95);
  if (rarity === 2) front += sparkle(168, 40, 11, '#ffffff') + sparkle(30, 70, 7, '#dff3ff') + sparkle(176, 120, 6, '#dff3ff', 0.9);
  if (rarity === 3) {
    front += sparkle(30, 56, 10, '#f1e4ff') + sparkle(178, 118, 8, '#ffffff') + sparkle(24, 134, 6, '#f1e4ff', 0.9);
    front += path('M166,22 L178,34 L166,52 L154,34 Z', '#b58bff', 'stroke-width="3.5"') + flat('M166,22 L172,34 L166,40 L160,34 Z', '#ffffff', 'opacity="0.55"') + sparkle(182, 18, 6, '#ffffff');
  }
  if (rarity === 4) front += sparkle(26, 48, 12, '#fff6c2') + sparkle(178, 36, 10, '#ffffff') + sparkle(182, 126, 8, '#ffe36e') + sparkle(20, 128, 7, '#ffe36e', 0.9) + sparkle(150, 14, 6, '#ffffff', 0.9);
  return { back, front };
}
