// Cat angler (v1.15, design C2 approved 28/10), in the pet art style: one silhouette, big v1 eyes,
// clean outline, the yellow raincoat as the lower half of the body.
// Head box (ears at y 16, head 48-152 x 30-134) and the paw on the rod (around 126,150) stay where
// v1 had them, so the ten hats and the rod still fit.
import { type Base, OUTLINE, blush, bodyGrad, darken, ellipse, flat, gloss, lighten, line, linear, path, radial, shape, uid } from './petKit';
import { svg } from './svg';
import { bigEye } from './petsCozy';

function face(b: Base, blink: boolean, dx = 0) {
  const nose = uid(b, 'no');
  b.defs.push(radial(nose, [[0, '#ffc0cf'], [1, '#f07a96']], 0.4, 0.3, 0.8));
  const x = 100 + dx;
  const eyes = blink ? line(`M${x - 28},88 Q${x - 16},78 ${x - 4},88`, OUTLINE, 5) + line(`M${x + 4},88 Q${x + 16},78 ${x + 28},88`, OUTLINE, 5) : bigEye(x - 16, 86, 14, 0.06) + bigEye(x + 16, 86, 14, 0.06);
  return (
    ellipse(x, 106, 22, 13, '#ffffff', false, 'opacity="0.75"') +
    eyes +
    blush(b, x - 31, 106, 10, 5) +
    blush(b, x + 31, 106, 10, 5) +
    path(`M${x},103 C${x - 5},103 ${x - 8},99 ${x - 7},97 C${x - 5},95 ${x + 5},95 ${x + 7},97 C${x + 8},99 ${x + 5},103 ${x},103 Z`, `url(#${nose})`, 'stroke-width="2.4"') +
    line(`M${x},103 v3 M${x},106 q-5,5 -9,1 M${x},106 q5,5 9,1`, OUTLINE, 2.8) +
    line(`M${x - 38},100 l-20,-4 M${x - 38},106 l-20,3 M${x + 38},100 l20,-4 M${x + 38},106 l20,3`, OUTLINE, 2.2, 'opacity="0.55"')
  );
}

function ears(b: Base) {
  const ie = uid(b, 'ie');
  b.defs.push(linear(ie, [[0, '#ffb3c4'], [1, '#ff8fa8']]));
  return flat('M65,40 L63,24 L80,34 Z', `url(#${ie})`) + flat('M135,40 L137,24 L120,34 Z', `url(#${ie})`);
}

function paw(b: Base, fur: string) {
  return shape(b, 'M111,150 C111,140 121,137 128,138 C138,139 142,146 141,153 C140,160 132,163 125,162 C116,162 111,157 111,150 Z', fur, { inside: line('M124,139 v7 M132,140 v7', '#d6c2ae', 2.2), rim: false });
}

const ginger = (b: Base) => bodyGrad(b, '#f39a4f', 0.3, 0.3);
const patch = (g: string) => flat('M40,30 L60,16 L88,32 C88,46 80,58 68,64 C56,68 46,62 42,54 Z', g) + line('M62,40 q6,6 4,16 M72,36 q4,8 0,16', darken('#f39a4f', 0.25), 3, 'opacity="0.7"');


/**
 * C2: the raincoat kitten, refined. Same single silhouette as C, plus: a coat sleeve that reaches
 * up to the paw on the rod (the paw no longer floats on the coat), a pocket with a flap, toggle
 * buttons, a scalloped hem, rounded rain boots with a sole, ear tufts, cheek fluff, and the tail
 * coming out from under the coat with a white tip.
 */
export function catSvg(blink: boolean) {
  const b: Base = { id: 'catD', defs: [] };
  const fur = bodyGrad(b, '#fdf6ee', 0.35, 0.2);
  const coat = bodyGrad(b, '#ffcf3a', 0.35, 0.15);
  const coatDark = darken('#ffcf3a', 0.22);
  const D = 'M50,84 C48,62 56,48 66,40 L60,16 L88,32 C96,30 104,30 112,32 L140,16 L134,40 C144,48 152,62 152,84 C152,92 158,96 156,102 C160,108 154,112 154,116 C158,120 162,124 166,128 C180,150 182,180 178,204 C170,210 160,206 152,210 C142,214 132,208 122,212 C112,216 100,208 90,212 C80,216 70,208 60,212 C50,214 40,208 30,210 L22,204 C18,180 20,150 34,128 C38,124 42,120 46,116 C46,112 40,108 44,102 C42,96 48,92 50,84 Z';
  const inside =
    patch(ginger(b)) +
    // coat body (fills the lower half of the outline) and its folded hood
    path('M4,132 C30,112 70,118 100,128 C130,118 170,112 196,132 L200,220 L0,220 Z', coat, 'stroke-width="4"') +
    path('M30,130 C50,118 76,122 100,130 C124,122 150,118 170,130 C162,148 130,150 100,142 C70,150 38,148 30,130 Z', darken('#ffcf3a', 0.07), 'stroke-width="3"') +
    line('M44,132 C60,140 80,142 96,138 M104,138 C120,142 140,140 156,132', coatDark, 2, 'opacity="0.6"') +
    // front edge and toggles
    line('M100,144 L100,214', coatDark, 2.6) +
    path('M94,158 h12 v6 h-12 Z', '#fff5d6', 'stroke-width="2.2"') +
    path('M94,178 h12 v6 h-12 Z', '#fff5d6', 'stroke-width="2.2"') +
    // pocket with a flap on the left
    path('M46,170 q14,3 28,0 l-2,20 q-12,3 -24,0 Z', lighten('#ffcf3a', 0.12), 'stroke-width="2.6"') +
    path('M44,168 q16,4 32,0 l-1,7 q-15,4 -30,0 Z', darken('#ffcf3a', 0.06), 'stroke-width="2.6"') +
    // a soft light on the left side, fold lines on the right
    flat('M26,150 C32,138 44,134 56,134 C46,144 38,158 34,176 Z', '#ffffff', 'opacity="0.35"') +
    line('M150,150 q8,22 6,54 M136,158 q4,20 2,46', coatDark, 2.2, 'opacity="0.55"') +
    // cheek fluff ticks
    line('M46,104 l-6,2 M46,112 l-6,4 M154,104 l6,2 M154,112 l6,4', '#d6c2ae', 2, 'opacity="0.9"');
  const body = shape(b, D, fur, { inside, shadow: 'M128,40 C162,60 158,110 162,128 C182,150 186,186 180,214 L130,214 C160,170 156,126 128,40 Z' });

  // Tail from under the coat, ginger with rings and a white tip.
  const tail = shape(b, 'M34,196 C2,200 -4,170 10,150 C16,142 26,144 24,152 C18,166 24,180 40,182 Z', ginger(b), {
    inside: path('M10,150 C14,142 24,142 26,150 C22,154 14,156 10,150 Z', '#fdf6ee', 'stroke="none"') + line('M6,162 l14,4 M8,176 l14,-1 M16,188 l12,-6', darken('#f39a4f', 0.25), 4, 'opacity="0.7"'),
    rim: false,
  });

  // Sleeve up to the paw on the rod, with a cuff.
  const sleeve = shape(b, 'M118,128 C134,124 146,134 146,146 C146,152 142,156 136,156 L118,152 C112,144 112,134 118,128 Z', coat, {
    inside: path('M114,146 C122,144 136,146 144,150 L140,158 C132,156 120,154 112,154 Z', darken('#ffcf3a', 0.1), 'stroke="none"') + line('M124,134 q8,4 12,12', coatDark, 2, 'opacity="0.6"'),
    rim: false,
  });

  // Rounded rain boots with a darker sole.
  const bootG = uid(b, 'bt');
  b.defs.push(linear(bootG, [[0, '#7cc0ff'], [1, '#3d78c9']]));
  const boot = (x: number, dir: number) =>
    shape(b, `M${x - 12},202 L${x + 12},202 L${x + 12},206 C${x + 12 + dir * 8},206 ${x + 12 + dir * 10},212 ${x + 10 + dir * 6},218 L${x - 12 - (dir < 0 ? 6 : 0)},218 C${x - 14 - (dir < 0 ? 4 : 0)},212 ${x - 13},206 ${x - 12},202 Z`, `url(#${bootG})`, {
      inside: gloss(x - 5, 208, 2.2, 3.5, 0, 0.6),
      rim: false,
    });

  // Ear tufts.
  const tufts = line('M68,38 l1,-7 M72,38 l2,-6 M132,38 l-1,-7 M128,38 l-2,-6', '#ffffff', 1.8, 'opacity="0.9"');

  return svg(200, 220, b.defs.join(''), tail + body + boot(70, -1) + boot(130, 1) + sleeve + ears(b) + tufts + face(b, blink) + paw(b, fur) + gloss(76, 58, 14, 6, -25, 0.45));
}
