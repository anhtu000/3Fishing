// Menus: upgrades, pets, Fishdex, map, quests, incubator. All share the cream CPanel look.
import Phaser from 'phaser';
import { app } from '@core';
import { HATCH_SEC, PERKS, PONDS, QUEST_POOL, RARITIES, RARITY_COLOR, RARITY_CSS, STREAK, UPGRADES, UPGRADE_IDS, petById, type PetDef, type UpgradeId } from '../content/data';
import type { PondGame } from '../logic/game';
import { dexCount, perkValue, upgradeCost, xpForLevel } from '../logic/rules';
import { dailyStatus } from '../../core/time';
import { CButton, COLORS, CPanel, CREAM_DARK, INK, art, card, drawBar, fitScale, fmt, txt } from './kit';
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
const UPGRADE_WHAT: Record<UpgradeId, string> = { rod: 'Reel power', line: 'Time in red', bait: 'Luck', float: 'Bite time' };
function upgradeEffect(id: UpgradeId, lv: number, max: boolean) {
  return `${UPGRADE_WHAT[id]} ${upgradeValue(id, lv)}${max ? '' : ` » ${upgradeValue(id, lv + 1)}`}`;
}

export function upgradesPanel(scene: Phaser.Scene, ctx: PanelCtx) {
  const g = ctx.game;
  const panel = new CPanel(scene, { title: 'Upgrades', w: 640, h: 760, color: COLORS.orange, onClose: () => ctx.refresh() });
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
          note(scene, 'Not enough coins yet. Keep fishing!');
        }
      },
    });
    const refresh = () => {
      const lv = g.s.upgrades[id];
      const max = lv >= UPGRADES[id].max;
      name.setText(`${UPGRADES[id].name}  Lv ${lv}`);
      eff.setText(upgradeEffect(id, lv, max));
      if (max) {
        buy.setLabel('MAX').setEnabled(false);
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
    coinsLine.setText(`You have ${fmt(g.s.coins)} coins`);
    ctx.refresh();
  };
  refreshAll();
  return panel;
}

function perkLine(p: PetDef, level: number) {
  const perk = PERKS[p.perk];
  const v = perkValue(p.perk, p.rarity, level);
  const val = perk.unit === 'pct' ? `+${Math.round(v)}%` : perk.unit === 'sec' ? `+${v.toFixed(2)}s` : `${v.toFixed(1)}/min`;
  const what: Record<string, string> = { luck: 'luck', merchant: 'fish price', strong: 'reel power', sharp: 'bite time', angler: 'fish caught for you', nurture: 'hatch speed' };
  return `${perk.name}: ${val} ${what[p.perk]}`;
}

export function petsPanel(scene: Phaser.Scene, ctx: PanelCtx) {
  const g = ctx.game;
  const s = g.s;
  const panel = new CPanel(scene, { title: 'Pets', w: 660, h: 1000, color: COLORS.pink, onClose: () => ctx.refresh() });
  let selected = s.team[0] ?? Object.keys(s.pets)[0] ?? null;
  const tiles: { id: string; refresh: () => void }[] = [];
  const pw = panel.pw;
  const tw = Math.min(112, (pw - 70) / 5 - 8);
  const teamLine = txt(scene, 0, panel.top + 30, '', 30, { color: DARK, stroke: false });
  panel.content.add(teamLine);
  PONDS.forEach((pond, row) => {
    const y0 = panel.top + 90 + row * 200;
    const label = txt(scene, -pw / 2 + 40, y0, pond.name, 26, { color: DIM, stroke: false }).setOrigin(0, 0.5);
    panel.content.add(label);
    pond.pets.forEach((p, i) => {
      const x = (i - 2) * (tw + 10);
      const y = y0 + 90;
      const bg = card(scene, x, y, tw, 140, 0xfffdf6, 20);
      const img = art(scene, x, y - 12, `pet:${p.id}`);
      img.setScale(fitScale(`pet:${p.id}`, tw - 14));
      const lv = txt(scene, x, y + 46, '', 22, { color: DARK, stroke: false });
      const team = txt(scene, x, y - 70, 'TEAM', 20, { color: '#ffffff' });
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
          lv.setText(`Lv ${st.level}`);
        } else {
          img.setTint(0x3b2a4d).setTintMode(Phaser.TintModes.FILL).setAlpha(0.3);
          lv.setText('???');
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
  const dy = panel.top + 520;
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
      if (!g.toggleTeam(selected)) note(scene, 'Team is full. Remove a pet first.');
      refreshAll();
    },
  });
  const empty = txt(scene, 0, dy + 70, 'Catch eggs and hatch them\nto find pet friends!', 30, { color: DIM, stroke: false });
  panel.content.add([dbg, dimg, dname, drar, dperk, xpG, xpT, toggle, empty]);
  const slotBtn = new CButton(scene, 0, panel.bottom - 70, {
    w: 360,
    h: 84,
    icon: 'item:gem',
    iconSize: 40,
    label: '',
    fontSize: 28,
    color: COLORS.blue,
    onClick: () => {
      if (g.buyTeamSlot()) {
        app.audio.play('buy');
        refreshAll();
      } else note(scene, 'Not enough gems. Gems come from chests, quests and bosses.');
    },
  });
  panel.content.add(slotBtn);
  const refreshAll = () => {
    teamLine.setText(`Team ${s.team.length}/${s.teamSlots}  ·  pets help every cast`);
    tiles.forEach((t) => t.refresh());
    const p = selected ? petById.get(selected) : null;
    const st = selected ? s.pets[selected] : null;
    const has = !!(p && st);
    for (const o of [dimg, dname, drar, dperk, xpG, xpT, toggle]) o.setVisible(has);
    empty.setVisible(!has);
    if (p && st) {
      dimg.setTexture(`pet:${p.id}`).setScale(fitScale(`pet:${p.id}`, 170));
      dname.setText(`${p.name}${st.shiny ? ' (shiny)' : ''}`);
      drar.setText(`${RARITIES[p.rarity].toUpperCase()}  ·  Level ${st.level}/5`).setColor(RARITY_CSS[p.rarity]);
      dperk.setText(perkLine(p, st.level));
      const need = xpForLevel(st.level);
      drawBar(xpG, 180, 18, st.level >= 5 ? 1 : st.xp / need, COLORS.pink);
      xpT.setText(st.level >= 5 ? 'MAX' : `XP ${st.xp}/${need}`);
      const inTeam = s.team.includes(p.id);
      toggle.setLabel(inTeam ? 'Rest' : 'Join team').setColor(inTeam ? COLORS.grey : COLORS.green);
    }
    const cost = g.teamSlotCost();
    slotBtn.setVisible(Number.isFinite(cost));
    slotBtn.setLabel(`+1 team slot  ${cost}`);
    ctx.refresh();
  };
  refreshAll();
  return panel;
}

export function dexPanel(scene: Phaser.Scene, ctx: PanelCtx, pondId = ctx.game.s.pond) {
  const g = ctx.game;
  const s = g.s;
  const panel = new CPanel(scene, {
    title: 'Fishdex',
    w: 660,
    h: 1000,
    color: COLORS.blue,
    onClose: () => {
      ctx.refresh();
      ctx.breakPoint();
    },
  });
  const pw = panel.pw;
  const page = scene.add.container(0, 0);
  panel.content.add(page);
  const tabs = PONDS.map((p, i) =>
    new CButton(scene, (i - 0.5) * 290, panel.top + 30, {
      w: 270,
      h: 74,
      label: p.name,
      fontSize: 28,
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
    const head = txt(scene, 0, panel.top + 110, `${n}/${pond.fish.length} found  ·  ${beaten ? `${pond.boss.name} beaten!` : n >= pond.bossAt ? `${pond.boss.name} is waiting!` : `Boss appears at ${pond.bossAt}`}`, 26, { color: DARK, stroke: false });
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
      const name = txt(scene, tx, y - 42, entry ? f.name : '???', 24, { color: DARK, stroke: false }).setOrigin(0, 0.5);
      if (name.width > tw) name.setScale(tw / name.width);
      const rar = txt(scene, tx, y - 10, RARITIES[f.rarity], 20, { color: RARITY_CSS[f.rarity], stroke: false }).setOrigin(0, 0.5);
      const rec = txt(scene, tx, y + 20, entry ? `Best ${entry.best.toFixed(1)} cm` : '', 19, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5);
      const cnt = txt(scene, tx, y + 44, entry ? `Caught x${entry.n}` : '', 19, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5);
      page.add(cnt);
      if (!entry) img.setTint(0x3b2a4d).setTintMode(Phaser.TintModes.FILL).setAlpha(0.35);
      page.add([bg, frame, img, name, rar, rec]);
    });
    if (!beaten && n >= pond.bossAt && pond.id === s.pond) {
      const b = new CButton(scene, 0, panel.bottom - 70, {
        w: 340,
        h: 90,
        icon: 'icon:i_crown',
        label: 'Fight boss!',
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
  const panel = new CPanel(scene, { title: 'Map', w: 640, h: 940, color: COLORS.green, onClose: () => ctx.refresh() });
  const pw = panel.pw;
  const list = [...PONDS.map((p) => ({ pond: p, soon: false })), { pond: null, soon: true }];
  list.forEach((entry, i) => {
    const y = panel.top + 120 + i * 250;
    const bg = card(scene, 0, y, pw - 60, 230, 0xfffdf6, 26);
    const items: Phaser.GameObjects.GameObject[] = [bg];
    if (entry.pond) {
      const p = entry.pond;
      const pal = { cozy: [0x7fd0f2, 0x5fcbe0, 0x1d5f93], misty: [0xb9a8ec, 0x7ac2d0, 0x253f6e] }[p.id] ?? [0x7fd0f2, 0x5fcbe0, 0x1d5f93];
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
      const name = txt(scene, mx + 250, y - 60, p.name, 34, { color: DARK, stroke: false }).setOrigin(0, 0.5);
      const info = txt(scene, mx + 250, y - 18, `Fish price x${p.priceMult}  ·  ${dexCount(s, p)}/8 fish`, 22, { color: DIM, stroke: false, weight: '500' }).setOrigin(0, 0.5);
      items.push(name, info);
      const here = s.pond === p.id;
      const unlocked = s.unlocked.includes(p.id);
      const canUnlock = g.canUnlock(p);
      const prev = PONDS[PONDS.indexOf(p) - 1];
      const bx = mx + 250 + 130;
      let btn: CButton;
      if (here) btn = new CButton(scene, bx, y + 50, { w: 240, h: 80, label: 'You are here', fontSize: 26, color: COLORS.grey, onClick: () => {} }).setEnabled(false);
      else if (unlocked) btn = new CButton(scene, bx, y + 50, { w: 240, h: 80, label: 'Go fish here', fontSize: 28, color: COLORS.green, onClick: () => (panel.close(), ctx.travel(p.id)) });
      else if (canUnlock)
        btn = new CButton(scene, bx, y + 50, {
          w: 240,
          h: 80,
          icon: 'item:coin',
          iconSize: 38,
          label: `Unlock ${fmt(p.unlockCost)}`,
          fontSize: 26,
          color: s.coins >= p.unlockCost ? COLORS.orange : COLORS.grey,
          onClick: () => {
            if (g.unlockPond(p)) {
              app.audio.play('unlock');
              panel.close();
              ctx.travel(p.id);
            } else note(scene, `You need ${fmt(p.unlockCost)} coins. Keep fishing!`);
          },
        });
      else btn = new CButton(scene, bx, y + 50, { w: 240, h: 80, icon: 'icon:i_lock', iconSize: 40, label: `Beat ${prev?.boss.name ?? ''}`, fontSize: 22, color: COLORS.grey, onClick: () => note(scene, `Catch ${prev?.bossAt} kinds of fish in ${prev?.name}, then beat ${prev?.boss.name}.`) });
      if (canUnlock && !unlocked && s.coins >= p.unlockCost) btn.setGlow(true);
      items.push(btn);
    } else {
      const name = txt(scene, 0, y - 20, 'Coral Cove', 34, { color: DIM, stroke: false });
      const info = txt(scene, 0, y + 26, 'Coming soon: tropical fish and a crabby boss!', 22, { color: DIM, stroke: false, weight: '500' });
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
  const panel = new CPanel(scene, { title: 'Daily quests', w: 640, h: 820, color: COLORS.yellow, onClose: () => ctx.refresh() });
  const pw = panel.pw;
  const rows: (() => void)[] = [];
  s.quests.list.forEach((q, i) => {
    const def = QUEST_POOL.find((d) => d.id === q.id)!;
    const y = panel.top + 80 + i * 160;
    const bg = card(scene, 0, y, pw - 60, 140, 0xfffdf6, 24);
    const t = txt(scene, -pw / 2 + 60, y - 30, def.text.replace('{n}', String(def.goal)), 28, { color: DARK, stroke: false }).setOrigin(0, 0.5);
    const bar = scene.add.graphics().setPosition(-pw / 2 + 60 + 140, y + 20);
    const pt = txt(scene, -pw / 2 + 60 + 300, y + 20, '', 22, { color: DIM, stroke: false }).setOrigin(0, 0.5);
    const btn = new CButton(scene, pw / 2 - 110, y, {
      w: 170,
      h: 84,
      icon: 'item:gem',
      iconSize: 38,
      label: `${def.gems}`,
      fontSize: 32,
      color: COLORS.green,
      onClick: () => {
        if (q.claimed || q.progress < def.goal) return;
        q.claimed = true;
        s.gems += def.gems;
        app.audio.play('reward');
        flyIcons(scene, 'item:gem', panel.toScene(btn.x, y), ctx.gemTo(), Math.min(6, def.gems));
        refresh();
        ctx.refresh();
      },
    });
    const refresh = () => {
      drawBar(bar, 280, 22, q.progress / def.goal, COLORS.yellow);
      pt.setText(`${fmt(q.progress)}/${fmt(def.goal)}`);
      const ready = !q.claimed && q.progress >= def.goal;
      btn.setEnabled(ready).setGlow(ready).setColor(q.claimed ? COLORS.grey : COLORS.green);
      if (q.claimed) btn.setLabel('Done');
    };
    rows.push(refresh);
    panel.content.add([bg, t, bar, pt, btn]);
  });
  const st = dailyStatus(s.daily);
  const day = ((st.streak - 1) % 7) + 1;
  const dailyBtn = new CButton(scene, 0, panel.bottom - 80, {
    w: 420,
    h: 90,
    icon: 'icon:i_gift',
    iconSize: 50,
    label: st.canClaim ? `Daily gift: day ${day}` : 'Daily gift claimed',
    fontSize: 30,
    color: st.canClaim ? COLORS.pink : COLORS.grey,
    onClick: () => {
      if (!st.canClaim) return note(scene, 'Come back tomorrow for the next gift!');
      panel.close();
      onDaily();
    },
  });
  if (st.canClaim) dailyBtn.setGlow(true);
  const sub = txt(scene, 0, panel.bottom - 160, 'New quests every day at midnight', 24, { color: DIM, stroke: false, weight: '500' });
  panel.content.add([dailyBtn, sub]);
  rows.forEach((r) => r());
  return panel;
}

/** 7-day streak gift. */
export function dailyPanel(scene: Phaser.Scene, ctx: PanelCtx, claim: (dayIndex: number) => void) {
  const s = ctx.game.s;
  const st = dailyStatus(s.daily);
  const today = (st.streak - 1) % 7;
  const panel = new CPanel(scene, { title: 'Daily gift', w: 660, h: 640, color: COLORS.pink, onClose: () => ctx.refresh() });
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
    const d = txt(scene, x, y - 66, `Day ${i + 1}`, 24, { color: DARK, stroke: false });
    const key = r.egg >= 0 ? `egg:${r.egg}` : r.gems > 0 ? 'item:gem' : 'item:coin';
    const icon = art(scene, x, y - 4, key);
    icon.setScale(fitScale(key, 70));
    const label = txt(scene, x, y + 58, r.egg >= 0 ? `${RARITIES[r.egg]} egg` : r.gems > 0 && r.coins > 0 ? `${r.coins} + ${r.gems}` : `${r.gems || r.coins}`, 20, { color: DARK, stroke: false });
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
    label: st.canClaim ? 'Claim!' : 'Come back tomorrow',
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
  const panel = new CPanel(scene, { title: 'Incubator', w: 600, h: 760, color: COLORS.purple, onClose: () => ctx.refresh() });
  if (egg) {
    const img = art(scene, 0, panel.top + 120, `egg:${egg.tier}`, 1.0);
    scene.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const name = txt(scene, 0, panel.top + 240, `${RARITIES[egg.tier].toUpperCase()} EGG`, 36, { color: RARITY_CSS[egg.tier] === '#7d8b99' ? DARK : RARITY_CSS[egg.tier], stroke: false });
    const left = txt(scene, 0, panel.top + 286, '', 28, { color: DIM, stroke: false });
    const bar = scene.add.graphics().setPosition(0, panel.top + 330);
    const tip = txt(scene, 0, panel.top + 374, 'Every fish you catch: -5 seconds', 24, { color: DIM, stroke: false, weight: '500' });
    panel.content.add([img, name, left, bar, tip]);
    const tick = () => {
      const e = s.eggs[index];
      if (!e) return;
      const sec = Math.ceil(e.left);
      left.setText(sec > 0 ? `Hatches in ${sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`}` : 'Ready!');
      drawBar(bar, 380, 26, 1 - e.left / HATCH_SEC[e.tier], COLORS.purple);
    };
    tick();
    const timer = scene.time.addEvent({ delay: 250, loop: true, callback: tick });
    panel.once(Phaser.GameObjects.Events.DESTROY, () => timer.remove());
    if (app.ads.rewardedAvailable && !app.clean) {
      const ad = new CButton(scene, 0, panel.bottom - 200, {
        w: 380,
        h: 96,
        label: 'Hatch now',
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
      icon: 'item:gem',
      iconSize: 38,
      label: `+1 egg slot  ${cost}`,
      fontSize: 28,
      color: COLORS.blue,
      onClick: () => {
        if (g.buyIncubatorSlot()) {
          app.audio.play('buy');
          panel.close();
          ctx.refresh();
        } else note(scene, 'Not enough gems. Gems come from chests, quests and bosses.');
      },
    });
    panel.content.add(b);
  }
  return panel;
}

void fmt;
