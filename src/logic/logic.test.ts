// Rules and fishing machine tests. Run: bun test src/logic  (or node --experimental-strip-types --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rng } from '../../core/rng';
import { PONDS, RARITY_WEIGHTS } from '../content/data';
import { Fishing, FishingBot } from './fishing';
import { PondGame } from './game';
import { defaultSave } from './model';
import { addEgg, addPet, fishPrice, luckOf, questsForDay, rarityWeights, readyEggIndex, tickEggs, upgradeCost } from './rules';

test('price follows B x S x P x (1 + M)', () => {
  const pond = PONDS[1];
  const fish = pond.fish[3]; // uncommon, B = 12
  assert.equal(fishPrice(fish, 1.2, pond, 10), Math.round(12 * 1.2 * 3 * 1.1));
});

test('upgrade cost grows by 15% per level', () => {
  assert.equal(upgradeCost('rod', 0), 20);
  assert.equal(upgradeCost('rod', 10), Math.ceil(20 * 1.15 ** 10));
});

test('luck moves chance from Common to the rest, total stays 100, Common keeps 10%', () => {
  for (const luck of [0, 5, 20, 80, 500]) {
    const w = rarityWeights(luck);
    assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 100) < 1e-9);
    assert.ok(w[0] >= 10);
  }
  assert.deepEqual(rarityWeights(0), RARITY_WEIGHTS);
  assert.equal(luckOf({ bait: 0, petLuck: 0, zone: 2, golden: true, lucky: false }), 5 * 2.5 * 2);
});

test('eggs fill free slots, warm up and become ready', () => {
  const s = defaultSave();
  assert.equal(addEgg(s, 0, 'cozy'), true);
  assert.equal(addEgg(s, 0, 'cozy'), false, 'one slot at the start');
  tickEggs(s, 29, 0);
  assert.equal(readyEggIndex(s), -1);
  tickEggs(s, 1, 0);
  assert.equal(readyEggIndex(s), 0);
});

test('duplicate pets level up, max level pays coins', () => {
  const s = defaultSave();
  assert.equal(addPet(s, 'puddle_frog', false, 1).kind, 'new');
  assert.deepEqual(s.team, ['puddle_frog']);
  const r = addPet(s, 'puddle_frog', false, 1);
  assert.equal(r.kind, 'xp');
  assert.equal(s.pets.puddle_frog.level, 2);
  for (let i = 0; i < 20; i++) addPet(s, 'puddle_frog', false, 1);
  assert.equal(s.pets.puddle_frog.level, 5);
  assert.equal(addPet(s, 'puddle_frog', false, 3).kind, 'maxed');
});

test('daily quests: three, different kinds, same for the same day', () => {
  const a = questsForDay('2026-10-15');
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((q) => q.kind)).size, 3);
  assert.deepEqual(a, questsForDay('2026-10-15'));
});

test('scripted start: first cast is a fish, third catch an egg', () => {
  const g = new PondGame(defaultSave(), new Rng(1));
  const first = g.rollForCast(0, false);
  assert.equal(first.roll.kind, 'fish');
  g.applyCatch(first.roll, true);
  g.applyCatch(g.rollForCast(0, false).roll, false);
  assert.equal(g.rollForCast(0, false).roll.kind, 'egg');
});

test('fishing machine: a steady bot lands a common fish', () => {
  const rng = new Rng(3);
  const s = defaultSave();
  const g = new PondGame(s, rng);
  let outcome = '';
  const f = new Fishing(rng, () => g.stats(), { end: (o) => (outcome = o) }, () => ({ rarity: 0, fights: true }));
  const bot = new FishingBot(f, rng, 1);
  for (let i = 0; i < 30 * 30 && !outcome; i++) {
    bot.update(1 / 30);
    f.update(1 / 30);
  }
  assert.equal(outcome, 'caught');
});

test('fishing machine: holding forever snaps the line, striking on a nibble scares the fish', () => {
  const rng = new Rng(5);
  const g = new PondGame(defaultSave(), rng);
  let outcome = '';
  const f = new Fishing(rng, () => g.stats(), { end: (o) => (outcome = o) }, () => ({ rarity: 4, fights: true }));
  f.startBoss();
  f.press();
  for (let i = 0; i < 600 && !outcome; i++) f.update(1 / 30);
  assert.equal(outcome, 'snap');

  outcome = '';
  f.reset();
  f.press();
  f.update(0.5);
  f.release();
  for (let i = 0; i < 30 && f.phase !== 'waiting'; i++) f.update(1 / 30);
  for (let i = 0; i < 30; i++) f.update(1 / 30);
  f.press();
  assert.equal(outcome, 'early');
});

test("today's fish: one per pond per day, pays x5 and lays an overnight egg", () => {
  const s = defaultSave();
  s.tutorial = ['done'];
  s.stats.catches = 10;
  const now = new Date(2026, 9, 15, 12).getTime();
  const g = new PondGame(s, new Rng(3), () => now);
  const today = g.todayFish!;
  assert.ok(today && today.rarity >= 2, 'a Rare or better fish');
  const plain = g.applyCatch({ kind: 'fish', fish: PONDS[0].fish[0], size: 1 }, false);
  assert.equal(plain.today, false);
  const r = g.applyCatch({ kind: 'fish', fish: today, size: 1 }, false);
  assert.equal(r.today, true);
  assert.equal(r.nestEgg, true);
  assert.ok(s.eggs[4] && s.eggs[4].total === 6 * 3600 && s.eggs[4].shiny === 0.25);
  assert.equal(g.todayFish, null, 'caught for today');
  assert.equal(readyEggIndex(s), -1);
  tickEggs(s, 6 * 3600, 0);
  assert.equal(readyEggIndex(s), 4, 'the nest egg hatches like any other');
  // Next day: a fresh one.
  const g2 = new PondGame(s, new Rng(3), () => now + 24 * 3600 * 1000);
  assert.ok(g2.todayFish);
});

test('daily rewards scale with the best pond, the third quest gives an egg', () => {
  const s = defaultSave();
  s.unlocked = ['cozy', 'misty'];
  const g = new PondGame(s, new Rng(1));
  g.refreshDay();
  s.quests.list.forEach((q) => (q.progress = 9999));
  const r = g.claimQuest(2)!;
  assert.ok(r.coins >= 3 * 60, 'x3 for Misty');
  assert.equal(r.egg, 2);
  assert.equal(g.claimQuest(2), null, 'only once');
  const d = g.claimDailyGift()!;
  assert.equal(d.coins, 50 * 3);
  assert.equal(g.claimDailyGift(), null);
});

test('offline income is capped at 8 hours', () => {
  const s = defaultSave();
  s.pets.otter_pup = { level: 1, xp: 0 };
  s.team = ['otter_pup'];
  const g = new PondGame(s, new Rng(1));
  assert.ok(g.offline(8 * 3600) > 0);
  assert.equal(g.offline(24 * 3600), g.offline(8 * 3600));
});
