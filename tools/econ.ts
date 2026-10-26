// Economy and pacing report: simulated players with human timing play the real rules and the real
// fishing machine for 60 minutes. Prints per-profile metrics and writes JSON for the report.
//   bun tools/econ.ts [runs] [out.json]
import { Rng } from '../core/rng';
import { AD, PONDS, UPGRADE_IDS, pondById } from '../src/content/data';
import { Fishing, type Outcome } from '../src/logic/fishing';
import { PondGame } from '../src/logic/game';
import { defaultSave, type SaveData } from '../src/logic/model';
import { anyUpgradeAffordable, dexCount, readyEggIndex, upgradeCost } from '../src/logic/rules';

const RUNS = Number(process.argv[2] ?? 150);
/** v1.3 onboarding grace (set GRACE=0 to model v1.2). */
const GRACE = process.env.GRACE !== '0';
const OUT = process.argv[3] ?? '/tmp/claude-0/econ.json';
const DT = 1 / 30;
const MINUTES = 60;
const IMPULSE = Number(process.env.IMPULSE ?? 0.06);
/** v1.14: the tutorial ends after the first hatch and upgrade, which turns on today's fish, the lucky cast
 *  and the WANTED fish (set WANTED=0 to leave the tutorial open, as in the v1.13 runs). */
const WANTED_ON = process.env.WANTED !== '0';

interface Profile {
  name: string;
  /** Bite reaction time: base + random spread (s). */
  react: [number, number];
  /** Chance to strike on a fake nibble (first time), halves after each "too early". */
  nibbleStrike: number;
  /** Delay before reacting to the tension bar (s). */
  reelDelay: number;
  /** How close to the top of the green they let it go. */
  reelGreed: number;
  /** Seconds they leave a big catch card up (auto-close is 2 s / 3.2 s). */
  cardSec: number;
  /** Seconds spent per menu visit (upgrade, hatch, quests). */
  menuSec: number;
  /** Seconds between "life" actions (looking around, idle). */
  idleEvery: number;
  idleSec: number;
  /** Chance to notice the thrash warning and let go before a pull. */
  notice: number;
  /** Chance a cast is aimed at the WANTED fish while it swims in the pond. */
  aimWanted: number;
}

const PROFILES: Profile[] = [
  { name: 'novice', react: [0.38, 0.45], nibbleStrike: 0.35, reelDelay: 0.22, reelGreed: 0.0, cardSec: 2.0, menuSec: 7, idleEvery: 50, idleSec: 4, notice: 0.7, aimWanted: 0.4 },
  { name: 'average', react: [0.3, 0.3], nibbleStrike: 0.18, reelDelay: 0.14, reelGreed: 0.03, cardSec: 1.4, menuSec: 5, idleEvery: 70, idleSec: 3, notice: 0.85, aimWanted: 0.6 },
  { name: 'skilled', react: [0.22, 0.18], nibbleStrike: 0.06, reelDelay: 0.08, reelGreed: 0.05, cardSec: 0.9, menuSec: 3.5, idleEvery: 120, idleSec: 2, notice: 0.95, aimWanted: 0.8 },
];

type Ev = { t: number; kind: string };

/** A human-like controller for the fishing machine. */
class Human {
  private reactIn = -1;
  private wantPower = 0.6;
  private strike: number;
  private hist: { t: number; tension: number }[] = [];
  private t = 0;
  private struckThisWait = false;
  private warnAt = -1;
  private heed = false;
  constructor(
    private f: Fishing,
    private rng: Rng,
    private p: Profile,
  ) {
    this.strike = p.nibbleStrike;
  }
  graceFor: () => boolean = () => false;
  learnEarly() {
    this.strike /= 2;
  }
  update(dt: number) {
    const f = this.f;
    this.t += dt;
    switch (f.phase) {
      case 'ready':
        this.wantPower = 0.3 + this.rng.next() * 0.65;
        this.struckThisWait = false;
        f.forgiving = this.graceFor();
        f.press();
        break;
      case 'charging':
        if (f.power >= this.wantPower || f.t > 1.6) f.release();
        break;
      case 'waiting':
        // On each fake nibble a nervous player may strike.
        if (f.nibbleCount > 0 && !this.struckThisWait && f.approach > 0.95) {
          this.struckThisWait = true;
          if (this.rng.next() < this.strike) f.press();
        }
        if (f.approach < 0.5) this.struckThisWait = false;
        break;
      case 'bite':
        if (this.reactIn < 0) this.reactIn = this.p.react[0] + this.rng.next() * this.p.react[1];
        this.reactIn -= dt;
        if (this.reactIn <= 0) {
          this.reactIn = -1;
          f.press();
        }
        break;
      case 'reeling': {
        this.hist.push({ t: this.t, tension: f.tension });
        while (this.hist.length > 2 && this.hist[0].t < this.t - this.p.reelDelay) this.hist.shift();
        const seen = this.hist[0].tension;
        const [lo, hi] = f.greenRange;
        if (f.warning && this.warnAt < 0) {
          this.warnAt = this.t;
          this.heed = this.rng.next() < this.p.notice;
        }
        if (!f.warning) this.warnAt = -1;
        const letGo = this.warnAt >= 0 && this.heed && this.t - this.warnAt >= this.p.reelDelay;
        if (f.holding && (letGo || seen > hi - 0.06 + this.p.reelGreed)) f.release();
        else if (!f.holding && !letGo && seen < lo + 0.08) f.press();
        break;
      }
      default:
        this.reactIn = -1;
        this.hist = [];
    }
  }
}

function median(xs: number[]) {
  const a = xs.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : NaN;
}
function pct(xs: number[], q: number) {
  const a = xs.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * q))] : NaN;
}

function runOne(p: Profile, seed: number) {
  const s: SaveData = defaultSave();
  const rng = new Rng(seed);
  let clock = 0;
  const game = new PondGame(s, rng, () => 1_700_000_000_000 + clock * 1000);
  game.refreshDay();
  let roll: ReturnType<PondGame['rollForCast']> | null = null;
  let wantedCast = false;
  const f = new Fishing(rng, () => game.stats(), {}, () => {
    const w = game.wanted;
    wantedCast = !!w && rng.next() < p.aimWanted;
    if (w && wantedCast) {
      const target = { rarity: Math.max(1, w.fish.rarity), fights: true, wanted: true };
      roll = { roll: { kind: 'fish', fish: w.fish, size: w.size }, target } as unknown as ReturnType<PondGame['rollForCast']>;
      return target;
    }
    roll = game.rollForCast(f.zone, false);
    return roll.target;
  });
  f.assist = true;
  const human = new Human(f, rng, p);
  if (GRACE) human.graceFor = () => s.stats.catches < 15;
  const ev: Ev[] = [];
  const at = (kind: string) => ev.push({ t: clock, kind });
  // Count every press (tap or hold start) the player makes.
  const press0 = f.press.bind(f);
  f.press = () => {
    at('input');
    return press0();
  };
  const firsts: Record<string, number> = {};
  const first = (k: string) => (firsts[k] ??= clock);
  let pause = 0;
  let idling = false;
  let wantedTries = 0;
  let wantedLanded = 0;
  let nextIdle = p.idleEvery;
  let bossFight = false;
  let bossFails = 0;
  const outcomes: Record<Outcome, number> = { caught: 0, early: 0, missed: 0, snap: 0, escape: 0 };
  const early10: Outcome[] = [];
  const coinsAt: number[] = [];
  const nextCostAt: number[] = [];
  let lastMinute = -1;
  while (clock < MINUTES * 60) {
    clock += DT;
    const angler = game.tick(DT);
    if (angler.length) at('angler');
    const minute = Math.floor(clock / 60);
    if (minute !== lastMinute) {
      lastMinute = minute;
      coinsAt.push(s.stats.coinsEarned);
      const cheapest = Math.min(...UPGRADE_IDS.map((id) => upgradeCost(id, s.upgrades[id])));
      nextCostAt.push(cheapest);
    }
    // The WANTED clock runs while the pond is on screen (as in PlayScene): not behind cards or
    // menus, not in a boss fight, not while the WANTED fish itself is on the line.
    if (WANTED_ON && !bossFight && (pause <= 0 || idling) && !(wantedCast && (f.phase === 'reeling' || f.phase === 'bite'))) {
      const w = game.tickWanted(DT);
      if (w === 'spawn') (at('wantedSpawn'), first('wantedSpawn'));
    }
    if (pause > 0) {
      pause -= DT;
      continue;
    }
    idling = false;
    // The tutorial ends once the first pet has hatched and the first upgrade is bought.
    if (WANTED_ON && firsts.hatch != null && firsts.upgrade != null && !s.tutorial.includes('done')) s.tutorial.push('done');
    if (clock > nextIdle && f.phase === 'ready') {
      nextIdle = clock + p.idleEvery * (0.6 + rng.next() * 0.8);
      pause = p.idleSec;
      idling = true;
      continue;
    }
    human.update(DT);
    f.update(DT);
    if (f.phase !== 'done') continue;
    const o = f.outcome!;
    outcomes[o] += 1;
    if (early10.length < 10 && !bossFight) early10.push(o);
    at('cast');
    if (o === 'early') human.learnEarly();
    if (wantedCast && !bossFight && o !== 'early') {
      wantedTries++;
      if (o === 'caught') wantedLanded++;
    }
    if (o !== 'caught') game.breakStreak();
    if (o === 'caught') {
      if (bossFight) {
        game.winBoss();
        at('boss');
        first(`boss_${s.pond}`);
        bossFight = false;
        pause = 6;
      } else if (roll) {
        const r = game.applyCatch(roll.roll, f.perfect, wantedCast);
        at('catch');
        first('catch');
        if (r.isNew) at('newSpecies');
        if (r.record) at('record');
        if (r.bounty) at('wanted');
        if (r.streak >= 2) at('streak');
        if (r.roll.kind === 'egg') (at('egg'), first('egg'));
        if (r.roll.kind === 'chest') (at('chest'), first('chest'));
        for (const _q of r.questsDone) at('quest');
        const big = r.roll.kind !== 'junk' && (r.roll.kind !== 'fish' || r.isNew || r.record || r.bounty || r.roll.fish.rarity >= 2);
        pause = big ? p.cardSec : 0.35;
      }
    } else {
      if (bossFight) {
        bossFails++;
        // A lost boss leaves; a few catches in the pond lure it back.
        game.loseBoss();
        bossFight = false;
        at('bossFail');
      }
      pause = 0.8;
    }
    f.reset();
    f.assist = false;
    // Between casts: the player reacts to what the HUD shows.
    // A free slot and eggs in the basket: incubate the rarest.
    while (s.basket.length && s.eggs.some((e, i) => i < s.incubatorSlots && !e)) {
      const best = s.basket.reduce((bi, b, i) => (b.tier > s.basket[bi].tier ? i : bi), 0);
      if (!game.incubate(best)) break;
      pause += 1.5;
    }
    const ready = readyEggIndex(s);
    if (ready >= 0) {
      const h = game.hatch(ready);
      if (h) {
        at(h.result.kind === 'new' ? 'newPet' : h.result.kind === 'xp' && h.result.levelUp ? 'petLevel' : 'petXp');
        first('hatch');
        pause += 3.5;
      }
    }
    s.quests.list.forEach((q, i) => {
      if (q.claimed || s.stats.playSec <= 180) return;
      if (game.claimQuest(i)) {
        at('questClaim');
        pause += 2;
      }
    });
    const next = game.nextPond();
    const saving = !!next && game.canUnlock(next) && !s.unlocked.includes(next.id);
    if (saving && s.coins >= next!.unlockCost) {
      game.unlockPond(next!);
      game.travel(next!);
      at('pond');
      first(`pond_${next!.id}`);
      pause += 4;
    } else if (anyUpgradeAffordable(s)) {
      // While saving for the next pond, players still buy the cheap upgrades the button glows for
      // (anything under IMPULSE of the pond price).
      let bought = 0;
      for (;;) {
        const c = UPGRADE_IDS.map((id) => ({ id, c: upgradeCost(id, s.upgrades[id]) })).sort((a, b) => a.c - b.c)[0];
        if (saving && c.c > next!.unlockCost * IMPULSE) break;
        if (s.coins < c.c || !game.buyUpgrade(c.id)) break;
        bought++;
        at('upgrade');
        first('upgrade');

      }
      if (bought) pause += p.menuSec;
    }
    if (game.bossReady && !bossFight) {
      first(`bossReady_${s.pond}`);
      bossFight = true;
      f.lineLevel = s.upgrades.line;
      f.startBoss(Math.max(0, PONDS.findIndex((q) => q.id === s.pond)));
      pause += 1.5;
    }
  }
  // Reward moments: everything that feels like progress.
  const REWARDS = new Set(['catch', 'newSpecies', 'record', 'egg', 'chest', 'quest', 'questClaim', 'newPet', 'petLevel', 'petXp', 'upgrade', 'boss', 'pond', 'wanted', 'streak']);
  const BIG = new Set(['newSpecies', 'egg', 'chest', 'newPet', 'petLevel', 'upgrade', 'boss', 'pond', 'questClaim', 'wanted']);
  const gaps = (from: number, to: number, set: Set<string>) => {
    const ts = [from, ...ev.filter((e) => set.has(e.kind) && e.t >= from && e.t <= to).map((e) => e.t), to];
    let g = 0;
    for (let i = 1; i < ts.length; i++) g = Math.max(g, ts[i] - ts[i - 1]);
    return g;
  };
  const count = (kind: string | Set<string>, from: number, to: number) => ev.filter((e) => (typeof kind === 'string' ? e.kind === kind : kind.has(e.kind)) && e.t >= from && e.t < to).length;
  const perMinute = Array.from({ length: MINUTES }, (_, m) => ({
    casts: count('cast', m * 60, m * 60 + 60),
    catches: count('catch', m * 60, m * 60 + 60),
    big: count(BIG, m * 60, m * 60 + 60),
    inputs: count('input', m * 60, m * 60 + 60),
  }));
  return {
    firsts,
    outcomes,
    early10,
    perMinute,
    coinsAt,
    nextCostAt,
    maxGapBig: { m3: gaps(0, 180, BIG), m10: gaps(0, 600, BIG), m30: gaps(0, 1800, BIG), m60: gaps(0, 3600, BIG) },
    maxGapAny: { m3: gaps(0, 180, REWARDS), m10: gaps(0, 600, REWARDS) },
    bigIn: { m1: count(BIG, 0, 60), m3: count(BIG, 0, 180), m5: count(BIG, 0, 300), m10: count(BIG, 0, 600), m30: count(BIG, 0, 1800), m60: count(BIG, 0, 3600) },
    end: {
      dex: Object.keys(s.dex).length,
      pets: Object.keys(s.pets).length,
      upgrades: { ...s.upgrades },
      coinsEarned: s.stats.coinsEarned,
      bossFails,
      pond: s.pond,
      wantedSpawns: ev.filter((e) => e.kind === 'wantedSpawn').length,
      wantedCaught: ev.filter((e) => e.kind === 'wanted').length,
      wantedTries,
      wantedLanded,
    },
    pendingAt: [3, 5, 10].map(() => 0),
    events: ev,
    save: s,
  };
}

const report: Record<string, unknown> = {};
for (const p of PROFILES) {
  const rs = Array.from({ length: RUNS }, (_, i) => runOne(p, 9000 + i * 7));
  const F = (k: string) => median(rs.map((r) => r.firsts[k] ?? NaN));
  const reach = (k: string) => rs.filter((r) => r.firsts[k] != null).length / RUNS;
  const tot = (o: Outcome) => rs.reduce((a, r) => a + r.outcomes[o], 0);
  const allCasts = (['caught', 'early', 'missed', 'snap', 'escape'] as Outcome[]).reduce((a, o) => a + tot(o), 0);
  const early = rs.flatMap((r) => r.early10);
  const earlyFail = early.filter((o) => o !== 'caught').length / early.length;
  const m = (fn: (r: (typeof rs)[number]) => number) => median(rs.map(fn));
  const pm = Array.from({ length: 10 }, (_, i) => ({
    minute: i + 1,
    casts: m((r) => r.perMinute[i].casts),
    catches: m((r) => r.perMinute[i].catches),
    big: m((r) => r.perMinute[i].big),
    inputs: m((r) => r.perMinute[i].inputs),
    coins: m((r) => r.coinsAt[i + 1] - r.coinsAt[i]),
    nextUpgradeCost: m((r) => r.nextCostAt[i + 1]),
  }));
  const coinRate = [5, 10, 20, 30, 45, 60].map((min) => ({ min, earned: m((r) => r.coinsAt[min] ?? r.end.coinsEarned), perMin: m((r) => ((r.coinsAt[min] ?? r.end.coinsEarned) - (r.coinsAt[min - 5] ?? 0)) / 5) }));
  const out = {
    firsts: {
      catch: F('catch'),
      egg: F('egg'),
      upgrade: F('upgrade'),
      hatch: F('hatch'),
      chest: F('chest'),
      bossReady_cozy: F('bossReady_cozy'),
      boss_cozy: F('boss_cozy'),
      pond_misty: F('pond_misty'),
      boss_misty: F('boss_misty'),
      pond_frozen: F('pond_frozen'),
      boss_frozen: F('boss_frozen'),
    },
    reach60: { boss_cozy: reach('boss_cozy'), pond_misty: reach('pond_misty'), boss_misty: reach('boss_misty'), pond_frozen: reach('pond_frozen'), boss_frozen: reach('boss_frozen') },
    castOutcomes: Object.fromEntries((['caught', 'early', 'missed', 'snap', 'escape'] as Outcome[]).map((o) => [o, +(tot(o) / allCasts).toFixed(3)])),
    first10CastsFailRate: +earlyFail.toFixed(3),
    firstThreeCastsFail: +(rs.map((r) => r.early10.slice(0, 3).filter((o) => o !== 'caught').length).reduce((a, b) => a + b, 0) / (RUNS * 3)).toFixed(3),
    bigRewards: { m1: m((r) => r.bigIn.m1), m3: m((r) => r.bigIn.m3), m5: m((r) => r.bigIn.m5), m10: m((r) => r.bigIn.m10), m30: m((r) => r.bigIn.m30), m60: m((r) => r.bigIn.m60) },
    longestGapBigSec: { first3min: m((r) => r.maxGapBig.m3), first10min: m((r) => r.maxGapBig.m10), first30min: m((r) => r.maxGapBig.m30), p90first10: pct(rs.map((r) => r.maxGapBig.m10), 0.9) },
    longestGapAnySec: { first3min: m((r) => r.maxGapAny.m3), first10min: m((r) => r.maxGapAny.m10) },
    perMinute: pm,
    coinRate,
    end: {
      dex: m((r) => r.end.dex),
      pets: m((r) => r.end.pets),
      rod: m((r) => r.end.upgrades.rod),
      line: m((r) => r.end.upgrades.line),
      bait: m((r) => r.end.upgrades.bait),
      float: m((r) => r.end.upgrades.float),
      bossFails: m((r) => r.end.bossFails),
    },
    wanted: {
      spawns60: m((r) => r.end.wantedSpawns),
      caught60: m((r) => r.end.wantedCaught),
      landRate: +(rs.reduce((a, r) => a + r.end.wantedLanded, 0) / Math.max(1, rs.reduce((a, r) => a + r.end.wantedTries, 0))).toFixed(3),
      firstSpawnSec: F('wantedSpawn'),
    },
  };
  report[p.name] = out;
  console.log(`\n=== ${p.name} (${RUNS} runs) ===`);
  console.log(JSON.stringify(out, null, 0).slice(0, 4000));
}
await Bun.write(OUT, JSON.stringify(report, null, 2));
console.log('\nwrote', OUT);
void PONDS;
void pondById;
void AD;
void dexCount;
