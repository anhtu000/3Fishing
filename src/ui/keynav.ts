// Keyboard control of menus and popups (Poki: arrows or WASD move through a menu, Space or Enter is
// the main button, ESC goes back). Mouse and touch players never see it: the focus ring appears with
// the first arrow key.
import Phaser from 'phaser';
import type { CButton } from './kit';

const MOVE: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

/** Open menus and popups, newest last: only the top one listens. */
const stack: KeyNav[] = [];

function isButton(o: Phaser.GameObjects.GameObject): o is CButton {
  return typeof (o as Partial<CButton>).press === 'function' && 'opts' in o;
}

function shown(o: Phaser.GameObjects.GameObject): boolean {
  let p: Phaser.GameObjects.GameObject | null = o;
  while (p) {
    const v = p as unknown as { visible?: boolean; alpha?: number };
    if (v.visible === false || v.alpha === 0) return false;
    p = p.parentContainer;
  }
  return true;
}

export class KeyNav {
  /** Pressed by Space/Enter before the player has moved the focus (OK, Yay, Collect...). */
  primary: CButton | null = null;
  /** Called when the focus moves to a button (v1.16: scrolling lists bring it into view). */
  onFocus: ((b: CButton) => void) | null = null;
  /** v1.16: false hides the ring (a button scrolled out of a list's window). */
  canShow: ((b: CButton) => boolean) | null = null;

  /** Hides the focus ring (the player went back to touch or the mouse). */
  hideRing() {
    this.ring.setVisible(false);
  }
  private focus: CButton | null = null;
  private ring: Phaser.GameObjects.Graphics;
  private onKey = (e: KeyboardEvent) => this.key(e);

  constructor(
    private scene: Phaser.Scene,
    private root: Phaser.GameObjects.Container,
  ) {
    // Drawn in screen space every frame, so it follows tweens and survives menus that rebuild pages.
    this.ring = scene.add.graphics().setDepth(2500).setVisible(false);
    stack.push(this);
    scene.input.keyboard?.on('keydown', this.onKey);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.draw, this);
    root.once(Phaser.GameObjects.Events.DESTROY, () => this.dispose());
  }

  private dispose() {
    const i = stack.indexOf(this);
    if (i >= 0) stack.splice(i, 1);
    this.scene.input.keyboard?.off('keydown', this.onKey);
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.draw, this);
    this.ring.destroy();
  }

  private draw() {
    const b = this.focus;
    if (!this.ring.visible) return;
    if (!b || !b.active || !shown(b)) {
      this.ring.setVisible(false);
      return;
    }
    if (this.canShow && !this.canShow(b)) {
      this.ring.clear();
      return;
    }
    const r = b.getBounds();
    const rad = Math.min(30, r.height / 2 + 10);
    this.ring.clear();
    this.ring.lineStyle(7, 0xffffff, 1).strokeRoundedRect(r.x - 10, r.y - 10, r.width + 20, r.height + 20, rad);
    this.ring.lineStyle(3, 0x3b2a4d, 1).strokeRoundedRect(r.x - 14, r.y - 14, r.width + 28, r.height + 28, rad + 4);
  }

  /** Buttons that can be pressed now, top to bottom then left to right. */
  private buttons() {
    const out: CButton[] = [];
    const walk = (list: Phaser.GameObjects.GameObject[]) => {
      for (const o of list) {
        if (isButton(o)) {
          if (o.enabled && o.input?.enabled && shown(o)) out.push(o);
        } else if (o instanceof Phaser.GameObjects.Container) walk(o.list);
      }
    };
    walk(this.root.list);
    const c = (b: CButton) => b.getBounds();
    return out.sort((a, b) => {
      const ra = c(a);
      const rb = c(b);
      return Math.abs(ra.centerY - rb.centerY) > 12 ? ra.centerY - rb.centerY : ra.centerX - rb.centerX;
    });
  }

  private key(e: KeyboardEvent) {
    if (stack[stack.length - 1] !== this || !this.root.active) return;
    const code = e.code;
    if (code === 'Space' || code === 'Enter' || code === 'NumpadEnter') {
      e.preventDefault();
      if (e.repeat) return;
      const target = this.focus && this.ring.visible ? this.focus : this.primary;
      if (target && target.active && target.enabled) target.press();
      else this.move(0, 0);
      return;
    }
    if (code === 'Tab') {
      e.preventDefault();
      this.cycle(e.shiftKey ? -1 : 1);
      return;
    }
    const d = MOVE[code];
    if (d) this.move(d[0], d[1]);
  }

  private cycle(dir: number) {
    const all = this.buttons();
    if (all.length === 0) return;
    const i = this.focus && this.ring.visible ? all.indexOf(this.focus) : -1;
    this.setFocus(all[(i + dir + all.length) % all.length]);
  }

  /** Moves the focus to the nearest button in the direction (0, 0: show the focus where it starts). */
  private move(dx: number, dy: number) {
    const all = this.buttons();
    if (all.length === 0) return;
    const cur = this.focus && this.ring.visible && all.includes(this.focus) ? this.focus : null;
    if (!cur || (dx === 0 && dy === 0)) {
      // Start on the main button, else the first one that is not the panel's close button (ESC closes).
      const start = this.primary && all.includes(this.primary) ? this.primary : (all.find((b) => b.opts.label !== '×') ?? all[0]);
      this.setFocus(cur ?? start);
      return;
    }
    const from = cur.getBounds();
    let best: CButton | null = null;
    let bestScore = Infinity;
    for (const b of all) {
      if (b === cur) continue;
      const r = b.getBounds();
      const ox = r.centerX - from.centerX;
      const oy = r.centerY - from.centerY;
      const along = ox * dx + oy * dy;
      if (along <= 8) continue;
      const across = Math.abs(ox * dy) + Math.abs(oy * dx);
      const score = along + across * 2;
      if (score < bestScore) {
        bestScore = score;
        best = b;
      }
    }
    if (best) this.setFocus(best);
  }

  private setFocus(b: CButton) {
    this.focus = b;
    this.onFocus?.(b);
    this.ring.setVisible(true);
    this.draw();
  }
}
