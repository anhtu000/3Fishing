// Game state plus the rules that change it. Pure TypeScript: the Play scene, tests and the balance
// sim all use this class. The scene only draws and animates what it returns.
import type { Rng } from '../../core/rng';
import { dayKey } from '../../core/time';
import { AD, INCUBATOR_SLOT_GEMS, PONDS, TEAM_SLOT_GEMS, UPGRADES, petById, pondById, type PerkKind, type PondDef, type UpgradeId } from '../content/data';
import type { Target } from './fishing';
import type { SaveData } from './model';
import {
  addEgg,
  addPet,
  bossReady,
  chestReward,
  eggCoins,
  expectedFishValue,
  fishPrice,
  fishSpeedsEggs,
  fishingStats,
  junkCoins,
  luckOf,
  perkValue,
  petForEgg,
  questProgress,
  refreshQuests,
  rollCatch,
  rollSize,
  teamPerk,
  tickEggs,
  upgradeCost,
  type CastZone,
  type CatchRoll,
  type HatchResult,
} from './rules';

export interface CatchResult {
  roll: CatchRoll;
  coins: number;
  gems: number;
  /** First of its species. */
  isNew: boolean;
  /** New size record for a species already known. */
  record: boolean;
  cm: number;
  /** Egg went into the incubator (false: sold, incubator full). */
  eggStored: boolean;
  questsDone: string[];
}

export interface AnglerCatch {
  petId: string;
  coins: number;
}

export class PondGame {
  /** Per-pet progress toward the next fish an angler pet brings. Not saved: offline income covers it. */
  private anglerAcc = new Map<string, number>();

  constructor(
    public s: SaveData,
    public rng: Rng,
    public now: () => number = () => Date.now(),
  ) {}

  get pond(): PondDef {
    return pondById.get(this.s.pond as 'cozy') ?? PONDS[0];
  }

  perk(kind: PerkKind) {
    return teamPerk(this.s, kind, (id) => petById.get(id));
  }

  stats() {
    return fishingStats(this.s, this.perk('sharp'), this.perk('strong'));
  }

  get goldenBait() {
    return this.s.ads.goldenUntil > this.now();
  }

  /** The once-a-day lucky cast is waiting (after the tutorial). */
  get luckyCastReady() {
    return this.s.tutorial.includes('done') && this.s.luckyDay !== dayKey(new Date(this.now()));
  }

  luck(zone: CastZone, lucky = false) {
    return luckOf({ bait: this.s.upgrades.bait, petLuck: this.perk('luck'), zone, golden: this.goldenBait, lucky });
  }

  /**
   * What bites this cast. Scripted beats make the first minutes reliable (design doc, "15 phút đầu"):
   * the first cast is a fish, the third catch an egg, and a chest comes by catch 18.
   */
  rollForCast(zone: CastZone, lucky: boolean): { roll: CatchRoll; target: Target } {
    const s = this.s;
    const pond = this.pond;
    const luck = this.luck(zone, lucky);
    let roll: CatchRoll;
    if (s.stats.catches === 0) roll = { kind: 'fish', fish: pond.fish[0], size: 1.05 };
    else if (s.stats.catches === 2 && s.stats.eggs === 0) roll = { kind: 'egg', tier: 0 };
    else if (s.stats.catches >= 18 && s.stats.chests === 0) roll = { kind: 'chest' };
    else roll = rollCatch(this.rng, pond, luck);

    // Discovery help: a repeat Common or Uncommon sometimes becomes a species still missing,
    // so the Fishdex keeps filling at the pace the design asks for.
    if (roll.kind === 'fish' && s.dex[roll.fish.id] && roll.fish.rarity <= 1) {
      const missing = pond.fish.filter((f) => !s.dex[f.id] && f.rarity <= Math.max(1, roll.kind === 'fish' ? roll.fish.rarity : 0));
      if (missing.length && s.stats.fish >= 10 && this.rng.chance(0.12)) roll = { kind: 'fish', fish: this.rng.pick(missing), size: rollSize(this.rng, luck) };
    }
    const rarity = roll.kind === 'fish' ? roll.fish.rarity : roll.kind === 'egg' ? roll.tier : 0;
    return { roll, target: { rarity, fights: roll.kind === 'fish' } };
  }

  /** The player landed the catch: pay out and record it. */
  applyCatch(roll: CatchRoll, perfect: boolean): CatchResult {
    const s = this.s;
    const pond = this.pond;
    const res: CatchResult = { roll, coins: 0, gems: 0, isNew: false, record: false, cm: 0, eggStored: false, questsDone: [] };
    s.stats.catches += 1;
    const quests: string[] = [];
    const q = (kind: Parameters<typeof questProgress>[1], n = 1) => quests.push(...questProgress(s, kind, n).map((d) => d.id));
    if (perfect) {
      s.stats.perfect += 1;
      q('perfect');
    }
    switch (roll.kind) {
      case 'fish': {
        s.stats.fish += 1;
        const cm = Math.round(roll.fish.cm * roll.size * 10) / 10;
        res.cm = cm;
        const entry = s.dex[roll.fish.id];
        if (!entry) {
          s.dex[roll.fish.id] = { n: 1, best: cm };
          res.isNew = true;
          q('new');
        } else {
          entry.n += 1;
          if (cm > entry.best) {
            entry.best = cm;
            res.record = true;
          }
        }
        res.coins = fishPrice(roll.fish, roll.size, pond, this.perk('merchant'));
        fishSpeedsEggs(s);
        q('catch');
        if (roll.fish.rarity >= 2) q('rare');
        break;
      }
      case 'egg':
        s.stats.eggs += 1;
        res.eggStored = addEgg(s, roll.tier, pond.id);
        if (!res.eggStored) res.coins = eggCoins(roll.tier, pond);
        break;
      case 'junk':
        s.stats.junk += 1;
        res.coins = junkCoins(pond);
        break;
      case 'chest': {
        const r = chestReward(this.rng, pond, s.stats.chests === 0);
        s.stats.chests += 1;
        res.coins = r.coins;
        res.gems = r.gems;
        break;
      }
    }
    this.earn(res.coins, quests);
    s.gems += res.gems;
    res.questsDone = quests;
    return res;
  }

  /** Adds coins and counts them for the coin quest. */
  earn(coins: number, questsDone?: string[]) {
    if (coins <= 0) return;
    this.s.coins += coins;
    this.s.stats.coinsEarned += coins;
    const done = questProgress(this.s, 'coins', coins).map((d) => d.id);
    questsDone?.push(...done);
  }

  /** Time passes: eggs warm up, angler pets bring fish. */
  tick(sec: number): AnglerCatch[] {
    const s = this.s;
    s.stats.playSec += sec;
    tickEggs(s, sec, this.perk('nurture'));
    const out: AnglerCatch[] = [];
    const pond = this.pond;
    for (const id of s.team) {
      const def = petById.get(id);
      const st = s.pets[id];
      if (!def || !st || def.perk !== 'angler') continue;
      const perMin = perkValue('angler', def.rarity, st.level);
      let acc = (this.anglerAcc.get(id) ?? 0) + (sec * perMin) / 60;
      while (acc >= 1) {
        acc -= 1;
        const coins = Math.round(expectedFishValue(pond, this.luck(0), this.perk('merchant')) * (0.7 + this.rng.next() * 0.6));
        this.earn(coins);
        out.push({ petId: id, coins });
      }
      this.anglerAcc.set(id, acc);
    }
    return out;
  }

  anglerPerMin() {
    return this.perk('angler');
  }

  /** Coins earned while away, and time passes for the eggs. */
  offline(seconds: number) {
    tickEggs(this.s, seconds, this.perk('nurture'));
    const per = this.anglerPerMin();
    if (per <= 0) return 0;
    const value = expectedFishValue(this.pond, this.luck(0), this.perk('merchant'));
    // Pets fish at half pace while nobody is watching (design doc: idle at 50%).
    return Math.floor((Math.min(seconds, 7200) / 60) * per * value * 0.5);
  }

  hatch(index: number): { petId: string; result: HatchResult; shiny: boolean; tier: number } | null {
    const egg = this.s.eggs[index];
    if (!egg || egg.left > 0) return null;
    const pet = petForEgg(egg);
    const shiny = this.rng.chance(0.01);
    this.s.eggs[index] = null;
    this.s.stats.hatched += 1;
    questProgress(this.s, 'hatch');
    const pond = pondById.get(egg.pond as 'cozy') ?? PONDS[0];
    const result = addPet(this.s, pet.id, shiny, pond.priceMult);
    return { petId: pet.id, result, shiny, tier: egg.tier };
  }

  /** Rewarded ad: the egg is ready now. */
  hatchNow(index: number) {
    const egg = this.s.eggs[index];
    if (egg) egg.left = 0;
  }

  buyUpgrade(id: UpgradeId) {
    const lv = this.s.upgrades[id];
    if (lv >= UPGRADES[id].max) return false;
    const cost = upgradeCost(id, lv);
    if (this.s.coins < cost) return false;
    this.s.coins -= cost;
    this.s.upgrades[id] = lv + 1;
    return true;
  }

  incubatorSlotCost() {
    return INCUBATOR_SLOT_GEMS[this.s.incubatorSlots] ?? Infinity;
  }

  buyIncubatorSlot() {
    const cost = this.incubatorSlotCost();
    if (this.s.gems < cost) return false;
    this.s.gems -= cost;
    this.s.incubatorSlots += 1;
    return true;
  }

  teamSlotCost() {
    return TEAM_SLOT_GEMS[this.s.teamSlots] ?? Infinity;
  }

  buyTeamSlot() {
    const cost = this.teamSlotCost();
    if (this.s.gems < cost) return false;
    this.s.gems -= cost;
    this.s.teamSlots += 1;
    return true;
  }

  toggleTeam(petId: string) {
    const s = this.s;
    const i = s.team.indexOf(petId);
    if (i >= 0) s.team.splice(i, 1);
    else if (s.pets[petId] && s.team.length < s.teamSlots) s.team.push(petId);
    else return false;
    return true;
  }

  get bossReady() {
    return bossReady(this.s, this.pond);
  }

  /** Boss beaten: an Epic egg (or coins when the incubator is full) and gems. */
  winBoss() {
    const s = this.s;
    const pond = this.pond;
    if (!s.bosses.includes(pond.boss.id)) s.bosses.push(pond.boss.id);
    const stored = addEgg(s, 3, pond.id);
    const coins = stored ? 0 : eggCoins(3, pond);
    this.earn(coins);
    s.gems += 10;
    return { eggStored: stored, coins, gems: 10 };
  }

  nextPond(): PondDef | null {
    const i = PONDS.indexOf(this.pond);
    return PONDS[i + 1] ?? null;
  }

  canUnlock(p: PondDef) {
    const i = PONDS.indexOf(p);
    const prev = PONDS[i - 1];
    return !!prev && this.s.bosses.includes(prev.boss.id);
  }

  unlockPond(p: PondDef) {
    if (this.s.unlocked.includes(p.id)) return true;
    if (!this.canUnlock(p) || this.s.coins < p.unlockCost) return false;
    this.s.coins -= p.unlockCost;
    this.s.unlocked.push(p.id);
    return true;
  }

  travel(p: PondDef) {
    if (!this.s.unlocked.includes(p.id)) return false;
    this.s.pond = p.id;
    return true;
  }

  /** Auto-fish unlocks with the second pond. */
  get autoUnlocked() {
    return this.s.unlocked.length >= 2;
  }

  refreshDay() {
    return refreshQuests(this.s, dayKey(new Date(this.now())));
  }

  mysteryEggIn() {
    return Math.max(0, (this.s.ads.mysteryAt + AD.mysteryEggEverySec * 1000 - this.now()) / 1000);
  }

  goldenIn() {
    return Math.max(0, (this.s.ads.goldenAt + AD.goldenBaitEverySec * 1000 - this.now()) / 1000);
  }

  /** Rewarded: a random egg of this pond. */
  mysteryEgg() {
    const tier = Math.min(4, [0, 0, 1, 1, 1, 2, 2, 3][this.rng.int(0, 7)]);
    this.s.ads.mysteryAt = this.now();
    return { tier, stored: addEgg(this.s, tier, this.pond.id) };
  }

  /** Rewarded: luck x2 for five minutes. */
  goldenBaitOn() {
    this.s.ads.goldenAt = this.now();
    this.s.ads.goldenUntil = this.now() + AD.goldenBaitSec * 1000;
  }
}

