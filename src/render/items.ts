// Eggs, junk, chests, currency, fishing gear and UI icons. Same house style as fish and pets.
import { OUTLINE, circle, darken, ellipse, f, flat, lighten, line, linear, nextId, path, radial, svg } from './svg';

type Art = { w: number; h: number; body: (id: string, defs: string[]) => string };

const RARITY_EGG: { base: string; spot: string; kind: 'spots' | 'stripes' | 'zigzag' | 'stars' | 'swirl' }[] = [
  { base: '#fff3d6', spot: '#8fcf7a', kind: 'spots' },
  { base: '#d6efff', spot: '#5fa8e8', kind: 'stripes' },
  { base: '#ead9ff', spot: '#a46be8', kind: 'zigzag' },
  { base: '#ffd9d2', spot: '#ff7a52', kind: 'stars' },
  { base: '#fff1a8', spot: '#ffb000', kind: 'swirl' },
];

function eggArt(tier: number): Art {
  return {
    w: 140,
    h: 170,
    body: (id, defs) => {
      const r = RARITY_EGG[tier];
      const g = `${id}e`;
      const clip = `${id}c`;
      defs.push(radial(g, [
        [0, lighten(r.base, 0.5)],
        [0.7, r.base],
        [1, darken(r.base, 0.12)],
      ], 0.38, 0.32, 0.75));
      const egg = 'M70,10 C108,10 128,70 128,104 C128,140 102,162 70,162 C38,162 12,140 12,104 C12,70 32,10 70,10 Z';
      defs.push(`<clipPath id="${clip}"><path d="${egg}"/></clipPath>`);
      const pat: string[] = [];
      if (r.kind === 'spots') for (const [x, y, s] of [[44, 60, 9], [88, 46, 7], [94, 100, 11], [50, 122, 8], [72, 82, 6], [30, 96, 6]]) pat.push(circle(x, y, s, r.spot, false));
      if (r.kind === 'stripes') for (const y of [58, 96, 134]) pat.push(flat(`M0,${y} Q35,${y - 10} 70,${y} T140,${y} L140,${y + 12} Q105,${y + 22} 70,${y + 12} T0,${y + 12} Z`, r.spot));
      if (r.kind === 'zigzag') for (const y of [70, 118]) pat.push(line(`M8,${y} l15,-14 l15,14 l15,-14 l15,14 l15,-14 l15,14 l15,-14 l15,14`, r.spot, 9));
      if (r.kind === 'stars')
        for (const [x, y, s] of [[46, 64, 12], [92, 52, 9], [86, 110, 13], [44, 124, 9]])
          pat.push(flat(`M${x},${y - s} L${x + s * 0.3},${y - s * 0.3} L${x + s},${y} L${x + s * 0.3},${y + s * 0.3} L${x},${y + s} L${x - s * 0.3},${y + s * 0.3} L${x - s},${y} L${x - s * 0.3},${y - s * 0.3} Z`, r.spot));
      if (r.kind === 'swirl') {
        pat.push(line('M70,90 m-8,0 a8,8 0 1,1 16,0 a16,16 0 1,1 -32,0 a24,24 0 1,1 48,0 a32,32 0 1,1 -64,0', r.spot, 7));
        pat.push(circle(36, 50, 6, '#ffffff', false, 'opacity="0.8"'));
      }
      pat.push(ellipse(48, 52, 14, 22, '#ffffff', false, 'opacity="0.55" transform="rotate(20 48 52)"'));
      return path(egg, `url(#${g})`) + `<g clip-path="url(#${clip})">${pat.join('')}</g>` + path(egg, 'none');
    },
  };
}

const ART: Record<string, Art> = {
  coin: {
    w: 100,
    h: 100,
    body: (id, defs) => {
      defs.push(radial(`${id}c`, [[0, '#fff3a6'], [0.7, '#ffcf3a'], [1, '#f0a400']], 0.4, 0.35, 0.7));
      return circle(50, 50, 42, `url(#${id}c)`) + circle(50, 50, 30, 'none', true, `stroke="${darken('#f0a400', 0.1)}" stroke-width="4" opacity="0.6"`) + flat('M26,50 C34,37 54,37 63,50 C54,63 34,63 26,50 Z M60,50 L75,39 L75,61 Z', '#e89a00', 'opacity="0.8"') + circle(38, 48, 2.6, '#fff3a6', false) + ellipse(36, 32, 10, 6, '#ffffff', false, 'opacity="0.7" transform="rotate(-30 36 32)"');
    },
  },
  gem: {
    w: 100,
    h: 100,
    body: (id, defs) => {
      defs.push(linear(`${id}g`, [[0, '#9ef0ff'], [1, '#3f8ff0']], 0, 0, 1, 1));
      return path('M50,10 L86,36 L72,88 L28,88 L14,36 Z', `url(#${id}g)`) + flat('M50,10 L60,36 L50,88 L40,36 Z', '#ffffff', 'opacity="0.35"') + line('M14,36 L86,36 M40,36 L50,88 L60,36', OUTLINE, 3, 'opacity="0.5"') + flat('M32,22 L44,20 L36,32 Z', '#ffffff', 'opacity="0.8"');
    },
  },
  chest: {
    w: 150,
    h: 130,
    body: (id, defs) => {
      defs.push(linear(`${id}w`, [[0, '#c98a4b'], [1, '#8d5a2b']]));
      return (
        path('M14,62 L136,62 L130,120 L20,120 Z', `url(#${id}w)`) +
        path('M14,62 C14,26 42,12 75,12 C108,12 136,26 136,62 Z', lighten('#c98a4b', 0.1)) +
        path('M66,12 L84,12 L84,120 L66,120 Z', '#ffcf3a') +
        path('M14,58 L136,58 L136,70 L14,70 Z', '#ffcf3a') +
        path('M64,62 L86,62 L86,86 L75,94 L64,86 Z', '#ffe26a') +
        circle(75, 74, 4, OUTLINE, false) +
        flat('M28,28 Q40,18 56,16 L54,24 Q42,26 34,34 Z', '#ffffff', 'opacity="0.35"')
      );
    },
  },
  boot: {
    w: 130,
    h: 130,
    body: () =>
      path('M36,10 L80,10 L80,72 C80,80 90,84 104,86 C120,88 124,104 120,116 L24,116 C20,104 24,90 30,76 Z', '#5a7f4f') +
      path('M22,104 L122,104 L120,122 L22,122 Z', '#3d5636') +
      path('M32,10 L84,10 L84,24 L32,24 Z', '#7da36d') +
      line('M44,40 l24,0 M44,54 l24,0', '#cfe3a8', 4) +
      flat('M40,30 L46,28 L44,70 L38,70 Z', '#ffffff', 'opacity="0.3"') +
      // tiny water drip + leaf
      path('M88,96 C92,84 104,82 108,92 Z', '#8fd46d', 'stroke-width="3"'),
  },
  can: {
    w: 100,
    h: 130,
    body: (id, defs) => {
      defs.push(linear(`${id}c`, [[0, '#ff6b6b'], [0.5, '#ff9b8a'], [1, '#d94c4c']], 0, 0, 1, 0));
      return (
        path('M18,20 L82,20 L82,112 L18,112 Z', `url(#${id}c)`) +
        ellipse(50, 20, 32, 9, '#d7dbe6') +
        ellipse(50, 112, 32, 9, '#b3b8c6') +
        path('M18,52 L82,52 L82,82 L18,82 Z', '#fff4e0') +
        flat('M30,60 Q50,52 70,60 Q50,76 30,72 Z', '#ff6b6b', 'opacity="0.8"') +
        flat('M26,26 L32,26 L32,108 L26,108 Z', '#ffffff', 'opacity="0.35"') +
        ellipse(58, 18, 8, 3, OUTLINE, false)
      );
    },
  },
  bottle: {
    w: 100,
    h: 140,
    body: () =>
      path('M38,10 L62,10 L62,40 C80,48 84,62 84,80 L84,124 C84,130 78,134 72,134 L28,134 C22,134 16,130 16,124 L16,80 C16,62 20,48 38,40 Z', '#9fe3c9', 'fill-opacity="0.8"') +
      path('M36,4 L64,4 L64,16 L36,16 Z', '#c99a6b') +
      path('M30,70 L70,64 L72,108 L32,112 Z', '#fff4dc') +
      line('M38,80 l26,-3 M38,90 l26,-3 M40,100 l18,-2', '#c7a77a', 3) +
      flat('M24,74 L30,74 L30,122 L24,122 Z', '#ffffff', 'opacity="0.5"'),
  },
  wheel: {
    w: 140,
    h: 140,
    body: () =>
      circle(70, 70, 56, 'none', true, 'stroke-width="14" stroke="#4a4458"') +
      circle(70, 70, 56, 'none', true, 'stroke-width="6" stroke="#6e687f"') +
      line('M70,18 L70,122 M18,70 L122,70 M33,33 L107,107 M107,33 L33,107', '#b9b4c9', 3) +
      circle(70, 70, 10, '#d7d3e2') +
      path('M100,20 C112,10 126,16 122,30 Z', '#8fd46d', 'stroke-width="3"'),
  },
  bobber: {
    w: 60,
    h: 90,
    body: () =>
      line('M30,4 L30,20', OUTLINE, 4) +
      path('M30,18 C46,18 52,34 52,48 L8,48 C8,34 14,18 30,18 Z', '#ff4d5e') +
      path('M8,48 L52,48 C52,64 44,76 30,76 C16,76 8,64 8,48 Z', '#ffffff') +
      flat('M16,30 Q22,24 28,24 L26,32 Q20,34 18,40 Z', '#ffffff', 'opacity="0.6"'),
  },
  hook: {
    w: 40,
    h: 70,
    body: () => line('M20,4 L20,44 C20,60 6,62 6,48 L6,42', '#5b6178', 6) + line('M20,4 L20,44 C20,60 6,62 6,48 L6,42', '#c9d1e6', 2.5) + flat('M2,44 L6,34 L12,44 Z', '#c9d1e6', `stroke="${OUTLINE}" stroke-width="2"`),
  },
  worm: {
    w: 60,
    h: 60,
    body: () => line('M12,30 C12,14 30,14 30,30 C30,46 48,46 48,30', '#ff8fa8', 12) + line('M12,30 C12,14 30,14 30,30 C30,46 48,46 48,30', '#ffb3c4', 5) + circle(48, 28, 2.5, OUTLINE, false),
  },
  sparkle: {
    w: 64,
    h: 64,
    body: () => flat('M32,2 Q36,28 62,32 Q36,36 32,62 Q28,36 2,32 Q28,28 32,2 Z', '#ffffff'),
  },
  ripple: {
    w: 128,
    h: 48,
    body: () => ellipse(64, 24, 58, 18, 'none', false, 'stroke="#ffffff" stroke-width="5" opacity="0.9"'),
  },
  bubble: {
    w: 40,
    h: 40,
    body: () => circle(20, 20, 15, '#ffffff', false, 'fill-opacity="0.25" stroke="#ffffff" stroke-width="3" stroke-opacity="0.85"') + circle(15, 14, 4, '#ffffff', false, 'opacity="0.9"'),
  },
  drop: {
    w: 32,
    h: 32,
    body: () => circle(16, 16, 13, '#ffffff', false),
  },
  leaf: {
    w: 40,
    h: 30,
    body: () => flat('M2,15 Q20,0 38,15 Q20,30 2,15 Z', '#ffffff'),
  },
};

function medal(dark: string, light: string) {
  return (
    path('M30,6 L44,40 L36,44 L22,10 Z', '#ff6b8f', 'stroke-width="3.5"') +
    path('M66,6 L52,40 L60,44 L74,10 Z', '#5fb4ef', 'stroke-width="3.5"') +
    circle(48, 60, 28, dark) +
    circle(48, 60, 19, light, false) +
    flat('M48,46 L52,56 L62,57 L54,63 L57,73 L48,67 L39,73 L42,63 L34,57 L44,56 Z', dark)
  );
}

// ----- UI icons (white-on-transparent glyphs are tinted in game; these are full-colour) -----
const ICONS: Record<string, Art> = {
  i_rod: { w: 96, h: 96, body: () => line('M16,84 L80,12', '#8d5a2b', 8) + line('M16,84 L80,12', '#c98a4b', 4) + circle(30, 68, 9, '#5b6178') + line('M80,12 Q90,40 70,60', '#ffffff', 2.5) + flat('M66,58 L72,64 L64,66 Z', '#c9d1e6') },
  i_line: { w: 96, h: 96, body: () => circle(48, 48, 34, '#7fd3e6') + circle(48, 48, 22, '#e8f7fb', false) + circle(48, 48, 9, '#5b6178') + line('M48,14 Q70,30 82,10', '#ffffff', 3) },
  i_bait: { w: 96, h: 96, body: () => line('M18,52 C18,26 46,26 46,52 C46,76 74,76 74,52', '#ff8fa8', 16) + line('M18,52 C18,26 46,26 46,52 C46,76 74,76 74,52', '#ffc2cf', 6) + circle(76, 48, 3, OUTLINE, false) },
  i_float: { w: 96, h: 96, body: () => line('M48,8 L48,24', OUTLINE, 5) + path('M48,22 C68,22 74,40 74,52 L22,52 C22,40 28,22 48,22 Z', '#ff4d5e') + path('M22,52 L74,52 C74,72 62,86 48,86 C34,86 22,72 22,52 Z', '#ffffff') },
  i_book: { w: 96, h: 96, body: () => path('M14,18 L46,24 L46,86 L14,80 Z', '#7fd3e6') + path('M82,18 L50,24 L50,86 L82,80 Z', '#9be3f1') + line('M22,38 l16,3 M22,50 l16,3 M58,41 l16,-3 M58,53 l16,-3', '#ffffff', 3) },
  i_paw: { w: 96, h: 96, body: () => ellipse(48, 62, 22, 18, '#ffb3cf') + circle(24, 38, 9, '#ffb3cf') + circle(40, 24, 9, '#ffb3cf') + circle(58, 24, 9, '#ffb3cf') + circle(74, 38, 9, '#ffb3cf') },
  i_map: { w: 96, h: 96, body: () => path('M10,22 L34,14 L62,22 L86,14 L86,76 L62,84 L34,76 L10,84 Z', '#ffe9b0') + line('M34,14 L34,76 M62,22 L62,84', '#d9b878', 3) + line('M20,62 Q36,40 52,54 T78,30', '#ff6b6b', 4, 'stroke-dasharray="6 6"') + flat('M74,24 l8,8 M82,24 l-8,8', '#ff6b6b', `stroke="#ff6b6b" stroke-width="4"`) },
  i_up: { w: 96, h: 96, body: () => path('M48,10 L84,48 L62,48 L62,86 L34,86 L34,48 L12,48 Z', '#5fd38d') },
  i_egg: { w: 96, h: 96, body: () => path('M48,8 C70,8 82,44 82,62 C82,80 68,90 48,90 C28,90 14,80 14,62 C14,44 26,8 48,8 Z', '#fff3d6') + circle(36, 46, 6, '#8fcf7a', false) + circle(58, 64, 8, '#8fcf7a', false) + circle(62, 34, 5, '#8fcf7a', false) },
  i_gift: { w: 96, h: 96, body: () => path('M14,40 L82,40 L82,56 L14,56 Z', '#ff6b8f') + path('M20,56 L76,56 L76,86 L20,86 Z', '#ff8fab') + path('M42,40 L54,40 L54,86 L42,86 Z', '#ffd23f') + path('M48,40 C34,20 20,30 30,40 Z', '#ffd23f') + path('M48,40 C62,20 76,30 66,40 Z', '#ffd23f') },
  // Woven basket with two eggs peeking out.
  i_basket: {
    w: 96,
    h: 96,
    body: () =>
      line('M22,46 C22,14 74,14 74,46', '#b07a3c', 7) +
      path('M32,44 C32,26 52,24 54,44 Z', '#fff3d6') +
      path('M50,44 C50,22 72,24 70,44 Z', '#cfe9ff') +
      path('M10,44 L86,44 L76,86 L20,86 Z', '#d9a35c') +
      line('M14,58 L82,58 M17,72 L79,72', '#b07a3c', 4) +
      line('M34,44 L36,86 M48,44 L48,86 M62,44 L60,86', '#b07a3c', 3),
  },
  i_medal1: { w: 96, h: 96, body: () => medal('#d98b4a', '#f2b47e') },
  i_medal2: { w: 96, h: 96, body: () => medal('#a8b3c7', '#e3e9f2') },
  i_medal3: { w: 96, h: 96, body: () => medal('#f2b81f', '#ffe36e') },
  i_trophy: {
    w: 96,
    h: 96,
    body: () =>
      path('M26,16 L70,16 L68,44 C66,58 56,64 48,64 C40,64 30,58 28,44 Z', '#ffd23f') +
      line('M26,24 C10,24 12,44 28,44 M70,24 C86,24 84,44 68,44', OUTLINE, 5) +
      line('M26,24 C10,24 12,44 28,44 M70,24 C86,24 84,44 68,44', '#ffd23f', 2.5) +
      path('M42,64 L54,64 L56,76 L40,76 Z', '#e0a81c') +
      path('M28,76 L68,76 L70,88 L26,88 Z', '#8d5a2b') +
      flat('M34,22 L42,22 L40,46 L34,40 Z', '#ffffff', 'opacity="0.45"'),
  },
  i_shirt: {
    w: 96,
    h: 96,
    body: () => path('M30,14 L18,22 L8,42 L22,48 L26,40 L26,86 L70,86 L70,40 L74,48 L88,42 L78,22 L66,14 C62,22 54,26 48,26 C42,26 34,22 30,14 Z', '#7fd3e6') + circle(48, 52, 9, '#ffd23f'),
  },
  i_star: { w: 96, h: 96, body: () => path('M48,8 L59,34 L88,36 L65,54 L73,84 L48,67 L23,84 L31,54 L8,36 L37,34 Z', '#ffd23f') },
  i_lock: { w: 96, h: 96, body: () => line('M30,42 L30,30 C30,10 66,10 66,30 L66,42', OUTLINE, 9) + line('M30,42 L30,30 C30,10 66,10 66,30 L66,42', '#b9b4c9', 4) + path('M20,40 L76,40 L76,86 L20,86 Z', '#ffcf3a') + circle(48, 60, 6, OUTLINE, false) + flat('M45,62 L51,62 L50,74 L46,74 Z', OUTLINE) },
  i_clock: { w: 96, h: 96, body: () => circle(48, 48, 38, '#ffffff') + line('M48,48 L48,24 M48,48 L64,58', OUTLINE, 5) + circle(48, 48, 4, OUTLINE, false) },
  i_auto: { w: 96, h: 96, body: () => circle(48, 48, 36, '#7fd3e6') + line('M30,46 A20,20 0 1,1 48,68', '#ffffff', 7) + flat('M22,40 L38,40 L30,54 Z', '#ffffff') },
  i_quest: { w: 96, h: 96, body: () => path('M20,10 L76,10 L76,86 L20,86 Z', '#fff4dc') + path('M34,4 L62,4 L62,18 L34,18 Z', '#c9a26b') + line('M32,36 l8,8 l14,-16', '#5fd38d', 6) + line('M32,62 l32,0', '#c7a77a', 5) },
  i_crown: { w: 96, h: 96, body: () => path('M12,76 L8,28 L32,48 L48,18 L64,48 L88,28 L84,76 Z', '#ffd23f') + circle(48, 58, 6, '#ff5d8f') },
  i_sound: { w: 96, h: 96, body: () => path('M14,36 L32,36 L54,16 L54,80 L32,60 L14,60 Z', '#ffffff') + line('M66,34 Q76,48 66,62 M74,24 Q92,48 74,72', '#ffffff', 7) + line('M66,34 Q76,48 66,62 M74,24 Q92,48 74,72', OUTLINE, 0.01) },
  i_mute: { w: 96, h: 96, body: () => path('M14,36 L32,36 L54,16 L54,80 L32,60 L14,60 Z', '#ffffff') + line('M66,36 L88,60 M88,36 L66,60', OUTLINE, 11) + line('M66,36 L88,60 M88,36 L66,60', '#ff6b6b', 6) },
  i_music: { w: 96, h: 96, body: () => path('M36,20 L80,10 L80,64 C80,74 64,78 60,70 C56,62 68,56 72,58 L72,26 L44,32 L44,72 C44,82 28,86 24,78 C20,70 32,64 36,66 Z', '#ffffff') },
  // Clapperboard: Poki's required "video" mark on every rewarded-ad button.
  i_video: {
    w: 96,
    h: 96,
    body: () =>
      path('M12,40 L86,40 L86,84 L12,84 Z', '#4b4f7a') +
      path('M10,24 L84,10 L88,26 L14,40 Z', '#ffffff') +
      flat('M24,21.5 L36,19 L30,35 L18,37.5 Z M48,17 L60,14.8 L54,30.6 L42,32.9 Z M72,12.6 L84,10.4 L78,26 L66,28.3 Z', OUTLINE) +
      path('M10,24 L84,10 L88,26 L14,40 Z', 'none') +
      flat('M40,52 L62,62 L40,72 Z', '#ffd23f'),
  },
  i_gear: {
    w: 96,
    h: 96,
    body: () => {
      let teeth = '';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = 48 + Math.cos(a) * 34;
        const y = 48 + Math.sin(a) * 34;
        teeth += `<rect x="${f(x - 9)}" y="${f(y - 9)}" width="18" height="18" rx="4" transform="rotate(${f((a * 180) / Math.PI)} ${f(x)} ${f(y)})" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4.5"/>`;
      }
      return teeth + circle(48, 48, 30, '#ffffff') + circle(48, 48, 12, '#7fd3e6');
    },
  },
  i_hatch: { w: 96, h: 96, body: () => path('M48,8 C70,8 82,44 82,62 C82,80 68,90 48,90 C28,90 14,80 14,62 C14,44 26,8 48,8 Z', '#ffe9b0') + line('M16,52 l12,-8 l10,10 l12,-12 l10,10 l12,-10 l10,8', OUTLINE, 4) + flat('M48,30 l3,8 8,1 -6,5 2,8 -7,-4 -7,4 2,-8 -6,-5 8,-1 Z', '#ff9c4a') },
};

export const ITEM_KEYS = Object.keys(ART);
export const ICON_KEYS = Object.keys(ICONS);
export const EGG_TIERS = RARITY_EGG.length;

function render(art: Art) {
  const id = nextId('i');
  const defs: string[] = [];
  const body = art.body(id, defs);
  return svg(art.w, art.h, defs.join(''), body);
}

export function itemSvg(key: string) {
  return render(ART[key] ?? ICONS[key]);
}
export function itemSize(key: string) {
  const a = ART[key] ?? ICONS[key];
  return { w: a.w, h: a.h };
}
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

/** Wardrobe bobber in two colours (same shape and size as item:bobber). */
export function bobberSvg(top: number, bottom: number) {
  return render({
    w: 60,
    h: 90,
    body: () =>
      line('M30,4 L30,20', OUTLINE, 4) +
      path('M30,18 C46,18 52,34 52,48 L8,48 C8,34 14,18 30,18 Z', hex(top)) +
      path('M8,48 L52,48 C52,64 44,76 30,76 C16,76 8,64 8,48 Z', hex(bottom)) +
      flat('M16,30 Q22,24 28,24 L26,32 Q20,34 18,40 Z', '#ffffff', 'opacity="0.6"'),
  });
}

export function eggSvg(tier: number) {
  return render(eggArt(tier));
}
export const EGG_SIZE = { w: 140, h: 170 };

export function previewItems() {
  return [
    ...[0, 1, 2, 3, 4].map((t) => ({ name: `egg_${t}`, svg: eggSvg(t), ...EGG_SIZE })),
    ...ITEM_KEYS.filter((k) => !['ripple', 'drop', 'leaf', 'sparkle', 'bubble'].includes(k)).map((k) => ({ name: k, svg: itemSvg(k), ...itemSize(k) })),
    ...ICON_KEYS.map((k) => ({ name: k, svg: itemSvg(k), ...itemSize(k) })),
  ];
}

void f;
