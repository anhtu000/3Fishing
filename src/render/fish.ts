// Fish art: one parametric fish drawn as SVG, 16 species + 2 bosses with their own shape and markings.
// Facing right. ViewBox 260 x 160, body centred on y = 80.
import { OUTLINE, OUTLINE_W, circle, darken, ellipse, eye, f, flat, lighten, line, linear, nextId, path, radial, svg } from './svg';

export type TailKind = 'fork' | 'round' | 'fan' | 'flow' | 'lunate' | 'spade';
export type DorsalKind = 'none' | 'small' | 'tall' | 'sail' | 'spiky' | 'long';
export type PatternKind = 'none' | 'stripes' | 'spots' | 'patches' | 'scales' | 'band' | 'dots' | 'bolt' | 'leaves' | 'clover' | 'plates';
export type Extra = 'whiskers' | 'barbels' | 'lantern' | 'bill' | 'crown' | 'teeth' | 'snout' | 'hook' | 'lily' | 'bubbles' | 'brows' | 'scar' | 'glow' | 'ghost' | 'mist' | 'sparkle' | 'cup';

export interface FishArt {
  /** Body length (nose to tail joint) and half heights, in viewBox units. */
  len: number;
  top: number;
  bottom: number;
  /** 0..1 along the body (0 = tail joint), where the back is highest. */
  peak?: number;
  /** Tail stalk half height. */
  stalk?: number;
  /** Nose height relative to centre line (+ = lower). */
  nose?: number;
  tail: TailKind;
  tailSize?: number;
  dorsal: DorsalKind;
  /** Main colours: back, side, belly, fins. */
  back: string;
  side: string;
  belly: string;
  fin: string;
  pattern?: PatternKind;
  patternColor?: string;
  extras?: Extra[];
  eyeScale?: number;
  /** Body opacity, for ghost fish. */
  alpha?: number;
}

/** Height of every fish texture; the width depends on the species (see fishSize). */
export const FISH_H = 190;

/** Texture size of a fish, and where its nose sits. Long fish get a wider texture so nothing is cut. */
export function fishSize(a: FishArt) {
  const ts = a.tailSize ?? 1;
  const tail = 46 * ts * (a.tail === 'flow' ? 1.55 : a.tail === 'fan' ? 1.3 : 1.15);
  const front = a.extras?.some((e) => e === 'bill' || e === 'snout' || e === 'lantern' || e === 'bubbles') ? 46 : 26;
  const w = Math.ceil(16 + tail + a.len + front);
  return { w, h: FISH_H, nose: w - front };
}

export function fishSvg(a: FishArt): string {
  const { w: W, h: H, nose } = fishSize(a);
  const cy = 98;
  const x1 = nose; // nose
  const x0 = x1 - a.len; // tail joint
  const pk = x0 + a.len * (a.peak ?? 0.48);
  const st = a.stalk ?? a.top * 0.32;
  const ny = cy + (a.nose ?? 4);
  const ht = a.top;
  const hb = a.bottom;
  const ex = new Set(a.extras ?? []);
  const id = nextId('f');
  const bodyId = `${id}b`;
  const clip = `${id}c`;
  const shade = `${id}s`;
  const finG = `${id}fn`;
  const glowG = `${id}gl`;

  const body =
    `M${f(x1)},${f(ny)} ` +
    `C${f(x1)},${f(ny - ht * 0.78)} ${f(pk + (x1 - pk) * 0.42)},${f(cy - ht)} ${f(pk)},${f(cy - ht)} ` +
    `C${f(pk - (pk - x0) * 0.55)},${f(cy - ht)} ${f(x0 + (pk - x0) * 0.22)},${f(cy - st * 1.25)} ${f(x0)},${f(cy - st)} ` +
    `L${f(x0)},${f(cy + st)} ` +
    `C${f(x0 + (pk - x0) * 0.22)},${f(cy + st * 1.25)} ${f(pk - (pk - x0) * 0.4)},${f(cy + hb)} ${f(pk + (x1 - pk) * 0.05)},${f(cy + hb)} ` +
    `C${f(pk + (x1 - pk) * 0.5)},${f(cy + hb)} ${f(x1)},${f(ny + hb * 0.72)} ${f(x1)},${f(ny)} Z`;

  const defs =
    linear(bodyId, [
      [0, a.back],
      [0.45, a.side],
      [0.78, a.belly],
      [1, a.belly],
    ]) +
    linear(finG, [
      [0, lighten(a.fin, 0.25)],
      [1, a.fin],
    ], 1, 0, 0, 0) +
    linear(shade, [
      [0, '#000', 0],
      [0.62, '#000', 0],
      [1, '#1e1030', 0.28],
    ]) +
    radial(glowG, [
      [0, '#fff8c4', 0.9],
      [0.5, '#ffe36e', 0.55],
      [1, '#ffe36e', 0],
    ]) +
    `<clipPath id="${clip}"><path d="${body}"/></clipPath>`;

  const fins: string[] = [];
  const over: string[] = [];
  const back: string[] = [];
  const fin = `url(#${finG})`;

  // Tail
  const ts = a.tailSize ?? 1;
  const tl = 46 * ts;
  const th = (ht + hb) * 0.5 * ts;
  const tx = x0 + 6;
  let tail = '';
  switch (a.tail) {
    case 'fork':
      tail = `M${f(tx)},${f(cy - st)} C${f(x0 - tl * 0.4)},${f(cy - st - th * 0.3)} ${f(x0 - tl * 0.8)},${f(cy - th * 0.95)} ${f(x0 - tl)},${f(cy - th)} C${f(x0 - tl * 0.78)},${f(cy - th * 0.35)} ${f(x0 - tl * 0.5)},${f(cy - 4)} ${f(x0 - tl * 0.42)},${f(cy)} C${f(x0 - tl * 0.5)},${f(cy + 4)} ${f(x0 - tl * 0.78)},${f(cy + th * 0.35)} ${f(x0 - tl)},${f(cy + th)} C${f(x0 - tl * 0.8)},${f(cy + th * 0.95)} ${f(x0 - tl * 0.4)},${f(cy + st + th * 0.3)} ${f(tx)},${f(cy + st)} Z`;
      break;
    case 'lunate':
      tail = `M${f(tx)},${f(cy - st)} C${f(x0 - tl * 0.5)},${f(cy - th * 0.5)} ${f(x0 - tl * 0.9)},${f(cy - th * 1.05)} ${f(x0 - tl * 1.05)},${f(cy - th * 1.1)} Q${f(x0 - tl * 0.55)},${f(cy)} ${f(x0 - tl * 1.05)},${f(cy + th * 1.1)} C${f(x0 - tl * 0.9)},${f(cy + th * 1.05)} ${f(x0 - tl * 0.5)},${f(cy + th * 0.5)} ${f(tx)},${f(cy + st)} Z`;
      break;
    case 'round':
      tail = `M${f(tx)},${f(cy - st)} C${f(x0 - tl * 0.5)},${f(cy - th * 0.9)} ${f(x0 - tl * 1.1)},${f(cy - th * 0.8)} ${f(x0 - tl * 1.05)},${f(cy)} C${f(x0 - tl * 1.1)},${f(cy + th * 0.8)} ${f(x0 - tl * 0.5)},${f(cy + th * 0.9)} ${f(tx)},${f(cy + st)} Z`;
      break;
    case 'spade':
      tail = `M${f(tx)},${f(cy - st)} C${f(x0 - tl * 0.4)},${f(cy - th * 0.7)} ${f(x0 - tl * 0.95)},${f(cy - th * 0.55)} ${f(x0 - tl * 1.1)},${f(cy)} C${f(x0 - tl * 0.95)},${f(cy + th * 0.55)} ${f(x0 - tl * 0.4)},${f(cy + th * 0.7)} ${f(tx)},${f(cy + st)} Z`;
      break;
    case 'fan': {
      // wide frilly fan with three lobes
      const r = th * 1.15;
      tail =
        `M${f(tx)},${f(cy - st)} C${f(x0 - tl * 0.3)},${f(cy - r * 0.7)} ${f(x0 - tl * 0.8)},${f(cy - r * 1.1)} ${f(x0 - tl * 1.05)},${f(cy - r * 0.95)} ` +
        `Q${f(x0 - tl * 0.95)},${f(cy - r * 0.45)} ${f(x0 - tl * 1.2)},${f(cy - r * 0.3)} Q${f(x0 - tl * 1.0)},${f(cy)} ${f(x0 - tl * 1.2)},${f(cy + r * 0.3)} ` +
        `Q${f(x0 - tl * 0.95)},${f(cy + r * 0.45)} ${f(x0 - tl * 1.05)},${f(cy + r * 0.95)} C${f(x0 - tl * 0.8)},${f(cy + r * 1.1)} ${f(x0 - tl * 0.3)},${f(cy + r * 0.7)} ${f(tx)},${f(cy + st)} Z`;
      break;
    }
    case 'flow': {
      // long flowing koi tail
      const r = th * 1.05;
      const L = tl * 1.45;
      tail =
        `M${f(tx)},${f(cy - st)} C${f(x0 - L * 0.3)},${f(cy - r * 0.9)} ${f(x0 - L * 0.7)},${f(cy - r * 1.25)} ${f(x0 - L)},${f(cy - r * 0.7)} ` +
        `Q${f(x0 - L * 0.78)},${f(cy - r * 0.2)} ${f(x0 - L * 1.02)},${f(cy + r * 0.15)} Q${f(x0 - L * 0.72)},${f(cy + r * 0.35)} ${f(x0 - L * 0.95)},${f(cy + r * 1.05)} ` +
        `C${f(x0 - L * 0.6)},${f(cy + r * 1.1)} ${f(x0 - L * 0.25)},${f(cy + r * 0.8)} ${f(tx)},${f(cy + st)} Z`;
      break;
    }
  }
  back.push(path(tail, fin));
  // Tail rays
  back.push(line(`M${f(x0 - 2)},${f(cy)} L${f(x0 - tl * 0.7)},${f(cy)}`, darken(a.fin, 0.25), 2.2, 'opacity="0.5"'));
  back.push(line(`M${f(x0 - 2)},${f(cy - 4)} L${f(x0 - tl * 0.72)},${f(cy - th * 0.5)}`, darken(a.fin, 0.25), 2.2, 'opacity="0.5"'));
  back.push(line(`M${f(x0 - 2)},${f(cy + 4)} L${f(x0 - tl * 0.72)},${f(cy + th * 0.5)}`, darken(a.fin, 0.25), 2.2, 'opacity="0.5"'));

  // Dorsal fin (behind body)
  const dTop = cy - ht + 8;
  const dx = pk;
  switch (a.dorsal) {
    case 'small':
      fins.push(path(`M${f(dx - 26)},${f(dTop + 4)} C${f(dx - 20)},${f(dTop - 20)} ${f(dx + 2)},${f(dTop - 24)} ${f(dx + 16)},${f(dTop - 2)} Z`, fin));
      break;
    case 'tall':
      fins.push(path(`M${f(dx - 34)},${f(dTop + 6)} C${f(dx - 30)},${f(dTop - 30)} ${f(dx - 6)},${f(dTop - 44)} ${f(dx + 6)},${f(dTop - 40)} C${f(dx + 8)},${f(dTop - 20)} ${f(dx + 18)},${f(dTop - 6)} ${f(dx + 22)},${f(dTop + 2)} Z`, fin));
      break;
    case 'sail': {
      const s0 = x0 + a.len * 0.18;
      const s1 = pk + 26;
      fins.push(
        path(
          `M${f(s0)},${f(cy - ht * 0.62)} C${f(s0 + 6)},${f(cy - ht - 46)} ${f(s1 - 40)},${f(cy - ht - 58)} ${f(s1 - 8)},${f(cy - ht - 30)} C${f(s1)},${f(cy - ht - 18)} ${f(s1 + 6)},${f(cy - ht - 6)} ${f(s1 + 8)},${f(cy - ht + 8)} Z`,
          fin,
        ),
      );
      for (let i = 1; i < 5; i++) {
        const x = s0 + ((s1 - s0) * i) / 5;
        back.push('');
        fins.push(line(`M${f(x)},${f(cy - ht + 4)} L${f(x + 4)},${f(cy - ht - 34 - i * 2)}`, darken(a.fin, 0.2), 2, 'opacity="0.55"'));
      }
      break;
    }
    case 'spiky': {
      let d = `M${f(dx - 40)},${f(dTop + 6)}`;
      for (let i = 0; i < 5; i++) {
        const x = dx - 40 + i * 14;
        d += ` L${f(x + 6)},${f(dTop - 22 - (i % 2) * 6)} L${f(x + 14)},${f(dTop + 2)}`;
      }
      d += ' Z';
      fins.push(path(d, fin));
      break;
    }
    case 'long':
      fins.push(path(`M${f(x0 + a.len * 0.12)},${f(cy - st - 2)} C${f(x0 + a.len * 0.2)},${f(cy - ht - 14)} ${f(pk + 10)},${f(cy - ht - 18)} ${f(pk + 30)},${f(cy - ht + 4)} Z`, fin));
      break;
    case 'none':
      break;
  }
  // Belly fins (behind body)
  fins.push(path(`M${f(pk - 4)},${f(cy + hb - 8)} C${f(pk - 10)},${f(cy + hb + 18)} ${f(pk - 30)},${f(cy + hb + 22)} ${f(pk - 36)},${f(cy + hb + 14)} C${f(pk - 30)},${f(cy + hb + 4)} ${f(pk - 22)},${f(cy + hb - 4)} ${f(pk - 18)},${f(cy + hb - 10)} Z`, fin));
  fins.push(path(`M${f(x0 + a.len * 0.3)},${f(cy + hb * 0.75)} C${f(x0 + a.len * 0.24)},${f(cy + hb + 10)} ${f(x0 + a.len * 0.12)},${f(cy + hb + 10)} ${f(x0 + a.len * 0.08)},${f(cy + hb * 0.55)} Z`, fin));

  // Extras behind body
  if (ex.has('whiskers')) {
    back.push(line(`M${f(x1 - 6)},${f(ny + 2)} C${f(x1 + 14)},${f(ny + 10)} ${f(x1 + 18)},${f(ny + 30)} ${f(x1 + 6)},${f(ny + 44)}`, OUTLINE, 4));
    back.push(line(`M${f(x1 - 10)},${f(ny + 6)} C${f(x1 + 2)},${f(ny + 22)} ${f(x1 - 4)},${f(ny + 38)} ${f(x1 - 18)},${f(ny + 48)}`, OUTLINE, 3.5));
  }
  if (ex.has('lantern')) {
    const lx = x1 - 18;
    const ly = cy - ht - 6;
    back.push(line(`M${f(lx - 10)},${f(cy - ht * 0.7)} C${f(lx - 6)},${f(ly - 30)} ${f(lx + 26)},${f(ly - 40)} ${f(lx + 30)},${f(ly - 18)}`, OUTLINE, 4));
    back.push(circle(lx + 31, ly - 12, 24, `url(#${glowG})`, false));
  }

  // Body
  over.push(path(body, `url(#${bodyId})`, a.alpha != null ? `fill-opacity="${a.alpha}"` : ''));

  // Pattern, clipped to body
  const pc = a.patternColor ?? darken(a.side, 0.25);
  const pat: string[] = [];
  const L = a.len;
  switch (a.pattern) {
    case 'stripes':
      for (let i = 0; i < 4; i++) {
        const x = x0 + L * (0.22 + i * 0.16);
        pat.push(flat(`M${f(x - 7)},${f(cy - ht - 4)} Q${f(x + 6)},${f(cy)} ${f(x - 4)},${f(cy + hb + 4)} L${f(x + 6)},${f(cy + hb + 4)} Q${f(x + 16)},${f(cy)} ${f(x + 5)},${f(cy - ht - 4)} Z`, pc, 'opacity="0.75"'));
      }
      break;
    case 'band':
      pat.push(flat(`M${f(x0 - 4)},${f(cy - 2)} C${f(x0 + L * 0.4)},${f(cy - 14)} ${f(x0 + L * 0.7)},${f(cy - 10)} ${f(x1)},${f(cy - 6)} L${f(x1)},${f(cy + 6)} C${f(x0 + L * 0.7)},${f(cy + 4)} ${f(x0 + L * 0.4)},${f(cy + 4)} ${f(x0 - 4)},${f(cy + 10)} Z`, pc, 'opacity="0.85"'));
      break;
    case 'spots':
      for (const [u, v, r] of [
        [0.25, -0.45, 6],
        [0.4, -0.15, 8],
        [0.55, -0.5, 7],
        [0.32, 0.25, 5],
        [0.68, -0.25, 6],
        [0.18, -0.05, 5],
        [0.48, 0.3, 5],
      ]) {
        pat.push(circle(x0 + L * u, cy + ht * v, r, pc, false, 'opacity="0.8"'));
      }
      break;
    case 'dots':
      for (let i = 0; i < 14; i++) {
        const u = 0.12 + ((i * 37) % 70) / 100;
        const v = -0.7 + ((i * 53) % 100) / 100;
        pat.push(circle(x0 + L * u, cy + ht * v, 3.2, pc, false, 'opacity="0.85"'));
      }
      break;
    case 'patches':
      pat.push(flat(`M${f(x0 + L * 0.15)},${f(cy - ht)} C${f(x0 + L * 0.35)},${f(cy - ht * 0.2)} ${f(x0 + L * 0.5)},${f(cy - ht * 0.6)} ${f(x0 + L * 0.58)},${f(cy - ht * 1.1)} Z`, pc));
      pat.push(flat(`M${f(x0 + L * 0.62)},${f(cy - ht)} C${f(x0 + L * 0.66)},${f(cy - ht * 0.3)} ${f(x0 + L * 0.82)},${f(cy - ht * 0.1)} ${f(x0 + L * 0.9)},${f(cy - ht * 0.75)} Z`, pc));
      pat.push(flat(`M${f(x0 + L * 0.3)},${f(cy + hb)} C${f(x0 + L * 0.36)},${f(cy + hb * 0.2)} ${f(x0 + L * 0.5)},${f(cy + hb * 0.25)} ${f(x0 + L * 0.52)},${f(cy + hb)} Z`, pc, 'opacity="0.9"'));
      break;
    case 'scales':
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 6; i++) {
          const x = x0 + L * (0.18 + i * 0.1) + (r % 2) * 7;
          const y = cy - ht * 0.45 + r * ht * 0.42;
          pat.push(line(`M${f(x - 7)},${f(y - 5)} Q${f(x + 2)},${f(y)} ${f(x - 7)},${f(y + 5)}`, pc, 2.2, 'opacity="0.55"'));
        }
      }
      break;
    case 'bolt':
      pat.push(flat(`M${f(x0 + L * 0.12)},${f(cy - 4)} L${f(x0 + L * 0.34)},${f(cy - 16)} L${f(x0 + L * 0.4)},${f(cy - 2)} L${f(x0 + L * 0.62)},${f(cy - 18)} L${f(x0 + L * 0.58)},${f(cy - 2)} L${f(x0 + L * 0.78)},${f(cy - 10)} L${f(x0 + L * 0.6)},${f(cy + 8)} L${f(x0 + L * 0.54)},${f(cy - 4)} L${f(x0 + L * 0.34)},${f(cy + 8)} L${f(x0 + L * 0.32)},${f(cy - 6)} Z`, pc));
      break;
    case 'leaves':
      for (const [u, v, rot] of [
        [0.25, -0.35, -20],
        [0.42, -0.5, 15],
        [0.58, -0.3, -10],
        [0.35, 0.1, 30],
        [0.7, -0.55, 20],
      ]) {
        const x = x0 + L * u;
        const y = cy + ht * v;
        pat.push(flat(`M${f(x - 10)},${f(y)} Q${f(x)},${f(y - 9)} ${f(x + 10)},${f(y)} Q${f(x)},${f(y + 9)} ${f(x - 10)},${f(y)} Z`, pc, `opacity="0.8" transform="rotate(${rot} ${f(x)} ${f(y)})"`));
      }
      break;
    case 'clover':
      for (const [u, v] of [
        [0.28, -0.35],
        [0.5, -0.5],
        [0.42, 0.05],
        [0.66, -0.2],
      ]) {
        const x = x0 + L * u;
        const y = cy + ht * v;
        for (let k = 0; k < 4; k++) {
          const a2 = (k * Math.PI) / 2 + Math.PI / 4;
          pat.push(circle(x + Math.cos(a2) * 4.5, y + Math.sin(a2) * 4.5, 4.6, pc, false, 'opacity="0.85"'));
        }
      }
      break;
    case 'plates':
      for (let i = 0; i < 6; i++) {
        const x = x0 + L * (0.14 + i * 0.13);
        pat.push(flat(`M${f(x - 7)},${f(cy - ht * 0.72)} L${f(x)},${f(cy - ht * 0.98)} L${f(x + 7)},${f(cy - ht * 0.72)} L${f(x)},${f(cy - ht * 0.5)} Z`, pc, `stroke="${OUTLINE}" stroke-width="2"`));
        pat.push(flat(`M${f(x - 5)},${f(cy + hb * 0.25)} L${f(x)},${f(cy + hb * 0.05)} L${f(x + 5)},${f(cy + hb * 0.25)} L${f(x)},${f(cy + hb * 0.45)} Z`, lighten(pc, 0.3), 'opacity="0.8"'));
      }
      break;
  }
  if (ex.has('lily')) {
    const x = x0 + L * 0.45;
    const y = cy - ht * 0.35;
    pat.push(flat(`M${f(x)},${f(y)} m-14,0 a14,12 0 1,0 28,0 a14,12 0 1,0 -28,0 M${f(x)},${f(y)} L${f(x + 14)},${f(y - 3)} L${f(x + 12)},${f(y + 5)} Z`, '#7ccf6a', 'opacity="0.95"'));
    pat.push(circle(x - 4, y - 2, 4, '#ffd6ec', false));
  }
  // belly sheen + bottom shade + top highlight
  pat.push(ellipse(x0 + L * 0.55, cy + hb * 0.55, L * 0.42, hb * 0.38, lighten(a.belly, 0.35), false, 'opacity="0.45"'));
  pat.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${shade})" />`);
  pat.push(ellipse(x0 + L * 0.62, cy - ht * 0.58, L * 0.26, ht * 0.18, '#ffffff', false, 'opacity="0.42"'));
  over.push(`<g clip-path="url(#${clip})">${pat.join('')}</g>`);
  // Re-stroke the body outline over the pattern
  over.push(`<path d="${body}" fill="none" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>`);

  // Gill
  const gx = x1 - L * 0.3;
  over.push(line(`M${f(gx)},${f(cy - ht * 0.55)} Q${f(gx + 12)},${f(cy + 2)} ${f(gx)},${f(cy + hb * 0.6)}`, darken(a.side, 0.35), 3, 'opacity="0.7"'));
  // Pectoral fin on top of body
  const pfx = gx - 8;
  const pfy = cy + hb * 0.18;
  over.push(path(`M${f(pfx + 8)},${f(pfy - 6)} C${f(pfx - 6)},${f(pfy - 4)} ${f(pfx - 22)},${f(pfy + 8)} ${f(pfx - 24)},${f(pfy + 18)} C${f(pfx - 10)},${f(pfy + 18)} ${f(pfx + 4)},${f(pfy + 10)} ${f(pfx + 10)},${f(pfy + 2)} Z`, fin, `stroke-width="${OUTLINE_W * 0.85}"`));

  // Face
  const es = a.eyeScale ?? 1;
  const er = Math.min(ht, hb) * 0.36 * es + 5;
  const exx = x1 - L * 0.15;
  const eyy = cy - ht * 0.18;
  if (ex.has('bill')) {
    over.push(path(`M${f(x1 - 10)},${f(ny - 12)} C${f(x1 + 14)},${f(ny - 18)} ${f(x1 + 30)},${f(ny - 8)} ${f(x1 + 26)},${f(ny + 2)} C${f(x1 + 20)},${f(ny + 10)} ${f(x1 + 2)},${f(ny + 12)} ${f(x1 - 10)},${f(ny + 8)} Z`, '#ffa53a'));
    over.push(line(`M${f(x1 - 6)},${f(ny - 1)} Q${f(x1 + 10)},${f(ny + 1)} ${f(x1 + 24)},${f(ny - 2)}`, OUTLINE, 2.5));
  }
  if (ex.has('snout')) {
    over.push(path(`M${f(x1 - 8)},${f(ny - 10)} C${f(x1 + 10)},${f(ny - 12)} ${f(x1 + 26)},${f(ny - 6)} ${f(x1 + 26)},${f(ny)} C${f(x1 + 26)},${f(ny + 6)} ${f(x1 + 8)},${f(ny + 8)} ${f(x1 - 8)},${f(ny + 8)} Z`, a.side));
  }
  if (ex.has('teeth')) {
    for (let i = 0; i < 3; i++) over.push(flat(`M${f(x1 - 10 + i * 7)},${f(ny + 2)} l3,6 l3,-6 Z`, '#ffffff', `stroke="${OUTLINE}" stroke-width="1.6"`));
  }
  if (ex.has('barbels')) {
    over.push(line(`M${f(x1 - 4)},${f(ny + 4)} q8,10 2,18`, OUTLINE, 3));
    over.push(line(`M${f(x1 - 10)},${f(ny + 6)} q4,10 -4,16`, OUTLINE, 3));
  }
  over.push(eye(exx, eyy, er));
  if (ex.has('brows')) {
    over.push(line(`M${f(exx - er * 1.1)},${f(eyy - er * 1.15)} Q${f(exx)},${f(eyy - er * 1.7)} ${f(exx + er * 1.2)},${f(eyy - er * 1.05)}`, '#e9e2d4', 7));
  }
  if (ex.has('scar')) {
    over.push(line(`M${f(exx - er * 2.4)},${f(eyy - er * 1.4)} l10,22 M${f(exx - er * 2.6)},${f(eyy - er * 0.7)} l12,-4`, '#f7d9c4', 3.2));
  }
  if (!ex.has('bill') && !ex.has('snout')) {
    over.push(line(`M${f(x1 - 14)},${f(ny + 4)} Q${f(x1 - 7)},${f(ny + 10)} ${f(x1 - 1)},${f(ny + 3)}`, OUTLINE, 3.2));
  }
  // blush
  over.push(ellipse(exx - er * 0.3, eyy + er * 1.45, er * 0.62, er * 0.32, '#ff7aa8', false, 'opacity="0.35"'));
  if (ex.has('hook')) {
    over.push(line(`M${f(x1 - 2)},${f(ny - 8)} Q${f(x1 + 10)},${f(ny - 2)} ${f(x1 + 2)},${f(ny + 10)}`, OUTLINE, 4));
  }
  if (ex.has('crown')) {
    const cx = pk + 6;
    const cy2 = cy - ht - 2;
    over.push(path(`M${f(cx - 18)},${f(cy2 + 4)} L${f(cx - 20)},${f(cy2 - 16)} L${f(cx - 9)},${f(cy2 - 6)} L${f(cx)},${f(cy2 - 20)} L${f(cx + 9)},${f(cy2 - 6)} L${f(cx + 20)},${f(cy2 - 16)} L${f(cx + 18)},${f(cy2 + 4)} Z`, '#ffd23f'));
    over.push(circle(cx, cy2 - 6, 3.2, '#ff5d8f', false));
  }
  if (ex.has('bubbles')) {
    over.push(circle(x1 + 14, ny - 22, 7, '#d9f6ff', true, `stroke-width="2.5" fill-opacity="0.6"`));
    over.push(circle(x1 + 22, ny - 40, 4.5, '#d9f6ff', true, `stroke-width="2.2" fill-opacity="0.6"`));
  }
  if (ex.has('cup')) {
    // tiny teacup-pattern dots on back like porcelain
    over.push(line(`M${f(x0 + L * 0.3)},${f(cy - ht * 0.82)} Q${f(x0 + L * 0.5)},${f(cy - ht * 1.02)} ${f(x0 + L * 0.72)},${f(cy - ht * 0.82)}`, '#3f7fd6', 3, 'opacity="0.7"'));
  }
  if (ex.has('sparkle')) {
    for (const [sx, sy, s] of [
      [x0 + L * 0.3, cy - ht - 16, 9],
      [x1 + 10, cy - ht + 4, 7],
      [x0 + L * 0.65, cy + hb + 14, 6],
    ]) {
      over.push(flat(`M${f(sx)},${f(sy - s)} Q${f(sx + s * 0.18)},${f(sy - s * 0.18)} ${f(sx + s)},${f(sy)} Q${f(sx + s * 0.18)},${f(sy + s * 0.18)} ${f(sx)},${f(sy + s)} Q${f(sx - s * 0.18)},${f(sy + s * 0.18)} ${f(sx - s)},${f(sy)} Q${f(sx - s * 0.18)},${f(sy - s * 0.18)} ${f(sx)},${f(sy - s)} Z`, '#fff6b8', `stroke="${OUTLINE}" stroke-width="2"`));
    }
  }

  const g = a.alpha != null ? `<g opacity="${Math.min(1, a.alpha + 0.25)}">` : '<g>';
  return svg(W, H, defs, `${g}${back.join('')}${fins.join('')}${over.join('')}</g>`);
}

/** Art for every fish id. Names and stats are in content/fish.json. */
export const FISH_ART: Record<string, FishArt> = {
  // ---------- Cozy Pond ----------
  pebble_minnow: { len: 150, top: 30, bottom: 26, tail: 'fork', tailSize: 0.8, dorsal: 'small', back: '#6f9fc4', side: '#a6cde6', belly: '#eef6fb', fin: '#8fb8d8', pattern: 'spots', patternColor: '#5a7f9f' },
  lily_carp: { len: 160, top: 40, bottom: 34, peak: 0.52, tail: 'round', dorsal: 'tall', back: '#f27aa1', side: '#ff9ebd', belly: '#ffe3ec', fin: '#ff8fb3', pattern: 'scales', patternColor: '#d94f7f', extras: ['lily'] },
  mud_guppy: { len: 130, top: 30, bottom: 28, tail: 'fan', tailSize: 1.15, dorsal: 'small', back: '#8b6a4f', side: '#b48b62', belly: '#f1dcc0', fin: '#e39a4f', pattern: 'dots', patternColor: '#6d4f37' },
  bubble_perch: { len: 160, top: 40, bottom: 32, tail: 'fork', dorsal: 'spiky', back: '#4fb37a', side: '#8fdb87', belly: '#f2f9c9', fin: '#ff9c4a', pattern: 'stripes', patternColor: '#2e7d58', extras: ['bubbles'] },
  clover_trout: { len: 176, top: 34, bottom: 30, tail: 'spade', dorsal: 'small', back: '#3f9c63', side: '#86c96d', belly: '#f6f3c8', fin: '#7ab65c', pattern: 'clover', patternColor: '#1f6b3f' },
  teacup_koi: { len: 150, top: 34, bottom: 30, tail: 'flow', tailSize: 1.05, dorsal: 'long', back: '#fffaf3', side: '#fff3e6', belly: '#ffffff', fin: '#ffd9c2', pattern: 'patches', patternColor: '#ff6b3d', extras: ['cup'] },
  lantern_catfish: { len: 180, top: 38, bottom: 34, peak: 0.6, nose: 10, tail: 'round', dorsal: 'small', back: '#3c3f78', side: '#5b5fa8', belly: '#c9c7f2', fin: '#4b4f92', pattern: 'spots', patternColor: '#2a2c5c', extras: ['whiskers', 'lantern'], eyeScale: 0.85 },
  golden_duckfish: { len: 150, top: 40, bottom: 36, peak: 0.55, tail: 'fan', dorsal: 'tall', back: '#ffb81c', side: '#ffd34d', belly: '#fff3b0', fin: '#ffc53d', pattern: 'scales', patternColor: '#e08a00', extras: ['bill', 'crown', 'sparkle'] },
  // ---------- Misty Creek ----------
  fog_shiner: { len: 156, top: 28, bottom: 26, tail: 'fork', dorsal: 'small', back: '#8aa3c9', side: '#c8d8f0', belly: '#f6fbff', fin: '#b6c8e6', pattern: 'band', patternColor: '#e7f3ff', extras: ['sparkle'] },
  stone_loach: { len: 190, top: 22, bottom: 22, peak: 0.55, stalk: 12, nose: 6, tail: 'round', tailSize: 0.7, dorsal: 'long', back: '#7b7468', side: '#a39b8b', belly: '#e8e1d2', fin: '#958c7b', pattern: 'spots', patternColor: '#5d564b', extras: ['barbels'], eyeScale: 0.85 },
  willow_dace: { len: 176, top: 28, bottom: 24, tail: 'fork', dorsal: 'small', back: '#5e9e6e', side: '#a8d49a', belly: '#f2f8de', fin: '#9ccc8a', pattern: 'leaves', patternColor: '#3d7b4f' },
  mist_salmon: { len: 186, top: 36, bottom: 30, tail: 'fork', dorsal: 'small', back: '#4d6fa8', side: '#f08a74', belly: '#ffe0d2', fin: '#e07a66', pattern: 'dots', patternColor: '#3a4f7e', extras: ['hook'] },
  rainbow_grayling: { len: 176, top: 32, bottom: 28, tail: 'fork', dorsal: 'sail', back: '#6f7fc8', side: '#b6c0f0', belly: '#f4f1ff', fin: '#c58cf0', pattern: 'dots', patternColor: '#ff7cc0' },
  ghost_pike: { len: 210, top: 26, bottom: 24, peak: 0.42, nose: 2, tail: 'fork', dorsal: 'small', back: '#b9e4ee', side: '#dff5fa', belly: '#ffffff', fin: '#c4ecf4', pattern: 'band', patternColor: '#9fd8e6', extras: ['snout', 'teeth'], alpha: 0.72 },
  thunder_sturgeon: { len: 215, top: 30, bottom: 28, peak: 0.45, nose: 0, tail: 'lunate', dorsal: 'small', back: '#44476e', side: '#6e72a8', belly: '#d7d9f2', fin: '#585c8e', pattern: 'plates', patternColor: '#ffd23f', extras: ['snout', 'barbels'] },
  silver_spirit_trout: { len: 186, top: 34, bottom: 30, tail: 'flow', dorsal: 'tall', back: '#d9e6ff', side: '#f0f5ff', belly: '#ffffff', fin: '#cfe0ff', pattern: 'scales', patternColor: '#9db7f0', extras: ['sparkle', 'crown'], alpha: 0.85 },
  // ---------- Bosses ----------
  old_whiskers: { len: 200, top: 44, bottom: 40, peak: 0.6, nose: 12, tail: 'round', dorsal: 'small', back: '#5a4a3a', side: '#806a52', belly: '#e3d3b6', fin: '#6d5a46', pattern: 'spots', patternColor: '#3f3227', extras: ['whiskers', 'brows', 'scar'], eyeScale: 0.8 },
  fog_pike: { len: 215, top: 30, bottom: 28, peak: 0.42, nose: 2, tail: 'fork', tailSize: 1.15, dorsal: 'tall', back: '#7c8fb3', side: '#b7c6e0', belly: '#eef3fb', fin: '#9fb0d3', pattern: 'band', patternColor: '#dbe6f7', extras: ['snout', 'teeth', 'brows'] },
};
