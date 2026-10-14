// Turns every vector sprite into a texture during the loading screen.
// Art is drawn at `scale` times its design size, so it stays sharp on high-DPI phones and
// full-screen desktops; sprites are shown with setScale(1 / scale) (see `art()` in ui/art.ts).
import type Phaser from 'phaser';
import { ALL_PETS, PONDS } from '../content/data';
import { FISH_ART, fishSize, fishSvg } from './fish';
import { EGG_SIZE, ICON_KEYS, ITEM_KEYS, eggSvg, itemSize, itemSvg } from './items';
import { PET_H, PET_W, petSvg } from './pets';
import { commonPieces, sceneryPieces } from './scenery';

export interface TexInfo {
  /** Design size (units). */
  w: number;
  h: number;
  /** Texture pixels per design unit. */
  scale: number;
}

/** Design size and resolution of every texture, by key. */
export const TEX = new Map<string, TexInfo>();

function toUrl(svg: string) {
  // base64 keeps Phaser's loader on its data-URI path (no network request).
  const bytes = new TextEncoder().encode(svg);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:image/svg+xml;base64,${btoa(bin)}`;
}

function queue(scene: Phaser.Scene, key: string, svg: string, w: number, h: number, scale: number) {
  TEX.set(key, { w, h, scale });
  scene.load.svg(key, toUrl(svg), { scale });
}

export function queueTextures(scene: Phaser.Scene) {
  for (const [id, a] of Object.entries(FISH_ART)) {
    const { w, h } = fishSize(a);
    queue(scene, `fish:${id}`, fishSvg(a), w, h, 1.5);
  }
  for (const p of ALL_PETS) queue(scene, `pet:${p.id}`, petSvg(p.id), PET_W, PET_H, 1.4);
  for (let t = 0; t < 5; t++) queue(scene, `egg:${t}`, eggSvg(t), EGG_SIZE.w, EGG_SIZE.h, 1.5);
  for (const k of ITEM_KEYS) {
    const { w, h } = itemSize(k);
    queue(scene, `item:${k}`, itemSvg(k), w, h, 1.5);
  }
  for (const k of ICON_KEYS) {
    const { w, h } = itemSize(k);
    queue(scene, `icon:${k}`, itemSvg(k), w, h, 1.25);
  }
  for (const pond of PONDS) {
    for (const [k, v] of Object.entries(sceneryPieces(pond.id))) {
      const big = v.w >= 1000;
      queue(scene, `${pond.id}:${k}`, v.svg, v.w, v.h, big ? 1 : 1.4);
    }
  }
  for (const [k, v] of Object.entries(commonPieces())) queue(scene, `sc:${k}`, v.svg, v.w, v.h, k === 'cat' || k === 'catBlink' ? 1.6 : 1.3);
}
