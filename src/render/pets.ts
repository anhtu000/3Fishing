// Pet art: chibi creatures sitting and facing the player. ViewBox 200 x 200, feet on y ~ 186.
import { ALL_PETS, petById } from '../content/data';
import { FROG_ART } from './petFrog';
import { COZY_ART } from './petsCozy';
import { LATE_ART } from './petsLate';
import { rarityLayers } from './petKit';
import { OUTLINE, OUTLINE_W, circle, darken, ellipse, eye, f, flat, happyEye, lighten, line, linear, nextId, path, svg } from './svg';

export const PET_W = 200;
export const PET_H = 200;

interface Base {
  id: string;
  defs: string[];
}

function shadeDefs(b: Base, name: string, c: string) {
  const g = `${b.id}${name}`;
  b.defs.push(linear(g, [
    [0, lighten(c, 0.18)],
    [0.6, c],
    [1, darken(c, 0.12)],
  ]));
  return `url(#${g})`;
}

/** Common face: eyes, blush, small mouth. */
function face(cx: number, cy: number, spread: number, r: number, mouth: 'smile' | 'w' | 'o' | 'none' = 'smile', closed = false) {
  const parts: string[] = [];
  if (closed) {
    parts.push(happyEye(cx - spread, cy, r * 0.8), happyEye(cx + spread, cy, r * 0.8));
  } else {
    parts.push(eye(cx - spread, cy, r, '#2b1d38', 0.05), eye(cx + spread, cy, r, '#2b1d38', 0.05));
  }
  parts.push(ellipse(cx - spread - r * 0.3, cy + r * 1.35, r * 0.75, r * 0.38, '#ff7aa8', false, 'opacity="0.45"'));
  parts.push(ellipse(cx + spread + r * 0.3, cy + r * 1.35, r * 0.75, r * 0.38, '#ff7aa8', false, 'opacity="0.45"'));
  const my = cy + r * 1.25;
  if (mouth === 'smile') parts.push(line(`M${f(cx - 7)},${f(my)} Q${f(cx)},${f(my + 8)} ${f(cx + 7)},${f(my)}`, OUTLINE, 3.6));
  if (mouth === 'w') parts.push(line(`M${f(cx - 10)},${f(my)} Q${f(cx - 5)},${f(my + 7)} ${f(cx)},${f(my)} Q${f(cx + 5)},${f(my + 7)} ${f(cx + 10)},${f(my)}`, OUTLINE, 3.4));
  if (mouth === 'o') parts.push(ellipse(cx, my + 3, 5, 6, '#7a2f4f', true, 'stroke-width="3"'));
  return parts.join('');
}

function highlight(cx: number, cy: number, rx: number, ry: number) {
  return ellipse(cx, cy, rx, ry, '#ffffff', false, 'opacity="0.4"');
}

function feet(color: string, y = 182, spread = 30, w = 22) {
  return ellipse(100 - spread, y, w, 12, color) + ellipse(100 + spread, y, w, 12, color);
}

type PetDraw = (b: Base) => string;

/** v1 drawings still in use (Creek Beaver, Aurora Hare); the other pets moved to the v1.15 art files. */
const PETS: Record<string, PetDraw> = {
  creek_beaver: (b) => {
    const g = shadeDefs(b, 'g', '#a8754b');
    return (
      path('M120,176 C150,186 190,178 190,160 C190,146 160,146 140,156 Z', '#6f5a7a') +
      line('M150,158 l6,18 M164,154 l4,20 M176,156 l2,16', lighten('#6f5a7a', 0.2), 2.5) +
      feet('#8a5a3a', 184, 30, 20) +
      path('M46,150 C46,112 68,100 100,100 C132,100 154,112 154,150 C154,178 130,188 100,188 C70,188 46,178 46,150 Z', g) +
      ellipse(100, 152, 32, 26, '#e8c9a4', false) +
      circle(56, 50, 14, g) +
      circle(144, 50, 14, g) +
      circle(100, 82, 54, g) +
      ellipse(100, 98, 26, 18, '#f0d6b6', false) +
      face(100, 74, 22, 11, 'none') +
      ellipse(100, 90, 9, 6, '#3b2a4d', false) +
      flat('M92,98 L108,98 L108,112 Q100,116 92,112 Z', '#ffffff', `stroke="${OUTLINE}" stroke-width="3"`) +
      line('M100,98 L100,112', OUTLINE, 2.2) +
      // little twig
      line('M56,140 L144,128', '#8a5a3a', 7) +
      path('M120,124 C126,112 138,114 136,124 Z', '#7cc86a', 'stroke-width="3"') +
      highlight(84, 56, 16, 7)
    );
  },
  aurora_hare: (b) => {
    const g = shadeDefs(b, 'g', '#fbfbff');
    const au = `${b.id}au`;
    b.defs.push(linear(au, [
      [0, '#7dffcf'],
      [0.5, '#7fb8ff'],
      [1, '#c58cf0'],
    ]));
    return (
      feet('#e6ebf5', 184, 26, 22) +
      path('M60,70 C46,30 52,6 66,8 C80,10 84,40 82,72 Z', g) +
      path('M140,70 C154,30 148,6 134,8 C120,10 116,40 118,72 Z', g) +
      path('M62,52 C56,30 58,16 66,18 C74,20 76,40 76,58 Z', `url(#${au})`, 'stroke-width="0"') +
      path('M138,52 C144,30 142,16 134,18 C126,20 124,40 124,58 Z', `url(#${au})`, 'stroke-width="0"') +
      path('M48,150 C48,112 68,102 100,102 C132,102 152,112 152,150 C152,178 130,188 100,188 C70,188 48,178 48,150 Z', g) +
      circle(152, 160, 14, '#ffffff') +
      ellipse(100, 92, 50, 42, g) +
      face(100, 88, 20, 11, 'w') +
      ellipse(100, 100, 5, 4, '#ff8fb3', false) +
      flat('M40,40 Q44,52 56,56 Q44,60 40,72 Q36,60 24,56 Q36,52 40,40 Z', '#bfffe6') +
      flat('M166,64 Q169,72 177,75 Q169,78 166,86 Q163,78 155,75 Q163,72 166,64 Z', '#d9c2ff') +
      highlight(84, 66, 16, 7)
    );
  },
};

export const PET_IDS = ALL_PETS.map((p) => p.id);

/**
 * v1.15 art (approved 28/10): head and body as one silhouette for most pets (petFrog, petsCozy,
 * petsLate); Creek Beaver and Aurora Hare keep their v1 drawing above.
 */
const NEW_ART: Record<string, (b: Base) => string> = { ...FROG_ART, ...COZY_ART, ...LATE_ART };

export function petSvg(id: string): string {
  const b: Base = { id: nextId('p'), defs: [] };
  const body = (NEW_ART[id] ?? PETS[id])(b);
  const rarity = petById.get(id)?.rarity ?? 0;
  const { back, front } = rarityLayers(b, rarity);
  return svg(PET_W, PET_H, b.defs.join(''), back + body + front);
}

export function previewItems() {
  return PET_IDS.map((id) => ({ name: id, svg: petSvg(id), w: PET_W, h: PET_H }));
}

// Silence unused-import lint in strict builds.
void OUTLINE_W;
