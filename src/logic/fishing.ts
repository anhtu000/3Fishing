// One cast from start to end, as a pure state machine: hold to charge, release to cast,
// wait through fake nibbles, tap on the real bite, then hold/release to reel.
// The scene feeds it press/release and delta time, and draws whatever state it is in.
// The balance sim and the auto-fish mode drive the same machine.
import type { Rng } from '../../core/rng';
import type { BossForm } from '../content/data';
import { fightOf, type CastZone, type FishingStats } from './rules';

export type Phase = 'ready' | 'charging' | 'flying' | 'waiting' | 'bite' | 'reeling' | 'done';
export type Outcome = 'caught' | 'early' | 'missed' | 'snap' | 'escape';

export interface Target {
  /** 0..4. Sets how hard it fights. */
  rarity: number;
  /** Junk, eggs and chests do not fight. */
  fights: boolean;
  boss?: boolean;
  /** The WANTED fish: fights harder than its kind (WANTED_FIGHT). */
  wanted?: boolean;
}

/**
 * WANTED fish fight: on top of its kind's fight it pulls and surges harder, has a smaller green zone
 * and takes longer to reel in (a Common fights at least like an Uncommon). It can still slip off.
 * Not more: one rarity tier up made a Rare WANTED fish unwinnable with early gear (tools/wantedtest.ts).
 */
export const WANTED_FIGHT = { pull: 1.25, green: 0.8, surge: 1.4, reel: 0.8 };

export interface FishingEvents {
  cast?: (zone: CastZone, power: number) => void;
  land?: () => void;
  nibble?: (n: number) => void;
  bite?: () => void;
  hook?: (perfect: boolean) => void;
  surge?: (strength: number) => void;
  /** The fish winds up for a pull: the moment to let go. */
  surgeWarn?: () => void;
  /** Boss: a press at the wrong moment (during the warning) heals it. */
  bossHeal?: (amount: number) => void;
  /** A normal fish shook off the hook. */
  slip?: () => void;
  phase?: (bossPhase: number) => void;
  /** Onboarding: a tap on a fake nibble only shows a hint, the fish stays. */
  softEarly?: () => void;
  /** The bite window closed: the fish bites once more (second chance). */
  again?: () => void;
  end?: (outcome: Outcome) => void;
}

/** Charge bar: one full up-and-down sweep, in seconds. */
export const CHARGE_PERIOD = 1.5;
export const FLY_SEC = 0.55;
export const GREEN_CENTER = 0.5;
export const RED_AT = 0.86;
/**
 * Boss tuning. Level 0..2 = the pond's boss (Cozy, Misty, Frozen). Gear helps, but less than on
 * normal fish (square root), so later bosses stay a real fight. Target (tools/bosstest.ts):
 * 25-40 s, first-try win about 80-90% (bosstest: cozy 81/87/79%, misty 90/90/84%, frozen 91/93/83%
 * for novice/average/skilled). The line wears in the red; letting go on the warning saves it.
 */
/** Normal fish: share of fights where the fish shakes off the hook while reeling (not during onboarding). */
export const SLIP = { chance: 0.2, from: 0.35, spread: 0.45 };

export const BOSS = { rematchHp: 1.3, hpPerStar: 0, misHeal: 0.25, misHealFirst: 0.1, misGrace: 0.25, warn: 0.5, reel: 0.2, decay: 0.02, pull: 0.48, pullPerPhase: 0.1, pullPerLevel: 0.05, surge: 1.8, surgePerLevel: 0.05, hold: 1.0, holdPerLine: 0.04, wear: 0.28, pullPerStar: 0.008, surgePerStar: 0.03, wearPerStar: 0.006 };

/**
 * Rematch forms (see bossForm in content/data.ts), as changes to the fight. Tuned with
 * tools/formtune.ts so each form wins about as often as the classic fight at the same star
 * (average over stars 1, 3, 5, 7, 10, three player types, three bosses, with the rematch health
 * x1.3 of v1.14: classic 44%, frenzy 49%, ghost 44%, giant 51% with fights about twice as long,
 * golden 30%; classic fights 22-36 s).
 * gap/surge/pull scale the pulls, reel/decay the progress, wear/hold the line, green the zone width,
 * drift moves the green zone up and down (amplitude, tension units).
 */
export const FORM_FIGHT: Record<BossForm, { gap: number; surge: number; pull: number; reel: number; decay: number; wear: number; hold: number; green: number; drift: number; heal: number }> = {
  classic: { gap: 1, surge: 1, pull: 1, reel: 1, decay: 1, wear: 1, hold: 0, green: 1, drift: 0, heal: 1 },
  // Many small pulls, closer together: a rhythm fight. More warnings, so each fumble heals less.
  frenzy: { gap: 0.7, surge: 0.76, pull: 1, reel: 1.1, decay: 1, wear: 1, hold: 0, green: 1, drift: 0, heal: 0.4 },
  // The sweet spot sways up and down: watch the bar, not just the fish.
  ghost: { gap: 1, surge: 1, pull: 1.02, reel: 1, decay: 1, wear: 1, hold: 0, green: 0.9, drift: 0.15, heal: 1 },
  // A long tug of war: slower progress, the line lasts longer.
  giant: { gap: 1, surge: 1, pull: 1.02, reel: 0.78, decay: 1, wear: 1.2, hold: 0.15, green: 1, drift: 0, heal: 1 },
  // A bit harder all round, paid with 50% more coins (BOSS_FORM_COINS).
  golden: { gap: 1, surge: 1.05, pull: 1.03, reel: 1, decay: 1, wear: 1, hold: 0, green: 0.95, drift: 0, heal: 1 },
};

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
  /** Onboarding grace (first catches): wider bite window, no penalty for early taps. */
  forgiving = false;
  private secondChance = false;

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
  bossLevel = 0;
  /** Progress at which this fish shakes free (-1: it will not). */
  private slipAt = -1;
  private healedThisWarn = false;
  /** Rematch star (0 = the first fight). Each star pulls and surges a bit harder. */
  bossStar = 0;
  /** Rematch form: the twist on this fight. */
  bossForm: BossForm = 'classic';
  /** Middle of the green zone (moves for the Ghost form). */
  greenCenter = GREEN_CENTER;
  /** Line upgrade level (set by the game; bosses use it for the line's wear limit). */
  lineLevel = 0;
  /** The fish is about to pull (shown as a thrash): let go now. */
  warning = false;

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
        // Struck on a fake nibble (or on nothing): the fish swims off, except during onboarding.
        if (this.approach > 0.5) {
          if (this.forgiving) this.events.softEarly?.();
          else this.finish('early');
        }
        break;
      case 'reeling': {
        // Boss: pressing when you should let go (during the warning) gives it back some health.
        // At most once per warning (10% of its health back on the first boss, 25% on the others). The first moment of the warning is
        // free: a tap already on its way when the boss starts thrashing is reaction time, not a fumble.
        if (this.target.boss && !this.healedThisWarn && this.warning && this.surgeIn <= BOSS.warn - BOSS.misGrace) {
          this.healedThisWarn = true;
          // The very first boss (Cozy Pond, not a rematch) is gentler: it is met in the first minutes.
          const heal = (this.bossLevel === 0 && this.bossStar === 0 ? BOSS.misHealFirst : BOSS.misHeal) * FORM_FIGHT[this.bossForm].heal;
          this.progress -= heal;
          this.events.bossHeal?.(heal);
          if (this.progress <= 0) this.finish('escape');
        }
        break;
      }
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

  /** Pause pressed while charging a cast: drop the charge instead of casting. */
  cancelCharge() {
    if (this.phase !== 'charging') return;
    this.holding = false;
    this.power = 0;
    this.set('ready');
  }

  /** Back to ready after the scene has shown the result. */
  reset() {
    this.set('ready');
    this.outcome = null;
    this.holding = false;
    this.approach = 0;
    this.progress = 0;
    this.tension = 0.3;
    // A finished boss fight must not leave the HUD in boss mode.
    if (this.target.boss) this.target = { rarity: 0, fights: true };
    this.warning = false;
  }

  /** Boss fight: skips the cast and bite, straight to a long reel. */
  startBoss(level = 0, star = 0, form: BossForm = 'classic') {
    this.bossLevel = level;
    this.bossStar = star;
    this.bossForm = form;
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
        if (this.windowLeft <= 0) {
          // One second chance per cast: a slow tap is the most common reason new players lose a fish.
          if (!this.secondChance && !this.auto) {
            this.secondChance = true;
            this.set('waiting');
            this.approachTotal = this.waitLeft = 0.75;
            this.approach = 1;
            this.nibblesLeft = 0;
            this.events.again?.();
          } else this.finish('missed');
        }
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
    this.secondChance = false;
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
    this.windowTotal = this.windowLeft = this.assist ? 1.4 : s.biteWindow + (this.forgiving ? 0.35 : 0);
    this.set('bite');
    this.events.bite?.();
  }

  private startReel() {
    const f = fightOf(this.target.rarity);
    this.green = this.target.boss ? 0.3 * FORM_FIGHT[this.bossForm].green : this.target.fights ? f.green * (this.target.wanted ? WANTED_FIGHT.green : 1) : 0.6;
    this.greenCenter = GREEN_CENTER;
    this.tension = this.perfect ? 0.38 : 0.45;
    this.progress = this.perfect ? 0.38 : 0.25;
    this.redTime = 0;
    this.surgeIn = 0.5 + this.rng.next() * 0.6;
    this.surgeLeft = 0;
    this.warning = false;
    this.bossPhase = 0;
    const t = this.target;
    this.slipAt = !t.boss && t.fights && !this.assist && !this.forgiving && this.rng.chance(SLIP.chance) ? SLIP.from + this.rng.next() * SLIP.spread : -1;
    this.set('reeling');
  }

  private updateReel(dt: number) {
    const target = this.target;
    const f = fightOf(target.rarity);
    const s = this.stats();
    const boss = !!target.boss;
    const form = FORM_FIGHT[boss ? this.bossForm : 'classic'];
    const pull = boss ? (BOSS.pull + this.bossPhase * BOSS.pullPerPhase + this.bossLevel * BOSS.pullPerLevel + this.bossStar * BOSS.pullPerStar) * form.pull : target.fights ? f.pull * (target.wanted ? WANTED_FIGHT.pull : 1) : 0.06;
    const gentle = this.assist ? 0.5 : 1;
    // Ghost form: the green zone sways slowly (about one swing every 4.5 s).
    if (form.drift > 0) this.greenCenter = GREEN_CENTER + form.drift * Math.sin(this.t * 1.4);

    // Fish surges: the fish thrashes (warning), then pulls hard. Holding the line during the pull
    // spikes the tension; letting go in time takes most of the pull. Bosses surge harder later on.
    if (target.fights && !this.assist) {
      this.surgeIn -= dt;
      const warnAt = boss ? BOSS.warn : 0.4;
      if (!this.warning && this.surgeIn <= warnAt && this.surgeIn > 0) {
        this.warning = true;
        this.events.surgeWarn?.();
      }
      if (this.surgeIn <= 0) {
        this.warning = false;
        this.healedThisWarn = false;
        this.surgeLeft = 0.32;
        this.surgePower = pull * (0.9 + this.rng.next() * 0.6) * (boss ? (BOSS.surge + this.bossLevel * BOSS.surgePerLevel + this.bossStar * BOSS.surgePerStar) * form.surge : 1.25 * (target.wanted ? WANTED_FIGHT.surge : 1));
        const gap = boss ? [1.3, 1.0, 0.75][this.bossPhase] : 1.5 - pull;
        // Never shorter than the warning plus a beat, so every pull can still be read.
        this.surgeIn = boss ? Math.max(BOSS.warn + 0.15, (gap + this.rng.next() * 0.9) * form.gap) : gap + this.rng.next() * 0.9;
        this.events.surge?.(this.surgePower);
      }
    }
    let surge = 0;
    if (this.surgeLeft > 0) {
      this.surgeLeft -= dt;
      surge = (this.surgePower / 0.32) * (this.holding ? 1 : 0.3);
    }

    if (this.holding) this.tension += (0.32 + pull * 0.55) * gentle * dt;
    else this.tension -= 0.95 * dt;
    this.tension += surge * dt;
    this.tension = Math.max(0, Math.min(1, this.tension));

    const lo = this.greenCenter - this.green / 2;
    const hi = this.greenCenter + this.green / 2;
    const red = this.tension >= RED_AT;
    // Rematches have 30% more health: reeling moves the bar less, and so does letting go. Each star
    // still pulls and surges harder (a bit less steeply than before, so ★10 stays winnable).
    const hp = boss && this.bossStar > 0 ? BOSS.rematchHp + BOSS.hpPerStar * this.bossStar : 1;
    const reel = boss ? (BOSS.reel * Math.sqrt(s.reelMult) * form.reel) / hp : (target.fights ? f.reel : 0.9) * s.reelMult * (this.auto ? 0.5 : 1) * (this.assist ? 1.6 : 1) * (target.wanted ? WANTED_FIGHT.reel : 1);
    if (this.holding) {
      const zone = this.tension >= lo && this.tension <= hi ? 1 : red ? 0.3 : 0.6;
      this.progress += reel * zone * dt;
    } else {
      this.progress -= (boss ? (BOSS.decay * form.decay) / hp : pull * 0.12) * dt;
    }

    if (red) {
      this.redTime += dt;
      // Bosses wear the line down: time in the red adds up over the fight and fades slowly,
      // so each ignored pull counts. Line upgrades help a little.
      const hold = boss ? BOSS.hold + BOSS.holdPerLine * this.lineLevel + form.hold : s.lineHold * (this.assist ? 2 : 1);
      if (this.redTime >= hold) return this.finish('snap');
    } else {
      this.redTime = Math.max(0, this.redTime - dt * (boss ? Math.max(0.12, BOSS.wear - this.bossStar * BOSS.wearPerStar) * form.wear : 2));
    }
    if (boss) {
      const ph = this.progress > 0.66 ? 2 : this.progress > 0.33 ? 1 : 0;
      if (ph > this.bossPhase) {
        this.bossPhase = ph;
        this.events.phase?.(ph);
      }
    }
    if (this.slipAt > 0 && this.progress >= this.slipAt) {
      this.slipAt = -1;
      this.events.slip?.();
      return this.finish('escape');
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
    return [this.greenCenter - this.green / 2, this.greenCenter + this.green / 2];
  }
}

/** Auto-fish pace: seconds of rest between casts and the share of bites it misses. */
export const AUTO = { restMin: 2.5, restSpread: 2, miss: 0.3 };

/**
 * Simple player: casts at a chosen power, strikes on the bite, keeps tension in the green.
 * Used by auto-fish and by the balance sim. `skill` 0..1 adds human-like slips.
 */
export class FishingBot {
  private wantPower = 0.6;
  private reactIn = 0;
  /** Auto-fish: rest between casts, and this cast will miss the bite on purpose. */
  private restLeft = 0;
  private missThis = false;

  constructor(
    private f: Fishing,
    private rng: Rng,
    public skill = 1,
  ) {}

  update(dt: number) {
    const f = this.f;
    switch (f.phase) {
      case 'ready':
        // Auto-fish is a helper, not a replacement: it rests between casts and misses 30% of bites.
        if (f.auto) {
          if (this.restLeft <= 0) this.restLeft = AUTO.restMin + this.rng.next() * AUTO.restSpread;
          this.restLeft -= dt;
          if (this.restLeft > 0) break;
          this.restLeft = 0;
          this.missThis = this.rng.chance(AUTO.miss);
        } else this.missThis = false;
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
        if (this.missThis) break;
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
        if (f.holding && f.warning) f.release();
        else if (f.holding && f.tension > aimHi) f.release();
        else if (!f.holding && !f.warning && f.tension < lo + 0.06) f.press();
        else if (!f.holding && f.tension < hi - 0.02 && this.rng.next() < 0.1) f.press();
        break;
      }
    }
  }
}
