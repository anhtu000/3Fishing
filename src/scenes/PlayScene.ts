// The pond. One scene holds the whole game: fishing, the HUD, menus and reward moments.
import Phaser from 'phaser';
import { BaseScene, app, secondsAway, type ViewportInfo } from '@core';
import { Rng } from '../../core/rng';
import { claimDaily, dayKey } from '../../core/time';
import { PONDS, STREAK, petById, pondById } from '../content/data';
import { Fishing, FishingBot, type Outcome } from '../logic/fishing';
import { PondGame } from '../logic/game';
import type { SaveData } from '../logic/model';
import { anyUpgradeAffordable, questsClaimable, readyEggIndex, type CatchRoll } from '../logic/rules';
import { devPreset } from '../dev';
import { save } from '../save';
import { Hud, drawHand } from '../ui/Hud';
import { CButton, COLORS, CPanel, INK, art, card, fitScale, txt } from '../ui/kit';
import { dailyPanel, dexPanel, incubatorPanel, mapPanel, petsPanel, questsPanel, upgradesPanel, type PanelCtx } from '../ui/panels';
import { bigCatch, flyIcons, hatchReveal, isBigCatch, note, quickCatch, rays, say, sparkles } from '../ui/popups';
import { Pond } from '../world/Pond';
import { Rig } from '../world/Rig';

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
  private seenPets = 0;
  private seenDex = 0;

  constructor() {
    // Gameplay events are sent by hand: gameplayStart on the first input, not on load (Poki rule).
    super('Play', { gameplay: false });
  }

  protected build() {
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
        note(this, 'Golden bait! Luck x2 for 5 minutes');
      }),
      mystery: () => {
        if (!this.pg.s.eggs.some((e, i) => i < s.incubatorSlots && !e)) return note(this, 'The incubator is full. Hatch an egg first!');
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
        note(this, s.autoFish ? 'Auto fishing on (half speed). Tap the water to fish yourself.' : 'Auto fishing off');
      },
      boss: () => this.startBoss(),
      egg: (i) => this.tapEgg(i),
      sound: () => {
        app.audio.toggle();
        this.hud.setSoundIcon(app.audio.muted);
      },
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
        hook: (perfect) => this.onHook(perfect),
        surge: () => app.audio.play('splash', { volume: 0.35, pitchJitter: 200 }),
        phase: (ph) => {
          this.cameras.main.shake(300, 0.008);
          app.audio.play('boss');
          say(this, this.vp.width / 2, this.vp.height * 0.3, `Phase ${ph + 1}!`, '#ff8a8a', 56);
        },
        end: (o) => this.onEnd(o),
      },
      () => {
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
    this.startMusic();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music?.stop());

    // Welcome back: angler pets fished while you were away; then the daily gift.
    if (!save.isNewPlayer) {
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
      hatch: (i) => this.doHatch(i),
      coinTo: () => this.hud.coinTarget(),
      gemTo: () => this.hud.gemTarget(),
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
      if (this.fishing.phase === 'reeling' || this.fishing.phase === 'bite') return;
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
      note(this, 'Auto fishing off');
    }
    if (this.fishing.phase === 'ready') app.audio.play('charge', { volume: 0.5 });
    this.fishing.press();
  }

  // ---------- fishing events ----------

  private onCast(zone: number, power: number) {
    this.s.stats.casts += 1;
    this.lucky = this.pg.luckyCastReady && this.s.stats.catches >= 5;
    if (this.lucky) {
      this.s.luckyDay = dayKey();
      say(this, this.vp.width / 2, this.pond.L.water - 120, 'Lucky cast! Luck x3', '#ffe066', 44);
    }
    this.rig.cast(power, zone);
    app.audio.play('cast', { pitchJitter: 100 });
    if (zone === 2) this.time.delayedCall(250, () => say(this, this.rig.landX, this.pond.L.water - 70, 'Super far!', '#ffe066', 36));
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
    if (this.roll) this.hud.setProgressIcon(rollKey(this.roll));
    if (perfect) {
      say(this, this.rig.bobber.x, this.pond.L.water - 80, 'Perfect!', '#7dffb0', 44);
      app.audio.play('perfect');
    }
    this.completeStep('bite');
    if (!this.s.tutorial.includes('reel')) this.showStep('reel');
  }

  private onEnd(o: Outcome) {
    const f = this.fishing;
    if (f.target.boss) return this.onBossEnd(o);
    if (o === 'caught' && this.roll) {
      const res = this.pg.applyCatch(this.roll, f.perfect);
      this.s.rng = this.rng.state;
      const from = this.rig.landed();
      this.completeStep('reel');
      if (!f.assist) f.assist = false;
      if (res.isNew) {
        this.pond.refreshKnown();
        app.moments.emit('collectionNew', { id: this.roll.kind === 'fish' ? this.roll.fish.id : '' });
      }
      if (this.roll.kind === 'fish' && this.roll.fish.rarity >= 3) app.moments.emit('rarePull', { tier: this.roll.fish.rarity, odds: this.roll.fish.rarity === 4 ? 0.01 : 0.04, label: this.roll.fish.name });
      const view = {
        result: res,
        from,
        coinTo: this.hud.coinTarget(),
        gemTo: this.hud.gemTarget(),
        eggTo: this.hud.eggTarget(),
        onCoins: () => this.coinArrive(),
        onGems: () => {
          this.hud.bumpGems();
          app.audio.play('gem', { volume: 0.5, pitchJitter: 100 });
        },
      };
      for (const id of res.questsDone) this.time.delayedCall(1200, () => note(this, 'Quest complete! Claim your coins.'), [id]);
      const after = () => {
        this.fishing.reset();
        this.afterCatch(res.roll);
      };
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
    const msg: Record<string, string> = { early: 'Too early! Wait for the big splash', missed: 'Too slow!', snap: 'Snap! The line broke', escape: 'It got away!' };
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

  private tapEgg(i: number) {
    const egg = this.s.eggs[i];
    if (!egg) return;
    if (egg.left <= 0) this.doHatch(i);
    else this.open(() => incubatorPanel(this, this.ctx, i, (done) => this.watchAd(done)));
  }

  private doHatch(i: number) {
    if (this.fishing.busy && this.fishing.phase !== 'waiting') return note(this, 'Land your catch first!');
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
      if (r.result.kind === 'new' && !this.s.team.includes(r.petId)) note(this, 'Your team is full. Swap pets in the Pets menu.');
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

  private open(make: () => CPanel) {
    if (this.panel && !this.panel.isClosed) return;
    if (this.fishing.phase === 'charging') this.fishing.release();
    if (this.fishing.busy && this.fishing.phase !== 'done') {
      note(this, 'Finish this catch first!');
      return;
    }
    this.modal++;
    this.stopPlay();
    const p = make();
    this.panel = p;
    p.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.modal--;
      if (this.panel === p) this.panel = null;
      this.refresh();
      void this.resumePlay();
    });
  }

  private openPause() {
    this.open(() => {
      const p = new CPanel(this, { title: 'Paused', w: 520, h: 460, color: COLORS.teal });
      p.content.add(
        new CButton(this, 0, p.top + 120, { w: 340, h: 100, label: 'Resume', fontSize: 40, color: COLORS.green, onClick: () => p.close() }),
      );
      const sound = new CButton(this, 0, p.top + 250, {
        w: 340,
        h: 84,
        label: app.audio.muted ? 'Sound: off' : 'Sound: on',
        fontSize: 30,
        color: COLORS.blue,
        onClick: () => {
          app.audio.toggle();
          this.hud.setSoundIcon(app.audio.muted);
          sound.setLabel(app.audio.muted ? 'Sound: off' : 'Sound: on');
        },
      });
      p.content.add(sound);
      return p;
    });
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

  private refresh() {
    this.pond.setPets(this.s.team);
    this.pond.refreshKnown();
    this.pond.setBossTeaser(!this.s.bosses.includes(this.pond.pond.boss.id) && Object.keys(this.s.dex).filter((id) => this.pond.pond.fish.some((f) => f.id === id)).length >= 4);
    if (this.pg.bossReady && !this.s.tutorial.includes('boss') && !this.fishing.busy) this.showStep('boss');
    save.flush();
  }

  private openOffline(sec: number, coins: number) {
    const p = new CPanel(this, { title: 'Welcome back!', w: 600, h: 700, color: COLORS.teal, closable: false });
    this.modal++;
    const anglers = this.s.team.filter((id) => petById.get(id)?.perk === 'angler');
    const pet = anglers[0] ?? this.s.team[0];
    if (pet) p.content.add(art(this, 0, p.top + 100, `pet:${pet}`, 0.8));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    p.content.add(txt(this, 0, p.top + 230, `Your pets fished for ${h > 0 ? `${h}h ` : ''}${m}m`, 30, { color: '#7a6a8a', stroke: false }));
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
    p.content.add(new CButton(this, 0, p.bottom - (ads ? 200 : 110), { w: 400, h: 96, label: 'Collect', fontSize: 38, color: COLORS.orange, onClick: () => give(1) }));
    if (ads) p.content.add(new CButton(this, 0, p.bottom - 90, { w: 400, h: 96, label: 'Collect x2', fontSize: 38, color: COLORS.ad, ad: true, onClick: () => this.watchAd(() => give(2)) }));
  }

  private maybeDaily() {
    if (!this.s.tutorial.includes('done')) return;
    if (this.s.daily.lastClaim === dayKey()) return;
    this.openDaily();
  }

  private openDaily() {
    this.open(() =>
      dailyPanel(this, this.ctx, (i) => {
        const r = STREAK[i];
        this.s.daily = claimDaily(this.s.daily);
        if (r.coins) {
          this.pg.earn(r.coins);
          flyIcons(this, 'item:coin', { x: this.vp.width / 2, y: this.vp.height / 2 }, this.hud.coinTarget(), 8, () => this.coinArrive());
        }
        if (r.egg >= 0) {
          const stored = this.pg.s.eggs.some((e, k) => k < this.s.incubatorSlots && !e);
          if (stored) {
            const pond = this.pg.pond.id;
            this.pg.s.eggs[this.pg.s.eggs.findIndex((e, k) => k < this.s.incubatorSlots && !e)] = { tier: r.egg, pond, left: [30, 120, 300, 600, 1200][r.egg], total: [30, 120, 300, 600, 1200][r.egg] };
          } else this.pg.earn(10 * (r.egg + 1));
        }
        app.audio.play('reward');
      }),
    );
  }

  // ---------- travel ----------

  private async travel(id: string) {
    const p = pondById.get(id as 'cozy');
    if (!p || !this.pg.travel(p)) return;
    // Next level: gameplayStop, commercial break, then gameplayStart in the new pond.
    this.stopPlay();
    await this.breakPoint();
    this.modal++;
    this.cameras.main.fadeOut(300, 255, 255, 255);
    this.time.delayedCall(320, () => {
      this.pond.setPond(id);
      this.pond.setPets(this.s.team);
      this.layout(this.vp);
      this.refresh();
      this.cameras.main.fadeIn(400, 255, 255, 255);
      app.audio.play('unlock');
      const title = txt(this, this.vp.width / 2, this.vp.height * 0.25, p.name, 72).setDepth(1500).setScale(0.5);
      this.tweens.add({ targets: title, scale: 1, duration: 400, ease: 'Back.Out' });
      this.tweens.add({ targets: title, alpha: 0, delay: 1600, duration: 400, onComplete: () => title.destroy() });
      if (this.pg.autoUnlocked && !this.s.tutorial.includes('auto')) {
        this.s.tutorial.push('auto');
        this.time.delayedCall(1800, () => note(this, 'Auto fishing unlocked! Tap the round button on the left.', 3200));
      }
      this.modal--;
      if (this.played) app.gameplay.start();
      save.flush();
    });
  }

  // ---------- boss ----------

  private startBoss() {
    if (this.fishing.busy || !this.pg.bossReady) return;
    this.completeStep('boss');
    const boss = this.pond.pond.boss;
    this.bossTries += 1;
    this.bossContinued = false;
    this.modal++;
    app.audio.play('boss');
    this.cameras.main.shake(500, 0.01);
    const vp = this.vp;
    const banner = txt(this, vp.width / 2, vp.height * 0.22, `${boss.name}\nappears!`, 76, { color: '#ffe066' }).setDepth(1500).setScale(0.4);
    this.tweens.add({ targets: banner, scale: 1, duration: 400, ease: 'Back.Out' });
    this.time.delayedCall(1500, () => {
      banner.destroy();
      this.modal--;
      this.rig.cast(0.55, 2);
      this.rig.setTarget(`fish:${boss.id}`, 0.95);
      this.fishing.startBoss();
      this.hud.drawBoss(boss.name, 1, 0);
      this.pond.setBossTeaser(false);
      if (this.s.autoFish) this.fishing.auto = false;
    });
  }

  private onBossEnd(o: Outcome) {
    const boss = this.pond.pond.boss;
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
      const head = txt(this, vp.width / 2, vp.height * 0.18, 'BOSS CAUGHT!', 64, { color: '#ffe066' });
      const sub = txt(this, vp.width / 2, vp.height * 0.55, `${boss.name}: ${(this.rng.next() * 40 + 160).toFixed(1)} cm!`, 34, { color: '#3b2a4d', stroke: false });
      const egg = art(this, vp.width / 2 - 70, vp.height * 0.62, 'egg:3', 0.5);
      const eggT = txt(this, vp.width / 2 + 60, vp.height * 0.62, reward.eggStored ? 'Epic egg' : `+${reward.coins - reward.prize} coins`, 32, { color: '#9356e6', stroke: false });
      const gem = art(this, vp.width / 2 - 70, vp.height * 0.7, 'item:coin', 0.5);
      const gemT = txt(this, vp.width / 2 + 20, vp.height * 0.7, `+${reward.prize}`, 36, { color: '#e39b00', stroke: false });
      const next = this.pg.nextPond();
      const tip = txt(this, vp.width / 2, vp.height * 0.77, next ? `${next.name} is open on the Map!` : 'You beat every boss! More ponds coming soon.', 26, { wrap: Math.min(480, vp.width - 80), color: '#7a6a8a', stroke: false });
      const btn = new CButton(this, vp.width / 2, vp.height * 0.88, {
        w: 300,
        h: 96,
        label: 'Hooray!',
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
      return;
    }
    // Lost: continue once with an ad (keeps progress), or try again for free.
    const progress = this.fishing.progress;
    this.rig.lose();
    app.audio.play('snap');
    const p = new CPanel(this, { title: `${boss.name} got away!`, w: 600, h: 720, color: COLORS.red, closable: false });
    this.modal++;
    this.stopPlay();
    p.content.add(art(this, 0, p.top + 110, `fish:${boss.id}`, 0.8));
    p.content.add(txt(this, 0, p.top + 230, `You got it ${Math.round(progress * 100)}% of the way!`, 30, { color: '#7a6a8a', stroke: false }));
    p.content.add(txt(this, 0, p.top + 276, 'Tip: upgrade your Rod and Line', 26, { color: '#7a6a8a', stroke: false, weight: '500' }));
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
          label: 'Keep reeling',
          fontSize: 36,
          color: COLORS.ad,
          ad: true,
          onClick: () =>
            this.watchAd(() => {
              done();
              this.bossContinued = true;
              this.rig.cast(0.55, 2);
              this.rig.setTarget(`fish:${boss.id}`, 0.95);
              this.fishing.continueBoss(progress);
              this.hud.drawBoss(boss.name, 1 - progress, this.fishing.bossPhase);
              app.gameplay.start();
            }),
        }),
      );
    }
    p.content.add(
      new CButton(this, 0, p.bottom - (revive ? 300 : 190), {
        w: 400,
        h: 96,
        label: 'Try again',
        fontSize: 36,
        color: COLORS.orange,
        onClick: async () => {
          done();
          this.fishing.reset();
          this.rig.clear();
          // Death and restart: gameplayStop, commercial break, gameplayStart.
          await this.breakPoint();
          app.gameplay.start();
          this.startBoss();
        },
      }),
    );
    p.content.add(
      new CButton(this, 0, p.bottom - 50, {
        w: 260,
        h: 70,
        label: 'Later',
        fontSize: 28,
        color: COLORS.grey,
        onClick: () => {
          done();
          this.fishing.reset();
          this.rig.clear();
          this.refresh();
          void this.resumePlay();
        },
      }),
    );
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
  private stepText(step: Step) {
    return {
      cast: 'Hold... then let go!',
      bite: 'TAP NOW!',
      reel: 'Hold to reel. Let go on red!',
      egg: 'An egg! It hatches as you fish.',
      hatch: 'Tap to hatch!',
      upgrade: 'Upgrade your gear!',
      boss: 'Boss time! Tap BOSS!',
    }[step];
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
    }
    if (step === 'reel') this.fishing.assist = false;
    if (this.step === step) {
      this.step = null;
      this.tweens.add({ targets: this.coach, alpha: 0, scale: 0.8, duration: 150, onComplete: () => this.coach.setVisible(false) });
      this.coachHand.setVisible(false);
    }
    const core: Step[] = ['cast', 'bite', 'reel', 'egg', 'hatch', 'upgrade'];
    if (!this.s.tutorial.includes('done') && core.every((c) => this.s.tutorial.includes(c))) this.s.tutorial.push('done');
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
        return { x: this.vp.width * 0.66, y: this.pond.L.water + 220 };
      case 'bite':
      case 'reel':
        return { x: this.vp.width * 0.66, y: this.pond.L.water + 220 };
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
    if (!this.cache.audio.exists('music')) return;
    const play = () => {
      if (this.music) return;
      this.music = this.sound.add('music', { loop: true, volume: 0.32 });
      this.music.play();
    };
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, play);
    else play();
  }

  // ---------- frame ----------

  update(_time: number, delta: number) {
    const dt = Math.min(0.1, delta / 1000);
    const s = this.s;
    const f = this.fishing;
    if (this.modal === 0 || f.phase === 'reeling') {
      if (f.auto && this.modal === 0) this.bot.update(dt);
      f.update(dt);
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
      if (this.pg.refreshDay()) note(this, 'New daily quests!');
      if (!s.tutorial.includes('hatch') && readyEggIndex(s) >= 0 && !f.busy && this.modal === 0 && this.step !== 'hatch') this.showStep('hatch');
      if (s.tutorial.includes('hatch') && !s.tutorial.includes('upgrade') && this.step === null && !f.busy && this.modal === 0 && anyUpgradeAffordable(s)) this.showStep('upgrade');
    }
    this.pond.update(dt);
    this.rig.update(dt, f);
    if (f.phase === 'reeling' && f.target.boss) this.hud.drawBoss(this.pond.pond.boss.name, 1 - f.progress, f.bossPhase);
    const tutDone = s.tutorial.includes('done');
    this.hud.update(dt, f, {
      autoOn: f.auto,
      autoUnlocked: this.pg.autoUnlocked,
      goldenIn: this.pg.goldenIn(),
      goldenLeft: Math.max(0, (s.ads.goldenUntil - Date.now()) / 1000),
      mysteryIn: this.pg.mysteryEggIn(),
      lucky: this.pg.luckyCastReady && s.stats.catches >= 5,
      questBadge: questsClaimable(s),
      canUpgrade: anyUpgradeAffordable(s),
      petBadge: Object.keys(s.pets).length > this.seenPets,
      dexBadge: Object.keys(s.dex).length > this.seenDex,
      mapBadge: PONDS.some((p) => !s.unlocked.includes(p.id) && this.pg.canUnlock(p) && s.coins >= p.unlockCost),
      bossReady: this.pg.bossReady,
      showHint: tutDone && !f.auto,
      adsOk: app.ads.rewardedAvailable && !app.clean,
    });
    // Coach hand.
    if (this.step) {
      this.stepT += dt;
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
