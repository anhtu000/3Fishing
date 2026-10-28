// Frog art (v3, approved 28/10): new structure per animal instead of "round head on a round body".
// Each pet has its own pose and silhouette: side or three-quarter views, bodies built like the
// real animal (turtle walking with its neck out, otter floating on its back, axolotl lying long).
// Same 200 x 200 frame, resting on y ~ 186, so pads and the rarity layers still fit.
import { type Base, OUTLINE, blush, bodyGrad, circle, darken, ellipse, eye2, gloss, line, path, radial, shape, uid } from './petKit';

export const FROG_ART: Record<string, (b: Base) => string> = {
  puddle_frog: (b) => {
    const c = '#6fd27a';
    const g = bodyGrad(b, c, 0.45, 0.2);
    const dark = darken(c, 0.18);
    const belly = uid(b, 'be');
    b.defs.push(radial(belly, [[0, '#f4ffdc'], [1, '#c7eca0']], 0.5, 0.3, 0.7));
    const thigh = (side: number) =>
      shape(b, side < 0 ? 'M22,170 C10,140 30,112 62,118 C84,122 90,150 78,170 C66,186 34,188 22,170 Z' : 'M178,170 C190,140 170,112 138,118 C116,122 110,150 122,170 C134,186 166,188 178,170 Z', g, {
        inside: circle(side < 0 ? 44 : 156, 140, 6, dark, false) + circle(side < 0 ? 58 : 142, 156, 4, dark, false),
        shadow: side < 0 ? 'M20,160 C40,190 70,190 82,160 L82,192 L16,192 Z' : 'M118,160 C130,190 160,190 180,160 L184,192 L118,192 Z',
      });
    const toes = (x: number, dir: number) => path(`M${x},182 c${dir * 6},-4 ${dir * 14},-3 ${dir * 18},2 c${-dir * 2},4 ${-dir * 8},5 ${-dir * 12},4 c${dir * 4},4 ${dir * 2},8 ${-dir * 4},8 c-4,0 -6,-4 -6,-8 Z`, '#5cbf69', 'stroke-width="3"');
    return (
      thigh(-1) +
      thigh(1) +
      toes(30, -1) +
      toes(170, 1) +
      // body + head as one wide dome
      shape(b, 'M40,150 C36,108 60,80 100,80 C140,80 164,108 160,150 C160,176 134,186 100,186 C66,186 40,176 40,150 Z', g, {
        inside: ellipse(100, 158, 40, 26, `url(#${belly})`, false) + line('M76,154 q24,8 48,0 M82,168 q18,6 36,0', '#a8db8b', 2.4) + circle(68, 110, 5, dark, false) + circle(136, 104, 4, dark, false),
        shadow: 'M118,82 C164,94 172,150 150,186 L100,190 C150,166 156,116 118,82 Z',
      }) +
      // front arms tucked between the thighs
      shape(b, 'M70,150 C64,166 66,182 78,184 C88,184 88,170 84,154 Z', g, { rim: false }) +
      shape(b, 'M130,150 C136,166 134,182 122,184 C112,184 112,170 116,154 Z', g, { rim: false }) +
      path('M66,184 l-6,4 M72,186 l0,5 M80,185 l5,4 M134,184 l6,4 M128,186 l0,5 M120,185 l-5,4', 'none', 'stroke-width="3"') +
      // eye domes sit on top of the head, wide apart
      shape(b, 'M45,82 A22,21 0 1 1 89,82 A22,21 0 1 1 45,82 Z', g, { rim: false }) +
      shape(b, 'M111,82 A22,21 0 1 1 155,82 A22,21 0 1 1 111,82 Z', g, { rim: false }) +
      eye2(b, 67, 80, 13, '#e9b43a', 0) +
      eye2(b, 133, 80, 13, '#e9b43a', 0) +
      // wide frog mouth across the face
      line('M58,112 C80,130 120,130 142,112', OUTLINE, 4) +
      line('M56,108 l4,6 M144,108 l-4,6', OUTLINE, 3.4) +
      blush(b, 60, 122, 11, 5) +
      blush(b, 140, 122, 11, 5) +
      circle(94, 102, 1.8, OUTLINE, false) +
      circle(106, 102, 1.8, OUTLINE, false) +
      gloss(84, 92, 16, 5, -10, 0.4)
    );
  },

};

