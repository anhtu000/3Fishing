// Everything on top of the pond: currencies, incubator, side buttons, the bottom bar, the
// cast/tension meter and the idle hint. Kept clear of the top-left corner (Poki's pill on phones).
import Phaser from 'phaser';
import { shapeTexture } from '@core';
import { HATCH_SEC } from '../content/data';
import type { Fishing } from '../logic/fishing';
import { RED_AT } from '../logic/fishing';
import type { SaveData } from '../logic/model';
import { t } from '../i18n/t';
import { CButton, COLORS, INK, fitText, art, drawBar, drawChunky, fitScale, fmt, roundButton, setArt, txt } from './kit';

export interface HudActions {
  upgrades(): void;
  pets(): void;
  dex(): void;
  map(): void;
  quests(): void;
  golden(): void;
  mystery(): void;
  auto(): void;
  boss(): void;
  egg(i: number): void;
  sound(): void;
}

function pill(scene: Phaser.Scene, w: number, icon: string) {
  const t = shapeTexture(scene, `pill|${w}`, w, 66, (g) => drawChunky(g, w, 66, 0xfff6e6, 30, 6, false, 5), 6);
  const bg = scene.add.image(0, 0, t.key).setScale(1 / t.res);
  const ic = art(scene, -w / 2 + 30, -4, icon);
  ic.setScale(fitScale(icon, 62));
  const label = txt(scene, 18, -4, '0', 36, { color: '#3b2a4d', stroke: false });
  const c = scene.add.container(0, 0, [bg, ic, label]);
  return { c, label, icon: ic };
}

export class Hud {
  private coins: ReturnType<typeof pill>;
  private shownCoins = 0;
  sound: CButton;
  bottom: CButton[] = [];
  side: { quests: CButton; golden: CButton; mystery: CButton; auto: CButton };
  boss: CButton;
  eggs: { btn: CButton; egg: Phaser.GameObjects.Image; time: Phaser.GameObjects.Text; tier: number }[] = [];
  private chip: Phaser.GameObjects.Container;
  /** WANTED poster and next-goal tracker, the row under the status chip. */
  private wanted: Phaser.GameObjects.Container;
  private wantedFish: Phaser.GameObjects.Image;
  private wantedShown = '';
  private goal: Phaser.GameObjects.Container;
  private goalText: Phaser.GameObjects.Text;
  private goalBar: Phaser.GameObjects.Graphics;
  private goalIcon: Phaser.GameObjects.Image;
  private goalShown = '';
  private portrait = true;
  private wDesign = 720;
  private chipText: Phaser.GameObjects.Text;
  private meter: Phaser.GameObjects.Container;
  private meterG: Phaser.GameObjects.Graphics;
  private meterText: Phaser.GameObjects.Text;
  private meterSub: Phaser.GameObjects.Text;
  private progG: Phaser.GameObjects.Graphics;
  private progFish: Phaser.GameObjects.Image;
  private hint: Phaser.GameObjects.Container;
  private hintT = 0;
  private t = 0;
  /** Containers of HUD parts, so popups can hide them. */
  root: Phaser.GameObjects.Container;
  bossBar: Phaser.GameObjects.Container;
  private bossG: Phaser.GameObjects.Graphics;
  private bossName: Phaser.GameObjects.Text;
  meterW = 470;

  constructor(
    private scene: Phaser.Scene,
    private s: SaveData,
    public act: HudActions,
  ) {
    this.root = scene.add.container(0, 0).setDepth(100);
    this.coins = pill(scene, 210, 'item:coin');
    this.sound = roundButton(scene, 0, 0, 'icon:i_gear', 80, COLORS.blue, () => act.sound());
    const b = (icon: string, label: string, color: number, fn: () => void) => new CButton(scene, 0, 0, { w: 160, h: 112, icon, iconSize: 60, label, fontSize: 26, color, stack: true, onClick: fn });
    this.bottom = [b('icon:i_up', t('hud.upgrade'), COLORS.orange, act.upgrades), b('icon:i_paw', t('hud.pets'), COLORS.pink, act.pets), b('icon:i_book', t('hud.fishdex'), COLORS.blue, act.dex), b('icon:i_map', t('hud.map'), COLORS.green, act.map)];
    this.side = {
      quests: roundButton(scene, 0, 0, 'icon:i_quest', 84, COLORS.yellow, act.quests),
      golden: roundButton(scene, 0, 0, 'icon:i_bait', 84, 0xffc83d, act.golden, true),
      mystery: roundButton(scene, 0, 0, 'icon:i_gift', 84, COLORS.purple, act.mystery, true),
      auto: roundButton(scene, 0, 0, 'icon:i_auto', 84, COLORS.grey, act.auto),
    };
    this.boss = new CButton(scene, 0, 0, { w: 260, h: 92, icon: 'icon:i_crown', label: t('hud.boss'), fontSize: 40, color: COLORS.red, onClick: act.boss });
    this.boss.setGlow(true).setVisible(false);
    for (let i = 0; i < 4; i++) {
      const btn = new CButton(scene, 0, 0, { w: 96, h: 104, color: 0xfff6e6, onClick: () => act.egg(i) });
      const egg = art(scene, 0, -10, 'egg:0', 0.42);
      const time = txt(scene, 0, 34, '', 24);
      btn.add([egg, time]);
      this.eggs.push({ btn, egg, time, tier: 0 });
    }
    this.chipText = txt(scene, 0, -3, '', 26);
    const chipBg = scene.add.graphics();
    this.chip = scene.add.container(0, 0, [chipBg, this.chipText]).setVisible(false);

    // Meter: cast power while charging, line tension while reeling.
    this.meterG = scene.add.graphics();
    this.progG = scene.add.graphics();
    this.progFish = art(scene, 0, 0, 'fish:pebble_minnow', 0.3);
    this.meterText = txt(scene, 0, -62, '', 38);
    this.meterSub = txt(scene, 0, 52, '', 24);
    this.meter = scene.add.container(0, 0, [this.progG, this.progFish, this.meterG, this.meterText, this.meterSub]).setVisible(false).setDepth(120);

    const hand = scene.add.graphics();
    drawHand(hand);
    // Desktop players get the keyboard hint, touch players the finger hint (Poki: adaptive controls).
    const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const hintText = txt(scene, 0, 80, touch ? t('hud.hintTouch') : t('hud.hintMouse'), 34);
    this.hint = scene.add.container(0, 0, [hand, hintText]).setDepth(110).setVisible(false);

    this.bossG = scene.add.graphics();
    this.bossName = txt(scene, 0, -40, '', 32);
    this.bossBar = scene.add.container(0, 0, [this.bossG, this.bossName]).setDepth(120).setVisible(false);

    // WANTED poster: a small cream card with the fish and "x3".
    const wt = shapeTexture(scene, 'wanted', 250, 76, (g) => drawChunky(g, 250, 76, 0xfff1c9, 22, 6, false, 4.5), 6);
    const wantedBg = scene.add.image(0, 0, wt.key).setScale(1 / wt.res);
    this.wantedFish = art(scene, -76, -4, 'fish:pebble_minnow');
    const wantedLabel = fitText(txt(scene, 34, -18, t('wanted.label'), 22, { color: '#c0392b', stroke: false }), 140);
    const wantedReward = fitText(txt(scene, 34, 10, t('wanted.reward'), 22, { color: '#3b2a4d', stroke: false }), 140);
    this.wanted = scene.add.container(0, 0, [wantedBg, this.wantedFish, wantedLabel, wantedReward]).setVisible(false);
    // Goal tracker: icon, short text, thin progress bar.
    const goalBg = scene.add.graphics();
    goalBg.fillStyle(INK, 0.55).fillRoundedRect(-150, -32, 300, 64, 22);
    this.goalIcon = art(scene, -122, -2, 'icon:i_book');
    this.goalIcon.setScale(fitScale('icon:i_book', 40));
    this.goalText = txt(scene, 14, -10, '', 22);
    this.goalBar = scene.add.graphics().setPosition(14, 16);
    this.goal = scene.add.container(0, 0, [goalBg, this.goalIcon, this.goalText, this.goalBar]).setVisible(false);
    this.root.add([this.wanted, this.goal]);
    this.root.add([this.coins.c, this.sound, ...this.bottom, this.side.quests, this.side.golden, this.side.mystery, this.side.auto, this.boss, ...this.eggs.map((e) => e.btn), this.chip]);
    this.shownCoins = s.coins;
    this.coins.label.setText(fmt(s.coins));
  }

  /** Where coins fly to. */
  coinTarget() {
    return { x: this.coins.c.x - 75, y: this.coins.c.y };
  }
  gemTarget() {
    return this.coinTarget();
  }
  eggTarget() {
    const e = this.eggs.find((q) => q.btn.visible) ?? this.eggs[0];
    return { x: e.btn.x, y: e.btn.y };
  }

  bumpCoins() {
    this.bump(this.coins.icon);
  }
  bumpGems() {
    this.bumpCoins();
  }
  private bump(icon: Phaser.GameObjects.Image) {
    const base = ((icon as unknown as { __base?: number }).__base ??= icon.scale);
    this.scene.tweens.killTweensOf(icon);
    icon.setScale(base * 1.25);
    this.scene.tweens.add({ targets: icon, scale: base, duration: 140, ease: 'Back.Out' });
  }

  layout(w: number, h: number) {
    const portrait = h > w;
    const top = portrait ? 58 : 50;
    this.coins.c.setPosition(w / 2, top);
    this.sound.setPosition(w - 56, top);
    if (portrait) {
      const bw = Math.min(166, (w - 40) / 4 - 8);
      this.bottom.forEach((b, i) => b.setPosition(w / 2 + (i - 1.5) * (bw + 10), h - 78));
    } else {
      this.bottom.forEach((b, i) => b.setPosition(w / 2 + (i - 1.5) * 176, h - 66));
    }
    const sx = portrait ? 60 : 62;
    // Below Poki's pill (top-left on phones, 62 px tall at a 24 px offset).
    const sy = portrait ? 250 : 150;
    const step = portrait ? 104 : 96;
    [this.side.quests, this.side.golden, this.side.mystery, this.side.auto].forEach((b, i) => b.setPosition(sx, sy + i * step));
    this.portrait = portrait;
    this.wDesign = w;
    this.boss.setPosition(w / 2, portrait ? 292 : 252);
    this.placeStrip();
    this.chip.setPosition(w / 2, portrait ? 132 : 112);
    this.eggs.forEach((e, i) => e.btn.setPosition(w - 60, (portrait ? 170 : 150) + i * 116));
    this.meter.setPosition(w / 2, portrait ? h - 250 : h - 175);
    // Keep the hint text on screen whatever its length (translations).
    const hintText = this.hint.list[1] as Phaser.GameObjects.Text;
    fitText(hintText, w - 48);
    const half = (hintText.width * hintText.scaleX) / 2;
    const hx = Phaser.Math.Clamp(w * (portrait ? 0.66 : 0.62), half + 24, w - half - 24);
    this.hint.setPosition(hx, portrait ? h * 0.62 : h * 0.6);
    this.bossBar.setPosition(w / 2, portrait ? 170 : 130);
  }

  update(dt: number, f: Fishing, extra: { autoOn: boolean; autoUnlocked: boolean; goldenIn: number; goldenLeft: number; mysteryIn: number; lucky: boolean; questBadge: number; canUpgrade: boolean; petBadge: boolean; dexBadge: boolean; mapBadge: boolean; bossReady: boolean; showHint: boolean; adsOk: boolean; wanted: string | null; wantedKnown: boolean; goal: { icon: string; text: string; progress: number } | null }) {
    this.t += dt;
    const s = this.s;
    // Count-up numbers.
    if (this.shownCoins !== s.coins) {
      const diff = s.coins - this.shownCoins;
      this.shownCoins += Math.abs(diff) < 2 ? diff : diff * Math.min(1, dt * 10);
      if (Math.abs(s.coins - this.shownCoins) < 0.5) this.shownCoins = s.coins;
      this.coins.label.setText(fmt(Math.round(this.shownCoins)));
    }
    // Eggs.
    this.eggs.forEach((e, i) => {
      const open = i < s.incubatorSlots;
      const egg = s.eggs[i];
      const visible = open && (!!egg || i === 0 || s.stats.eggs > 0);
      e.btn.setVisible(visible && s.stats.eggs > 0);
      if (!egg) {
        e.egg.setAlpha(0.25);
        e.time.setText(i === 0 ? '' : '');
        e.btn.setGlow(false);
        return;
      }
      if (e.tier !== egg.tier || e.egg.alpha !== 1) {
        e.tier = egg.tier;
        setArt(e.egg, `egg:${egg.tier}`, 0.42);
        e.egg.setAlpha(1);
      }
      if (egg.left <= 0) {
        fitText(e.time.setText(t('hud.hatch')), 88);
        e.egg.setAngle(Math.sin(this.t * 14) * 10 * (Math.sin(this.t * 2) > 0 ? 1 : 0));
        e.btn.setGlow(true);
      } else {
        const sec = Math.ceil(egg.left);
        fitText(e.time.setText(sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : `${sec}s`), 88);
        e.egg.setAngle(Math.sin(this.t * 3) * 3 * (1 - egg.left / HATCH_SEC[egg.tier]));
        e.btn.setGlow(false);
      }
    });
    // Side buttons.
    const tutDone = s.tutorial.includes('done');
    this.side.quests.setVisible(s.quests.list.length > 0 && (tutDone || s.stats.playSec > 180)).setBadge(extra.questBadge);
    this.side.golden.setVisible(tutDone && extra.adsOk && extra.goldenLeft <= 0);
    // Offers are gated by game state, never by an ad timer: bait while not already active, an egg while a slot is free.
    const freeSlot = s.eggs.some((e, i) => i < s.incubatorSlots && !e);
    this.side.mystery.setVisible(tutDone && extra.adsOk && s.stats.catches >= 12 && freeSlot);
    this.side.auto.setVisible(extra.autoUnlocked).setColor(extra.autoOn ? COLORS.green : COLORS.grey);
    this.boss.setVisible(extra.bossReady && !f.busy);
    this.bottom[0].setGlow(extra.canUpgrade && !f.busy).setBadge(extra.canUpgrade ? -1 : 0);
    this.bottom[1].setBadge(extra.petBadge ? -1 : 0);
    this.bottom[2].setBadge(extra.dexBadge ? -1 : 0);
    this.bottom[3].setBadge(extra.mapBadge ? -1 : 0).setGlow(extra.mapBadge && !f.busy);
    // Status chip: golden bait / lucky cast.
    let chip = '';
    if (extra.goldenLeft > 0) chip = t('hud.goldenChip', { t: `${Math.floor(extra.goldenLeft / 60)}:${String(Math.floor(extra.goldenLeft % 60)).padStart(2, '0')}` });
    else if (extra.lucky) chip = t('hud.luckyChip');
    if (extra.autoOn) chip = chip ? chip : t('hud.autoChip');
    if (f.target.boss && f.busy) chip = '';
    this.setChip(chip);
    this.wanted.setVisible(!!extra.wanted && !f.target.boss);
    if (extra.wanted && extra.wanted !== this.wantedShown) {
      this.wantedShown = extra.wanted;
      const key = `fish:${extra.wanted}`;
      this.wantedFish.setTexture(key).setScale(fitScale(key, 96));
      if (extra.wantedKnown) this.wantedFish.clearTint().setAlpha(1);
      else this.wantedFish.setTint(0x3b2a4d).setTintMode(Phaser.TintModes.FILL).setAlpha(0.55);
      this.wantedPop = true;
      this.scene.tweens.add({ targets: this.wanted, scale: { from: 1.25 * this.stripScale, to: this.stripScale }, duration: 380, ease: 'Back.Out', onComplete: () => (this.wantedPop = false) });
    }
    this.setGoal(extra.goal && !extra.bossReady && !f.target.boss ? extra.goal : null);
    this.placeStrip();
    // Idle hint.
    this.hintT = extra.showHint && f.phase === 'ready' ? this.hintT + dt : 0;
    this.hint.setVisible(this.hintT > 2.5);
    if (this.hint.visible) {
      const press = Math.max(0, Math.sin(this.t * 4));
      (this.hint.list[0] as Phaser.GameObjects.Graphics).setPosition(0, press * 8);
    }
    this.drawMeter(f);
  }

  private goalIconKey = '';
  private setGoal(g: { icon: string; text: string; progress: number } | null) {
    const key = g ? `${g.icon}|${g.text}|${Math.round(g.progress * 100)}` : '';
    if (key === this.goalShown) return;
    this.goalShown = key;
    this.goal.setVisible(!!g);
    if (!g) return;
    if (g.icon !== this.goalIconKey) {
      this.goalIconKey = g.icon;
      this.goalIcon.setTexture(g.icon).setScale(fitScale(g.icon, 40));
    }
    fitText(this.goalText.setText(g.text), 230);
    drawBar(this.goalBar, 230, 10, g.progress, 0xffd23f, 0x5a4a6a);
  }

  /** WANTED and goal side by side when both show, centred otherwise. */
  private placeStrip() {
    const y = this.portrait ? 206 : 178;
    const both = this.wanted.visible && this.goal.visible;
    const cx = this.wDesign / 2;
    // Portrait is narrow between the side buttons: shrink the pair so both fit.
    const k = both && this.portrait ? 0.84 : 1;
    this.stripScale = k;
    const gap = 12;
    const total = (250 + 300) * k + gap;
    const x0 = cx - total / 2;
    if (!this.wantedPop) this.wanted.setScale(k);
    this.goal.setScale(k);
    this.wanted.setPosition(both ? x0 + 125 * k : cx, y);
    this.goal.setPosition(both ? x0 + 250 * k + gap + 150 * k : cx, y);
  }

  private stripScale = 1;
  private wantedPop = false;
  private chipShown = '';
  private setChip(s: string) {
    if (s === this.chipShown) return;
    this.chipShown = s;
    this.chip.setVisible(!!s);
    if (!s) return;
    this.chipText.setText(s);
    const g = this.chip.list[0] as Phaser.GameObjects.Graphics;
    const w = this.chipText.width + 40;
    g.clear().fillStyle(INK, 0.55).fillRoundedRect(-w / 2, -24, w, 48, 24);
  }

  private drawMeter(f: Fishing) {
    const show = f.phase === 'charging' || f.phase === 'reeling';
    this.meter.setVisible(show);
    if (!show) return;
    const g = this.meterG;
    const w = this.meterW;
    const h = 44;
    g.clear();
    g.fillStyle(INK, 1).fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, (h + 10) / 2);
    this.progG.clear();
    if (f.phase === 'charging') {
      const segs: [number, number, number][] = [
        [0, 0.4, 0x8fb8d8],
        [0.4, 0.8, 0x5fd38d],
        [0.8, 1, 0xffc83d],
      ];
      for (const [a, b, c] of segs) g.fillStyle(c, 1).fillRect(-w / 2 + a * w, -h / 2, (b - a) * w, h);
      g.lineStyle(3, INK, 0.6).lineBetween(-w / 2 + 0.4 * w, -h / 2, -w / 2 + 0.4 * w, h / 2).lineBetween(-w / 2 + 0.8 * w, -h / 2, -w / 2 + 0.8 * w, h / 2);
      const x = -w / 2 + f.power * w;
      g.fillStyle(INK, 1).fillTriangle(x - 16, -h / 2 - 22, x + 16, -h / 2 - 22, x, -h / 2 + 4);
      g.fillStyle(0xffffff, 1).fillTriangle(x - 10, -h / 2 - 18, x + 10, -h / 2 - 18, x, -h / 2);
      g.fillStyle(0xffffff, 1).fillRect(x - 3, -h / 2, 6, h);
      const zone = f.power < 0.4 ? 0 : f.power < 0.8 ? 1 : 2;
      this.meterText.setText(t(['hud.near', 'hud.far', 'hud.superFar'][zone]));
      this.meterSub.setText(t('hud.castSub', { m: [1, 1.5, 2.5][zone] }));
      this.progFish.setVisible(false);
      return;
    }
    // Reeling: green zone, red end, marker for tension.
    g.fillStyle(0xf4e6cc, 1).fillRect(-w / 2, -h / 2, w, h);
    const [lo, hi] = f.greenRange;
    g.fillStyle(0x5fd38d, 1).fillRect(-w / 2 + lo * w, -h / 2, (hi - lo) * w, h);
    g.fillStyle(0xffd23f, 1).fillRect(-w / 2 + hi * w, -h / 2, (RED_AT - hi) * w, h);
    g.fillStyle(0xff5a5a, 1).fillRect(-w / 2 + RED_AT * w, -h / 2, (1 - RED_AT) * w, h);
    const x = -w / 2 + f.tension * w;
    g.fillStyle(INK, 1).fillRoundedRect(x - 9, -h / 2 - 12, 18, h + 24, 8);
    g.fillStyle(0xffffff, 1).fillRoundedRect(x - 5, -h / 2 - 8, 10, h + 16, 5);
    const red = f.tension >= RED_AT;
    // A pull is coming: flash the frame and tell the player to let go.
    if (f.warning && Math.sin(this.t * 30) > -0.2) g.lineStyle(6, 0xff8a3d, 1).strokeRoundedRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, (h + 16) / 2);
    const alert = red || f.warning;
    this.meterText.setText(alert ? t('hud.letGo') : f.holding ? t('hud.reeling') : t('hud.holdReel'));
    this.meterText.setColor(red ? '#ff5a5a' : f.warning ? '#ffb15a' : '#ffffff');
    this.meterText.setScale(alert ? 1 + Math.sin(this.t * 20) * 0.08 : 1);
    this.meterSub.setText(f.target.boss ? t('hud.bossSub') : '');
    // Progress track above.
    if (!f.target.boss) {
      const pw = w;
      const py = -100;
      this.progG.fillStyle(INK, 0.55).fillRoundedRect(-pw / 2, py - 7, pw, 14, 7);
      this.progG.fillStyle(0x7fe0ff, 1).fillRoundedRect(-pw / 2, py - 7, Math.max(14, pw * f.progress), 14, 7);
      this.progFish.setVisible(true).setPosition(-pw / 2 + pw * f.progress, py - 2);
      this.meterText.setY(-140);
    } else {
      this.progFish.setVisible(false);
      this.meterText.setY(-62);
    }
  }

  /** Sets the small fish icon on the progress track. */
  setProgressIcon(key: string) {
    setArt(this.progFish, key, 0.3);
    this.progFish.setScale(fitScale(key, 70)).setTint(0x10243d).setTintMode(Phaser.TintModes.FILL);
  }

  /** Boss health (1 - progress). */
  drawBoss(name: string, hp: number, phase: number) {
    this.bossBar.setVisible(true);
    this.bossName.setText(`${name}${phase > 0 ? `  ·  ${t('hud.phase', { n: phase + 1 })}` : ''}`);
    const g = this.bossG;
    const w = 460;
    const h = 30;
    g.clear();
    g.fillStyle(INK, 1).fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, (h + 10) / 2);
    g.fillStyle(0x5a2340, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.fillStyle(0xff4d6d, 1).fillRoundedRect(-w / 2, -h / 2, Math.max(h, w * hp), h, h / 2);
    g.fillStyle(0xffffff, 0.3).fillRoundedRect(-w / 2 + 6, -h / 2 + 4, Math.max(10, w * hp - 12), 7, 4);
  }

  hideBoss() {
    this.bossBar.setVisible(false);
  }

  /** The top-right button opens settings (sound, language); kept for API compatibility. */
  setSoundIcon(_muted: boolean) {}

  /** Dims the HUD while a popup shows. */
  setVisible(v: boolean) {
    this.root.setVisible(v);
  }
}

/** Pointing hand for hints, drawn with the art's outline style. */
export function drawHand(g: Phaser.GameObjects.Graphics) {
  g.clear();
  const outline = (fill: number, fn: (lw: number) => void) => {
    g.fillStyle(INK, 1);
    fn(5);
    g.fillStyle(fill, 1);
    fn(0);
  };
  // finger
  outline(0xffffff, (o) => g.fillRoundedRect(-11 - o, -40 - o, 22 + o * 2, 54 + o * 2, 11 + o));
  // palm
  outline(0xffffff, (o) => g.fillRoundedRect(-24 - o, -2 - o, 54 + o * 2, 50 + o * 2, 18 + o));
  g.fillStyle(0xffe1d0, 1).fillRoundedRect(-18, 10, 42, 30, 12);
  g.lineStyle(3, INK, 0.5).lineBetween(-2, 4, -2, 18).lineBetween(12, 4, 12, 18);
}
