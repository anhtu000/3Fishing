// The game's own UI kit, drawn in the same style as the art (dark outline, soft shading, cream
// panels), so menus look like part of the pond and not like a generic overlay.
import Phaser from 'phaser';
import { app, shapeTexture } from '@core';
import { TEX } from '../render/textures';
import { KeyNav } from './keynav';

export const INK = 0x3b2a4d;
export const INK_CSS = '#3b2a4d';
export const CREAM = 0xfff6e6;
export const CREAM_DARK = 0xf1dfc0;
export const FONT = 'Fredoka, system-ui, sans-serif';

export const COLORS = {
  green: 0x5fd38d,
  blue: 0x4aa8ff,
  orange: 0xffa53d,
  yellow: 0xffd23f,
  pink: 0xff7aa8,
  purple: 0xa779ff,
  red: 0xff6b6b,
  grey: 0xb8b2c4,
  teal: 0x3fc1c9,
  // Rewarded-ad buttons: never green (Poki rule), always with the clapperboard icon.
  ad: 0x7c6cff,
};

export interface TextOpts {
  color?: string;
  /** Dark outline around the letters (default on for light text). */
  stroke?: boolean;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
  weight?: '500' | '600' | '700';
}

/** Rounded game text. Light text gets a dark outline so it reads on any background. */
export function txt(scene: Phaser.Scene, x: number, y: number, value: string, size: number, opts: TextOpts = {}) {
  const color = opts.color ?? '#ffffff';
  const stroke = opts.stroke ?? color === '#ffffff';
  const t = scene.add.text(x, y, value, {
    fontFamily: FONT,
    fontStyle: opts.weight ?? '700',
    fontSize: size,
    color,
    align: opts.align ?? 'center',
    stroke: stroke ? INK_CSS : undefined,
    strokeThickness: stroke ? Math.max(4, Math.round(size / 6)) : 0,
    wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: true } : undefined,
    resolution: app.textResolution,
    padding: { x: 4, y: 4 },
  });
  t.setOrigin(0.5);
  return t;
}

/** Image of a vector texture at `size` times its design size. */
export function art(scene: Phaser.Scene, x: number, y: number, key: string, size = 1) {
  const img = scene.add.image(x, y, key);
  setArt(img, key, size);
  return img;
}

export function setArt(img: Phaser.GameObjects.Image, key: string, size = 1) {
  const info = TEX.get(key);
  if (img.texture.key !== key) img.setTexture(key);
  img.setScale(size / (info?.scale ?? 1));
  return img;
}

/** Display scale for a texture so it is `size` design units across its longer side. */
export function fitScale(key: string, size: number) {
  const info = TEX.get(key);
  if (!info) return 1;
  return size / Math.max(info.w, info.h) / info.scale;
}

function shade(color: number, f: number) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return Phaser.Display.Color.GetColor(Math.round(c.red * f), Math.round(c.green * f), Math.round(c.blue * f));
}
function tint(color: number, f: number) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return Phaser.Display.Color.GetColor(m(c.red), m(c.green), m(c.blue));
}

/** Outlined rounded box with a darker bottom lip: buttons, chips and cards. */
export function drawChunky(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, r: number, lip = 8, pressed = false, outline = 5) {
  const top = -h / 2 + (pressed ? lip / 2 : 0);
  const faceH = h - lip;
  g.fillStyle(INK, 1);
  g.fillRoundedRect(-w / 2 - outline / 2, -h / 2 - outline / 2 + (pressed ? lip / 2 : 0), w + outline, h + outline - (pressed ? lip / 2 : 0), r + outline / 2);
  g.fillStyle(shade(color, 0.72), 1);
  g.fillRoundedRect(-w / 2 + outline / 2, top + outline / 2, w - outline, h - outline - (pressed ? lip / 2 : 0), r);
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2 + outline / 2, top + outline / 2, w - outline, faceH - outline, r);
  g.fillStyle(tint(color, 0.35), 1);
  g.fillRoundedRect(-w / 2 + outline / 2 + 8, top + outline / 2 + 6, w - outline - 16, Math.max(6, (faceH - outline) * 0.32), { tl: r * 0.7, tr: r * 0.7, bl: 6, br: 6 });
}

export interface CButtonOpts {
  w: number;
  h: number;
  color?: number;
  label?: string;
  fontSize?: number;
  /** Texture key of an icon on the left (or centered without label). */
  icon?: string;
  iconSize?: number;
  /** Small "video" badge for rewarded ads. */
  ad?: boolean;
  /** Icon above the label instead of beside it. */
  stack?: boolean;
  sound?: string | false;
  onClick: () => void;
}

/**
 * Chunky outlined button. Fires on release when the press started on it, so swipes do not click.
 */
export class CButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private face: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text | null = null;
  icon: Phaser.GameObjects.Image | null = null;
  private badge: Phaser.GameObjects.Container | null = null;
  private pressed = false;
  enabled = true;
  private glowTween: Phaser.Tweens.Tween | null = null;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    public opts: CButtonOpts,
  ) {
    super(scene, x, y);
    this.bg = scene.add.image(0, 0, '__DEFAULT');
    this.face = scene.add.container(0, 0);
    this.add([this.bg, this.face]);
    // A labelled rewarded button carries the clapperboard as its icon; round icon buttons get it as a badge.
    if (opts.ad && opts.label != null && !opts.icon) opts.icon = 'icon:i_video';
    if (opts.icon) {
      this.icon = art(scene, 0, 0, opts.icon);
      this.face.add(this.icon);
    }
    if (opts.label != null) {
      this.label = txt(scene, 0, 0, opts.label, opts.fontSize ?? 34);
      this.face.add(this.label);
    }
    if (opts.ad && opts.icon !== 'icon:i_video') {
      const g = scene.add.graphics();
      g.fillStyle(INK, 1).fillCircle(0, 0, 25);
      g.fillStyle(0xffffff, 1).fillCircle(0, 0, 21);
      const clap = art(scene, 0, 0, 'icon:i_video');
      clap.setScale(fitScale('icon:i_video', 34));
      this.add(scene.add.container(opts.w / 2 - 8, -opts.h / 2 + 8, [g, clap]));
    }
    this.redraw();
    this.layoutFace();
    const pad = 8;
    this.setSize(opts.w, opts.h);
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-pad, -pad, opts.w + pad * 2, opts.h + pad * 2),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e?.stopPropagation?.();
      if (!this.enabled) return;
      this.pressed = true;
      this.face.y = 4;
      this.redraw();
      if (opts.sound !== false) app.audio.play(opts.sound ?? 'ui-tap', { pitchJitter: 50, volume: 0.6 });
      app.haptic(8);
    });
    this.on('pointerout', () => this.unpress());
    this.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e?.stopPropagation?.();
      const fire = this.pressed && this.enabled;
      this.unpress();
      if (fire) opts.onClick();
    });
    scene.add.existing(this);
    const off = app.viewport.on('change', () => this.redraw());
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      off();
      this.glowTween?.remove();
    });
  }

  /** Keyboard press (Space/Enter on the focused button): same sound and feedback as a tap. */
  press() {
    if (!this.enabled || !this.active) return;
    if (this.opts.sound !== false) app.audio.play(this.opts.sound ?? 'ui-tap', { pitchJitter: 50, volume: 0.6 });
    this.face.y = 4;
    this.scene.time.delayedCall(90, () => {
      if (this.active) this.face.y = 0;
    });
    this.opts.onClick();
  }

  private unpress() {
    if (!this.pressed) return;
    this.pressed = false;
    this.face.y = 0;
    this.redraw();
  }

  setLabel(s: string) {
    if (this.label && this.label.text !== s) {
      this.label.setText(s);
      this.layoutFace();
    }
    return this;
  }

  setColor(color: number) {
    if (this.opts.color !== color) {
      this.opts.color = color;
      this.redraw();
    }
    return this;
  }

  setEnabled(v: boolean) {
    if (this.enabled === v) return this;
    this.enabled = v;
    this.setAlpha(v ? 1 : 0.55);
    if (!v) this.unpress();
    return this;
  }

  /** Gentle pulse that says "something to do here". */
  setGlow(on: boolean) {
    if (on && !this.glowTween) {
      this.glowTween = this.scene.tweens.add({ targets: this.face, scale: 1.07, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    } else if (!on && this.glowTween) {
      this.glowTween.remove();
      this.glowTween = null;
      this.face.setScale(1);
    }
    return this;
  }

  /** Red dot with a number (0 hides it, -1 shows a "!" dot). */
  setBadge(n: number) {
    if (n === 0) {
      this.badge?.setVisible(false);
      return this;
    }
    if (!this.badge) {
      const g = this.scene.add.graphics();
      g.fillStyle(INK, 1).fillCircle(0, 0, 21);
      g.fillStyle(0xff4d6d, 1).fillCircle(0, 0, 17);
      const t = txt(this.scene, 0, -1, '', 22, { stroke: false });
      this.badge = this.scene.add.container(this.opts.w / 2 - 10, -this.opts.h / 2 + 10, [g, t]);
      this.add(this.badge);
      this.scene.tweens.add({ targets: this.badge, scale: 1.15, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    this.badge.setVisible(true);
    (this.badge.list[1] as Phaser.GameObjects.Text).setText(n < 0 ? '!' : String(n));
    return this;
  }

  private layoutFace() {
    const { w, h } = this.opts;
    const lift = -4;
    const iconSize = this.opts.iconSize ?? Math.min(h * 0.62, 80);
    if (this.icon) {
      const key = this.icon.texture.key;
      this.icon.setScale(fitScale(key, iconSize));
    }
    if (this.opts.stack && this.icon && this.label) {
      this.icon.setPosition(0, lift - h * 0.15);
      this.label.setPosition(0, lift + h * 0.28);
      this.label.setScale(this.label.width > w - 16 ? (w - 16) / this.label.width : 1);
    } else if (this.icon && this.label && this.label.text) {
      const total = iconSize + 10 + this.label.width;
      if (total > w - 20) this.label.setScale(Math.max(0.6, (w - 30 - iconSize) / this.label.width));
      const lw = this.label.width * this.label.scaleX;
      const t2 = iconSize + 8 + lw;
      this.icon.setPosition(-t2 / 2 + iconSize / 2, lift);
      this.label.setPosition(-t2 / 2 + iconSize + 8 + lw / 2, lift);
    } else {
      this.icon?.setPosition(0, lift);
      if (this.label) {
        this.label.setPosition(0, lift);
        if (this.label.width > w - 24) this.label.setScale((w - 24) / this.label.width);
        else this.label.setScale(1);
      }
    }
  }

  private redraw() {
    const { w, h } = this.opts;
    const color = this.opts.color ?? COLORS.green;
    const r = Math.min(26, h / 2 - 2);
    const t = shapeTexture(this.scene, `cbtn|${w}|${h}|${color}|${this.pressed ? 1 : 0}`, w, h, (g) => drawChunky(g, w, h, color, r, 8, this.pressed), 6);
    if (this.bg.texture.key !== t.key) this.bg.setTexture(t.key);
    this.bg.setScale(1 / t.res);
  }
}

/** Round icon button (HUD side buttons). */
export function roundButton(scene: Phaser.Scene, x: number, y: number, icon: string, size: number, color: number, onClick: () => void, ad = false) {
  return new CButton(scene, x, y, { w: size, h: size, icon, iconSize: size * 0.62, color, ad, onClick });
}

/** Cream card with an outline, as an image. */
export function card(scene: Phaser.Scene, x: number, y: number, w: number, h: number, color = CREAM, r = 26) {
  const t = shapeTexture(scene, `card|${w}|${h}|${color}|${r}`, w, h, (g) => drawChunky(g, w, h, color, r, 8, false, 5), 6);
  return scene.add.image(x, y, t.key).setScale(1 / t.res);
}

export interface CPanelOpts {
  title: string;
  w?: number;
  h?: number;
  /** Header ribbon colour. */
  color?: number;
  onClose?: () => void;
  closable?: boolean;
}

/**
 * Modal window: dims the pond, cream body with an outlined coloured title ribbon, round close button.
 * `content` is centred on the panel; `top` is the y just below the title ribbon.
 */
export class CPanel extends Phaser.GameObjects.Container {
  readonly content: Phaser.GameObjects.Container;
  readonly pw: number;
  readonly ph: number;
  private dim: Phaser.GameObjects.Rectangle;
  readonly box: Phaser.GameObjects.Container;
  private closed = false;
  private offResize: () => void;
  private onEsc = () => this.close();
  /** Keyboard control; set `nav.primary` for the button Space/Enter should press right away. */
  readonly nav: KeyNav;
  constructor(
    scene: Phaser.Scene,
    private opts: CPanelOpts,
  ) {
    super(scene, 0, 0);
    const vp = app.viewport.info;
    // Panels keep their designed size and scale down as a whole on short screens (landscape),
    // so their content never overlaps.
    this.pw = Math.min(opts.w ?? 640, 688);
    this.ph = opts.h ?? 820;
    const w = this.pw;
    const h = this.ph;
    this.dim = scene.add.rectangle(0, 0, 10, 10, 0x1a1030, 0.55).setOrigin(0).setInteractive();
    this.dim.on('pointerup', () => {
      if (opts.closable !== false) this.close();
    });
    const body = card(scene, 0, 0, w, h, CREAM, 34);
    const hit = scene.add.zone(0, 0, w, h).setInteractive();
    const ribbonW = Math.min(w - 60, Math.max(300, opts.title.length * 26 + 120));
    const color = opts.color ?? COLORS.blue;
    const rt = shapeTexture(scene, `ribbon|${ribbonW}|${color}`, ribbonW, 84, (g) => drawChunky(g, ribbonW, 84, color, 30, 8, false, 5), 6);
    const ribbon = scene.add.image(0, -h / 2 + 4, rt.key).setScale(1 / rt.res);
    const title = txt(scene, 0, -h / 2, opts.title, 42);
    this.content = scene.add.container(0, 0);
    this.box = scene.add.container(0, 0, [body, hit, this.content, ribbon, title]);
    if (opts.closable !== false) {
      const close = new CButton(scene, w / 2 - 30, -h / 2 + 10, { w: 76, h: 76, color: COLORS.red, label: '×', fontSize: 52, onClick: () => this.close() });
      this.box.add(close);
      scene.input.keyboard?.on('keydown-ESC', this.onEsc);
    }
    this.add([this.dim, this.box]);
    this.setDepth(1500);
    scene.add.existing(this);
    // Keyboard: arrows or WASD move between the buttons, Space or Enter presses (Poki: menus by keyboard).
    this.nav = new KeyNav(scene, this.box);
    this.place();
    this.offResize = app.viewport.on('change', () => this.place());
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.offResize();
      scene.input.keyboard?.off('keydown-ESC', this.onEsc);
    });
    this.dim.setAlpha(0);
    const fit = this.fit();
    this.box.setScale(0.8 * fit).setAlpha(0);
    scene.tweens.add({ targets: this.dim, alpha: 1, duration: 160 });
    scene.tweens.add({ targets: this.box, scale: fit, alpha: 1, duration: 280, ease: 'Back.Out' });
    void vp;
    app.audio.play('open', { volume: 0.5 });
  }

  get top() {
    return -this.ph / 2 + 70;
  }
  get bottom() {
    return this.ph / 2;
  }
  get isClosed() {
    return this.closed;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.opts.onClose?.();
    this.scene.tweens.add({ targets: this.dim, alpha: 0, duration: 140 });
    this.scene.tweens.add({ targets: this.box, scale: 0.88 * this.fit(), alpha: 0, duration: 140, onComplete: () => this.destroy() });
  }

  /** Scale that fits the panel (plus its ribbon and close button) on screen. */
  fit() {
    const vp = app.viewport.info;
    return Math.min(1, (vp.height - 70) / (this.ph + 60), (vp.width - 24) / (this.pw + 30));
  }

  /** Converts a point inside the panel to scene coordinates (for effects that fly out of it). */
  toScene(x: number, y: number) {
    const k = this.box.scale;
    return { x: this.box.x + x * k, y: this.box.y + y * k };
  }

  private place() {
    const vp = app.viewport.info;
    if (!this.closed && this.box.alpha === 1) this.box.setScale(this.fit());
    this.dim.setSize(vp.width, vp.height);
    this.dim.input?.hitArea.setSize(vp.width, vp.height);
    this.box.setPosition(vp.width / 2, vp.height / 2 + 20 * this.fit());
  }
}

/** Horizontal progress bar drawn into a Graphics (call again to update). */
export function drawBar(g: Phaser.GameObjects.Graphics, w: number, h: number, value: number, color: number, back = 0xe8d9bd) {
  g.clear();
  g.fillStyle(INK, 1).fillRoundedRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, (h + 6) / 2);
  g.fillStyle(back, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  const fw = Math.max(0, Math.min(1, value)) * w;
  if (fw > 2) {
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, Math.max(h, fw), h, h / 2);
    g.fillStyle(0xffffff, 0.3).fillRoundedRect(-w / 2 + 4, -h / 2 + 3, Math.max(h - 8, fw - 8), h * 0.3, h * 0.15);
  }
}

export function fmt(n: number) {
  if (n < 10000) return String(Math.floor(n));
  if (n < 1e6) return `${(n / 1000).toFixed(n < 1e5 ? 1 : 0)}K`;
  return `${(n / 1e6).toFixed(2)}M`;
}

/** Shrinks a text so it fits in maxW (long translations), never grows it. Returns the text. */
export function fitText(t: Phaser.GameObjects.Text, maxW: number) {
  t.setScale(1);
  if (t.width > maxW) t.setScale(maxW / t.width);
  return t;
}
