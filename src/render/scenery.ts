// Pond scenery: sky details, far bank, dock, plants above and below the water, and the cat angler.
// Each pond has its own palette. Pieces are separate sprites so the scene can be laid out for any
// screen shape (tall phone, 16:9 desktop) and so plants can sway.
import { OUTLINE, circle, darken, ellipse, eye, flat, happyEye, lighten, line, linear, nextId, path, radial, svg } from './svg';

export interface PondPalette {
  skyTop: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  tree: string;
  treeDark: string;
  trunk: string;
  waterTop: string;
  waterDeep: string;
  sand: string;
  weed: string;
  weed2: string;
  rock: string;
  mist: boolean;
}

export const PALETTES: Record<string, PondPalette> = {
  cozy: {
    skyTop: '#7fd0f2',
    skyBottom: '#dff6ff',
    hillFar: '#a6dc8a',
    hillNear: '#7cc96f',
    tree: '#6cc06b',
    treeDark: '#4e9f57',
    trunk: '#9a6744',
    waterTop: '#5fcbe0',
    waterDeep: '#1d5f93',
    sand: '#e9d59e',
    weed: '#4fb46a',
    weed2: '#7fd36d',
    rock: '#9aa7b8',
    mist: false,
  },
  misty: {
    skyTop: '#b9a8ec',
    skyBottom: '#ffd8cc',
    hillFar: '#a7a9d9',
    hillNear: '#7f8fc7',
    tree: '#5f8fa0',
    treeDark: '#46707f',
    trunk: '#6d5a7a',
    waterTop: '#7ac2d0',
    waterDeep: '#253f6e',
    sand: '#c9c0b0',
    weed: '#4f9a8a',
    weed2: '#7ccfb0',
    rock: '#8a8fae',
    mist: true,
  },
};

type Piece = { w: number; h: number; svg: string };

function piece(w: number, h: number, build: (id: string, defs: string[]) => string): Piece {
  const id = nextId('s');
  const defs: string[] = [];
  const body = build(id, defs);
  return { w, h, svg: svg(w, h, defs.join(''), body) };
}

/** Rolling hills strip, 1600 wide so it covers wide screens. */
function hills(p: PondPalette, near: boolean): Piece {
  const w = 1600;
  const h = 260;
  return piece(w, h, () => {
    const col = near ? p.hillNear : p.hillFar;
    let d = `M0,${h}`;
    const base = near ? 150 : 110;
    const amps = near ? [40, 26, 48, 22, 36, 30, 44, 28] : [60, 40, 70, 46, 64, 38, 58, 50];
    const step = w / amps.length;
    d += ` L0,${base}`;
    for (let i = 0; i < amps.length; i++) {
      const x0 = i * step;
      d += ` Q${x0 + step / 2},${base - amps[i] * 1.6} ${x0 + step},${base - (i % 2 ? 10 : 0)}`;
    }
    d += ` L${w},${h} Z`;
    const hi = lighten(col, 0.22);
    return path(d, col, 'stroke-width="4"') + flat(`M0,${base + 18} Q${w / 4},${base - 6} ${w / 2},${base + 18} T${w},${base + 18} L${w},${base + 26} Q${(3 * w) / 4},${base + 8} ${w / 2},${base + 26} T0,${base + 26} Z`, hi, 'opacity="0.5"');
  });
}

function roundTree(p: PondPalette): Piece {
  return piece(150, 190, (id, defs) => {
    defs.push(radial(`${id}t`, [[0, lighten(p.tree, 0.25)], [1, p.tree]], 0.4, 0.3, 0.75));
    return (
      path('M66,120 L84,120 L88,186 L62,186 Z', p.trunk) +
      path('M20,96 C6,70 26,40 52,44 C58,16 102,12 110,42 C138,40 150,74 132,96 C140,124 104,138 78,128 C52,140 12,126 20,96 Z', `url(#${id}t)`) +
      circle(54, 72, 9, p.treeDark, false, 'opacity="0.5"') +
      circle(98, 92, 11, p.treeDark, false, 'opacity="0.5"') +
      ellipse(62, 50, 18, 9, '#ffffff', false, 'opacity="0.3"')
    );
  });
}

function pineTree(p: PondPalette): Piece {
  return piece(130, 220, () =>
    path('M58,180 L72,180 L74,216 L56,216 Z', p.trunk) +
    path('M65,8 L100,70 L84,70 L114,128 L94,128 L124,186 L6,186 L36,128 L16,128 L46,70 L30,70 Z', p.tree) +
    flat('M65,20 L84,62 L70,58 Z', lighten(p.tree, 0.3), 'opacity="0.6"'),
  );
}

function cloud(): Piece {
  return piece(220, 110, () => path('M30,90 C6,90 6,58 32,56 C30,26 70,16 86,40 C100,10 150,14 152,48 C182,40 206,64 190,90 Z', '#ffffff', `stroke="${lighten(OUTLINE, 0.55)}" stroke-width="4"`) + flat('M44,80 L180,80', '#ffffff') + ellipse(80, 44, 22, 8, '#ffffff', false));
}

function sun(): Piece {
  return piece(160, 160, (id, defs) => {
    defs.push(radial(`${id}s`, [[0, '#fff6c2', 1], [0.5, '#ffe27a', 0.6], [1, '#ffe27a', 0]]));
    return circle(80, 80, 78, `url(#${id}s)`, false) + circle(80, 80, 34, '#fff1a0', true, `stroke="#ffcf4a" stroke-width="5"`);
  });
}

function dock(p: PondPalette): Piece {
  return piece(360, 300, (id, defs) => {
    defs.push(linear(`${id}w`, [[0, '#d39a62'], [1, '#a8703f']]));
    const wood = `url(#${id}w)`;
    const posts = [40, 150, 260]
      .map((x) => path(`M${x},96 L${x + 26},96 L${x + 24},296 L${x + 2},296 Z`, darken('#a8703f', 0.1)) + line(`M${x + 6},140 L${x + 20},140 M${x + 6},200 L${x + 20},200`, darken('#a8703f', 0.35), 3))
      .join('');
    let planks = '';
    for (let i = 0; i < 6; i++) planks += path(`M${i * 58 + 4},70 L${i * 58 + 60},70 L${i * 58 + 60},100 L${i * 58 + 4},100 Z`, wood, 'stroke-width="3.5"');
    return (
      posts +
      path('M0,94 L356,94 L356,112 L0,112 Z', darken('#a8703f', 0.15)) +
      planks +
      flat('M8,74 L352,74 L352,79 L8,79 Z', '#ffffff', 'opacity="0.3"') +
      // little lantern post and a bucket for coziness
      line('M330,70 L330,18', OUTLINE, 6) +
      line('M330,70 L330,18', '#7a5a3a', 3) +
      path('M318,18 L342,18 L338,40 L322,40 Z', '#ffd86b') +
      path('M30,46 L66,46 L62,72 L34,72 Z', '#8fb8d8') +
      ellipse(48, 46, 18, 5, '#bfe0f2') +
      (p.mist ? circle(330, 28, 18, '#fff3b0', false, 'opacity="0.35"') : '')
    );
  });
}

function lilyPad(flower: boolean): Piece {
  return piece(150, 70, () =>
    path('M75,10 C120,10 144,24 144,36 C144,50 116,60 75,60 C34,60 6,50 6,36 C6,24 30,10 75,10 Z M75,36 L110,14 L100,34 Z', '#6fcf6a', 'fill-rule="evenodd"') +
    line('M75,36 L40,26 M75,36 L50,52 M75,36 L106,50', '#4fae55', 3) +
    (flower
      ? path('M64,30 C56,10 70,2 76,16 C82,2 96,10 88,30 C82,36 70,36 64,30 Z', '#ffc2dc', 'stroke-width="3.5"') + path('M58,30 C46,22 50,12 62,20 Z', '#ffa8cb', 'stroke-width="3"') + path('M94,30 C106,22 102,12 90,20 Z', '#ffa8cb', 'stroke-width="3"') + circle(76, 24, 5, '#ffe36e', false)
      : ''),
  );
}

function reeds(p: PondPalette): Piece {
  return piece(120, 220, () => {
    let s = '';
    const blades: [number, number, number][] = [[30, 40, -8], [50, 10, 4], [70, 30, 10], [90, 60, 16], [60, 70, -4]];
    for (const [x, top, lean] of blades) s += path(`M${x - 6},216 C${x - 4},150 ${x + lean - 2},${top + 30} ${x + lean},${top} C${x + lean + 4},${top + 30} ${x + 6},150 ${x + 6},216 Z`, p.weed2, 'stroke-width="3.5"');
    s += path('M48,24 C44,4 58,4 56,24 L56,60 L48,60 Z', '#9a6744', 'stroke-width="3.5"');
    s += path('M78,52 C74,32 88,32 86,52 L86,84 L78,84 Z', '#9a6744', 'stroke-width="3.5"');
    return s;
  });
}

function seaweed(p: PondPalette, tall: boolean): Piece {
  const h = tall ? 300 : 190;
  return piece(90, h, () => {
    const c = tall ? p.weed : p.weed2;
    const d = `M40,${h} C20,${h * 0.75} 60,${h * 0.55} 34,${h * 0.35} C18,${h * 0.22} 40,${h * 0.1} 44,6 C58,${h * 0.12} 46,${h * 0.25} 58,${h * 0.38} C78,${h * 0.58} 40,${h * 0.75} 56,${h} Z`;
    return path(d, c, 'stroke-width="4"') + flat(`M44,14 C50,${h * 0.2} 42,${h * 0.3} 50,${h * 0.42}`, 'none', `stroke="${lighten(c, 0.35)}" stroke-width="4" stroke-linecap="round" opacity="0.6"`);
  });
}

function rocks(p: PondPalette): Piece {
  return piece(220, 110, (id, defs) => {
    defs.push(linear(`${id}r`, [[0, lighten(p.rock, 0.2)], [1, darken(p.rock, 0.1)]]));
    return path('M10,106 C6,74 30,52 58,58 C70,30 112,28 124,56 C150,44 186,56 192,84 C208,88 214,100 210,106 Z', `url(#${id}r)`) + path('M120,106 C118,90 132,80 146,86 C160,80 176,92 170,106 Z', lighten(p.rock, 0.1)) + ellipse(72, 70, 14, 6, '#ffffff', false, 'opacity="0.35"');
  });
}

function sandStrip(p: PondPalette): Piece {
  return piece(1600, 120, () => {
    let d = 'M0,120 L0,40';
    for (let i = 0; i < 16; i++) d += ` Q${i * 100 + 50},${i % 2 ? 22 : 52} ${i * 100 + 100},38`;
    d += ' L1600,120 Z';
    let pebbles = '';
    for (let i = 0; i < 40; i++) pebbles += ellipse((i * 397) % 1600, 70 + ((i * 53) % 40), 6 + (i % 3) * 2, 4 + (i % 2) * 2, darken(p.sand, 0.12), false, 'opacity="0.55"');
    return path(d, p.sand, 'stroke-width="4"') + pebbles;
  });
}

function lightRay(): Piece {
  return piece(160, 600, (id, defs) => {
    defs.push(linear(`${id}l`, [[0, '#ffffff', 0.55], [1, '#ffffff', 0]]));
    return flat('M60,0 L110,0 L160,600 L0,600 Z', `url(#${id}l)`);
  });
}

function fogBand(): Piece {
  return piece(800, 120, (id, defs) => {
    defs.push(radial(`${id}f`, [[0, '#ffffff', 0.75], [1, '#ffffff', 0]], 0.5, 0.5, 0.5));
    return ellipse(400, 60, 400, 60, `url(#${id}f)`, false);
  });
}

function firefly(): Piece {
  return piece(40, 40, (id, defs) => {
    defs.push(radial(`${id}g`, [[0, '#fffbd0', 1], [0.4, '#ffe96b', 0.8], [1, '#ffe96b', 0]]));
    return circle(20, 20, 20, `url(#${id}g)`, false);
  });
}

/** Waterline band, tileable horizontally (256 wide): bright edge and a soft foam line. */
function surface(p: PondPalette): Piece {
  return piece(256, 48, (id, defs) => {
    defs.push(linear(`${id}s`, [[0, lighten(p.waterTop, 0.45)], [1, p.waterTop, 0]]));
    const wave = 'M0,14 Q32,4 64,14 T128,14 T192,14 T256,14';
    return flat(`${wave} L256,48 L0,48 Z`, `url(#${id}s)`) + line(wave, '#ffffff', 5, 'opacity="0.9"');
  });
}

// ---------------- Cat angler ----------------

/** Cat in a yellow rain hat, sitting on the dock edge, seen from the side facing right. */
function cat(blink: boolean): Piece {
  return piece(200, 220, (id, defs) => {
    defs.push(linear(`${id}c`, [[0, '#ffffff'], [1, '#f1e6dc']]));
    const fur = `url(#${id}c)`;
    return (
      // tail
      path('M40,190 C10,190 4,160 18,140 C24,154 34,170 54,174 Z', '#f6a35c') +
      // body
      path('M44,200 C40,150 60,118 100,118 C140,118 156,150 152,200 Z', fur) +
      path('M60,200 C60,166 74,148 100,148 C124,148 136,166 136,200 Z', '#ffd9b8', 'stroke-width="0"') +
      // raincoat collar
      path('M58,132 C80,146 120,146 142,132 L146,150 C120,164 80,164 54,150 Z', '#ffcf3a') +
      // legs dangling over the edge
      path('M118,196 C120,214 140,216 142,200 Z', fur) +
      // head
      path('M48,84 C48,46 72,30 100,30 C128,30 152,46 152,84 C152,116 128,132 100,132 C72,132 48,116 48,84 Z', fur) +
      // orange ear patches + ears
      path('M58,52 L56,18 L86,36 Z', '#f6a35c') +
      path('M142,52 L144,18 L114,36 Z', fur) +
      flat('M64,46 L62,28 L78,38 Z', '#ffb3c4') +
      // rain hat
      path('M38,48 C40,22 70,6 100,6 C130,6 160,22 162,48 C172,52 176,60 168,62 C130,54 70,54 32,62 C24,60 28,52 38,48 Z', '#ffcf3a') +
      flat('M56,24 Q78,12 100,12 L98,20 Q76,22 60,32 Z', '#ffffff', 'opacity="0.45"') +
      // face
      (blink ? happyEye(84, 86, 9) + happyEye(124, 86, 9) : eye(84, 86, 11, '#2b1d38', 0.25) + eye(124, 86, 11, '#2b1d38', 0.25)) +
      ellipse(74, 104, 9, 5, '#ff7aa8', false, 'opacity="0.45"') +
      ellipse(136, 104, 9, 5, '#ff7aa8', false, 'opacity="0.45"') +
      flat('M100,98 L94,92 L106,92 Z', '#ff8fa8', `stroke="${OUTLINE}" stroke-width="2"`) +
      line('M92,104 Q100,110 108,104', OUTLINE, 3) +
      line('M60,98 l-20,-4 M60,104 l-20,4 M140,98 l20,-4 M140,104 l20,4', OUTLINE, 2.4, 'opacity="0.6"') +
      // paws holding the rod (rod drawn separately)
      ellipse(126, 150, 15, 12, fur)
    );
  });
}

function rod(): Piece {
  // pivot at (20, 200): the cat's paws. Tip at (380, 12).
  return piece(400, 220, () => line('M20,200 L380,14', OUTLINE, 11) + line('M20,200 L380,14', '#c98a4b', 6) + line('M20,200 L120,148', '#8d5a2b', 7) + circle(70, 175, 13, '#5b6178') + circle(70, 175, 5, '#c9d1e6', false) + circle(380, 14, 5, '#ff6b6b'));
}

export function sceneryPieces(pond: string): Record<string, Piece> {
  const p = PALETTES[pond];
  const pieces: Record<string, Piece> = {
    hillsFar: hills(p, false),
    hillsNear: hills(p, true),
    tree: p.mist ? pineTree(p) : roundTree(p),
    dock: dock(p),
    reeds: reeds(p),
    weedTall: seaweed(p, true),
    weedShort: seaweed(p, false),
    rocks: rocks(p),
    sand: sandStrip(p),
    surface: surface(p),
  };
  return pieces;
}

/** Pieces shared by every pond. */
export function commonPieces(): Record<string, Piece> {
  return {
    cloud: cloud(),
    sun: sun(),
    lily: lilyPad(false),
    lilyFlower: lilyPad(true),
    ray: lightRay(),
    fog: fogBand(),
    firefly: firefly(),
    cat: cat(false),
    catBlink: cat(true),
    rod: rod(),
  };
}

export function previewItems() {
  const out: { name: string; svg: string; w: number; h: number }[] = [];
  for (const pond of ['cozy', 'misty']) for (const [k, v] of Object.entries(sceneryPieces(pond))) out.push({ name: `${pond}.${k}`, ...v });
  for (const [k, v] of Object.entries(commonPieces())) out.push({ name: k, ...v });
  return out;
}
