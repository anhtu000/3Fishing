// Everything on top of the pond: currencies, incubator, side buttons, the bottom bar, the
// cast/tension meter and the idle hint. Kept clear of the top-left corner (Poki's pill on phones).
import Phaser from 'phaser';
import { shapeTexture } from '@core';
import { HATCH_SEC, NEST_INDEX, eggKey } from '../content/data';
import type { Fishing } from '../logic/fishing';
import { RED_AT } from '../logic/fishing';
import type { SaveData } from '../logic/model';
import { t } from '../i18n/t';
import { hatchSecLeft } from '../logic/rules';
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
  /** Portrait: the one incubator button (hatch a ready egg, else open the incubator panel). */
  eggs(): void;
  basket(): void;
  challenges(): void;
  exitChallenge(): void;
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
  side: { quests: CButton; golden: CButton; mystery: CButton; auto: CButton; challenge: CButton; more: CButton };
  /** Late game: auto fishing and challenges sit behind one "more" button that opens to the side. */
  private moreOpen = false;
  private grouped = false;
  private moreTimer: Phaser.Time.TimerEvent | null = null;
  private chBar!: Phaser.GameObjects.Container;
  private chTime!: Phaser.GameObjects.Text;
  private chFish!: Phaser.GameObjects.Text;
  private chKinds!: Phaser.GameObjects.Text;
  /** v1.16: one slot per species the challenge needs, filled with the species caught so far. */
  private chSlots!: Phaser.GameObjects.Graphics;
  private chIcons: Phaser.GameObjects.Image[] = [];
  private chShown = '';
  private chExit!: CButton;
  boss: CButton;
  eggs: { btn: CButton; egg: Phaser.GameObjects.Image; time: Phaser.GameObjects.Text; key: string }[] = [];
  private chip: Phaser.GameObjects.Container;
  /** WANTED poster and next-goal tracker, the row under the status chip. */
  private wanted: Phaser.GameObjects.Container;
  private wantedBg!: Phaser.GameObjects.Image;
  private wantedLabel!: Phaser.GameObjects.Text;
  private wantedReward!: Phaser.GameObjects.Text;
  private wantedToday = false;
  private wantedFish: Phaser.GameObjects.Image;
  private wantedShown = '';
  private wantedLeftShown = -1;
  private goal: Phaser.GameObjects.Container;
  private goalText: Phaser.GameObjects.Text;
  private goalBar: Phaser.GameObjects.Graphics;
  private goalIcon: Phaser.GameObjects.Image;
  private goalShown = '';
  private portrait = true;
  private wDesign = 720;
  private hDesign = 1280;
  /** Egg basket: eggs waiting for a free incubator slot (count on the button). */
  basket!: CButton;
  /**
   * Portrait phones: one incubator button instead of the egg column, so the column never covers
   * the pets on the water (5 pets + 4 slots + nest + basket used to reach past the waterline).
   * It shows the egg closest to hatching, a row of dots (one per slot) and the basket count.
   */
  private hub!: CButton;
  private hubEgg!: Phaser.GameObjects.Image;
  private hubTime!: Phaser.GameObjects.Text;
  private hubKey = '';
  private hubPips!: Phaser.GameObjects.Graphics;
  private hubPipsKey = '';
  private compact = false;
  private basketCount!: Phaser.GameObjects.Text;
  private chipText: Phaser.GameObjects.Text;
  private meter: Phaser.GameObjects.Container;
  private meterG: Phaser.GameObjects.Graphics;
  private meterText: Phaser.GameObjects.Text;
  private meterSub: Phaser.GameObjects.Text;
  /** "Line" label in front of the line wear segments under the tension meter. */
  private wearLabel!: Phaser.GameObjects.Text;
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
      challenge: roundButton(scene, 0, 0, 'icon:i_trophy', 84, COLORS.purple, () => {
        this.closeMore();
        act.challenges();
      }),
      more: roundButton(scene, 0, 0, 'icon:i_more', 84, COLORS.teal, () => this.toggleMore()),
    };
    // Challenge run: timer, fish and kinds against the goal, and a way out.
    const chBg = scene.add.graphics();
    chBg.fillStyle(INK, 0.62).fillRoundedRect(-230, -40, 460, 80, 26);
    this.chTime = txt(scene, -150, 0, '', 34, { color: '#ffe066' });
    this.chFish = txt(scene, 10, 0, '', 28);
    this.chKinds = txt(scene, 150, 0, '', 28);
    this.chExit = new CButton(scene, 268, 0, { w: 64, h: 64, label: 'X', fontSize: 30, color: COLORS.red, onClick: act.exitChallenge });
    this.chSlots = scene.add.graphics();
    for (let i = 0; i < 9; i++) this.chIcons.push(scene.add.image(0, 0, '__DEFAULT').setVisible(false));
    this.chBar = scene.add.container(0, 0, [chBg, this.chTime, this.chFish, this.chKinds, this.chExit, this.chSlots, ...this.chIcons]).setVisible(false);
    this.boss = new CButton(scene, 0, 0, { w: 260, h: 92, icon: 'icon:i_crown', label: t('hud.boss'), fontSize: 40, color: COLORS.red, onClick: act.boss });
    this.boss.setGlow(true).setVisible(false);
    // Four incubator slots, then the overnight nest (index 4, a nest-coloured button).
    for (let i = 0; i < 5; i++) {
      const btn = new CButton(scene, 0, 0, { w: 96, h: 104, color: i === 4 ? 0xe9c98f : 0xfff6e6, onClick: () => act.egg(i) });
      const egg = art(scene, 0, -10, 'egg:0', 0.42);
      const time = txt(scene, 0, 34, '', 24);
      btn.add([egg, time]);
      this.eggs.push({ btn, egg, time, key: '' });
    }
    this.basket = new CButton(scene, 0, 0, { w: 96, h: 96, color: 0xf3dfb8, onClick: () => act.basket() });
    const bIcon = art(scene, 0, -8, 'icon:i_basket');
    bIcon.setScale(fitScale('icon:i_basket', 66));
    this.basketCount = txt(scene, 0, 32, '', 26);
    this.basket.add([bIcon, this.basketCount]);
    this.basket.setVisible(false);
    this.hub = new CButton(scene, 0, 0, { w: 96, h: 104, color: 0xfff6e6, onClick: () => act.eggs() });
    this.hubEgg = art(scene, 0, -10, 'egg:0', 0.42);
    this.hubTime = txt(scene, 0, 34, '', 24);
    this.hub.add([this.hubEgg, this.hubTime]);
    this.hub.setVisible(false);
    this.hubPips = scene.add.graphics().setVisible(false);
    this.chipText = txt(scene, 0, -3, '', 26);
    const chipBg = scene.add.graphics();
    this.chip = scene.add.container(0, 0, [chipBg, this.chipText]).setVisible(false);

    // Meter: cast power while charging, line tension while reeling.
    this.meterG = scene.add.graphics();
    this.progG = scene.add.graphics();
    this.progFish = art(scene, 0, 0, 'fish:pebble_minnow', 0.3);
    this.meterText = txt(scene, 0, -62, '', 38);
    this.meterSub = txt(scene, 0, 52, '', 24);
    this.wearLabel = txt(scene, 0, 0, t('upg.line'), 22).setOrigin(1, 0.5).setVisible(false);
    this.meter = scene.add.container(0, 0, [this.progG, this.progFish, this.meterG, this.meterText, this.meterSub, this.wearLabel]).setVisible(false).setDepth(120);

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
    this.wantedLabel = txt(scene, 34, -18, t('wanted.label'), 22, { color: '#c0392b', stroke: false });
    this.wantedReward = txt(scene, 34, 10, t('wanted.reward'), 22, { color: '#3b2a4d', stroke: false });
    this.wantedBg = wantedBg;
    this.wanted = scene.add.container(0, 0, [wantedBg, this.wantedFish, this.wantedLabel, this.wantedReward]).setVisible(false);
    // Goal tracker: icon, short text, thin progress bar.
    const goalBg = scene.add.graphics();
    goalBg.fillStyle(INK, 0.55).fillRoundedRect(-150, -32, 300, 64, 22);
    this.goalIcon = art(scene, -122, -2, 'icon:i_book');
    this.goalIcon.setScale(fitScale('icon:i_book', 40));
    this.goalText = txt(scene, 14, -10, '', 22);
    this.goalBar = scene.add.graphics().setPosition(14, 16);
    this.goal = scene.add.container(0, 0, [goalBg, this.goalIcon, this.goalText, this.goalBar]).setVisible(false);
    this.root.add([this.wanted, this.goal]);
    this.root.add([this.coins.c, this.sound, ...this.bottom, this.side.quests, this.side.golden, this.side.mystery, this.side.auto, this.side.challenge, this.side.more, this.chBar, this.boss, ...this.eggs.map((e) => e.btn), this.basket, this.hub, this.hubPips, this.chip]);
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
  basketTarget() {
    if (this.compact) return { x: this.hub.x, y: this.hub.y };
    if (this.basket.visible) return { x: this.basket.x, y: this.basket.y };
    return this.eggTarget();
  }

  eggTarget() {
    if (this.compact) return { x: this.hub.x, y: this.hub.y };
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

  private sideX = 60;
  private sideY = 250;
  private sideStep = 104;
  /** Size of the left column buttons (smaller on phones, v1.16). */
  private sideScale = 1;

  /** Left column: the visible buttons stacked without gaps; the grouped modes open to the right of "more". */
  private placeSide() {
    const col = [this.side.quests, this.side.golden, this.grouped ? this.side.more : null, this.grouped ? null : this.side.auto, this.grouped ? null : this.side.challenge];
    let i = 0;
    for (const b of col) {
      if (!b || !b.visible) continue;
      b.setPosition(this.sideX, this.sideY + i * this.sideStep);
      i++;
    }
    if (this.grouped) {
      // Opens downwards, over the water at the edge, never over the cat.
      const m = this.side.more;
      this.side.auto.setPosition(m.x, m.y + this.sideStep);
      this.side.challenge.setPosition(m.x, m.y + this.sideStep * 2);
    }
  }

  private toggleMore() {
    if (this.moreOpen) return this.closeMore();
    this.moreOpen = true;
    this.side.more.setColor(COLORS.blue);
    for (const b of [this.side.auto, this.side.challenge]) {
      b.setVisible(true).setScale(0.4 * this.sideScale).setAlpha(0);
      this.scene.tweens.add({ targets: b, scale: this.sideScale, alpha: 1, duration: 180, ease: 'Back.Out' });
    }
    this.placeSide();
    // Folds back by itself after a while, so it never stays over the pond.
    this.moreTimer?.remove();
    this.moreTimer = this.scene.time.delayedCall(5000, () => this.closeMore());
  }

  closeMore() {
    this.moreTimer?.remove();
    this.moreTimer = null;
    if (!this.moreOpen) return;
    this.moreOpen = false;
    this.side.more.setColor(COLORS.teal);
    if (this.grouped) {
      this.side.auto.setVisible(false);
      this.side.challenge.setVisible(false);
    }
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
    // v1.16, phones: smaller buttons, moved up into the sky so the column ends above the dock and the
    // water (was 84 px from y 250, the third button sat on the dock). The first one still starts below
    // Poki's pill (top-left on phones, 62 px tall at a 24 px offset = 86 CSS px: 172 design units on a
    // 360 px wide phone, where 720 units span the width); its top edge is at 214 - 36 = 178.
    this.sideScale = portrait ? 0.86 : 1;
    for (const b of Object.values(this.side)) b.setScale(this.sideScale);
    this.sideX = portrait ? 54 : 62;
    // Landscape phones and tablets also have Poki's pill top-left (86 CSS px = 172 units on a 360 px tall
    // screen, where 720 units span the height); desktop has none, so its column starts higher.
    const touch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
    this.sideY = portrait || touch ? 214 : 150;
    this.sideStep = portrait ? 90 : 96;
    this.placeSide();
    this.chBar.setPosition(w / 2 - (portrait ? 20 : 0), portrait ? 206 : 178);
    this.chBar.setScale(portrait ? Math.min(1, (w - 230) / 600) : 1);
    this.portrait = portrait;
    this.wDesign = w;
    this.hDesign = h;
    this.boss.setPosition(w / 2, portrait ? 292 : 252);
    this.placeStrip();
    this.chip.setPosition(w / 2, portrait ? 132 : 112);
    this.eggY0 = portrait ? 170 : 150;
    this.eggs.forEach((e, i) => e.btn.setPosition(w - 60, this.eggY0 + i * 116));
    this.compact = portrait;
    this.hub.setPosition(w - 60, this.eggY0);
    this.hubPips.setPosition(w - 60, this.eggY0 + 68);
    this.meter.setPosition(w / 2, portrait ? h - 250 : h - 175);
    // Keep the hint text on screen whatever its length (translations).
    const hintText = this.hint.list[1] as Phaser.GameObjects.Text;
    fitText(hintText, w - 48);
    const half = (hintText.width * hintText.scaleX) / 2;
    const hx = Phaser.Math.Clamp(w * (portrait ? 0.66 : 0.62), half + 24, w - half - 24);
    this.hint.setPosition(hx, portrait ? h * 0.62 : h * 0.6);
    this.bossBar.setPosition(w / 2, portrait ? 170 : 130);
  }

  /** Portrait incubator button: hides the egg column and basket, shows one summary button. */
  private updateHub() {
    const s = this.s;
    this.eggs.forEach((e) => e.btn.setVisible(false));
    const slots: number[] = [];
    for (let i = 0; i < s.incubatorSlots; i++) slots.push(i);
    if (s.eggs[NEST_INDEX]) slots.push(NEST_INDEX);
    const show = s.stats.eggs > 0 || slots.some((i) => !!s.eggs[i]) || s.basket.length > 0;
    this.hub.setVisible(show);
    this.hubPips.setVisible(show);
    if (!show) return;
    const filled = slots.filter((i) => !!s.eggs[i]);
    const ready = filled.filter((i) => s.eggs[i]!.left <= 0);
    const free = slots.some((i) => i !== NEST_INDEX && !s.eggs[i]);
    // The egg to show: a ready one first, else the one closest to hatching.
    const pick = ready[0] ?? filled.sort((a, b) => s.eggs[a]!.left - s.eggs[b]!.left)[0];
    const egg = pick !== undefined ? s.eggs[pick] : null;
    if (!egg) {
      this.hubEgg.setAlpha(0.25).setAngle(0);
      this.hubTime.setText(s.basket.length > 0 ? '+' : '');
    } else {
      const key = eggKey(egg.tier, egg.pond);
      if (this.hubKey !== key || this.hubEgg.alpha !== 1) {
        this.hubKey = key;
        setArt(this.hubEgg, key, 0.42);
        this.hubEgg.setAlpha(1);
      }
      if (egg.left <= 0) {
        fitText(this.hubTime.setText(t('hud.hatch')), 88);
        this.hubEgg.setAngle(Math.sin(this.t * 14) * 10 * (Math.sin(this.t * 2) > 0 ? 1 : 0));
      } else {
        const sec = Math.ceil(hatchSecLeft(s, egg));
        const label = sec >= 3600 ? `${Math.floor(sec / 3600)}${t('unit.h')}${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}` : sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : `${sec}s`;
        fitText(this.hubTime.setText(label), 88);
        this.hubEgg.setAngle(Math.sin(this.t * 3) * 3 * (1 - egg.left / (egg.total || HATCH_SEC[egg.tier])));
      }
    }
    this.hub.setGlow(ready.length > 0 || (free && s.basket.length > 0));
    this.hub.setBadge(s.basket.length);
    // One dot per slot: green ready, cream warming, grey empty; the nest dot is nest-coloured.
    const states = slots.map((i) => (s.eggs[i] ? (s.eggs[i]!.left <= 0 ? 'r' : i === NEST_INDEX ? 'n' : 'w') : 'e'));
    const key = states.join('');
    if (key !== this.hubPipsKey) {
      this.hubPipsKey = key;
      const g = this.hubPips.clear();
      const step = 19;
      const x0 = -((states.length - 1) * step) / 2;
      const col = { r: 0x6fd678, w: 0xfff6e6, e: 0x9aa0b4, n: 0xe9c98f } as Record<string, number>;
      states.forEach((st, k) => {
        g.fillStyle(INK, 1).fillCircle(x0 + k * step, 0, 8.5);
        g.fillStyle(col[st], 1).fillCircle(x0 + k * step, 0, 6);
      });
    }
  }

  /** Challenge: the species caught so far, one per slot (empty slots for those still needed). */
  private drawKinds(ids: string[], goal: number) {
    // Small icon-size textures (sharp); the big fish art until they are drawn.
    const texOf = (id: string) => (this.scene.textures.exists(`fishs:${id}`) ? `fishs:${id}` : `fish:${id}`);
    const key = `${goal}|${ids.map(texOf).join(',')}`;
    if (key === this.chShown) return;
    this.chShown = key;
    const n = Math.min(this.chIcons.length, Math.max(goal, ids.length));
    const step = 74;
    const x0 = -((n - 1) * step) / 2;
    const y = 84;
    const g = this.chSlots.clear();
    g.fillStyle(INK, 0.5).fillRoundedRect(x0 - 44, y - 37, (n - 1) * step + 88, 74, 26);
    for (let i = 0; i < n; i++) {
      const done = i < ids.length;
      g.fillStyle(done ? 0xfffdf6 : 0xffffff, done ? 1 : 0.18).fillCircle(x0 + i * step, y, 31);
      g.lineStyle(4, done ? 0x2fae63 : 0xffffff, done ? 1 : 0.45).strokeCircle(x0 + i * step, y, 31);
    }
    this.chIcons.forEach((img, i) => {
      const id = ids[i];
      if (!id || i >= n) return void img.setVisible(false);
      const tex = texOf(id);
      img.setTexture(tex).setScale(fitScale(tex, 56)).setPosition(x0 + i * step, y).setVisible(true);
    });
  }

  update(dt: number, f: Fishing, extra: { autoOn: boolean; autoUnlocked: boolean; goldenIn: number; goldenLeft: number; mysteryIn: number; lucky: boolean; questBadge: number; canUpgrade: boolean; petBadge: boolean; dexBadge: boolean; mapBadge: boolean; bossReady: boolean; showHint: boolean; adsOk: boolean; wanted: string | null; wantedKnown: boolean; wantedToday: boolean; wantedLeft: number | null; challengeOpen: boolean; challenge: { timeMs: number; fish: number; fishGoal: number; kinds: number; kindsGoal: number; kindIds: string[] } | null; gripLeft: number; goal: { icon: string; text: string; progress: number } | null }) {
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
    let row = 0;
    this.eggs.forEach((e, i) => {
      const nest = i === 4;
      const open = nest ? !!s.eggs[i] : i < s.incubatorSlots;
      const egg = s.eggs[i];
      const visible = open && (!!egg || i === 0 || s.stats.eggs > 0);
      e.btn.setVisible(visible && (s.stats.eggs > 0 || nest));
      // The nest sits right under the last open incubator slot.
      if (nest) e.btn.setY(this.eggY0 + Math.min(row, s.incubatorSlots) * 116);
      else row++;
      if (!egg) {
        // A free slot while the basket has eggs: "+" and a glow, tap to pick one.
        const pick = !nest && s.basket.length > 0;
        e.egg.setAlpha(0.25);
        e.time.setText(pick ? '+' : '');
        e.btn.setGlow(pick);
        return;
      }
      const key = eggKey(egg.tier, egg.pond);
      if (e.key !== key || e.egg.alpha !== 1) {
        e.key = key;
        setArt(e.egg, key, 0.42);
        e.egg.setAlpha(1);
      }
      if (egg.left <= 0) {
        fitText(e.time.setText(t('hud.hatch')), 88);
        e.egg.setAngle(Math.sin(this.t * 14) * 10 * (Math.sin(this.t * 2) > 0 ? 1 : 0));
        e.btn.setGlow(true);
      } else {
        const sec = Math.ceil(hatchSecLeft(s, egg));
        const label = sec >= 3600 ? `${Math.floor(sec / 3600)}${t('unit.h')}${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}` : sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : `${sec}s`;
        fitText(e.time.setText(label), 88);
        e.egg.setAngle(Math.sin(this.t * 3) * 3 * (1 - egg.left / (egg.total || HATCH_SEC[egg.tier])));
        e.btn.setGlow(false);
      }
    });
    // Basket: under the last egg button; beside the top one when the column is full (landscape).
    const nB = s.basket.length;
    this.basket.setVisible(nB > 0 && !this.compact);
    if (this.compact) this.updateHub();
    if (nB > 0 && !this.compact) {
      const shown = this.eggs.filter((e) => e.btn.visible);
      const below = (shown.length ? Math.max(...shown.map((e) => e.btn.y)) : this.eggY0 - 116) + 116;
      if (below + 60 < this.hDesign - (this.portrait ? 170 : 140)) this.basket.setPosition(this.wDesign - 60, below);
      else this.basket.setPosition(this.wDesign - 170, this.eggY0);
      this.basketCount.setText(`${nB}`);
      // Glow when a slot is free: pick an egg to incubate.
      this.basket.setGlow(s.eggs.some((e, i) => i < s.incubatorSlots && !e));
    }
    // Side buttons.
    const tutDone = s.tutorial.includes('done');
    this.side.quests.setVisible(s.quests.list.length > 0 && (tutDone || s.stats.playSec > 180)).setBadge(extra.questBadge);
    this.side.golden.setVisible(tutDone && extra.adsOk && extra.goldenLeft <= 0);
    // Offers are gated by game state, never by an ad timer: bait while not already active.
    // No ad for eggs here: the only egg ad is "hatch now" on an egg that is warming up.
    this.side.mystery.setVisible(false);
    const ch = extra.challenge;
    const autoOk = extra.autoUnlocked && !ch;
    const chOk = extra.challengeOpen && !ch;
    this.side.auto.setColor(extra.autoOn ? COLORS.green : COLORS.grey);
    // Both late-game modes open: one "more" button instead of two (a calmer left column).
    this.grouped = autoOk && chOk;
    if (!this.grouped) this.moreOpen = false;
    this.side.more.setVisible(this.grouped).setColor(this.moreOpen ? COLORS.blue : COLORS.teal);
    this.side.auto.setVisible(this.grouped ? this.moreOpen : autoOk);
    this.side.challenge.setVisible(this.grouped ? this.moreOpen : chOk);
    this.placeSide();
    this.chBar.setVisible(!!ch);
    if (ch) {
      const sec = Math.max(0, Math.ceil(ch.timeMs / 1000));
      this.chTime.setText(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`).setColor(sec <= 10 ? '#ff8a8a' : '#ffe066');
      this.chFish.setText(t('challenge.fishShort', { n: ch.fish, max: ch.fishGoal })).setColor(ch.fish >= ch.fishGoal ? '#7dffb0' : '#ffffff');
      this.chKinds.setText(t('challenge.kindsShort', { n: ch.kinds, max: ch.kindsGoal })).setColor(ch.kinds >= ch.kindsGoal ? '#7dffb0' : '#ffffff');
      fitText(this.chFish, 150);
      fitText(this.chKinds, 140);
      this.drawKinds(ch.kindIds, ch.kindsGoal);
    }
    this.boss.setVisible(extra.bossReady && !f.busy);
    this.bottom[0].setGlow(extra.canUpgrade && !f.busy).setBadge(extra.canUpgrade ? -1 : 0);
    this.bottom[1].setBadge(extra.petBadge ? -1 : 0);
    this.bottom[2].setBadge(extra.dexBadge ? -1 : 0);
    this.bottom[3].setBadge(extra.mapBadge ? -1 : 0).setGlow(extra.mapBadge && !f.busy);
    // Status chip: golden bait / lucky cast.
    let chip = '';
    const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
    if (extra.goldenLeft > 0) chip = t('hud.goldenChip', { t: mmss(extra.goldenLeft) });
    else if (extra.gripLeft > 0) chip = t('hud.gripChip', { t: mmss(extra.gripLeft) });
    else if (extra.lucky) chip = t('hud.luckyChip');
    if (extra.autoOn) chip = chip ? chip : t('hud.autoChip');
    if (f.target.boss && f.busy) chip = '';
    this.setChip(chip);
    this.wanted.setVisible(!!extra.wanted && !f.target.boss && !extra.challenge);
    // WANTED countdown (seconds before it swims off).
    if (extra.wanted && extra.wantedLeft !== null && extra.wantedLeft !== this.wantedLeftShown) {
      this.wantedLeftShown = extra.wantedLeft;
      fitText(this.wantedReward.setText(`${t('wanted.reward')} · ${extra.wantedLeft}s`).setScale(1), 140);
    }
    if (extra.wanted && (extra.wanted !== this.wantedShown || extra.wantedToday !== this.wantedToday)) {
      this.wantedShown = extra.wanted;
      this.wantedToday = extra.wantedToday;
      // Today's fish uses a gold poster: "TODAY'S FISH / x5 + egg".
      this.wantedBg.setTint(extra.wantedToday ? 0xffd86b : 0xffffff);
      fitText(this.wantedLabel.setText(t(extra.wantedToday ? 'today.label' : 'wanted.label')).setColor(extra.wantedToday ? '#b4521a' : '#c0392b').setScale(1), 140);
      fitText(this.wantedReward.setText(extra.wantedToday ? t('today.reward') : extra.wantedLeft !== null ? `${t('wanted.reward')} · ${extra.wantedLeft}s` : t('wanted.reward')).setScale(1), 140);
      const key = `fish:${extra.wanted}`;
      this.wantedFish.setTexture(key).setScale(fitScale(key, 96));
      if (extra.wantedKnown) this.wantedFish.clearTint().setAlpha(1);
      else this.wantedFish.setTint(0x3b2a4d).setTintMode(Phaser.TintModes.FILL).setAlpha(0.55);
      this.wantedPop = true;
      this.scene.tweens.add({ targets: this.wanted, scale: { from: 1.25 * this.stripScale, to: this.stripScale }, duration: 380, ease: 'Back.Out', onComplete: () => (this.wantedPop = false) });
    }
    this.setGoal(extra.goal && !extra.bossReady && !f.target.boss && !extra.challenge ? extra.goal : null);
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

  private eggY0 = 170;
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
    // Line wear (29/10): how much more time in the red the line can take before it snaps. Always
    // shown in boss fights, where wear adds up over the whole fight; on normal fish only once the
    // line is wearing. Five segments, green to red, flashing when one segment is left.
    const wear = f.lineWear;
    const showWear = f.target.boss || wear > 0.02;
    this.wearLabel.setVisible(showWear);
    this.meterSub.setY(showWear ? 84 : 52);
    if (showWear) {
      const left = 1 - wear;
      const segs = 5;
      const sw = 44;
      const gap = 6;
      const total = segs * sw + (segs - 1) * gap;
      const x0 = -total / 2 + 40;
      const y = 44;
      this.wearLabel.setPosition(x0 - 14, y);
      const lit = Math.ceil(left * segs - 1e-6);
      const col = left > 0.6 ? 0x5fd38d : left > 0.3 ? 0xffd23f : 0xff5a5a;
      const flash = lit <= 1 && Math.sin(this.t * 18) > 0;
      g.fillStyle(INK, 0.75).fillRoundedRect(x0 - 6, y - 12, total + 12, 24, 12);
      for (let i = 0; i < segs; i++) {
        const x = x0 + i * (sw + gap);
        const on = i < lit;
        g.fillStyle(on ? (flash ? 0xffffff : col) : 0x5a4a6a, 1).fillRoundedRect(x, y - 7, sw, 14, 7);
        // the last lit segment shows how much of it is left
        if (on && i === lit - 1) {
          const part = left * segs - (lit - 1);
          if (part < 0.999) g.fillStyle(0x5a4a6a, 1).fillRoundedRect(x + sw * part, y - 7, sw * (1 - part), 14, { tl: 0, bl: 0, tr: 7, br: 7 });
        }
      }
    }
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
  drawBoss(name: string, hp: number, phase: number, color = 0xff4d6d) {
    this.bossBar.setVisible(true);
    this.bossName.setText(`${name}${phase > 0 ? `  ·  ${t('hud.phase', { n: phase + 1 })}` : ''}`);
    const g = this.bossG;
    const w = 460;
    const h = 30;
    g.clear();
    g.fillStyle(INK, 1).fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, (h + 10) / 2);
    g.fillStyle(0x5a2340, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, Math.max(h, w * hp), h, h / 2);
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
