// Pet art v4: v1's clean chibi look (big eyes, simple shapes, one outline) with one rule from v3's
// frog: head and body are ONE silhouette, never a round head stacked on a round body.
// The frog keeps its v3 drawing (petFrog.ts).
import { type Base, OUTLINE, blush, bodyGrad, circle, darken, ellipse, f, gloss, line, linear, path, radial, shape, sparkle, uid } from './petKit';

/** Big v1-style eye: white, large pupil, two glints (reads well at small sizes). */
export function bigEye(cx: number, cy: number, r: number, look = 0.1) {
  const pr = r * 0.68;
  const px = cx + r * look;
  return (
    circle(cx, cy, r, '#ffffff', true, 'stroke-width="3.8"') +
    circle(px, cy + r * 0.05, pr, '#2b1d38', false) +
    circle(px + pr * 0.34, cy - pr * 0.36, pr * 0.36, '#ffffff', false) +
    circle(px - pr * 0.36, cy + pr * 0.38, pr * 0.15, '#ffffff', false, 'opacity="0.9"')
  );
}

export const COZY_ART: Record<string, (b: Base) => string> = {
  // A fluff-ball chick: one round body that is also the head, tipped forward, tiny wings and feet.
  reed_duckling: (b) => {
    const c = '#ffd84d';
    const g = bodyGrad(b, c, 0.4, 0.25);
    const beak = uid(b, 'bk');
    b.defs.push(linear(beak, [[0, '#ffb256'], [1, '#f07f22']]));
    const bodyD = 'M38,128 C34,84 62,52 102,52 C142,52 168,82 164,124 C162,140 170,150 162,158 C150,178 128,186 100,186 C68,186 44,172 38,150 C34,142 38,136 38,128 Z';
    return (
      path('M74,180 l-10,8 h14 l4,-5 l4,5 h12 l-8,-8 Z', '#ff9e3d', 'stroke-width="3.2"') +
      path('M112,180 l-8,8 h12 l4,-5 l4,5 h14 l-10,-8 Z', '#ff9e3d', 'stroke-width="3.2"') +
      shape(b, bodyD, g, {
        inside: ellipse(104, 156, 40, 24, '#fff3b8', false, 'opacity="0.85"') + line('M60,66 q-4,-4 -2,-10 M150,74 q4,-4 2,-10', '#e5b52c', 2.2, 'opacity="0.6"'),
        shadow: 'M130,56 C176,76 178,160 132,188 L100,192 C150,160 158,96 130,56 Z',
      }) +
      // tuft
      shape(b, 'M92,58 C86,42 96,34 100,46 C102,32 116,34 110,52 Z', g, { rim: false }) +
      // little wings on the sides
      shape(b, 'M42,128 C26,124 22,140 30,150 C38,158 50,154 52,144 Z', bodyGrad(b, '#ffcf3a'), { inside: line('M32,142 q8,2 14,-2', '#e0a91f', 2), rim: false }) +
      shape(b, 'M160,128 C176,124 180,140 172,150 C164,158 152,154 150,144 Z', bodyGrad(b, '#ffcf3a'), { inside: line('M170,142 q-8,2 -14,-2', '#e0a91f', 2), rim: false }) +
      bigEye(80, 100, 15, 0.08) +
      bigEye(124, 100, 15, 0.08) +
      blush(b, 66, 124, 11, 5.5) +
      blush(b, 138, 124, 11, 5.5) +
      path('M90,116 C96,108 108,108 114,116 C110,126 94,126 90,116 Z', `url(#${beak})`, 'stroke-width="3.2"') +
      line('M92,118 Q102,122 112,118', darken('#f07f22', 0.25), 2) +
      gloss(80, 68, 18, 8, -20, 0.5) +
      // a reed leaf tucked under a wing
      path('M168,186 C170,152 172,124 182,104 C184,132 178,162 174,188 Z', '#7cc86a', 'stroke-width="3"')
    );
  },

  // Otter as one pear: ears, head and body in a single outline, sitting up, paws holding a shell.
  otter_pup: (b) => {
    const c = '#b07a52';
    const g = bodyGrad(b, c, 0.4, 0.2);
    const fur2 = darken(c, 0.25);
    const shell = uid(b, 'sh');
    b.defs.push(radial(shell, [[0, '#fff1f4'], [0.6, '#ffc9d6'], [1, '#e9909f']], 0.5, 0.2, 0.9));
    const bodyD = 'M58,56 C56,42 70,36 78,46 C88,40 112,40 122,46 C130,36 144,42 142,56 C156,72 158,98 152,120 C162,140 164,166 148,180 C134,190 66,190 52,180 C36,166 38,140 48,120 C42,98 44,72 58,56 Z';
    return (
      shape(b, 'M144,170 C176,172 192,154 188,138 C178,150 162,156 140,156 Z', bodyGrad(b, '#9a6744'), { inside: line('M162,152 l3,10 M174,148 l3,9', fur2, 2.6, 'opacity="0.7"'), rim: false }) +
      shape(b, bodyD, g, {
        inside:
          // light face and belly as one soft area
          path('M64,96 C62,76 80,66 100,72 C120,66 138,76 136,96 C140,110 134,120 122,124 C128,140 128,166 116,178 C106,184 94,184 84,178 C72,166 72,140 78,124 C66,120 60,110 64,96 Z', '#f0d8bc', 'stroke="none"') +
          circle(66, 54, 5, '#e8b9a0', false) + circle(134, 54, 5, '#e8b9a0', false),
        shadow: 'M128,48 C170,70 172,150 146,186 L100,190 C150,160 156,90 128,48 Z',
      }) +
      foot(b, 76, 184, '#8a5a3a') +
      foot(b, 124, 184, '#8a5a3a') +
      bigEye(80, 90, 13, 0.06) +
      bigEye(120, 90, 13, 0.06) +
      blush(b, 68, 110, 9, 4.5) +
      blush(b, 132, 110, 9, 4.5) +
      path('M92,104 C92,98 108,98 108,104 C108,109 102,112 100,112 C98,112 92,109 92,104 Z', '#3b2a4d', 'stroke-width="2"') +
      gloss(97, 102, 3, 1.5, 0, 0.7) +
      line('M100,112 v4 M100,116 q-6,6 -11,1 M100,116 q6,6 11,1', OUTLINE, 2.8) +
      line('M76,108 l-20,-4 M76,113 l-20,2 M124,108 l20,-4 M124,113 l20,2', OUTLINE, 2.2, 'opacity="0.55"') +
      // shell held against the belly
      shape(b, 'M84,150 C84,134 116,134 116,150 C116,158 108,160 100,160 C92,160 84,158 84,150 Z', `url(#${shell})`, { inside: line('M100,138 v20 M92,140 l3,18 M108,140 l-3,18', '#d97a8e', 2, 'opacity="0.8"'), rim: false }) +
      shape(b, 'M70,146 A11,10 0 1 1 92,146 A11,10 0 1 1 70,146 Z', g, { inside: line('M76,140 v6 M82,139 v6', fur2, 2), rim: false }) +
      shape(b, 'M108,146 A11,10 0 1 1 130,146 A11,10 0 1 1 108,146 Z', g, { inside: line('M118,139 v6 M124,140 v6', fur2, 2), rim: false }) +
      gloss(76, 64, 14, 6, -20, 0.4)
    );
  },

  // Turtle from the front, three-quarter: a wide low shell, the big head comes OUT of the front
  // opening at the bottom (overlapping the rim), front flippers out to the sides.
  lily_turtle: (b) => {
    const shellG = uid(b, 'sg');
    b.defs.push(radial(shellG, [[0, '#9fe07f'], [0.65, '#5fae58'], [1, '#3f8a49']], 0.45, 0.25, 0.8));
    const skin = bodyGrad(b, '#a9e092', 0.4, 0.3);
    const plates =
      path('M100,64 L124,76 L120,100 L80,100 L76,76 Z', '#8ad072', 'stroke-width="3"') +
      line('M100,64 L100,52 M124,76 L150,68 M120,100 L144,112 M80,100 L56,112 M76,76 L50,68', OUTLINE, 3);
    return (
      // back feet peek out under the shell
      shape(b, 'M36,150 C22,152 18,166 30,170 C40,172 48,164 50,156 Z', skin, { rim: false }) +
      shape(b, 'M164,150 C178,152 182,166 170,170 C160,172 152,164 150,156 Z', skin, { rim: false }) +
      // shell dome
      shape(b, 'M26,132 C24,82 60,50 100,50 C140,50 176,82 174,132 C150,144 50,144 26,132 Z', `url(#${shellG})`, { inside: plates, shadow: 'M130,54 C178,76 182,122 170,138 L110,140 C150,120 156,80 130,54 Z' }) +
      // rim band
      shape(b, 'M20,130 C50,146 150,146 180,130 C182,142 166,152 100,152 C34,152 18,142 20,130 Z', bodyGrad(b, '#e9dca6'), { rim: false }) +
      // front flippers
      shape(b, 'M58,146 C40,150 26,166 34,176 C44,182 62,170 72,156 Z', skin, { inside: circle(46, 166, 2.5, '#8fcf78', false), rim: false }) +
      shape(b, 'M142,146 C160,150 174,166 166,176 C156,182 138,170 128,156 Z', skin, { inside: circle(154, 166, 2.5, '#8fcf78', false), rim: false }) +
      // big head out of the front of the shell
      shape(b, 'M62,150 C60,122 80,108 100,108 C120,108 140,122 138,150 C138,174 120,188 100,188 C80,188 62,174 62,150 Z', skin, {
        inside: circle(78, 128, 2.5, '#8fcf78', false) + circle(124, 126, 2, '#8fcf78', false),
        shadow: 'M120,110 C146,126 146,178 116,190 L140,190 L146,110 Z',
      }) +
      bigEye(84, 146, 12, 0.05) +
      bigEye(116, 146, 12, 0.05) +
      blush(b, 74, 166, 8, 4) +
      blush(b, 126, 166, 8, 4) +
      line('M92,166 Q100,173 108,166', OUTLINE, 3.2) +
      gloss(86, 118, 12, 5, -20, 0.5) +
      // lotus tucked on the shell
      (() => {
        const pg = uid(b, 'lp');
        b.defs.push(linear(pg, [[0, '#fff0f6'], [1, '#ff9ec4']]));
        const petal = (rot: number, s = 1) => `<g transform="translate(148,82) rotate(${rot}) scale(${s})">${path('M0,0 C-8,-10 -6,-24 0,-30 C6,-24 8,-10 0,0 Z', `url(#${pg})`, 'stroke-width="2.6"')}</g>`;
        return petal(-60, 0.8) + petal(60, 0.8) + petal(-28) + petal(28) + petal(0, 1.05) + circle(148, 80, 5, '#ffe36e', true, 'stroke-width="2"');
      })() +
      gloss(64, 82, 14, 6, -35, 0.4)
    );
  },

  // Axolotl as one blob: a wide head that flows into a short body, lying low, tail curled in front.
  sunny_axolotl: (b) => {
    const c = '#ffb3cf';
    const g = bodyGrad(b, c, 0.4, 0.25);
    const gillG = uid(b, 'gl');
    b.defs.push(linear(gillG, [[0, '#ff4f8f'], [1, '#ffb0cf']], 0, 0, 1, 0));
    const gillR = uid(b, 'glr');
    b.defs.push(linear(gillR, [[0, '#ffb0cf'], [1, '#ff4f8f']], 0, 0, 1, 0));
    const gills = (side: number) =>
      [0, 1, 2]
        .map((i) => {
          const x = 100 + side * 56;
          const y = 66 + i * 18;
          return path(`M${x},${y} C${x + side * 16},${y - 14} ${x + side * 32},${y - 10} ${x + side * 30},${y + 2} C${x + side * 22},${y + 4} ${x + side * 12},${y + 6} ${x},${y + 8} Z`, `url(#${side < 0 ? gillR : gillG})`, 'stroke-width="3.2"');
        })
        .join('');
    const bodyD = 'M44,96 C44,64 70,50 100,50 C130,50 156,64 156,96 C156,112 150,122 152,136 C156,160 140,180 112,184 C96,186 80,184 68,178 C50,168 46,150 50,134 C52,122 44,112 44,96 Z';
    return (
      gills(-1) +
      gills(1) +
      shape(b, bodyD, g, {
        inside: ellipse(100, 152, 30, 22, '#ffe2ee', false) + [[66, 80, 3], [134, 76, 3.5], [60, 132, 2.5], [144, 138, 3]].map(([x, y, r]) => circle(x, y, r, '#f48bb5', false)).join(''),
        shadow: 'M128,54 C170,72 166,160 120,186 L100,190 C150,160 156,90 128,54 Z',
      }) +
      // tail curls around the front
      shape(b, 'M140,170 C168,178 184,168 186,150 C186,136 174,130 166,138 C172,148 166,160 146,160 Z', g, { inside: path('M182,146 C184,160 172,172 150,170', 'none', 'stroke="#ffe2ee" stroke-width="5" opacity="0.8"'), rim: false }) +
      foot(b, 76, 184, '#ff9fc1') +
      foot(b, 120, 184, '#ff9fc1') +
      bigEye(76, 98, 13, 0.04) +
      bigEye(124, 98, 13, 0.04) +
      blush(b, 62, 120, 11, 5.5) +
      blush(b, 138, 120, 11, 5.5) +
      line('M86,120 Q100,132 114,120', OUTLINE, 3.6) +
      gloss(80, 66, 18, 7, -20, 0.5) +
      // sun charm
      line('M100,50 C100,42 98,38 100,32', OUTLINE, 3) +
      (() => {
        const sg = uid(b, 'sun');
        b.defs.push(radial(sg, [[0, '#fff6b0'], [0.6, '#ffd23f'], [1, '#ffa800']], 0.4, 0.35, 0.7));
        let rays = '';
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          rays += `M${f(100 + Math.cos(a) * 14)},${f(22 + Math.sin(a) * 14)} L${f(100 + Math.cos(a) * 20)},${f(22 + Math.sin(a) * 20)} `;
        }
        return line(rays, '#ffb000', 3.2) + circle(100, 22, 11, `url(#${sg})`, true, 'stroke-width="3"') + circle(96, 21, 1.4, OUTLINE, false) + circle(104, 21, 1.4, OUTLINE, false) + line('M97,25 q3,2 6,0', OUTLINE, 1.6);
      })() +
      sparkle(160, 40, 7, '#ffffff', 0.9)
    );
  },
};

export function foot(b: Base, x: number, y: number, c: string) {
  return shape(b, `M${f(x - 18)},${f(y)} C${f(x - 18)},${f(y - 12)} ${f(x + 18)},${f(y - 12)} ${f(x + 18)},${f(y)} C${f(x + 18)},${f(y + 8)} ${f(x - 18)},${f(y + 8)} ${f(x - 18)},${f(y)} Z`, bodyGrad(b, c), {
    inside: line(`M${f(x - 6)},${f(y + 1)} v5 M${f(x + 6)},${f(y + 1)} v5`, darken(c, 0.3), 2.2),
    rim: false,
  });
}

