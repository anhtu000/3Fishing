// Pet art: chibi creatures sitting and facing the player. ViewBox 200 x 200, feet on y ~ 186.
import { petById } from '../content/data';
import { OUTLINE, OUTLINE_W, circle, darken, ellipse, eye, f, flat, happyEye, lighten, line, linear, nextId, path, radial, svg } from './svg';

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

const PETS: Record<string, PetDraw> = {
  puddle_frog: (b) => {
    const g = shadeDefs(b, 'g', '#6fd27a');
    return (
      feet('#58b866', 182, 40, 26) +
      path('M30,140 C30,95 60,78 100,78 C140,78 170,95 170,140 C170,175 140,186 100,186 C60,186 30,175 30,140 Z', g) +
      ellipse(100, 152, 46, 28, '#d8f5b5', false) +
      circle(66, 74, 26, g) +
      circle(134, 74, 26, g) +
      eye(66, 72, 17, '#2b1d38', 0) +
      eye(134, 72, 17, '#2b1d38', 0) +
      ellipse(56, 118, 14, 7, '#ff7aa8', false, 'opacity="0.45"') +
      ellipse(144, 118, 14, 7, '#ff7aa8', false, 'opacity="0.45"') +
      line('M70,116 Q100,138 130,116', OUTLINE, 4) +
      circle(48, 136, 4, '#4aa257', false) +
      circle(152, 142, 5, '#4aa257', false) +
      highlight(80, 96, 22, 8)
    );
  },
  reed_duckling: (b) => {
    const g = shadeDefs(b, 'g', '#ffd84d');
    return (
      feet('#ff9e3d', 184, 26, 20) +
      path('M44,150 C44,112 66,100 100,100 C134,100 156,112 156,150 C156,178 132,188 100,188 C68,188 44,178 44,150 Z', g) +
      path('M150,138 C170,128 176,140 168,150 C162,156 154,156 150,152 Z', g) +
      path('M50,138 C30,128 24,140 32,150 C38,156 46,156 50,152 Z', g) +
      circle(100, 80, 50, g) +
      path('M92,44 C90,30 100,24 104,34 C108,24 118,30 110,44 Z', g) +
      face(100, 80, 20, 11, 'none') +
      path('M82,98 C90,90 110,90 118,98 C114,108 86,108 82,98 Z', '#ff9e3d') +
      line('M84,99 Q100,103 116,99', OUTLINE, 2.5) +
      highlight(84, 56, 18, 8) +
      // reed leaf held
      path('M156,186 C160,150 164,120 176,96 C178,126 170,160 164,188 Z', '#7cc86a', 'stroke-width="3.5"')
    );
  },
  otter_pup: (b) => {
    const g = shadeDefs(b, 'g', '#b07a52');
    return (
      path('M150,170 C180,168 190,150 184,138 C176,150 160,156 140,158 Z', '#9a6744') +
      feet('#8a5a3a', 184, 30, 20) +
      path('M46,150 C46,112 68,100 100,100 C132,100 154,112 154,150 C154,178 130,188 100,188 C70,188 46,178 46,150 Z', g) +
      ellipse(100, 152, 30, 26, '#ecd2b4', false) +
      circle(58, 52, 13, g) +
      circle(142, 52, 13, g) +
      circle(58, 52, 6, '#e8b9a0', false) +
      circle(142, 52, 6, '#e8b9a0', false) +
      ellipse(100, 82, 54, 46, g) +
      ellipse(100, 100, 30, 20, '#f2dcc2', false) +
      face(100, 76, 22, 11, 'w') +
      ellipse(100, 92, 8, 6, '#3b2a4d', false) +
      line('M74,98 l-18,-4 M74,103 l-18,2 M126,98 l18,-4 M126,103 l18,2', OUTLINE, 2.5) +
      // holding a pebble
      ellipse(100, 140, 16, 12, '#b9c6d6') +
      ellipse(80, 140, 10, 9, g) +
      ellipse(120, 140, 10, 9, g) +
      highlight(86, 58, 16, 7)
    );
  },
  lily_turtle: (b) => {
    const shell = `${b.id}sh`;
    b.defs.push(radial(shell, [
      [0, '#9be07d'],
      [1, '#4f9e57'],
    ], 0.45, 0.35, 0.65));
    return (
      feet('#9fd88a', 184, 44, 18) +
      path('M26,150 C26,108 60,92 100,92 C140,92 174,108 174,150 C174,166 160,176 100,176 C40,176 26,166 26,150 Z', `url(#${shell})`) +
      path('M100,108 L124,122 L118,146 L82,146 L76,122 Z', '#7fcf6d', 'stroke-width="3.5"') +
      line('M100,108 L100,96 M124,122 L150,114 M118,146 L138,166 M82,146 L62,166 M76,122 L50,114', OUTLINE, 3) +
      path('M30,158 C60,170 140,170 170,158 C168,176 146,184 100,184 C54,184 32,176 30,158 Z', '#f3e6b8') +
      // head pops out in front of the shell
      circle(100, 72, 38, '#a9e092') +
      face(100, 72, 16, 9.5, 'smile') +
      highlight(86, 50, 14, 6) +
      // lily tucked on the side of the shell
      path('M136,118 C128,102 142,92 152,102 C162,92 176,102 168,118 C162,122 142,122 136,118 Z', '#ffc7de', 'stroke-width="3.5"') +
      circle(152, 110, 5, '#ffe36e', false) +
      highlight(66, 122, 16, 6)
    );
  },
  // 7-day login gift: a turtle with a rainbow shell and a little star.
  rainbow_turtle: (b) => {
    const shell = `${b.id}rs`;
    b.defs.push(linear(shell, [
      [0, '#ff8fab'],
      [0.25, '#ffd23f'],
      [0.5, '#7fe07a'],
      [0.75, '#5fb4ef'],
      [1, '#a98bff'],
    ], 0, 0, 1, 0));
    return (
      feet('#b5e7a0', 184, 44, 18) +
      path('M26,150 C26,104 60,88 100,88 C140,88 174,104 174,150 C174,166 160,176 100,176 C40,176 26,166 26,150 Z', `url(#${shell})`) +
      line('M48,120 C70,108 130,108 152,120 M36,142 C70,128 130,128 164,142', '#ffffff', 4, 'opacity="0.7"') +
      path('M30,158 C60,170 140,170 170,158 C168,176 146,184 100,184 C54,184 32,176 30,158 Z', '#f3e6b8') +
      circle(100, 70, 38, '#b5e7a0') +
      face(100, 70, 16, 9.5, 'w') +
      highlight(86, 48, 14, 6) +
      flat('M150,86 l5,11 12,2 -9,8 2,12 -10,-6 -10,6 2,-12 -9,-8 12,-2 Z', '#ffe36e', `stroke="${OUTLINE}" stroke-width="3"`) +
      highlight(64, 112, 18, 6)
    );
  },
  sunny_axolotl: (b) => {
    const g = shadeDefs(b, 'g', '#ffb3cf');
    const gill = '#ff6fa3';
    const gills = (side: number) =>
      [0, 1, 2]
        .map((i) => {
          const x = 100 + side * 54;
          const y = 64 + i * 20;
          return path(`M${x},${y} C${x + side * 18},${y - 14} ${x + side * 34},${y - 8} ${x + side * 30},${y + 4} C${x + side * 22},${y + 4} ${x + side * 12},${y + 6} ${x},${y + 8} Z`, gill, 'stroke-width="3.5"');
        })
        .join('');
    return (
      path('M150,168 C186,170 192,140 178,128 C176,150 164,156 144,154 Z', g) +
      feet('#ff9fc1', 184, 30, 18) +
      gills(-1) +
      gills(1) +
      path('M46,150 C46,116 68,106 100,106 C132,106 154,116 154,150 C154,178 130,188 100,188 C70,188 46,178 46,150 Z', g) +
      ellipse(100, 154, 30, 22, '#ffe2ee', false) +
      ellipse(100, 82, 58, 44, g) +
      face(100, 80, 26, 11, 'smile') +
      // little sun hat glow
      circle(100, 34, 13, '#ffd23f') +
      line('M100,14 l0,-6 M118,22 l5,-5 M82,22 l-5,-5', '#ffb000', 3.5) +
      highlight(82, 58, 20, 8)
    );
  },
  mossy_snail: (b) => {
    const shell = `${b.id}sh`;
    b.defs.push(radial(shell, [
      [0, '#e9b07a'],
      [1, '#a8693d'],
    ], 0.4, 0.35, 0.7));
    return (
      path('M20,176 C20,150 50,140 80,140 L170,140 C186,140 192,160 184,176 C176,186 40,190 20,176 Z', '#c9d6a4') +
      // eye stalks + head
      line('M150,112 L140,62 M170,112 L178,64', OUTLINE, 5) +
      line('M150,112 L140,62 M170,112 L178,64', '#c9d6a4', 2.5) +
      eye(138, 58, 12, '#2b1d38', 0) +
      eye(180, 60, 12, '#2b1d38', 0) +
      path('M130,150 C130,116 146,104 162,104 C178,104 190,118 190,150 Z', '#c9d6a4') +
      ellipse(146, 132, 8, 4, '#ff7aa8', false, 'opacity="0.5"') +
      line('M152,138 Q160,144 168,138', OUTLINE, 3.5) +
      circle(80, 112, 56, `url(#${shell})`) +
      line('M80,112 m-36,0 a36,36 0 1,0 36,-36 a24,24 0 1,0 -24,24 a12,12 0 1,0 12,-12', darken('#a8693d', 0.2), 4) +
      // moss tufts
      path('M44,74 C40,58 56,52 62,62 C66,48 84,48 86,60 C94,52 108,58 104,72 C90,80 56,82 44,74 Z', '#7cc86a', 'stroke-width="3.5"') +
      circle(66, 60, 4, '#ffe36e', false) +
      circle(92, 58, 3.5, '#ffffff', false) +
      highlight(62, 96, 16, 7)
    );
  },
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
  firefly_fox: (b) => {
    const g = shadeDefs(b, 'g', '#ff9a4d');
    const glow = `${b.id}gl`;
    b.defs.push(radial(glow, [
      [0, '#fffbd0', 1],
      [0.45, '#ffe96b', 0.7],
      [1, '#ffe96b', 0],
    ]));
    return (
      circle(176, 104, 26, `url(#${glow})`, false) +
      path('M140,170 C176,170 190,140 178,108 C172,126 160,142 136,150 Z', g) +
      path('M178,108 C184,100 190,104 188,112 C186,118 180,118 178,108 Z', '#fff6b8', 'stroke-width="3"') +
      feet('#e9772f', 184, 28, 18) +
      path('M50,150 C50,114 70,104 100,104 C130,104 150,114 150,150 C150,178 128,188 100,188 C72,188 50,178 50,150 Z', g) +
      ellipse(100, 154, 24, 26, '#fff1e2', false) +
      path('M50,72 L46,20 L84,46 Z', g) +
      path('M150,72 L154,20 L116,46 Z', g) +
      path('M54,58 L52,32 L72,46 Z', '#5a3a5a', 'stroke-width="0"') +
      path('M146,58 L148,32 L128,46 Z', '#5a3a5a', 'stroke-width="0"') +
      path('M44,82 C44,52 66,40 100,40 C134,40 156,52 156,82 C156,112 132,126 100,126 C68,126 44,112 44,82 Z', g) +
      ellipse(100, 104, 24, 15, '#fff1e2', false) +
      face(100, 80, 22, 11, 'none') +
      ellipse(100, 98, 6, 4.5, '#3b2a4d', false) +
      line('M93,105 Q100,110 107,105', OUTLINE, 3) +
      highlight(82, 54, 18, 7)
    );
  },
  heron_chick: (b) => {
    const g = shadeDefs(b, 'g', '#b9cbe6');
    return (
      line('M86,176 L84,192 M114,176 L116,192', '#f4a261', 6) +
      line('M86,176 L84,192 M114,176 L116,192', OUTLINE, 9, 'opacity="0"') +
      path('M44,140 C44,104 66,92 100,92 C134,92 156,104 156,140 C156,170 132,182 100,182 C68,182 44,170 44,140 Z', g) +
      // fluffy tuft edge
      path('M58,104 C62,96 70,98 72,104 C76,94 86,96 88,102 Z', g, 'stroke-width="3"') +
      ellipse(100, 146, 32, 26, '#eef4ff', false) +
      path('M50,128 C34,132 32,150 46,156 Z', lighten('#b9cbe6', 0.1)) +
      path('M150,128 C166,132 168,150 154,156 Z', lighten('#b9cbe6', 0.1)) +
      circle(100, 74, 46, g) +
      // crest
      path('M96,30 C90,14 102,8 106,22 C112,10 124,16 114,32 Z', '#7f96c4', 'stroke-width="3.5"') +
      face(100, 70, 20, 11, 'none') +
      // long beak
      path('M88,88 L140,96 L88,100 Z', '#f4a261') +
      highlight(84, 50, 16, 7)
    );
  },
  mist_fawn: (b) => {
    const g = shadeDefs(b, 'g', '#e2b48c');
    const mist = `${b.id}m`;
    b.defs.push(radial(mist, [
      [0, '#ffffff', 0.85],
      [1, '#ffffff', 0],
    ]));
    return (
      ellipse(100, 182, 90, 22, `url(#${mist})`, false) +
      line('M76,170 L74,190 M124,170 L126,190', OUTLINE, 9) +
      line('M76,170 L74,190 M124,170 L126,190', '#c79a74', 5) +
      path('M50,146 C50,114 70,104 100,104 C130,104 150,114 150,146 C150,172 128,180 100,180 C72,180 50,172 50,146 Z', g) +
      circle(76, 130, 5, '#fff7ea', false) +
      circle(126, 124, 6, '#fff7ea', false) +
      circle(112, 150, 4.5, '#fff7ea', false) +
      circle(84, 156, 4, '#fff7ea', false) +
      // ears
      path('M58,66 C28,56 22,74 40,84 C50,88 58,84 62,78 Z', g) +
      path('M142,66 C172,56 178,74 160,84 C150,88 142,84 138,78 Z', g) +
      path('M52,70 C38,66 36,74 44,78 Z', '#f6c9c0', 'stroke-width="0"') +
      path('M148,70 C162,66 164,74 156,78 Z', '#f6c9c0', 'stroke-width="0"') +
      // little antler nubs with glow flowers
      path('M80,44 C76,30 84,24 88,34 L90,46 Z', '#f1e3c8', 'stroke-width="3.5"') +
      path('M120,44 C124,30 116,24 112,34 L110,46 Z', '#f1e3c8', 'stroke-width="3.5"') +
      circle(84, 28, 6, '#c8e7ff', true, 'stroke-width="2.5"') +
      circle(116, 28, 6, '#c8e7ff', true, 'stroke-width="2.5"') +
      path('M58,84 C58,56 76,44 100,44 C124,44 142,56 142,84 C142,112 124,126 100,126 C76,126 58,112 58,84 Z', g) +
      ellipse(100, 106, 22, 16, '#fbe7d2', false) +
      face(100, 82, 20, 11, 'none') +
      ellipse(100, 102, 7, 5, '#3b2a4d', false) +
      line('M94,110 Q100,115 106,110', OUTLINE, 3) +
      highlight(84, 60, 16, 7)
    );
  },
  // ---- Frozen Lake ----
  penguin_chick: (b) => {
    const g = shadeDefs(b, 'g', '#5b6a8f');
    return (
      feet('#ffa53d', 184, 24, 18) +
      path('M42,140 C30,128 26,108 36,100 C46,108 52,122 54,136 Z', g) +
      path('M158,140 C170,128 174,108 164,100 C154,108 148,122 146,136 Z', g) +
      path('M46,130 C46,74 70,46 100,46 C130,46 154,74 154,130 C154,172 132,188 100,188 C68,188 46,172 46,130 Z', g) +
      path('M62,104 C62,80 80,70 100,84 C120,70 138,80 138,104 C138,150 124,180 100,180 C76,180 62,150 62,104 Z', '#fbfdff', 'stroke-width="0"') +
      path('M94,50 C90,34 100,28 104,40 C108,30 116,34 108,48 Z', g) +
      face(100, 100, 19, 10, 'none') +
      path('M90,116 L110,116 L100,128 Z', '#ffa53d', 'stroke-width="3.5"') +
      highlight(80, 66, 16, 7)
    );
  },
  snowy_owlet: (b) => {
    const g = shadeDefs(b, 'g', '#f4f7ff');
    const spots = [[70, 150], [124, 140], [100, 168], [84, 130], [136, 166]].map(([x, y]) => ellipse(x, y, 5, 3.5, '#9aa7c2', false)).join('');
    const ring = (x: number) => circle(x, 92, 24, '#ffe07a', true, 'stroke-width="3.5"');
    return (
      feet('#ffb84d', 184, 22, 14) +
      path('M44,150 C40,120 46,100 56,96 C62,118 62,140 60,162 Z', '#dfe5f4') +
      path('M156,150 C160,120 154,100 144,96 C138,118 138,140 140,162 Z', '#dfe5f4') +
      path('M48,126 C48,74 70,52 100,52 C130,52 152,74 152,126 C152,170 130,188 100,188 C70,188 48,170 48,126 Z', g) +
      path('M56,64 L50,34 L80,54 Z', g) +
      path('M144,64 L150,34 L120,54 Z', g) +
      spots +
      ring(76) +
      ring(124) +
      eye(76, 92, 15, '#2b1d38', 0) +
      eye(124, 92, 15, '#2b1d38', 0) +
      path('M93,110 L107,110 L100,124 Z', '#ffb84d', 'stroke-width="3.5"') +
      ellipse(60, 120, 10, 5, '#ff7aa8', false, 'opacity="0.4"') +
      ellipse(140, 120, 10, 5, '#ff7aa8', false, 'opacity="0.4"') +
      highlight(82, 66, 16, 6)
    );
  },
  seal_pup: (b) => {
    const g = shadeDefs(b, 'g', '#eef2fa');
    return (
      path('M150,176 C176,180 190,166 188,150 C178,160 164,164 146,160 Z', '#d6ddeb') +
      path('M28,160 C28,112 56,74 100,74 C144,74 172,112 172,160 C172,182 140,188 100,188 C60,188 28,182 28,160 Z', g) +
      path('M44,170 C30,176 22,170 26,160 C34,164 42,164 50,160 Z', '#d6ddeb') +
      ellipse(64, 140, 5, 3.5, '#b8c2d6', false) +
      ellipse(136, 150, 6, 4, '#b8c2d6', false) +
      eye(78, 116, 16, '#2b1d38', 0) +
      eye(122, 116, 16, '#2b1d38', 0) +
      ellipse(100, 140, 18, 12, '#ffffff', false) +
      ellipse(100, 134, 7, 5, '#3b2a4d', false) +
      line('M98,146 Q100,150 102,146', OUTLINE, 2.5) +
      line('M84,140 l-22,-4 M84,146 l-22,2 M116,140 l22,-4 M116,146 l22,2', OUTLINE, 2.4, 'opacity="0.7"') +
      ellipse(64, 134, 9, 5, '#ff7aa8', false, 'opacity="0.45"') +
      ellipse(136, 134, 9, 5, '#ff7aa8', false, 'opacity="0.45"') +
      highlight(82, 90, 18, 7)
    );
  },
  polar_cub: (b) => {
    const g = shadeDefs(b, 'g', '#fbfcff');
    return (
      feet('#e6ebf5', 182, 32, 22) +
      path('M44,150 C44,112 66,100 100,100 C134,100 156,112 156,150 C156,178 132,188 100,188 C68,188 44,178 44,150 Z', g) +
      ellipse(76, 176, 12, 7, '#c9d3e6', false) +
      ellipse(124, 176, 12, 7, '#c9d3e6', false) +
      path('M50,118 C72,130 128,130 150,118 L152,134 C128,146 72,146 48,134 Z', '#ff6b8f') +
      path('M120,132 L136,170 L118,168 L110,136 Z', '#ff6b8f') +
      circle(58, 50, 16, g) +
      circle(142, 50, 16, g) +
      circle(58, 50, 7, '#ffd0dc', false) +
      circle(142, 50, 7, '#ffd0dc', false) +
      ellipse(100, 82, 54, 44, g) +
      ellipse(100, 100, 24, 17, '#eef2fa') +
      face(100, 76, 22, 10, 'none') +
      ellipse(100, 94, 8, 6, '#3b2a4d', false) +
      line('M93,103 Q100,109 107,103', OUTLINE, 3) +
      highlight(84, 54, 18, 7)
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

export const PET_IDS = Object.keys(PETS);

/** Four-point sparkle. */
function sparkle(x: number, y: number, r: number, color: string, opacity = 1) {
  const k = r * 0.28;
  return flat(`M${f(x)},${f(y - r)} Q${f(x + k)},${f(y - k)} ${f(x + r)},${f(y)} Q${f(x + k)},${f(y + k)} ${f(x)},${f(y + r)} Q${f(x - k)},${f(y + k)} ${f(x - r)},${f(y)} Q${f(x - k)},${f(y - k)} ${f(x)},${f(y - r)} Z`, color, `opacity="${opacity}"`);
}

/**
 * Rarity look, layered around each pet's own drawing (same pet, fancier the rarer it is):
 * Common: a soft ground shadow. Uncommon: + a mint glow on the ground and a sparkle.
 * Rare: + a blue aura and sparkles. Epic: + a violet aura, star sparkles and a floating gem.
 * Legendary: + golden sun rays, a golden aura and ground ring, and gold sparkles.
 */
function rarityLayers(b: Base, rarity: number): { back: string; front: string } {
  let back = ellipse(100, 188, 58, 9, '#1d2a44', false, 'opacity="0.18"');
  let front = '';
  if (rarity >= 1) {
    const g = `${b.id}rgGround`;
    const col = ['#ffffff', '#7fe0b0', '#7fc6ff', '#c79bff', '#ffd23f'][rarity];
    b.defs.push(radial(g, [
      [0, col, 0.55],
      [1, col, 0],
    ]));
    back = ellipse(100, 186, 84, 16, `url(#${g})`, false) + back;
  }
  if (rarity >= 2) {
    const a = `${b.id}rgAura`;
    const col = ['', '', '#8fd0ff', '#c9a4ff', '#ffe27a'][rarity];
    b.defs.push(radial(a, [
      [0, col, rarity === 4 ? 0.75 : 0.6],
      [0.6, col, rarity === 4 ? 0.35 : 0.25],
      [1, col, 0],
    ]));
    back = circle(100, 104, 96, `url(#${a})`, false) + back;
  }
  if (rarity === 4) {
    // Sun rays behind everything.
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const a1 = ang - 0.11;
      const a2 = ang + 0.11;
      rays += `M100,104 L${f(100 + Math.cos(a1) * 98)},${f(104 + Math.sin(a1) * 98)} L${f(100 + Math.cos(a2) * 98)},${f(104 + Math.sin(a2) * 98)} Z `;
    }
    const rg = `${b.id}rgRays`;
    b.defs.push(radial(rg, [
      [0, '#fff3b0', 0.9],
      [0.75, '#fff3b0', 0.45],
      [1, '#fff3b0', 0],
    ]));
    back = flat(rays, `url(#${rg})`) + back;
    back += ellipse(100, 188, 62, 11, 'none', false, 'stroke="#ffcf3a" stroke-width="4" opacity="0.8"');
  }
  if (rarity === 1) front += sparkle(170, 46, 9, '#ffffff', 0.95);
  if (rarity === 2) front += sparkle(168, 40, 11, '#ffffff') + sparkle(30, 70, 7, '#dff3ff') + sparkle(176, 120, 6, '#dff3ff', 0.9);
  if (rarity === 3) {
    front += sparkle(30, 56, 10, '#f1e4ff') + sparkle(178, 118, 8, '#ffffff') + sparkle(24, 134, 6, '#f1e4ff', 0.9);
    // Floating gem.
    front += path('M166,22 L178,34 L166,52 L154,34 Z', '#b58bff', 'stroke-width="3.5"') + flat('M166,22 L172,34 L166,40 L160,34 Z', '#ffffff', 'opacity="0.55"') + sparkle(182, 18, 6, '#ffffff');
  }
  if (rarity === 4) front += sparkle(26, 48, 12, '#fff6c2') + sparkle(178, 36, 10, '#ffffff') + sparkle(182, 126, 8, '#ffe36e') + sparkle(20, 128, 7, '#ffe36e', 0.9) + sparkle(150, 14, 6, '#ffffff', 0.9);
  return { back, front };
}

export function petSvg(id: string): string {
  const b: Base = { id: nextId('p'), defs: [] };
  const body = PETS[id](b);
  const rarity = petById.get(id)?.rarity ?? 0;
  const { back, front } = rarityLayers(b, rarity);
  return svg(PET_W, PET_H, b.defs.join(''), back + body + front);
}

export function previewItems() {
  return PET_IDS.map((id) => ({ name: id, svg: petSvg(id), w: PET_W, h: PET_H }));
}

// Silence unused-import lint in strict builds.
void OUTLINE_W;
