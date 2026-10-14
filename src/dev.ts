// Web build only (never in portal builds): #dev-<preset> in the URL jumps to a state for
// screenshots and testing. Called behind __TARGET__ === 'web', so the bundler drops this file.
import { dayKey } from '../core/time';
import { PONDS } from './content/data';
import type { SaveData } from './logic/model';

export function devPreset(s: SaveData, hash: string) {
  const m = /#dev-([a-z0-9]+)/.exec(hash);
  if (!m) return;
  const done = ['cast', 'bite', 'reel', 'egg', 'hatch', 'upgrade', 'done', 'boss'];
  s.tutorial = done;
  s.stats.catches = Math.max(s.stats.catches, 40);
  s.stats.eggs = Math.max(1, s.stats.eggs);
  s.stats.chests = Math.max(1, s.stats.chests);
  s.daily = { lastClaim: dayKey(), streak: 1 };
  const cozy = PONDS[0];
  const give = (n: number, pond = cozy) => pond.fish.slice(0, n).forEach((f) => (s.dex[f.id] ??= { n: 3, best: f.cm * 1.2 }));
  const pets = (ids: string[]) => ids.forEach((id) => (s.pets[id] ??= { level: 2, xp: 0 }));
  if (m[1] === 'rich' || m[1] === 'boss' || m[1] === 'misty') {
    s.coins = 4200;
    give(6);
    pets(['puddle_frog', 'reed_duckling', 'otter_pup']);
    s.team = ['puddle_frog', 'reed_duckling', 'otter_pup'];
    s.eggs[0] = { tier: 2, pond: 'cozy', left: 140, total: 300 };
    s.incubatorSlots = 2;
    s.eggs[1] = { tier: 1, pond: 'cozy', left: 0, total: 120 };
  }
  if (m[1] === 'misty') {
    s.bosses = ['old_whiskers'];
    s.unlocked = ['cozy', 'misty'];
    s.pond = 'misty';
    give(5, PONDS[1]);
    pets(['mossy_snail', 'firefly_fox']);
    s.team = ['firefly_fox', 'puddle_frog', 'otter_pup'];
  }
}

