// The living pond scene: sky, far bank, water, plants, swimming fish, lily pads, the dock and the
// pets that sit around it. Everything is laid out for the current screen and gently animated.
import Phaser from 'phaser';
import { app } from '@core';
import { pondById, petById, type PondDef } from '../content/data';
import { PALETTES } from '../render/scenery';
import { TEX } from '../render/textures';
import { art, setArt } from '../ui/kit';

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
  private hillsNear!: Phaser.GameObjects.Image;
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
    this.setPond(pondId);
  }

  /** Builds the pieces that depend on the pond's palette. */
  setPond(pondId: string) {
    const s = this.scene;
    this.pond = pondById.get(pondId as 'cozy')!;
    const id = this.pond.id;
    for (const o of [this.hillsFar, this.hillsNear, this.sand, this.surface, this.dock, ...this.trees, ...this.reeds, ...this.weeds, ...this.rocks, ...this.rays, ...this.lilies, ...this.fogs, ...this.flies]) o?.destroy();
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
    this.hillsFar = art(s, 0, 0, `${id}:hillsFar`).setOrigin(0.5, 1).setDepth(2);
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
    for (let i = 0; i < 3; i++) this.lilies.push(art(s, 0, 0, snow ? (i === 1 ? 'sc:floe' : 'sc:floeSmall') : i === 1 ? 'sc:lilyFlower' : 'sc:lily', 0.75 + (i % 2) * 0.1).setDepth(18));
    if (PALETTES[id].mist) {
      for (let i = 0; i < 2; i++) this.fogs.push(art(s, 0, 0, 'sc:fog', 1).setDepth(i === 0 ? 4.5 : 19).setAlpha(0.6));
      for (let i = 0; i < 7; i++) this.flies.push(art(s, 0, 0, 'sc:firefly', 0.6 + (i % 3) * 0.2).setDepth(6).setBlendMode(Phaser.BlendModes.ADD));
    }
    // Ambient fish: species you have not caught yet swim as dark shadows, to tease the Fishdex.
    const pool = this.pond.fish.filter((f) => f.rarity <= 2);
    for (let i = 0; i < 8; i++) {
      const f = pool[i % pool.length];
      const img = s.add.image(0, 0, `fish:${f.id}`).setDepth(12);
      this.swimmers.push({ img, speed: 40 + Math.random() * 40, dir: Math.random() < 0.5 ? -1 : 1, y: 0, phase: Math.random() * 6, size: 0.3 + Math.random() * 0.14, id: f.id });
    }
    this.refreshKnown();
    if (this.L) this.layout(app.viewport.info.width, app.viewport.info.height);
  }

  /** Re-tint ambient fish after the Fishdex changes. */
  refreshKnown() {
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
    const pal = PALETTES[this.pond.id];

    this.sky.clear();
    this.sky.fillGradientStyle(hex(pal.skyTop), hex(pal.skyTop), hex(pal.skyBottom), hex(pal.skyBottom), 1);
    this.sky.fillRect(0, 0, w, water + 4);
    this.waterG.clear();
    this.waterG.fillGradientStyle(hex(pal.waterTop), hex(pal.waterTop), hex(pal.waterDeep), hex(pal.waterDeep), 1);
    this.waterG.fillRect(0, water, w, h - water);

    this.sun.setPosition(w * (portrait ? 0.8 : 0.84), water * (portrait ? 0.36 : 0.3));
    this.clouds.forEach((c, i) => c.setPosition(((i * 0.37 + 0.12) % 1) * w, water * (0.18 + i * 0.16)));
    const stretch = Math.max(1, w / 1560);
    this.hillsFar.setPosition(w / 2, water + 6).setScale((1 / TEX.get(`${this.pond.id}:hillsFar`)!.scale) * stretch, 1 / TEX.get(`${this.pond.id}:hillsFar`)!.scale);
    this.hillsNear.setPosition(w / 2, water + 8).setScale((1 / TEX.get(`${this.pond.id}:hillsNear`)!.scale) * stretch, 1 / TEX.get(`${this.pond.id}:hillsNear`)!.scale);
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
    this.surface.width = (w + 300) * TEX.get(`${this.pond.id}:surface`)!.scale;
    const lilyX = portrait ? [0.62, 0.78, 0.93] : [0.6, 0.73, 0.88];
    this.lilies.forEach((l, i) => l.setPosition(w * lilyX[i], water + 10 + (i % 2) * 6));
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
  }

  private placePets() {
    const L = this.L;
    // Lily pads first (they are in view on every screen), then the dock behind the cat.
    const spots = [
      { x: this.lilies[0]?.x ?? L.w * 0.62, y: L.water + 12 },
      { x: this.lilies[2]?.x ?? L.w * 0.9, y: L.water + 16 },
      { x: this.lilies[1]?.x ?? L.w * 0.78, y: L.water + 14 },
      { x: Math.max(40, L.dockEnd - 215), y: L.deckY + 4 },
      { x: Math.max(40, L.dockEnd - 215) + 50, y: L.deckY + 4 },
    ];
    this.pets.forEach((p, i) => {
      const s = spots[i] ?? spots[spots.length - 1];
      p.img.setPosition(s.x, s.y);
      p.baseY = s.y;
      p.img.setFlipX(i < 3 ? i % 2 === 1 : false);
    });
  }

  /** Hook position for the catch target, so ambient fish swim away from it. */
  update(dt: number) {
    this.t += dt;
    const L = this.L;
    if (!L) return;
    const t = this.t;
    this.surface.tilePositionX += dt * 26;
    this.clouds.forEach((c, i) => {
      c.x += dt * (6 + i * 3);
      if (c.x > L.w + 140) c.x = -140;
    });
    this.sun.setAngle(Math.sin(t * 0.4) * 4);
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
    for (const f of this.swimmers) {
      f.img.x += f.speed * f.dir * dt;
      f.img.y = f.y + Math.sin(t * 0.9 + f.phase) * 14;
      f.img.setAngle(Math.sin(t * 3 + f.phase) * 3);
      if ((f.dir > 0 && f.img.x > L.w + 120) || (f.dir < 0 && f.img.x < -120)) {
        f.dir *= -1;
        f.img.setFlipX(f.dir < 0);
        f.y = L.water + 120 + Math.random() * (L.floor - L.water - 220);
      }
    }
    this.pets.forEach((p, i) => {
      p.t += dt;
      const onLily = i < 3;
      const lily = [0, 2, 1][i] ?? 0;
      const bob = onLily ? Math.sin(t * 1.6 + lily * 1.3) * 3 : 0;
      p.img.scaleY = p.img.scaleX * (1 + Math.sin(p.t * 2.2) * 0.025);
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
