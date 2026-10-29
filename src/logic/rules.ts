// Game rules as pure functions: prices, upgrade costs, perks, luck, catch rolls, eggs, quests.
// No Phaser here, so tests and the balance sim (tools/sim.ts) run the same code as the game.
import { pickWeighted, type Rng } from '../../core/rng';
import {
  petById,
  EGG_POND_MIX,
  FIRM_HOOK,
  cosmeticById,
  HABITAT_MULT,
  EGG_SELL,
  EGG_WEIGHTS,
  CATCH_WEIGHTS,
  FIGHT,
  BASKET_MAX,
  GIANT_SIZE,
  HATCH_SEC,
  MEDAL_BRONZE,
  MEDAL_SILVER,
  NEST_INDEX,
  NEST_SEC,
  PERKS,
  PET_MAX_LEVEL,
  PET_TOP_MULT,
  QUEST_POOL,
  RARITY_PRICE,
  RARITY_WEIGHTS,
  UPGRADES,
  UPGRADE_GROWTH,
  pondById,
  type FishDef,
  type PerkKind,
  type PondDef,
  type QuestDef,
  type UpgradeId,
} from '../content/data';
import type { EggSlot, SaveData } from './model';

// ---------- upgrades ----------

export function upgradeCost(id: UpgradeId, level: number) {
  return Math.ceil(UPGRADES[id].c0 * Math.pow(UPGRADE_GROWTH, level));
}

export function canUpgrade(s: SaveData, id: UpgradeId) {
  const lv = s.upgrades[id];
  return lv < UPGRADES[id].max && s.coins >= upgradeCost(id, lv);
}

/** Cheapest upgrade the player can buy now, for the glowing button. */
export function anyUpgradeAffordable(s: SaveData) {
  return (Object.keys(UPGRADES) as UpgradeId[]).some((id) => canUpgrade(s, id));
}

// ---------- pets and perks ----------

export function perkValue(perk: PerkKind, rarity: number, level: number) {
  const lv = Math.max(1, Math.min(PET_MAX_LEVEL, level));
  const r = Math.max(0, Math.min(PET_TOP_MULT.length - 1, rarity));
  return PERKS[perk].values[r] * (1 + (PET_TOP_MULT[r] - 1) * Math.sqrt((lv - 1) / (PET_MAX_LEVEL - 1)));
}

/** v1.16: the bonus of a perk from the worn wardrobe items (hat, rod, bobber, bait). */
export function gearPerk(s: SaveData, perk: PerkKind) {
  let total = 0;
  for (const id of [s.style.hat, s.style.rod, s.style.bobber, s.style.bait]) {
    const st = id ? cosmeticById.get(id)?.stats : undefined;
    if (st) total += (st as Record<string, number>)[perk] ?? 0;
  }
  return total;
}

/** A perk in play: the team's pets plus the worn wardrobe items. */
export function perkTotal(s: SaveData, perk: PerkKind) {
  return teamPerk(s, perk, (id) => petById.get(id)) + gearPerk(s, perk);
}

/** v1.16 Firm hook: price now (FIRM_HOOK), from the coins in hand and the furthest pond unlocked. */
export function firmHookPrice(s: SaveData) {
  const floor = s.unlocked.includes('frozen') ? FIRM_HOOK.min.frozen : s.unlocked.includes('misty') ? FIRM_HOOK.min.misty : FIRM_HOOK.min.cozy;
  return Math.max(floor, Math.round(s.coins * FIRM_HOOK.share));
}

/** Sum of a perk over the pets in the team. */
export function teamPerk(s: SaveData, perk: PerkKind, petLookup: (id: string) => { rarity: number; perk: PerkKind } | undefined) {
  let total = 0;
  for (const id of s.team) {
    const def = petLookup(id);
    const st = s.pets[id];
    if (def && st && def.perk === perk) total += perkValue(perk, def.rarity, st.level);
  }
  return total;
}

/** Duplicates needed to go from `level` to the next. */
export function xpForLevel(level: number) {
  return level;
}

export type HatchResult = { kind: 'new' } | { kind: 'xp'; levelUp: boolean; level: number } | { kind: 'maxed'; coins: number };

/** Adds a hatched pet to the collection. New pets join the team when there is room. */
export function addPet(s: SaveData, petId: string, shiny: boolean, pondMult: number): HatchResult {
  const st = s.pets[petId];
  if (!st) {
    s.pets[petId] = { level: 1, xp: 0, shiny: shiny || undefined };
    if (s.team.length < s.teamSlots) s.team.push(petId);
    return { kind: 'new' };
  }
  if (shiny) st.shiny = true;
  if (st.level >= PET_MAX_LEVEL) {
    const coins = 25 * pondMult;
    s.coins += coins;
    return { kind: 'maxed', coins };
  }
  st.xp += 1;
  if (st.xp >= xpForLevel(st.level)) {
    st.xp = 0;
    st.level += 1;
    return { kind: 'xp', levelUp: true, level: st.level };
  }
  return { kind: 'xp', levelUp: false, level: st.level };
}

// ---------- luck and rolls ----------

export type CastZone = 0 | 1 | 2;
export const CAST_MULT = [1, 1.5, 2.5];
export const BASE_LUCK = 5;

export interface LuckInput {
  bait: number;
  petLuck: number;
  zone: CastZone;
  golden: boolean;
  lucky: boolean;
}

/** Luck in percent points. Each point moves 1% of chance from Common to the rarer tiers. */
export function luckOf(l: LuckInput) {
  return (BASE_LUCK + l.bait + l.petLuck) * CAST_MULT[l.zone] * (l.golden ? 2 : 1) * (l.lucky ? 3 : 1);
}

/** Rarity weights after luck. Luck is capped so Common never drops under 10%. */
export function rarityWeights(luck: number, base: readonly number[] = RARITY_WEIGHTS): number[] {
  const shift = Math.min(Math.max(0, luck), base[0] - 10);
  const rest = base.slice(1).reduce((a, b) => a + b, 0);
  return base.map((w, i) => (i === 0 ? w - shift : w + (shift * w) / rest));
}

export type CatchKind = 'fish' | 'egg' | 'junk' | 'chest';

/** Pet perks that change what comes up on the hook, in percent (Egg finder, Treasure nose, Big catch). */
export interface HookPerks {
  finder: number;
  treasure: number;
  big: number;
}
export const NO_HOOK_PERKS: HookPerks = { finder: 0, treasure: 0, big: 0 };

export function catchWeights(luck: number, perks: HookPerks = NO_HOOK_PERKS): Record<CatchKind, number> {
  // Luck makes junk rarer, never gone.
  const junk = CATCH_WEIGHTS.junk * Math.max(0.4, 1 - luck / 100);
  return { fish: CATCH_WEIGHTS.fish, egg: CATCH_WEIGHTS.egg * (1 + perks.finder / 100), junk, chest: CATCH_WEIGHTS.chest * (1 + perks.treasure / 100) };
}

export type CatchRoll =
  | { kind: 'fish'; fish: FishDef; size: number }
  /** pond: the pond whose pet hatches from it (set by PondGame.rollForCast, see eggPond). */
  | { kind: 'egg'; tier: number; pond?: string }
  | { kind: 'junk'; item: string }
  | { kind: 'chest' };

export function rollRarityTier(rng: Rng, luck: number) {
  return pickWeighted(rng, rarityWeights(luck));
}

/** Size factor S, 0.8 to 1.5, mostly small. Luck nudges it up a little. */
export function rollSize(rng: Rng, luck: number) {
  const r = Math.pow(rng.next(), 1.6 - Math.min(0.6, luck / 100));
  return Math.round((0.8 + 0.7 * r) * 100) / 100;
}

/**
 * Which fish bites (v1.16). Luck sets the rarity as before; within a rarity, a fish in its own zone
 * (FishDef.zone, the cast distance) weighs HABITAT_MULT, the others 1, so the share of each rarity and
 * the coins stay as they were. A rarity with one fish (the Legendary) comes x1.5 in its zone and x0.75
 * elsewhere. Without a zone (tools), only rarity.
 */
export function fishWeights(pond: PondDef, luck: number, zone?: CastZone): number[] {
  const rw = rarityWeights(luck);
  const m = (f: FishDef) => (zone !== undefined && f.zone === zone ? HABITAT_MULT : 1);
  const sum = rw.map((_, t) => pond.fish.filter((f) => f.rarity === t).reduce((a, f) => a + m(f), 0));
  const alone = rw.map((_, t) => pond.fish.filter((f) => f.rarity === t).length === 1);
  return pond.fish.map((f) => {
    const tier = rw[f.rarity] * (alone[f.rarity] && zone !== undefined ? (f.zone === zone ? 1.5 : 0.75) : 1);
    return (tier * m(f)) / Math.max(1e-9, sum[f.rarity]);
  });
}

export function rollFish(rng: Rng, pond: PondDef, luck: number, zone?: CastZone): { fish: FishDef; size: number } {
  const fish = pond.fish[pickWeighted(rng, fishWeights(pond, luck, zone))];
  return { fish, size: rollSize(rng, luck) };
}

export function rollCatch(rng: Rng, pond: PondDef, luck: number, perks: HookPerks = NO_HOOK_PERKS, zone?: CastZone): CatchRoll {
  const w = catchWeights(luck, perks);
  const kinds: CatchKind[] = ['fish', 'egg', 'junk', 'chest'];
  const kind = kinds[pickWeighted(rng, kinds.map((k) => w[k]))];
  if (kind === 'fish') return { kind, ...rollFish(rng, pond, luck, zone) };
  if (kind === 'egg') return { kind, tier: pickWeighted(rng, rarityWeights(luck, EGG_WEIGHTS)) };
  if (kind === 'junk') return { kind, item: rng.pick(pond.junk) };
  return { kind };
}

/** Coins for one fish: B x S x P x (1 + M). */
export function fishPrice(fish: FishDef, size: number, pond: PondDef, merchantPct: number) {
  return Math.max(1, Math.round(RARITY_PRICE[fish.rarity] * size * pond.priceMult * (1 + merchantPct / 100)));
}

/** Expected coins of one fish caught with this luck (for offline income and angler pets). */
export function expectedFishValue(pond: PondDef, luck: number, merchantPct: number, bigPct = 0) {
  const w = rarityWeights(luck);
  const total = w.reduce((a, b) => a + b, 0);
  let v = 0;
  for (let i = 0; i < w.length; i++) v += (w[i] / total) * RARITY_PRICE[i];
  return v * 1.08 * (1 + bigPct / 100) * pond.priceMult * (1 + merchantPct / 100);
}

export function chestReward(rng: Rng, pond: PondDef, first: boolean) {
  return { coins: Math.round((first ? 100 : 60 + rng.int(0, 60)) * pond.priceMult), gems: 0 };
}

export function junkCoins(pond: PondDef) {
  return pond.priceMult;
}

/** Coins for an egg sold (no room, or from the basket): by rarity only, times the best pond reached. */
export function eggCoins(tier: number, s: SaveData) {
  return EGG_SELL[Math.max(0, Math.min(EGG_SELL.length - 1, tier))] * rewardMult(s);
}


// ---------- fishing feel ----------

export interface FishingStats {
  /** Seconds the tap window stays open after the real bite. */
  biteWindow: number;
  /** Multiplier on reel speed. */
  reelMult: number;
  /** Seconds the line survives in the red zone. */
  lineHold: number;
  /** Chance a normal fish shakes off the hook while reeling (v1.16: lower with the Firm hook). */
  slip?: number;
}

export function fishingStats(s: SaveData, sharpSec: number, strongPct: number): FishingStats {
  return {
    // 0.75 s base: phone players need about 0.4 s to see the splash and tap, plus touch latency.
    biteWindow: Math.min(1.1, 0.75 + s.upgrades.float * 0.02 + sharpSec),
    reelMult: (1 + 0.08 * s.upgrades.rod) * (1 + strongPct / 100),
    lineHold: 1 + 0.1 * s.upgrades.line,
  };
}

export function fightOf(rarity: number) {
  return FIGHT[Math.max(0, Math.min(FIGHT.length - 1, rarity))];
}

// ---------- incubator ----------

export function eggTime(tier: number) {
  return HATCH_SEC[tier];
}

/** Puts an egg into the first free slot. False when every open slot is full. */
export function addEgg(s: SaveData, tier: number, pond: string, shiny?: number): boolean {
  for (let i = 0; i < s.incubatorSlots; i++) {
    if (!s.eggs[i]) {
      const t = eggTime(tier);
      s.eggs[i] = { tier, pond, left: t, total: t, ...(shiny ? { shiny } : {}) };
      return true;
    }
  }
  return false;
}

export type EggPlace = 'incubator' | 'basket' | null;

/** A new egg: into a free incubator slot, else the basket, else nowhere (null: the caller sells it). */
export function storeEgg(s: SaveData, tier: number, pond: string, shiny?: number): EggPlace {
  if (addEgg(s, tier, pond, shiny)) return 'incubator';
  if (s.basket.length < BASKET_MAX) {
    s.basket.push(shiny ? { tier, pond, shiny } : { tier, pond });
    return 'basket';
  }
  return null;
}

/** Moves a basket egg into a free incubator slot (the given one, or the first free). */
export function incubateFromBasket(s: SaveData, basketIndex: number, slot = -1): boolean {
  const b = s.basket[basketIndex];
  if (!b) return false;
  const i = slot >= 0 ? slot : s.eggs.findIndex((e, k) => k < s.incubatorSlots && !e);
  if (i < 0 || i >= s.incubatorSlots || s.eggs[i]) return false;
  const t = eggTime(b.tier);
  s.eggs[i] = { tier: b.tier, pond: b.pond, left: t, total: t, ...(b.shiny ? { shiny: b.shiny } : {}) };
  s.basket.splice(basketIndex, 1);
  return true;
}

export function hasFreeEggSlot(s: SaveData) {
  for (let i = 0; i < s.incubatorSlots; i++) if (!s.eggs[i]) return true;
  return false;
}

/** How fast eggs warm up with the team's Nurture pets (1 = normal, 1.28 = 28% faster). */
export function hatchSpeed(s: SaveData) {
  return 1 + perkTotal(s, 'nurture') / 100;
}

/**
 * Real seconds until an egg hatches. The egg's own clock (left) counts design seconds and Nurture
 * makes it run faster, so every timer shown to the player divides by the speed (v1.14 showed the
 * raw clock: a 10 min Epic egg still read 10:00 with a turtle in the team, only ticking faster).
 */
export function hatchSecLeft(s: SaveData, e: { left: number }) {
  return e.left / hatchSpeed(s);
}

/** Time passes for every egg. nurturePct speeds it up. */
export function tickEggs(s: SaveData, sec: number, nurturePct: number) {
  const k = 1 + nurturePct / 100;
  for (const e of s.eggs) if (e && e.left > 0) e.left = Math.max(0, e.left - sec * k);
}

/** Each fish caught takes 5 seconds off every egg. */
/** Overnight nest egg (daily gift, today's fish). False when the nest is taken. */
export function addNestEgg(s: SaveData, tier: number, pond: string, shiny: number): boolean {
  if (s.eggs[NEST_INDEX]) return false;
  s.eggs[NEST_INDEX] = { tier, pond, left: NEST_SEC, total: NEST_SEC, shiny };
  return true;
}

/** Rewards for daily things scale with the best pond reached, so they stay worth it later on. */
export function rewardMult(s: SaveData) {
  return Math.max(1, ...s.unlocked.map((id) => pondById.get(id as 'cozy')?.priceMult ?? 1));
}

/** Today's special fish: a pond among the open ones, then Rare most days, Epic some, Legendary now and then. */
export function pickTodayFish(unlocked: PondDef[], day: string) {
  let h = 2166136261;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  const pond = unlocked[h % unlocked.length];
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  const r = (h % 1000) / 1000;
  const tier = r < 0.5 ? 2 : r < 0.85 ? 3 : 4;
  const fish = pond.fish.find((f) => f.rarity === tier) ?? pond.fish[pond.fish.length - 1];
  return { pond, fish };
}

export function fishSpeedsEggs(s: SaveData) {
  for (const e of s.eggs) if (e && e.left > 0) e.left = Math.max(0, e.left - 5);
}

export function readyEggIndex(s: SaveData) {
  return s.eggs.findIndex((e, i) => (i < s.incubatorSlots || i === NEST_INDEX) && e && e.left <= 0);
}

/**
 * The pond whose pet an egg caught in `pondId` will hatch (EGG_POND_MIX). Decided when the egg is
 * caught, so the mark on the egg tells the player which pet is inside. An earlier pond whose pet of
 * this rarity is already at the top level gives way to the pond itself.
 */
export function eggPond(rng: Rng, s: SaveData, pondId: string, tier: number): string {
  const mix = EGG_POND_MIX[pondId];
  if (!mix) return pondId;
  let r = rng.next();
  for (const [id, chance] of mix) {
    if (r < chance) {
      const pet = pondById.get(id)?.pets.find((p) => p.rarity === tier);
      return pet && (s.pets[pet.id]?.level ?? 0) >= PET_MAX_LEVEL ? pondId : id;
    }
    r -= chance;
  }
  return pondId;
}

export function petForEgg(egg: EggSlot) {
  const pond = pondById.get(egg.pond as 'cozy') ?? pondById.get('cozy')!;
  return pond.pets.find((p) => p.rarity === egg.tier) ?? pond.pets[0];
}

// ---------- fishdex and bosses ----------

export function dexCount(s: SaveData, pond: PondDef) {
  return pond.fish.filter((f) => s.dex[f.id]).length;
}

export function bossReady(s: SaveData, pond: PondDef) {
  return !s.bosses.includes(pond.boss.id) && dexCount(s, pond) >= pond.bossAt && !lurePending(s, pond);
}

/** The boss of this pond got away and has not been lured back yet. */
export function lurePending(s: SaveData, pond: PondDef) {
  return !!s.bossLure && s.bossLure.boss === pond.boss.id && s.bossLure.have < s.bossLure.need;
}

// ---------- medals ----------

/** 0 none, 1 bronze, 2 silver, 3 gold. Gold = silver count plus one giant (size >= GIANT_SIZE). */
export function medalOf(s: SaveData, fish: FishDef): number {
  const e = s.dex[fish.id];
  if (!e) return 0;
  const giant = e.best >= fish.cm * GIANT_SIZE - 0.05;
  if (e.n >= MEDAL_SILVER[fish.rarity]) return giant ? 3 : 2;
  return e.n >= MEDAL_BRONZE[fish.rarity] ? 1 : 0;
}

/** Every species of the pond at gold. */
export function pondGold(s: SaveData, pond: PondDef) {
  return pond.fish.every((f) => medalOf(s, f) === 3);
}

// ---------- quests ----------

/** Three quests for the day, picked from the pool with the day as seed. */
export function questsForDay(day: string): QuestDef[] {
  let h = 2166136261;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const pool = [...QUEST_POOL];
  const out: QuestDef[] = [];
  // Never two quests of the same kind.
  while (out.length < 3 && pool.length) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    const q = pool.splice(h % pool.length, 1)[0];
    if (!out.some((o) => o.kind === q.kind)) out.push(q);
  }
  return out;
}

export function refreshQuests(s: SaveData, day: string) {
  if (s.quests.day === day) return false;
  s.quests = { day, list: questsForDay(day).map((q) => ({ id: q.id, progress: 0, claimed: false })) };
  return true;
}

export function questProgress(s: SaveData, kind: QuestDef['kind'], amount = 1) {
  const done: QuestDef[] = [];
  for (const q of s.quests.list) {
    const def = QUEST_POOL.find((d) => d.id === q.id);
    if (!def || def.kind !== kind || q.claimed) continue;
    const before = q.progress;
    q.progress = Math.min(def.goal, q.progress + amount);
    if (before < def.goal && q.progress >= def.goal) done.push(def);
  }
  return done;
}

/** Egg tier the daily quest at this index gives (-1: none). The third quest gives one. */
export function questEgg(s: SaveData, index: number) {
  if (index !== 2) return -1;
  return s.unlocked.length >= 2 ? 2 : 1;
}

export function questsClaimable(s: SaveData) {
  return s.quests.list.filter((q) => {
    const def = QUEST_POOL.find((d) => d.id === q.id);
    return def && !q.claimed && q.progress >= def.goal;
  }).length;
}

// ---------- offline ----------

export const OFFLINE_CAP_SEC = 2 * 3600;

/** Coins the angler pets earned while the player was away. */
export function offlineCoins(seconds: number, anglerPerMin: number, valuePerFish: number) {
  const sec = Math.min(OFFLINE_CAP_SEC, seconds);
  return Math.floor((sec / 60) * anglerPerMin * valuePerFish);
}
