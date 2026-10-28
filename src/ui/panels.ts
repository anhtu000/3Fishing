// Menus: upgrades, pets, Fishdex, map, quests, incubator. All share the cream CPanel look.
import Phaser from 'phaser';
import { app } from '@core';
import { BOSS_STARS, bossForm, type BossForm, CHALLENGES, COSMETICS, baitKey, HATCH_SEC, NEST_INDEX, PERKS, PET_MAX_LEVEL, PONDS, QUEST_POOL, RARITY_COLOR, RARITY_CSS, SPECIAL_PETS, STREAK, UPGRADES, UPGRADE_IDS, petById, type CosmeticDef, type PetDef, type UpgradeId } from '../content/data';
import type { PondGame } from '../logic/game';
import { dexCount, eggCoins, hatchSecLeft, hatchSpeed, medalOf, perkValue, pondGold, questEgg, rewardMult, upgradeCost, xpForLevel } from '../logic/rules';
import { dailyStatus } from '../../core/time';
import { formatTime } from '../logic/leaderboard';
import { CButton, COLORS, CPanel, CREAM_DARK, INK, art, card, drawBar, fitScale, fitText, fmt, txt } from './kit';
import { bossName, duration, eggName, fishName, perkText, petName, pondName, rarityName, t } from '../i18n/t';
import { flyIcons, note } from './popups';

export interface PanelCtx {
  game: PondGame;
  /** HUD and pond need to redraw (team, dex, currencies changed). */
  refresh(): void;
  travel(pondId: string): void;
  startBoss(): void;
  /** Boss rematch at the next star (late game). */
  startRematch(): void;
  /** Challenge mode: start this challenge. */
  startChallenge(id: string): void;
  wardrobe(): void;
  hatch(i: number): void;
  coinTo(): { x: number; y: number };
  gemTo(): { x: number; y: number };
  eggTo(): { x: number; y: number };
  /** A panel closed at a natural break: a midgame ad may show here. */
  breakPoint(): void;
}

const DARK = '#3b2a4d';
const DIM = '#7a6a8a';
/** Rematch form colours on light panels (darker than on the banner, to read on cream). */
const FORM_TEXT: Record<BossForm, string> = { classic: DARK, frenzy: '#d9472b', ghost: '#1f9a8a', giant: '#5b7f2f', golden: '#c48a00' };

function upgradeValue(id: UpgradeId, lv: number) {
  switch (id) {
    case 'rod':
      return `+${lv * 8}%`;
    case 'line':
      return `${(1 + 0.1 * lv).toFixed(1)}s`;
    case 'bait':
      return `+${lv}%`;
    case 'float':
      return `${Math.min(1.1, 0.75 + 0.02 * lv).toFixed(2)}s`;
  }
}
function upgradeEffect(id: UpgradeId, lv: number, max: boolean) {
  return `${t(`upg.${id}What`)} ${upgradeValue(id, lv)}${max ? '' : ` » ${upgradeValue(id, lv + 1)}`}`;
}

export function upgradesPanel(scene: Phaser.Scene, ctx: PanelCtx) {
  const g = ctx.game;
  const late = g.lateGame;
  const panel = new CPanel(scene, { title: t('upg.title'), w: 640, h: late ? 880 : 760, color: COLORS.orange, onClose: () => ctx.refresh() });
  // Wardrobe (late game): a place to spend coins once the ponds are done.
  if (late) {
    panel.content.add(
      new CButton(scene, 0, panel.bottom - 70, {
        w: 380,
        h: 88,
        icon: 'icon:i_shirt',
        iconSize: 50,
        label: t('wardrobe.title'),
        fontSize: 32,
        color: COLORS.purple,
        onClick: () => {
          panel.close();
          ctx.wardrobe();
        },
      }),
    );
  }
  const rows: (() => void)[] = [];
  const rw = panel.pw - 60;
  UPGRADE_IDS.forEach((id, i) => {
    const y = panel.top + 70 + i * 150;
    const bg = card(scene, 0, y, rw, 132, 0xfffdf6, 24);
    const icon = art(scene, -rw / 2 + 66, y - 4, `icon:${UPGRADES[id].icon}`);
    icon.setScale(fitScale(`icon:${UPGRADES[id].icon}`, 84));
    const name = txt(scene, -rw / 2 + 130, y - 30, '', 34, { color: DARK, stroke: false }).setOrigin(0, 0.5);
    const eff = txt(scene, -rw / 2 + 130, y + 14, '', 24, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5);
    const buy = new CButton(scene, rw / 2 - 100, y - 2, {
      w: 180,
      h: 86,
      icon: 'item:coin',
      iconSize: 40,
      label: '',
      fontSize: 32,
      color: COLORS.green,
      sound: false,
      onClick: () => {
        if (g.buyUpgrade(id)) {
          app.audio.play('buy');
          app.haptic(15);
          scene.tweens.add({ targets: icon, scale: icon.scale * 1.3, duration: 90, yoyo: true });
          refreshAll();
        } else {
          app.audio.play('nope');
          note(scene, t('msg.noCoins'));
        }
      },
    });
    const refresh = () => {
      const lv = g.s.upgrades[id];
      const max = lv >= UPGRADES[id].max;
      fitText(name.setText(t('upg.level', { name: t(`upg.${id}`), n: lv })), rw - 340);
      fitText(eff.setText(upgradeEffect(id, lv, max)), rw - 340);
      if (max) {
        buy.setLabel(t('upg.max')).setEnabled(false);
        buy.icon?.setVisible(false);
      } else {
        const c = upgradeCost(id, lv);
        buy.setLabel(fmt(c));
        const ok = g.s.coins >= c;
        buy.setColor(ok ? COLORS.green : COLORS.grey).setGlow(ok);
      }
    };
    rows.push(refresh);
    panel.content.add([bg, icon, name, eff, buy]);
  });
  const coinsLine = txt(scene, 0, panel.bottom - (late ? 160 : 60), '', 30, { color: DARK, stroke: false });
  panel.content.add(coinsLine);
  const refreshAll = () => {
    rows.forEach((r) => r());
    coinsLine.setText(t('upg.have', { n: fmt(g.s.coins) }));
    ctx.refresh();
  };
  refreshAll();
  return panel;
}

function perkLine(p: PetDef, level: number) {
  const perk = PERKS[p.perk];
  return perkText(p.perk, perkValue(p.perk, p.rarity, level), perk.unit);
}

export function petsPanel(scene: Phaser.Scene, ctx: PanelCtx) {
  const g = ctx.game;
  const s = g.s;
  const ROW_H = 190;
  const panel = new CPanel(scene, { title: t('pets.title'), w: 660, h: 1360, color: COLORS.pink, onClose: () => ctx.refresh() });
  let selected = s.team[0] ?? Object.keys(s.pets)[0] ?? null;
  const tiles: { id: string; refresh: () => void }[] = [];
  const pw = panel.pw;
  const tw = Math.min(112, (pw - 70) / 5 - 8);
  const teamLine = txt(scene, 0, panel.top + 30, '', 30, { color: DARK, stroke: false });
  panel.content.add(teamLine);
  // One row per pond, then the special pets (login streak).
  const rowsDef = [...PONDS.map((p) => ({ label: pondName(p.id), pets: p.pets })), { label: t('pets.special'), pets: SPECIAL_PETS }];
  rowsDef.forEach((rowDef, row) => {
    const y0 = panel.top + 80 + row * ROW_H;
    const label = txt(scene, -pw / 2 + 40, y0 - 8, rowDef.label, 24, { color: DIM, stroke: false }).setOrigin(0, 0.5);
    panel.content.add(label);
    rowDef.pets.forEach((p, i) => {
      const x = (i - (rowDef.pets.length > 1 ? 2 : 0)) * (tw + 10);
      const y = y0 + 96;
      const bg = card(scene, x, y, tw, 140, 0xfffdf6, 20);
      const img = art(scene, x, y - 12, `pet:${p.id}`);
      img.setScale(fitScale(`pet:${p.id}`, tw - 14));
      const lv = txt(scene, x, y + 46, '', 22, { color: DARK, stroke: false });
      const team = txt(scene, x, y - 70, t('pets.team'), 20, { color: '#ffffff' });
      const frame = scene.add.graphics();
      const hit = scene.add.zone(x, y, tw, 140).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        if (!s.pets[p.id]) return;
        selected = p.id;
        app.audio.play('ui-tap', { volume: 0.5 });
        refreshAll();
      });
      const refresh = () => {
        const st = s.pets[p.id];
        if (st) {
          img.clearTint().setAlpha(1);
          lv.setText(t('pets.level', { n: st.level }));
        } else {
          img.setTint(0x3b2a4d).setTintMode(Phaser.TintModes.FILL).setAlpha(0.3);
          lv.setText(t('dex.unknown'));
        }
        team.setVisible(s.team.includes(p.id));
        frame.clear();
        frame.lineStyle(5, RARITY_COLOR[p.rarity], 1).strokeRoundedRect(x - tw / 2 + 6, y - 64, tw - 12, 120, 16);
        if (selected === p.id) frame.lineStyle(6, INK, 1).strokeRoundedRect(x - tw / 2 - 6, y - 76, tw + 12, 150, 22);
      };
      tiles.push({ id: p.id, refresh });
      panel.content.add([bg, frame, img, lv, team, hit]);
    });
  });
  // Detail area.
  const dy = panel.top + 80 + rowsDef.length * ROW_H + 60;
  const dbg = card(scene, 0, dy + 82, pw - 60, 276, 0xfffdf6, 26);
  const dimg = art(scene, -pw / 2 + 120, dy + 60, 'pet:puddle_frog');
  const dname = txt(scene, -pw / 2 + 210, dy - 10, '', 36, { color: DARK, stroke: false }).setOrigin(0, 0.5);
  const drar = txt(scene, -pw / 2 + 210, dy + 30, '', 24, { color: DIM, stroke: false }).setOrigin(0, 0.5);
  const dperk = txt(scene, -pw / 2 + 210, dy + 66, '', 24, { color: DARK, stroke: false, weight: '500' }).setOrigin(0, 0.5);
  const xpG = scene.add.graphics().setPosition(-pw / 2 + 420, dy + 108);
  const xpT = txt(scene, -pw / 2 + 210, dy + 108, '', 22, { color: DIM, stroke: false }).setOrigin(0, 0.5);
  const toggle = new CButton(scene, 0, dy + 172, {
    w: 300,
    h: 84,
    label: '',
    fontSize: 32,
    color: COLORS.green,
    onClick: () => {
      if (!selected) return;
      if (!g.toggleTeam(selected)) note(scene, t('msg.teamFull'));
      refreshAll();
    },
  });
  const empty = txt(scene, 0, dy + 70, t('pets.empty'), 30, { color: DIM, stroke: false });
  panel.content.add([dbg, dimg, dname, drar, dperk, xpG, xpT, toggle, empty]);
  const slotBtn = new CButton(scene, 0, panel.bottom - 70, {
    w: 360,
    h: 84,
    icon: 'item:coin',
    iconSize: 40,
    label: '',
    fontSize: 28,
    color: COLORS.blue,
    onClick: () => {
      if (g.buyTeamSlot()) {
        app.audio.play('buy');
        refreshAll();
      } else note(scene, t('msg.noCoins'));
    },
  });
  panel.content.add(slotBtn);
  const refreshAll = () => {
    fitText(teamLine.setText(t('pets.teamLine', { n: s.team.length, max: s.teamSlots })), pw - 60);
    tiles.forEach((t) => t.refresh());
    const p = selected ? petById.get(selected) : null;
    const st = selected ? s.pets[selected] : null;
    const has = !!(p && st);
    for (const o of [dimg, dname, drar, dperk, xpG, xpT, toggle]) o.setVisible(has);
    empty.setVisible(!has);
    if (p && st) {
      dimg.setTexture(`pet:${p.id}`).setScale(fitScale(`pet:${p.id}`, 170));
      fitText(dname.setText(`${petName(p.id)}${st.shiny ? ` ${t('pets.shiny')}` : ''}`), pw - 290);
      fitText(drar.setText(t('pets.rarityLevel', { rarity: rarityName(p.rarity).toLocaleUpperCase(), n: st.level, max: PET_MAX_LEVEL })).setColor(RARITY_CSS[p.rarity]), pw - 290);
      fitText(dperk.setText(perkLine(p, st.level)), pw - 290);
      const need = xpForLevel(st.level);
      drawBar(xpG, 180, 18, st.level >= PET_MAX_LEVEL ? 1 : st.xp / need, COLORS.pink);
      xpT.setText(st.level >= PET_MAX_LEVEL ? t('upg.max') : t('pets.xp', { n: st.xp, max: need }));
      const inTeam = s.team.includes(p.id);
      toggle.setLabel(inTeam ? t('pets.rest') : t('pets.join')).setColor(inTeam ? COLORS.grey : COLORS.green);
    }
    const cost = g.teamSlotCost();
    slotBtn.setVisible(Number.isFinite(cost));
    slotBtn.setLabel(t('pets.slot', { n: fmt(cost) }));
    ctx.refresh();
  };
  refreshAll();
  return panel;
}

export function dexPanel(scene: Phaser.Scene, ctx: PanelCtx, pondId = ctx.game.s.pond) {
  const g = ctx.game;
  const s = g.s;
  const panel = new CPanel(scene, {
    title: t('dex.title'),
    w: 660,
    // Late game: room for the medal line and the rematch button.
    h: ctx.game.lateGame ? 1380 : 1200,
    color: COLORS.blue,
    // The commercial break on the way back to play is handled by the scene for every menu.
    onClose: () => ctx.refresh(),
  });
  const pw = panel.pw;
  const page = scene.add.container(0, 0);
  panel.content.add(page);
  const tabs = PONDS.map((p, i) =>
    new CButton(scene, (i - (PONDS.length - 1) / 2) * ((pw - 50) / PONDS.length), panel.top + 30, {
      w: (pw - 50) / PONDS.length - 12,
      h: 74,
      label: pondName(p.id),
      fontSize: 26,
      color: COLORS.grey,
      onClick: () => show(p.id),
    }),
  );
  panel.content.add(tabs);
  const show = (id: string) => {
    page.removeAll(true);
    const pond = PONDS.find((p) => p.id === id)!;
    tabs.forEach((t, i) => t.setColor(PONDS[i].id === id ? COLORS.blue : COLORS.grey));
    const n = dexCount(s, pond);
    const beaten = s.bosses.includes(pond.boss.id);
    const bn = bossName(pond.boss.id);
    const head = fitText(txt(scene, 0, panel.top + 110, `${t('dex.found', { n, max: pond.fish.length })}  ·  ${beaten ? t('dex.beaten', { boss: bn }) : n >= pond.bossAt ? t('dex.waiting', { boss: bn }) : t('dex.bossAt', { n: pond.bossAt })}`, 26, { color: DARK, stroke: false }), pw - 60);
    page.add(head);
    if (g.lateGame) {
      // Gold pond (+10% fish price) and the boss stars.
      const gold = pondGold(s, pond);
      const best = s.bossStars[pond.boss.id] ?? 0;
      const line = fitText(txt(scene, 0, panel.top + 152, `${gold ? t('medal.pondGoldOn') : t('medal.pondGoldHint')}${beaten ? `  ·  ${t('rematch.best', { n: best, max: BOSS_STARS.max })}` : ''}`, 22, { color: gold ? '#c48a00' : DIM, stroke: false, weight: '500' }), pw - 60);
      page.add(line);
    }
    // Three columns: picture on top, name, rarity, then best size and count on one line.
    const cols = 3;
    const cw = (pw - 60) / cols - 10;
    const chh = 196;
    pond.fish.forEach((f, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * (cw + 10);
      const y = panel.top + (g.lateGame ? 280 : 240) + row * (chh + 10);
      const entry = s.dex[f.id];
      const bg = card(scene, x, y, cw, chh, 0xfffdf6, 22);
      const frame = scene.add.graphics().lineStyle(5, RARITY_COLOR[f.rarity], 1).strokeRoundedRect(x - cw / 2 + 7, y - chh / 2 + 6, cw - 14, chh - 20, 16);
      const img = art(scene, x, y - 42, `fish:${f.id}`);
      img.setScale(Math.min(fitScale(`fish:${f.id}`, cw - 36), fitScale(`fish:${f.id}`, 120)));
      const name = fitText(txt(scene, x, y + 16, entry ? fishName(f.id) : t('dex.unknown'), 22, { color: DARK, stroke: false }), cw - 20);
      const rar = fitText(txt(scene, x, y + 42, rarityName(f.rarity), 18, { color: RARITY_CSS[f.rarity], stroke: false }), cw - 20);
      const info = fitText(txt(scene, x, y + 66, entry ? `${t('dex.best', { n: entry.best.toFixed(1) })}  ·  ×${entry.n}` : '', 16, { color: DIM, stroke: false, weight: '500' }), cw - 20);
      if (!entry) img.setTint(0x3b2a4d).setTintMode(Phaser.TintModes.FILL).setAlpha(0.35);
      page.add([bg, frame, img, name, rar, info]);
      // Medals (late game): bronze, silver, gold (silver plus a giant).
      const m = g.lateGame ? medalOf(s, f) : 0;
      if (m > 0) {
        const md = art(scene, x + cw / 2 - 28, y - chh / 2 + 30, `icon:i_medal${m}`);
        md.setScale(fitScale(`icon:i_medal${m}`, 38));
        page.add(md);
      }
    });
    // Boss stars (late game, boss beaten): what ★ means, then one star per rematch level won.
    if (g.lateGame && beaten) {
      const best = s.bossStars[pond.boss.id] ?? 0;
      const gridBottom = panel.top + 280 + (Math.ceil(pond.fish.length / 3) - 1) * 206 + 98;
      page.add(fitText(txt(scene, 0, gridBottom + 42, t('rematch.what'), 20, { color: DIM, stroke: false, weight: '500', wrap: pw - 80 }), pw - 60));
      const sz = Math.min(44, (pw - 100) / BOSS_STARS.max);
      for (let k = 0; k < BOSS_STARS.max; k++) {
        const st = art(scene, (k - (BOSS_STARS.max - 1) / 2) * (sz + 4), gridBottom + 108, 'icon:i_star');
        st.setScale(fitScale('icon:i_star', sz));
        if (k >= best) st.setTint(0xd8cfe0).setTintMode(Phaser.TintModes.FILL).setAlpha(0.8);
        page.add(st);
      }
      // The next rematch's form and its twist (★1 is the boss as you know it).
      const next = g.rematchStar(pond);
      const form = next === null ? 'classic' : bossForm(PONDS.indexOf(pond), next);
      if (next !== null && form !== 'classic') {
        const line = txt(scene, 0, gridBottom + 162, `★${next}  ${t(`form.${form}`)}: ${t(`form.${form}Tip`)}`, 22, { color: FORM_TEXT[form], stroke: false });
        page.add(fitText(line, pw - 60));
      }
    }
    // Rematch (late game, boss beaten, in this pond): next star, 3 winning tickets a day.
    const star = g.rematchStar(pond);
    // A lost boss must be lured back first (a few catches in this pond).
    const lure = pond.id === s.pond ? g.lure : null;
    if (lure && (star !== null || (!beaten && n >= pond.bossAt))) {
      page.add(txt(scene, 0, panel.bottom - 70, t('lure.goal', { boss: bn, n: lure.have, max: lure.need }), 28, { color: '#c0392b', stroke: false, wrap: pw - 80 }));
    } else if (star !== null && pond.id === s.pond) {
      const left = g.ticketsLeft;
      const b = new CButton(scene, 0, panel.bottom - 84, {
        w: 460,
        h: 90,
        icon: 'icon:i_crown',
        label: t('rematch.fight', { n: star }),
        fontSize: 32,
        color: left > 0 ? COLORS.red : COLORS.grey,
        onClick: () => {
          if (g.ticketsLeft <= 0) return note(scene, t('rematch.noTickets'));
          panel.close();
          ctx.startRematch();
        },
      });
      if (left > 0) b.setGlow(true);
      page.add(b);
      page.add(txt(scene, 0, panel.bottom - 26, t('rematch.tickets', { n: left, max: BOSS_STARS.ticketsPerDay }), 22, { color: DIM, stroke: false, weight: '500' }));
    }
    if (!lure && !beaten && n >= pond.bossAt && pond.id === s.pond) {
      const b = new CButton(scene, 0, panel.bottom - 70, {
        w: 340,
        h: 90,
        icon: 'icon:i_crown',
        label: t('dex.fight'),
        fontSize: 34,
        color: COLORS.red,
        onClick: () => {
          panel.close();
          ctx.startBoss();
        },
      });
      b.setGlow(true);
      page.add(b);
    }
  };
  show(pondId);
  return panel;
}

export function mapPanel(scene: Phaser.Scene, ctx: PanelCtx) {
  const g = ctx.game;
  const s = g.s;
  const panel = new CPanel(scene, { title: t('map.title'), w: 640, h: 1190, color: COLORS.green, onClose: () => ctx.refresh() });
  const pw = panel.pw;
  const list = [...PONDS.map((p) => ({ pond: p, soon: false })), { pond: null, soon: true }];
  list.forEach((entry, i) => {
    const y = panel.top + 120 + i * 250;
    const bg = card(scene, 0, y, pw - 60, 230, 0xfffdf6, 26);
    const items: Phaser.GameObjects.GameObject[] = [bg];
    if (entry.pond) {
      const p = entry.pond;
      const pal = { cozy: [0x7fd0f2, 0x5fcbe0, 0x1d5f93], misty: [0xb9a8ec, 0x7ac2d0, 0x253f6e], frozen: [0x9fc3f0, 0x6fb3d2, 0x1a3a66] }[p.id] ?? [0x7fd0f2, 0x5fcbe0, 0x1d5f93];
      const mini = scene.add.graphics();
      const mx = -pw / 2 + 50;
      mini.fillStyle(INK, 1).fillRoundedRect(mx - 4, y - 94, 228, 168, 22);
      mini.fillStyle(pal[0], 1).fillRoundedRect(mx, y - 90, 220, 70, { tl: 18, tr: 18, bl: 0, br: 0 });
      mini.fillGradientStyle(pal[1], pal[1], pal[2], pal[2], 1).fillRect(mx, y - 20, 220, 90);
      const fish = art(scene, mx + 110, y + 20, `fish:${p.fish[p.fish.length - 1].id}`);
      fish.setScale(fitScale(`fish:${p.fish[p.fish.length - 1].id}`, 120));
      const pet = art(scene, mx + 60, y - 40, `pet:${p.pets[0].id}`);
      pet.setScale(fitScale(`pet:${p.pets[0].id}`, 70));
      items.push(mini, fish, pet);
      const name = fitText(txt(scene, mx + 250, y - 60, pondName(p.id), 34, { color: DARK, stroke: false }).setOrigin(0, 0.5), pw - 330);
      const info = fitText(txt(scene, mx + 250, y - 18, t('map.info', { m: p.priceMult, n: dexCount(s, p), max: p.fish.length }), 22, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5), pw - 330);
      items.push(name, info);
      // Today's fish lives here: a gold tag on the picture.
      if (g.today?.pond.id === p.id) {
        const tag = scene.add.graphics();
        tag.fillStyle(INK, 1).fillRoundedRect(mx + 6, y - 112, 208, 44, 18);
        tag.fillStyle(0xffd86b, 1).fillRoundedRect(mx + 10, y - 108, 200, 36, 16);
        const tt = fitText(txt(scene, mx + 110, y - 91, t('today.label'), 22, { color: '#b4521a', stroke: false }), 184);
        items.push(tag, tt);
      }
      const here = s.pond === p.id;
      const unlocked = s.unlocked.includes(p.id);
      const canUnlock = g.canUnlock(p);
      const prev = PONDS[PONDS.indexOf(p) - 1];
      const bx = mx + 250 + 130;
      let btn: CButton;
      if (here) btn = new CButton(scene, bx, y + 50, { w: 240, h: 80, label: t('map.here'), fontSize: 26, color: COLORS.grey, onClick: () => {} }).setEnabled(false);
      else if (unlocked) btn = new CButton(scene, bx, y + 50, { w: 240, h: 80, label: t('map.go'), fontSize: 28, color: COLORS.green, onClick: () => (panel.close(), ctx.travel(p.id)) });
      else if (canUnlock)
        btn = new CButton(scene, bx, y + 50, {
          w: 240,
          h: 80,
          icon: 'item:coin',
          iconSize: 38,
          label: t('map.unlock', { n: fmt(p.unlockCost) }),
          fontSize: 26,
          color: s.coins >= p.unlockCost ? COLORS.orange : COLORS.grey,
          onClick: () => {
            if (g.unlockPond(p)) {
              app.measure('pond', p.id, 'unlock');
              app.audio.play('unlock');
              panel.close();
              ctx.travel(p.id);
            } else note(scene, t('msg.needCoins', { n: fmt(p.unlockCost) }));
          },
        });
      else btn = new CButton(scene, bx, y + 50, { w: 240, h: 80, icon: 'icon:i_lock', iconSize: 40, label: t('map.beat', { boss: prev ? bossName(prev.boss.id) : '' }), fontSize: 22, color: COLORS.grey, onClick: () => note(scene, t('msg.unlockHow', { n: prev?.bossAt ?? 0, pond: prev ? pondName(prev.id) : '', boss: prev ? bossName(prev.boss.id) : '' })) });
      if (canUnlock && !unlocked && s.coins >= p.unlockCost) btn.setGlow(true);
      items.push(btn);
    } else {
      const name = txt(scene, 0, y - 20, t('map.soonName'), 34, { color: DIM, stroke: false });
      const info = txt(scene, 30, y + 26, t('map.soon'), 22, { color: DIM, stroke: false, weight: '500', wrap: pw - 220 });
      const lock = art(scene, -pw / 2 + 100, y, 'icon:i_lock', 0.8);
      items.push(name, info, lock);
    }
    panel.content.add(items);
  });
  return panel;
}

export function questsPanel(scene: Phaser.Scene, ctx: PanelCtx, onDaily: () => void) {
  const g = ctx.game;
  const s = g.s;
  const panel = new CPanel(scene, { title: t('quests.title'), w: 640, h: 820, color: COLORS.yellow, onClose: () => ctx.refresh() });
  const pw = panel.pw;
  const rows: (() => void)[] = [];
  s.quests.list.forEach((q, i) => {
    const def = QUEST_POOL.find((d) => d.id === q.id)!;
    const y = panel.top + 80 + i * 160;
    const bg = card(scene, 0, y, pw - 60, 140, 0xfffdf6, 24);
    const qt = fitText(txt(scene, -pw / 2 + 60, y - 30, t(`quests.${def.kind}`, { n: fmt(def.goal) }), 28, { color: DARK, stroke: false }).setOrigin(0, 0.5), pw - 300);
    const bar = scene.add.graphics().setPosition(-pw / 2 + 60 + 140, y + 20);
    const pt = txt(scene, -pw / 2 + 60 + 300, y + 20, '', 22, { color: DIM, stroke: false }).setOrigin(0, 0.5);
    const eggTier = questEgg(s, i);
    const btn = new CButton(scene, pw / 2 - 110, y, {
      w: 170,
      h: 84,
      icon: 'item:coin',
      iconSize: 38,
      label: fmt(def.coins * rewardMult(s)),
      fontSize: 30,
      color: COLORS.green,
      onClick: () => {
        const r = g.claimQuest(i);
        if (!r) return;
        app.audio.play('reward');
        flyIcons(scene, 'item:coin', panel.toScene(btn.x, y), ctx.coinTo(), 6);
        if (r.egg >= 0 && r.eggStored) flyIcons(scene, `egg:${r.egg}`, panel.toScene(btn.x, y), ctx.eggTo(), 1);
        refresh();
        ctx.refresh();
      },
    });

    const refresh = () => {
      drawBar(bar, 280, 22, q.progress / def.goal, COLORS.yellow);
      pt.setText(`${fmt(q.progress)}/${fmt(def.goal)}`);
      const ready = !q.claimed && q.progress >= def.goal;
      btn.setEnabled(ready).setGlow(ready).setColor(q.claimed ? COLORS.grey : COLORS.green);
      if (q.claimed) btn.setLabel(t('quests.done'));
    };
    rows.push(refresh);
    panel.content.add([bg, qt, bar, pt, btn]);
    // The third quest also gives an egg: a badge on the button's corner.
    if (eggTier >= 0) {
      const eg = art(scene, pw / 2 - 40, y - 44, `egg:${eggTier}`);
      eg.setScale(fitScale(`egg:${eggTier}`, 50)).setAngle(12);
      panel.content.add(eg);
    }
  });
  const st = dailyStatus(s.daily);
  const day = ((st.streak - 1) % 7) + 1;
  const dailyBtn = new CButton(scene, 0, panel.bottom - 80, {
    w: 420,
    h: 90,
    icon: 'icon:i_gift',
    iconSize: 50,
    label: st.canClaim ? t('quests.dailyDay', { n: day }) : t('quests.dailyClaimed'),
    fontSize: 30,
    color: st.canClaim ? COLORS.pink : COLORS.grey,
    onClick: () => {
      if (!st.canClaim) return note(scene, t('msg.comeBackTomorrow'));
      panel.close();
      onDaily();
    },
  });
  if (st.canClaim) dailyBtn.setGlow(true);
  const sub = txt(scene, 0, panel.bottom - 160, t('quests.refresh'), 24, { color: DIM, stroke: false, weight: '500' });
  panel.content.add([dailyBtn, sub]);
  rows.forEach((r) => r());
  return panel;
}

/** 7-day streak gift. */
export function dailyPanel(scene: Phaser.Scene, ctx: PanelCtx, claim: (dayIndex: number) => void) {
  const s = ctx.game.s;
  const st = dailyStatus(s.daily);
  const today = (st.streak - 1) % 7;
  const panel = new CPanel(scene, { title: t('daily.title'), w: 660, h: 640, color: COLORS.pink, onClose: () => ctx.refresh() });
  const pw = panel.pw;
  const tw = Math.min(140, (pw - 80) / 4 - 10);
  STREAK.forEach((r, i) => {
    const row = i < 4 ? 0 : 1;
    const col = row === 0 ? i : i - 4;
    const inRow = row === 0 ? 4 : 3;
    const x = (col - (inRow - 1) / 2) * (tw + 14);
    const y = panel.top + 110 + row * 200;
    const isToday = i === today && st.canClaim;
    const done = i < today || (!st.canClaim && i === today);
    const bg = card(scene, x, y, tw, 180, isToday ? 0xffe9a8 : done ? CREAM_DARK : 0xfffdf6, 22);
    const d = txt(scene, x, y - 66, t('daily.day', { n: i + 1 }), 24, { color: DARK, stroke: false });
    // Day 3: an exclusive hat (shown on the cat), day 7: an exclusive pet.
    const key = r.pet ? `pet:${r.pet}` : r.hat ? 'sc:cat' : r.egg >= 0 ? `egg:${r.egg}` : 'item:coin';
    const icon = art(scene, x, y - 4, key);
    icon.setScale(fitScale(key, r.hat ? 80 : 70));
    const hatImg = r.hat ? art(scene, x, y - 4, r.hat).setScale(icon.scale) : null;
    const label = txt(scene, x, y + 58, r.pet ? petName(r.pet) : r.hat ? t('wardrobe.newHat') : r.egg >= 0 ? eggName(r.egg) : fmt(r.coins * rewardMult(s)), 20, { color: r.pet || r.hat ? '#c2557a' : DARK, stroke: false });
    if (label.width > tw - 10) label.setScale((tw - 10) / label.width);
    const items: Phaser.GameObjects.GameObject[] = [bg, d, icon, label];
    if (hatImg) items.push(hatImg);
    if (done) {
      const ck = scene.add.graphics();
      ck.lineStyle(16, INK, 1).beginPath().moveTo(x - 30, y).lineTo(x - 8, y + 24).lineTo(x + 34, y - 26).strokePath();
      ck.lineStyle(9, 0x5fd38d, 1).beginPath().moveTo(x - 30, y).lineTo(x - 8, y + 24).lineTo(x + 34, y - 26).strokePath();
      items.push(ck);
    }
    if (isToday) scene.tweens.add({ targets: icon, scale: icon.scale * 1.15, duration: 500, yoyo: true, repeat: -1 });
    panel.content.add(items);
  });
  const btn = new CButton(scene, 0, panel.bottom - 90, {
    w: 360,
    h: 96,
    label: st.canClaim ? t('daily.claim') : t('daily.tomorrow'),
    fontSize: st.canClaim ? 40 : 28,
    color: st.canClaim ? COLORS.green : COLORS.grey,
    onClick: () => {
      if (st.canClaim) claim(today);
      panel.close();
    },
  });
  if (st.canClaim) btn.setGlow(true);
  panel.content.add(btn);
  return panel;
}

/** Tapping an egg that is not ready: time left, hatch-now ad, more slots. */
export function incubatorPanel(scene: Phaser.Scene, ctx: PanelCtx, index: number, watchAd: (done: () => void) => void) {
  const g = ctx.game;
  const s = g.s;
  const egg = s.eggs[index];
  const nest = index === NEST_INDEX;
  const panel = new CPanel(scene, { title: t(nest ? 'incubator.nestTitle' : 'incubator.title'), w: 600, h: 860, color: nest ? COLORS.orange : COLORS.purple, onClose: () => ctx.refresh() });
  if (egg) {
    const img = art(scene, 0, panel.top + 120, `egg:${egg.tier}`, 1.0);
    scene.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const name = txt(scene, 0, panel.top + 240, eggName(egg.tier).toLocaleUpperCase(), 36, { color: RARITY_CSS[egg.tier] === '#7d8b99' ? DARK : RARITY_CSS[egg.tier], stroke: false });
    const left = txt(scene, 0, panel.top + 286, '', 28, { color: DIM, stroke: false });
    const bar = scene.add.graphics().setPosition(0, panel.top + 330);
    const tip = txt(scene, 0, panel.top + 374, t(nest ? 'incubator.nestTip' : 'incubator.tip'), 24, { color: DIM, stroke: false, weight: '500', wrap: 520 });
    panel.content.add([img, name, left, bar, tip]);
    const tick = () => {
      const e = s.eggs[index];
      if (!e) return;
      const sec = Math.ceil(hatchSecLeft(s, e));
      left.setText(sec > 0 ? t('incubator.hatchesIn', { t: duration(sec) }) : t('incubator.ready'));
      drawBar(bar, 380, 26, 1 - e.left / (e.total || HATCH_SEC[e.tier]), COLORS.purple);
    };
    tick();
    const timer = scene.time.addEvent({ delay: 250, loop: true, callback: tick });
    panel.once(Phaser.GameObjects.Events.DESTROY, () => timer.remove());
    // Poki: the free option comes first (above), at least as big as the rewarded one.
    const wait = new CButton(scene, 0, panel.bottom - 300, { w: 380, h: 96, label: t('incubator.keepFishing'), fontSize: 34, color: COLORS.orange, onClick: () => panel.close() });
    panel.content.add(wait);
    if (app.ads.rewardedAvailable && !app.clean) {
      const ad = new CButton(scene, 0, panel.bottom - 190, {
        w: 380,
        h: 96,
        label: t('incubator.hatchNow'),
        fontSize: 36,
        color: COLORS.ad,
        ad: true,
        onClick: () =>
          watchAd(() => {
            g.hatchNow(index);
            panel.close();
            ctx.hatch(index);
          }),
      });
      panel.content.add(ad);
    }
  }
  const cost = g.incubatorSlotCost();
  if (Number.isFinite(cost) && !nest) {
    const b = new CButton(scene, 0, panel.bottom - 80, {
      w: 380,
      h: 80,
      icon: 'item:coin',
      iconSize: 38,
      label: t('incubator.slot', { n: fmt(cost) }),
      fontSize: 28,
      color: COLORS.blue,
      onClick: () => {
        if (g.buyIncubatorSlot()) {
          app.audio.play('buy');
          panel.close();
          ctx.refresh();
        } else note(scene, t('msg.noCoins'));
      },
    });
    panel.content.add(b);
  }
  return panel;
}

/** Egg basket: pick which egg goes into a free incubator slot (slot -1: the first free one). */
/**
 * Portrait incubator panel (opened from the one incubator button): every open slot and the
 * overnight nest as cards with live timers, plus the egg basket. Tapping a card does what the old
 * egg button did (hatch, details, or pick an egg from the basket for an empty slot).
 */
export function eggsPanel(scene: Phaser.Scene, ctx: PanelCtx, onSlot: (i: number) => void, onBasket: () => void) {
  const s = ctx.game.s;
  const slots: number[] = [];
  for (let i = 0; i < s.incubatorSlots; i++) slots.push(i);
  if (s.eggs[NEST_INDEX]) slots.push(NEST_INDEX);
  const cols = 3;
  const rows = Math.ceil(slots.length / cols);
  const cw = 190;
  const ch = 230;
  const hasBasket = s.basket.length > 0;
  const h = 150 + rows * (ch + 20) + (hasBasket ? 130 : 0) + 40;
  const panel = new CPanel(scene, { title: t('incubator.title'), w: 660, h, color: COLORS.purple, onClose: () => ctx.refresh() });
  const go = (fn: () => void) => {
    panel.close();
    scene.time.delayedCall(120, fn);
  };
  const ticks: (() => void)[] = [];
  slots.forEach((i, k) => {
    const nest = i === NEST_INDEX;
    const inRow = Math.min(cols, slots.length - Math.floor(k / cols) * cols);
    const x = ((k % cols) - (inRow - 1) / 2) * (cw + 16);
    const y = panel.top + 60 + ch / 2 + Math.floor(k / cols) * (ch + 20);
    const c = new CButton(scene, x, y, { w: cw, h: ch, color: nest ? 0xe9c98f : 0xfffdf6, onClick: () => go(() => onSlot(i)) });
    const img = art(scene, 0, -30, 'egg:0');
    const name = txt(scene, 0, 52, '', 20, { color: DARK, stroke: false });
    const time = txt(scene, 0, 84, '', 24, { color: DIM, stroke: false });
    c.add([img, name, time]);
    panel.content.add(c);
    let tier = -1;
    const tick = () => {
      const e = s.eggs[i];
      if (!e) {
        img.setAlpha(0.25);
        name.setText('');
        time.setText(s.basket.length > 0 ? '+' : '');
        c.setGlow(s.basket.length > 0);
        return;
      }
      if (tier !== e.tier) {
        tier = e.tier;
        img.setTexture(`egg:${e.tier}`).setScale(fitScale(`egg:${e.tier}`, 110)).setAlpha(1);
        fitText(name.setText(nest ? t('incubator.nestTitle') : eggName(e.tier)).setColor(RARITY_CSS[e.tier] === '#7d8b99' ? DARK : RARITY_CSS[e.tier]), cw - 20);
      }
      const sec = Math.ceil(hatchSecLeft(s, e));
      fitText(time.setText(sec > 0 ? duration(sec) : t('hud.hatch')), cw - 20);
      c.setGlow(sec <= 0);
    };
    tick();
    ticks.push(tick);
  });
  if (hasBasket) {
    const b = new CButton(scene, 0, panel.bottom - 110, { w: 420, h: 96, icon: 'icon:i_basket', iconSize: 56, label: `${t('basket.title')}  ${s.basket.length}`, fontSize: 30, color: COLORS.orange, onClick: () => go(onBasket) });
    if (b.label) fitText(b.label, 320);
    panel.content.add(b);
  }
  const timer = scene.time.addEvent({ delay: 250, loop: true, callback: () => ticks.forEach((f) => f()) });
  panel.once(Phaser.GameObjects.Events.DESTROY, () => timer.remove());
  return panel;
}

export function basketPanel(scene: Phaser.Scene, ctx: PanelCtx, slot = -1) {
  const g = ctx.game;
  const s = g.s;
  const panel = new CPanel(scene, { title: t('basket.title'), w: 640, h: 1040, color: COLORS.orange, onClose: () => ctx.refresh() });
  const pw = panel.pw;
  const free = () => s.eggs.some((e, i) => i < s.incubatorSlots && !e);
  const sub = txt(scene, 0, panel.top + 50, '', 26, { color: DIM, stroke: false, weight: '500', wrap: pw - 80 });
  panel.content.add(sub);
  const cells: Phaser.GameObjects.GameObject[] = [];
  const draw = () => {
    cells.forEach((c) => c.destroy());
    cells.length = 0;
    sub.setText(s.basket.length === 0 ? t('basket.empty') : free() ? t('basket.tip') : t('basket.full'));
    // Rarest first, so the best egg is the easy pick.
    const order = s.basket.map((b, i) => ({ b, i })).sort((a, b) => b.b.tier - a.b.tier);
    const cw = Math.min(136, (pw - 60) / 4 - 10);
    order.forEach(({ b, i }, k) => {
      const col = k % 4;
      const row = Math.floor(k / 4);
      const x = (col - 1.5) * (cw + 12);
      const y = panel.top + 160 + row * 252;
      // Sell instead (same coins as an egg sold when there is no room).
      const value = eggCoins(b.tier, s);
      const sell = new CButton(scene, x, y + 122, {
        w: cw,
        h: 52,
        icon: 'item:coin',
        iconSize: 24,
        label: t('basket.sell', { n: fmt(value) }),
        fontSize: 20,
        color: COLORS.blue,
        onClick: () => {
          const got = g.sellBasketEgg(i);
          if (!got) return;
          app.audio.play('coin');
          flyIcons(scene, 'item:coin', panel.toScene(x, y + 122), ctx.coinTo(), 4);
          ctx.refresh();
          if (s.basket.length === 0) panel.close();
          else draw();
        },
      });
      if (sell.label) fitText(sell.label, cw - 44);
      panel.content.add(sell);
      cells.push(sell);
      const c = new CButton(scene, x, y, {
        w: cw,
        h: 180,
        color: free() ? 0xfffdf6 : CREAM_DARK,
        onClick: () => {
          if (!g.incubate(i, slot >= 0 && !s.eggs[slot] ? slot : -1)) return note(scene, t('basket.full'));
          app.audio.play('plop');
          flyIcons(scene, `egg:${b.tier}`, panel.toScene(x, y), ctx.eggTo(), 1);
          ctx.refresh();
          if (!free() || s.basket.length === 0) panel.close();
          else draw();
        },
      });
      const egg = art(scene, 0, -26, `egg:${b.tier}`);
      egg.setScale(fitScale(`egg:${b.tier}`, 82));
      const name = fitText(txt(scene, 0, 40, eggName(b.tier), 20, { color: RARITY_CSS[b.tier] === '#7d8b99' ? DARK : RARITY_CSS[b.tier], stroke: false }), cw - 14);
      const time = txt(scene, 0, 66, duration(Math.ceil(HATCH_SEC[b.tier] / hatchSpeed(s))), 20, { color: DIM, stroke: false, weight: '500' });
      c.add([egg, name, time]);
      if (b.shiny) {
        const st = art(scene, cw / 2 - 22, -66, 'icon:i_star');
        st.setScale(fitScale('icon:i_star', 30));
        c.add(st);
      }
      panel.content.add(c);
      cells.push(c);
    });
  };
  draw();
  const cost = g.incubatorSlotCost();
  if (Number.isFinite(cost)) {
    const b = new CButton(scene, 0, panel.bottom - 80, {
      w: 380,
      h: 80,
      icon: 'item:coin',
      iconSize: 38,
      label: t('incubator.slot', { n: fmt(cost) }),
      fontSize: 28,
      color: COLORS.blue,
      onClick: () => {
        if (g.buyIncubatorSlot()) {
          app.audio.play('buy');
          ctx.refresh();
          panel.close();
        } else note(scene, t('msg.noCoins'));
      },
    });
    panel.content.add(b);
  }
  return panel;
}

/** Wardrobe: hats, rods and bobbers. Tap to buy (coins) or wear; exclusives show how to get them. */
export function wardrobePanel(scene: Phaser.Scene, ctx: PanelCtx) {
  const g = ctx.game;
  const s = g.s;
  const panel = new CPanel(scene, { title: t('wardrobe.title'), w: 660, h: 1290, color: COLORS.purple, onClose: () => ctx.refresh() });
  const pw = panel.pw;
  const tw = Math.min(112, (pw - 70) / 5 - 8);
  const coinsLine = txt(scene, 0, panel.bottom - 44, '', 28, { color: DARK, stroke: false });
  panel.content.add(coinsLine);
  const tiles: (() => void)[] = [];
  const section = (kind: CosmeticDef['kind'], title: string, y0: number) => {
    panel.content.add(txt(scene, -pw / 2 + 40, y0, title, 26, { color: DIM, stroke: false }).setOrigin(0, 0.5));
    const list = COSMETICS.filter((c) => c.kind === kind);
    list.forEach((c, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = (col - 2) * (tw + 10);
      const y = y0 + 96 + row * 172;
      const tile = new CButton(scene, x, y, {
        w: tw,
        h: 156,
        color: 0xfffdf6,
        onClick: () => {
          const r = g.wear(c.id);
          if (r === 'noCoins') return note(scene, t('msg.needCoins', { n: fmt(c.price) }));
          if (r === 'locked') return note(scene, c.source === 'daily3' ? t('wardrobe.fromDaily3') : t('wardrobe.fromStars15', { n: g.starsTotal }));
          app.audio.play(r === 'bought' ? 'buy' : 'ui-tap');
          ctx.refresh();
          refreshAll();
        },
      });
      // Preview: the cat with the hat, a bit of rod, or the bobber.
      if (kind === 'hat') {
        const cat = art(scene, 0, -10, 'sc:cat');
        cat.setScale(fitScale('sc:cat', 96));
        const hat = art(scene, 0, -10, c.id).setScale(cat.scale);
        tile.add([cat, hat]);
      } else if (kind === 'rod') {
        const gr = scene.add.graphics();
        const [shaft, handle] = c.colors!;
        gr.lineStyle(12, INK, 1).lineBetween(-34, 30, 34, -50);
        gr.lineStyle(7, shaft, 1).lineBetween(-34, 30, 34, -50);
        gr.lineStyle(8, handle, 1).lineBetween(-34, 30, -16, 9);
        gr.fillStyle(INK, 1).fillCircle(-24, 18, 10).fillStyle(0x5b6178, 1).fillCircle(-24, 18, 7);
        tile.add(gr);
      } else if (kind === 'bait') {
        const b = art(scene, 0, -12, baitKey(c.id));
        b.setScale(fitScale(baitKey(c.id), 70));
        tile.add(b);
      } else {
        const key = c.id === 'bobber:classic' ? 'item:bobber' : `item:${c.id}`;
        const b = art(scene, 0, -12, key);
        b.setScale(fitScale(key, 80));
        tile.add(b);
      }
      const label = txt(scene, 0, 52, '', 20, { color: DARK, stroke: false });
      const coin = art(scene, 0, 52, 'item:coin');
      coin.setScale(fitScale('item:coin', 22));
      tile.add([label, coin]);
      const frame = scene.add.graphics();
      tile.add(frame);
      tiles.push(() => {
        const owned = g.owns(c.id);
        const worn = (s.style[kind] ?? 'bait:worm') === c.id;
        frame.clear();
        if (worn) frame.lineStyle(6, 0x5fd38d, 1).strokeRoundedRect(-tw / 2 + 4, -74, tw - 8, 148, 18);
        coin.setVisible(!owned && !c.source);
        if (worn) label.setText(t('wardrobe.worn')).setColor('#3a9e55');
        else if (owned) label.setText(t('wardrobe.wear')).setColor(DARK);
        else if (c.source) label.setText(c.source === 'daily3' ? t('wardrobe.day3') : t('wardrobe.starsNeed', { n: Math.min(15, g.starsTotal), max: 15 })).setColor('#c2557a');
        else label.setText(fmt(c.price)).setColor(s.coins >= c.price ? DARK : '#c0392b');
        fitText(label, tw - (coin.visible ? 34 : 10));
        if (coin.visible) {
          const w = label.width * label.scaleX;
          coin.setX(-w / 2 - 6);
          label.setX(12);
        } else label.setX(0);
      });
      panel.content.add(tile);
    });
  };
  section('hat', t('wardrobe.hats'), panel.top + 40);
  section('rod', t('wardrobe.rods'), panel.top + 440);
  section('bobber', t('wardrobe.bobbers'), panel.top + 670);
  section('bait', t('wardrobe.baits'), panel.top + 900);
  const refreshAll = () => {
    tiles.forEach((r) => r());
    coinsLine.setText(t('upg.have', { n: fmt(s.coins) }));
  };
  refreshAll();
  return panel;
}

/** Challenge mode: 8 challenges per pond, played in order; best time and reward on each. */
export function challengePanel(scene: Phaser.Scene, ctx: PanelCtx, pondId = ctx.game.s.pond) {
  const g = ctx.game;
  const s = g.s;
  const panel = new CPanel(scene, { title: t('challenge.title'), w: 660, h: 1180, color: COLORS.purple, onClose: () => ctx.refresh() });
  const pw = panel.pw;
  const page = scene.add.container(0, 0);
  panel.content.add(page);
  const tabs = PONDS.map((p, i) =>
    new CButton(scene, (i - (PONDS.length - 1) / 2) * ((pw - 50) / PONDS.length), panel.top + 30, {
      w: (pw - 50) / PONDS.length - 12,
      h: 74,
      label: pondName(p.id),
      fontSize: 26,
      color: COLORS.grey,
      onClick: () => show(p.id),
    }),
  );
  panel.content.add(tabs);
  panel.content.add(txt(scene, 0, panel.bottom - 40, t('challenge.hint'), 22, { color: DIM, stroke: false, weight: '500', wrap: pw - 60 }));
  const show = (id: string) => {
    page.removeAll(true);
    tabs.forEach((b, i) => b.setColor(PONDS[i].id === id ? COLORS.purple : COLORS.grey));
    const list = CHALLENGES.filter((c) => c.pond === id);
    const cw = (pw - 60) / 2 - 10;
    const chh = 196;
    list.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = (col - 0.5) * (cw + 14);
      const y = panel.top + 190 + row * (chh + 14);
      const open = g.challengeUnlocked(c);
      const cleared = s.challenge.cleared.includes(c.id);
      const best = s.challenge.best[c.id];
      const tile = new CButton(scene, x, y, {
        w: cw,
        h: chh,
        color: open ? 0xfffdf6 : CREAM_DARK,
        onClick: () => {
          if (!s.unlocked.includes(c.pond)) return note(scene, t('challenge.pondLocked', { pond: pondName(c.pond) }));
          if (!open) return note(scene, t('challenge.locked', { n: c.n - 1 }));
          panel.close();
          ctx.startChallenge(c.id);
        },
      });
      const head = txt(scene, -cw / 2 + 22, -66, t('challenge.level', { n: c.n }), 30, { color: DARK, stroke: false }).setOrigin(0, 0.5);
      const goal = fitText(txt(scene, -cw / 2 + 22, -24, t('challenge.goal', { fish: c.fish, species: c.species }), 22, { color: DARK, stroke: false, weight: '500' }).setOrigin(0, 0.5), cw - 40);
      const clock = art(scene, -cw / 2 + 36, 8, 'icon:i_clock');
      clock.setScale(fitScale('icon:i_clock', 28));
      const time = txt(scene, -cw / 2 + 58, 8, formatTime(c.timeSec * 1000).replace(/\.0$/, ''), 22, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5);
      const bestT = txt(scene, -cw / 2 + 22, 40, best !== undefined ? t('challenge.best', { t: formatTime(best) }) : '', 22, { color: '#3a9e55', stroke: false }).setOrigin(0, 0.5);
      const coin = art(scene, -cw / 2 + 36, 74, 'item:coin');
      coin.setScale(fitScale('item:coin', 28));
      const reward = txt(scene, -cw / 2 + 58, 74, fmt(cleared ? Math.round(c.reward * 0.1) : c.reward), 22, { color: '#e39b00', stroke: false }).setOrigin(0, 0.5);
      tile.add([head, goal, clock, time, bestT, coin, reward]);
      if (cleared) {
        const ck = art(scene, cw / 2 - 34, -64, 'icon:i_star');
        ck.setScale(fitScale('icon:i_star', 40));
        tile.add(ck);
      }
      if (!open) {
        const lock = art(scene, cw / 2 - 34, -64, 'icon:i_lock');
        lock.setScale(fitScale('icon:i_lock', 40));
        tile.add(lock);
      }
      page.add(tile);
    });
  };
  show(s.unlocked.includes(pondId) ? pondId : 'cozy');
  return panel;
}

void fmt;
