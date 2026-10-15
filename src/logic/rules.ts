// Game rules as pure functions: prices, upgrade costs, perks, luck, catch rolls, eggs, quests.
// No Phaser here, so tests and the balance sim (tools/sim.ts) run the same code as the game.
import { pickWeighted, type Rng } from '../../core/rng';
import {
  CATCH_WEIGHTS,
  FIGHT,
  BASKET_MAX,
  HATCH_SEC,
  NEST_INDEX,
  NEST_SEC,
  PERKS,
  PET_MAX_LEVEL,
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
  return PERKS[perk].values[rarity] * (1 + 0.2 * (level - 1));
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
export function rarityWeights(luck: number): number[] {
  const shift = Math.min(Math.max(0, luck), RARITY_WEIGHTS[0] - 10);
  const rest = RARITY_WEIGHTS.slice(1).reduce((a, b) => a + b, 0);
  return RARITY_WEIGHTS.map((w, i) => (i === 0 ? w - shift : w + (shift * w) / rest));
}

export type CatchKind = 'fish' | 'egg' | 'junk' | 'chest';

export function catchWeights(luck: number): Record<CatchKind, number> {
  // Luck makes junk rarer, never gone.
  const junk = CATCH_WEIGHTS.junk * Math.max(0.4, 1 - luck / 100);
  return { fish: CATCH_WEIGHTS.fish, egg: CATCH_WEIGHTS.egg, junk, chest: CATCH_WEIGHTS.chest };
}

export type CatchRoll =
  | { kind: 'fish'; fish: FishDef; size: number }
  | { kind: 'egg'; tier: number }
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

export function rollFish(rng: Rng, pond: PondDef, luck: number): { fish: FishDef; size: number } {
  const tier = rollRarityTier(rng, luck);
  const options = pond.fish.filter((f) => f.rarity === tier);
  const fish = rng.pick(options.length ? options : pond.fish);
  return { fish, size: rollSize(rng, luck) };
}

export function rollCatch(rng: Rng, pond: PondDef, luck: number): CatchRoll {
  const w = catchWeights(luck);
  const kinds: CatchKind[] = ['fish', 'egg', 'junk', 'chest'];
  const kind = kinds[pickWeighted(rng, kinds.map((k) => w[k]))];
  if (kind === 'fish') return { kind, ...rollFish(rng, pond, luck) };
  if (kind === 'egg') return { kind, tier: rollRarityTier(rng, luck) };
  if (kind === 'junk') return { kind, item: rng.pick(pond.junk) };
  return { kind };
}

/** Coins for one fish: B x S x P x (1 + M). */
export function fishPrice(fish: FishDef, size: number, pond: PondDef, merchantPct: number) {
  return Math.max(1, Math.round(RARITY_PRICE[fish.rarity] * size * pond.priceMult * (1 + merchantPct / 100)));
}

/** Expected coins of one fish caught with this luck (for offline income and angler pets). */
export function expectedFishValue(pond: PondDef, luck: number, merchantPct: number) {
  const w = rarityWeights(luck);
  const total = w.reduce((a, b) => a + b, 0);
  let v = 0;
  for (let i = 0; i < w.length; i++) v += (w[i] / total) * RARITY_PRICE[i];
  return v * 1.08 * pond.priceMult * (1 + merchantPct / 100);
}

export function chestReward(rng: Rng, pond: PondDef, first: boolean) {
  return { coins: Math.round((first ? 100 : 60 + rng.int(0, 60)) * pond.priceMult), gems: 0 };
}

export function junkCoins(pond: PondDef) {
  return pond.priceMult;
}

/** Coins for an egg that found no free incubator slot. */
export function eggCoins(tier: number, pond: PondDef) {
  return 10 * (tier + 1) * pond.priceMult;
}

// ---------- fishing feel ----------

export interface FishingStats {
  /** Seconds the tap window stays open after the real bite. */
  biteWindow: number;
  /** Multiplier on reel speed. */
  reelMult: number;
  /** Seconds the line survives in the red zone. */
  lineHold: number;
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

/** Today's special fish for a pond: Rare most days, Epic some, Legendary now and then. */
export function todayFishFor(pond: PondDef, day: string) {
  let h = 2166136261;
  for (const c of day + pond.id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  const r = (h % 1000) / 1000;
  const tier = r < 0.5 ? 2 : r < 0.85 ? 3 : 4;
  return pond.fish.find((f) => f.rarity === tier) ?? pond.fish[pond.fish.length - 1];
}

export function fishSpeedsEggs(s: SaveData) {
  for (const e of s.eggs) if (e && e.left > 0) e.left = Math.max(0, e.left - 5);
}

export function readyEggIndex(s: SaveData) {
  return s.eggs.findIndex((e, i) => (i < s.incubatorSlots || i === NEST_INDEX) && e && e.left <= 0);
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
  return !s.bosses.includes(pond.boss.id) && dexCount(s, pond) >= pond.bossAt;
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
