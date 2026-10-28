// The pond. One scene holds the whole game: fishing, the HUD, menus and reward moments.
import Phaser from 'phaser';
import { BaseScene, app, secondsAway, type ViewportInfo } from '@core';
import { Rng } from '../../core/rng';
import { dayKey } from '../../core/time';
import { BOSS_LURE, BOSS_STARS, CHALLENGE, GAME_SPEED, GAME_SPEED_DESKTOP, GAME_SPEED_PHONE, NEST_INDEX, setGameSpeed, PERKS, PONDS, WANTED, bossForm, type BossForm, type PerkKind, baitKey, challengeById, cosmeticById, fishById, type ChallengeDef, petById, pondById } from '../content/data';
import { Fishing, FishingBot, type Outcome } from '../logic/fishing';
import { PondGame } from '../logic/game';
import type { SaveData } from '../logic/model';
import { anyUpgradeAffordable, hatchSecLeft, perkValue, pondGold, questsClaimable, readyEggIndex, rollSize as rollFishSize, type CatchRoll } from '../logic/rules';
import { LocalLeaderboard, formatTime, type Leaderboard } from '../logic/leaderboard';
import { devPreset } from '../dev';
import { bossName, duration, eggName, fishName, pondName, t } from '../i18n/t';
import { save } from '../save';
import { loadMusic, loadSounds, musicKey } from '../sounds';
import { Hud, drawHand } from '../ui/Hud';
import { CButton, COLORS, CPanel, INK, art, card, fitScale, fmt, txt } from '../ui/kit';
import { basketPanel, challengePanel, eggsPanel, dailyPanel, dexPanel, wardrobePanel, incubatorPanel, mapPanel, petsPanel, questsPanel, upgradesPanel, type PanelCtx } from '../ui/panels';
import { bigCatch, flyIcons, hatchReveal, isBigCatch, note, quickCatch, rays, say, sparkles } from '../ui/popups';
import { Pond } from '../world/Pond';
import { Rig } from '../world/Rig';
import { KeyNav } from '../ui/keynav';
import { artIsReady, artReady, loadBossForm, loadLaterTextures } from '../render/textures';

/** Colour of each rematch form: name on the banner and the boss health bar. */
const FORM_CSS: Record<BossForm, string> = { classic: '#ffe066', frenzy: '#ff7a5c', ghost: '#7fffe4', giant: '#b6d98a', golden: '#ffd23f' };
/** Under-water shape of the hooked boss: the form shows through as a colour cast. */
const FORM_SHADE: Record<BossForm, number> = { classic: 0x10243d, frenzy: 0x5c1410, ghost: 0x1f6e68, giant: 0x1c2a14, golden: 0x7a5600 };
const FORM_BAR: Record<BossForm, number> = { classic: 0xff4d6d, frenzy: 0xff6a3d, ghost: 0x4fd6c4, giant: 0x7fae4f, golden: 0xffc21c };

type Step = 'cast' | 'bite' | 'reel' | 'egg' | 'hatch' | 'upgrade' | 'boss';

export class PlayScene extends BaseScene {
  private s!: SaveData;
  private pg!: PondGame;
  private rng!: Rng;
  private pond!: Pond;
  private rig!: Rig;
  private hud!: Hud;
  private fishing!: Fishing;
  private bot!: FishingBot;
  private roll: CatchRoll | null = null;
  private lucky = false;
  /** Open panels and popups. Fishing input is ignored while above 0. */
  private modal = 0;
  /** True while the pause panel is open: the fishing state and the clocks stand still. */
  private frozen = false;
  private panel: CPanel | null = null;
  private bossTries = 0;
  private bossContinued = false;
  private coach!: Phaser.GameObjects.Container;
  private coachText!: Phaser.GameObjects.Text;
  private coachBg!: Phaser.GameObjects.Graphics;
  private coachHand!: Phaser.GameObjects.Graphics;
  private step: Step | null = null;
  private stepT = 0;
  private coinSfxAt = 0;
  private ticker = 0;
  private music: Phaser.Sound.BaseSound | null = null;
  private musicKeyPlaying = '';
  private seenPets = 0;
  private seenDex = 0;

  constructor() {
    // Gameplay events are sent by hand: gameplayStart on the first input, not on load (Poki rule).
    super('Play', { gameplay: false });
  }

  protected build() {
    // Whole-game motion speed (tweens, delayed calls); see GAME_SPEED in content/data.ts. Phones and
    // tablets run slower than computers. The web build takes ?speed=0.7 to try other values.
    const speedParam = __TARGET__ === 'web' ? Number(new URLSearchParams(location.search).get('speed')) : 0;
    setGameSpeed(speedParam > 0 && speedParam <= 2 ? speedParam : app.platform.isMobile() ? GAME_SPEED_PHONE : GAME_SPEED_DESKTOP);
    this.tweens.timeScale = GAME_SPEED;
    this.time.timeScale = GAME_SPEED;
    this.s = save.data;
    const s = this.s;
    this.rng = new Rng(s.rng || app.seed);
    this.pg = new PondGame(s, this.rng);
    this.pg.refreshDay();
    if (__TARGET__ === 'web') {
      (window as unknown as { __play: unknown }).__play = this;
      devPreset(this.s, location.hash);
      this.pg.refreshDay();
    }
    this.seenPets = Object.keys(s.pets).length;
    this.seenDex = Object.keys(s.dex).length;

    this.pond = new Pond(this, s.pond, (id) => !!s.dex[id]);
    this.pond.setPets(s.team);
    this.rig = new Rig(this, this.pond);
    this.hud = new Hud(this, s, {
      upgrades: () => {
        this.completeStep('upgrade');
        this.open(() => upgradesPanel(this, this.ctx));
      },
      pets: () => {
        this.seenPets = Object.keys(s.pets).length;
        this.open(() => petsPanel(this, this.ctx));
      },
      dex: () => {
        this.seenDex = Object.keys(s.dex).length;
        this.open(() => dexPanel(this, this.ctx));
      },
      map: () => this.open(() => mapPanel(this, this.ctx)),
      quests: () => this.open(() => questsPanel(this, this.ctx, () => this.openDaily())),
      golden: () => this.watchAd(() => {
        this.pg.goldenBaitOn();
        app.audio.play('reward');
        note(this, t('msg.goldenOn'));
      }),
      mystery: () => {
        if (!this.pg.s.eggs.some((e, i) => i < s.incubatorSlots && !e)) return note(this, t('msg.incubatorFull'));
        this.watchAd(() => {
          const r = this.pg.mysteryEgg();
          app.audio.play('reward');
          const e = this.hud.eggTarget();
          const img = art(this, this.vp.width / 2, this.vp.height / 2, `egg:${r.tier}`, 1).setDepth(1400);
          this.tweens.add({ targets: img, x: e.x, y: e.y, scale: img.scale * 0.4, duration: 700, ease: 'Cubic.In', onComplete: () => img.destroy() });
        });
      },
      auto: () => {
        s.autoFish = !s.autoFish;
        this.fishing.auto = s.autoFish;
        note(this, s.autoFish ? t('msg.autoOn') : t('msg.autoOff'));
      },
      boss: () => this.startBoss(),
      egg: (i) => this.tapEgg(i),
      eggs: () => this.tapEggHub(),
      basket: () => this.open(() => basketPanel(this, this.ctx)),
      challenges: () => this.open(() => challengePanel(this, this.ctx)),
      exitChallenge: () => this.abandonChallenge(),
      sound: () => this.openPause(),
    });
    this.hud.setSoundIcon(app.audio.muted);

    this.fishing = new Fishing(
      this.rng,
      () => this.pg.stats(),
      {
        cast: (zone, power) => this.onCast(zone, power),
        land: () => app.audio.play('plop'),
        nibble: () => {
          this.rig.nibble();
          app.audio.play('nibble', { pitchJitter: 120 });
        },
        bite: () => this.onBite(),
        softEarly: () => note(this, t('msg.softEarly'), 1600),
        again: () => {
          this.rig.nibble();
          app.audio.play('nibble', { pitchJitter: 120 });
          say(this, this.vp.width / 2, this.pond.L.water - 120, t('msg.again'), '#ffe066', 34);
        },
        hook: (perfect) => this.onHook(perfect),
        slip: () => (this.slipped = true),
        bossHeal: () => {
          // A press at the wrong moment: the boss gets health back.
          this.hud.drawBoss(this.bossLabel(), 1 - Math.max(0, this.fishing.progress), this.fishing.bossPhase);
          say(this, this.vp.width / 2, this.vp.height * 0.2, t('msg.bossHeal'), '#7dffb0', 34);
          app.audio.play('nope', { volume: 0.6 });
        },
        surgeWarn: () => {
          this.rig.warn();
          app.audio.play('nibble', { volume: 0.8, pitchJitter: 60 });
        },
        surge: () => {
          app.audio.play('splash', { volume: 0.35, pitchJitter: 200 });
          if (this.fishing.target.boss) this.cameras.main.shake(160, 0.004);
        },
        phase: (ph) => {
          this.cameras.main.shake(300, 0.008);
          app.audio.play('boss');
          say(this, this.vp.width / 2, this.vp.height * 0.3, t('msg.phase', { n: ph + 1 }), '#ff8a8a', 56);
        },
        end: (o) => this.onEnd(o),
      },
      () => {
        if (this.run) return this.pickChallengeFish();
        // The hook landed next to the WANTED fish: it bites, and fights harder than its kind.
        const w = this.pg.wanted;
        if (w && this.pond.wantedNear(this.rig.landX, WANTED.reach)) {
          this.pond.hideWanted(true);
          this.rollWanted = true;
          const roll: CatchRoll = { kind: 'fish', fish: w.fish, size: w.size };
          this.roll = roll;
          this.rig.setTarget(rollKey(roll), rollSize(roll));
          return { rarity: Math.max(1, w.fish.rarity), fights: true, wanted: true };
        }
        this.rollWanted = false;
        const r = this.pg.rollForCast(this.fishing.zone, this.lucky);
        this.roll = r.roll;
        this.rig.setTarget(rollKey(r.roll), rollSize(r.roll));
        return r.target;
      },
    );
    this.fishing.auto = s.autoFish && this.pg.autoUnlocked;
    this.bot = new FishingBot(this.fishing, this.rng, 1);

    this.buildCoach();
    this.wireInput();
    // Wardrobe look and the gold-pond cup.
    this.applyStyle();
    this.pond.setTrophy(this.pg.lateGame && pondGold(s, this.pond.pond));
    // A WANTED fish still out there from last time.
    const wanted = this.pg.wanted;
    if (wanted) this.pond.showWanted(wanted.fish, wanted.size);
    // The art left out of the loading screen (other ponds, pets, hats), then the sounds.
    loadLaterTextures(this);
    loadSounds(this, this.s.pond, () => this.startMusic());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.music?.destroy();
      this.music = null;
      this.musicKeyPlaying = '';
    });

    // Welcome back: angler pets fished while you were away; then the daily gift.
    const rebuilt = PlayScene.restarting;
    PlayScene.restarting = false;
    if (!save.isNewPlayer && !rebuilt) {
      const away = secondsAway(save.lastSavedAt, Date.now(), 7 * 24 * 3600);
      const coins = away > 60 ? this.pg.offline(away) : 0;
      this.time.delayedCall(400, () => {
        if (coins > 0) this.openOffline(away, coins);
        else this.maybeDaily();
      });
    }
  }

  private get ctx(): PanelCtx {
    return {
      game: this.pg,
      refresh: () => this.refresh(),
      travel: (id) => this.travel(id),
      startBoss: () => this.startBoss(),
      startRematch: () => this.startBoss(true),
      startChallenge: (id) => void this.startChallenge(id),
      wardrobe: () => this.open(() => wardrobePanel(this, this.ctx)),
      hatch: (i) => this.doHatch(i),
      coinTo: () => this.hud.coinTarget(),
      gemTo: () => this.hud.gemTarget(),
      eggTo: () => this.hud.eggTarget(),
      breakPoint: () => void this.breakPoint(),
    };
  }

  protected layout(vp: ViewportInfo) {
    this.pond.layout(vp.width, vp.height);
    this.rig.layout();
    this.hud.layout(vp.width, vp.height);
    this.placeCoach();
  }

  // ---------- input ----------

  private wireInput() {
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.modal > 0) return;
      this.press();
    });
    this.input.on('pointerup', () => this.fishing.release());
    this.input.on('gameout', () => {
      if (this.fishing.phase === 'charging') this.fishing.release();
    });
    const kb = this.input.keyboard;
    // ESC pauses (keyboard players, Poki rule). Registered before any panel, so a panel's own ESC
    // handler closes it first and this one sees the panel still open and does nothing.
    kb?.on('keydown-ESC', () => {
      if (this.modal > 0 || (this.panel && !this.panel.isClosed)) return;
      this.openPause();
    });
    kb?.on('keydown-SPACE', (e: KeyboardEvent) => {
      if (e.repeat || this.modal > 0) return;
      this.press();
    });
    kb?.on('keyup-SPACE', () => this.fishing.release());
  }

  private press() {
    this.startPlay();
    if (this.fishing.auto && this.fishing.phase === 'ready') {
      this.s.autoFish = false;
      this.fishing.auto = false;
      note(this, t('msg.autoOff'));
    }
    if (this.fishing.phase === 'ready') app.audio.play('charge', { volume: 0.5 });
    this.fishing.press();
  }

  // ---------- fishing events ----------

  private onCast(zone: number, power: number) {
    this.s.stats.casts += 1;
    // Onboarding grace for the first catches: wider bite window, early taps forgiven.
    this.fishing.forgiving = this.s.stats.catches < 15;
    this.lucky = this.pg.luckyCastReady && this.s.stats.catches >= 5;
    if (this.lucky) {
      this.s.luckyDay = dayKey();
      say(this, this.vp.width / 2, this.pond.L.water - 120, t('msg.luckyCast'), '#ffe066', 44);
    }
    this.rig.cast(power, zone);
    app.audio.play('cast', { pitchJitter: 100 });
    if (zone === 2) this.time.delayedCall(250, () => say(this, this.rig.landX, this.pond.L.water - 70, t('msg.superFar'), '#ffe066', 36));
    this.completeStep('cast');
  }

  private onBite() {
    this.rig.bite();
    this.pond.cheer();
    app.audio.play('bite');
    app.haptic(25);
    if (!this.s.tutorial.includes('bite')) this.showStep('bite');
  }

  private onHook(perfect: boolean) {
    this.rig.hooked();
    app.audio.play('hook');
    // A sharp-eyed pet gave you a longer bite window.
    this.petHelp('sharp');
    if (this.roll) this.hud.setProgressIcon(rollKey(this.roll));
    if (perfect) {
      say(this, this.rig.bobber.x, this.pond.L.water - 80, t('msg.perfect'), '#7dffb0', 44);
      app.audio.play('perfect');
    }
    this.completeStep('bite');
    if (!this.s.tutorial.includes('reel')) this.showStep('reel');
  }

  private onEnd(o: Outcome) {
    const f = this.fishing;
    if (f.target.boss) return this.onBossEnd(o);
    if (o === 'caught' && this.roll && this.run) return this.onChallengeCatch();
    if (o === 'caught' && this.roll) {
      const res = this.pg.applyCatch(this.roll, f.perfect, this.rollWanted);
      if (this.rollWanted) {
        this.rollWanted = false;
        if (res.bounty) {
          this.pond.clearWanted(true);
          app.measure('wanted', this.s.pond, 'catch');
        }
      }
      this.s.rng = this.rng.state;
      const from = this.rig.landed();
      this.completeStep('reel');
      if (!f.assist) f.assist = false;
      if (res.isNew) {
        this.pond.refreshKnown();
        app.moments.emit('collectionNew', { id: this.roll.kind === 'fish' ? this.roll.fish.id : '' });
      }
      // Pets that helped with this catch say so (luck for a rarer catch, price for a fish, eggs...).
      const roll = this.roll;
      // One label per catch, the most telling help first.
      this.time.delayedCall(450, () => {
        const order: PerkKind[] =
          roll.kind === 'fish'
            ? [...(roll.fish.rarity >= 1 ? (['luck'] as const) : []), ...(roll.fish.rarity >= 2 ? (['strong'] as const) : []), 'merchant']
            : roll.kind === 'egg'
              ? [...(roll.tier >= 1 ? (['luck'] as const) : []), 'nurture']
              : roll.kind === 'chest'
                ? ['luck']
                : [];
        for (const perk of order) if (this.petHelp(perk)) break;
      });
      if (this.roll.kind === 'fish' && this.roll.fish.rarity >= 3) app.moments.emit('rarePull', { tier: this.roll.fish.rarity, odds: this.roll.fish.rarity === 4 ? 0.01 : 0.04, label: this.roll.fish.name });
      const view = {
        result: res,
        from,
        coinTo: this.hud.coinTarget(),
        gemTo: this.hud.gemTarget(),
        eggTo: res.eggWhere === 'basket' ? this.hud.basketTarget() : this.hud.eggTarget(),
        onCoins: () => this.coinArrive(),
        onGems: () => {
          this.hud.bumpGems();
          app.audio.play('gem', { volume: 0.5, pitchJitter: 100 });
        },
      };
      for (const id of res.questsDone) this.time.delayedCall(1200, () => note(this, t('msg.questDone')), [id]);
      const after = () => {
        this.fishing.reset();
        this.afterCatch(res.roll);
        if (res.lured) {
          note(this, t('lure.done', { boss: bossName(this.pond.pond.boss.id) }), 3000);
          app.audio.play('boss');
        }
        // Medals (late game): a new medal, a gold pond.
        if (res.pondGold) {
          note(this, t('medal.pondGold', { pond: pondName(this.pond.pond.id) }), 3600);
          app.audio.play('win');
          this.pond.setTrophy(true);
        } else if (res.medal && res.roll.kind === 'fish') {
          note(this, t('medal.got', { medal: t(`medal.m${res.medal}`), fish: fishName(res.roll.fish.id) }));
          app.audio.play('reward');
        }
        // Today's fish: say where its egg went once the card is gone.
        if (res.today) {
          note(this, res.nestEgg ? t('msg.nestEgg', { t: duration(Math.ceil(hatchSecLeft(this.s, this.s.eggs[4] ?? { left: 0 }))) }) : t('msg.todayDone'));
          app.audio.play('reward');
        }
      };
      if (res.streak >= 2 && res.roll.kind === 'fish') this.time.delayedCall(500, () => say(this, this.vp.width / 2, this.pond.L.water - 170, t('msg.streak', { n: res.streak, p: res.streakBonus }), '#7dffb0', 34));
      if (isBigCatch(res)) {
        this.modal++;
        this.hud.setVisible(false);
        bigCatch(this, view).then(() => {
          this.modal--;
          this.hud.setVisible(true);
          after();
        });
      } else {
        quickCatch(this, view);
        this.time.delayedCall(350, after);
      }
      this.roll = null;
      return;
    }
    this.pg.breakStreak();
    // The WANTED fish got away: it is back in the water somewhere else.
    if (this.rollWanted) {
      this.rollWanted = false;
      this.pond.hideWanted(false);
    }
    const msg: Record<string, string> = { early: t('msg.early'), missed: t('msg.missed'), snap: t('msg.snap'), escape: t(this.slipped ? 'msg.slip' : 'msg.escape') };
    this.slipped = false;
    say(this, this.vp.width / 2, this.pond.L.water - 120, msg[o] ?? '', '#ffffff', 36);
    app.audio.play(o === 'snap' ? 'snap' : 'miss');
    if (o === 'snap') {
      this.s.stats.snaps += 1;
      this.cameras.main.shake(150, 0.004);
    }
    this.rig.lose();
    this.roll = null;
    this.time.delayedCall(700, () => {
      this.rig.clear();
      this.fishing.reset();
    });
  }

  /** When each pet last showed its help (scene time), so the pond does not fill with labels. */
  private helpShownAt = new Map<string, number>();

  /**
   * A team pet with this perk shows that it helped: it hops, sparkles and says its bonus
   * ("Lucky +2%"). Makes the hatch -> pet -> better fishing loop visible from the first pet on.
   */
  private petHelp(perk: PerkKind): boolean {
    const now = this.time.now;
    for (const id of this.s.team) {
      const def = petById.get(id);
      if (!def || def.perk !== perk) continue;
      if (now - (this.helpShownAt.get(id) ?? -1e9) < 1800) continue;
      const img = this.pond.petImage(id);
      if (!img || !img.visible) continue;
      this.helpShownAt.set(id, now);
      const level = this.s.pets[id]?.level ?? 1;
      const v = perkValue(perk, def.rarity, level);
      const unit = PERKS[perk].unit;
      const amount = unit === 'pct' ? `+${Math.round(v)}%` : unit === 'sec' ? `+${v.toFixed(2)}s` : '';
      say(this, img.x, img.y - 95, `${t(`perk.${perk}`)} ${amount}`.trim(), '#ffe066', 26);
      sparkles(this, img.x, img.y - 30, 6, 70);
      this.tweens.add({ targets: img, y: img.y - 22, duration: 150, yoyo: true, ease: 'Quad.Out' });
      return true;
    }
    return false;
  }

  private afterCatch(roll: CatchRoll) {
    if (roll.kind === 'egg' && !this.s.tutorial.includes('egg')) this.showStep('egg');
    this.refresh();
  }

  private coinArrive() {
    this.hud.bumpCoins();
    const now = this.time.now;
    if (now - this.coinSfxAt > 60) {
      this.coinSfxAt = now;
      app.audio.play('coin', { volume: 0.45, pitchJitter: 150 });
    }
  }

  // ---------- eggs ----------

  /** Portrait incubator button: hatch a ready egg straight away, else show every slot. */
  private tapEggHub() {
    const s = this.s;
    const order = [...Array(s.incubatorSlots).keys(), NEST_INDEX];
    const ready = order.find((i) => s.eggs[i] && s.eggs[i]!.left <= 0);
    if (ready !== undefined) return this.doHatch(ready);
    this.open(() => eggsPanel(this, this.ctx, (i) => this.tapEgg(i), () => this.open(() => basketPanel(this, this.ctx))));
  }

  private tapEgg(i: number) {
    const egg = this.s.eggs[i];
    // Empty slot: choose an egg from the basket.
    if (!egg) {
      if (this.s.basket.length && i < this.s.incubatorSlots) this.open(() => basketPanel(this, this.ctx, i));
      return;
    }
    if (egg.left <= 0) this.doHatch(i);
    else this.open(() => incubatorPanel(this, this.ctx, i, (done) => this.watchAd(done)));
  }

  private doHatch(i: number) {
    if (this.fishing.busy && this.fishing.phase !== 'waiting') return note(this, t('msg.landFirst'));
    const r = this.pg.hatch(i);
    if (!r) return;
    this.completeStep('hatch');
    this.modal++;
    this.hud.setVisible(false);
    const level = this.s.pets[r.petId]?.level ?? 1;
    hatchReveal(this, r.tier, r.petId, r.result, r.shiny, level).then(() => {
      this.modal--;
      this.hud.setVisible(true);
      this.pond.setPets(this.s.team);
      if (r.result.kind === 'new' && !this.s.team.includes(r.petId)) note(this, t('msg.teamFullSwap'));
      this.refresh();
      save.flush();
    });
  }

  // ---------- panels, ads, breaks ----------

  /** True after the player's first input: from then on menus count as interruptions of play. */
  private played = false;

  /** First input, or back from a menu: tell the portal the player is playing. */
  private startPlay() {
    this.played = true;
    if (this.modal === 0) app.gameplay.start();
  }

  /** Menu, pause or result screen: gameplay stops (Poki: on every interruption). */
  private stopPlay() {
    app.gameplay.stop();
  }

  /** Leaving an interruption: commercial break opportunity, then gameplay again. */
  private async resumePlay() {
    if (!this.played) return;
    await this.breakPoint();
    if (this.modal === 0) app.gameplay.start();
  }

  /**
   * Opens a panel. Menus wait until the line is back in; the pause panel (`freeze`) opens at any
   * moment and freezes the cast, the bite or the fight exactly where it is (Poki: ESC pauses anytime).
   */
  private open(make: () => CPanel, freeze = false) {
    if (this.panel && !this.panel.isClosed) return;
    // Menus can show any pond, pet or hat: in the first seconds, wait for the rest of the art.
    if (!freeze && !artIsReady()) {
      void artReady.then(() => this.open(make, freeze));
      return;
    }
    if (!freeze) {
      if (this.fishing.phase === 'charging') this.fishing.release();
      if (this.fishing.busy && this.fishing.phase !== 'done') {
        note(this, t('msg.finishFirst'));
        return;
      }
    }
    if (freeze) this.frozen = true;
    this.modal++;
    this.stopPlay();
    const p = make();
    this.panel = p;
    p.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.modal--;
      if (freeze) this.frozen = false;
      if (this.panel === p) this.panel = null;
      this.refresh();
      void this.resumePlay();
    });
  }

  private openPause() {
    // A held charge is dropped, not cast: the player pressed pause, not release.
    if (this.fishing.phase === 'charging') this.fishing.cancelCharge();
    this.open(() => {
      const p = new CPanel(this, { title: t('pause.title'), w: 600, h: 680, color: COLORS.teal });
      const resume = new CButton(this, 0, p.top + 120, { w: 340, h: 100, label: t('pause.resume'), fontSize: 40, color: COLORS.green, onClick: () => p.close() });
      p.content.add(resume);
      p.nav.primary = resume;
      const sound = new CButton(this, 0, p.top + 250, {
        w: 340,
        h: 84,
        label: app.audio.muted ? t('pause.soundOff') : t('pause.soundOn'),
        fontSize: 30,
        color: COLORS.blue,
        onClick: () => {
          app.audio.toggle();
          this.hud.setSoundIcon(app.audio.muted);
          sound.setLabel(app.audio.muted ? t('pause.soundOff') : t('pause.soundOn'));
        },
      });
      p.content.add(sound);
      // Language: detected from Poki or the browser, the player's choice wins (saved in settings).
      p.content.add(txt(this, 0, p.top + 350, t('pause.language'), 30, { color: '#7a6a8a', stroke: false }));
      app.i18n.languages.forEach((lang, i) => {
        const x = ((i % 3) - 1) * 180;
        const y = p.top + 430 + Math.floor(i / 3) * 86;
        const b = new CButton(this, x, y, {
          w: 168,
          h: 72,
          label: app.i18n.nameOf(lang),
          fontSize: 26,
          color: lang === app.i18n.lang ? COLORS.orange : COLORS.grey,
          onClick: () => {
            if (lang === app.i18n.lang) return;
            PlayScene.restarting = true;
            void app.setLanguage(lang);
          },
        });
        p.content.add(b);
      });
      return p;
    }, true);
  }

  /** Set before a language switch rebuilds the scene, so the welcome-back screen is not shown again. */
  static restarting = false;

  protected onLanguageChange() {
    save.flush(true);
    this.scene.restart();
  }

  /**
   * Rewarded ad. Only grants the reward when the ad finished. No message of our own when it fails:
   * Poki shows its own ad-blocker message and asks games not to add one.
   */
  private watchAd(onReward: () => void) {
    app.ads.rewarded().then((ok) => {
      if (ok) onReward();
      this.refresh();
    });
  }

  /** Natural pause on the way back to play: Poki may show a midgame ad here (never while reeling). */
  private async breakPoint() {
    if (this.fishing.busy && this.fishing.phase !== 'done') return;
    this.modal++;
    try {
      await app.ads.midgame();
    } finally {
      this.modal--;
    }
  }

  /** Wardrobe: hat, rod colours and bobber on the cat. */
  private applyStyle() {
    const st = this.s.style;
    this.rig.setStyle(st.hat, cosmeticById.get(st.rod)?.colors ?? [0xc98a4b, 0x8d5a2b], st.bobber, baitKey(st.bait ?? 'bait:worm'));
  }

  private refresh() {
    this.applyStyle();
    this.pond.setTrophy(this.pg.lateGame && pondGold(this.s, this.pond.pond));
    // Second pond open: the long-term goals appear (once).
    // ('late2': the note now also names Challenges, so earlier players see it once more.)
    if (this.pg.lateGame && !this.s.tutorial.includes('late2')) {
      this.s.tutorial.push('late', 'late2');
      this.time.delayedCall(1200, () => note(this, t('msg.lateUnlock'), 4200));
    }
    this.pond.setPets(this.s.team);
    this.pond.refreshKnown();
    this.pond.setBossTeaser(!this.s.bosses.includes(this.pond.pond.boss.id) && Object.keys(this.s.dex).filter((id) => this.pond.pond.fish.some((f) => f.id === id)).length >= 4);
    if (this.pg.bossReady && !this.s.tutorial.includes('boss') && !this.fishing.busy) this.showStep('boss');
    save.flush();
  }

  private openOffline(sec: number, coins: number) {
    const p = new CPanel(this, { title: t('core.welcomeBack'), w: 600, h: 700, color: COLORS.teal, closable: false });
    this.modal++;
    const anglers = this.s.team.filter((id) => petById.get(id)?.perk === 'angler');
    const pet = anglers[0] ?? this.s.team[0];
    if (pet) p.content.add(art(this, 0, p.top + 100, `pet:${pet}`, 0.8));
    p.content.add(txt(this, 0, p.top + 230, t('offline.fished', { t: duration(sec) }), 30, { color: '#7a6a8a', stroke: false, wrap: 520 }));
    const amount = txt(this, 30, p.top + 300, `+${coins}`, 64, { color: '#ffb81c' });
    const coin = art(this, amount.x - amount.width / 2 - 40, p.top + 300, 'item:coin', 0.6);
    p.content.add([amount, coin]);
    let given = false;
    const give = (mult: number) => {
      if (given) return;
      given = true;
      this.pg.earn(coins * mult);
      flyIcons(this, 'item:coin', { x: this.vp.width / 2, y: this.vp.height / 2 }, this.hud.coinTarget(), 10, () => this.coinArrive());
      p.close();
    };
    p.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.modal--;
      this.maybeDaily();
    });
    // Poki: the free option sits above the rewarded one and is at least as big.
    const ads = app.ads.rewardedAvailable && !app.clean;
    const collect = new CButton(this, 0, p.bottom - (ads ? 200 : 110), { w: 400, h: 96, label: t('core.collect'), fontSize: 38, color: COLORS.orange, onClick: () => give(1) });
    p.content.add(collect);
    p.nav.primary = collect;
    if (ads) p.content.add(new CButton(this, 0, p.bottom - 90, { w: 400, h: 96, label: t('offline.collectDouble'), fontSize: 38, color: COLORS.ad, ad: true, onClick: () => this.watchAd(() => give(2)) }));
  }

  private maybeDaily() {
    if (!this.s.tutorial.includes('done')) return;
    if (this.s.daily.lastClaim === dayKey()) return this.announceToday();
    this.openDaily();
  }

  private announcedDay = '';
  /** Once a session per day: name today's fish. */
  private announceToday() {
    const today = this.pg.today;
    if (!today || this.announcedDay === dayKey()) return;
    const f = today.fish;
    this.announcedDay = dayKey();
    // After the daily gift's own note has gone.
    this.time.delayedCall(2600, () => {
      note(this, t('msg.todayFish', { fish: t(`fish.${f.id}`), pond: pondName(today.pond.id) }));
      app.audio.play('pop');
    });
  }

  private openDaily() {
    this.open(() => {
      const p = dailyPanel(this, this.ctx, () => {
        const r = this.pg.claimDailyGift();
        if (!r) return;
        app.measure('daily', `day${this.s.daily.streak}`, 'claim');
        if (r.coins) flyIcons(this, 'item:coin', { x: this.vp.width / 2, y: this.vp.height / 2 }, this.hud.coinTarget(), 8, () => this.coinArrive());
        if (r.where === 'nest') this.time.delayedCall(500, () => note(this, t('msg.nestEgg', { t: duration(Math.ceil(hatchSecLeft(this.s, this.s.eggs[4] ?? { left: 0 }))) })));
        app.audio.play('reward');
        if (r.hat) {
          this.applyStyle();
          this.time.delayedCall(600, () => note(this, t('wardrobe.gotHat'), 3200));
        }
        // Day 7: the exclusive pet, shown like a hatch.
        if (r.pet) {
          const pet = r.pet;
          this.time.delayedCall(400, () => {
            this.modal++;
            this.hud.setVisible(false);
            hatchReveal(this, 4, pet.id, pet.result, false, this.s.pets[pet.id]?.level ?? 1).then(() => {
              this.modal--;
              this.hud.setVisible(true);
              this.refresh();
            });
          });
        }
      });
      p.once(Phaser.GameObjects.Events.DESTROY, () => this.announceToday());
      return p;
    });
  }

  // ---------- travel ----------

  private async travel(id: string) {
    // Leaving for another pond ends a challenge in progress.
    if (this.run) this.abandonChallenge();
    const p = pondById.get(id as 'cozy');
    if (!artIsReady()) await artReady;
    if (!p || !this.pg.travel(p)) return;
    // Next level: gameplayStop, commercial break, then gameplayStart in the new pond.
    this.stopPlay();
    await this.breakPoint();
    this.modal++;
    this.cameras.main.fadeOut(300, 255, 255, 255);
    this.time.delayedCall(320, () => {
      this.pond.clearWanted(true);
      this.pond.setPond(id);
      this.pond.setPets(this.s.team);
      this.layout(this.vp);
      this.refresh();
      void this.pondMusic();
      this.cameras.main.fadeIn(400, 255, 255, 255);
      app.audio.play('unlock');
      const title = txt(this, this.vp.width / 2, this.vp.height * 0.25, pondName(p.id), 72).setDepth(1500).setScale(0.5);
      this.tweens.add({ targets: title, scale: 1, duration: 400, ease: 'Back.Out' });
      this.tweens.add({ targets: title, alpha: 0, delay: 1600, duration: 400, onComplete: () => title.destroy() });
      if (this.pg.autoUnlocked && !this.s.tutorial.includes('auto')) {
        this.s.tutorial.push('auto');
        this.time.delayedCall(1800, () => note(this, t('msg.autoUnlocked'), 3200));
      }
      this.modal--;
      if (this.played) app.gameplay.start();
      save.flush();
    });
  }

  // ---------- challenge mode ----------

  /** The challenge being played: clock, fish caught, species caught. */
  private run: { def: ChallengeDef; timeMs: number; elapsedMs: number; fish: number; kinds: Set<string>; over: boolean } | null = null;
  private board: Leaderboard = new LocalLeaderboard(() => this.s);

  private async startChallenge(id: string) {
    const def = challengeById.get(id);
    if (!def || this.run || this.fishing.busy || !this.pg.challengeUnlocked(def)) return;
    if (this.s.pond !== def.pond) await this.travel(def.pond);
    this.fishing.reset();
    this.rig.clear();
    this.fishing.auto = false;
    this.run = { def, timeMs: (def.timeSec * 1000) / GAME_SPEED, elapsedMs: 0, fish: 0, kinds: new Set(), over: false };
    this.pond.setLiveFish(pondById.get(def.pond)!.fish, CHALLENGE.liveFish, def.species);
    app.audio.play('boss');
    const vp = this.vp;
    const banner = txt(this, vp.width / 2, vp.height * 0.26, `${t('challenge.level', { n: def.n })}\n${t('challenge.start', { fish: def.fish, species: def.species, t: formatTime(def.timeSec * 1000).replace(/\.0$/, '') })}`, 44, { color: '#ffe066', wrap: Math.min(640, vp.width - 60) }).setDepth(1500).setScale(0.4);
    this.tweens.add({ targets: banner, scale: 1, duration: 360, ease: 'Back.Out' });
    this.tweens.add({ targets: banner, alpha: 0, delay: 1900, duration: 400, onComplete: () => banner.destroy() });
    this.time.delayedCall(2300, () => note(this, t('challenge.hint'), 2600));
  }

  /** Challenge: the live fish closest to where the hook sinks is the one that bites. */
  private pickChallengeFish() {
    const nf = this.pond.nearestFish(this.rig.landX, this.rig.hookDepth);
    const fish = (nf && fishById.get(nf.id)) || this.pond.pond.fish[0];
    nf?.take();
    const roll: CatchRoll = { kind: 'fish', fish, size: rollFishSize(this.rng, this.pg.luck(this.fishing.zone, this.lucky)) };
    this.roll = roll;
    this.rig.setTarget(rollKey(roll), rollSize(roll));
    return { rarity: fish.rarity, fights: true };
  }

  private onChallengeCatch() {
    const run = this.run!;
    const roll = this.roll!;
    if (roll.kind !== 'fish') return;
    const res = this.pg.applyChallengeCatch(roll.fish, roll.size, this.fishing.perfect);
    this.s.rng = this.rng.state;
    const from = this.rig.landed();
    run.fish += 1;
    run.kinds.add(roll.fish.id);
    const img = art(this, from.x, from.y, `fish:${roll.fish.id}`, 0.45).setDepth(1300);
    this.tweens.add({ targets: img, y: from.y - 190, angle: 360, duration: 450, ease: 'Quad.Out' });
    this.tweens.add({ targets: img, alpha: 0, scale: img.scale * 0.6, delay: 650, duration: 300, onComplete: () => img.destroy() });
    say(this, from.x, this.pond.L.water - 230, `${fishName(roll.fish.id)}  ${res.cm.toFixed(1)} cm`, res.isNew ? '#ffe066' : '#ffffff', 30);
    app.audio.play(res.isNew ? 'new' : 'catch', { volume: 0.7 });
    this.roll = null;
    this.time.delayedCall(250, () => this.fishing.reset());
    if (run.fish >= run.def.fish && run.kinds.size >= run.def.species) this.finishChallenge(true);
  }

  /** Leave the challenge mid-way (no reward). */
  private abandonChallenge() {
    if (!this.run || this.run.over) return;
    this.fishing.reset();
    this.rig.clear();
    this.endChallenge();
  }

  private endChallenge() {
    this.run = null;
    this.pond.setLiveFish(null);
    this.fishing.auto = this.s.autoFish && this.pg.autoUnlocked;
    this.refresh();
  }

  private finishChallenge(success: boolean) {
    const run = this.run;
    if (!run || run.over) return;
    run.over = true;
    this.fishing.reset();
    this.rig.clear();
    const def = run.def;
    const ms = Math.round(run.elapsedMs);
    const r = success ? this.pg.finishChallenge(def, ms) : null;
    if (r) void this.board.submit(def.id, ms);
    app.measure('challenge', def.id, success ? 'clear' : 'fail');
    this.modal++;
    this.stopPlay();
    app.audio.play(success ? 'win' : 'miss');
    const p = new CPanel(this, { title: success ? t('challenge.cleared') : t('challenge.timeUp'), w: 600, h: 900, color: success ? COLORS.green : COLORS.red, closable: false });
    p.once(Phaser.GameObjects.Events.DESTROY, () => this.modal--);
    p.content.add(txt(this, 0, p.top + 60, `${pondName(def.pond)}  ·  ${t('challenge.level', { n: def.n })}`, 30, { color: '#7a6a8a', stroke: false }));
    if (r) {
      p.content.add(txt(this, 0, p.top + 140, formatTime(ms), 72, { color: '#3b2a4d', stroke: false }));
      p.content.add(txt(this, 0, p.top + 215, r.record ? t('challenge.record') : t('challenge.best', { t: formatTime(r.best) }), 30, { color: r.record ? '#e39b00' : '#7a6a8a', stroke: false }));
      const coin = art(this, -70, p.top + 290, 'item:coin', 0.5);
      const amt = txt(this, 10, p.top + 290, `+${fmt(r.coins)}`, 40, { color: '#e39b00', stroke: false });
      const why = txt(this, 0, p.top + 340, t(r.kind === 'first' ? 'challenge.firstReward' : r.kind === 'replay' ? 'challenge.replayReward' : 'challenge.noReward'), 24, { color: '#7a6a8a', stroke: false, weight: '500', wrap: 520 });
      p.content.add([coin, amt, why]);
      if (r.coins > 0) flyIcons(this, 'item:coin', { x: this.vp.width / 2, y: this.vp.height / 2 }, this.hud.coinTarget(), 8, () => this.coinArrive());
    } else {
      p.content.add(txt(this, 0, p.top + 170, t('challenge.progress', { n: run.fish, max: def.fish, k: run.kinds.size, kmax: def.species }), 32, { color: '#3b2a4d', stroke: false, wrap: 520 }));
    }
    const leave = async (then?: string) => {
      p.close();
      this.endChallenge();
      await this.breakPoint();
      app.gameplay.start();
      if (then) void this.startChallenge(then);
    };
    const next = r?.next && this.pg.challengeUnlocked(r.next) ? r.next : null;
    let y = p.bottom - 300;
    if (next) {
      const go = new CButton(this, 0, y, { w: 400, h: 92, label: t('challenge.next'), fontSize: 34, color: COLORS.green, onClick: () => void leave(next.id) });
      p.content.add(go);
      p.nav.primary = go;
      y += 110;
    }
    const retry = new CButton(this, 0, y, { w: 400, h: 92, label: t('challenge.retry'), fontSize: 34, color: COLORS.orange, onClick: () => void leave(def.id) });
    p.content.add(retry);
    p.nav.primary ??= retry;
    p.content.add(new CButton(this, 0, p.bottom - 60, { w: 260, h: 72, label: t('challenge.exit'), fontSize: 28, color: COLORS.grey, onClick: () => void leave() }));
  }

  // ---------- boss ----------

  /** The fish on the hook is the WANTED fish. */
  private rollWanted = false;
  /** Star of the rematch in progress (0: the first fight with the pond's boss). */
  private rematchStar = 0;
  /** Form of the boss in the fight in progress (rematches have forms; see bossForm). */
  private rematchForm: BossForm = 'classic';
  /** Texture of the boss in the fight in progress (its form, once drawn). */
  private bossTex = '';
  /** The last fish shook off the hook (for the message). */
  private slipped = false;

  private startBoss(rematch = false) {
    if (this.fishing.busy || this.run) return;
    const star = rematch ? this.pg.rematchStar() : null;
    if (rematch ? star === null || this.pg.ticketsLeft <= 0 || !!this.pg.lure : !this.pg.bossReady) return;
    this.rematchStar = star ?? 0;
    if (!rematch) this.completeStep('boss');
    const boss = this.pond.pond.boss;
    const pondIndex = Math.max(0, PONDS.indexOf(this.pond.pond));
    const form = rematch ? bossForm(pondIndex, this.rematchStar) : 'classic';
    this.rematchForm = form;
    this.bossTex = `fish:${boss.id}`;
    // Funnel (Poki measure): first fights by boss, rematches by boss and star.
    app.measure(rematch ? 'rematch' : 'boss', rematch ? `${boss.id}-star${this.rematchStar}` : boss.id, 'start');
    // The form's texture is drawn while the banner shows.
    void loadBossForm(this, boss.id, form).then((key) => (this.bossTex = key));
    this.bossTries += 1;
    this.bossContinued = false;
    this.modal++;
    app.audio.play('boss');
    this.cameras.main.shake(500, 0.01);
    const vp = this.vp;
    const title = this.rematchStar ? `${bossName(boss.id)}\n★ ${this.rematchStar}` : t('boss.appears', { boss: bossName(boss.id) });
    const banner = txt(this, vp.width / 2, vp.height * 0.22, title, 70, { color: '#ffe066' }).setDepth(1500).setScale(0.4);
    this.tweens.add({ targets: banner, scale: 1, duration: 400, ease: 'Back.Out' });
    // Rematch form: its name in the form's colour and one line on the twist, read during the banner.
    const extra: Phaser.GameObjects.GameObject[] = [];
    if (form !== 'classic') {
      const y = vp.height * 0.22 + banner.height / 2 + 40;
      const name = txt(this, vp.width / 2, y, t(`form.${form}`), 46, { color: FORM_CSS[form] }).setDepth(1500).setAlpha(0);
      const tip = txt(this, vp.width / 2, y + 58, t(`form.${form}Tip`), 30, { wrap: Math.min(620, vp.width - 60) }).setDepth(1500).setAlpha(0);
      // A dark plate behind the whole block, so the coloured name reads on any pond (snow, sky).
      const top = vp.height * 0.22 - banner.height / 2 - 18;
      const bottom = tip.y + tip.height / 2 + 18;
      const w = Math.min(vp.width - 24, Math.max(banner.width, name.width, tip.width) + 70);
      const plate = this.add.graphics().setDepth(1499).setAlpha(0);
      plate.fillStyle(INK, 0.62).fillRoundedRect(vp.width / 2 - w / 2, top, w, bottom - top, 28);
      extra.push(plate, name, tip);
      this.tweens.add({ targets: extra, alpha: 1, delay: 150, duration: 250 });
    }
    this.time.delayedCall(form === 'classic' ? 1500 : 2600, () => {
      banner.destroy();
      extra.forEach((o) => o.destroy());
      this.modal--;
      this.rig.cast(0.55, 2);
      this.rig.setTarget(this.bossTex, form === 'giant' ? 1.15 : 0.95, FORM_SHADE[form]);
      this.fishing.lineLevel = this.s.upgrades.line;
      this.fishing.startBoss(pondIndex, this.rematchStar, form);
      this.hud.drawBoss(this.bossLabel(), 1, 0, FORM_BAR[form]);
      this.pond.setBossTeaser(false);
      if (this.s.autoFish) this.fishing.auto = false;
    });
  }

  /** Rematch won: a ticket used, the star recorded, coins and an Epic/Legendary egg. */
  private onRematchWin() {
    const boss = this.pond.pond.boss;
    const star = this.rematchStar;
    this.rematchStar = 0;
    this.hud.hideBoss();
    this.fishing.auto = this.s.autoFish && this.pg.autoUnlocked;
    const from = this.rig.landed();
    const reward = this.pg.winRematch(star);
    this.modal++;
    this.stopPlay();
    this.hud.setVisible(false);
    const vp = this.vp;
    const layer = this.add.container(0, 0).setDepth(1400);
    const dim = this.add.rectangle(0, 0, vp.width, vp.height, 0x1a1030, 0.6).setOrigin(0).setInteractive();
    const key = this.textures.exists(this.bossTex) ? this.bossTex : `fish:${boss.id}`;
    const img = art(this, from.x, from.y, key, 0.6);
    const ray = rays(this, vp.width / 2, vp.height * 0.34, 0xffe066, Math.min(800, vp.height * 0.9));
    const plate = card(this, vp.width / 2, vp.height * 0.66, Math.min(520, vp.width - 60), vp.height * 0.3, 0xfff6e6, 30).setAlpha(0.96);
    layer.add([dim, ray, plate, img]);
    this.tweens.add({ targets: img, x: vp.width / 2, y: vp.height * 0.34, scale: fitScale(key, 420), angle: 360, duration: 700, ease: 'Cubic.Out' });
    this.time.delayedCall(600, () => sparkles(this, vp.width / 2, vp.height * 0.34, 16, 220));
    app.audio.play('win');
    const head = txt(this, vp.width / 2, vp.height * 0.16, t('rematch.cleared', { n: star }), 60, { color: '#ffe066' });
    const lines: Phaser.GameObjects.GameObject[] = [head];
    if (reward) {
      const egg = art(this, vp.width / 2 - 90, vp.height * 0.6, `egg:${reward.tier}`, 0.5);
      const eggT = txt(this, vp.width / 2 + 40, vp.height * 0.6, eggName(reward.tier), 30, { color: '#9356e6', stroke: false });
      const coin = art(this, vp.width / 2 - 90, vp.height * 0.69, 'item:coin', 0.5);
      const coinT = txt(this, vp.width / 2 + 10, vp.height * 0.69, `+${fmt(reward.coins)}`, 36, { color: '#e39b00', stroke: false });
      const tip = txt(this, vp.width / 2, vp.height * 0.77, t('rematch.tickets', { n: this.pg.ticketsLeft, max: BOSS_STARS.ticketsPerDay }), 26, { color: '#7a6a8a', stroke: false, wrap: Math.min(480, vp.width - 80) });
      lines.push(egg, eggT, coin, coinT, tip);
      if (reward.hat) this.time.delayedCall(900, () => note(this, t('wardrobe.gotCaptain'), 3200));
    }
    const btn = new CButton(this, vp.width / 2, vp.height * 0.88, {
      w: 300,
      h: 96,
      label: t('boss.hooray'),
      fontSize: 40,
      color: COLORS.green,
      onClick: () => {
        layer.destroy();
        this.modal--;
        this.hud.setVisible(true);
        this.fishing.reset();
        this.refresh();
        void this.resumePlay();
      },
    });
    layer.add([...lines, btn]);
    new KeyNav(this, layer).primary = btn;
  }

  private bossLabel() {
    const name = bossName(this.pond.pond.boss.id);
    return this.rematchStar ? `${name}  ★${this.rematchStar}` : name;
  }

  private onBossEnd(o: Outcome) {
    // Got away = its health is full again. A mis-press heals in one step (10% or 25%), so the fight
    // can end in the same tap, before the bar is drawn again: players saw the boss leave at 85-92%.
    // Show the full bar for a moment first, then the result (29/10).
    if (o === 'escape') {
      this.hud.drawBoss(this.bossLabel(), 1, this.fishing.bossPhase, FORM_BAR[this.rematchForm]);
      this.modal++;
      this.time.delayedCall(700, () => {
        this.modal--;
        this.onBossEndNow(o);
      });
      return;
    }
    this.onBossEndNow(o);
  }

  private onBossEndNow(o: Outcome) {
    const boss = this.pond.pond.boss;
    app.measure(this.rematchStar ? 'rematch' : 'boss', this.rematchStar ? `${boss.id}-star${this.rematchStar}` : boss.id, o === 'caught' ? 'win' : 'lose');
    if (o === 'caught' && this.rematchStar) return this.onRematchWin();
    this.hud.hideBoss();
    this.fishing.auto = this.s.autoFish && this.pg.autoUnlocked;
    if (o === 'caught') {
      const from = this.rig.landed();
      const reward = this.pg.winBoss();
      app.moments.emit('rarePull', { tier: 4, odds: 0.01, label: boss.name });
      this.modal++;
      this.stopPlay();
      this.hud.setVisible(false);
      const vp = this.vp;
      const layer = this.add.container(0, 0).setDepth(1400);
      const dim = this.add.rectangle(0, 0, vp.width, vp.height, 0x1a1030, 0.6).setOrigin(0).setInteractive();
      const img = art(this, from.x, from.y, `fish:${boss.id}`, 0.6);
      const ray = rays(this, vp.width / 2, vp.height * 0.36, 0xffe066, Math.min(800, vp.height * 0.9));
      const plate = card(this, vp.width / 2, vp.height * 0.66, Math.min(520, vp.width - 60), vp.height * 0.3, 0xfff6e6, 30).setAlpha(0.96);
      layer.add([dim, ray, plate, img]);
      this.time.delayedCall(700, () => sparkles(this, vp.width / 2, vp.height * 0.36, 16, 220));
      this.tweens.add({ targets: img, x: vp.width / 2, y: vp.height * 0.36, scale: fitScale(`fish:${boss.id}`, 460), angle: 720, duration: 800, ease: 'Cubic.Out' });
      app.audio.play('win');
      this.cameras.main.shake(400, 0.01);
      const head = txt(this, vp.width / 2, vp.height * 0.18, t('boss.caught'), 64, { color: '#ffe066' });
      const sub = txt(this, vp.width / 2, vp.height * 0.55, t('boss.size', { boss: bossName(boss.id), cm: (this.rng.next() * 40 + 160).toFixed(1) }), 34, { color: '#3b2a4d', stroke: false, wrap: Math.min(480, vp.width - 80) });
      const egg = art(this, vp.width / 2 - 70, vp.height * 0.62, 'egg:3', 0.5);
      const eggT = txt(this, vp.width / 2 + 60, vp.height * 0.62, reward.eggStored ? t('boss.epicEgg') : t('boss.coins', { n: reward.coins - reward.prize }), 32, { color: '#9356e6', stroke: false });
      const gem = art(this, vp.width / 2 - 70, vp.height * 0.7, 'item:coin', 0.5);
      const gemT = txt(this, vp.width / 2 + 20, vp.height * 0.7, `+${reward.prize}`, 36, { color: '#e39b00', stroke: false });
      const next = this.pg.nextPond();
      const tip = txt(this, vp.width / 2, vp.height * 0.77, next ? t('boss.nextPond', { pond: pondName(next.id) }) : t('boss.allDone'), 26, { wrap: Math.min(480, vp.width - 80), color: '#7a6a8a', stroke: false });
      const btn = new CButton(this, vp.width / 2, vp.height * 0.88, {
        w: 300,
        h: 96,
        label: t('boss.hooray'),
        fontSize: 40,
        color: COLORS.green,
        onClick: () => {
          layer.destroy();
          this.modal--;
          this.hud.setVisible(true);
          this.fishing.reset();
          this.refresh();
          void this.resumePlay();
        },
      });
      layer.add([head, sub, egg, eggT, gem, gemT, tip, btn]);
      new KeyNav(this, layer).primary = btn;
      return;
    }
    // Lost: continue once with an ad (keeps progress), or lure the boss back with a few catches.
    const progress = this.fishing.progress;
    this.rig.lose();
    app.audio.play('snap');
    // Two ways to lose, two messages (29/10): the line snapped (held in the red too long, usually
    // through a pull), or the boss got its health back and swam off. v1.14 said "got away" for both,
    // so a snap at 86% looked like the boss leaving with health to spare.
    const snapped = o === 'snap';
    const p = new CPanel(this, { title: snapped ? t('boss.snapped') : t('boss.gotAway', { boss: bossName(boss.id) }), w: 600, h: 860, color: COLORS.red, closable: false });
    this.modal++;
    this.stopPlay();
    p.content.add(art(this, 0, p.top + 110, this.textures.exists(this.bossTex) ? this.bossTex : `fish:${boss.id}`, 0.8));
    p.content.add(txt(this, 0, p.top + 230, t('boss.progress', { n: Math.round(progress * 100) }), 30, { color: '#7a6a8a', stroke: false, wrap: 520 }));
    // The tip can run to three lines (snap tip, long languages): stack the texts from the top down.
    const tipT = txt(this, 0, p.top + 256, snapped ? t('boss.snapTip') : t('boss.tip'), 26, { color: '#7a6a8a', stroke: false, weight: '500', wrap: 520 }).setOrigin(0.5, 0);
    p.content.add(tipT);
    const done = () => {
      p.close();
    };
    p.once(Phaser.GameObjects.Events.DESTROY, () => this.modal--);
    // Poki button order: the free "Try again" above, the rewarded revive below it, same size.
    const revive = !this.bossContinued && app.ads.rewardedAvailable && !app.clean;
    if (revive) {
      p.content.add(
        new CButton(this, 0, p.bottom - 190, {
          w: 400,
          h: 96,
          label: t('boss.keepReeling'),
          fontSize: 36,
          color: COLORS.ad,
          ad: true,
          onClick: () =>
            this.watchAd(() => {
              done();
              this.bossContinued = true;
              this.rig.cast(0.55, 2);
              this.rig.setTarget(this.bossTex || `fish:${boss.id}`, this.rematchForm === 'giant' ? 1.15 : 0.95, FORM_SHADE[this.rematchForm]);
              this.fishing.lineLevel = this.s.upgrades.line;
              this.fishing.continueBoss(progress);
              this.hud.drawBoss(this.bossLabel(), 1 - progress, this.fishing.bossPhase, FORM_BAR[this.rematchForm]);
              app.gameplay.start();
            }),
        }),
      );
    }
    // No free retry: the boss swims off and comes back after a few more catches in this pond.
    const lureN = BOSS_LURE[Math.max(0, PONDS.indexOf(this.pond.pond))] ?? 8;
    p.content.add(txt(this, 0, tipT.y + tipT.height + 14, t('lure.how', { n: lureN, boss: bossName(boss.id) }), 26, { color: '#c0392b', stroke: false, wrap: 520 }).setOrigin(0.5, 0));
    const ok = new CButton(this, 0, p.bottom - (revive ? 300 : 190), {
      w: 400,
      h: 96,
      label: t('lure.ok'),
      fontSize: 36,
      color: COLORS.orange,
      onClick: () => {
        done();
        this.pg.loseBoss();
        this.rematchStar = 0;
        this.fishing.reset();
        this.rig.clear();
        this.refresh();
        void this.resumePlay();
      },
    });
    p.content.add(ok);
    p.nav.primary = ok;
  }

  // ---------- coach (tutorial) ----------

  private buildCoach() {
    this.coachBg = this.add.graphics();
    this.coachText = txt(this, 0, 0, '', 32, { color: '#3b2a4d', stroke: false, wrap: 440 });
    this.coach = this.add.container(0, 0, [this.coachBg, this.coachText]).setDepth(1200).setVisible(false);
    this.coachHand = this.add.graphics().setDepth(1201).setVisible(false);
    drawHand(this.coachHand);
    if (!this.s.tutorial.includes('cast')) {
      this.fishing.assist = true;
      this.time.delayedCall(600, () => this.showStep('cast'));
    }
  }

  /** Tutorial lines: short, with the hand doing the showing (Poki: visual, not text-heavy). */
  /** The goal tracker under the coin counter (see PondGame.nextGoal). */
  private goalView(): { icon: string; text: string; progress: number } | null {
    // A lost boss to lure back comes first.
    const lure = this.pg.lure;
    if (lure) return { icon: 'icon:i_crown', text: t('lure.goal', { boss: bossName(lure.boss), n: lure.have, max: lure.need }), progress: lure.have / lure.need };
    const g = this.pg.nextGoal();
    if (!g || !this.s.tutorial.includes('done')) return null;
    switch (g.kind) {
      case 'dex':
        return { icon: 'icon:i_book', text: t('goal.dex', { n: g.n, max: g.max }), progress: g.n / g.max };
      case 'pond':
        return { icon: 'icon:i_map', text: t('goal.pond', { pond: pondName(g.pond!), n: fmt(g.n), max: fmt(g.max) }), progress: g.n / g.max };
      case 'travel':
        return { icon: 'icon:i_map', text: t('goal.travel', { pond: pondName(g.pond!) }), progress: 1 };
      case 'all':
        return { icon: 'icon:i_star', text: t('goal.all', { n: g.n, max: g.max }), progress: g.n / g.max };
    }
  }

  private stepText(step: Step) {
    return t(`tut.${step}`);
  }

  private showStep(step: Step) {
    if (this.s.tutorial.includes(step)) return;
    this.step = step;
    this.stepT = 0;
    this.coachText.setText(this.stepText(step));
    const w = Math.max(260, this.coachText.width + 50);
    const h = this.coachText.height + 36;
    const g = this.coachBg;
    g.clear();
    g.fillStyle(INK, 1).fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 26);
    g.fillTriangle(-60, h / 2, -20, h / 2, -70, h / 2 + 40);
    g.fillStyle(0xfffdf6, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    g.fillTriangle(-56, h / 2 - 2, -26, h / 2 - 2, -64, h / 2 + 30);
    this.coach.setVisible(true).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: this.coach, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    app.audio.play('pop', { volume: 0.6 });
    this.placeCoach();
    if (step === 'egg') this.time.delayedCall(4500, () => this.completeStep('egg'));
  }

  private completeStep(step: Step) {
    if (!this.s.tutorial.includes(step)) {
      if (step === 'upgrade' && this.step !== 'upgrade') return;
      this.s.tutorial.push(step);
      app.measure('tutorial', step, 'complete');
    }
    if (step === 'reel') this.fishing.assist = false;
    if (this.step === step) {
      this.step = null;
      this.tweens.add({ targets: this.coach, alpha: 0, scale: 0.8, duration: 150, onComplete: () => this.coach.setVisible(false) });
      this.coachHand.setVisible(false);
    }
    const core: Step[] = ['cast', 'bite', 'reel', 'egg', 'hatch', 'upgrade'];
    if (!this.s.tutorial.includes('done') && core.every((c) => this.s.tutorial.includes(c))) {
      this.s.tutorial.push('done');
      app.measure('tutorial', 'all', 'complete');
    }
  }

  private placeCoach() {
    if (!this.coach) return;
    const vp = this.vp;
    const cat = this.rig?.cat;
    if (!cat) return;
    const portrait = vp.height > vp.width;
    const x = Phaser.Math.Clamp(cat.x + (portrait ? 230 : 420), 260, vp.width - 260);
    const y = portrait ? cat.y - 250 : 200;
    this.coach.setPosition(x, Math.max(portrait ? 300 : 200, y));
  }

  private coachTarget(): { x: number; y: number } | null {
    switch (this.step) {
      case 'cast':
      case 'bite':
      case 'reel': {
        // Open water: under the surface, but well above the button row (short landscape phones
        // would otherwise put the finger on the Map button).
        const y = Math.min(this.pond.L.water + 220, this.hud.bottom[0].y - 190);
        return { x: this.vp.width * 0.66, y: Math.max(this.pond.L.water + 90, y) };
      }
      case 'hatch':
        return this.hud.eggTarget();
      case 'upgrade':
        return { x: this.hud.bottom[0].x, y: this.hud.bottom[0].y };
      case 'boss':
        return { x: this.hud.boss.x, y: this.hud.boss.y };
      default:
        return null;
    }
  }

  // ---------- music ----------

  private startMusic() {
    const key = musicKey(this.s.pond);
    if (!this.cache.audio.exists(key)) return;
    if (this.music && this.musicKeyPlaying === key) return;
    const play = () => {
      if (this.musicKeyPlaying === key && this.music) return;
      // Cross-fade from the previous pond's music.
      const old = this.music;
      if (old) {
        this.tweens.add({ targets: old, volume: 0, duration: 700, onComplete: () => old.destroy() });
      }
      this.musicKeyPlaying = key;
      this.music = this.sound.add(key, { loop: true, volume: old ? 0 : 0.32 });
      this.music.play();
      if (old) this.tweens.add({ targets: this.music, volume: 0.32, duration: 900 });
    };
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, play);
    else play();
  }

  /** New pond: its own music (loaded the first time). */
  private async pondMusic() {
    const pond = this.s.pond;
    if (await loadMusic(this, pond)) {
      if (this.s.pond === pond) this.startMusic();
    }
  }

  // ---------- frame ----------

  update(_time: number, delta: number) {
    // Real time per frame, up to a quarter second. v1.14 cut every frame at 0.1 s, so below 10 fps
    // (a slow laptop drawing a large canvas) the whole game ran in slow motion. The fishing machine
    // still moves in steps of at most 1/30 s, so a long frame cannot skip a bite or a pull.
    const dt = Math.min(0.25, delta / 1000);
    // Animation time (Fishing scales its own clock): see GAME_SPEED.
    const mdt = dt * GAME_SPEED;
    const s = this.s;
    const f = this.fishing;
    // Pause panel: everything stands still (cast, bite window, fight, auto fishing, egg timers).
    if (this.frozen) {
      this.pond.update(mdt);
      return;
    }
    if (this.modal === 0 || f.phase === 'reeling') {
      const steps = Math.ceil(dt * 30 - 1e-6) || 1;
      for (let i = 0; i < steps; i++) {
        if (f.auto && this.modal === 0) this.bot.update(dt / steps);
        f.update(dt / steps);
      }
    }
    // WANTED fish: its clock runs only while you are fishing (not on the hook, in a boss fight or a challenge).
    const fishingNow = this.modal === 0 && !this.run && !f.target.boss;
    this.pond.setWantedShown(!f.target.boss && !this.run);
    if (fishingNow && !(this.rollWanted && f.busy)) {
      const ev = this.pg.tickWanted(dt);
      const w = this.pg.wanted;
      if (ev === 'spawn' && w) {
        this.pond.showWanted(w.fish, w.size);
        note(this, t('wanted.appear'), 2600);
        app.audio.play('pop');
        app.measure('wanted', this.s.pond, 'spawn');
      } else if (ev === 'gone') {
        this.pond.clearWanted();
        note(this, t('wanted.gone'));
        app.measure('wanted', this.s.pond, 'gone');
      }
    }
    // Economy tick: eggs and angler pets.
    this.ticker += dt;
    if (this.ticker >= 0.25) {
      const step = this.ticker;
      this.ticker = 0;
      const catches = this.pg.tick(step);
      for (const c of catches) {
        const img = this.pond.petImage(c.petId);
        if (img) {
          say(this, img.x, img.y - 90, `+${c.coins}`, '#ffe066', 30);
          this.tweens.add({ targets: img, y: img.y - 24, duration: 140, yoyo: true });
        }
        this.coinArrive();
      }
      if (this.pg.refreshDay()) note(this, t('msg.newQuests'));
      if (!s.tutorial.includes('hatch') && readyEggIndex(s) >= 0 && !f.busy && this.modal === 0 && this.step !== 'hatch') this.showStep('hatch');
      if (s.tutorial.includes('hatch') && !s.tutorial.includes('upgrade') && this.step === null && !f.busy && this.modal === 0 && anyUpgradeAffordable(s)) this.showStep('upgrade');
    }
    this.pond.update(mdt);
    this.rig.update(mdt, f);
    if (f.phase === 'reeling' && f.target.boss) this.hud.drawBoss(this.bossLabel(), 1 - f.progress, f.bossPhase, FORM_BAR[this.rematchForm]);
    // Challenge clock: runs only while playing (menus and pause stop it).
    const run = this.run;
    if (run && !run.over && this.modal === 0) {
      run.timeMs -= dt * 1000;
      run.elapsedMs += dt * 1000;
      if (run.timeMs <= 0) this.finishChallenge(false);
    }
    const tutDone = s.tutorial.includes('done');
    this.hud.update(mdt, f, {
      autoOn: f.auto,
      autoUnlocked: this.pg.autoUnlocked,
      goldenIn: this.pg.goldenIn(),
      goldenLeft: Math.max(0, (s.ads.goldenUntil - Date.now()) / 1000),
      mysteryIn: this.pg.mysteryEggIn(),
      lucky: this.pg.luckyCastReady && s.stats.catches >= 5,
      questBadge: questsClaimable(s),
      canUpgrade: anyUpgradeAffordable(s),
      petBadge: Object.keys(s.pets).length > this.seenPets,
      // Fishdex badge: new species, or boss rematch tickets waiting.
      dexBadge: Object.keys(s.dex).length > this.seenDex || (this.pg.rematchStar() !== null && this.pg.ticketsLeft > 0),
      // Map badge: a pond to open, or today's fish waiting in another pond.
      mapBadge: PONDS.some((p) => !s.unlocked.includes(p.id) && this.pg.canUnlock(p) && s.coins >= p.unlockCost) || (!!this.pg.today && !this.pg.todayFish),
      bossReady: this.pg.bossReady && !this.run,
      challengeOpen: this.pg.challengeOpen,
      challenge: this.run ? { timeMs: this.run.timeMs, fish: this.run.fish, fishGoal: this.run.def.fish, kinds: this.run.kinds.size, kindsGoal: this.run.def.species } : null,
      showHint: tutDone && !f.auto && this.modal === 0,
      adsOk: app.ads.rewardedAvailable && !app.clean,
      ...(() => {
        // A WANTED fish in the water takes the poster (with its countdown); today's fish otherwise.
        const w = this.pg.wanted;
        const id = w ? w.fish.id : (this.pg.todayFish?.id ?? null);
        return { wanted: id, wantedKnown: !!w || !!(id && s.dex[id]), wantedToday: !w && !!this.pg.todayFish, wantedLeft: w ? Math.max(0, Math.ceil(w.left)) : null };
      })(),
      goal: this.goalView(),
    });
    // Coach hand.
    if (this.step) {
      this.stepT += mdt;
      const t = this.coachTarget();
      this.coachHand.setVisible(!!t);
      if (t) {
        const press = Math.max(0, Math.sin(this.stepT * 5));
        const holdStep = this.step === 'cast' || this.step === 'reel';
        this.coachHand.setPosition(t.x + 10, t.y + 20 + (holdStep ? Math.min(1, (this.stepT % 2) * 2) * 10 : press * 12));
      }
    }
  }
}

function rollKey(r: CatchRoll) {
  switch (r.kind) {
    case 'fish':
      return `fish:${r.fish.id}`;
    case 'egg':
      return `egg:${r.tier}`;
    case 'junk':
      return `item:${r.item}`;
    case 'chest':
      return 'item:chest';
  }
}

function rollSize(r: CatchRoll) {
  if (r.kind === 'fish') return 0.42 + r.fish.rarity * 0.05 + (r.size - 1) * 0.2;
  return 0.42;
}
