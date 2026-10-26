// WANTED fish fight: how often each player type lands it, next to a normal fish of the same kind.
//   bun tools/wantedtest.ts
import { Rng } from '../core/rng';
import { Fishing, WANTED_FIGHT, type Target } from '../src/logic/fishing';
import { fishingStats } from '../src/logic/rules';
import { defaultSave } from '../src/logic/model';

const players = [
  { name: 'novice', react: 0.45, reelDelay: 0.22, greed: 0.0, notice: 0.7 },
  { name: 'average', react: 0.33, reelDelay: 0.14, greed: 0.03, notice: 0.85 },
  { name: 'skilled', react: 0.25, reelDelay: 0.08, greed: 0.05, notice: 0.95 },
];
const N = 400;
// Optional overrides: bun tools/wantedtest.ts '{"surge":1.8}' [rarityPlus]
if (process.argv[2]) Object.assign(WANTED_FIGHT, JSON.parse(process.argv[2]));
const PLUS = Number(process.argv[3] ?? 0);

function land(rarity: number, wanted: boolean, p: (typeof players)[number], rod: number, line: number) {
  let caught = 0;
  let hooked = 0;
  for (let i = 0; i < N; i++) {
    const s = defaultSave();
    s.upgrades.rod = rod;
    s.upgrades.line = line;
    s.tutorial.push('cast', 'bite', 'reel', 'done');
    const rng = new Rng(77 + i);
    let outcome = '';
    const target: Target = wanted ? { rarity: Math.min(4, Math.max(1, rarity + PLUS)), fights: true, wanted: true } : { rarity, fights: true };
    const f = new Fishing(rng, () => fishingStats(s, 0, 0), { end: (o) => (outcome = o) }, () => target);
    let t = 0;
    let react = -1;
    let warnAt = -1;
    let heed = false;
    const hist: { t: number; v: number }[] = [];
    f.press();
    while (!outcome && t < 90) {
      const dt = 1 / 30;
      t += dt;
      if (f.phase === 'charging' && f.power > 0.6) f.release();
      if (f.phase === 'bite') {
        if (react < 0) react = p.react;
        react -= dt;
        if (react <= 0) f.press();
      }
      if (f.phase === 'reeling') {
        hist.push({ t, v: f.tension });
        while (hist.length > 2 && hist[0].t < t - p.reelDelay) hist.shift();
        const seen = hist[0].v;
        const [lo, hi] = f.greenRange;
        if (f.warning && warnAt < 0) {
          warnAt = t;
          heed = rng.next() < p.notice;
        }
        if (!f.warning) warnAt = -1;
        const letGo = warnAt >= 0 && heed && t - warnAt >= p.reelDelay;
        if (f.holding && (letGo || seen > hi - 0.06 + p.greed)) f.release();
        else if (!f.holding && !letGo && seen < lo + 0.08) f.press();
      }
      f.update(dt);
    }
    if (outcome !== 'missed' && outcome !== 'early') {
      hooked++;
      if (outcome === 'caught') caught++;
    }
  }
  return hooked ? caught / hooked : 0;
}

for (const [pond, rod, line] of [['cozy', 3, 2], ['misty', 9, 7], ['frozen', 14, 12]] as const) {
  for (const r of [0, 1, 2]) {
    const row = players.map((p) => `${p.name} ${(land(r, false, p, rod, line) * 100).toFixed(0)}% / ${(land(r, true, p, rod, line) * 100).toFixed(0)}%`);
    console.log(`${pond.padEnd(7)} rarity ${r}  normal / WANTED:  ${row.join('   ')}`);
  }
}
