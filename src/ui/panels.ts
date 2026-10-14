// Menus: upgrades, pets, Fishdex, map, quests, incubator. All share the cream CPanel look.
import Phaser from 'phaser';
import { app } from '@core';
import { HATCH_SEC, PERKS, PONDS, QUEST_POOL, RARITY_COLOR, RARITY_CSS, STREAK, UPGRADES, UPGRADE_IDS, petById, type PetDef, type UpgradeId } from '../content/data';
import type { PondGame } from '../logic/game';
import { dexCount, perkValue, upgradeCost, xpForLevel } from '../logic/rules';
import { dailyStatus } from '../../core/time';
import { CButton, COLORS, CPanel, CREAM_DARK, INK, art, card, drawBar, fitScale, fitText, fmt, txt } from './kit';
import { bossName, duration, eggName, fishName, perkText, petName, pondName, rarityName, t } from '../i18n/t';
import { flyIcons, note } from './popups';

export interface PanelCtx {
  game: PondGame;
  /** HUD and pond need to redraw (team, dex, currencies changed). */
  refresh(): void;
  travel(pondId: string): void;
  startBoss(): void;
  hatch(i: number): void;
  coinTo(): { x: number; y: number };
  gemTo(): { x: number; y: number };
  /** A panel closed at a natural break: a midgame ad may show here. */
  breakPoint(): void;
}

const DARK = '#3b2a4d';
const DIM = '#7a6a8a';

function upgradeValue(id: UpgradeId, lv: number) {
  switch (id) {
    case 'rod':
      return `+${lv * 8}%`;
    case 'line':
      return `${(1 + 0.1 * lv).toFixed(1)}s`;
    case 'bait':
      return `+${lv}%`;
    case 'float':
      return `${(0.6 + 0.02 * lv).toFixed(2)}s`;
  }
}
function upgradeEffect(id: UpgradeId, lv: number, max: boolean) {
  return `${t(`upg.${id}What`)} ${upgradeValue(id, lv)}${max ? '' : ` » ${upgradeValue(id, lv + 1)}`}`;
}

export function upgradesPanel(scene: Phaser.Scene, ctx: PanelCtx) {
  const g = ctx.game;
  const panel = new CPanel(scene, { title: t('upg.title'), w: 640, h: 760, color: COLORS.orange, onClose: () => ctx.refresh() });
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
  const coinsLine = txt(scene, 0, panel.bottom - 60, '', 30, { color: DARK, stroke: false });
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
  const panel = new CPanel(scene, { title: t('pets.title'), w: 660, h: 1180, color: COLORS.pink, onClose: () => ctx.refresh() });
  let selected = s.team[0] ?? Object.keys(s.pets)[0] ?? null;
  const tiles: { id: string; refresh: () => void }[] = [];
  const pw = panel.pw;
  const tw = Math.min(112, (pw - 70) / 5 - 8);
  const teamLine = txt(scene, 0, panel.top + 30, '', 30, { color: DARK, stroke: false });
  panel.content.add(teamLine);
  PONDS.forEach((pond, row) => {
    const y0 = panel.top + 80 + row * 190;
    const label = txt(scene, -pw / 2 + 40, y0 - 8, pondName(pond.id), 24, { color: DIM, stroke: false }).setOrigin(0, 0.5);
    panel.content.add(label);
    pond.pets.forEach((p, i) => {
      const x = (i - 2) * (tw + 10);
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
  const dy = panel.top + 80 + PONDS.length * 190 + 70;
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
      fitText(drar.setText(t('pets.rarityLevel', { rarity: rarityName(p.rarity).toLocaleUpperCase(), n: st.level })).setColor(RARITY_CSS[p.rarity]), pw - 290);
      fitText(dperk.setText(perkLine(p, st.level)), pw - 290);
      const need = xpForLevel(st.level);
      drawBar(xpG, 180, 18, st.level >= 5 ? 1 : st.xp / need, COLORS.pink);
      xpT.setText(st.level >= 5 ? t('upg.max') : t('pets.xp', { n: st.xp, max: need }));
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
    h: 1000,
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
    const cw = (pw - 70) / 2 - 8;
    const chh = 160;
    pond.fish.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = (col - 0.5) * (cw + 14);
      const y = panel.top + 220 + row * (chh + 14);
      const entry = s.dex[f.id];
      const bg = card(scene, x, y, cw, chh, 0xfffdf6, 22);
      const frame = scene.add.graphics().lineStyle(5, RARITY_COLOR[f.rarity], 1).strokeRoundedRect(x - cw / 2 + 8, y - chh / 2 + 6, cw - 16, chh - 22, 16);
      const img = art(scene, x - cw / 2 + 70, y - 6, `fish:${f.id}`);
      img.setScale(fitScale(`fish:${f.id}`, 118));
      const tx = x - cw / 2 + 136;
      const tw = cw - 146;
      const name = txt(scene, tx, y - 42, entry ? fishName(f.id) : t('dex.unknown'), 24, { color: DARK, stroke: false }).setOrigin(0, 0.5);
      if (name.width > tw) name.setScale(tw / name.width);
      const rar = txt(scene, tx, y - 10, rarityName(f.rarity), 20, { color: RARITY_CSS[f.rarity], stroke: false }).setOrigin(0, 0.5);
      const rec = txt(scene, tx, y + 20, entry ? t('dex.best', { n: entry.best.toFixed(1) }) : '', 19, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5);
      const cnt = txt(scene, tx, y + 44, entry ? t('dex.caught', { n: entry.n }) : '', 19, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5);
      page.add(cnt);
      if (!entry) img.setTint(0x3b2a4d).setTintMode(Phaser.TintModes.FILL).setAlpha(0.35);
      page.add([bg, frame, img, name, rar, rec]);
    });
    if (!beaten && n >= pond.bossAt && pond.id === s.pond) {
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
      const info = fitText(txt(scene, mx + 250, y - 18, t('map.info', { m: p.priceMult, n: dexCount(s, p) }), 22, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5), pw - 330);
      items.push(name, info);
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
    const btn = new CButton(scene, pw / 2 - 110, y, {
      w: 170,
      h: 84,
      icon: 'item:coin',
      iconSize: 38,
      label: fmt(def.coins * g.pond.priceMult),
      fontSize: 30,
      color: COLORS.green,
      onClick: () => {
        if (q.claimed || q.progress < def.goal) return;
        q.claimed = true;
        g.earn(def.coins * g.pond.priceMult);
        app.audio.play('reward');
        flyIcons(scene, 'item:coin', panel.toScene(btn.x, y), ctx.coinTo(), 6);
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
    const key = r.egg >= 0 ? `egg:${r.egg}` : 'item:coin';
    const icon = art(scene, x, y - 4, key);
    icon.setScale(fitScale(key, 70));
    const label = txt(scene, x, y + 58, r.egg >= 0 ? eggName(r.egg) : `${r.coins}`, 20, { color: DARK, stroke: false });
    if (label.width > tw - 10) label.setScale((tw - 10) / label.width);
    const items: Phaser.GameObjects.GameObject[] = [bg, d, icon, label];
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
  const panel = new CPanel(scene, { title: t('incubator.title'), w: 600, h: 860, color: COLORS.purple, onClose: () => ctx.refresh() });
  if (egg) {
    const img = art(scene, 0, panel.top + 120, `egg:${egg.tier}`, 1.0);
    scene.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const name = txt(scene, 0, panel.top + 240, eggName(egg.tier).toLocaleUpperCase(), 36, { color: RARITY_CSS[egg.tier] === '#7d8b99' ? DARK : RARITY_CSS[egg.tier], stroke: false });
    const left = txt(scene, 0, panel.top + 286, '', 28, { color: DIM, stroke: false });
    const bar = scene.add.graphics().setPosition(0, panel.top + 330);
    const tip = txt(scene, 0, panel.top + 374, t('incubator.tip'), 24, { color: DIM, stroke: false, weight: '500' });
    panel.content.add([img, name, left, bar, tip]);
    const tick = () => {
      const e = s.eggs[index];
      if (!e) return;
      const sec = Math.ceil(e.left);
      left.setText(sec > 0 ? t('incubator.hatchesIn', { t: duration(sec) }) : t('incubator.ready'));
      drawBar(bar, 380, 26, 1 - e.left / HATCH_SEC[e.tier], COLORS.purple);
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
          panel.close();
          ctx.refresh();
        } else note(scene, t('msg.noCoins'));
      },
    });
    panel.content.add(b);
  }
  return panel;
}

void fmt;
