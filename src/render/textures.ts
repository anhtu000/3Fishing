// Turns every vector sprite into a texture during the loading screen.
// Art is drawn at `scale` times its design size, so it stays sharp on high-DPI phones and
// full-screen desktops; sprites are shown with setScale(1 / scale) (see `art()` in ui/art.ts).
import type Phaser from 'phaser';
import type { BossForm } from '../content/data';
import { ALL_PETS, COSMETICS, PONDS } from '../content/data';
import { FISH_ART, bossFormArt, fishSize, fishSvg } from './fish';
import { EGG_SIZE, ICON_KEYS, ITEM_KEYS, POND_MARK_SIZE, bobberSvg, eggSvg, itemSize, itemSvg, pondMarkSvg } from './items';
import { PET_H, PET_W, petSvg } from './pets';
import { commonPieces, hatPieces, sceneryPieces } from './scenery';

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

/** One texture to draw: key, art (built only when queued) and size. */
interface Job {
  key: string;
  svg: () => string;
  w: number;
  h: number;
  scale: number;
}

/** What the first screen needs, read from the save before the game starts. */
export interface FirstScreen {
  /** Ponds the player can fish in (their fish and pets can show up at once: today's fish, eggs). */
  unlocked: string[];
  /** The pond the game opens in (its scenery). */
  pond: string;
  team: string[];
  hat: string;
  bobber: string;
}

/** Every vector texture of the game, in loading order. */
function allJobs(): Job[] {
  const jobs: Job[] = [];
  for (const [id, a] of Object.entries(FISH_ART)) {
    const { w, h } = fishSize(a);
    jobs.push({ key: `fish:${id}`, svg: () => fishSvg(a), w, h, scale: 1.5 });
    // v1.16: a small copy drawn at icon size for the challenge tracker (shrinking the big one blurs).
    jobs.push({ key: `fishs:${id}`, svg: () => fishSvg(a), w, h, scale: 140 / Math.max(w, h) });
  }
  for (const p of ALL_PETS) jobs.push({ key: `pet:${p.id}`, svg: () => petSvg(p.id), w: PET_W, h: PET_H, scale: 1.4 });
  for (let t = 0; t < 5; t++) jobs.push({ key: `egg:${t}`, svg: () => eggSvg(t), w: EGG_SIZE.w, h: EGG_SIZE.h, scale: 1.5 });
  // v1.16: eggs with the mark of the pond whose pet is inside, and the marks alone (pond names).
  for (const p of PONDS) {
    for (let t = 0; t < 5; t++) jobs.push({ key: `egg:${t}:${p.id}`, svg: () => eggSvg(t, p.id), w: EGG_SIZE.w, h: EGG_SIZE.h, scale: 1.5 });
    jobs.push({ key: `icon:pond_${p.id}`, svg: () => pondMarkSvg(p.id), w: POND_MARK_SIZE.w, h: POND_MARK_SIZE.h, scale: 1.5 });
  }
  for (const k of ITEM_KEYS) {
    const { w, h } = itemSize(k);
    jobs.push({ key: `item:${k}`, svg: () => itemSvg(k), w, h, scale: 1.5 });
  }
  for (const k of ICON_KEYS) {
    const { w, h } = itemSize(k);
    jobs.push({ key: `icon:${k}`, svg: () => itemSvg(k), w, h, scale: 1.25 });
  }
  for (const pond of PONDS) {
    for (const [k, v] of Object.entries(sceneryPieces(pond.id))) {
      const big = v.w >= 1000;
      jobs.push({ key: `${pond.id}:${k}`, svg: () => v.svg, w: v.w, h: v.h, scale: big ? 1 : 1.4 });
    }
  }
  for (const [k, v] of Object.entries(commonPieces())) jobs.push({ key: `sc:${k}`, svg: () => v.svg, w: v.w, h: v.h, scale: k === 'cat' || k === 'catBlink' ? 1.6 : 1.3 });
  for (const [k, v] of Object.entries(hatPieces())) jobs.push({ key: `hat:${k}`, svg: () => v.svg, w: v.w, h: v.h, scale: 1.6 });
  // Bobber colours from the wardrobe.
  for (const c of COSMETICS) if (c.kind === 'bobber' && c.colors) {
    const [a, b] = c.colors;
    jobs.push({ key: `item:${c.id}`, svg: () => bobberSvg(a, b), w: 60, h: 90, scale: 1.5 });
  }
  return jobs;
}

/** True when a texture is needed on the first screen (the rest is drawn after the pond appears). */
function needsFirst(key: string, f: FirstScreen) {
  const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
  const unlocked = PONDS.filter((p) => f.unlocked.includes(p.id));
  if (kind === 'fishs') return false;
  if (kind === 'fish') return unlocked.some((p) => p.boss.id === id || p.fish.some((x) => x.id === id));
  if (kind === 'egg' && id.includes(':')) return f.unlocked.includes(id.slice(id.indexOf(':') + 1));
  if (kind === 'pet') return f.team.includes(id) || unlocked.some((p) => p.pets.some((x) => x.id === id));
  if (PONDS.some((p) => p.id === kind)) return kind === f.pond;
  if (kind === 'hat') return key === f.hat || key === 'hat:rain';
  if (key.startsWith('item:bobber:')) return key === `item:${f.bobber}`;
  return true;
}

let later: Job[] = [];
let ready = false;
let markReady: () => void = () => {};
/** Resolves when every texture is drawn (menus that show other ponds, pets or hats wait for it). */
export const artReady = new Promise<void>((resolve) => (markReady = resolve));
export const artIsReady = () => ready;

/**
 * Loading screen: only what the first screen shows (Poki: progressive loading). For a new player
 * that is Cozy Pond, its fish and pets, the cat and the HUD: about half of the art. The rest is
 * drawn by loadLaterTextures once the pond is on screen.
 */
export function queueTextures(scene: Phaser.Scene, first?: FirstScreen) {
  later = [];
  for (const j of allJobs()) {
    if (!first || needsFirst(j.key, first)) queue(scene, j.key, j.svg(), j.w, j.h, j.scale);
    else later.push(j);
  }
  if (__TARGET__ === 'web') (window as unknown as { __art: unknown }).__art = { later: later.length, at: performance.now() };
  if (later.length === 0) {
    ready = true;
    markReady();
  }
}

/** Draws the textures left out of the first load, in the background. Safe to call again (scene restart). */
export function loadLaterTextures(scene: Phaser.Scene) {
  if (ready) return;
  const missing = later.filter((j) => !scene.textures.exists(j.key));
  if (missing.length === 0) {
    ready = true;
    markReady();
    return;
  }
  const pending = new Set(missing.map((j) => j.key));
  const done = (key: string) => {
    if (!pending.delete(key) || pending.size > 0) return;
    scene.load.off('filecomplete', onFile);
    scene.load.off('loaderror', onError);
    ready = true;
    markReady();
    if (__TARGET__ === 'web') Object.assign((window as unknown as { __art: object }).__art, { readyAt: performance.now() });
  };
  const onFile = (key: string) => done(key);
  const onError = (file: { key: string }) => done(file.key);
  scene.load.on('filecomplete', onFile);
  scene.load.on('loaderror', onError);
  for (const j of missing) queue(scene, j.key, j.svg(), j.w, j.h, j.scale);
  scene.load.start();
}

/** Texture key of a boss in a rematch form (the classic form is the boss's own texture). */
export function bossKey(id: string, form: BossForm) {
  return form === 'classic' ? `fish:${id}` : `fish:${id}@${form}`;
}

/**
 * Draws a boss form on demand, the first time a rematch needs it (12 textures nobody needs before
 * the late game, kept out of the first load). Resolves with the key once the texture is ready; on
 * any problem it falls back to the boss's own texture.
 */
export function loadBossForm(scene: Phaser.Scene, id: string, form: BossForm): Promise<string> {
  const key = bossKey(id, form);
  const art = FISH_ART[id];
  if (scene.textures.exists(key) || !art) return Promise.resolve(scene.textures.exists(key) ? key : `fish:${id}`);
  return new Promise((resolve) => {
    const a = bossFormArt(art, form);
    const { w, h } = fishSize(a);
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      scene.load.off(`filecomplete-svg-${key}`);
      resolve(ok && scene.textures.exists(key) ? key : `fish:${id}`);
    };
    scene.load.once(`filecomplete-svg-${key}`, () => finish(true));
    scene.load.once('complete', () => finish(scene.textures.exists(key)));
    queue(scene, key, fishSvg(a), w, h, 1.5);
    scene.load.start();
  });
}
