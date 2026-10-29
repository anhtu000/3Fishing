// Rules and fishing machine tests. Run: bun test src/logic  (or node --experimental-strip-types --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rng } from '../../core/rng';
import { BOSS_FORMS, BOSS_STARS, CHALLENGES, COSMETICS, HABITAT_MULT, LEGEND, PERKS, PONDS, RARITY_WEIGHTS, WANTED, bossForm, type PerkKind } from '../content/data';
import { BOSS, Fishing, FishingBot } from './fishing';
import { PondGame } from './game';
import { defaultSave } from './model';
import { addEgg, addPet, catchWeights, eggPond, firmHookPrice, fishWeights, gearPerk, fishingStats, fishPrice, hatchSecLeft, hatchSpeed, luckOf, perkValue, questsForDay, rarityWeights, readyEggIndex, tickEggs, upgradeCost } from './rules';

test('price follows B x S x P x (1 + M)', () => {
  const pond = PONDS[1];
  const fish = pond.fish.find((f) => f.rarity === 1)!; // uncommon, B = 12
  assert.equal(fishPrice(fish, 1.2, pond, 10), Math.round(12 * 1.2 * 2 * 1.1));
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
  for (let i = 0; i < 300; i++) addPet(s, 'puddle_frog', false, 1);
  assert.equal(s.pets.puddle_frog.level, 20);
  assert.equal(addPet(s, 'puddle_frog', false, 3).kind, 'maxed');
});

test('pet perks (v1.16): early pets stay useful, a maxed Legendary is still the best', () => {
  for (const perk of Object.keys(PERKS) as PerkKind[]) {
    const v = (r: number, l: number) => perkValue(perk, r, l);
    for (let r = 0; r <= 4; r++) {
      for (let l = 2; l <= 20; l++) assert.ok(v(r, l) > v(r, l - 1), `${perk} r${r} l${l}`);
      if (r > 0) assert.ok(v(r, 1) > v(r - 1, 1) && v(r, 20) > v(r - 1, 20), `${perk} r${r} above r${r - 1}`);
    }
    // Legendary at level 1 is 3-3.4x Common (v1.15: 5-8x).
    assert.ok(v(4, 1) / v(0, 1) >= 3 && v(4, 1) / v(0, 1) <= 3.4, `${perk} spread ${v(4, 1) / v(0, 1)}`);
    // A Common at level 6 matches a fresh Rare (5% slack for rounded values), at level 13 a fresh Epic.
    assert.ok(v(0, 6) >= v(2, 1) * 0.95, `${perk} common 6 vs rare 1`);
    assert.ok(v(0, 13) >= v(3, 1) * 0.95, `${perk} common 13 vs epic 1`);
    // A fresh Legendary still beats a maxed Common.
    assert.ok(v(4, 1) > v(0, 20), `${perk} legendary 1 vs common 20`);
  }
});

test('pet perks (v1.16): the 5 pets of a pond all differ, no perk on more than 2 pond pets', () => {
  const uses = new Map<string, number>();
  for (const pond of PONDS) {
    assert.equal(new Set(pond.pets.map((p) => p.perk)).size, pond.pets.length, pond.id);
    for (const p of pond.pets) uses.set(p.perk, (uses.get(p.perk) ?? 0) + 1);
  }
  for (const [perk, n] of uses) assert.ok(n <= 2, `${perk} x${n}`);
  for (const perk of Object.keys(PERKS)) assert.ok(uses.has(perk), `${perk} unused`);
});

test('hook perks: Egg finder and Treasure nose raise their weights, Big catch grows fish', () => {
  const base = catchWeights(0);
  const w = catchWeights(0, { finder: 20, treasure: 50, big: 0 });
  assert.ok(Math.abs(w.egg - base.egg * 1.2) < 1e-9 && Math.abs(w.chest - base.chest * 1.5) < 1e-9);
  assert.equal(w.fish, base.fish);
  assert.equal(w.junk, base.junk);
  // Same rng seed with and without a Big catch pet: the fish is the same, only bigger.
  const run = (team: string[]) => {
    const s = defaultSave();
    s.stats.catches = 5;
    s.stats.eggs = 1;
    s.stats.chests = 1;
    for (const id of team) s.pets[id] = { level: 1, xp: 0 };
    s.team = team;
    const g = new PondGame(s, new Rng(7));
    const sizes: number[] = [];
    for (let i = 0; i < 200; i++) {
      const r = g.rollForCast(0, false).roll;
      if (r.kind === 'fish') sizes.push(r.size);
    }
    return sizes;
  };
  const plain = run([]);
  const big = run(['heron_chick']);
  const k = 1 + perkValue('big', 3, 1) / 100;
  assert.equal(plain.length, big.length);
  for (let i = 0; i < plain.length; i++) assert.ok(Math.abs(big[i] - plain[i] * k) < 0.011, `${big[i]} vs ${plain[i]}`);
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
  for (let i = 0; i < 60 && f.phase !== 'waiting'; i++) f.update(1 / 30);
  for (let i = 0; i < 120 && f.approach <= 0.5; i++) f.update(1 / 30);
  f.press();
  assert.equal(outcome, 'early');
});

test("today's fish: one a day for the whole game, fixed for the day, pays x5 and lays an overnight egg", () => {
  const s = defaultSave();
  s.tutorial = ['done'];
  s.stats.catches = 10;
  s.unlocked = ['cozy', 'misty', 'frozen'];
  const now = new Date(2026, 9, 15, 12).getTime();
  const g = new PondGame(s, new Rng(3), () => now);
  const today = g.today!;
  assert.ok(today && today.fish.rarity >= 2, 'a Rare or better fish');
  // Travelling does not change it; it only bites in its own pond.
  for (const p of PONDS) {
    s.pond = p.id;
    assert.equal(g.today!.fish.id, today.fish.id);
    assert.equal(g.todayFish?.id ?? null, p.id === today.pond.id ? today.fish.id : null);
  }
  s.pond = today.pond.id;
  const r = g.applyCatch({ kind: 'fish', fish: today.fish, size: 1 }, false);
  assert.equal(r.today, true);
  assert.equal(r.nestEgg, true);
  assert.ok(s.eggs[4] && s.eggs[4].total === 6 * 3600 && s.eggs[4].shiny === 0.25);
  assert.equal(g.today, null, 'caught for today, in every pond');
  for (const p of PONDS) {
    s.pond = p.id;
    assert.equal(g.todayFish, null);
  }
  assert.equal(readyEggIndex(s), -1);
  tickEggs(s, 6 * 3600, 0);
  assert.equal(readyEggIndex(s), 4, 'the nest egg hatches like any other');
  // Next day: a fresh one.
  const g2 = new PondGame(s, new Rng(3), () => now + 24 * 3600 * 1000);
  assert.ok(g2.today);
});

test('daily rewards scale with the best pond, the third quest gives an egg', () => {
  const s = defaultSave();
  s.unlocked = ['cozy', 'misty'];
  const g = new PondGame(s, new Rng(1));
  g.refreshDay();
  s.quests.list.forEach((q) => (q.progress = 9999));
  const r = g.claimQuest(2)!;
  assert.ok(r.coins >= 2 * 60, "x2 for Misty");
  assert.equal(r.egg, 2);
  assert.equal(g.claimQuest(2), null, 'only once');
  const d = g.claimDailyGift()!;
  assert.equal(d.coins, 50 * 2);
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

test('eggs wait in the basket when the incubator is full, the player picks which to incubate', () => {
  const s = defaultSave();
  const g = new PondGame(s, new Rng(1));
  assert.equal(g.applyCatch({ kind: 'egg', tier: 0 }, false).eggWhere, 'incubator');
  const r = g.applyCatch({ kind: 'egg', tier: 2 }, false);
  assert.equal(r.eggWhere, 'basket');
  assert.equal(r.coins, 0, 'kept, not sold');
  g.applyCatch({ kind: 'egg', tier: 1 }, false);
  assert.equal(s.basket.length, 2);
  assert.equal(g.incubate(0), false, 'no free slot yet');
  s.eggs[0] = null;
  assert.equal(g.incubate(1), true, 'pick the second one');
  assert.equal(s.eggs[0]!.tier, 1);
  assert.deepEqual(s.basket.map((b) => b.tier), [2]);
  // Full basket: sold for coins.
  s.basket = Array.from({ length: 12 }, () => ({ tier: 0, pond: 'cozy' }));
  const sold = g.applyCatch({ kind: 'egg', tier: 0 }, false);
  assert.equal(sold.eggStored, false);
  assert.ok(sold.coins > 0);
});

test('auto-fish rests between casts and misses about 30% of bites', () => {
  const s = defaultSave();
  s.upgrades.rod = 5;
  const rng = new Rng(11);
  const out: Record<string, number> = {};
  const f: Fishing = new Fishing(rng, () => g.stats(), { end: (o) => ((out[o] = (out[o] ?? 0) + 1), f.reset()) });
  const g = new PondGame(s, new Rng(2));
  f.auto = true;
  const bot = new FishingBot(f, rng, 1);
  for (let t = 0; t < 1200; t += 1 / 30) {
    bot.update(1 / 30);
    f.update(1 / 30);
  }
  const total = (out.caught ?? 0) + (out.missed ?? 0);
  const missRate = (out.missed ?? 0) / total;
  assert.ok(missRate > 0.2 && missRate < 0.4, `miss ${missRate}`);
  assert.ok((out.caught ?? 0) / 20 < 7, 'well under a manual player');
});

test('late game: medals, pond gold bonus, rematch tickets and stars, wardrobe, streak gifts', () => {
  const s = defaultSave();
  s.tutorial = ['done'];
  s.unlocked = ['cozy', 'misty'];
  s.bosses = ['old_whiskers'];
  const now = new Date(2026, 9, 15, 12).getTime();
  const g = new PondGame(s, new Rng(5), () => now);
  assert.equal(g.lateGame, true);
  // Medals: bronze at 10 commons, silver at 40, gold needs a giant.
  const minnow = PONDS[0].fish[0];
  let last = 0;
  for (let i = 0; i < 40; i++) last = Math.max(last, g.applyCatch({ kind: 'fish', fish: minnow, size: 1 }, false).medal);
  assert.equal(last, 2, 'silver');
  const giant = g.applyCatch({ kind: 'fish', fish: minnow, size: 1.45 }, false);
  assert.equal(giant.medal, 3);
  assert.equal(giant.giant, true);
  // Pond gold: every species gold, then +10% on fish there.
  for (const f of PONDS[0].fish) s.dex[f.id] = { n: 99, best: f.cm * 1.5 };
  const a = g.applyCatch({ kind: 'fish', fish: minnow, size: 1 }, false).coins;
  delete s.dex[PONDS[0].fish[7].id];
  const b = g.applyCatch({ kind: 'fish', fish: minnow, size: 1 }, false).coins;
  assert.ok(a > b, 'gold pond pays more');
  // Rematch: star 1, three wins a day.
  assert.equal(g.rematchStar(), 1);
  assert.equal(g.ticketsLeft, 3);
  const w = g.winRematch(1)!;
  assert.ok(w.coins > 0 && w.tier === 3);
  assert.equal(g.rematchStar(), 2);
  g.winRematch(2);
  g.winRematch(3);
  assert.equal(g.ticketsLeft, 0);
  assert.equal(g.winRematch(4), null, 'no tickets left');
  const g2 = new PondGame(s, new Rng(5), () => now + 864e5);
  assert.equal(g2.ticketsLeft, 3, 'new day, new tickets');
  // Wardrobe.
  s.coins = 6000;
  assert.equal(g.wear('hat:straw'), 'bought');
  assert.equal(s.style.hat, 'hat:straw');
  assert.equal(g.wear('hat:crown'), 'noCoins');
  assert.equal(g.wear('hat:clover'), 'locked');
  assert.equal(g.wear('hat:rain'), 'worn');
  // Streak: day 3 hat, day 7 pet.
  const day = (d: number) => new Date(2026, 9, 15 + d, 12).getTime();
  for (let d = 0; d < 7; d++) {
    const gd = new PondGame(s, new Rng(1), () => day(d));
    const r = gd.claimDailyGift()!;
    if (d === 2) assert.equal(r.hat, 'hat:clover');
    if (d === 6) assert.equal(r.pet?.id, 'rainbow_turtle');
  }
  assert.ok(s.pets.rainbow_turtle);
  assert.equal(s.style.hat, 'hat:clover', 'gift hat is worn right away');
});

test('challenges: 24, open with the second pond in order, first clear pays, replays pay little and are capped', () => {
  const s = defaultSave();
  const now = new Date(2026, 9, 15, 12).getTime();
  const g = new PondGame(s, new Rng(1), () => now);
  assert.equal(CHALLENGES.length, 24);
  const c1 = CHALLENGES[0];
  assert.equal(g.challengeUnlocked(c1), false, 'closed before Misty Creek');
  s.unlocked = ['cozy', 'misty'];
  s.bosses = [];
  assert.equal(g.challengeUnlocked(c1), false, 'v1.16: the pond boss first');
  s.bosses = ['old_whiskers'];
  assert.equal(g.challengeUnlocked(c1), true);
  assert.equal(g.challengeUnlocked(CHALLENGES[8]), false, 'Misty challenges wait for its boss');
  assert.equal(g.challengeUnlocked(CHALLENGES[1]), false, 'in order');
  const a = g.finishChallenge(c1, 50000);
  assert.equal(a.coins, c1.reward);
  assert.equal(a.first, true);
  assert.equal(g.challengeUnlocked(CHALLENGES[1]), true);
  const b = g.finishChallenge(c1, 60000);
  assert.equal(b.kind, 'replay');
  assert.equal(b.coins, Math.round(c1.reward * 0.1));
  const r = g.finishChallenge(c1, 40000);
  assert.equal(r.record, true);
  assert.equal(r.coins, Math.round(c1.reward * 0.1) + Math.round(c1.reward * 0.2));
  for (let i = 0; i < 5; i++) g.finishChallenge(c1, 70000);
  const capped = g.finishChallenge(c1, 70000);
  assert.equal(capped.kind, 'capped');
  assert.equal(capped.coins, 0);
  assert.equal(s.challenge.best[c1.id], 40000);
  // Frozen challenges need Frozen Lake.
  assert.equal(g.challengeUnlocked(CHALLENGES[16]), false);
  // A challenge catch: Fishdex counts, no coins.
  const before = s.coins;
  g.applyChallengeCatch(PONDS[1].fish[0], 1.1, true);
  assert.equal(s.coins, before);
  assert.ok(s.dex[PONDS[1].fish[0].id]);
});

test('reeling: about 20% of fish shake free (not during onboarding), a lost boss needs luring', () => {
  const s = defaultSave();
  const g = new PondGame(s, new Rng(9));
  const rng = new Rng(4);
  const out: Record<string, number> = {};
  const f: Fishing = new Fishing(rng, () => g.stats(), { end: (o) => ((out[o] = (out[o] ?? 0) + 1), f.reset()) });
  const bot = new FishingBot(f, rng, 1);
  for (let t = 0; t < 1200; t += 1 / 30) {
    bot.update(1 / 30);
    f.update(1 / 30);
  }
  const fights = (out.caught ?? 0) + (out.escape ?? 0);
  const rate = (out.escape ?? 0) / fights;
  assert.ok(rate > 0.1 && rate < 0.3, `escape ${rate}`);
  s.tutorial = ['done'];
  for (const fi of PONDS[0].fish.slice(0, 6)) s.dex[fi.id] = { n: 1, best: fi.cm };
  assert.equal(g.bossReady, true);
  g.loseBoss();
  assert.equal(g.bossReady, false, 'lure first');
  for (let i = 0; i < 5; i++) g.applyCatch({ kind: 'fish', fish: PONDS[0].fish[0], size: 1 }, false);
  assert.equal(g.bossReady, true, 'lured back after 5 catches');
});

test('rematch forms: ★1 classic, ★10 golden, the three bosses differ at the same star', () => {
  for (let p = 0; p < 3; p++) {
    assert.equal(bossForm(p, 0), 'classic');
    assert.equal(bossForm(p, 1), 'classic');
    assert.equal(bossForm(p, 10), 'golden');
  }
  for (let star = 2; star <= 9; star++) {
    const forms = [0, 1, 2].map((p) => bossForm(p, star));
    assert.equal(new Set(forms).size, 3, `star ${star}: ${forms}`);
  }
  // Every form shows up while climbing one boss's stars.
  assert.deepEqual(new Set(Array.from({ length: 10 }, (_, i) => bossForm(0, i + 1))), new Set(BOSS_FORMS));
});

test('boss mis-press: the first boss heals 10%, later bosses and rematches 25%', () => {
  const heal = (level: number, star: number) => {
    let healed = 0;
    const f = new Fishing(new Rng(3), () => fishingStats(defaultSave(), 0, 0), { bossHeal: (h) => (healed = h) });
    f.startBoss(level, star);
    f.progress = 0.6;
    // The fight starts with the first touch (calm start, see bossCalm).
    f.press();
    f.release();
    // Run until the first warning, past the reaction grace, then press.
    for (let i = 0; i < 400 && !(f.warning); i++) f.update(1 / 60);
    for (let i = 0; i < 20; i++) f.update(1 / 60);
    f.press();
    return healed;
  };
  assert.equal(heal(0, 0), BOSS.misHealFirst);
  assert.equal(heal(1, 0), BOSS.misHeal);
  assert.equal(heal(0, 1), BOSS.misHeal);
});

test('golden form pays 50% more coins than the classic rematch at the same star', () => {
  const coins = (star: number) => {
    const s = defaultSave();
    s.unlocked = ['cozy', 'misty'];
    s.bosses = ['old_whiskers'];
    s.pond = 'cozy';
    const g = new PondGame(s, new Rng(1));
    return g.winRematch(star)!.coins;
  };
  // Cozy: ★5 is golden, ★4 is giant (see bossForm).
  assert.equal(bossForm(0, 5), 'golden');
  const base = (star: number) => Math.round(BOSS_STARS.coins * (1 + BOSS_STARS.coinsPerStar * star));
  assert.equal(coins(5), Math.round(base(5) * 1.5));
  assert.equal(coins(4), base(4));
});

test('pause while charging drops the cast instead of throwing the line', () => {
  const f = new Fishing(new Rng(5), () => fishingStats(defaultSave(), 0, 0));
  f.press();
  f.update(0.3);
  assert.equal(f.phase, 'charging');
  f.cancelCharge();
  assert.equal(f.phase, 'ready');
  f.release();
  assert.equal(f.phase, 'ready');
});

test('WANTED fish: swims in after minutes of play, leaves if not caught, pays x4 when hooked', () => {
  const s = defaultSave();
  s.tutorial.push('cast', 'bite', 'reel', 'egg', 'hatch', 'upgrade', 'done');
  const g = new PondGame(s, new Rng(9));
  assert.equal(g.tickWanted(WANTED.firstSec - 1), null);
  assert.equal(g.wanted, null);
  assert.equal(g.tickWanted(2), 'spawn');
  const w = g.wanted!;
  assert.ok(w && w.size >= WANTED.sizeMin && w.size <= WANTED.sizeMax);
  assert.ok(g.pond.fish.some((f) => f.id === w.fish.id));
  // Not hooked in time: it swims off, the next one comes 3-5 minutes later.
  assert.equal(g.tickWanted(WANTED.staySec + 1), 'gone');
  assert.equal(g.wanted, null);
  assert.ok(s.bountyIn >= WANTED.gapMin && s.bountyIn <= WANTED.gapMax);
  // Next one, hooked: x4 its price plus the bonus.
  g.tickWanted(s.bountyIn + 1);
  const w2 = g.wanted!;
  const plain = g.applyCatch({ kind: 'fish', fish: w2.fish, size: w2.size }, false, false);
  assert.equal(plain.bounty, false);
  const res = g.applyCatch({ kind: 'fish', fish: w2.fish, size: w2.size }, false, true);
  assert.equal(res.bounty, true);
  assert.equal(res.coins, plain.coins * WANTED.priceMult + WANTED.bonus * g.pond.priceMult);
  assert.equal(g.wanted, null);
});

test('rematches have more health: the same reeling moves the bar less than in the first fight', () => {
  const run = (star: number) => {
    const f = new Fishing(new Rng(4), () => fishingStats(defaultSave(), 0, 0));
    f.startBoss(0, star);
    f.progress = 0.5;
    f.tension = 0.5;
    f.holding = true;
    f.update(0.2);
    return f.progress - 0.5;
  };
  const first = run(0);
  const rematch = run(1);
  assert.ok(rematch > 0 && first > rematch * 1.2, `${first} vs ${rematch}`);
});

test('nurture: a turtle in the team shortens the hatch time the player sees', () => {
  const s = defaultSave();
  s.pets.lily_turtle = { level: 1, xp: 0 };
  s.team = ['lily_turtle'];
  const k = hatchSpeed(s);
  assert.ok(Math.abs(k - (1 + perkValue('nurture', 3, 1) / 100)) < 1e-9 && k > 1.2);
  // A 10 min Epic egg reads about 7:49 with an Epic turtle at level 1, and hatches in that real time.
  assert.ok(Math.abs(hatchSecLeft(s, { left: 600 }) - 600 / k) < 1e-9);
  addEgg(s, 3, 'cozy');
  let t = 0;
  while (s.eggs[0]!.left > 0) {
    tickEggs(s, 1, perkValue('nurture', 3, 1));
    t++;
  }
  assert.equal(t, Math.ceil(600 / k));
});

test('boss fight: a calm start, so a player who has not started reeling cannot lose at once', () => {
  for (const level of [0, 1, 2]) {
    const rng = new Rng(11 + level);
    const g = new PondGame(defaultSave(), rng);
    let outcome = '';
    const f = new Fishing(rng, () => g.stats(), { end: (o) => (outcome = o) });
    f.startBoss(level);
    // Ten seconds without touching: the fight has not started, nothing is lost.
    for (let i = 0; i < 300; i++) f.update(1 / 30);
    assert.equal(outcome, '', 'still fighting after 10 s idle');
    assert.ok(Math.abs(f.progress - 0.12) < 1e-9, 'no drift back before the first touch');
    // The first touch starts the fight: no pull and no health back for a tap in the next second.
    f.press();
    for (let i = 0; i < 10; i++) f.update(1 / 30);
    f.release();
    f.press();
    assert.ok(f.progress > 0.12, 'reeling moved the bar');
    assert.equal(outcome, '');
  }
});

test('eggs (v1.16): later ponds sometimes hold earlier pets, a maxed pet is skipped', () => {
  const count = (pond: string, s = defaultSave()) => {
    const rng = new Rng(11);
    const n: Record<string, number> = {};
    for (let i = 0; i < 20000; i++) {
      const p = eggPond(rng, s, pond, 0);
      n[p] = (n[p] ?? 0) + 1;
    }
    return n;
  };
  assert.deepEqual(Object.keys(count('cozy')), ['cozy']);
  const m = count('misty');
  assert.ok(Math.abs(m.cozy / 20000 - 0.3) < 0.015 && Math.abs(m.misty / 20000 - 0.7) < 0.015, JSON.stringify(m));
  const f = count('frozen');
  assert.ok(Math.abs(f.cozy / 20000 - 0.1) < 0.01 && Math.abs(f.misty / 20000 - 0.2) < 0.012, JSON.stringify(f));
  // Puddle Frog (Cozy, Common) at the top level: Common eggs of Frozen never hold it.
  const s = defaultSave();
  s.pets.puddle_frog = { level: 20, xp: 0 };
  const g = count('frozen', s);
  assert.ok(!g.cozy && Math.abs(g.frozen / 20000 - 0.8) < 0.012, JSON.stringify(g));
});

test('eggs (v1.16): the caught egg goes to the incubator with the pond picked at the cast', () => {
  const s = defaultSave();
  s.stats.catches = 5;
  s.stats.eggs = 1;
  s.stats.chests = 1;
  s.unlocked = ['cozy', 'misty', 'frozen'];
  s.pond = 'frozen';
  const g = new PondGame(s, new Rng(3));
  const ponds = new Set<string>();
  for (let i = 0; i < 400 && ponds.size < 3; i++) {
    const r = g.rollForCast(0, false).roll;
    if (r.kind !== 'egg') continue;
    assert.ok(r.pond);
    s.eggs = [null, null, null, null];
    g.applyCatch(r, false);
    assert.equal(s.eggs[0]?.pond, r.pond);
    ponds.add(r.pond!);
  }
  assert.equal(ponds.size, 3);
});

test('habitat (v1.16): a fish bites more in its zone, rarity shares stay as before', () => {
  for (const pond of PONDS) {
    for (const z of [0, 1, 2] as const) assert.ok(pond.fish.some((f) => f.zone === z), `${pond.id} zone ${z}`);
    for (let t = 0; t <= 4; t++) {
      const tier = pond.fish.filter((f) => f.rarity === t);
      if (tier.length > 1) assert.ok(new Set(tier.map((f) => f.zone)).size > 1, `${pond.id} rarity ${t} in one zone`);
    }
    const rw = rarityWeights(20);
    const rt = rw.reduce((a, b) => a + b, 0);
    for (const z of [0, 1, 2] as const) {
      const w = fishWeights(pond, 20, z);
      const tot = w.reduce((a, b) => a + b, 0);
      for (let t = 0; t <= 3; t++) {
        const share = pond.fish.reduce((a, f, i) => a + (f.rarity === t ? w[i] : 0), 0) / tot;
        if (pond.fish.filter((f) => f.rarity === t).length > 1) assert.ok(Math.abs(share - rw[t] / rt) < 0.004, `${pond.id} z${z} r${t} ${share}`);
      }
      // In its zone a fish beats a same-rarity fish of another zone by HABITAT_MULT.
      const a = pond.fish.findIndex((f) => f.rarity === 0 && f.zone === z);
      const b = pond.fish.findIndex((f) => f.rarity === 0 && f.zone !== z);
      if (a >= 0 && b >= 0) assert.ok(Math.abs(w[a] / w[b] - HABITAT_MULT) < 1e-9);
    }
  }
});

test('legendary (v1.16): never bites at random, shows itself for 15 s, hooked only by casting at it', () => {
  const s = defaultSave();
  s.stats.catches = 5;
  s.stats.eggs = 1;
  s.stats.chests = 1;
  const g = new PondGame(s, new Rng(5));
  let shown = 0;
  for (let i = 0; i < 3000; i++) {
    const r = g.rollForCast(2, true).roll;
    assert.ok(r.kind !== 'fish' || r.fish.rarity < 4, 'a Legendary bit at random');
    if (g.legendHere) {
      shown++;
      assert.equal(g.legendHere.fish.rarity, 4);
      const hooked = g.hookLegend();
      assert.ok(hooked && hooked.kind === 'fish' && hooked.fish.id === g.legendHere.fish.id);
      assert.equal(g.tickLegend(LEGEND.staySec - 0.5), null);
      assert.equal(g.tickLegend(1), 'gone');
      assert.equal(g.legendHere, null);
    }
  }
  assert.ok(shown > 5, `shown ${shown}`);
});

test('challenges (v1.16): levels 1-2 as before, from level 3 one more species and a school of one Common', () => {
  for (const c of CHALLENGES) {
    const pi = PONDS.findIndex((p) => p.id === c.pond);
    const k = c.n - 1;
    const old = Math.min(6, 2 + Math.floor(k / 2) + (pi > 0 && k >= 6 ? 1 : 0));
    assert.equal(c.timeSec, 60 + k * 10 + pi * 10);
    if (c.n <= 2) {
      assert.equal(c.species, old);
      assert.equal(c.decoys, 0);
      assert.equal(c.decoy, null);
    } else {
      assert.equal(c.species, Math.min(7, old + 1));
      assert.equal(c.decoys, [7, 9, 10, 12, 13, 15][c.n - 3]);
      const d = PONDS[pi].fish.find((f) => f.id === c.decoy);
      assert.ok(d && d.rarity === 0, c.id);
      assert.ok(c.fish >= c.species);
    }
  }
});

test('wardrobe bonuses (v1.16): 1-3 each, pricier items give more, worn items add to perks', () => {
  for (const c of COSMETICS) {
    const vals = Object.values(c.stats ?? {});
    if (c.price === 0 && !c.source) assert.equal(vals.length, 0, c.id);
    for (const v of vals) assert.ok(v >= 1 && v <= 3, c.id);
  }
  for (const kind of ['hat', 'rod', 'bobber', 'bait'] as const) {
    const bought = COSMETICS.filter((c) => c.kind === kind && c.price > 0).sort((a, b) => a.price - b.price);
    const sum = (c: (typeof COSMETICS)[number]) => Object.values(c.stats ?? {}).reduce((a, b) => a + b, 0);
    for (let i = 1; i < bought.length; i++) assert.ok(sum(bought[i]) >= sum(bought[i - 1]), `${bought[i].id} >= ${bought[i - 1].id}`);
  }
  const s = defaultSave();
  const g = new PondGame(s, new Rng(1));
  assert.equal(g.perk('merchant'), 0);
  s.style.hat = 'hat:crown';
  s.style.rod = 'rod:gold';
  assert.equal(gearPerk(s, 'merchant'), 6);
  assert.equal(g.perk('merchant'), 6);
  assert.equal(g.perk('luck'), 3);
});

test('firm hook (v1.16): 30% of coins with a floor by pond, 5 minutes of 10% shake-offs', () => {
  let now = 1_000_000;
  const s = defaultSave();
  const g = new PondGame(s, new Rng(1), () => now);
  s.coins = 50;
  assert.equal(firmHookPrice(s), 100);
  assert.equal(g.buyFirmHook(), false);
  s.coins = 1000;
  assert.equal(firmHookPrice(s), 300);
  s.unlocked = ['cozy', 'misty'];
  assert.equal(firmHookPrice(s), 500);
  s.unlocked = ['cozy', 'misty', 'frozen'];
  s.coins = 10000;
  assert.equal(firmHookPrice(s), 3000);
  s.coins = 5000;
  assert.equal(firmHookPrice(s), 2000);
  assert.equal(g.stats().slip, 0.2);
  assert.equal(g.buyFirmHook(), true);
  assert.equal(s.coins, 3000);
  assert.equal(g.stats().slip, 0.1);
  assert.equal(g.buyFirmHook(), false, 'no stacking');
  now += 299_000;
  assert.equal(g.stats().slip, 0.1);
  now += 2_000;
  assert.equal(g.stats().slip, 0.2);
});
