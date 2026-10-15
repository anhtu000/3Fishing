// Game state plus the rules that change it. Pure TypeScript: the Play scene, tests and the balance
// sim all use this class. The scene only draws and animates what it returns.
import type { Rng } from '../../core/rng';
import { claimDaily, dailyStatus, dayKey } from '../../core/time';
import { AD, BOSS_LURE, CHALLENGE, CHALLENGES, type ChallengeDef, BOSS_STARS, GIANT_SIZE, INCUBATOR_SLOT_COST, LATE_GAME_POND, OFFLINE_CAP, POND_GOLD_BONUS, cosmeticById, PONDS, QUEST_POOL, STREAK, TEAM_SLOT_COST, TODAY_FISH, UPGRADES, petById, pondById, type FishDef, type PerkKind, type PondDef, type UpgradeId } from '../content/data';
import type { Target } from './fishing';
import type { SaveData } from './model';
import {
  incubateFromBasket,
  storeEgg,
  type EggPlace,
  addNestEgg,
  addPet,
  bossReady,
  chestReward,
  dexCount,
  eggCoins,
  expectedFishValue,
  fishPrice,
  fishSpeedsEggs,
  fishingStats,
  junkCoins,
  luckOf,
  perkValue,
  petForEgg,
  medalOf,
  pondGold,
  lurePending,
  questEgg,
  questProgress,
  refreshQuests,
  rollCatch,
  rewardMult,
  rollSize,
  teamPerk,
  tickEggs,
  pickTodayFish,
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
  /** Egg was kept (incubator or basket); false: sold, both full. */
  eggStored: boolean;
  /** Where the egg went. */
  eggWhere: EggPlace;
  questsDone: string[];
  /** This was the WANTED fish (triple coins plus a bonus). */
  bounty: boolean;
  /** Perfect hooks in a row, counting this one (0 when this hook was not perfect). */
  streak: number;
  /** Extra percent on the fish price from the perfect streak. */
  streakBonus: number;
  /** A new WANTED fish was posted after this catch. */
  newBounty: string | null;
  /** This was today's fish (x5 coins and an overnight egg). */
  today: boolean;
  /** An egg went into the overnight nest. */
  nestEgg: boolean;
  /** Medal reached with this catch (0 none; 1-3 bronze, silver, gold), late game only. */
  medal: number;
  /** A giant (size >= GIANT_SIZE). */
  giant: boolean;
  /** This catch completed the pond (every species at gold). */
  pondGold: boolean;
  /** The lost boss is lured back (it can be fought again). */
  lured: boolean;
}

/** Bonus per perfect hook in a row, capped. */
export const STREAK_STEP = 10;
export const STREAK_MAX = 5;
/** Catches between WANTED fish. */
export const BOUNTY_GAP = 6;

export interface AnglerCatch {
  petId: string;
  coins: number;
}

export class PondGame {
  /** Per-pet progress toward the next fish an angler pet brings. Not saved: offline income covers it. */
  private anglerAcc = new Map<string, number>();
  /** Perfect hooks in a row (this session). */
  streak = 0;

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

  /**
   * Today's fish (one a day for the whole game) and the pond it lives in, or null once caught today
   * (or before the tutorial ends). Fixed for the day once picked.
   */
  get today(): { fish: FishDef; pond: PondDef } | null {
    const s = this.s;
    if (!s.tutorial.includes('done')) return null;
    const day = dayKey(new Date(this.now()));
    const tf = s.todayFish;
    let pond = pondById.get(tf?.pond as 'cozy');
    let fish = pond?.fish.find((f) => f.id === tf.fish);
    if (!tf || tf.day !== day || !pond || !fish) {
      const open = PONDS.filter((p) => s.unlocked.includes(p.id));
      const pick = pickTodayFish(open.length ? open : [PONDS[0]], day);
      pond = pick.pond;
      fish = pick.fish;
      s.todayFish = { day, pond: pond.id, fish: fish.id, caught: false };
    }
    if (s.todayFish.caught) return null;
    return { fish, pond };
  }

  /** Today's fish when it lives in the pond you are in. */
  get todayFish(): FishDef | null {
    const t = this.today;
    return t && t.pond.id === this.pond.id ? t.fish : null;
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
    // The WANTED fish shows up a little more often, so the short goal stays reachable.
    if (s.bounty && roll.kind === 'fish' && roll.fish.id !== s.bounty) {
      const want = pond.fish.find((f) => f.id === s.bounty);
      if (want && want.rarity <= roll.fish.rarity + 1 && this.rng.chance(0.18)) roll = { kind: 'fish', fish: want, size: rollSize(this.rng, luck) };
    }
    // Today's fish swims up now and then (Legendary a bit less often).
    const today = this.todayFish;
    if (today && s.stats.catches >= 3 && roll.kind === 'fish' && roll.fish.id !== today.id && this.rng.chance(today.rarity >= 4 ? TODAY_FISH.chanceLegendary : TODAY_FISH.chance)) {
      roll = { kind: 'fish', fish: today, size: rollSize(this.rng, luck) };
    }
    const rarity = roll.kind === 'fish' ? roll.fish.rarity : roll.kind === 'egg' ? roll.tier : 0;
    return { roll, target: { rarity, fights: roll.kind === 'fish' } };
  }

  /** The player landed the catch: pay out and record it. */
  applyCatch(roll: CatchRoll, perfect: boolean): CatchResult {
    const s = this.s;
    const pond = this.pond;
    const res: CatchResult = { roll, coins: 0, gems: 0, isNew: false, record: false, cm: 0, eggStored: false, eggWhere: null, questsDone: [], bounty: false, streak: 0, streakBonus: 0, newBounty: null, today: false, nestEgg: false, medal: 0, giant: false, pondGold: false, lured: false };
    s.stats.catches += 1;
    this.streak = perfect ? this.streak + 1 : 0;
    res.streak = this.streak;
    const quests: string[] = [];
    const q = (kind: Parameters<typeof questProgress>[1], n = 1) => quests.push(...questProgress(s, kind, n).map((d) => d.id));
    if (perfect) {
      s.stats.perfect += 1;
      q('perfect');
    }
    switch (roll.kind) {
      case 'fish': {
        s.stats.fish += 1;
        const medalBefore = medalOf(s, roll.fish);
        const goldBefore = pondGold(s, pond);
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
        res.streakBonus = Math.min(STREAK_MAX, this.streak) * STREAK_STEP;
        const goldBonus = pondGold(s, pond) ? 1 + POND_GOLD_BONUS : 1;
        res.coins = Math.round(fishPrice(roll.fish, roll.size, pond, this.perk('merchant')) * (1 + res.streakBonus / 100) * goldBonus);
        if (s.bounty === roll.fish.id) {
          res.bounty = true;
          res.coins = res.coins * 3 + 40 * pond.priceMult;
          s.bounty = null;
          s.bountyIn = BOUNTY_GAP;
        }
        const today = this.todayFish;
        if (today && today.id === roll.fish.id) {
          res.today = true;
          res.coins = res.coins * TODAY_FISH.priceMult + TODAY_FISH.bonus * pond.priceMult;
          s.todayFish.caught = true;
          // An overnight egg: Rare (Epic for a Legendary), with a good shiny chance.
          const tier = roll.fish.rarity >= 4 ? 3 : 2;
          res.nestEgg = addNestEgg(s, tier, pond.id, TODAY_FISH.shiny);
          // Nest taken (a daily-gift egg): the incubator or basket, then coins.
          if (!res.nestEgg && !storeEgg(s, tier, pond.id, TODAY_FISH.shiny)) res.coins += eggCoins(3, pond);
        }
        // Luring a boss back after a lost fight: any fish in its pond counts.
        if (s.bossLure && s.bossLure.boss === pond.boss.id && s.bossLure.have < s.bossLure.need) {
          s.bossLure.have += 1;
          if (s.bossLure.have >= s.bossLure.need) res.lured = true;
        }
        res.giant = roll.size >= GIANT_SIZE;
        if (this.lateGame) {
          const m = medalOf(s, roll.fish);
          if (m > medalBefore) res.medal = m;
          res.pondGold = !goldBefore && pondGold(s, pond);
        }
        fishSpeedsEggs(s);
        q('catch');
        if (roll.fish.rarity >= 2) q('rare');
        break;
      }
      case 'egg':
        s.stats.eggs += 1;
        res.eggWhere = storeEgg(s, roll.tier, pond.id);
        res.eggStored = !!res.eggWhere;
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
    if (!s.bounty && !res.bounty && !this.todayFish) {
      s.bountyIn -= 1;
      if (s.bountyIn <= 0) res.newBounty = this.postBounty();
    }
    return res;
  }

  /** A fumbled cast (too early, too slow, line snapped) ends the perfect streak. */
  breakStreak() {
    this.streak = 0;
  }

  /** Picks a WANTED fish of this pond: mostly Common or Uncommon, sometimes Rare. */
  postBounty(): string {
    const pond = this.pond;
    const r = this.rng.next();
    const tier = r < 0.5 ? 0 : r < 0.85 ? 1 : 2;
    const options = pond.fish.filter((f) => f.rarity === tier);
    const fish = this.rng.pick(options.length ? options : pond.fish);
    this.s.bounty = fish.id;
    return fish.id;
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
    return Math.floor((Math.min(seconds, OFFLINE_CAP) / 60) * per * value * 0.5);
  }

  hatch(index: number): { petId: string; result: HatchResult; shiny: boolean; tier: number } | null {
    const egg = this.s.eggs[index];
    if (!egg || egg.left > 0) return null;
    const pet = petForEgg(egg);
    const shiny = this.rng.chance(egg.shiny ?? 0.01);
    this.s.eggs[index] = null;
    this.s.stats.hatched += 1;
    questProgress(this.s, 'hatch');
    const pond = pondById.get(egg.pond as 'cozy') ?? PONDS[0];
    const result = addPet(this.s, pet.id, shiny, pond.priceMult);
    return { petId: pet.id, result, shiny, tier: egg.tier };
  }

  /**
   * Claims a finished daily quest: coins times the best pond's multiplier. The third quest of the
   * day also gives an egg (Uncommon, Rare once a second pond is open).
   */
  claimQuest(index: number): { coins: number; egg: number; eggStored: boolean } | null {
    const s = this.s;
    const q = s.quests.list[index];
    const def = q && QUEST_POOL.find((d) => d.id === q.id);
    if (!q || !def || q.claimed || q.progress < def.goal) return null;
    q.claimed = true;
    const coins = def.coins * rewardMult(s);
    this.earn(coins);
    const egg = questEgg(s, index);
    const eggStored = egg >= 0 && !!storeEgg(s, egg, this.pond.id);
    if (egg >= 0 && !eggStored) this.earn(eggCoins(egg, this.pond));
    return { coins, egg, eggStored };
  }

  /** Claims today's login gift. Eggs go to the overnight nest (incubator, then coins, if it is taken). */
  claimDailyGift(): { coins: number; egg: number; where: 'nest' | 'incubator' | 'basket' | 'sold' | null; hat: string | null; pet: { id: string; result: HatchResult } | null } | null {
    const s = this.s;
    const today = dayKey(new Date(this.now()));
    const st = dailyStatus(s.daily, today);
    if (!st.canClaim) return null;
    const r = STREAK[(st.streak - 1) % STREAK.length];
    s.daily = claimDaily(s.daily, today);
    const coins = r.coins * rewardMult(s);
    this.earn(coins);
    let where: 'nest' | 'incubator' | 'basket' | 'sold' | null = null;
    // Day 3: an exclusive hat (coins if already owned). Day 7: an exclusive pet (a level on later weeks).
    let hat: string | null = null;
    if (r.hat) {
      if (this.grantCosmetic(r.hat)) hat = r.hat;
      else this.earn(500 * rewardMult(s));
    }
    let pet: { id: string; result: HatchResult } | null = null;
    if (r.pet) pet = { id: r.pet, result: addPet(s, r.pet, false, rewardMult(s)) };
    if (r.egg >= 0) {
      if (addNestEgg(s, r.egg, this.pond.id, 0.1)) where = 'nest';
      else {
        const placed = storeEgg(s, r.egg, this.pond.id, 0.1);
        if (placed) where = placed;
      }
      if (!where) {
        where = 'sold';
        this.earn(eggCoins(r.egg, this.pond));
      }
    }
    return { coins, egg: r.egg, where, hat, pet };
  }

  /** Medals, boss stars and the wardrobe open with the second pond (after the first 10-15 minutes). */
  get lateGame() {
    return this.s.unlocked.includes(LATE_GAME_POND);
  }

  // ---------- boss rematch ----------

  /** Rematch tickets left today. */
  get ticketsLeft() {
    const day = dayKey(new Date(this.now()));
    if (this.s.tickets.day !== day) this.s.tickets = { day, used: 0 };
    return Math.max(0, BOSS_STARS.ticketsPerDay - this.s.tickets.used);
  }

  /** A boss fight was lost: catch some fish in this pond before it comes back. */
  loseBoss() {
    const i = Math.max(0, PONDS.indexOf(this.pond));
    this.s.bossLure = { boss: this.pond.boss.id, need: BOSS_LURE[i] ?? 8, have: 0 };
  }

  /** Lure task for this pond's boss, if one is pending. */
  get lure() {
    return lurePending(this.s, this.pond) ? this.s.bossLure : null;
  }

  /** The star the next rematch of this pond's boss is fought at (null: not open). */
  rematchStar(pond = this.pond): number | null {
    if (!this.lateGame || !this.s.bosses.includes(pond.boss.id)) return null;
    return Math.min(BOSS_STARS.max, (this.s.bossStars[pond.boss.id] ?? 0) + 1);
  }

  get starsTotal() {
    return Object.values(this.s.bossStars).reduce((a, b) => a + b, 0);
  }

  /** A rematch won: uses a ticket, records the star, pays coins and an Epic (Legendary from star 8) egg. */
  winRematch(star: number) {
    const s = this.s;
    const pond = this.pond;
    if (this.ticketsLeft <= 0) return null;
    s.tickets.used += 1;
    const before = this.starsTotal;
    s.bossStars[pond.boss.id] = Math.max(s.bossStars[pond.boss.id] ?? 0, star);
    const coins = Math.round(BOSS_STARS.coins * pond.priceMult * (1 + BOSS_STARS.coinsPerStar * star));
    this.earn(coins);
    const tier = star >= BOSS_STARS.legendaryFrom ? 4 : 3;
    const where = storeEgg(s, tier, pond.id, BOSS_STARS.shiny + BOSS_STARS.shinyPerStar * star);
    if (!where) this.earn(eggCoins(tier, pond));
    // 15 stars in total: the captain's hat.
    let hat: string | null = null;
    if (before < 15 && this.starsTotal >= 15 && this.grantCosmetic('hat:captain')) hat = 'hat:captain';
    return { coins, tier, where, hat, stars: s.bossStars[pond.boss.id] };
  }

  // ---------- challenge mode ----------

  /** Challenge mode is open (with the second pond). */
  get challengeOpen() {
    return this.lateGame;
  }

  /** A challenge can be played: its pond is open and the one before it (same pond) is cleared. */
  challengeUnlocked(c: ChallengeDef) {
    if (!this.challengeOpen || !this.s.unlocked.includes(c.pond)) return false;
    return c.n === 1 || this.s.challenge.cleared.includes(`${c.pond}-${c.n - 1}`);
  }

  /** A challenge catch: Fishdex, medals and quests count, but no coins or eggs (the reward is at the end). */
  applyChallengeCatch(fish: FishDef, size: number, perfect: boolean) {
    const s = this.s;
    s.stats.catches += 1;
    s.stats.fish += 1;
    if (perfect) {
      s.stats.perfect += 1;
      questProgress(s, 'perfect');
    }
    const cm = Math.round(fish.cm * size * 10) / 10;
    const e = s.dex[fish.id];
    const isNew = !e;
    if (!e) s.dex[fish.id] = { n: 1, best: cm };
    else {
      e.n += 1;
      if (cm > e.best) e.best = cm;
    }
    questProgress(s, 'catch');
    if (fish.rarity >= 2) questProgress(s, 'rare');
    fishSpeedsEggs(s);
    return { isNew, cm };
  }

  /**
   * A challenge cleared in timeMs. First clear pays in full; a new record adds 20%; replays pay 10%,
   * and only 5 replays a day pay at all, so replaying cannot flood the economy.
   */
  finishChallenge(c: ChallengeDef, timeMs: number) {
    const s = this.s;
    const ch = s.challenge;
    const day = dayKey(new Date(this.now()));
    if (ch.replays.day !== day) ch.replays = { day, n: 0 };
    const first = !ch.cleared.includes(c.id);
    const prev = ch.best[c.id];
    const record = prev === undefined || timeMs < prev;
    if (record) ch.best[c.id] = timeMs;
    let coins = 0;
    let kind: 'first' | 'replay' | 'capped' = 'first';
    if (first) {
      ch.cleared.push(c.id);
      coins = c.reward;
    } else if (ch.replays.n < CHALLENGE.paidReplaysPerDay) {
      ch.replays.n += 1;
      coins = Math.round(c.reward * CHALLENGE.replayShare);
      kind = 'replay';
    } else kind = 'capped';
    if (record && !first) coins += Math.round(c.reward * CHALLENGE.recordBonus);
    this.earn(coins);
    const next = CHALLENGES.find((d) => d.pond === c.pond && d.n === c.n + 1) ?? null;
    return { coins, first, record, kind, best: ch.best[c.id], prev, next, replaysLeft: CHALLENGE.paidReplaysPerDay - ch.replays.n };
  }

  // ---------- wardrobe ----------

  owns(id: string) {
    const c = cosmeticById.get(id);
    // Free defaults count as owned (older saves never listed the default bait).
    return this.s.style.owned.includes(id) || (!!c && c.price === 0 && !c.source);
  }

  /** Gives a cosmetic and wears it (exclusives and gifts). False if already owned. */
  grantCosmetic(id: string) {
    const c = cosmeticById.get(id);
    if (!c || this.owns(id)) return false;
    this.s.style.owned.push(id);
    this.s.style[c.kind] = id;
    return true;
  }

  /** Buys (if needed) and wears a cosmetic. */
  wear(id: string): 'worn' | 'bought' | 'noCoins' | 'locked' {
    const c = cosmeticById.get(id);
    if (!c) return 'locked';
    if (!this.owns(id)) {
      if (c.source) return 'locked';
      if (this.s.coins < c.price) return 'noCoins';
      this.s.coins -= c.price;
      this.s.style.owned.push(id);
      this.s.style[c.kind] = id;
      return 'bought';
    }
    this.s.style[c.kind] = id;
    return 'worn';
  }

  /** Sells a basket egg for the same coins an egg sells for when there is no room. */
  sellBasketEgg(index: number) {
    const b = this.s.basket[index];
    if (!b) return 0;
    const coins = eggCoins(b.tier, pondById.get(b.pond as 'cozy') ?? this.pond);
    this.s.basket.splice(index, 1);
    this.earn(coins);
    return coins;
  }

  /** Puts the chosen basket egg into a free incubator slot. */
  incubate(basketIndex: number, slot = -1) {
    return incubateFromBasket(this.s, basketIndex, slot);
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
    return INCUBATOR_SLOT_COST[this.s.incubatorSlots] ?? Infinity;
  }

  buyIncubatorSlot() {
    const cost = this.incubatorSlotCost();
    if (this.s.coins < cost) return false;
    this.s.coins -= cost;
    this.s.incubatorSlots += 1;
    return true;
  }

  teamSlotCost() {
    return TEAM_SLOT_COST[this.s.teamSlots] ?? Infinity;
  }

  buyTeamSlot() {
    const cost = this.teamSlotCost();
    if (this.s.coins < cost) return false;
    this.s.coins -= cost;
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

  /** Boss beaten: an Epic egg (or coins when the incubator is full) and a coin prize. */
  winBoss() {
    const s = this.s;
    const pond = this.pond;
    if (!s.bosses.includes(pond.boss.id)) s.bosses.push(pond.boss.id);
    const stored = !!storeEgg(s, 3, pond.id);
    const prize = 250 * pond.priceMult;
    const coins = (stored ? 0 : eggCoins(3, pond)) + prize;
    this.earn(coins);
    return { eggStored: stored, coins, prize };
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
    // A WANTED fish belongs to one pond: post a new one for the new pond.
    if (this.s.bounty) this.postBounty();
    return true;
  }

  /**
   * The next long-term goal, shown under the coin counter so the player always knows what to do:
   * fill the Fishdex to call the boss, save up for the next pond, travel there, then complete the Fishdex.
   */
  nextGoal(): { kind: 'dex' | 'pond' | 'travel' | 'all'; n: number; max: number; pond?: string } | null {
    const s = this.s;
    const pond = this.pond;
    const n = dexCount(s, pond);
    if (!s.bosses.includes(pond.boss.id)) return n >= pond.bossAt ? null : { kind: 'dex', n, max: pond.bossAt };
    const next = PONDS[PONDS.indexOf(pond) + 1];
    if (next && !s.unlocked.includes(next.id)) return { kind: 'pond', n: s.coins, max: next.unlockCost, pond: next.id };
    const ahead = PONDS.find((p) => s.unlocked.includes(p.id) && !s.bosses.includes(p.boss.id) && p.id !== pond.id);
    if (ahead) return { kind: 'travel', n: 1, max: 1, pond: ahead.id };
    const all = PONDS.reduce((a, p) => a + p.fish.length, 0);
    return { kind: 'all', n: Object.keys(s.dex).length, max: all };
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
    return { tier, stored: !!storeEgg(this.s, tier, this.pond.id) };
  }

  /** Rewarded: luck x2 for five minutes. */
  goldenBaitOn() {
    this.s.ads.goldenAt = this.now();
    this.s.ads.goldenUntil = this.now() + AD.goldenBaitSec * 1000;
  }
}

