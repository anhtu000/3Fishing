// Rematch forms: win rate of each form next to the classic fight, averaged over players, ponds and stars.
//   bun tools/formtune.ts ['{"frenzy":{"gap":0.7}}']
import { Rng } from '../core/rng';
import { BOSS_FORMS } from '../src/content/data';
import { FORM_FIGHT, Fishing } from '../src/logic/fishing';
import { fishingStats } from '../src/logic/rules';
import { defaultSave } from '../src/logic/model';

const over = process.argv[2] ? JSON.parse(process.argv[2]) : {};
for (const [k, v] of Object.entries(over)) Object.assign(FORM_FIGHT[k as keyof typeof FORM_FIGHT], v);
const players = [
  { delay: 0.22, greed: 0.0, notice: 0.7 },
  { delay: 0.14, greed: 0.03, notice: 0.85 },
  { delay: 0.08, greed: 0.05, notice: 0.95 },
];
const late: Record<number, [number, number]> = { 1: [17, 14], 3: [18, 15], 5: [22, 17], 7: [26, 19], 10: [30, 20] };
const RUNS = Number(process.env.RUNS ?? 120);

function win(lvl: number, star: number, form: (typeof BOSS_FORMS)[number]) {
  let wins = 0;
  let n = 0;
  let time = 0;
  for (const p of players) {
    for (let i = 0; i < RUNS; i++) {
      const s = defaultSave();
      [s.upgrades.rod, s.upgrades.line] = late[star];
      const rng = new Rng(900 + i + lvl * 7 + star * 31);
      let outcome = '';
      const f = new Fishing(rng, () => fishingStats(s, 0, 0), { end: (o) => (outcome = o) });
      f.lineLevel = s.upgrades.line;
      f.startBoss(lvl, star, form);
      const hist: { t: number; v: number }[] = [];
      let t = 0;
      let warnAt = -1;
      let heed = false;
      while (!outcome && t < 180) {
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
      n++;
      if (outcome === 'caught') {
        wins++;
        time += t;
      }
    }
  }
  return { win: wins / n, time: wins ? time / wins : 0 };
}

const stars = [1, 3, 5, 7, 10];
const header = ['form'.padEnd(8), ...stars.map((s) => `★${s}`.padStart(11)), '  avg'].join('');
console.log(header);
for (const form of BOSS_FORMS) {
  const row: string[] = [];
  let sum = 0;
  for (const star of stars) {
    let w = 0;
    let tm = 0;
    for (let lvl = 0; lvl < 3; lvl++) {
      const r = win(lvl, star, form);
      w += r.win / 3;
      tm += r.time / 3;
    }
    sum += w;
    row.push(`${(w * 100).toFixed(0)}% ${tm.toFixed(0)}s`.padStart(11));
  }
  console.log(form.padEnd(8) + row.join('') + `  ${((sum / stars.length) * 100).toFixed(0)}%`);
}
