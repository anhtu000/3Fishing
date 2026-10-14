// One cast from start to end, as a pure state machine: hold to charge, release to cast,
// wait through fake nibbles, tap on the real bite, then hold/release to reel.
// The scene feeds it press/release and delta time, and draws whatever state it is in.
// The balance sim and the auto-fish mode drive the same machine.
import type { Rng } from '../../core/rng';
import { fightOf, type CastZone, type FishingStats } from './rules';

export type Phase = 'ready' | 'charging' | 'flying' | 'waiting' | 'bite' | 'reeling' | 'done';
export type Outcome = 'caught' | 'early' | 'missed' | 'snap' | 'escape';

export interface Target {
  /** 0..4. Sets how hard it fights. */
  rarity: number;
  /** Junk, eggs and chests do not fight. */
  fights: boolean;
  boss?: boolean;
}

export interface FishingEvents {
  cast?: (zone: CastZone, power: number) => void;
  land?: () => void;
  nibble?: (n: number) => void;
  bite?: () => void;
  hook?: (perfect: boolean) => void;
  surge?: (strength: number) => void;
  phase?: (bossPhase: number) => void;
  end?: (outcome: Outcome) => void;
}

/** Charge bar: one full up-and-down sweep, in seconds. */
export const CHARGE_PERIOD = 1.5;
export const FLY_SEC = 0.55;
export const GREEN_CENTER = 0.5;
export const RED_AT = 0.86;

export class Fishing {
  phase: Phase = 'ready';
  outcome: Outcome | null = null;
  /** 0..1 while charging. */
  power = 0;
  zone: CastZone = 0;
  /** Seconds in the current phase. */
  t = 0;
  target: Target = { rarity: 0, fights: true };
  /** Tutorial: quick bite, wide window, gentle fish. */
  assist = false;
  /** Auto mode reels at half speed. */
  auto = false;

  // waiting
  private waitLeft = 0;
  private nibblesLeft = 0;
  nibbleCount = 0;
  /** 0..1, how close the fish is to the hook (for drawing it swim in). */
  approach = 0;
  private approachTotal = 1;
  // bite
  windowLeft = 0;
  windowTotal = 0;
  perfect = false;
  // reeling
  tension = 0.3;
  progress = 0;
  holding = false;
  redTime = 0;
  green = 0.5;
  private surgeIn = 1;
  private surgeLeft = 0;
  private surgePower = 0;
  bossPhase = 0;

  constructor(
    private rng: Rng,
    private stats: () => FishingStats,
    private events: FishingEvents = {},
    /** Called when the hook lands: decide what is down there. */
    private pickTarget: () => Target = () => ({ rarity: 0, fights: true }),
  ) {}

  get busy() {
    return this.phase !== 'ready';
  }

  /** Finger or key down. */
  press() {
    this.holding = true;
    switch (this.phase) {
      case 'ready':
        this.set('charging');
        this.power = 0;
        break;
      case 'waiting':
        // Struck on a fake nibble (or on nothing): the fish swims off.
        if (this.approach > 0.5) this.finish('early');
        break;
      case 'bite': {
        this.perfect = this.windowLeft > this.windowTotal * 0.5;
        this.startReel();
        this.events.hook?.(this.perfect);
        break;
      }
    }
  }

  /** Finger or key up. */
  release() {
    this.holding = false;
    if (this.phase === 'charging') {
      const p = this.power;
      this.zone = p < 0.4 ? 0 : p < 0.8 ? 1 : 2;
      this.set('flying');
      this.events.cast?.(this.zone, p);
    }
  }

  /** Back to ready after the scene has shown the result. */
  reset() {
    this.set('ready');
    this.outcome = null;
    this.holding = false;
    this.approach = 0;
    this.progress = 0;
    this.tension = 0.3;
  }

  /** Boss fight: skips the cast and bite, straight to a long reel. */
  startBoss() {
    this.target = { rarity: 4, fights: true, boss: true };
    this.perfect = false;
    this.startReel();
    this.progress = 0.12;
  }

  /** Continue a lost boss fight (rewarded ad): keeps the progress. */
  continueBoss(progress: number) {
    this.target = { rarity: 4, fights: true, boss: true };
    this.startReel();
    this.progress = Math.max(0.12, progress);
    this.tension = 0.35;
  }

  update(dt: number) {
    this.t += dt;
    switch (this.phase) {
      case 'charging': {
        const x = (this.t / CHARGE_PERIOD) % 1;
        this.power = x < 0.5 ? x * 2 : 2 - x * 2;
        break;
      }
      case 'flying':
        if (this.t >= FLY_SEC) this.land();
        break;
      case 'waiting':
        this.updateWaiting(dt);
        break;
      case 'bite':
        this.windowLeft -= dt;
        if (this.windowLeft <= 0) this.finish('missed');
        break;
      case 'reeling':
        this.updateReel(dt);
        break;
    }
  }

  private set(phase: Phase) {
    this.phase = phase;
    this.t = 0;
  }

  private land() {
    this.target = this.pickTarget();
    this.set('waiting');
    this.events.land?.();
    const r = this.rng;
    if (this.assist) {
      this.approachTotal = this.waitLeft = 1.2;
      this.nibblesLeft = 0;
    } else {
      this.approachTotal = this.waitLeft = 0.9 + r.next() * 1.4;
      this.nibblesLeft = this.auto ? 0 : r.int(0, 2) + (r.chance(0.3) ? 1 : 0);
    }
    this.nibbleCount = 0;
    this.approach = 0;
  }

  private updateWaiting(dt: number) {
    this.waitLeft -= dt;
    this.approach = Math.min(1, 1 - this.waitLeft / this.approachTotal);
    if (this.waitLeft > 0) return;
    if (this.nibblesLeft > 0) {
      this.nibblesLeft -= 1;
      this.nibbleCount += 1;
      this.events.nibble?.(this.nibbleCount);
      this.waitLeft = 0.55 + this.rng.next() * 0.5;
      this.approachTotal = this.waitLeft;
      return;
    }
    const s = this.stats();
    this.windowTotal = this.windowLeft = this.assist ? 1.4 : s.biteWindow;
    this.set('bite');
    this.events.bite?.();
  }

  private startReel() {
    const f = fightOf(this.target.rarity);
    this.green = this.target.boss ? 0.3 : this.target.fights ? f.green : 0.6;
    this.tension = this.perfect ? 0.38 : 0.45;
    this.progress = this.perfect ? 0.38 : 0.25;
    this.redTime = 0;
    this.surgeIn = 0.5 + this.rng.next() * 0.6;
    this.surgeLeft = 0;
    this.bossPhase = 0;
    this.set('reeling');
  }

  private updateReel(dt: number) {
    const target = this.target;
    const f = fightOf(target.rarity);
    const s = this.stats();
    const boss = !!target.boss;
    const pull = boss ? 0.5 + this.bossPhase * 0.1 : target.fights ? f.pull : 0.06;
    const gentle = this.assist ? 0.5 : 1;

    // Fish surges: short bursts that push tension up. Bosses surge harder in later phases.
    if (target.fights && !this.assist) {
      this.surgeIn -= dt;
      if (this.surgeIn <= 0) {
        this.surgeLeft = 0.32;
        this.surgePower = pull * (0.9 + this.rng.next() * 0.6) * (boss ? 1.5 : 1.25);
        const gap = boss ? [1.3, 1.0, 0.75][this.bossPhase] : 1.5 - pull;
        this.surgeIn = gap + this.rng.next() * 0.9;
        this.events.surge?.(this.surgePower);
      }
    }
    let surge = 0;
    if (this.surgeLeft > 0) {
      this.surgeLeft -= dt;
      surge = this.surgePower / 0.32;
    }

    if (this.holding) this.tension += (0.32 + pull * 0.55) * gentle * dt;
    else this.tension -= 0.95 * dt;
    this.tension += surge * dt;
    this.tension = Math.max(0, Math.min(1, this.tension));

    const lo = GREEN_CENTER - this.green / 2;
    const hi = GREEN_CENTER + this.green / 2;
    const red = this.tension >= RED_AT;
    const reel = (boss ? 0.075 : target.fights ? f.reel : 0.9) * s.reelMult * (this.auto ? 0.5 : 1) * (this.assist ? 1.6 : 1);
    if (this.holding) {
      const zone = this.tension >= lo && this.tension <= hi ? 1 : red ? 0.3 : 0.6;
      this.progress += reel * zone * dt;
    } else {
      this.progress -= (boss ? 0.015 : pull * 0.12) * dt;
    }

    if (red) {
      this.redTime += dt;
      if (this.redTime >= s.lineHold * (this.assist ? 2 : 1)) return this.finish('snap');
    } else {
      this.redTime = Math.max(0, this.redTime - dt * 2);
    }
    if (boss) {
      const ph = this.progress > 0.66 ? 2 : this.progress > 0.33 ? 1 : 0;
      if (ph > this.bossPhase) {
        this.bossPhase = ph;
        this.events.phase?.(ph);
      }
    }
    if (this.progress >= 1) return this.finish('caught');
    if (this.progress <= 0) return this.finish('escape');
  }

  private finish(outcome: Outcome) {
    this.outcome = outcome;
    this.holding = false;
    this.set('done');
    this.events.end?.(outcome);
  }

  /** Green zone bounds, for drawing. */
  get greenRange(): [number, number] {
    return [GREEN_CENTER - this.green / 2, GREEN_CENTER + this.green / 2];
  }
}

/**
 * Simple player: casts at a chosen power, strikes on the bite, keeps tension in the green.
 * Used by auto-fish and by the balance sim. `skill` 0..1 adds human-like slips.
 */
export class FishingBot {
  private wantPower = 0.6;
  private reactIn = 0;

  constructor(
    private f: Fishing,
    private rng: Rng,
    public skill = 1,
  ) {}

  update(dt: number) {
    const f = this.f;
    switch (f.phase) {
      case 'ready':
        this.wantPower = f.auto ? 0.2 : 0.35 + this.rng.next() * 0.6;
        f.press();
        break;
      case 'charging':
        if (f.power >= this.wantPower && f.t < 0.75) f.release();
        else if (f.t > 0.75 && f.power <= this.wantPower) f.release();
        break;
      case 'waiting':
        // A clumsy player sometimes strikes on a nibble.
        if (f.nibbleCount > 0 && f.approach > 0.9 && this.rng.next() < (1 - this.skill) * 0.02) f.press();
        break;
      case 'bite':
        if (this.reactIn <= 0) this.reactIn = 0.2 + (1 - this.skill) * this.rng.next() * 0.8;
        this.reactIn -= dt;
        if (this.reactIn <= 0) {
          f.press();
          this.reactIn = 0;
        }
        break;
      case 'reeling': {
        const [lo, hi] = f.greenRange;
        const aimHi = hi - 0.04 - (1 - this.skill) * 0.08;
        if (f.holding && f.tension > aimHi) f.release();
        else if (!f.holding && f.tension < lo + 0.06) f.press();
        else if (!f.holding && f.tension < hi - 0.02 && this.rng.next() < 0.1) f.press();
        break;
      }
    }
  }
}
