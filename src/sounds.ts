import Phaser from 'phaser';
import { app } from '@core';

/** Sound effects and music (public/audio, made by tools/make_audio.py). */
export const SOUNDS = [
  'ui-tap', 'open', 'buy', 'nope', 'reward', 'coin', 'gem', 'catch', 'junk', 'new', 'rare', 'chest', 'wobble', 'hatch',
  'cast', 'plop', 'nibble', 'bite', 'hook', 'perfect', 'splash', 'snap', 'miss', 'boss', 'win', 'unlock', 'charge', 'pop',
];

/**
 * Loads the sounds in the background once the pond is on screen, so the first load is only the
 * code and the art (Poki: get players into the game fast; 636 KB less before the first cast).
 * Sounds the player triggers before they arrive simply stay silent. Effects first, music last.
 */
export function loadSounds(scene: Phaser.Scene, onMusic: () => void) {
  // A single-file build carries the sounds inline in window.__ASSETS.
  const inline = (window as unknown as { __ASSETS?: Record<string, string> }).__ASSETS;
  const keys = [...SOUNDS, 'music'].filter((k) => !scene.cache.audio.exists(k));
  if (keys.length === 0) return onMusic();
  app.audio.quietMissing = true;
  for (const key of keys) {
    const path = `audio/${key}.mp3`;
    scene.load.audio(key, inline?.[path] ?? path);
  }
  scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string) => {
    if (key === 'music') onMusic();
  });
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    app.audio.quietMissing = false;
    scene.load.off(Phaser.Loader.Events.FILE_COMPLETE);
  });
  scene.load.start();
}
