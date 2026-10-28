// Pet art v4 for Misty Creek, Frozen Lake and the Rainbow Turtle (Creek Beaver and Aurora Hare keep v1, 28/10), in the style approved on 28/10
// (pets4.ts): head and body are one silhouette, big v1 eyes, clean outline, soft form shadow.
import { type Base, OUTLINE, blush, bodyGrad, circle, darken, ellipse, f, flat, gloss, lighten, line, linear, path, radial, shape, uid } from './petKit';
import { bigEye, foot } from './petsCozy';

/** Right-side form shadow for a body centred on x = 100 (soft, clipped to the shape). */
const SH = (top = 50) => `M128,${top} C176,${top + 24} 178,160 134,190 L100,194 C150,162 156,${top + 40} 128,${top} Z`;

function nose(cx: number, cy: number, w = 8) {
  return path(`M${f(cx - w)},${f(cy)} C${f(cx - w)},${f(cy - 6)} ${f(cx + w)},${f(cy - 6)} ${f(cx + w)},${f(cy)} C${f(cx + w)},${f(cy + 5)} ${f(cx + 2)},${f(cy + 8)} ${f(cx)},${f(cy + 8)} C${f(cx - 2)},${f(cy + 8)} ${f(cx - w)},${f(cy + 5)} ${f(cx - w)},${f(cy)} Z`, '#3b2a4d', 'stroke-width="2"') + gloss(cx - 3, cy - 2, 3, 1.5, 0, 0.7);
}
function mouth(cx: number, y: number) {
  return line(`M${f(cx)},${f(y)} v3 M${f(cx)},${f(y + 3)} q-6,6 -11,1 M${f(cx)},${f(y + 3)} q6,6 11,1`, OUTLINE, 2.8);
}

/** Lily Turtle v4 structure with any shell fill (used by the Rainbow Turtle). */
function turtle(b: Base, shellFill: string, plateFill: string, extra: string) {
  const skin = bodyGrad(b, '#b5e7a0', 0.4, 0.3);
  const plates = path('M100,64 L124,76 L120,100 L80,100 L76,76 Z', plateFill, 'stroke-width="3"') + line('M100,64 L100,52 M124,76 L150,68 M120,100 L144,112 M80,100 L56,112 M76,76 L50,68', OUTLINE, 3);
  return (
    shape(b, 'M36,150 C22,152 18,166 30,170 C40,172 48,164 50,156 Z', skin, { rim: false }) +
    shape(b, 'M164,150 C178,152 182,166 170,170 C160,172 152,164 150,156 Z', skin, { rim: false }) +
    shape(b, 'M26,132 C24,82 60,50 100,50 C140,50 176,82 174,132 C150,144 50,144 26,132 Z', shellFill, { inside: plates, shadow: 'M130,54 C178,76 182,122 170,138 L110,140 C150,120 156,80 130,54 Z' }) +
    shape(b, 'M20,130 C50,146 150,146 180,130 C182,142 166,152 100,152 C34,152 18,142 20,130 Z', bodyGrad(b, '#e9dca6'), { rim: false }) +
    shape(b, 'M58,146 C40,150 26,166 34,176 C44,182 62,170 72,156 Z', skin, { rim: false }) +
    shape(b, 'M142,146 C160,150 174,166 166,176 C156,182 138,170 128,156 Z', skin, { rim: false }) +
    shape(b, 'M62,150 C60,122 80,108 100,108 C120,108 140,122 138,150 C138,174 120,188 100,188 C80,188 62,174 62,150 Z', skin, { shadow: 'M120,110 C146,126 146,178 116,190 L140,190 L146,110 Z' }) +
    bigEye(84, 146, 12, 0.05) +
    bigEye(116, 146, 12, 0.05) +
    blush(b, 74, 166, 8, 4) +
    blush(b, 126, 166, 8, 4) +
    line('M90,165 Q95,171 100,165 Q105,171 110,165', OUTLINE, 3) +
    gloss(86, 118, 12, 5, -20, 0.5) +
    extra +
    gloss(64, 82, 14, 6, -35, 0.45)
  );
}

export const LATE_ART: Record<string, (b: Base) => string> = {
  // ---- Misty Creek ----
  // Snail: the soft body rises at the front into the head (one shape), shell with a spiral and moss.
  mossy_snail: (b) => {
    const skin = bodyGrad(b, '#c9d6a4', 0.4, 0.3);
    const shell = uid(b, 'sh');
    b.defs.push(radial(shell, [[0, '#f0bd88'], [0.6, '#c98a55'], [1, '#9a5f33']], 0.4, 0.3, 0.8));
    return (
      line('M140,96 L132,58 M168,98 L176,60', OUTLINE, 5) +
      line('M140,96 L132,58 M168,98 L176,60', '#c9d6a4', 2.5) +
      bigEye(132, 54, 11, 0) +
      bigEye(177, 56, 11, 0) +
      shape(b, 'M16,178 C16,160 40,152 80,152 L128,150 C126,124 136,96 156,94 C178,92 190,114 188,140 C188,160 184,176 176,182 C140,190 40,192 16,178 Z', skin, {
        inside: line('M30,176 q40,6 90,2', '#a9b884', 2.4, 'opacity="0.8"'),
        shadow: 'M170,96 C196,116 192,170 172,186 L190,190 L196,96 Z',
      }) +
      blush(b, 146, 136, 8, 4) +
      blush(b, 180, 136, 7, 3.5) +
      line('M154,142 Q162,148 170,142', OUTLINE, 3.2) +
      shape(b, 'M24,112 A56,54 0 1 1 136,112 A56,54 0 1 1 24,112 Z', `url(#${shell})`, {
        inside: line('M80,112 m-34,0 a34,32 0 1,0 34,-32 a22,20 0 1,0 -22,20 a10,10 0 1,0 10,-10', darken('#9a5f33', 0.15), 4),
        shadow: 'M110,62 C150,80 150,150 110,168 L140,170 L150,60 Z',
      }) +
      path('M40,74 C36,58 52,52 58,62 C62,48 80,48 82,60 C90,52 104,58 100,72 C86,80 52,82 40,74 Z', '#7cc86a', 'stroke-width="3.2"') +
      circle(62, 60, 4, '#ffe36e', false) + circle(88, 58, 3.5, '#ffffff', false) +
      gloss(56, 96, 14, 6, -30, 0.45)
    );
  },

  // Fox: one sitting pear with tall ears in the same outline, white chest, glowing tail tip in front.
  firefly_fox: (b) => {
    const c = '#ff9a4d';
    const g = bodyGrad(b, c, 0.4, 0.2);
    const glow = uid(b, 'gl');
    b.defs.push(radial(glow, [[0, '#fffbd0', 1], [0.45, '#ffe96b', 0.7], [1, '#ffe96b', 0]]));
    const bodyD = 'M52,70 L44,20 L86,44 C94,42 106,42 114,44 L156,20 L148,70 C156,86 156,104 150,120 C162,140 164,166 148,180 C134,190 66,190 52,180 C36,166 38,140 50,120 C44,104 44,86 52,70 Z';
    return (
      circle(172, 128, 28, `url(#${glow})`, false) +
      shape(b, 'M132,178 C170,180 192,152 180,124 C172,142 160,156 130,160 Z', g, { inside: path('M180,124 C190,134 188,150 176,156 C182,144 182,134 180,124 Z', '#fff6b8', 'stroke="none"'), rim: false }) +
      shape(b, bodyD, g, {
        inside:
          path('M52,44 L48,26 L72,42 Z', '#5a3a5a', 'stroke="none"') + path('M148,44 L152,26 L128,42 Z', '#5a3a5a', 'stroke="none"') +
          path('M62,100 C70,92 88,92 100,104 C112,92 130,92 138,100 C140,116 126,126 114,128 C122,146 120,168 112,178 C104,184 96,184 88,178 C80,168 78,146 86,128 C74,126 60,116 62,100 Z', '#fff1e2', 'stroke="none"'),
        shadow: SH(44),
      }) +
      foot(b, 78, 184, '#e9772f') +
      foot(b, 122, 184, '#e9772f') +
      bigEye(80, 90, 13, 0.06) +
      bigEye(120, 90, 13, 0.06) +
      blush(b, 66, 110, 9, 4.5) +
      blush(b, 134, 110, 9, 4.5) +
      nose(100, 106, 7) +
      mouth(100, 113) +
      // a firefly resting by the tail
      circle(180, 98, 4, '#ffe96b', true, 'stroke-width="2"') +
      gloss(74, 64, 12, 5, -25, 0.4)
    );
  },

  // Heron chick: a grey-blue fluff ball (body is the head), crest, long beak, long thin legs.
  heron_chick: (b) => {
    const c = '#b9cbe6';
    const g = bodyGrad(b, c, 0.4, 0.25);
    const bodyD = 'M40,118 C36,76 64,46 102,46 C140,46 166,76 162,116 C160,140 150,164 128,174 C112,180 88,180 72,174 C50,164 42,142 40,118 Z';
    return (
      line('M86,172 L84,190 M114,172 L116,190', '#f4a261', 5) +
      line('M72,190 h18 M108,190 h18', '#f4a261', 5) +
      shape(b, bodyD, g, {
        inside: ellipse(102, 146, 36, 24, '#eef4ff', false) + line('M62,60 q-4,-4 -2,-10 M146,66 q4,-4 2,-10', '#93a8cf', 2.2),
        shadow: SH(46),
      }) +
      shape(b, 'M96,52 C90,30 102,20 108,36 C114,22 128,28 118,50 Z', bodyGrad(b, '#7f96c4'), { rim: false }) +
      shape(b, 'M44,118 C28,118 24,138 34,148 C42,154 52,148 54,138 Z', bodyGrad(b, lighten(c, 0.08)), { rim: false }) +
      shape(b, 'M158,118 C174,118 178,138 168,148 C160,154 150,148 148,138 Z', bodyGrad(b, lighten(c, 0.08)), { rim: false }) +
      bigEye(80, 94, 14, 0.08) +
      bigEye(124, 94, 14, 0.08) +
      blush(b, 66, 118, 10, 5) +
      blush(b, 138, 118, 10, 5) +
      path('M90,112 C94,106 110,106 114,112 L104,140 C102,144 100,144 98,140 Z', '#f4a261', 'stroke-width="3"') +
      line('M100,112 L101,138', darken('#f4a261', 0.25), 1.8) +
      gloss(80, 62, 16, 7, -20, 0.45)
    );
  },

  // Mist Giraffe (v1.15, 29/10): a real giraffe drawn chibi. Big head with two ossicones (soft mist
  // glows on the tips), long neck and body as one shape with the classic patch pattern, a short
  // dark mane, four legs with hooves and a tufted tail.
  mist_fawn: (b) => {
    const base = '#f7dca8';
    const patch = '#c9803f';
    const g = bodyGrad(b, base, 0.4, 0.25);
    const mist = uid(b, 'm');
    b.defs.push(radial(mist, [[0, '#ffffff', 0.85], [1, '#ffffff', 0]]));
    const glow = uid(b, 'og');
    b.defs.push(radial(glow, [[0, '#e6f6ff', 1], [0.5, '#c8e7ff', 0.6], [1, '#c8e7ff', 0]]));
    // neck and body in one outline
    const bodyD = 'M66,118 C64,96 68,76 74,64 L104,62 C106,80 108,98 112,112 C132,110 156,116 160,134 C164,152 152,164 132,166 L82,166 C62,166 52,156 52,142 C52,130 58,122 66,118 Z';
    const patches = [
      'M80,80 C86,74 96,76 96,84 C96,92 86,94 80,88 Z', 'M78,100 C84,94 96,96 98,104 C98,112 86,114 80,108 Z', 'M86,120 C92,114 104,116 104,124 C104,132 92,134 86,128 Z',
      'M114,120 C122,116 132,118 132,126 C132,134 120,136 114,130 Z', 'M138,124 C146,122 154,128 152,136 C150,142 140,142 136,136 Z', 'M66,132 C72,126 84,128 84,136 C84,144 72,146 66,140 Z',
      'M94,140 C102,134 114,136 114,146 C114,154 100,156 94,150 Z', 'M122,142 C130,138 142,140 140,150 C138,156 126,156 122,150 Z', 'M64,150 C70,148 78,152 76,158 C74,162 66,160 64,156 Z', 'M144,150 C150,148 156,152 154,158 C152,162 146,160 144,156 Z',
    ].map((d) => path(d, patch, `stroke="${darken(patch, 0.25)}" stroke-width="1.6"`)).join('');
    const leg = (x: number, dark = false) =>
      shape(b, `M${x - 7},158 L${x - 6},180 L${x + 6},180 L${x + 7},158 Z`, bodyGrad(b, dark ? darken(base, 0.08) : base), { inside: path(`M${x - 5},164 C${x - 2},162 ${x + 3},164 ${x + 4},168 C${x + 2},172 ${x - 3},172 ${x - 5},168 Z`, patch, 'stroke="none"'), rim: false }) +
      path(`M${x - 7},180 L${x + 7},180 L${x + 8},188 L${x - 8},188 Z`, '#5b3a2a', 'stroke-width="2.6"');
    return (
      ellipse(100, 186, 90, 18, `url(#${mist})`, false) +
      leg(124, true) + leg(146, true) +
      // tail with a dark tuft
      line('M158,132 C170,138 172,150 168,160', OUTLINE, 3) + path('M164,158 C162,166 168,172 174,166 C176,160 172,156 168,156 Z', '#5b3a2a', 'stroke-width="2"') +
      shape(b, bodyD, g, { inside: patches, shadow: 'M128,112 C158,116 170,140 160,166 L120,170 C150,150 150,124 128,112 Z' }) +
      // short dark mane along the back of the neck
      path('M104,64 C108,80 110,96 114,110 L108,112 C104,98 100,82 98,66 Z', '#8a5a3a', 'stroke-width="2.4"') +
      leg(76) + leg(98) +
      // ossicones with dark tufts and mist glows
      circle(78, 18, 12, `url(#${glow})`, false) + circle(110, 16, 12, `url(#${glow})`, false) +
      path('M76,40 L74,22 C74,16 84,16 84,22 L84,40 Z', base, 'stroke-width="2.8"') + circle(79, 20, 6, '#6b4630', true, 'stroke-width="2.4"') +
      path('M106,40 L106,20 C106,14 116,14 116,20 L114,40 Z', base, 'stroke-width="2.8"') + circle(111, 18, 6, '#6b4630', true, 'stroke-width="2.4"') +
      // ears out to the sides
      shape(b, 'M62,46 C46,40 38,48 44,54 C50,60 60,58 66,54 Z', g, { inside: path('M58,48 C50,46 46,50 50,53 Z', '#f6b9a8', 'stroke="none"'), rim: false }) +
      shape(b, 'M128,46 C144,40 152,48 146,54 C140,60 130,58 124,54 Z', g, { inside: path('M132,48 C140,46 144,50 140,53 Z', '#f6b9a8', 'stroke="none"'), rim: false }) +
      // big head with a lighter muzzle and a small forehead patch
      shape(b, 'M60,56 C58,38 74,28 96,28 C118,28 134,38 132,56 C134,70 128,84 112,90 C102,94 88,94 78,90 C64,84 58,72 60,56 Z', g, {
        inside: path('M74,76 C72,66 82,62 96,62 C110,62 120,66 118,76 C118,86 108,92 96,92 C84,92 74,86 74,76 Z', '#fbe9cc', 'stroke="none"') + path('M90,36 C94,32 102,32 104,36 C104,42 94,44 90,40 Z', patch, 'stroke="none"'),
        shadow: 'M118,30 C140,44 140,80 116,92 L136,94 L140,30 Z',
      }) +
      bigEye(80, 56, 11, 0.05) +
      bigEye(112, 56, 11, 0.05) +
      line('M68,48 l-4,-3 M70,45 l-2,-4 M124,48 l4,-3 M122,45 l2,-4', OUTLINE, 2) +
      blush(b, 70, 72, 7, 3.5) +
      blush(b, 122, 72, 7, 3.5) +
      ellipse(90, 78, 2.6, 2, '#6b4630', false) + ellipse(102, 78, 2.6, 2, '#6b4630', false) +
      line('M89,85 Q96,90 103,85', OUTLINE, 2.8) +
      gloss(84, 36, 12, 5, -20, 0.5)
    );
  },

  // ---- Frozen Lake ----
  // Penguin chick: one egg shape, white face mask and belly, flippers, a downy tuft.
  penguin_chick: (b) => {
    const c = '#5b6a8f';
    const g = bodyGrad(b, c, 0.4, 0.2);
    return (
      foot(b, 80, 186, '#ffa53d') +
      foot(b, 120, 186, '#ffa53d') +
      shape(b, 'M48,134 C30,124 24,104 32,96 C44,102 52,116 56,128 Z', g, { rim: false }) +
      shape(b, 'M152,134 C170,124 176,104 168,96 C156,102 148,116 144,128 Z', g, { rim: false }) +
      shape(b, 'M46,128 C46,74 70,46 100,46 C130,46 154,74 154,128 C154,170 132,188 100,188 C68,188 46,170 46,128 Z', g, {
        inside: path('M60,100 C60,76 80,68 100,82 C120,68 140,76 140,100 C140,148 126,180 100,180 C74,180 60,148 60,100 Z', '#fbfdff', 'stroke="none"') + flat('M120,120 C134,130 136,160 120,178 L140,178 L144,118 Z', '#c9d3e6', 'opacity="0.6"'),
        shadow: SH(48),
      }) +
      shape(b, 'M94,50 C90,34 100,28 104,40 C108,30 116,34 108,48 Z', g, { rim: false }) +
      bigEye(82, 100, 13, 0.06) +
      bigEye(118, 100, 13, 0.06) +
      blush(b, 70, 120, 9, 4.5) +
      blush(b, 130, 120, 9, 4.5) +
      path('M90,116 C94,110 106,110 110,116 L100,128 Z', '#ffa53d', 'stroke-width="3"') +
      gloss(80, 62, 14, 6, -25, 0.45)
    );
  },

  // Snowy owlet: a round owl (no neck), ear tufts in the outline, gold eye rings, speckles.
  snowy_owlet: (b) => {
    const c = '#f4f7ff';
    const g = bodyGrad(b, c, 0.4, 0.2);
    const ring = uid(b, 'ri');
    b.defs.push(radial(ring, [[0, '#fff3b0'], [1, '#ffcf3a']]));
    return (
      foot(b, 82, 184, '#ffb84d') +
      foot(b, 118, 184, '#ffb84d') +
      shape(b, 'M48,124 C46,96 52,76 60,66 L52,34 L82,54 C94,50 106,50 118,54 L148,34 L140,66 C148,76 154,96 152,124 C152,168 130,188 100,188 C70,188 48,168 48,124 Z', g, {
        inside: [[70, 150], [124, 142], [100, 168], [84, 132], [136, 164], [60, 128], [114, 120]].map(([x, y]) => ellipse(x, y, 5, 3.5, '#a4b0c9', false)).join('') + line('M60,40 l6,10 M140,40 l-6,10', '#c9d3e6', 2),
        shadow: SH(52),
      }) +
      shape(b, 'M50,120 C38,130 38,156 50,166 C58,156 60,138 56,122 Z', bodyGrad(b, '#dfe5f4'), { rim: false }) +
      shape(b, 'M150,120 C162,130 162,156 150,166 C142,156 140,138 144,122 Z', bodyGrad(b, '#dfe5f4'), { rim: false }) +
      circle(78, 94, 23, `url(#${ring})`, true, 'stroke-width="3.2"') +
      circle(122, 94, 23, `url(#${ring})`, true, 'stroke-width="3.2"') +
      bigEye(78, 94, 15, 0) +
      bigEye(122, 94, 15, 0) +
      path('M93,112 C96,108 104,108 107,112 L100,124 Z', '#ffb84d', 'stroke-width="3"') +
      blush(b, 60, 122, 9, 4.5) +
      blush(b, 140, 122, 9, 4.5) +
      gloss(80, 64, 14, 6, -20, 0.4)
    );
  },

  // Seal pup: a soft teardrop lying on the ice, head end raised, flippers and tail.
  seal_pup: (b) => {
    const c = '#eef2fa';
    const g = bodyGrad(b, c, 0.4, 0.2);
    return (
      shape(b, 'M146,176 C172,184 192,170 190,152 C180,162 166,166 142,162 Z', bodyGrad(b, '#d6ddeb'), { rim: false }) +
      shape(b, 'M28,160 C28,112 56,74 100,74 C144,74 172,112 172,160 C172,182 140,188 100,188 C60,188 28,182 28,160 Z', g, {
        inside: [[64, 140, 5], [136, 150, 6], [118, 172, 4], [52, 166, 4]].map(([x, y, r]) => ellipse(x, y, r, r * 0.7, '#c4cde0', false)).join(''),
        shadow: 'M128,78 C176,100 184,170 150,188 L110,190 C160,170 162,110 128,78 Z',
      }) +
      shape(b, 'M44,166 C28,174 20,168 24,158 C32,162 42,162 52,158 Z', bodyGrad(b, '#d6ddeb'), { rim: false }) +
      bigEye(78, 116, 16, 0) +
      bigEye(122, 116, 16, 0) +
      ellipse(100, 142, 20, 13, '#ffffff', false) +
      nose(100, 136, 7) +
      line('M98,148 Q100,152 102,148', OUTLINE, 2.5) +
      line('M84,142 l-22,-4 M84,148 l-22,2 M116,142 l22,-4 M116,148 l22,2', OUTLINE, 2.2, 'opacity="0.6"') +
      blush(b, 62, 136, 10, 5) +
      blush(b, 138, 136, 10, 5) +
      gloss(80, 90, 16, 7, -20, 0.5)
    );
  },

  // Polar cub: one pear with round ears, pink scarf whose ends flutter, paw pads.
  polar_cub: (b) => {
    const c = '#fbfcff';
    const g = bodyGrad(b, c, 0.4, 0.2);
    const scarf = uid(b, 'sc');
    b.defs.push(linear(scarf, [[0, '#ff8fab'], [1, '#e8557d']]));
    const bodyD = 'M54,58 C50,40 68,32 78,44 C90,38 110,38 122,44 C132,32 150,40 146,58 C158,74 160,98 152,118 C164,140 166,166 150,180 C134,190 66,190 50,180 C34,166 36,140 48,118 C40,98 42,74 54,58 Z';
    return (
      shape(b, bodyD, g, {
        inside: circle(64, 54, 6, '#ffd0dc', false) + circle(136, 54, 6, '#ffd0dc', false) + ellipse(100, 104, 24, 16, '#eef2fa', false),
        shadow: SH(46),
      }) +
      foot(b, 76, 184, '#e6ebf5') +
      foot(b, 124, 184, '#e6ebf5') +
      ellipse(76, 186, 6, 3, '#ffc0cf', false) + ellipse(124, 186, 6, 3, '#ffc0cf', false) +
      // scarf wraps the "neck" line and hangs down
      path('M46,122 C70,136 130,136 154,122 L156,138 C130,152 70,152 44,138 Z', `url(#${scarf})`, 'stroke-width="3.6"') +
      path('M118,142 L134,176 L116,174 L108,146 Z', `url(#${scarf})`, 'stroke-width="3.2"') +
      line('M120,170 l10,0', '#ffffff', 2, 'opacity="0.6"') +
      bigEye(80, 86, 12.5, 0.06) +
      bigEye(120, 86, 12.5, 0.06) +
      blush(b, 68, 106, 9, 4.5) +
      blush(b, 132, 106, 9, 4.5) +
      nose(100, 100, 8) +
      mouth(100, 107) +
      gloss(76, 62, 14, 6, -20, 0.5)
    );
  },

  // 7-day login gift: the Lily Turtle shape with a rainbow shell and a star.
  rainbow_turtle: (b) => {
    const rs = uid(b, 'rs');
    b.defs.push(linear(rs, [[0, '#ff8fab'], [0.25, '#ffd23f'], [0.5, '#7fe07a'], [0.75, '#5fb4ef'], [1, '#a98bff']], 0, 0, 1, 0));
    const pl = uid(b, 'rp');
    b.defs.push(radial(pl, [[0, '#ffffff', 0.7], [1, '#ffffff', 0.25]]));
    return turtle(b, `url(#${rs})`, `url(#${pl})`, flat('M146,60 l5,11 12,2 -9,8 2,12 -10,-6 -10,6 2,-12 -9,-8 12,-2 Z', '#ffe36e', `stroke="${OUTLINE}" stroke-width="3"`));
  },
};

