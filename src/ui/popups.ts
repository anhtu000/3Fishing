// Reward moments: the catch card, coins flying home, the egg hatch reveal and small toasts.
// These are the moments players screenshot, so they get the most juice: rays, sparkles, bounce, sound.
import Phaser from 'phaser';
import { app, shapeTexture } from '@core';
import { PERKS, RARITY_COLOR, RARITY_CSS, petById, type PetDef } from '../content/data';
import { eggName, fishName, junkName, perkText, petName, rarityName, t } from '../i18n/t';
import type { CatchResult } from '../logic/game';
import { perkValue, type HatchResult } from '../logic/rules';
import { CButton, COLORS, CREAM, INK, art, card, drawChunky, fitScale, txt } from './kit';

const DEPTH = 1300;

/** Soft rotating sunburst behind a reward. */
export function rays(scene: Phaser.Scene, x: number, y: number, color: number, size = 560) {
  const t = shapeTexture(scene, `rays|${color}|${size}`, size, size, (g) => {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = a0 + Math.PI / n;
      g.fillStyle(color, 0.35);
      g.fillTriangle(0, 0, Math.cos(a0) * size / 2, Math.sin(a0) * size / 2, Math.cos(a1) * size / 2, Math.sin(a1) * size / 2);
    }
    g.fillStyle(0xffffff, 0.35).fillCircle(0, 0, size * 0.22);
  }, 2);
  const img = scene.add.image(x, y, t.key).setScale(0.2 / t.res);
  scene.tweens.add({ targets: img, scale: 1 / t.res, duration: 400, ease: 'Back.Out' });
  scene.tweens.add({ targets: img, angle: 360, duration: 14000, repeat: -1 });
  return img;
}

export function sparkles(scene: Phaser.Scene, x: number, y: number, n = 10, spread = 200) {
  for (let i = 0; i < n; i++) {
    const s = art(scene, x + (Math.random() - 0.5) * spread * 2, y + (Math.random() - 0.5) * spread * 1.4, 'item:sparkle', 0.3 + Math.random() * 0.4).setDepth(DEPTH + 5).setAlpha(0);
    scene.tweens.add({ targets: s, alpha: 1, scale: s.scale * 1.4, angle: 90, duration: 300, delay: i * 70, yoyo: true, onComplete: () => s.destroy() });
  }
}

/** Coins (or gems) arc from a point to the HUD counter. */
export function flyIcons(scene: Phaser.Scene, key: string, from: { x: number; y: number }, to: { x: number; y: number }, n: number, onEach?: () => void) {
  for (let i = 0; i < n; i++) {
    const c = art(scene, from.x, from.y, key, 0.42).setDepth(DEPTH + 10);
    const mid = { x: from.x + (Math.random() - 0.5) * 220, y: from.y - 80 - Math.random() * 120 };
    const path = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(from.x, from.y), new Phaser.Math.Vector2(mid.x, mid.y), new Phaser.Math.Vector2(to.x, to.y));
    const o = { t: 0 };
    scene.tweens.add({
      targets: o,
      t: 1,
      duration: 520 + i * 40,
      delay: i * 45,
      ease: 'Cubic.In',
      onUpdate: () => {
        const p = path.getPoint(o.t);
        c.setPosition(p.x, p.y);
      },
      onComplete: () => {
        c.destroy();
        onEach?.();
      },
    });
  }
}

export interface CatchView {
  result: CatchResult;
  from: { x: number; y: number };
  coinTo: { x: number; y: number };
  gemTo: { x: number; y: number };
  eggTo: { x: number; y: number };
  onCoins: () => void;
  onGems: () => void;
}

function catchInfo(r: CatchResult) {
  const roll = r.roll;
  switch (roll.kind) {
    case 'fish':
      return { key: `fish:${roll.fish.id}`, name: fishName(roll.fish.id), rarity: roll.fish.rarity, line: `${r.cm.toFixed(1)} cm`, size: 360 };
    case 'egg':
      return { key: `egg:${roll.tier}`, name: eggName(roll.tier), rarity: roll.tier, line: r.eggWhere === 'basket' ? t('catch.intoBasket') : r.eggStored ? t('catch.intoIncubator') : t('catch.sold'), size: 200 };
    case 'junk':
      return { key: `item:${roll.item}`, name: junkName(roll.item), rarity: -1, line: t(`catch.junk${Math.floor(Math.random() * 5)}`), size: 170 };
    case 'chest':
      return { key: 'item:chest', name: t('catch.chest'), rarity: 3, line: '', size: 220 };
  }
}

/** True when the catch deserves the big card; repeats of common fish get a quick pop instead. */
export function isBigCatch(r: CatchResult) {
  if (r.roll.kind === 'fish') return r.isNew || r.record || r.bounty || r.today || r.roll.fish.rarity >= 2;
  return r.roll.kind !== 'junk';
}

/** Quick pop above the water for everyday catches: no tap needed, the next cast can start now. */
export function quickCatch(scene: Phaser.Scene, v: CatchView) {
  const info = catchInfo(v.result);
  const startScale = fitScale(info.key, info.size * 0.5);
  const img = scene.add.image(v.from.x, v.from.y, info.key).setDepth(DEPTH).setScale(startScale * 0.6);
  const peakY = v.from.y - 170;
  scene.tweens.add({ targets: img, y: peakY, scale: startScale, angle: 360 * (Math.random() < 0.5 ? 1 : -1), duration: 420, ease: 'Quad.Out' });
  const label = txt(scene, v.from.x, peakY - 90, info.name, 30).setDepth(DEPTH + 1).setAlpha(0);
  const reward = txt(scene, v.from.x, peakY + 80, v.result.coins > 0 ? `+${v.result.coins}` : '', 40, { color: '#ffe066' }).setDepth(DEPTH + 1).setAlpha(0);
  scene.tweens.add({ targets: [label, reward], alpha: 1, duration: 200, delay: 250 });
  if (info.rarity < 0) label.setText(`${info.name}\n${info.line}`).setFontSize(26);
  scene.time.delayedCall(950, () => {
    scene.tweens.add({ targets: [label, reward], alpha: 0, duration: 200, onComplete: () => (label.destroy(), reward.destroy()) });
    scene.tweens.add({ targets: img, scale: 0, duration: 220, onComplete: () => img.destroy() });
    if (v.result.coins > 0) flyIcons(scene, 'item:coin', { x: img.x, y: img.y }, v.coinTo, Math.min(6, 2 + Math.floor(v.result.coins / 10)), v.onCoins);
  });
  app.audio.play(v.result.roll.kind === 'junk' ? 'junk' : 'catch', { pitchJitter: 80 });
}

/** The big catch card. Resolves when it has gone. */
export function bigCatch(scene: Phaser.Scene, v: CatchView): Promise<void> {
  return new Promise((resolve) => {
    const vp = app.viewport.info;
    const r = v.result;
    const info = catchInfo(r);
    const cx = vp.width / 2;
    const cy = vp.height * 0.45;
    const color = info.rarity >= 0 ? RARITY_COLOR[info.rarity] : COLORS.grey;
    const layer = scene.add.container(0, 0).setDepth(DEPTH);
    const dim = scene.add.rectangle(0, 0, vp.width, vp.height, 0x1a1030, 0.5).setOrigin(0).setInteractive();
    layer.add(dim);
    const ray = rays(scene, cx, cy - 40, info.rarity >= 3 ? 0xffe066 : 0xffffff, info.rarity >= 3 ? 760 : 620);
    layer.add(ray);
    const cw = Math.min(500, vp.width - 60);
    const ch = 560;
    const body = card(scene, 0, 0, cw, ch, CREAM, 36);
    const ribT = shapeTexture(scene, `rib|${color}`, 300, 70, (g) => drawChunky(g, 300, 70, color, 26, 7, false, 5), 6);
    const ribbon = scene.add.image(0, -ch / 2 + 4, ribT.key).setScale(1 / ribT.res);
    const rarityText = info.rarity >= 0 ? rarityName(info.rarity).toLocaleUpperCase() : t('catch.junkLabel');
    const ribLabel = txt(scene, 0, -ch / 2, r.roll.kind === 'chest' ? t('catch.treasureLabel') : rarityText, 32);
    const name = txt(scene, 0, 120, info.name, 44, { color: '#3b2a4d', stroke: false, wrap: cw - 40 });
    const sub = txt(scene, 0, 172, info.line, 30, { color: '#7a6a8a', stroke: false, wrap: cw - 40 });
    const items: Phaser.GameObjects.GameObject[] = [body, ribbon, ribLabel, name, sub];
    if (r.coins > 0 || r.gems > 0) {
      const parts: string[] = [];
      if (r.coins > 0) parts.push(`+${r.coins}`);
      const rewardText = txt(scene, 26, 228, parts.join(''), 42, { color: '#ffb81c' });
      const coin = art(scene, rewardText.x - rewardText.width / 2 - 30, 226, 'item:coin', 0.48);
      if (r.coins > 0) items.push(coin, rewardText);
      if (r.gems > 0) {
        const gt = txt(scene, r.coins > 0 ? 150 : 26, 228, `+${r.gems}`, 42, { color: '#5fc8ff' });
        const gem = art(scene, gt.x - gt.width / 2 - 28, 226, 'item:gem', 0.46);
        items.push(gem, gt);
        if (r.coins > 0) {
          rewardText.x -= 70;
          coin.x -= 70;
        }
      }
    }
    if (r.isNew || r.record || r.bounty || r.today) {
      const sticker = scene.add.container(cw / 2 - 40, -ch / 2 + 70);
      const st = shapeTexture(scene, 'sticker', 150, 70, (g) => drawChunky(g, 150, 70, 0xff4d6d, 24, 6, false, 5), 6);
      sticker.add(scene.add.image(0, 0, st.key).setScale(1 / st.res));
      sticker.add(txt(scene, 0, -3, r.today ? t('catch.today') : r.bounty ? t('catch.wanted') : r.isNew ? t('catch.new') : t('catch.record'), r.isNew && !r.bounty && !r.today ? 34 : 26));
      sticker.setAngle(14);
      items.push(sticker);
      scene.tweens.add({ targets: sticker, scale: 1.12, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    const k = Math.min(1, (vp.height - 60) / (ch + 120));
    const box = scene.add.container(cx, cy, items).setScale(0.6 * k).setAlpha(0);
    layer.add(box);
    scene.tweens.add({ targets: box, scale: k, alpha: 1, duration: 300, delay: 220, ease: 'Back.Out' });

    // The catch itself flies from the water into the card.
    const target = fitScale(info.key, info.size * k);
    const img = scene.add.image(v.from.x, v.from.y, info.key).setScale(target * 0.4);
    layer.add(img);
    const peak = { x: (v.from.x + cx) / 2, y: Math.min(v.from.y, cy) - 220 };
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(v.from.x, v.from.y), new Phaser.Math.Vector2(peak.x, peak.y), new Phaser.Math.Vector2(cx, cy - 70 * k));
    const o = { t: 0 };
    scene.tweens.add({
      targets: o,
      t: 1,
      duration: 520,
      ease: 'Sine.InOut',
      onUpdate: () => {
        const p = curve.getPoint(o.t);
        img.setPosition(p.x, p.y).setScale(target * (0.4 + 0.6 * o.t)).setAngle((1 - o.t) * 540);
      },
      onComplete: () => {
        scene.tweens.add({ targets: img, y: img.y - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        if (info.rarity >= 2 || r.isNew) sparkles(scene, cx, cy - 70 * k, info.rarity >= 3 ? 16 : 9, 180);
      },
    });
    if (r.isNew) app.audio.play('new');
    else if (info.rarity >= 3) app.audio.play('rare');
    else app.audio.play(r.roll.kind === 'chest' ? 'chest' : 'catch');
    if (info.rarity >= 3) {
      scene.cameras.main.shake(260, 0.006);
      app.haptic(40);
    }

    const hint = txt(scene, cx, cy + (ch / 2 + 40) * k, t('catch.tapContinue'), 28).setAlpha(0);
    layer.add(hint);
    scene.tweens.add({ targets: hint, alpha: 0.9, duration: 300, delay: 900 });

    let closing = false;
    const close = () => {
      if (closing) return;
      closing = true;
      if (r.coins > 0) flyIcons(scene, 'item:coin', { x: cx, y: cy + 228 * k }, v.coinTo, Math.min(10, 3 + Math.floor(r.coins / 15)), v.onCoins);
      if (r.gems > 0) flyIcons(scene, 'item:gem', { x: cx, y: cy + 228 * k }, v.gemTo, Math.min(6, r.gems), v.onGems);
      if (r.roll.kind === 'egg' && r.eggStored) {
        const egg = art(scene, cx, cy - 70 * k, info.key, 0).setDepth(DEPTH + 10);
        egg.setScale(img.scale);
        scene.tweens.add({ targets: egg, x: v.eggTo.x, y: v.eggTo.y, scale: img.scale * 0.35, duration: 500, ease: 'Cubic.In', onComplete: () => egg.destroy() });
      }
      scene.tweens.add({ targets: layer, alpha: 0, duration: 200, onComplete: () => layer.destroy() });
      resolve();
    };
    // Close on a fresh tap only: the player is often still holding from reeling when the card appears.
    const shownAt = scene.time.now;
    dim.on('pointerdown', () => {
      if (scene.time.now - shownAt > 450) close();
    });
    const auto = scene.time.delayedCall(r.isNew || info.rarity >= 3 ? 3200 : 2000, close);
    layer.once(Phaser.GameObjects.Events.DESTROY, () => auto.remove());
    scene.input.keyboard?.once('keydown-SPACE', close);
  });
}

/** Egg wobbles, cracks and the pet pops out. Resolves when the player taps "Yay!". */
export function hatchReveal(scene: Phaser.Scene, tier: number, petId: string, result: HatchResult, shiny: boolean, level: number): Promise<void> {
  return new Promise((resolve) => {
    const vp = app.viewport.info;
    const cx = vp.width / 2;
    const cy = vp.height * 0.42;
    const k = Math.min(1, vp.height / 940);
    const pet = petById.get(petId) as PetDef;
    const layer = scene.add.container(0, 0).setDepth(DEPTH + 20);
    const dim = scene.add.rectangle(0, 0, vp.width, vp.height, 0x1a1030, 0.72).setOrigin(0).setInteractive();
    layer.add(dim);
    const egg = art(scene, cx, cy, `egg:${tier}`, 1.3 * k);
    layer.add(egg);
    app.audio.play('wobble');
    scene.tweens.add({
      targets: egg,
      angle: { from: -12, to: 12 },
      duration: 110,
      yoyo: true,
      repeat: 6,
      onRepeat: () => app.audio.play('wobble', { volume: 0.4, pitchJitter: 200 }),
      onComplete: () => {
        egg.destroy();
        app.audio.play('hatch');
        scene.cameras.main.flash(250, 255, 255, 255);
        const ray = rays(scene, cx, cy, RARITY_COLOR[pet.rarity], 720 * k);
        layer.add(ray);
        const img = art(scene, cx, cy, `pet:${petId}`, 1.6).setScale(0);
        if (shiny) img.setTint(0xfff1a8, 0xffffff, 0xbfefff, 0xffd1ef);
        layer.add(img);
        scene.tweens.add({ targets: img, scale: fitScale(`pet:${petId}`, 330 * k), duration: 500, ease: 'Back.Out' });
        scene.tweens.add({ targets: img, y: cy - 12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 500 });
        sparkles(scene, cx, cy, shiny ? 20 : 10, 200);
        const headline = result.kind === 'new' ? (shiny ? t('hatch.shinyNew') : t('hatch.new')) : result.kind === 'xp' && result.levelUp ? t('hatch.levelUp', { n: level }) : result.kind === 'xp' ? t('hatch.xp') : t('hatch.max', { n: result.coins });
        const h = txt(scene, cx, cy - 250 * k, headline, 54 * Math.max(0.8, k), { color: '#ffe066' });
        const name = txt(scene, cx, cy + 210 * k, petName(pet.id), 48 * Math.max(0.8, k));
        const perk = PERKS[pet.perk];
        const val = perkValue(pet.perk, pet.rarity, level);
        const perkLine = `${rarityName(pet.rarity).toLocaleUpperCase()}  ·  ${perkText(pet.perk, val, perk.unit)}`;
        const p2 = txt(scene, cx, cy + 262 * k, perkLine, 30, { wrap: vp.width - 60, color: RARITY_CSS[pet.rarity] === '#7d8b99' ? '#ffffff' : '#ffffff' });
        p2.setTint(RARITY_COLOR[pet.rarity]);
        const btn = new CButton(scene, cx, cy + 370 * k, {
          w: 280,
          h: 100,
          label: t('hatch.yay'),
          fontSize: 44,
          color: COLORS.green,
          onClick: () => {
            scene.tweens.add({ targets: layer, alpha: 0, duration: 200, onComplete: () => layer.destroy() });
            resolve();
          },
        });
        layer.add([h, name, p2, btn]);
        for (const o of [h, name, p2, btn]) {
          o.setAlpha(0);
          scene.tweens.add({ targets: o, alpha: 1, duration: 300, delay: 300 });
        }
        h.setScale(0.5);
        scene.tweens.add({ targets: h, scale: 1, duration: 400, ease: 'Back.Out', delay: 200 });
      },
    });
  });
}

/** Short message in a rounded bubble, top of the water. */
export function say(scene: Phaser.Scene, x: number, y: number, message: string, color = '#ffffff', size = 40) {
  const t = txt(scene, x, y, message, size, { color }).setDepth(DEPTH - 10).setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 600, delay: 700, onComplete: () => t.destroy() });
  return t;
}

/** Bottom toast in the house style. */
export function note(scene: Phaser.Scene, message: string, ms = 2200) {
  const vp = app.viewport.info;
  const label = txt(scene, 0, -2, message, 30, { wrap: Math.min(600, vp.width - 80) });
  const g = scene.add.graphics();
  const w = label.width + 50;
  const h = label.height + 26;
  g.fillStyle(INK, 0.85).fillRoundedRect(-w / 2, -h / 2, w, h, 22);
  const c = scene.add.container(vp.width / 2, vp.height * 0.3, [g, label]).setDepth(DEPTH + 40).setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, y: c.y - 16, duration: 180 });
  scene.tweens.add({ targets: c, alpha: 0, delay: ms, duration: 300, onComplete: () => c.destroy() });
}
