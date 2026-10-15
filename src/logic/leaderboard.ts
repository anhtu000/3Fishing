// Challenge leaderboards. Today only the player's own best time is kept (in the save). The
// interface is here so a server-backed board can be plugged in later without touching the game:
// submit a time when a challenge is cleared, read the top entries for the result screen.
import type { SaveData } from './model';

export interface BoardEntry {
  name: string;
  timeMs: number;
  /** The entry of the player on this device. */
  me?: boolean;
}

export interface Leaderboard {
  /** Send a cleared time (milliseconds). */
  submit(challengeId: string, timeMs: number): Promise<void>;
  /** Best entries, fastest first. */
  top(challengeId: string, count: number): Promise<BoardEntry[]>;
}

/** Local board: just the personal record from the save. */
export class LocalLeaderboard implements Leaderboard {
  constructor(private save: () => SaveData) {}

  async submit(): Promise<void> {
    // The record is already stored by PondGame.finishChallenge.
  }

  async top(challengeId: string): Promise<BoardEntry[]> {
    const t = this.save().challenge.best[challengeId];
    return t === undefined ? [] : [{ name: 'You', timeMs: t, me: true }];
  }
}

/** mm:ss.s for times on boards and result screens. */
export function formatTime(ms: number) {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`;
}
