// The cat angler and everything on the line: rod, fishing line, bobber, hook and whatever is
// swimming toward it. It reads the Fishing state each frame and animates it.
import Phaser from 'phaser';
import { CAST_MULT } from '../logic/rules';
import { FLY_SEC, type Fishing } from '../logic/fishing';
import { TEX } from '../render/textures';
import { INK, art, setArt } from '../ui/kit';
import type { Pond } from './Pond';

const CAT_K = 0.78;
const ROD_K = 0.78;
const ROD_REST = 0;

export class Rig {
  cat: Phaser.GameObjects.Image;
  hat: Phaser.GameObjects.Image;
  private bobberKey = 'item:bobber';
  rod: Phaser.GameObjects.Graphics;
  private lineG: Phaser.GameObjects.Graphics;
  bobber: Phaser.GameObjects.Image;
  hook: Phaser.GameObjects.Image;
  private worm: Phaser.GameObjects.Image;
  /** Whatever is on the line, drawn as a dark shape until it is landed. */
  target: Phaser.GameObjects.Image;
  private bang: Phaser.GameObjects.Text;
  private ripples: Phaser.GameObjects.Image[] = [];
  private drops: Phaser.GameObjects.Particles.ParticleEmitter;
  private bubbles: Phaser.GameObjects.Particles.ParticleEmitter;
  private t = 0;
  private blinkIn = 3;
  /** Where the bobber landed. */
  landX = 0;
  hookDepth = 0;
  private castFrom = { x: 0, y: 0 };
  private targetKey = '';
  private targetSize = 0.5;
  private dipT = 0;
  private dipAmp = 0;
  private rodKick = 0;
  /** -1..1 swim offset of the target, for the side-to-side fight. */
  private thrash = 0;

  constructor(
    private scene: Phaser.Scene,
    private pond: Pond,
  ) {
    // The rod is drawn with lines, not a texture: a long thin diagonal sprite lost pixels on some GPUs.
    this.rod = scene.add.graphics().setDepth(24);
    this.drawRod(0xc98a4b, 0x8d5a2b);
    this.cat = art(scene, 0, 0, 'sc:cat', CAT_K).setOrigin(0.5, 200 / 220).setDepth(23);
    // The hat is its own sprite on the cat's canvas (wardrobe), drawn just above the cat.
    this.hat = art(scene, 0, 0, 'hat:rain', CAT_K).setOrigin(0.5, 200 / 220).setDepth(23.05);
    this.lineG = scene.add.graphics().setDepth(25);
    this.target = scene.add.image(0, 0, '__DEFAULT').setDepth(12.5).setVisible(false);
    this.hook = art(scene, 0, 0, 'item:hook', 0.55).setOrigin(0.5, 0.06).setDepth(12.6).setVisible(false);
    this.worm = art(scene, 0, 0, 'item:worm', 0.5).setDepth(12.7).setVisible(false);
    this.bobber = art(scene, 0, 0, 'item:bobber', 0.6).setOrigin(0.5, 48 / 90).setDepth(26).setVisible(false);
    this.bang = scene.add
      .text(0, 0, '!', { fontFamily: 'Fredoka, sans-serif', fontStyle: '700', fontSize: 84, color: '#ffd23f', stroke: '#3b2a4d', strokeThickness: 12 })
      .setOrigin(0.5, 1)
      .setDepth(40)
      .setVisible(false);
    for (let i = 0; i < 3; i++) this.ripples.push(art(scene, 0, 0, 'item:ripple', 1).setDepth(18.5).setVisible(false));
    this.drops = scene.add.particles(0, 0, 'item:drop', {
      speed: { min: 160, max: 380 },
      angle: { min: 225, max: 315 },
      gravityY: 900,
      lifespan: { min: 380, max: 700 },
      scale: { start: 0.42, end: 0.12 },
      alpha: { start: 0.95, end: 0.4 },
      tint: 0xe9fbff,
      emitting: false,
    });
    this.drops.setDepth(27);
    this.bubbles = scene.add.particles(0, 0, 'item:bubble', {
      speedY: { min: -120, max: -60 },
      speedX: { min: -20, max: 20 },
      lifespan: { min: 600, max: 1100 },
      scale: { start: 0.35, end: 0.6 },
      alpha: { start: 0.9, end: 0 },
      emitting: false,
    });
    this.bubbles.setDepth(13);
  }

  /** Shaft and handle colours (wardrobe rods). */
  private drawRod(shaft: number, handle: number) {
    const k = ROD_K;
    const tx = (380 - 20) * k;
    const ty = (14 - 200) * k;
    const r = this.rod.clear();
    r.lineStyle(11 * k, INK, 1).lineBetween(0, 0, tx, ty);
    r.lineStyle(6 * k, shaft, 1).lineBetween(0, 0, tx, ty);
    r.lineStyle(2 * k, 0xffffff, 0.35).lineBetween(tx * 0.3, ty * 0.3 - 1.5, tx * 0.95, ty * 0.95 - 1.5);
    r.lineStyle(7 * k, handle, 1).lineBetween(0, 0, 100 * k, -52 * k);
    r.fillStyle(INK, 1).fillCircle(50 * k, -25 * k, 15 * k);
    r.fillStyle(0x5b6178, 1).fillCircle(50 * k, -25 * k, 11 * k);
    r.fillStyle(0xc9d1e6, 1).fillCircle(50 * k, -25 * k, 4.5 * k);
    r.fillStyle(INK, 1).fillCircle(tx, ty, 6.5 * k);
    r.fillStyle(0xff6b6b, 1).fillCircle(tx, ty, 4.5 * k);
  }

  /** What the cat wears: hat, rod and bobber ids from the wardrobe. */
  setStyle(hat: string, rod: [number, number], bobber: string, bait = 'item:worm') {
    setArt(this.worm, bait, 0.5);
    setArt(this.hat, hat, CAT_K);
    this.drawRod(rod[0], rod[1]);
    this.bobberKey = bobber === 'bobber:classic' ? 'item:bobber' : `item:${bobber}`;
    setArt(this.bobber, this.bobberKey, 0.6);
  }

  layout() {
    const L = this.pond.L;
    this.cat.setPosition(L.dockEnd - 95, L.deckY + 6);
    this.hat.setPosition(this.cat.x, this.cat.y);
    this.placeRod(ROD_REST);
  }

  /** World position of the cat's paws, where the rod pivots. */
  private paws() {
    return { x: this.cat.x + (126 - 100) * CAT_K, y: this.cat.y + (150 - 200) * CAT_K };
  }

  private placeRod(angle: number) {
    const p = this.paws();
    this.rod.setPosition(p.x, p.y).setAngle(angle);
  }

  /** Rod tip in world space. */
  tip() {
    const a = Phaser.Math.DegToRad(this.rod.angle);
    const dx = (380 - 20) * ROD_K;
    const dy = (14 - 200) * ROD_K;
    return { x: this.rod.x + dx * Math.cos(a) - dy * Math.sin(a), y: this.rod.y + dx * Math.sin(a) + dy * Math.cos(a) };
  }

  /** Called on release: where the cast will land, and how deep the hook goes. */
  cast(power: number, zone: number) {
    const L = this.pond.L;
    this.landX = L.castNear + (L.castFar - L.castNear) * power;
    this.hookDepth = this.pond.hookDepth(zone);
    this.castFrom = this.tip();
    this.bobber.setVisible(true).setAngle(0);
    this.rodKick = 1;
    void CAST_MULT;
  }

  /** What is on the line. Dark until landed. */
  /** The hooked fish, seen as a dark shape under water. `shade` tints it (boss rematch forms). */
  setTarget(key: string, size: number, shade = 0x10243d) {
    this.targetKey = key;
    this.targetSize = size;
    setArt(this.target, key, size);
    this.target.setTint(shade).setTintMode(Phaser.TintModes.FILL).setAlpha(0);
  }

  splash(x: number, y: number, n = 12) {
    this.drops.explode(n, x, y);
    const r = this.ripples.find((q) => !q.visible) ?? this.ripples[0];
    r.setVisible(true).setPosition(x, y + 4).setScale(0.2).setAlpha(0.9);
    this.scene.tweens.add({ targets: r, scale: 1.1 / 1.5, alpha: 0, duration: 700, ease: 'Cubic.Out', onComplete: () => r.setVisible(false) });
  }

  nibble() {
    this.dipT = 0;
    this.dipAmp = 9;
    this.splash(this.bobber.x, this.pond.L.water, 3);
  }

  /** The hooked fish thrashes: a big pull is coming (let go!). */
  warn() {
    this.dipT = 0;
    this.dipAmp = 18;
    this.splash(this.bobber.x, this.pond.L.water, 10);
  }

  bite() {
    this.dipT = 0;
    this.dipAmp = 26;
    this.splash(this.bobber.x, this.pond.L.water, 16);
    this.bang.setVisible(true).setPosition(this.bobber.x, this.pond.L.water - 40).setScale(0.3);
    this.scene.tweens.add({ targets: this.bang, scale: 1, duration: 220, ease: 'Back.Out' });
  }

  hooked() {
    this.bang.setVisible(false);
    this.rodKick = -1;
  }

  /** The catch leaves the water: returns the start point for the fly-up animation. */
  landed() {
    const p = { x: this.target.visible ? this.target.x : this.bobber.x, y: this.pond.L.water };
    this.splash(p.x, p.y, 20);
    this.clear();
    return p;
  }

  clear() {
    this.bobber.setVisible(false);
    this.hook.setVisible(false);
    this.worm.setVisible(false);
    this.target.setVisible(false);
    this.bang.setVisible(false);
    this.lineG.clear();
  }

  /** The line snapped or the fish got away: the target swims off. */
  lose() {
    const tg = this.target;
    this.bang.setVisible(false);
    if (tg.visible) {
      const dir = tg.x > this.pond.L.w / 2 ? 1 : -1;
      tg.setFlipX(dir < 0);
      this.scene.tweens.add({ targets: tg, x: tg.x + dir * 600, y: tg.y + 60, alpha: 0, duration: 900, ease: 'Quad.In', onComplete: () => tg.setVisible(false) });
    }
    this.bubbles.explode(6, this.hook.x, this.hook.y);
  }

  update(dt: number, f: Fishing) {
    this.t += dt;
    const L = this.pond.L;
    const water = L.water;

    // Cat blinks now and then.
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      if (this.cat.texture.key === 'sc:cat') {
        setArt(this.cat, 'sc:catBlink', CAT_K);
        this.blinkIn = 0.14;
      } else {
        setArt(this.cat, 'sc:cat', CAT_K);
        this.blinkIn = 2 + Math.random() * 3;
      }
    }
    this.cat.scaleY = this.cat.scaleX * (1 + Math.sin(this.t * 2) * 0.012);
    this.hat.setPosition(this.cat.x, this.cat.y).setScale(this.cat.scaleX, this.cat.scaleY);

    // Rod angle: pulled back while charging, flicks forward on the cast, bends with the fish.
    let angle = ROD_REST + Math.sin(this.t * 1.5) * 1.5;
    if (f.phase === 'charging') angle = -16 - f.power * 22;
    if (f.phase === 'reeling') angle = -6 - f.tension * 18 + Math.sin(this.t * 30) * f.tension * 2.5;
    if (f.phase === 'bite') angle = ROD_REST + 6 + Math.sin(this.t * 40) * 2;
    this.rodKick *= Math.pow(0.002, dt);
    angle += this.rodKick * 18;
    this.placeRod(angle);
    const tip = this.tip();

    const g = this.lineG;
    g.clear();
    if (f.phase === 'ready' || f.phase === 'charging') {
      // Bait dangles from the tip.
      const hx = tip.x + 4;
      const hy = tip.y + 70 + Math.sin(this.t * 2) * 3;
      g.lineStyle(2.5, 0xffffff, 0.85).lineBetween(tip.x, tip.y, hx, hy);
      this.hook.setVisible(true).setPosition(hx, hy).setDepth(26).setAngle(Math.sin(this.t * 2) * 6);
      this.worm.setVisible(true).setPosition(hx - 4, hy + 32).setDepth(26.1);
      this.bobber.setVisible(false);
      return;
    }
    this.hook.setDepth(12.6);
    this.worm.setDepth(12.7);

    let bx = this.landX;
    let by = water;
    let hx = bx;
    let hy = this.hookDepth;
    if (f.phase === 'flying') {
      const k = Math.min(1, f.t / FLY_SEC);
      bx = Phaser.Math.Linear(this.castFrom.x, this.landX, k);
      by = Phaser.Math.Linear(this.castFrom.y, water, k) - Math.sin(k * Math.PI) * 140;
      hx = bx;
      hy = by + 30;
      this.bobber.setAngle(k * 360);
      this.target.setVisible(false);
      if (k >= 0.98) {
        this.splash(this.landX, water, 10);
        this.bobber.setAngle(0);
      }
    } else if (f.phase === 'waiting' || f.phase === 'bite') {
      // Hook sinks, the target swims in from the side.
      const sink = Math.min(1, f.t / 0.8);
      hy = water + (this.hookDepth - water) * (f.phase === 'bite' ? 1 : Phaser.Math.Easing.Quadratic.Out(sink));
      this.dipT += dt;
      const dip = this.dipAmp * Math.exp(-this.dipT * 5) * Math.abs(Math.sin(this.dipT * 14));
      by = water + dip + Math.sin(this.t * 2.2) * 2.5 + (f.phase === 'bite' ? 14 + Math.sin(this.t * 25) * 4 : 0);
      const tg = this.target;
      if (this.targetKey) {
        tg.setVisible(true);
        const a = f.phase === 'bite' ? 1 : Math.min(1, f.approach);
        const fromX = hx + (this.landX > L.w / 2 ? -1 : 1) * 260;
        const dir = Math.sign(hx - fromX) || 1;
        tg.setFlipX(dir < 0);
        const w = (TEX.get(this.targetKey)?.w ?? 160) * this.targetSize;
        tg.x = Phaser.Math.Linear(fromX, hx - (dir * w) / 2 + dir * 10, Phaser.Math.Easing.Sine.Out(a));
        tg.y = hy + 18 + Math.sin(this.t * 3) * 4;
        tg.setAlpha(Math.min(0.55, a * 0.9));
        tg.setAngle(Math.sin(this.t * 6) * 3);
      }
    } else if (f.phase === 'reeling') {
      const p = Phaser.Math.Clamp(f.progress, 0, 1);
      const endX = L.dockEnd + 60;
      bx = Phaser.Math.Linear(this.landX, endX, p);
      this.thrash = Math.sin(this.t * (f.warning ? 30 : 6 + f.tension * 10)) * (f.warning ? 1.3 : 0.4 + f.tension);
      hx = bx + this.thrash * 26;
      hy = Phaser.Math.Linear(this.hookDepth, water + 60, p);
      by = water + 8 + Math.sin(this.t * 18) * (2 + f.tension * 6);
      const tg = this.target;
      if (this.targetKey) {
        tg.setVisible(true).setAlpha(0.62);
        const dir = this.thrash > 0 ? 1 : -1;
        tg.setFlipX(dir < 0);
        const w = (TEX.get(this.targetKey)?.w ?? 160) * this.targetSize;
        tg.x = hx - (dir * w) / 2 + dir * 10;
        tg.y = hy + 16;
        tg.setAngle(this.thrash * 14);
      }
      if (Math.random() < dt * 6) this.bubbles.emitParticleAt(hx, hy);
      if (Math.random() < dt * 4 * f.tension) this.drops.explode(2, bx, water);
    } else if (f.phase === 'done') {
      return;
    }

    this.bobber.setVisible(true).setPosition(bx, by);
    this.hook.setVisible(f.phase !== 'flying').setPosition(hx, hy);
    this.worm.setVisible(f.phase !== 'flying' && f.phase !== 'reeling').setPosition(hx - 4, hy + 34);
    this.bang.setPosition(bx, water - 40 + Math.sin(this.t * 12) * 4);

    // Line from tip to bobber: slack curve while waiting, straight and coloured by tension while reeling.
    const reeling = f.phase === 'reeling';
    const red = reeling && f.tension >= 0.86;
    const color = red ? 0xff5a5a : reeling && f.tension > f.greenRange[1] ? 0xffd23f : 0xffffff;
    const sag = reeling ? 6 : f.phase === 'flying' ? 10 : 46;
    const mx = (tip.x + bx) / 2;
    const my = (tip.y + by) / 2 + sag;
    g.lineStyle(reeling ? 3.5 : 2.5, color, 0.95);
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(tip.x, tip.y), new Phaser.Math.Vector2(mx, my), new Phaser.Math.Vector2(bx, by - 26));
    curve.draw(g, 20);
    if (f.phase !== 'flying') {
      g.lineStyle(2, color, 0.55).lineBetween(bx, by + 20, hx, hy);
    }
    void INK;
  }

  /** Approximate rectangle around the catch target, for the tutorial pointer. */
  bobberPos() {
    return { x: this.bobber.x, y: this.bobber.y };
  }
}
