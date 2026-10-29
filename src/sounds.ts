import Phaser from 'phaser';
import { app } from '@core';

/** Sound effects and music (public/audio, made by tools/make_audio.py). */
export const SOUNDS = [
  'ui-tap', 'open', 'buy', 'nope', 'reward', 'coin', 'gem', 'catch', 'junk', 'new', 'rare', 'chest', 'wobble', 'crack', 'hatch',
  'cast', 'plop', 'nibble', 'bite', 'hook', 'perfect', 'splash', 'snap', 'miss', 'boss', 'win', 'unlock', 'charge', 'pop',
];

/**
 * Loads the sounds in the background once the pond is on screen, so the first load is only the
 * code and the art (Poki: get players into the game fast; 636 KB less before the first cast).
 * Sounds the player triggers before they arrive simply stay silent. Effects first, then the music of the pond the game opens in.
 */
/** Music of a pond (one piece per pond, 2-2.5 minutes, made by tools/make_audio.py). */
export const musicKey = (pond: string) => `music_${pond}`;

export function loadSounds(scene: Phaser.Scene, pond: string, onMusic: () => void) {
  // A single-file build carries the sounds inline in window.__ASSETS.
  const inline = (window as unknown as { __ASSETS?: Record<string, string> }).__ASSETS;
  const music = musicKey(pond);
  const keys = [...SOUNDS, music].filter((k) => !scene.cache.audio.exists(k));
  if (keys.length === 0) return onMusic();
  app.audio.quietMissing = true;
  for (const key of keys) {
    const path = `audio/${key}.mp3`;
    scene.load.audio(key, inline?.[path] ?? path);
  }
  scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string) => {
    if (key === music) onMusic();
  });
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    app.audio.quietMissing = false;
    scene.load.off(Phaser.Loader.Events.FILE_COMPLETE);
  });
  scene.load.start();
}

/** Loads one pond's music (when travelling to a pond whose music is not there yet). */
export function loadMusic(scene: Phaser.Scene, pond: string): Promise<boolean> {
  const key = musicKey(pond);
  if (scene.cache.audio.exists(key)) return Promise.resolve(true);
  const inline = (window as unknown as { __ASSETS?: Record<string, string> }).__ASSETS;
  return new Promise((resolve) => {
    const path = `audio/${key}.mp3`;
    scene.load.once(`filecomplete-audio-${key}`, () => resolve(true));
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve(scene.cache.audio.exists(key)));
    scene.load.audio(key, inline?.[path] ?? path);
    scene.load.start();
  });
}
