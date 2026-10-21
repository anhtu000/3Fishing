// Boss fight difficulty: first-try win rate and fight length per player type and gear level.
//   bun tools/bosstest.ts
import { Rng } from '../core/rng';
import { BOSS, Fishing } from '../src/logic/fishing';
import { BOSS_FORMS, bossForm, type BossForm } from '../src/content/data';
import { fishingStats } from '../src/logic/rules';
import { defaultSave } from '../src/logic/model';

const players = [
  { name: 'novice', delay: 0.22, greed: 0.0, notice: 0.7 },
  { name: 'average', delay: 0.14, greed: 0.03, notice: 0.85 },
  { name: 'skilled', delay: 0.08, greed: 0.05, notice: 0.95 },
];
const gear = [
  { pond: 'cozy', rod: 4, line: 3 },
  { pond: 'misty', rod: 11, line: 8 },
  { pond: 'frozen', rod: 16, line: 13 },
];
const over = process.argv[2] ? JSON.parse(process.argv[2]) : {};
// STARS=1 tests rematch stars with late-game gear instead.
const STARS = process.env.STARS ? [1, 3, 5, 7, 10] : [0];
// FORMS=1: every rematch form at each star (otherwise the form the game picks for that star).
const FORMS: (BossForm | null)[] = process.env.FORMS ? BOSS_FORMS : [null];
Object.assign(BOSS, over);
for (const [lvl, g0] of gear.entries()) {
  for (const star of STARS) {
  // Gear keeps growing after the last pond: a player on ★7-10 has a better rod and line.
  const late: Record<number, [number, number]> = { 1: [17, 14], 3: [18, 15], 5: [22, 17], 7: [26, 19], 10: [30, 20] };
  const g = star ? { ...g0, rod: late[star][0], line: late[star][1] } : g0;
  for (const formOpt of FORMS) {
  const form = formOpt ?? bossForm(lvl, star);
  for (const p of players) {
    let wins = 0;
    const times: number[] = [];
    for (let i = 0; i < 300; i++) {
      const s = defaultSave();
      s.upgrades.rod = g.rod;
      s.upgrades.line = g.line;
      const rng = new Rng(500 + i);
      let outcome = '';
      const f = new Fishing(rng, () => fishingStats(s, 0, 0), { end: (o) => (outcome = o) });
      f.lineLevel = g.line;
      f.startBoss(lvl, star, form);
      const hist: { t: number; v: number }[] = [];
      let t = 0;
      let warnAt = -1;
      let heed = false;
      while (!outcome && t < 120) {
        const dt = 1 / 30;
        t += dt;
        hist.push({ t, v: f.tension });
        while (hist.length > 2 && hist[0].t < t - p.delay) hist.shift();
        const seen = hist[0].v;
        const [lo, hi] = f.greenRange;
        if (f.warning && warnAt < 0) {
          warnAt = t;
          heed = rng.next() < p.notice;
        }
        if (!f.warning) warnAt = -1;
        const letGo = warnAt >= 0 && heed && t - warnAt >= p.delay;
        if (f.holding && (letGo || seen > hi - 0.06 + p.greed)) f.release();
        else if (!f.holding && !letGo && seen < lo + 0.08) f.press();
        f.update(dt);
      }
      if (outcome === 'caught') {
        wins++;
        times.push(t);
      }
    }
    times.sort((a, b) => a - b);
    console.log(`${g.pond.padEnd(7)} ★${star} ${form.padEnd(7)} ${p.name.padEnd(8)} first-try win ${((wins / 300) * 100).toFixed(0)}%  median ${times[Math.floor(times.length / 2)]?.toFixed(1) ?? '-'}s`);
  }
}
}
}
