// Game content: ponds, fish, pets, junk, upgrades, quests. Numbers come from the design doc
// (Pond Pals — Tài liệu thiết kế, "Kinh tế và công thức") and are tuned by tools/sim.ts.

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = 0 | 1 | 2 | 3 | 4;

/** Base chance of each rarity before luck. */
export const RARITY_WEIGHTS = [60, 25, 10, 4, 1];
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
}

export type PerkKind = 'luck' | 'merchant' | 'strong' | 'sharp' | 'angler' | 'nurture';

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
      { id: 'pebble_minnow', name: 'Pebble Minnow', rarity: 0, cm: 9 },
      { id: 'lily_carp', name: 'Lily Carp', rarity: 0, cm: 32 },
      { id: 'mud_guppy', name: 'Mud Guppy', rarity: 0, cm: 6 },
      { id: 'button_bream', name: 'Button Bream', rarity: 0, cm: 18 },
      { id: 'bubble_perch', name: 'Bubble Perch', rarity: 1, cm: 24 },
      { id: 'clover_trout', name: 'Clover Trout', rarity: 1, cm: 38 },
      { id: 'reed_pike', name: 'Reed Pike', rarity: 1, cm: 46 },
      { id: 'teacup_koi', name: 'Teacup Koi', rarity: 2, cm: 14 },
      { id: 'rosy_goby', name: 'Rosy Goby', rarity: 2, cm: 12 },
      { id: 'lantern_catfish', name: 'Lantern Catfish', rarity: 3, cm: 64 },
      { id: 'moon_gar', name: 'Moon Gar', rarity: 3, cm: 88 },
      { id: 'golden_duckfish', name: 'Golden Duckfish', rarity: 4, cm: 41 },
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
    priceMult: 3,
    unlockCost: 1500,
    fish: [
      { id: 'fog_shiner', name: 'Fog Shiner', rarity: 0, cm: 11 },
      { id: 'stone_loach', name: 'Stone Loach', rarity: 0, cm: 16 },
      { id: 'willow_dace', name: 'Willow Dace', rarity: 0, cm: 20 },
      { id: 'pebble_chub', name: 'Pebble Chub', rarity: 0, cm: 22 },
      { id: 'mist_salmon', name: 'Mist Salmon', rarity: 1, cm: 58 },
      { id: 'rainbow_grayling', name: 'Rainbow Grayling', rarity: 1, cm: 36 },
      { id: 'misty_minnow', name: 'Misty Minnow', rarity: 1, cm: 14 },
      { id: 'ghost_pike', name: 'Ghost Pike', rarity: 2, cm: 71 },
      { id: 'ember_trout', name: 'Ember Trout', rarity: 2, cm: 44 },
      { id: 'thunder_sturgeon', name: 'Thunder Sturgeon', rarity: 3, cm: 140 },
      { id: 'dusk_catfish', name: 'Dusk Catfish', rarity: 3, cm: 96 },
      { id: 'silver_spirit_trout', name: 'Silver Spirit Trout', rarity: 4, cm: 52 },
    ],
    pets: [
      { id: 'mossy_snail', name: 'Mossy Snail', rarity: 0, perk: 'strong' },
      { id: 'creek_beaver', name: 'Creek Beaver', rarity: 1, perk: 'angler' },
      { id: 'firefly_fox', name: 'Firefly Fox', rarity: 2, perk: 'luck' },
      { id: 'heron_chick', name: 'Heron Chick', rarity: 3, perk: 'sharp' },
      { id: 'mist_fawn', name: 'Mist Fawn', rarity: 4, perk: 'merchant' },
    ],
    junk: ['boot', 'wheel', 'can'],
    boss: { id: 'fog_pike', name: 'The Fog Pike', hp: 1 },
    bossAt: 7,
  },
  {
    id: 'frozen',
    name: 'Frozen Lake',
    priceMult: 9,
    unlockCost: 18000,
    fish: [
      { id: 'frost_minnow', name: 'Frost Minnow', rarity: 0, cm: 8 },
      { id: 'ice_perch', name: 'Ice Perch', rarity: 0, cm: 22 },
      { id: 'tundra_dace', name: 'Tundra Dace', rarity: 0, cm: 20 },
      { id: 'snow_smelt', name: 'Snow Smelt', rarity: 0, cm: 18 },
      { id: 'aurora_char', name: 'Aurora Char', rarity: 1, cm: 46 },
      { id: 'crystal_cisco', name: 'Crystal Cisco', rarity: 1, cm: 34 },
      { id: 'glacier_trout', name: 'Glacier Trout', rarity: 1, cm: 48 },
      { id: 'polar_burbot', name: 'Polar Burbot', rarity: 2, cm: 62 },
      { id: 'icicle_pike', name: 'Icicle Pike', rarity: 2, cm: 74 },
      { id: 'frostfin_muskie', name: 'Frostfin Muskie', rarity: 3, cm: 118 },
      { id: 'northern_lightfish', name: 'Northern Lightfish', rarity: 3, cm: 60 },
      { id: 'starlight_whitefish', name: 'Starlight Whitefish', rarity: 4, cm: 49 },
    ],
    pets: [
      { id: 'penguin_chick', name: 'Penguin Chick', rarity: 0, perk: 'strong' },
      { id: 'snowy_owlet', name: 'Snowy Owlet', rarity: 1, perk: 'sharp' },
      { id: 'seal_pup', name: 'Seal Pup', rarity: 2, perk: 'angler' },
      { id: 'polar_cub', name: 'Polar Cub', rarity: 3, perk: 'merchant' },
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
export const petById = new Map(ALL_PETS.map((p) => [p.id, p]));
export const pondById = new Map(PONDS.map((p) => [p.id, p]));
export function pondOfFish(id: string) {
  return PONDS.find((p) => p.fish.some((f) => f.id === id))!;
}

/** Perk value at rarity 0..4, level 1. Each extra level adds 20%. */
export const PERKS: Record<PerkKind, { name: string; values: number[]; unit: 'pct' | 'sec' | 'perMin' }> = {
  luck: { name: 'Lucky', values: [2, 4, 7, 10, 15], unit: 'pct' },
  merchant: { name: 'Merchant', values: [5, 10, 18, 28, 40], unit: 'pct' },
  strong: { name: 'Strong', values: [5, 10, 17, 25, 35], unit: 'pct' },
  sharp: { name: 'Sharp eye', values: [0.05, 0.1, 0.16, 0.22, 0.3], unit: 'sec' },
  // fish per minute caught for you, also while away
  angler: { name: 'Angler', values: [1, 1.6, 2.4, 3.5, 5], unit: 'perMin' },
  nurture: { name: 'Nurture', values: [5, 10, 18, 28, 40], unit: 'pct' },
};
export const PET_MAX_LEVEL = 20;
/**
 * Perk multiplier at the top level (level 1 = x1). Gains come early and slow down (square root), so
 * level 2-5 feel like before and level 20 ends about 15% above the old level-5 cap (x1.8 -> x2.07).
 */
export const PET_TOP_MULT = 2.07;

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
export const INCUBATOR_SLOT_COST = [0, 10000, 40000, 150000];
// Team slots 4 and 5: big late-game buys (slot 4 about 25k, slot 5 far more).
export const TEAM_SLOT_COST = [0, 0, 0, 25000, 150000];
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

/** Fish to catch in the pond to lure a boss back after a lost fight (by pond: Cozy, Misty, Frozen). */
export const BOSS_LURE = [5, 8, 10];

/** Boss rematch: stars 1-10 per boss; a win uses a ticket, 3 tickets a day. A loss is free. */
export const BOSS_STARS = { max: 10, ticketsPerDay: 3, coins: 200, coinsPerStar: 0.25, shiny: 0.03, shinyPerStar: 0.02, legendaryFrom: 8 };

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
}
export const COSMETICS: CosmeticDef[] = [
  { id: 'hat:rain', kind: 'hat', price: 0 },
  { id: 'hat:straw', kind: 'hat', price: 5000 },
  { id: 'hat:beanie', kind: 'hat', price: 12000 },
  { id: 'hat:flower', kind: 'hat', price: 25000 },
  { id: 'hat:pirate', kind: 'hat', price: 40000 },
  { id: 'hat:wizard', kind: 'hat', price: 90000 },
  { id: 'hat:tophat', kind: 'hat', price: 200000 },
  { id: 'hat:crown', kind: 'hat', price: 500000 },
  { id: 'hat:clover', kind: 'hat', price: 0, source: 'daily3' },
  { id: 'hat:captain', kind: 'hat', price: 0, source: 'stars15' },
  { id: 'rod:classic', kind: 'rod', price: 0, colors: [0xc98a4b, 0x8d5a2b] },
  { id: 'rod:ocean', kind: 'rod', price: 8000, colors: [0x5fb4ef, 0x2d6aa0] },
  { id: 'rod:cherry', kind: 'rod', price: 20000, colors: [0xff8fab, 0xc2557a] },
  { id: 'rod:bamboo', kind: 'rod', price: 50000, colors: [0xa8d86a, 0x5d8a2e] },
  { id: 'rod:gold', kind: 'rod', price: 300000, colors: [0xffd23f, 0xc99a1a] },
  { id: 'bobber:classic', kind: 'bobber', price: 0, colors: [0xff4d5e, 0xffffff] },
  { id: 'bobber:sky', kind: 'bobber', price: 6000, colors: [0x4fa8ff, 0xffffff] },
  { id: 'bobber:mint', kind: 'bobber', price: 30000, colors: [0x3fcf8e, 0xfff6d6] },
  { id: 'bobber:gold', kind: 'bobber', price: 150000, colors: [0xffc83d, 0xfff1b8] },
  // Baits: only the look on the hook (no effect on what bites).
  { id: 'bait:worm', kind: 'bait', price: 0 },
  { id: 'bait:shrimp', kind: 'bait', price: 4000 },
  { id: 'bait:fly', kind: 'bait', price: 15000 },
  { id: 'bait:cricket', kind: 'bait', price: 35000 },
  { id: 'bait:goldworm', kind: 'bait', price: 120000 },
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

/** The overnight nest: one extra egg slot for special eggs that hatch over hours, so there is a reason to come back. */
export const NEST_INDEX = 4;
export const NEST_SEC = 6 * 3600;
/** Today's fish: chance per cast that it swims up instead (Legendary: lower), reward and egg. */
export const TODAY_FISH = { chance: 0.1, chanceLegendary: 0.06, priceMult: 5, bonus: 100, shiny: 0.25 };
/** Offline income cap (seconds). */
export const OFFLINE_CAP = 8 * 3600;

export const AD = {
  mysteryEggEverySec: 0,
  goldenBaitEverySec: 0,
  goldenBaitSec: 5 * 60,
};
