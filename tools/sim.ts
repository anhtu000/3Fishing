// Balance sim: a bot plays the first hour with the real rules and fishing machine.
// bun tools/sim.ts [runs] [skill]
import { Rng } from '../core/rng';
import { PONDS, UPGRADE_IDS, pondById } from '../src/content/data';
import { Fishing, FishingBot } from '../src/logic/fishing';
import { PondGame } from '../src/logic/game';
import { defaultSave } from '../src/logic/model';
import { dexCount, readyEggIndex, upgradeCost } from '../src/logic/rules';

const runs = Number(process.argv[2] ?? 20);
const skill = Number(process.argv[3] ?? 0.8);
const DT = 1 / 30;
/** Seconds the catch card and recast take on screen. */
const RESULT_SEC = 2.2;
const FAIL_SEC = 0.9;

type Mark = Record<string, number>;
const all: Mark[] = [];
const coinsAt: Record<number, number[]> = { 300: [], 900: [], 1800: [], 3600: [] };
for (let r = 0; r < runs; r++) {
  const s = defaultSave();
  s.tutorial.push('done');
  const rng = new Rng(1000 + r);
  let clock = 0;
  const game = new PondGame(s, rng, () => 1_700_000_000_000 + clock * 1000);
  game.refreshDay();
  let current: ReturnType<PondGame['rollForCast']> | null = null;
  const f = new Fishing(rng, () => game.stats(), {}, () => {
    current = game.rollForCast(f.zone, false);
    return current.target;
  });
  f.assist = true;
  const bot = new FishingBot(f, rng, skill);
  const mark: Mark = {};
  const at = (k: string) => (mark[k] ??= Math.round(clock));
  let pause = 0;
  let casts = 0;
  let fails = 0;
  let bossFight = false;
  while (clock < 3600) {
    clock += DT;
    game.tick(DT);
    if (pause > 0) {
      pause -= DT;
      continue;
    }
    bot.update(DT);
    f.update(DT);
    if (f.phase === 'done') {
      casts++;
      if (f.outcome === 'caught') {
        if (bossFight) {
          game.winBoss();
          at(`boss_${s.pond}`);
          bossFight = false;
        } else if (current) {
          const res = game.applyCatch(current.roll, f.perfect);
          if (res.roll.kind === 'egg') at('firstEgg');
          if (res.roll.kind === 'chest') at('firstChest');
        }
        pause = RESULT_SEC;
      } else {
        fails++;
        if (bossFight) bossFight = false;
        pause = FAIL_SEC;
      }
      f.reset();
      f.assist = false;
      // Player decisions between casts.
      const i = readyEggIndex(s);
      if (i >= 0) {
        game.hatch(i);
        at('firstHatch');
      }
      for (;;) {
        const cheapest = UPGRADE_IDS.map((id) => ({ id, c: upgradeCost(id, s.upgrades[id]) })).sort((a, b) => a.c - b.c)[0];
        const next = game.nextPond();
        const saving = next && game.canUnlock(next) && !s.unlocked.includes(next.id);
        if (saving && s.coins >= next!.unlockCost) {
          game.unlockPond(next!);
          game.travel(next!);
          at(`pond_${next!.id}`);
          continue;
        }
        if (saving) break;
        if (s.coins >= cheapest.c && game.buyUpgrade(cheapest.id)) {
          at('firstUpgrade');
          continue;
        }
        break;
      }
      const pond = game.pond;
      const n = dexCount(s, pond);
      if (n >= 4) at(`dex4_${pond.id}`);
      if (game.bossReady) {
        at(`bossReady_${pond.id}`);
        bossFight = true;
        f.startBoss();
      }
    }
    for (const t of Object.keys(coinsAt).map(Number)) if (Math.abs(clock - t) < DT / 2) coinsAt[t].push(s.stats.coinsEarned);
  }
  mark.casts = casts;
  mark.fails = fails;
  mark.catches = s.stats.catches;
  mark.dex = Object.keys(s.dex).length;
  mark.pets = Object.keys(s.pets).length;
  mark.rod = s.upgrades.rod;
  mark.coinsEarned = s.stats.coinsEarned;
  all.push(mark);
}
const keys = [...new Set(all.flatMap((m) => Object.keys(m)))];
const med = (xs: number[]) => {
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
};
for (const k of keys) {
  const xs = all.map((m) => m[k]).filter((x) => x != null);
  console.log(`${k.padEnd(18)} median ${String(med(xs)).padStart(6)}  (${xs.length}/${runs} runs)  min ${Math.min(...xs)} max ${Math.max(...xs)}`);
}
for (const [t, xs] of Object.entries(coinsAt)) console.log(`coins earned by ${t}s: median ${med(xs)}`);
void PONDS;
void pondById;
