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
  // Only the art the first screen shows; the rest of the art and the sounds follow in the background
  // (loadLaterTextures, src/sounds.ts).
  preload: (scene) => {
    const s = save.data;
    // Dev presets (web build only) jump to other ponds after loading: draw everything up front there.
    if (__TARGET__ === 'web' && location.hash.startsWith('#dev')) return queueTextures(scene);
    queueTextures(scene, { unlocked: s.unlocked, pond: s.pond, team: s.team, hat: s.style?.hat ?? 'hat:rain', bobber: s.style?.bobber ?? 'bobber:classic' });
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
