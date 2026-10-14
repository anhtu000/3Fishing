// Small helpers for the game's vector art. Every sprite is an SVG string drawn in code (original art,
// no third-party assets) and turned into a texture at load time (see textures.ts).
//
// House style (quality checklist in the design doc): flat vector, one outline colour, one soft shadow,
// one highlight, big friendly eyes. Keep every new sprite to these rules so the game reads as one style.

export const OUTLINE = '#3b2a4d';
export const OUTLINE_W = 4.5;

let uid = 0;
/** Unique id prefix for gradients and clip paths inside one SVG. */
export function nextId(prefix: string) {
  uid += 1;
  return `${prefix}${uid}`;
}

export function svg(w: number, h: number, defs: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
}

export function linear(id: string, stops: [number, string, number?][], x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  const s = stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${s}</linearGradient>`;
}

export function radial(id: string, stops: [number, string, number?][], cx = 0.5, cy = 0.5, r = 0.5, fx?: number, fy?: number) {
  const s = stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${s}</radialGradient>`;
}

/** Outlined path. */
/** Default stroke width unless `extra` sets its own (XML forbids the same attribute twice). */
function sw(extra: string) {
  return extra.includes('stroke-width') ? '' : ` stroke-width="${OUTLINE_W}"`;
}

/** Default outline colour unless `extra` sets its own stroke. */
function sc(extra: string) {
  return /(^|\s)stroke="/.test(extra) ? '' : ` stroke="${OUTLINE}"`;
}

export function path(d: string, fill: string, extra = '') {
  return `<path d="${d}" fill="${fill}"${sc(extra)}${sw(extra)} stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
}

/** Path without outline. */
export function flat(d: string, fill: string, extra = '') {
  return `<path d="${d}" fill="${fill}" ${extra}/>`;
}

export function line(d: string, color = OUTLINE, width = OUTLINE_W, extra = '') {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

export function circle(cx: number, cy: number, r: number, fill: string, outlined = true, extra = '') {
  const stroke = outlined ? `${sc(extra)}${sw(extra)}` : '';
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${stroke} ${extra}/>`;
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, fill: string, outlined = true, extra = '') {
  const stroke = outlined ? `${sc(extra)}${sw(extra)}` : '';
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${stroke} ${extra}/>`;
}

/** Number formatting for path data. */
export function f(n: number) {
  return Math.round(n * 10) / 10;
}

/** Big cute eye: white, pupil looking forward, two glints. */
export function eye(cx: number, cy: number, r: number, pupil = '#2b1d38', look = 0.18) {
  const pr = r * 0.66;
  const px = cx + r * look;
  return (
    circle(cx, cy, r, '#ffffff', true, `stroke-width="${OUTLINE_W * 0.85}"`) +
    circle(px, cy + r * 0.04, pr, pupil, false) +
    circle(px + pr * 0.32, cy - pr * 0.38, pr * 0.34, '#ffffff', false) +
    circle(px - pr * 0.36, cy + pr * 0.36, pr * 0.15, '#ffffff', false, 'opacity="0.85"')
  );
}

/** Closed happy eye (^), for sleeping or delighted pets. */
export function happyEye(cx: number, cy: number, r: number) {
  return line(`M${f(cx - r)},${f(cy + r * 0.3)} Q${f(cx)},${f(cy - r * 0.9)} ${f(cx + r)},${f(cy + r * 0.3)}`, OUTLINE, OUTLINE_W * 0.9);
}

/** Mix two "#rrggbb" colours. t = 0 gives a, 1 gives b. */
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`;
}

export const darken = (c: string, t: number) => mix(c, '#1e1030', t);
export const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
