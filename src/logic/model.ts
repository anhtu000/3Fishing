// Saved game state. Plain data only, so it survives JSON and can be used by tests and the balance sim.
import type { DailyState } from '../../core/time';
import { START_TEAM_SLOTS, type UpgradeId } from '../content/data';

export interface EggSlot {
  tier: number;
  pond: string;
  /** Seconds left. 0 = ready to hatch. */
  left: number;
  total: number;
  /** Chance the pet comes out shiny (default 1%). */
  shiny?: number;
}

/** An egg waiting in the basket: the player picks which one goes into a free incubator slot. */
export interface BasketEgg {
  tier: number;
  pond: string;
  shiny?: number;
}

export interface PetState {
  level: number;
  /** Duplicates fed since the last level. */
  xp: number;
  shiny?: boolean;
}

export interface QuestState {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface SaveData {
  coins: number;
  gems: number;
  pond: string;
  unlocked: string[];
  bosses: string[];
  upgrades: Record<UpgradeId, number>;
  /** Species caught: count and best size in cm. */
  dex: Record<string, { n: number; best: number }>;
  pets: Record<string, PetState>;
  team: string[];
  teamSlots: number;
  incubatorSlots: number;
  eggs: (EggSlot | null)[];
  /** Eggs caught while the incubator was full (up to BASKET_MAX). */
  basket: BasketEgg[];
  stats: {
    casts: number;
    catches: number;
    fish: number;
    perfect: number;
    eggs: number;
    hatched: number;
    chests: number;
    junk: number;
    coinsEarned: number;
    playSec: number;
    snaps: number;
  };
  tutorial: string[];
  daily: DailyState;
  quests: { day: string; list: QuestState[] };
  luckyDay: string;
  ads: { mysteryAt: number; goldenAt: number; goldenUntil: number };
  autoFish: boolean;
  /** WANTED fish: catch it for triple coins. Null between bounties. */
  bounty: string | null;
  /** Catches until the next WANTED fish appears. */
  bountyIn: number;
  /**
   * Today's fish: one special species a day for the whole game. Picked once at the start of the day
   * from the ponds open then, so travelling or opening a new pond does not change it.
   */
  todayFish: { day: string; pond: string; fish: string; caught: boolean };
  /** Rematch: best star cleared per boss id. */
  bossStars: Record<string, number>;
  /** Rematch tickets used today (a win uses one). */
  tickets: { day: string; used: number };
  /** Wardrobe: what the cat wears and what is owned. */
  style: { hat: string; rod: string; bobber: string; owned: string[] };
  /** Seed state for gameplay rolls, so a reload cannot re-roll a result. */
  rng: number;
}

export function defaultSave(): SaveData {
  return {
    coins: 0,
    gems: 0,
    pond: 'cozy',
    unlocked: ['cozy'],
    bosses: [],
    upgrades: { rod: 0, line: 0, bait: 0, float: 0 },
    dex: {},
    pets: {},
    team: [],
    teamSlots: START_TEAM_SLOTS,
    incubatorSlots: 1,
    eggs: [null, null, null, null],
    basket: [],
    stats: { casts: 0, catches: 0, fish: 0, perfect: 0, eggs: 0, hatched: 0, chests: 0, junk: 0, coinsEarned: 0, playSec: 0, snaps: 0 },
    tutorial: [],
    daily: { lastClaim: null, streak: 0 },
    quests: { day: '', list: [] },
    luckyDay: '',
    ads: { mysteryAt: 0, goldenAt: 0, goldenUntil: 0 },
    autoFish: false,
    bounty: null,
    bountyIn: 8,
    todayFish: { day: '', pond: '', fish: '', caught: false },
    bossStars: {},
    tickets: { day: '', used: 0 },
    style: { hat: 'hat:rain', rod: 'rod:classic', bobber: 'bobber:classic', owned: ['hat:rain', 'rod:classic', 'bobber:classic'] },
    rng: 0,
  };
}
