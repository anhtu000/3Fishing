// The living pond scene: sky, far bank, water, plants, swimming fish, lily pads, the dock and the
// pets that sit around it. Everything is laid out for the current screen and gently animated.
import Phaser from 'phaser';
import { app } from '@core';
import { pondById, petById, type FishDef, type PondDef } from '../content/data';
import { PALETTES } from '../render/scenery';
import { TEX } from '../render/textures';
import { art, fitScale, setArt, txt } from '../ui/kit';

export interface PondLayout {
  w: number;
  h: number;
  /** y of the water surface. */
  water: number;
  /** y where the sand starts. */
  floor: number;
  /** Dock deck top, and the x where the dock ends. */
  deckY: number;
  dockEnd: number;
  /** Cast range on the surface (x for power 0 and 1). */
  castNear: number;
  castFar: number;
}

interface Swimmer {
  img: Phaser.GameObjects.Image;
  speed: number;
  dir: number;
  y: number;
  phase: number;
  size: number;
  id: string;
  /** Cast zone the species lives in (FishDef.zone): it swims in that band of the pond (v1.16). */
  zone: number;
}

function hex(c: string) {
  return parseInt(c.slice(1), 16);
}

export class Pond {
  L!: PondLayout;
  private sky: Phaser.GameObjects.Graphics;
  private waterG: Phaser.GameObjects.Graphics;
  private sun: Phaser.GameObjects.Image;
  private clouds: Phaser.GameObjects.Image[] = [];
  private hillsFar!: Phaser.GameObjects.Image;
  /** One picture per pond on the far bank: cottage, waterfall, ice-fishing hut. */
  private landmark!: Phaser.GameObjects.Image;
  private aurora: Phaser.GameObjects.Image | null = null;
  /** Gold cup on the dock when every species of this pond has a gold medal. */
  private trophy: Phaser.GameObjects.Image | null = null;
  private hillsNear!: Phaser.GameObjects.Image;
  /** v1.15 shore: the far pale range, and light ambient life (birds, butterflies, chimney smoke). */
  private horizonImg!: Phaser.GameObjects.Image;
  private birds: { img: Phaser.GameObjects.Image; x: number; y: number; v: number; wait: number; ph: number; k: number }[] = [];
  private butterflies: { img: Phaser.GameObjects.Image; ph: number; cx: number; cy: number }[] = [];
  private smoke: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private trees: Phaser.GameObjects.Image[] = [];
  private reeds: Phaser.GameObjects.Image[] = [];
  private weeds: Phaser.GameObjects.Image[] = [];
  private rocks: Phaser.GameObjects.Image[] = [];
  private sand!: Phaser.GameObjects.Image;
  private rays: Phaser.GameObjects.Image[] = [];
  private surface!: Phaser.GameObjects.TileSprite;
  private lilies: Phaser.GameObjects.Image[] = [];
  private fogs: Phaser.GameObjects.Image[] = [];
  private flies: Phaser.GameObjects.Image[] = [];
  dock!: Phaser.GameObjects.Image;
  private swimmers: Swimmer[] = [];
  private seaBubbles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private snowFx: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private bossShadow: Phaser.GameObjects.Image | null = null;
  private bossShadowT = 0;
  /** Pets sitting on the dock or on lily pads. */
  pets: { id: string; img: Phaser.GameObjects.Image; baseY: number; t: number }[] = [];
  private t = 0;
  pond!: PondDef;

  constructor(
    private scene: Phaser.Scene,
    pondId: string,
    private known: (fishId: string) => boolean,
  ) {
    this.sky = scene.add.graphics().setDepth(0);
    this.sun = art(scene, 0, 0, 'sc:sun').setDepth(1);
    for (let i = 0; i < 3; i++) this.clouds.push(art(scene, 0, 0, 'sc:cloud', 0.6 + i * 0.15).setDepth(1).setAlpha(0.95));
    this.waterG = scene.add.graphics().setDepth(10);
    this.aimG = scene.add.graphics().setDepth(11.2);
    this.setPond(pondId);
  }

  /** Builds the pieces that depend on the pond's palette. */
  setPond(pondId: string) {
    const s = this.scene;
    this.pond = pondById.get(pondId as 'cozy')!;
    const id = this.pond.id;
    this.setTrophy(false);
    for (const o of [this.horizonImg, ...this.birds.map((b) => b.img), ...this.butterflies.map((b) => b.img), this.smoke, this.hillsFar, this.landmark, this.aurora, this.hillsNear, this.sand, this.surface, this.dock, ...this.trees, ...this.reeds, ...this.weeds, ...this.rocks, ...this.rays, ...this.lilies, ...this.fogs, ...this.flies]) o?.destroy();
    for (const f of this.swimmers) f.img.destroy();
    this.bossShadow?.destroy();
    this.bossShadow = null;
    this.trees = [];
    this.reeds = [];
    this.weeds = [];
    this.rocks = [];
    this.rays = [];
    this.lilies = [];
    this.fogs = [];
    this.flies = [];
    this.swimmers = [];
    this.aurora = null;
    this.birds = [];
    this.butterflies = [];
    this.smoke = null;
    this.horizonImg = art(s, 0, 0, `${id}:horizon`).setOrigin(0.5, 1).setDepth(1.5);
    this.hillsFar = art(s, 0, 0, `${id}:hillsFar`).setOrigin(0.5, 1).setDepth(2);
    const landKind = PALETTES[id].land;
    if (landKind !== 'gorge')
      for (let i = 0; i < 3; i++) this.birds.push({ img: art(s, 0, 0, 'sc:bird', 0.5 + i * 0.12).setDepth(1.6), x: -60, y: 0, v: 40 + i * 12, wait: 2 + i * 5, ph: i * 1.7, k: 0.5 + i * 0.12 });
    if (landKind === 'meadow') for (let i = 0; i < 2; i++) this.butterflies.push({ img: art(s, 0, 0, 'sc:butterfly', 0.7).setDepth(5.5), ph: i * 3.1, cx: 0, cy: 0 });
    const land = PALETTES[id].land;
    this.landmark = art(s, 0, 0, `${id}:landmark`, land === 'gorge' ? 0.75 : 0.62).setOrigin(0.5, 1).setDepth(4.5);
    // Sky: the evening creek has a moon, the frozen lake northern lights.
    setArt(this.sun, land === 'gorge' ? 'sc:moon' : 'sc:sun', 1);
    if (land === 'peaks') this.aurora = art(s, 0, 0, 'sc:aurora', 1).setOrigin(0.5, 0).setDepth(0.5).setBlendMode(Phaser.BlendModes.SCREEN);
    for (let i = 0; i < 3; i++) this.trees.push(art(s, 0, 0, `${id}:tree`, 0.55 + (i % 2) * 0.15).setOrigin(0.5, 1).setDepth(3));
    this.hillsNear = art(s, 0, 0, `${id}:hillsNear`).setOrigin(0.5, 1).setDepth(4);
    for (let i = 0; i < 2; i++) this.reeds.push(art(s, 0, 0, `${id}:reeds`, 0.8 - i * 0.15).setOrigin(0.5, 1).setDepth(5));
    for (let i = 0; i < 3; i++) this.rays.push(art(s, 0, 0, 'sc:ray', 1).setOrigin(0.5, 0).setDepth(11).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD));
    for (let i = 0; i < 6; i++) this.weeds.push(art(s, 0, 0, `${id}:${i % 2 ? 'weedShort' : 'weedTall'}`, 0.55 + (i % 3) * 0.12).setOrigin(0.5, 1).setDepth(13));
    for (let i = 0; i < 2; i++) this.rocks.push(art(s, 0, 0, `${id}:rocks`, 0.75 - i * 0.2).setOrigin(0.5, 1).setDepth(14));
    this.sand = art(s, 0, 0, `${id}:sand`).setOrigin(0.5, 0).setDepth(13);
    this.dock = art(s, 0, 0, `${id}:dock`).setOrigin(0, 0).setDepth(16);
    const surfTex = TEX.get(`${id}:surface`)!;
    this.surface = s.add.tileSprite(0, 0, 256 * surfTex.scale * 8, 48 * surfTex.scale, `${id}:surface`).setOrigin(0, 0.3).setDepth(17);
    this.surface.setScale(1 / surfTex.scale);
    const snow = !!PALETTES[id].snow;
    // Frozen Lake swaps lily pads for ice floes (pets sit on them the same way).
    // Misty Creek has stepping stones instead.
    const gorge = PALETTES[id].land === 'gorge';
    // Five pads (floes, stones): one per team pet, so pets 4 and 5 have room on the water too.
    for (let i = 0; i < 5; i++) this.lilies.push(art(s, 0, 0, snow ? (i === 1 ? 'sc:floe' : 'sc:floeSmall') : gorge ? (i === 1 ? 'sc:stone' : 'sc:stoneSmall') : i === 1 ? 'sc:lilyFlower' : 'sc:lily', 0.75 + (i % 2) * 0.1).setDepth(18));
    if (PALETTES[id].mist) {
      for (let i = 0; i < 2; i++) this.fogs.push(art(s, 0, 0, 'sc:fog', 1).setDepth(i === 0 ? 4.5 : 19).setAlpha(0.6));
      for (let i = 0; i < 7; i++) this.flies.push(art(s, 0, 0, 'sc:firefly', 0.6 + (i % 3) * 0.2).setDepth(6).setBlendMode(Phaser.BlendModes.ADD));
    }
    // Ambient fish: species you have not caught yet swim as dark shadows, to tease the Fishdex.
    const pool = this.pond.fish.filter((f) => f.rarity <= 2);
    this.livePool = null;
    for (let i = 0; i < 8; i++) this.addSwimmer(pool[i % pool.length], false);
    this.refreshKnown();
    if (this.L) this.layout(app.viewport.info.width, app.viewport.info.height);
  }

  setTrophy(on: boolean) {
    if (on && !this.trophy) {
      this.trophy = art(this.scene, 0, 0, 'icon:i_trophy').setOrigin(0.5, 0.95).setDepth(16.5);
      this.trophy.setScale(fitScale('icon:i_trophy', 58));
      this.placeTrophy();
    } else if (!on && this.trophy) {
      this.trophy.destroy();
      this.trophy = null;
    }
  }

  private placeTrophy() {
    if (!this.trophy || !this.L) return;
    const portrait = this.L.h > this.L.w;
    this.trophy.setPosition((portrait ? -70 : -40) + 112 * (portrait ? 0.95 : 1), this.L.deckY + 4);
  }

  // ---------- challenge mode: the fish you see are the fish you catch ----------

  /** Live fish (challenge): null = normal ambient fish. */
  private livePool: FishDef[] | null = null;

  /** Challenge mode on/off: rebuild the swimmers as real, coloured fish of this pond, slower so you can aim. */
  setLiveFish(pool: FishDef[] | null, count = 9, distinct = 3, decoy: { fish: FishDef; n: number } | null = null) {
    for (const f of this.swimmers) f.img.destroy();
    this.swimmers = [];
    this.livePool = pool;
    this.caughtKinds = new Set();
    this.decoy = pool && decoy && decoy.n > 0 ? decoy.fish : null;
    if (!pool) {
      const amb = this.pond.fish.filter((f) => f.rarity <= 2);
      for (let i = 0; i < 8; i++) this.addSwimmer(amb[i % amb.length], false);
      this.refreshKnown();
      if (this.L) this.layout(app.viewport.info.width, app.viewport.info.height);
      return;
    }
    // Enough different species in the water for the goal (besides the school), then random by rarity.
    const kinds = [...new Set(pool.map((f) => f.id))].filter((id) => id !== this.decoy?.id);
    const first = kinds.slice(0, Math.min(kinds.length, distinct + 1)).map((id) => pool.find((f) => f.id === id)!);
    for (const f of first) this.addSwimmer(f, true);
    // v1.16: the school of one species, all over the pond (level 3 on).
    if (this.decoy) for (let i = 0; i < decoy!.n; i++) this.addSwimmer(this.decoy, true, true);
    while (this.swimmers.length < count) this.addSwimmer(this.pickLive(), true);
    if (this.L) this.placeSwimmers();
  }

  /** Challenge (v1.16): species caught in this run swim faded, so the ones still needed stand out. */
  private caughtKinds = new Set<string>();

  setCaughtKinds(ids: Set<string>) {
    this.caughtKinds = new Set(ids);
    if (!this.livePool) return;
    for (const f of this.swimmers) f.img.setAlpha(this.caughtKinds.has(f.id) ? 0.45 : 1);
  }

  /** Challenge school (v1.16): its species roams the whole pond and comes back when one is caught. */
  private decoy: FishDef | null = null;

  private pickLive(): FishDef {
    const pool = this.livePool!.filter((f) => f.id !== this.decoy?.id);
    const w = [40, 28, 18, 10, 4];
    let r = Math.random() * pool.reduce((a, f) => a + w[f.rarity], 0);
    for (const f of pool) {
      r -= w[f.rarity];
      if (r <= 0) return f;
    }
    return pool[0];
  }

  private addSwimmer(f: FishDef, live: boolean, roam = false) {
    const img = this.scene.add.image(-200, 0, `fish:${f.id}`).setDepth(12);
    const sw: Swimmer = { img, speed: live ? 22 + Math.random() * 26 : 40 + Math.random() * 40, dir: Math.random() < 0.5 ? -1 : 1, y: 0, phase: Math.random() * 6, size: live ? 0.34 + f.rarity * 0.03 : 0.3 + Math.random() * 0.14, id: f.id, zone: roam ? -1 : (f.zone ?? 1) };
    this.swimmers.push(sw);
    if (live) img.clearTint().setAlpha(this.caughtKinds.has(f.id) ? 0.45 : 1);
    if (this.L) this.placeSwimmer(sw);
    return sw;
  }

  /**
   * x range of a cast zone (v1.16), as the cast meter splits it: Near up to 40% of the throw, Far up to
   * 80%, Super far beyond. Fish (shadows of species not caught yet too) swim in their zone, so the
   * pond shows where to throw for each.
   */
  zoneBand(zone: number): [number, number] {
    const L = this.L;
    const span = L.castFar - L.castNear;
    const cuts = [L.castNear - 40, L.castNear + span * 0.4, L.castNear + span * 0.8, L.w + 60];
    if (zone < 0) return [cuts[0], cuts[3]];
    const z = Math.min(2, zone);
    return [cuts[z], cuts[z + 1]];
  }

  /**
   * v1.16: depth range of a cast zone. A phone held upright is narrow, so there the three zones are
   * also layers (Near shallow, Far in the middle, Super far deep): the hook sinks to its layer and the
   * fish that like a zone swim in it. Wide screens keep every depth for every zone.
   */
  depthBand(zone: number): [number, number] {
    const L = this.L;
    const d = L.floor - L.water;
    if (zone < 0 || L.h <= L.w) return [L.water + 120, L.floor - 100];
    // Layers end above the cast meter (about 80% down the water on phones), so the glow shows.
    const c = L.water + d * (0.14 + 0.23 * Math.min(2, zone));
    return [c - d * 0.09, c + d * 0.09];
  }

  /** How deep the hook sinks for a cast zone (deeper on upright phones, see depthBand). */
  hookDepth(zone: number) {
    const L = this.L;
    const z = Math.min(2, Math.max(0, zone));
    return L.water + (L.floor - L.water) * (L.h > L.w ? 0.14 + 0.23 * z : 0.28 + 0.2 * z);
  }

  /** v1.16: while the cast charges, the zone it would land in glows softly (null hides it). */
  setAim(zone: number | null) {
    if (zone === this.aimZone) return;
    this.aimZone = zone;
    const g = this.aimG.clear();
    if (zone === null || !this.L) return;
    const L = this.L;
    const [x0, x1] = this.zoneBand(zone);
    const a = Math.max(L.castNear - 30, x0);
    const b = Math.min(L.w - 12, x1);
    const portrait = L.h > L.w;
    const [y0, y1] = portrait ? this.depthBand(zone) : [L.water + 40, L.floor - 40];
    g.fillStyle(0xffffff, 0.1).fillRoundedRect(a, y0 - 20, b - a, y1 - y0 + 40, 26);
    g.lineStyle(4, 0xffffff, 0.45).strokeRoundedRect(a, y0 - 20, b - a, y1 - y0 + 40, 26);
  }

  private aimZone: number | null = null;
  private aimG!: Phaser.GameObjects.Graphics;

  private placeSwimmer(f: Swimmer) {
    const [top, bottom] = this.depthBand(f.zone);
    f.y = top + Math.random() * (bottom - top);
    const [lo, hi] = this.zoneBand(f.zone);
    f.img.x = lo + Math.random() * (hi - lo);
    setArt(f.img, `fish:${f.id}`, f.size);
    f.img.setFlipX(f.dir < 0);
  }

  private placeSwimmers() {
    for (const f of this.swimmers) this.placeSwimmer(f);
  }

  /** The live fish closest to where the hook sinks (challenge). */
  nearestFish(x: number, y: number) {
    let best: Swimmer | null = null;
    let d = Infinity;
    for (const f of this.swimmers) {
      const dd = (f.img.x - x) ** 2 + (f.img.y - y) ** 2;
      if (f.img.visible && dd < d) {
        d = dd;
        best = f;
      }
    }
    return best ? { id: best.id, x: best.img.x, y: best.img.y, take: () => this.takeFish(best!) } : null;
  }

  /** The fish went for the hook: it leaves the school, a new one swims in a moment later. */
  private takeFish(sw: Swimmer) {
    sw.img.setVisible(false);
    this.scene.time.delayedCall(1800, () => {
      if (!this.livePool) return;
      const i = this.swimmers.indexOf(sw);
      if (i < 0) return;
      sw.img.destroy();
      this.swimmers.splice(i, 1);
      const school = !!this.decoy && sw.id === this.decoy.id;
      const n = this.addSwimmer(school ? this.decoy! : this.pickLive(), true, school);
      // Swim in from the side.
      n.dir = Math.random() < 0.5 ? 1 : -1;
      n.img.x = n.dir > 0 ? -100 : this.L.w + 100;
      n.img.setFlipX(n.dir < 0);
    });
  }

  // ---------- WANTED fish: a big fish in its true colours, glowing, swimming where you can cast ----------

  private wantedFish: { img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; id: string; dir: number; y: number; hidden: boolean; spark: number } | null = null;

  // ---------- v1.16: the Legendary in sight ----------

  private legendFish: { img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; clock: Phaser.GameObjects.Text; zone: number; dir: number; y: number; hidden: boolean; spark: number } | null = null;

  get legendShown() {
    return !!this.legendFish;
  }

  /** The Legendary shows itself in its zone (in colour, with a gold glow and its seconds left). */
  showLegend(fish: FishDef, left: number) {
    this.clearLegend(true);
    const L = this.L;
    if (!L) return;
    this.ensureGlow();
    const glow = this.scene.add.image(0, 0, 'wanted-glow').setDepth(12.4).setTint(0xffe36e).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    const img = this.scene.add.image(0, 0, `fish:${fish.id}`).setDepth(12.5).setAlpha(0);
    setArt(img, `fish:${fish.id}`, 0.48);
    const [lo, hi] = this.zoneBand(fish.zone);
    const dir = Math.random() < 0.5 ? -1 : 1;
    img.x = Math.max(40, Math.min(L.w - 40, lo + 40 + Math.random() * Math.max(10, hi - lo - 80)));
    const [top, bottom] = this.depthBand(fish.zone);
    const y = L.h > L.w ? (top + bottom) / 2 : L.water + (L.floor - L.water) * (0.25 + Math.random() * 0.2);
    img.y = y;
    img.setFlipX(dir < 0);
    glow.setPosition(img.x, img.y).setDisplaySize(img.displayWidth * 2, img.displayHeight * 2.6);
    const clock = txt(this.scene, img.x, y - 70, `${Math.ceil(left)}`, 30, { color: '#ffe066' }).setDepth(12.6).setAlpha(0);
    this.legendFish = { img, glow, clock, zone: fish.zone, dir, y, hidden: false, spark: 0 };
    this.scene.tweens.add({ targets: [img, clock], alpha: 1, duration: 400 });
    this.scene.tweens.add({ targets: glow, alpha: 0.7, duration: 400 });
  }

  clearLegend(now = false) {
    const l = this.legendFish;
    if (!l) return;
    this.legendFish = null;
    const parts = [l.img, l.glow, l.clock];
    if (now) return parts.forEach((p) => p.destroy());
    this.scene.tweens.add({ targets: parts, alpha: 0, duration: 500, onComplete: () => parts.forEach((p) => p.destroy()) });
  }

  /** Hidden while it is on the hook; back in its zone when it gets away. */
  hideLegend(hidden: boolean) {
    const l = this.legendFish;
    if (!l) return;
    l.hidden = hidden;
    for (const p of [l.img, l.glow, l.clock]) p.setVisible(!hidden);
  }

  setLegendShown(on: boolean) {
    const l = this.legendFish;
    if (!l) return;
    const v = on && !l.hidden;
    if (l.img.visible !== v) for (const p of [l.img, l.glow, l.clock]) p.setVisible(v);
  }

  setLegendLeft(sec: number) {
    const l = this.legendFish;
    if (!l) return;
    const n = `${Math.max(0, Math.ceil(sec))}`;
    if (l.clock.text !== n) {
      l.clock.setText(n).setColor(sec <= 5 ? '#ff8a8a' : '#ffe066');
    }
  }

  /** True when a hook landing at x is close enough to the Legendary for it to bite. */
  legendNear(x: number, reach: number) {
    const l = this.legendFish;
    return !!l && !l.hidden && Math.abs(l.img.x - x) <= reach;
  }

  private updateLegend(dt: number, t: number) {
    const l = this.legendFish;
    if (!l || l.hidden || !this.L) return;
    const [lo, hi] = this.zoneBand(l.zone);
    const a = Math.max(40, lo + 30);
    const b = Math.min(this.L.w - 40, hi - 30);
    l.img.x += l.dir * 26 * dt;
    if ((l.dir > 0 && l.img.x > b) || (l.dir < 0 && l.img.x < a)) {
      l.dir *= -1;
      l.img.setFlipX(l.dir < 0);
    }
    l.img.y = l.y + Math.sin(t * 1.1) * 10;
    l.img.setAngle(Math.sin(t * 3) * 4);
    l.glow.setPosition(l.img.x, l.img.y).setAlpha(0.5 + 0.3 * Math.sin(t * 4));
    l.clock.setPosition(l.img.x, l.img.y - l.img.displayHeight * 0.5 - 30);
    l.spark += dt;
    if (l.spark > 0.35) {
      l.spark = 0;
      this.twinkle(l.img.x + (Math.random() - 0.5) * l.img.displayWidth, l.img.y + (Math.random() - 0.6) * l.img.displayHeight, Math.random() < 0.5 ? 0xffe36e : 0xffffff);
    }
  }

  /** Soft round glow behind the WANTED fish and the Legendary, drawn once. */
  private ensureGlow() {
    if (this.scene.textures.exists('wanted-glow')) return;
    const c = this.scene.textures.createCanvas('wanted-glow', 128, 128);
    const ctx = c?.getContext();
    if (c && ctx) {
      const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      c.refresh();
    }
  }

  /** A WANTED fish swims in at a random spot within casting range. */
  showWanted(fish: FishDef, size: number) {
    this.clearWanted(true);
    const L = this.L;
    if (!L) return;
    this.ensureGlow();
    const glow = this.scene.add.image(0, 0, 'wanted-glow').setDepth(12.4).setTint(0xffd23f).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    const img = this.scene.add.image(0, 0, `fish:${fish.id}`).setDepth(12.5).setAlpha(0);
    setArt(img, `fish:${fish.id}`, 0.4 * size);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const lo = L.castNear + 60;
    const hi = L.castFar - 40;
    img.x = lo + Math.random() * (hi - lo);
    const y = L.water + (L.floor - L.water) * (0.3 + Math.random() * 0.3);
    img.y = y;
    img.setFlipX(dir < 0);
    glow.setPosition(img.x, img.y).setDisplaySize(img.displayWidth * 1.8, img.displayHeight * 2.2);
    this.wantedFish = { img, glow, id: fish.id, dir, y, hidden: false, spark: 0 };
    this.scene.tweens.add({ targets: img, alpha: 1, duration: 500 });
    this.scene.tweens.add({ targets: glow, alpha: 0.55, duration: 500 });
  }

  /** It swam off or was caught. */
  clearWanted(now = false) {
    const w = this.wantedFish;
    if (!w) return;
    this.wantedFish = null;
    if (now) {
      w.img.destroy();
      w.glow.destroy();
      return;
    }
    this.scene.tweens.add({ targets: [w.img, w.glow], alpha: 0, duration: 400, onComplete: () => (w.img.destroy(), w.glow.destroy()) });
  }

  /** Hidden while it is on the hook; back in the water when it gets away. */
  hideWanted(hidden: boolean) {
    const w = this.wantedFish;
    if (!w) return;
    w.hidden = hidden;
    w.img.setVisible(!hidden);
    w.glow.setVisible(!hidden);
    if (!hidden && this.L) {
      // It got away: it bolts to another spot.
      const L = this.L;
      w.img.x = L.castNear + 60 + Math.random() * (L.castFar - L.castNear - 100);
    }
  }

  /** True when a hook landing at x is close enough to the WANTED fish for it to bite. */
  wantedNear(x: number, reach: number) {
    const w = this.wantedFish;
    return !!w && !w.hidden && Math.abs(w.img.x - x) <= reach;
  }

  /** Out of sight during boss fights, challenges and while it is on the hook. */
  setWantedShown(on: boolean) {
    const w = this.wantedFish;
    if (!w) return;
    const v = on && !w.hidden;
    if (w.img.visible !== v) {
      w.img.setVisible(v);
      w.glow.setVisible(v);
    }
  }

  get wantedPos() {
    const w = this.wantedFish;
    return w ? { x: w.img.x, y: w.img.y } : null;
  }

  private updateWanted(dt: number, t: number) {
    const w = this.wantedFish;
    const L = this.L;
    if (!w || !L || w.hidden) return;
    const lo = L.castNear + 40;
    const hi = L.castFar - 20;
    w.img.x += w.dir * 34 * dt;
    if ((w.dir > 0 && w.img.x > hi) || (w.dir < 0 && w.img.x < lo)) {
      w.dir *= -1;
      w.img.setFlipX(w.dir < 0);
    }
    w.img.y = w.y + Math.sin(t * 1.3) * 10;
    w.img.setAngle(Math.sin(t * 3.4) * 4);
    w.glow.setPosition(w.img.x, w.img.y).setAlpha(0.4 + 0.25 * Math.sin(t * 3));
    w.spark += dt;
    if (w.spark > 0.7) {
      w.spark = 0;
      this.twinkle(w.img.x + (Math.random() - 0.5) * w.img.displayWidth * 0.8, w.img.y - w.img.displayHeight * 0.4, 0xffe066);
    }
  }

  private twinkle(x: number, y: number, tint: number) {
    const sp = art(this.scene, x, y, 'item:sparkle', 0.05).setDepth(19.5).setTint(tint);
    const k = sp.scaleX;
    this.scene.tweens.add({ targets: sp, scale: k * 8, angle: 90, alpha: { from: 1, to: 0 }, duration: 700, ease: 'Sine.Out', onComplete: () => sp.destroy() });
  }

  /** Re-tint ambient fish after the Fishdex changes. */
  refreshKnown() {
    if (this.livePool) return;
    for (const f of this.swimmers) {
      const k = this.known(f.id);
      if (k) f.img.clearTint().setAlpha(0.92);
      else f.img.setTint(0x1d3a5a).setTintMode(Phaser.TintModes.FILL).setAlpha(0.42);
    }
  }

  /** Big dark shape that cruises deep down: the pond's boss is near. */
  setBossTeaser(on: boolean) {
    if (on && !this.bossShadow) {
      this.bossShadow = this.scene.add.image(-400, 0, `fish:${this.pond.boss.id}`).setDepth(11.5).setTint(0x0c1a33).setTintMode(Phaser.TintModes.FILL).setAlpha(0.35);
      setArt(this.bossShadow, `fish:${this.pond.boss.id}`, 1.1);
      this.bossShadowT = 0;
    } else if (!on && this.bossShadow) {
      this.bossShadow.destroy();
      this.bossShadow = null;
    }
  }

  setPets(team: string[]) {
    for (const p of this.pets) p.img.destroy();
    this.pets = team.map((id) => ({ id, img: art(this.scene, 0, 0, `pet:${id}`, 0.45).setOrigin(0.5, 0.92).setDepth(19), baseY: 0, t: Math.random() * 5 }));
    if (this.L) this.placePets();
  }

  /** Pets jump when a fish bites. */
  cheer() {
    this.pets.forEach((p, i) => {
      this.scene.tweens.add({ targets: p.img, y: p.baseY - 34, duration: 160, delay: i * 70, yoyo: true, ease: 'Quad.Out' });
    });
  }

  layout(w: number, h: number) {
    const portrait = h > w;
    const water = Math.round(portrait ? h * 0.37 : h * 0.43);
    const floor = h - (portrait ? 90 : 60);
    const deckY = water - 34;
    const dockScale = portrait ? 0.95 : 1;
    const dockX = portrait ? -70 : -40;
    const dockEnd = dockX + 356 * dockScale;
    this.L = { w, h, water, floor, deckY, dockEnd, castNear: dockEnd + 70, castFar: w - (portrait ? 70 : 110) };
    this.aimZone = null;
    this.aimG.clear();
    const pal = PALETTES[this.pond.id];

    this.sky.clear();
    this.sky.fillGradientStyle(hex(pal.skyTop), hex(pal.skyTop), hex(pal.skyBottom), hex(pal.skyBottom), 1);
    this.sky.fillRect(0, 0, w, water + 4);
    // Horizon glow: the sky gets lighter just above the far bank.
    const glowH = Math.round(water * 0.35);
    this.sky.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0, 0, 0.35, 0.35);
    this.sky.fillRect(0, water - glowH, w, glowH + 4);
    this.waterG.clear();
    this.waterG.fillGradientStyle(hex(pal.waterTop), hex(pal.waterTop), hex(pal.waterDeep), hex(pal.waterDeep), 1);
    this.waterG.fillRect(0, water, w, h - water);

    this.sun.setPosition(w * (portrait ? 0.8 : 0.84), water * (portrait ? 0.36 : 0.3));
    this.clouds.forEach((c, i) => c.setPosition(((i * 0.37 + 0.12) % 1) * w, water * (0.18 + i * 0.16)));
    const stretch = Math.max(1, w / 1560);
    this.hillsFar.setPosition(w / 2, water + 6).setScale((1 / TEX.get(`${this.pond.id}:hillsFar`)!.scale) * stretch, 1 / TEX.get(`${this.pond.id}:hillsFar`)!.scale);
    this.hillsNear.setPosition(w / 2, water + 8).setScale((1 / TEX.get(`${this.pond.id}:hillsNear`)!.scale) * stretch, 1 / TEX.get(`${this.pond.id}:hillsNear`)!.scale);
    this.landmark.setPosition(w * (portrait ? 0.5 : 0.4), water + (pal.land === 'gorge' ? 10 : -2));
    this.aurora?.setPosition(w / 2, water * 0.04).setScale((w / 1600) * 1.15 / 1.3, (water * 0.55) / 260 / 1.3);
    const treeX = portrait ? [0.62, 0.86, 0.97] : [0.55, 0.74, 0.93];
    this.trees.forEach((t, i) => t.setPosition(w * treeX[i], water - (portrait ? 70 : 60) + i * 10));
    this.reeds.forEach((r, i) => r.setPosition(w - 30 - i * 60, water + 12));

    this.rays.forEach((r, i) => r.setPosition(w * (0.35 + i * 0.25), water).setScale(r.scaleX, ((floor - water) / 600) * (1 / 1.3) * 1.1));
    const weedX = [0.06, 0.16, 0.42, 0.58, 0.82, 0.93];
    this.weeds.forEach((wd, i) => wd.setPosition(w * weedX[i], floor + 24));
    this.rocks[0].setPosition(w * 0.28, floor + 30);
    this.rocks[1].setPosition(w * 0.72, floor + 34);
    this.sand.setPosition(w / 2, floor).setScale((1 / TEX.get(`${this.pond.id}:sand`)!.scale) * stretch, (h - floor + 10) / 110);
    this.dock.setPosition(dockX, deckY - 70 * dockScale).setScale(dockScale / TEX.get(`${this.pond.id}:dock`)!.scale);
    this.surface.setPosition(0, water);
    const hzTex = TEX.get(`${this.pond.id}:horizon`)!;
    this.horizonImg.setPosition(w / 2, water + 4).setScale((1 / hzTex.scale) * stretch, (1 / hzTex.scale) * (portrait ? 0.9 : 1));
    this.birds.forEach((b) => (b.y = water * (0.25 + Math.random() * 0.25)));
    this.butterflies.forEach((b, i) => {
      b.cx = w * (portrait ? 0.3 + i * 0.4 : 0.25 + i * 0.35);
      b.cy = water - 34;
    });
    // Chimney smoke from the cottage (Cozy) or the hut's stove pipe (Frozen): soft rising puffs.
    this.smoke?.destroy();
    this.smoke = null;
    if (pal.land !== 'gorge') {
      const k = this.landmark.scaleX * (TEX.get(`${this.pond.id}:landmark`)?.scale ?? 1);
      const [ox, oy] = pal.land === 'meadow' ? [(172 - 120) * k, -(200 - 26) * k] : [(196 - 130) * k, -(200 - 22) * k];
      this.smoke = this.scene.add.particles(this.landmark.x + ox, this.landmark.y + oy, 'sc:puff', {
        speedY: { min: -26, max: -16 },
        speedX: { min: 2, max: 10 },
        lifespan: 3600,
        scale: { start: 0.25, end: 0.8 },
        alpha: { start: 0.65, end: 0 },
        frequency: 650,
        advance: 4000,
      });
      this.smoke.setDepth(4.6);
    }
    this.surface.width = (w + 300) * TEX.get(`${this.pond.id}:surface`)!.scale;
    this.fogs.forEach((f, i) => f.setPosition(w * (0.3 + i * 0.5), water - 20 + i * 40).setScale((w / 800) * 1.1 * (1 / 1.3), 1 / 1.3));
    this.flies.forEach((f) => f.setPosition(Math.random() * w, water * (0.3 + Math.random() * 0.6)));
    for (const f of this.swimmers) {
      f.y = water + 120 + Math.random() * (floor - water - 220);
      f.img.x = Math.random() * w;
      setArt(f.img, `fish:${f.id}`, f.size);
      f.img.setFlipX(f.dir < 0);
    }
    // Bubbles rising from the pond floor (rebuilt for the new size).
    this.seaBubbles?.destroy();
    this.seaBubbles = this.scene.add.particles(0, floor, 'item:bubble', {
      x: { min: 0, max: w },
      speedY: { min: -70, max: -45 },
      speedX: { min: -8, max: 8 },
      lifespan: ((floor - water) / 60) * 1000,
      scale: { min: 0.16, max: 0.34 },
      alpha: { start: 0.7, end: 0.1 },
      frequency: 700,
    });
    this.seaBubbles.setDepth(12.2);
    this.snowFx?.destroy();
    this.snowFx = null;
    if (pal.snow) {
      this.snowFx = this.scene.add.particles(0, -20, 'sc:snowflake', {
        x: { min: -40, max: w + 40 },
        speedY: { min: 45, max: 90 },
        speedX: { min: -18, max: 18 },
        lifespan: ((water + 40) / 60) * 1000,
        scale: { min: 0.35, max: 0.9 },
        alpha: { start: 0.95, end: 0.5 },
        frequency: 160,
        advance: 8000,
      });
      this.snowFx.setDepth(6.5);
    }
    this.placePets();
    this.placeTrophy();
  }

  /**
   * One pad (lily, stone or floe) per pet, at least three, spread from the dock end to the right
   * edge with room between them. With four or five pets the pads and pets get a little smaller on
   * phones so they never touch each other or the cat.
   */
  private placePets() {
    const L = this.L;
    const portrait = L.h > L.w;
    const n = Math.max(3, Math.min(5, this.pets.length));
    const xs = portrait
      ? { 3: [0.62, 0.77, 0.915], 4: [0.52, 0.655, 0.79, 0.92], 5: [0.46, 0.575, 0.69, 0.805, 0.915] }[n]!
      : { 3: [0.6, 0.73, 0.88], 4: [0.5, 0.62, 0.74, 0.86], 5: [0.38, 0.5, 0.62, 0.74, 0.86] }[n]!;
    const k = portrait ? { 3: 1, 4: 0.9, 5: 0.82 }[n]! : 1;
    this.lilies.forEach((l, i) => {
      const on = i < n;
      l.setVisible(on);
      if (!on) return;
      l.setPosition(L.w * xs[i], L.water + 10 + (i % 2) * 6);
      setArt(l, l.texture.key, (0.75 + (i === 1 ? 0.1 : 0)) * k);
    });
    this.pets.forEach((p, i) => {
      const l = this.lilies[i];
      const y = L.water + 12 + (i % 2) * 6;
      p.img.setPosition(l.x, y);
      setArt(p.img, `pet:${p.id}`, 0.45 * k);
      p.baseY = y;
      p.img.setFlipX(i % 2 === 1);
    });
  }

  /** Hook position for the catch target, so ambient fish swim away from it. */
  update(dt: number) {
    this.t += dt;
    const L = this.L;
    if (!L) return;
    const t = this.t;
    this.surface.tilePositionX += dt * 26;
    // Birds cross the sky now and then, flapping; butterflies flutter over the near bank.
    for (const b of this.birds) {
      if (b.wait > 0) {
        b.wait -= dt;
        b.img.setVisible(false);
        continue;
      }
      b.img.setVisible(true);
      b.x += b.v * dt;
      b.ph += dt * 9;
      b.img.setPosition(b.x, b.y + Math.sin(b.ph * 0.25) * 6);
      b.img.scaleY = b.img.scaleX * (0.45 + 0.55 * Math.abs(Math.sin(b.ph)));
      if (b.x > L.w + 60) {
        b.x = -60;
        b.wait = 6 + Math.random() * 10;
      }
    }
    for (const bf of this.butterflies) {
      bf.ph += dt;
      bf.img.setPosition(bf.cx + Math.sin(bf.ph * 0.7) * 60, bf.cy + Math.sin(bf.ph * 1.9) * 14);
      bf.img.scaleY = bf.img.scaleX * (0.35 + 0.65 * Math.abs(Math.sin(bf.ph * 12)));
      bf.img.setFlipX(Math.cos(bf.ph * 0.7) < 0);
    }
    this.clouds.forEach((c, i) => {
      c.x += dt * (6 + i * 3);
      if (c.x > L.w + 140) c.x = -140;
    });
    this.sun.setAngle(Math.sin(t * 0.4) * 4);
    this.aurora?.setAlpha(0.55 + Math.sin(t * 0.5) * 0.25);
    this.rays.forEach((r, i) => {
      r.setAlpha(0.18 + 0.14 * Math.sin(t * 0.7 + i * 2));
      r.setAngle(Math.sin(t * 0.25 + i) * 6);
    });
    this.weeds.forEach((wd, i) => wd.setAngle(Math.sin(t * 1.3 + i * 1.7) * 5));
    this.reeds.forEach((r, i) => r.setAngle(Math.sin(t * 1.1 + i) * 2.5));
    this.lilies.forEach((l, i) => (l.y = L.water + 10 + (i % 2) * 6 + Math.sin(t * 1.6 + i * 1.3) * 3));
    this.fogs.forEach((f, i) => (f.x = L.w * (0.3 + i * 0.5) + Math.sin(t * 0.15 + i * 3) * 80));
    this.flies.forEach((f, i) => {
      f.x += Math.sin(t * 0.9 + i * 7) * 16 * dt;
      f.y += Math.cos(t * 1.2 + i * 3) * 12 * dt;
      f.setAlpha(0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.9));
    });
    this.updateWanted(dt, t);
    this.updateLegend(dt, t);
    for (const f of this.swimmers) {
      f.img.x += f.speed * f.dir * dt;
      f.img.y = f.y + Math.sin(t * 0.9 + f.phase) * 14;
      f.img.setAngle(Math.sin(t * 3 + f.phase) * 3);
      // Turns at the edge of its zone (a little past it, so the bands blend).
      const [lo, hi] = this.zoneBand(f.zone);
      if ((f.dir > 0 && f.img.x > hi + 30) || (f.dir < 0 && f.img.x < lo - 30)) {
        f.dir *= -1;
        f.img.setFlipX(f.dir < 0);
        // A new depth only off screen (the turn is visible now that fish stay in their zone).
        if (f.img.x > L.w + 40 || f.img.x < -40) {
          const [top, bottom] = this.depthBand(f.zone);
          f.y = top + Math.random() * (bottom - top);
        }
      }
    }
    this.pets.forEach((p, i) => {
      p.t += dt;
      const lily = i;
      const onLily = !!this.lilies[lily]?.visible;
      const bob = onLily ? Math.sin(t * 1.6 + lily * 1.3) * 3 : 0;
      p.img.scaleY = p.img.scaleX * (1 + Math.sin(p.t * 2.2) * 0.025);
      // Epic and Legendary pets twinkle now and then.
      const rar = petById.get(p.id)?.rarity ?? 0;
      if (rar >= 3 && Math.random() < dt * (rar === 4 ? 1.6 : 0.9)) this.twinkle(p.img.x + (Math.random() - 0.5) * 70, p.img.y - 20 - Math.random() * 60, rar === 4 ? 0xffe36e : 0xd9c2ff);
      if (!this.scene.tweens.isTweening(p.img)) p.img.y = p.baseY + bob;
    });
    if (this.bossShadow) {
      this.bossShadowT += dt;
      const span = L.w + 600;
      const x = ((this.bossShadowT * 40) % (span * 2)) - 300;
      const going = x < span - 300;
      this.bossShadow.x = going ? x : span * 2 - 600 - x;
      this.bossShadow.setFlipX(!going);
      this.bossShadow.y = L.floor - 90 + Math.sin(this.bossShadowT * 0.6) * 18;
    }
  }

  petImage(id: string) {
    return this.pets.find((p) => p.id === id)?.img ?? null;
  }
}

void petById;
