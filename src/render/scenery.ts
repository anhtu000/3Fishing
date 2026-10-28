// Pond scenery: sky details, far bank, dock, plants above and below the water, and the cat angler.
// Each pond has its own palette. Pieces are separate sprites so the scene can be laid out for any
// screen shape (tall phone, 16:9 desktop) and so plants can sway.
import { catSvg } from './catArt';
import { bird, butterfly, cottage, frostBank, glacierFar, horizon, logCabin, meadowFar, meadowNear, mistyFar, mistyNear, oakTree, pineTree, puff, stoneBridge, willow } from './shore';
import { OUTLINE, circle, darken, ellipse, flat, lighten, line, linear, nextId, path, radial, svg } from './svg';

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
  /** Snow caps, ice floes and falling snow (Frozen Lake). */
  snow?: boolean;
  /** Horizon shape: rolling meadow hills, a rocky gorge with cliffs, or snowy peaks. */
  land: 'meadow' | 'gorge' | 'peaks';
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
    land: 'meadow',
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
    land: 'gorge',
  },
  frozen: {
    skyTop: '#9fc3f0',
    skyBottom: '#f2e9ff',
    hillFar: '#e6eefb',
    hillNear: '#cfdcf2',
    tree: '#3f7a78',
    treeDark: '#2e5e5c',
    trunk: '#6a5a6e',
    waterTop: '#6fb3d2',
    waterDeep: '#1a3a66',
    sand: '#d7e2ef',
    weed: '#4f8a94',
    weed2: '#79b8bf',
    rock: '#a3b3cc',
    mist: false,
    snow: true,
    land: 'peaks',
  },
};

type Piece = { w: number; h: number; svg: string };

function piece(w: number, h: number, build: (id: string, defs: string[]) => string): Piece {
  const id = nextId('s');
  const defs: string[] = [];
  const body = build(id, defs);
  return { w, h, svg: svg(w, h, defs.join(''), body) };
}









// ----- Sky extras -----

/** Misty Creek's evening: a soft crescent moon instead of the sun. */
function moon(): Piece {
  return piece(160, 160, (id, defs) => {
    defs.push(radial(`${id}g`, [[0, '#fff8e0', 0.9], [0.5, '#ffe9c2', 0.35], [1, '#ffe9c2', 0]]));
    return circle(80, 80, 78, `url(#${id}g)`, false) + path('M96,40 C70,42 56,62 56,82 C56,104 74,122 98,122 C80,132 44,120 40,86 C36,52 66,32 96,40 Z', '#fff4c9', 'stroke="#f2c97a" stroke-width="4"');
  });
}

/** Frozen Lake: northern lights, a wide soft ribbon. */
function aurora(): Piece {
  return piece(1600, 260, (id, defs) => {
    defs.push(linear(`${id}a`, [[0, '#7dffcf', 0.0], [0.35, '#7dffcf', 0.55], [0.7, '#a98bff', 0.4], [1, '#a98bff', 0]]));
    const band = (y: number, amp: number, th: number) => `M0,${y} C300,${y - amp} 500,${y + amp} 800,${y} C1100,${y - amp} 1300,${y + amp} 1600,${y} L1600,${y + th} C1300,${y + amp + th} 1100,${y - amp + th} 800,${y + th} C500,${y + amp + th} 300,${y - amp + th} 0,${y + th} Z`;
    return flat(band(40, 50, 110), `url(#${id}a)`) + flat(band(90, 40, 70), `url(#${id}a)`, 'opacity="0.6"');
  });
}

/** Misty Creek: flat stepping stones (the pets sit on them). */
function steppingStone(big: boolean): Piece {
  return piece(150, 70, (id, defs) => {
    defs.push(linear(`${id}s`, [[0, '#c3c6dc'], [1, '#8a8fae']]));
    const d = big ? 'M12,36 C10,18 40,10 76,10 C114,10 140,18 140,36 C140,54 112,62 76,62 C38,62 14,54 12,36 Z' : 'M24,36 C22,22 46,14 76,14 C106,14 126,22 126,36 C126,50 104,58 76,58 C46,58 26,50 24,36 Z';
    return path(d, `url(#${id}s)`) + flat('M40,24 C56,16 96,16 110,24 C96,22 56,22 40,30 Z', '#ffffff', 'opacity="0.5"') + ellipse(48, 30, 12, 5, '#7ccfb0', false, 'opacity="0.8"');
  });
}

// ----- Pond floor decor -----

/** Misty Creek floor: a sunken driftwood log and round river pebbles. */
function driftwood(p: PondPalette): Piece {
  return piece(220, 110, () =>
    path('M14,92 C10,74 26,64 44,66 L176,56 C196,54 210,66 206,82 C204,96 190,102 172,100 L46,104 C30,106 16,104 14,92 Z', '#8a6a52') +
    ellipse(190, 78, 12, 18, '#b4927a') + ellipse(190, 78, 6, 9, '#8a6a52', false) +
    line('M60,78 L150,72 M70,90 L140,86', darken('#8a6a52', 0.25), 3) +
    path('M96,62 C92,40 108,34 112,58 Z', p.weed2, 'stroke-width="3"') +
    ellipse(30, 104, 16, 8, p.rock) + ellipse(118, 106, 12, 6, lighten(p.rock, 0.15)) + ellipse(200, 106, 14, 7, p.rock),
  );
}

/** Frozen Lake floor: clusters of pale ice crystals. */
function iceCrystals(): Piece {
  return piece(220, 130, () => {
    const shard = (x: number, w: number, h: number, lean: number) => path(`M${x - w},126 L${x - w * 0.6 + lean},${126 - h * 0.8} L${x + lean},${126 - h} L${x + w * 0.6 + lean},${126 - h * 0.8} L${x + w},126 Z`, '#cfefff', 'stroke-width="3.5"') + flat(`M${x + lean},${126 - h} L${x - w * 0.6 + lean},${126 - h * 0.8} L${x - w * 0.3},126 L${x},126 Z`, '#ffffff', 'opacity="0.7"');
    return shard(60, 22, 90, -6) + shard(96, 16, 120, 4) + shard(130, 20, 70, 8) + shard(30, 12, 50, -4) + shard(180, 18, 80, 6);
  });
}



/** Flat chunk of floating ice (Frozen Lake's lily pads). */
function iceFloe(big: boolean): Piece {
  return piece(150, 70, (id, defs) => {
    defs.push(linear(`${id}i`, [[0, '#ffffff'], [1, '#cfe3f5']]));
    const d = big ? 'M14,30 L40,12 L96,10 L138,22 L142,40 L112,58 L48,60 L10,46 Z' : 'M24,30 L50,16 L96,14 L126,28 L120,46 L84,56 L40,54 L18,44 Z';
    return path(d, `url(#${id}i)`) + flat('M44,22 L90,20 L100,28 L50,30 Z', '#ffffff', 'opacity="0.8"') + line('M60,40 L76,34 L92,42', '#9fc6e6', 3);
  });
}

function snowflake(): Piece {
  return piece(24, 24, () => circle(12, 12, 9, '#ffffff', false));
}

function cloud(): Piece {
  return piece(220, 110, (id, defs) => {
    defs.push(linear(`${id}c`, [[0, '#ffffff'], [0.6, '#ffffff'], [1, '#dbe9fb']]));
    const d = 'M30,90 C6,90 6,58 32,56 C30,26 70,16 86,40 C100,10 150,14 152,48 C182,40 206,64 190,90 Z';
    return path(d, `url(#${id}c)`, `stroke="${lighten(OUTLINE, 0.62)}" stroke-width="3.5"`) + ellipse(80, 44, 22, 8, '#ffffff', false) + ellipse(140, 40, 14, 6, '#ffffff', false, 'opacity="0.8"');
  });
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
      .map((x) => path(`M${x},96 L${x + 26},96 L${x + 24},296 L${x + 2},296 Z`, darken('#a8703f', 0.1)) + flat(`M${x + 14},98 L${x + 26},98 L${x + 24},296 L${x + 14},296 Z`, '#2a1840', 'opacity="0.18"') + line(`M${x + 6},140 L${x + 20},140 M${x + 6},200 L${x + 20},200`, darken('#a8703f', 0.35), 3) + flat(`M${x + 2},150 L${x + 24},150 L${x + 24},296 L${x + 2},296 Z`, '#3a7a5a', 'opacity="0.25"'))
      .join('');
    let planks = '';
    for (let i = 0; i < 6; i++) {
      const x = i * 58 + 4;
      planks += path(`M${x},70 L${x + 56},70 L${x + 56},100 L${x},100 Z`, wood, 'stroke-width="3.5"');
      // grain, a knot and two nails per plank
      planks += line(`M${x + 6},${78 + (i % 2) * 4} q20,-3 44,1 M${x + 8},${90 - (i % 2) * 3} q18,3 40,-1`, darken('#a8703f', 0.25), 1.8, 'opacity="0.6"');
      if (i % 2 === 0) planks += ellipse(x + 34, 85, 4, 2.4, darken('#a8703f', 0.3), false, 'opacity="0.7"');
      planks += circle(x + 6, 74, 1.8, '#5b4a3a', false) + circle(x + 50, 74, 1.8, '#5b4a3a', false);
    }
    // rope coil on the deck
    planks += ellipse(200, 66, 20, 7, '#d9b47a', true, 'stroke-width="3"') + ellipse(200, 64, 12, 4, 'none', false, 'stroke="#a8844a" stroke-width="2.4"') + ellipse(200, 63, 5, 2, 'none', false, 'stroke="#a8844a" stroke-width="2"');
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
      (p.mist ? circle(330, 28, 18, '#fff3b0', false, 'opacity="0.35"') : '') +
      (p.snow ? path('M2,74 C30,60 70,68 110,62 C150,68 190,58 230,64 C270,58 310,68 358,62 L358,76 L2,76 Z', '#ffffff', 'stroke-width="3.5"') + path('M28,46 C34,38 62,38 68,46 Z', '#ffffff', 'stroke-width="3"') : '')
    );
  });
}

function lilyPad(flower: boolean): Piece {
  return piece(150, 70, (id, defs) =>
    (defs.push(radial(`${id}l`, [[0, '#8fe27f'], [0.7, '#62c463'], [1, '#48a554']], 0.4, 0.35, 0.75)), '') +
    path('M75,10 C120,10 144,24 144,36 C144,50 116,60 75,60 C34,60 6,50 6,36 C6,24 30,10 75,10 Z M75,36 L110,14 L100,34 Z', `url(#${id}l)`, 'fill-rule="evenodd"') +
    line('M75,36 L40,26 M75,36 L50,52 M75,36 L106,50 M75,36 L28,40 M75,36 L120,40', '#4fae55', 2.6) +
    flat('M24,28 C40,16 70,14 90,16 C64,18 40,24 28,34 Z', '#ffffff', 'opacity="0.4"') +
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



// ---------------- Cat angler (art in catArt.ts) ----------------

function rod(): Piece {
  // pivot at (20, 200): the cat's paws. Tip at (380, 12).
  return piece(400, 220, () => line('M20,200 L380,14', OUTLINE, 11) + line('M20,200 L380,14', '#c98a4b', 6) + line('M20,200 L120,148', '#8d5a2b', 7) + circle(70, 175, 13, '#5b6178') + circle(70, 175, 5, '#c9d1e6', false) + circle(380, 14, 5, '#ff6b6b'));
}

export function sceneryPieces(pond: string): Record<string, Piece> {
  const p = PALETTES[pond];
  const pieces: Record<string, Piece> = {
    horizon: horizon(p),
    hillsFar: p.land === 'gorge' ? mistyFar(p) : p.land === 'peaks' ? glacierFar(p) : meadowFar(p),
    hillsNear: p.land === 'gorge' ? mistyNear(p) : p.land === 'peaks' ? frostBank(p) : meadowNear(p),
    landmark: p.land === 'gorge' ? stoneBridge(p) : p.land === 'peaks' ? logCabin() : cottage(),
    tree: p.mist ? willow(p) : p.snow ? pineTree(p) : oakTree(p),
    dock: dock(p),
    reeds: reeds(p),
    weedTall: seaweed(p, true),
    weedShort: seaweed(p, false),
    rocks: p.land === 'gorge' ? driftwood(p) : p.land === 'peaks' ? iceCrystals() : rocks(p),
    sand: sandStrip(p),
    surface: surface(p),
  };
  return pieces;
}

/** Pieces shared by every pond. */
// ---------------- Hats (wardrobe) ----------------
// Same 200 x 220 canvas as the cat, so a hat sprite sits on the head at the cat's position and scale.

function hatPiece(body: string): Piece {
  return piece(200, 220, () => body);
}

const HATS: Record<string, () => string> = {
  rain: () =>
    path('M38,48 C40,22 70,6 100,6 C130,6 160,22 162,48 C172,52 176,60 168,62 C130,54 70,54 32,62 C24,60 28,52 38,48 Z', '#ffcf3a') +
    flat('M56,24 Q78,12 100,12 L98,20 Q76,22 60,32 Z', '#ffffff', 'opacity="0.45"'),
  straw: () =>
    path('M14,58 C14,46 60,40 100,40 C140,40 186,46 186,58 C186,66 140,70 100,70 C60,70 14,66 14,58 Z', '#f2d48a') +
    path('M58,52 C58,22 76,10 100,10 C124,10 142,22 142,52 Z', '#f7df9e') +
    path('M58,40 L142,40 L142,52 L58,52 Z', '#ff6b6b', 'stroke-width="3.5"') +
    line('M70,24 L130,24 M64,32 L136,32 M30,58 L60,62 M140,62 L170,58', '#d9b265', 2.5),
  beanie: () =>
    path('M44,60 C44,22 70,10 100,10 C130,10 156,22 156,60 Z', '#ff6b6b') +
    line('M70,18 L66,56 M100,12 L100,56 M130,18 L134,56', '#e0505a', 4) +
    path('M38,50 C70,44 130,44 162,50 L162,68 C130,62 70,62 38,68 Z', '#ff8f8f') +
    line('M50,52 L50,64 M66,50 L66,62 M82,48 L82,60 M100,48 L100,60 M118,48 L118,60 M134,50 L134,62 M150,52 L150,64', '#e0505a', 3) +
    circle(100, 12, 14, '#ffffff'),
  flower: () =>
    line('M44,50 Q100,22 156,50', '#5fb36a', 6) +
    [[52, 44, '#ff8fab'], [74, 34, '#ffd23f'], [100, 30, '#a98bff'], [126, 34, '#ff8fab'], [148, 44, '#7fd3ff']]
      .map(([x, y, c]) => [0, 72, 144, 216, 288].map((a) => circle((x as number) + Math.cos((a * Math.PI) / 180) * 8, (y as number) + Math.sin((a * Math.PI) / 180) * 8, 7, c as string, true, 'stroke-width="2.5"')).join('') + circle(x as number, y as number, 5, '#fff3a0', false))
      .join(''),
  pirate: () =>
    path('M22,60 C36,30 68,18 100,18 C132,18 164,30 178,60 C150,50 130,58 100,48 C70,58 50,50 22,60 Z', '#3b3346') +
    line('M34,54 C60,44 80,50 100,42 C120,50 140,44 166,54', '#ffd23f', 4) +
    circle(100, 32, 9, '#ffffff') + flat('M95,30 L98,30 L98,33 L95,33 Z M102,30 L105,30 L105,33 L102,33 Z', OUTLINE) +
    path('M136,26 C150,6 170,4 176,10 C164,14 152,24 142,34 Z', '#ff6b6b', 'stroke-width="3"'),
  wizard: () =>
    path('M42,62 Q100,48 158,62 L132,4 Q122,-2 114,8 Z', '#5b6fd8') +
    ellipse(100, 62, 70, 10, '#4a5bc0') +
    flat('M108,26 l3,7 7,1 -5,5 1,7 -6,-3 -6,3 1,-7 -5,-5 7,-1 Z', '#ffe36e') +
    circle(84, 44, 3.5, '#ffe36e', false) + circle(128, 48, 3, '#ffe36e', false),
  tophat: () =>
    ellipse(100, 60, 66, 10, '#2b2433') +
    path('M62,60 L66,4 L134,4 L138,60 Z', '#2b2433') +
    path('M64,42 L136,42 L137,54 L63,54 Z', '#ff5d8f', 'stroke-width="3"') +
    flat('M72,10 L80,10 L78,40 L70,40 Z', '#ffffff', 'opacity="0.18"'),
  crown: () =>
    path('M54,56 L48,16 L74,34 L100,6 L126,34 L152,16 L146,56 Z', '#ffd23f') +
    flat('M60,48 L140,48 L140,52 L60,52 Z', '#ffffff', 'opacity="0.45"') +
    circle(100, 42, 7, '#ff5d8f') + circle(74, 46, 5, '#5fd3ff') + circle(126, 46, 5, '#5fd38d') +
    circle(48, 16, 5, '#ffd23f') + circle(100, 6, 5, '#ffd23f') + circle(152, 16, 5, '#ffd23f'),
  clover: () =>
    path('M44,58 C44,24 70,12 100,12 C130,12 156,24 156,58 Z', '#4fbf6a') +
    path('M100,52 C130,48 170,50 182,60 C164,68 120,66 100,62 Z', '#3a9e55') +
    line('M100,14 L100,56', '#3a9e55', 3) +
    circle(92, 32, 7, '#ffffff') + circle(108, 32, 7, '#ffffff') + circle(100, 22, 7, '#ffffff') + line('M100,36 L104,46', '#ffffff', 3),
  captain: () =>
    path('M40,48 C40,24 70,14 100,14 C130,14 160,24 160,48 L150,60 L50,60 Z', '#ffffff') +
    path('M50,46 L150,46 L150,60 L50,60 Z', '#2f3f73') +
    path('M58,58 C80,74 120,74 142,58 Z', '#2b2433') +
    circle(100, 32, 9, '#ffd23f') + line('M100,26 L100,40 M94,36 Q100,42 106,36', OUTLINE, 3),
};

export function hatPieces(): Record<string, Piece> {
  return Object.fromEntries(Object.entries(HATS).map(([k, b]) => [k, hatPiece(b())]));
}

export function commonPieces(): Record<string, Piece> {
  return {
    cloud: cloud(),
    sun: sun(),
    lily: lilyPad(false),
    lilyFlower: lilyPad(true),
    ray: lightRay(),
    bird: bird(),
    puff: puff(),
    butterfly: butterfly(),
    fog: fogBand(),
    firefly: firefly(),
    floe: iceFloe(true),
    floeSmall: iceFloe(false),
    snowflake: snowflake(),
    moon: moon(),
    aurora: aurora(),
    stone: steppingStone(true),
    stoneSmall: steppingStone(false),
    cat: { w: 200, h: 220, svg: catSvg(false) },
    catBlink: { w: 200, h: 220, svg: catSvg(true) },
    rod: rod(),
  };
}

export function previewItems() {
  const out: { name: string; svg: string; w: number; h: number }[] = [];
  for (const pond of ['cozy', 'misty', 'frozen']) for (const [k, v] of Object.entries(sceneryPieces(pond))) out.push({ name: `${pond}.${k}`, ...v });
  for (const [k, v] of Object.entries(commonPieces())) out.push({ name: k, ...v });
  return out;
}
