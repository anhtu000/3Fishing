import { startGame } from '@core';
import './fonts.css';
import game from './game.json';
import de from './i18n/de.json';
import en from './i18n/en.json';
import es from './i18n/es.json';
import fr from './i18n/fr.json';
import it from './i18n/it.json';
import tr from './i18n/tr.json';
import { queueTextures } from './render/textures';
import { save } from './save';
import { PlayScene } from './scenes/PlayScene';

/** Sound effects and music (public/audio, made by tools/make_audio.py). */
export const SOUNDS = [
  'ui-tap', 'open', 'buy', 'nope', 'reward', 'coin', 'gem', 'catch', 'junk', 'new', 'rare', 'chest', 'wobble', 'hatch',
  'cast', 'plop', 'nibble', 'bite', 'hook', 'perfect', 'splash', 'snap', 'miss', 'boss', 'win', 'unlock', 'charge', 'pop',
];

startGame({
  id: game.id,
  title: game.title,
  // Poki's first localization batch: English, French, Italian, German, Spanish and Turkish.
  languages: { en, fr, it, de, es, tr },
  scenes: [PlayScene],
  playScene: 'Play',
  // Straight into the pond: the first fish comes within seconds (quality bar, design doc).
  menu: false,
  save,
  // Poki decides when a midgame ad really plays; the game sends every chance and keeps no timer of its own.
  ads: { midgameGapSec: __TARGET__ === 'poki' ? 0 : 180 },
  // Vector sprites are separate textures; see GameConfig.maxTextures.
  maxTextures: 1,
  preload: (scene) => {
    queueTextures(scene);
    // A single-file build carries the sounds inline in window.__ASSETS.
    const inline = (window as unknown as { __ASSETS?: Record<string, string> }).__ASSETS;
    for (const key of SOUNDS) {
      const path = `audio/${key}.mp3`;
      scene.load.audio(key, inline?.[path] ?? path);
    }
    scene.load.audio('music', inline?.['audio/music.mp3'] ?? 'audio/music.mp3');
  },
  theme: {
    font: 'Fredoka, system-ui, sans-serif',
    background: game.background,
    text: '#ffffff',
    textDim: '#e6f6ff',
    primary: 0xffa53d,
    primaryText: '#3b2a4d',
    surface: 0xfff6e6,
    surfaceText: '#3b2a4d',
    reward: 0x7c6cff,
    rewardText: '#ffffff',
  },
});
