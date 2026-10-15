// Saved game state. Plain data only, so it survives JSON and can be used by tests and the balance sim.
import type { DailyState } from '../../core/time';
import { START_TEAM_SLOTS, type UpgradeId } from '../content/data';

export interface EggSlot {
  tier: number;
  pond: string;
  /** Seconds left. 0 = ready to hatch. */
  left: number;
  total: number;
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
    stats: { casts: 0, catches: 0, fish: 0, perfect: 0, eggs: 0, hatched: 0, chests: 0, junk: 0, coinsEarned: 0, playSec: 0, snaps: 0 },
    tutorial: [],
    daily: { lastClaim: null, streak: 0 },
    quests: { day: '', list: [] },
    luckyDay: '',
    ads: { mysteryAt: 0, goldenAt: 0, goldenUntil: 0 },
    autoFish: false,
    bounty: null,
    bountyIn: 8,
    rng: 0,
  };
}
