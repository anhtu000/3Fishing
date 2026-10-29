// Game content: ponds, fish, pets, junk, upgrades, quests. Numbers come from the design doc
// (Kitty Pond — Tài liệu thiết kế, "Kinh tế và công thức") and are tuned by tools/sim.ts.

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = 0 | 1 | 2 | 3 | 4;

/** Base chance of each rarity before luck. */
export const RARITY_WEIGHTS = [60, 25, 10, 4, 1];
/**
 * Egg rarity from a catch, before luck (v1.15; v1.14 used RARITY_WEIGHTS). More Common eggs, fewer
 * Uncommon/Rare/Epic, a little more Legendary so the rarest pets stay reachable.
 */
export const EGG_WEIGHTS = [70, 18.5, 7.5, 2.5, 1.5];
/** Base sell price by rarity (B in the price formula). */
export const RARITY_PRICE = [5, 12, 30, 80, 250];
/** Colour and label of each rarity. Shapes differ too (see ui/rarity.ts) for colour-blind players. */
export const RARITY_COLOR = [0x9aa9b8, 0x5fd38d, 0x4aa8ff, 0xb57bff, 0xffc83d];
export const RARITY_CSS = ['#7d8b99', '#2fae63', '#2f86e0', '#9356e6', '#e39b00'];
/** Hatch time in seconds by egg rarity. */
export const HATCH_SEC = [30, 120, 300, 600, 1200];
/** How hard a fish of each rarity fights: pull strength and width of the green zone. */
export const FIGHT = [
  { pull: 0.18, green: 0.5, reel: 0.55 },
  { pull: 0.28, green: 0.44, reel: 0.42 },
  { pull: 0.38, green: 0.38, reel: 0.33 },
  { pull: 0.5, green: 0.32, reel: 0.26 },
  { pull: 0.62, green: 0.27, reel: 0.2 },
];

export interface FishDef {
  id: string;
  name: string;
  rarity: Rarity;
  /** Typical length in cm at size 1.0. */
  cm: number;
  /** v1.16: where it likes to bite, by cast distance: 0 Near, 1 Far, 2 Super far (see HABITAT_MULT). */
  zone: 0 | 1 | 2;
}

/**
 * v1.16: a fish bites this many times more often when the cast lands in its zone (FishDef.zone), so
 * the cast distance is a choice: Super far has the most luck (x2.5), but each fish has its own water.
 * Every rarity has fish in different zones; the Legendary of each pond sits in one zone.
 */
export const HABITAT_MULT = 2.5;

/**
 * v1.16 Legendary sighting: a Legendary never bites at random. When a cast would bring one up, that
 * cast brings another fish and the Legendary shows itself in its own zone for `staySec` seconds of
 * fishing (the clock stops while a fish is on the hook and in menus). Land the hook within `reach`
 * design units of it to hook it; if it gets away it is back in the water for the time left; when the
 * time is up it swims off. Luck still decides how often one shows up.
 */
export const LEGEND = { staySec: 15, reach: 120 };

/**
 * Pet perks. v1.16 adds finder (more eggs), treasure (more chests) and big (bigger fish), so the
 * 15 pond pets share each perk at most twice and the 5 pets of a pond all differ.
 */
export type PerkKind = 'luck' | 'merchant' | 'strong' | 'sharp' | 'angler' | 'nurture' | 'finder' | 'treasure' | 'big';

export interface PetDef {
  id: string;
  name: string;
  rarity: Rarity;
  perk: PerkKind;
}

export interface PondDef {
  id: 'cozy' | 'misty' | 'frozen';
  name: string;
  /** Price multiplier P. */
  priceMult: number;
  /** Coins to travel here the first time (after beating the previous boss). */
  unlockCost: number;
  fish: FishDef[];
  pets: PetDef[];
  junk: string[];
  boss: { id: string; name: string; hp: number };
  /** Species needed in the Fishdex before the boss shows up. */
  bossAt: number;
}

export const PONDS: PondDef[] = [
  {
    id: 'cozy',
    name: 'Cozy Pond',
    priceMult: 1,
    unlockCost: 0,
    fish: [
      { id: 'pebble_minnow', name: 'Pebble Minnow', rarity: 0, cm: 9, zone: 0 },
      { id: 'lily_carp', name: 'Lily Carp', rarity: 0, cm: 32, zone: 1 },
      { id: 'mud_guppy', name: 'Mud Guppy', rarity: 0, cm: 6, zone: 0 },
      { id: 'button_bream', name: 'Button Bream', rarity: 0, cm: 18, zone: 2 },
      { id: 'bubble_perch', name: 'Bubble Perch', rarity: 1, cm: 24, zone: 1 },
      { id: 'clover_trout', name: 'Clover Trout', rarity: 1, cm: 38, zone: 0 },
      { id: 'reed_pike', name: 'Reed Pike', rarity: 1, cm: 46, zone: 2 },
      { id: 'teacup_koi', name: 'Teacup Koi', rarity: 2, cm: 14, zone: 0 },
      { id: 'rosy_goby', name: 'Rosy Goby', rarity: 2, cm: 12, zone: 2 },
      { id: 'lantern_catfish', name: 'Lantern Catfish', rarity: 3, cm: 64, zone: 2 },
      { id: 'moon_gar', name: 'Moon Gar', rarity: 3, cm: 88, zone: 1 },
      { id: 'golden_duckfish', name: 'Golden Duckfish', rarity: 4, cm: 41, zone: 0 },
    ],
    pets: [
      { id: 'puddle_frog', name: 'Puddle Frog', rarity: 0, perk: 'luck' },
      { id: 'reed_duckling', name: 'Reed Duckling', rarity: 1, perk: 'merchant' },
      { id: 'otter_pup', name: 'Otter Pup', rarity: 2, perk: 'angler' },
      { id: 'lily_turtle', name: 'Lily Turtle', rarity: 3, perk: 'nurture' },
      { id: 'sunny_axolotl', name: 'Sunny Axolotl', rarity: 4, perk: 'sharp' },
    ],
    junk: ['boot', 'can', 'bottle'],
    boss: { id: 'old_whiskers', name: 'Old Whiskers', hp: 1 },
    bossAt: 6,
  },
  {
    id: 'misty',
    name: 'Misty Creek',
    priceMult: 2,
    unlockCost: 1500,
    fish: [
      { id: 'fog_shiner', name: 'Fog Shiner', rarity: 0, cm: 11, zone: 1 },
      { id: 'stone_loach', name: 'Stone Loach', rarity: 0, cm: 16, zone: 0 },
      { id: 'willow_dace', name: 'Willow Dace', rarity: 0, cm: 20, zone: 0 },
      { id: 'pebble_chub', name: 'Pebble Chub', rarity: 0, cm: 22, zone: 2 },
      { id: 'mist_salmon', name: 'Mist Salmon', rarity: 1, cm: 58, zone: 2 },
      { id: 'rainbow_grayling', name: 'Rainbow Grayling', rarity: 1, cm: 36, zone: 1 },
      { id: 'misty_minnow', name: 'Misty Minnow', rarity: 1, cm: 14, zone: 0 },
      { id: 'ghost_pike', name: 'Ghost Pike', rarity: 2, cm: 71, zone: 1 },
      { id: 'ember_trout', name: 'Ember Trout', rarity: 2, cm: 44, zone: 0 },
      { id: 'thunder_sturgeon', name: 'Thunder Sturgeon', rarity: 3, cm: 140, zone: 2 },
      { id: 'dusk_catfish', name: 'Dusk Catfish', rarity: 3, cm: 96, zone: 0 },
      { id: 'silver_spirit_trout', name: 'Silver Spirit Trout', rarity: 4, cm: 52, zone: 1 },
    ],
    pets: [
      { id: 'mossy_snail', name: 'Mossy Snail', rarity: 0, perk: 'strong' },
      { id: 'creek_beaver', name: 'Creek Beaver', rarity: 1, perk: 'treasure' },
      { id: 'firefly_fox', name: 'Firefly Fox', rarity: 2, perk: 'finder' },
      { id: 'heron_chick', name: 'Heron Chick', rarity: 3, perk: 'big' },
      { id: 'mist_fawn', name: 'Mist Giraffe', rarity: 4, perk: 'merchant' },
    ],
    junk: ['boot', 'wheel', 'can'],
    boss: { id: 'fog_pike', name: 'The Fog Pike', hp: 1 },
    bossAt: 7,
  },
  {
    id: 'frozen',
    name: 'Frozen Lake',
    priceMult: 4,
    unlockCost: 11000,
    fish: [
      { id: 'frost_minnow', name: 'Frost Minnow', rarity: 0, cm: 8, zone: 0 },
      { id: 'ice_perch', name: 'Ice Perch', rarity: 0, cm: 22, zone: 1 },
      { id: 'tundra_dace', name: 'Tundra Dace', rarity: 0, cm: 20, zone: 2 },
      { id: 'snow_smelt', name: 'Snow Smelt', rarity: 0, cm: 18, zone: 1 },
      { id: 'aurora_char', name: 'Aurora Char', rarity: 1, cm: 46, zone: 2 },
      { id: 'crystal_cisco', name: 'Crystal Cisco', rarity: 1, cm: 34, zone: 0 },
      { id: 'glacier_trout', name: 'Glacier Trout', rarity: 1, cm: 48, zone: 1 },
      { id: 'polar_burbot', name: 'Polar Burbot', rarity: 2, cm: 62, zone: 0 },
      { id: 'icicle_pike', name: 'Icicle Pike', rarity: 2, cm: 74, zone: 2 },
      { id: 'frostfin_muskie', name: 'Frostfin Muskie', rarity: 3, cm: 118, zone: 1 },
      { id: 'northern_lightfish', name: 'Northern Lightfish', rarity: 3, cm: 60, zone: 2 },
      { id: 'starlight_whitefish', name: 'Starlight Whitefish', rarity: 4, cm: 49, zone: 2 },
    ],
    pets: [
      { id: 'penguin_chick', name: 'Penguin Chick', rarity: 0, perk: 'finder' },
      { id: 'snowy_owlet', name: 'Snowy Owlet', rarity: 1, perk: 'sharp' },
      { id: 'seal_pup', name: 'Seal Pup', rarity: 2, perk: 'angler' },
      { id: 'polar_cub', name: 'Polar Cub', rarity: 3, perk: 'strong' },
      { id: 'aurora_hare', name: 'Aurora Hare', rarity: 4, perk: 'luck' },
    ],
    junk: ['boot', 'bottle', 'can'],
    boss: { id: 'frostbeard', name: 'Old Frostbeard', hp: 1 },
    bossAt: 8,
  },
];

export const ALL_FISH: FishDef[] = PONDS.flatMap((p) => p.fish);
/** Pets that never come out of eggs: the 7-day login streak gives this one. */
export const SPECIAL_PETS: PetDef[] = [{ id: 'rainbow_turtle', name: 'Rainbow Turtle', rarity: 4, perk: 'luck' }];
export const ALL_PETS: PetDef[] = [...PONDS.flatMap((p) => p.pets), ...SPECIAL_PETS];
export const fishById = new Map(ALL_FISH.map((f) => [f.id, f]));
/** The pond a pet comes from (undefined for the special pets). */
export function pondOfPet(id: string) {
  return PONDS.find((p) => p.pets.some((x) => x.id === id));
}
/**
 * v1.16: an egg caught in a later pond sometimes holds a pet of an earlier pond, so early pets keep
 * getting duplicates (levels) and missed rare pets stay reachable. Chances by the pond the egg is
 * caught in; the rest is the pond itself. A pet already at the top level is skipped (rules.eggPond).
 */
export const EGG_POND_MIX: Record<string, [PondDef['id'], number][]> = {
  misty: [['cozy', 0.3]],
  frozen: [['cozy', 0.1], ['misty', 0.2]],
};
/** Texture of an egg: with the pond mark when the pond is known. */
export function eggKey(tier: number, pond?: string) {
  return pond ? `egg:${tier}:${pond}` : `egg:${tier}`;
}
export const petById = new Map(ALL_PETS.map((p) => [p.id, p]));
export const pondById = new Map(PONDS.map((p) => [p.id, p]));
export function pondOfFish(id: string) {
  return PONDS.find((p) => p.fish.some((f) => f.id === id))!;
}

/**
 * Perk value at rarity 0..4, level 1 (v1.16). Rarities sit closer than before (Legendary about 3.2x
 * Common, was 6-8x), so early pets keep a place in the team; level gains do the rest (PET_TOP_MULT).
 */
export const PERKS: Record<PerkKind, { name: string; values: number[]; unit: 'pct' | 'sec' | 'perMin' }> = {
  luck: { name: 'Lucky', values: [3, 4, 5.5, 7.5, 10], unit: 'pct' },
  merchant: { name: 'Merchant', values: [11, 15, 21, 27, 36], unit: 'pct' },
  strong: { name: 'Strong', values: [10, 13.5, 18.5, 24, 32], unit: 'pct' },
  sharp: { name: 'Sharp eye', values: [0.08, 0.11, 0.15, 0.2, 0.27], unit: 'sec' },
  // fish per minute caught for you, also while away
  angler: { name: 'Angler', values: [1.4, 1.9, 2.6, 3.4, 4.6], unit: 'perMin' },
  nurture: { name: 'Nurture', values: [11, 15, 21, 27, 36], unit: 'pct' },
  // more eggs on the hook: the egg weight times (1 + v%)
  finder: { name: 'Egg finder', values: [6, 8, 11, 14, 19], unit: 'pct' },
  // more chests on the hook: the chest weight times (1 + v%)
  treasure: { name: 'Treasure nose', values: [15, 20, 28, 36, 48], unit: 'pct' },
  // bigger fish: size times (1 + v%), so more coins, records and giants
  big: { name: 'Big catch', values: [3, 4, 5.5, 7, 9.5], unit: 'pct' },
};
export const PET_MAX_LEVEL = 20;
/**
 * Perk multiplier at the top level, by rarity (level 1 = x1; v1.15 used x2.07 for all). Gains come
 * early and slow down (square root). Lower rarities grow more, and they also get duplicates far more
 * often (70% of eggs are Common), so a levelled Common stays near a fresh Rare (level 5) or Epic
 * (level 12), while a maxed Legendary is still the best pet.
 */
export const PET_TOP_MULT = [2.8, 2.6, 2.4, 2.2, 2.0];

export type UpgradeId = 'rod' | 'line' | 'bait' | 'float';
export const UPGRADES: Record<UpgradeId, { name: string; c0: number; max: number; icon: string }> = {
  rod: { name: 'Rod', c0: 20, max: 50, icon: 'i_rod' },
  line: { name: 'Line', c0: 30, max: 20, icon: 'i_line' },
  bait: { name: 'Bait', c0: 40, max: 30, icon: 'i_bait' },
  float: { name: 'Float', c0: 50, max: 10, icon: 'i_float' },
};
export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[];
export const UPGRADE_GROWTH = 1.15;

/** What can come up on the hook, base weights before scripted beats. */
// Eggs: 15 -> 18 (+20%).
export const CATCH_WEIGHTS = { fish: 67, egg: 18, junk: 10, chest: 5 };

export const JUNK_NAMES: Record<string, string> = {
  boot: 'Rubber Boot',
  can: 'Soda Can',
  bottle: 'Message Bottle',
  wheel: 'Old Bike Wheel',
};
export const JUNK_LINES = [
  'Someone lost a boot. Again.',
  'Recycling counts as fishing, right?',
  'Not a fish. Still shiny.',
  'The pond says thank you.',
  'A cat can dream.',
];

/** Coin prices for extra slots. One currency only (Poki: dual currencies confuse web players). */
export const INCUBATOR_SLOT_COST = [0, 10000, 30000, 80000];
// Team slots 4 and 5: big late-game buys (slot 4 about 25k, slot 5 far more).
export const TEAM_SLOT_COST = [0, 0, 0, 25000, 90000];
export const START_TEAM_SLOTS = 3;

export interface QuestDef {
  id: string;
  kind: 'catch' | 'rare' | 'perfect' | 'hatch' | 'coins' | 'new';
  goal: number;
  /** Reward in coins, times the price multiplier of the pond you are in. */
  coins: number;
  text: string;
}
/** Daily quests are drawn from this pool, 3 a day. */
export const QUEST_POOL: QuestDef[] = [
  { id: 'catch20', kind: 'catch', goal: 20, coins: 60, text: 'Catch {n} fish' },
  { id: 'catch40', kind: 'catch', goal: 40, coins: 120, text: 'Catch {n} fish' },
  { id: 'rare3', kind: 'rare', goal: 3, coins: 150, text: 'Catch {n} Rare or better' },
  { id: 'perfect10', kind: 'perfect', goal: 10, coins: 80, text: 'Hook {n} fish on the first tap' },
  { id: 'hatch2', kind: 'hatch', goal: 2, coins: 80, text: 'Hatch {n} eggs' },
  { id: 'coins500', kind: 'coins', goal: 500, coins: 100, text: 'Earn {n} coins' },
];

/**
 * 7-day login streak (coins times the best pond's price multiplier). Day 3 gives an exclusive hat,
 * day 5 an egg for the overnight nest, day 7 an exclusive pet (a level for it on later cycles).
 */
export const STREAK: { coins: number; egg: number; hat?: string; pet?: string }[] = [
  { coins: 50, egg: -1 },
  { coins: 100, egg: -1 },
  { coins: 150, egg: -1, hat: 'hat:clover' },
  { coins: 200, egg: -1 },
  { coins: 0, egg: 1 },
  { coins: 400, egg: -1 },
  { coins: 0, egg: -1, pet: 'rainbow_turtle' },
];

// ---------- after the first ponds: long-term goals (D3, D7) ----------

/** Medals, boss stars and the wardrobe open with the second pond, so the first 15 minutes stay as they are. */
export const LATE_GAME_POND = 'misty';

// ---------- Challenge mode (opens with the second pond) ----------

export interface ChallengeDef {
  /** 'cozy-1' .. 'frozen-8'. */
  id: string;
  pond: PondDef['id'];
  /** 1..8 within the pond. */
  n: number;
  /** Goal: this many fish, of at least this many species, within timeSec. */
  fish: number;
  species: number;
  timeSec: number;
  /**
   * v1.16, level 3 on: a school of this many fish of one Common species (`decoy`) roams the whole
   * pond. The fish nearest the hook bites, so a careless cast brings a repeat; aim between them.
   */
  decoys: number;
  decoy: string | null;
  /** Coins for the first clear (replays pay a small share, see CHALLENGE). */
  reward: number;
}

/** Rewards: first clear in full, a new record +20%, a replay 10% (5 paid replays a day in total). */
export const CHALLENGE = { recordBonus: 0.2, replayShare: 0.1, paidReplaysPerDay: 5, liveFish: 9 };

/**
 * 24 challenges: 8 per pond, more fish and species each level, a little more time. v1.16: levels 1-2
 * stay as they were (learning the mode); from level 3 one more species is needed (same time) and a
 * school of one Common species (7 fish at level 3, rising to 15 at level 8: 7, 9, 10, 12, 13, 15)
 * roams the pond to crowd the hook.
 */
export const CHALLENGES: ChallengeDef[] = PONDS.flatMap((pond, pi) =>
  Array.from({ length: 8 }, (_, k) => {
    const hard = k >= 2;
    const commons = pond.fish.filter((f) => f.rarity === 0);
    return {
      id: `${pond.id}-${k + 1}`,
      pond: pond.id,
      n: k + 1,
      fish: 4 + k + pi,
      species: Math.min(7, 2 + Math.floor(k / 2) + (pi > 0 && k >= 6 ? 1 : 0) + (hard ? 1 : 0)),
      timeSec: 60 + k * 10 + pi * 10,
      decoys: hard ? 7 + Math.round(1.6 * (k - 2)) : 0,
      decoy: hard ? commons[k % commons.length].id : null,
      // Rewards rise evenly over all 24 (600 .. 2900), not by the pond's price multiplier.
      reward: 600 + 100 * (pi * 8 + k),
    };
  }),
);
export const challengeById = new Map(CHALLENGES.map((c) => [c.id, c]));

/**
 * WANTED fish: after a few minutes of play a big fish of the pond swims in at a random spot. Cast
 * so the hook lands next to it (within `reach` design units) to hook it; it fights harder than its
 * kind (see WANTED_FIGHT in logic/fishing.ts) and pays `priceMult` x its price plus a bonus. It swims
 * off after `staySec`; the next one comes `gapMin`-`gapMax` seconds of play later.
 */
export const WANTED = { firstSec: 150, gapMin: 180, gapMax: 300, staySec: 75, reach: 130, priceMult: 4, bonus: 60, sizeMin: 1.25, sizeMax: 1.5 };

/**
 * Motion speed of the whole game (v1.16: 0.9 on computers, 0.75 on phones; v1.15 0.85 / 0.75; v1.14 was 1).
 * Scales the fishing state machine (charge, bite, fight, boss), the pond, rig and HUD animations and
 * the scene's tweens and timers. Real-time clocks stay real: eggs, angler pets, WANTED fish, offline,
 * daily gifts. Challenge time limits grow by 1/GAME_SPEED so a challenge is as hard as before.
 */
export const GAME_SPEED_DESKTOP = 0.9;
/** Phones and tablets (29/10): 0.85 felt too fast on a small touch screen; 0.75 confirmed on a phone 29/10. */
export const GAME_SPEED_PHONE = 0.75;
/** The speed in use. Live binding: PlayScene sets it once at start for the device (tools keep desktop). */
export let GAME_SPEED = GAME_SPEED_DESKTOP;
export function setGameSpeed(v: number) {
  GAME_SPEED = v;
}

/** Fish to catch in the pond to lure a boss back after a lost fight (by pond: Cozy, Misty, Frozen). */
export const BOSS_LURE = [5, 8, 10];

/** Boss rematch: stars 1-10 per boss; a win uses a ticket, 3 tickets a day. A loss is free. */
export const BOSS_STARS = { max: 10, ticketsPerDay: 3, coins: 200, coinsPerStar: 0.25, shiny: 0.03, shinyPerStar: 0.02, legendaryFrom: 8 };

/**
 * Rematch forms: the same boss with a twist, so climbing the stars does not replay one fight.
 * ★1 is the boss as you know it, ★10 is always the Golden form; ★2-9 cycle through the forms,
 * shifted per pond so the three bosses never show the same form at the same star.
 */
export type BossForm = 'classic' | 'frenzy' | 'ghost' | 'giant' | 'golden';
export const BOSS_FORMS: BossForm[] = ['classic', 'frenzy', 'ghost', 'giant', 'golden'];
/** Coin reward multiplier by form (the Golden form is the hardest). */
export const BOSS_FORM_COINS: Record<BossForm, number> = { classic: 1, frenzy: 1, ghost: 1, giant: 1, golden: 1.5 };

export function bossForm(pondIndex: number, star: number): BossForm {
  if (star <= 1) return 'classic';
  if (star >= BOSS_STARS.max) return 'golden';
  const cycle: BossForm[] = ['frenzy', 'ghost', 'giant', 'golden'];
  return cycle[(star - 2 + pondIndex) % cycle.length];
}

/** A fish this much over its usual size is a giant (needed for a gold medal). */
export const GIANT_SIZE = 1.4;
/** Catches for bronze and silver, by rarity. Gold = silver + one giant. */
export const MEDAL_BRONZE = [10, 8, 5, 3, 1];
export const MEDAL_SILVER = [40, 25, 12, 6, 3];
/** Every species of a pond at gold: fish there sell for this much more. */
export const POND_GOLD_BONUS = 0.1;

export type CosmeticKind = 'hat' | 'rod' | 'bobber' | 'bait';
export interface CosmeticDef {
  id: string;
  kind: CosmeticKind;
  /** Coins, or 0 for the default and the exclusives. */
  price: number;
  /** Exclusive: from the day-3 login gift, or for 15 boss stars in total. */
  source?: 'daily3' | 'stars15';
  /** Rods: shaft and handle. Bobbers: top and bottom. */
  colors?: [number, number];
  /**
   * v1.16: small bonuses while worn, in percent (luck in points), added to the team's perks. 1-3 each;
   * pricier items give more and the stronger kinds (fish price, luck). Free defaults give none.
   */
  stats?: Partial<Record<GearStat, number>>;
}

/** Perks a wardrobe item can add (v1.16), in the order the wardrobe lists them. */
export const GEAR_STATS = ['merchant', 'luck', 'big', 'strong', 'finder', 'nurture', 'treasure'] as const;
export type GearStat = (typeof GEAR_STATS)[number];
export const COSMETICS: CosmeticDef[] = [
  { id: 'hat:rain', kind: 'hat', price: 0 },
  { id: 'hat:straw', kind: 'hat', price: 5000, stats: { treasure: 1 } },
  { id: 'hat:beanie', kind: 'hat', price: 12000, stats: { nurture: 2 } },
  { id: 'hat:flower', kind: 'hat', price: 25000, stats: { finder: 2, luck: 1 } },
  { id: 'hat:pirate', kind: 'hat', price: 40000, stats: { treasure: 2, big: 2 } },
  { id: 'hat:wizard', kind: 'hat', price: 60000, stats: { luck: 2, nurture: 2 } },
  { id: 'hat:tophat', kind: 'hat', price: 120000, stats: { merchant: 2, big: 2 } },
  { id: 'hat:crown', kind: 'hat', price: 300000, stats: { merchant: 3, luck: 3 } },
  { id: 'hat:clover', kind: 'hat', price: 0, source: 'daily3', stats: { luck: 2 } },
  { id: 'hat:captain', kind: 'hat', price: 0, source: 'stars15', stats: { strong: 3, big: 2 } },
  { id: 'rod:classic', kind: 'rod', price: 0, colors: [0xc98a4b, 0x8d5a2b] },
  { id: 'rod:ocean', kind: 'rod', price: 8000, colors: [0x5fb4ef, 0x2d6aa0], stats: { strong: 1 } },
  { id: 'rod:cherry', kind: 'rod', price: 20000, colors: [0xff8fab, 0xc2557a], stats: { strong: 2, finder: 1 } },
  { id: 'rod:bamboo', kind: 'rod', price: 50000, colors: [0xa8d86a, 0x5d8a2e], stats: { strong: 2, big: 2 } },
  { id: 'rod:gold', kind: 'rod', price: 180000, colors: [0xffd23f, 0xc99a1a], stats: { merchant: 3, strong: 3 } },
  { id: 'bobber:classic', kind: 'bobber', price: 0, colors: [0xff4d5e, 0xffffff] },
  { id: 'bobber:sky', kind: 'bobber', price: 6000, colors: [0x4fa8ff, 0xffffff], stats: { luck: 1 } },
  { id: 'bobber:mint', kind: 'bobber', price: 30000, colors: [0x3fcf8e, 0xfff6d6], stats: { finder: 2, treasure: 2 } },
  { id: 'bobber:gold', kind: 'bobber', price: 90000, colors: [0xffc83d, 0xfff1b8], stats: { luck: 3, merchant: 2 } },
  // Baits: the look on the hook, and from v1.16 a small bonus like the other items.
  { id: 'bait:worm', kind: 'bait', price: 0 },
  { id: 'bait:shrimp', kind: 'bait', price: 4000, stats: { big: 1 } },
  { id: 'bait:fly', kind: 'bait', price: 15000, stats: { luck: 1, finder: 1 } },
  { id: 'bait:cricket', kind: 'bait', price: 35000, stats: { big: 2, nurture: 2 } },
  { id: 'bait:goldworm', kind: 'bait', price: 80000, stats: { merchant: 2, big: 3 } },
];
/** Texture key of a bait cosmetic. */
export const baitKey = (id: string) => (id === 'bait:worm' || !id ? 'item:worm' : `item:bait_${id.slice(5)}`);
export const cosmeticById = new Map(COSMETICS.map((c) => [c.id, c]));

/**
 * Rewarded ads. No cooldown timers: Poki controls ad frequency and asks games not to add their own.
 * Each reward is gated by the game state instead (golden bait while it is not active, a mystery egg
 * while an incubator slot is free).
 */
/** Egg basket: eggs wait here when the incubator is full. Past this many they sell for coins. */
export const BASKET_MAX = 12;
/** Coins for a sold egg by tier (Common..Legendary), times the pond multiplier (v1.15; v1.14 was 10/20/30/40/50; Epic and Legendary are rarely sold). */
export const EGG_SELL = [25, 70, 150, 350, 800];

/** The overnight nest: one extra egg slot for special eggs that hatch over hours, so there is a reason to come back. */
export const NEST_INDEX = 4;
export const NEST_SEC = 6 * 3600;
/** Today's fish: chance per cast that it swims up instead (Legendary: lower), reward and egg. */
/**
 * v1.16 Firm hook: a short boost bought in the Upgrades panel. For `sec` seconds (real time) a fish
 * shakes off the hook `slip` of the time instead of SLIP.chance (20%). Price: `share` of the coins in
 * hand, at least `min` for the furthest pond unlocked.
 */
export const FIRM_HOOK = { sec: 300, slip: 0.1, share: 0.3, min: { cozy: 100, misty: 500, frozen: 2000 } as Record<string, number> };
export const TODAY_FISH = { chance: 0.1, chanceLegendary: 0.06, priceMult: 5, bonus: 100, shiny: 0.25 };
/** Offline income cap (seconds). */
export const OFFLINE_CAP = 8 * 3600;

export const AD = {
  mysteryEggEverySec: 0,
  goldenBaitEverySec: 0,
  goldenBaitSec: 5 * 60,
};
