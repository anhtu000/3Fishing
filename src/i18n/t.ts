// Short helpers for translated text. Every string the player sees comes from src/i18n/<lang>.json.
import { app } from '@core';

export const t = (key: string, vars?: Record<string, string | number>) => app.t(key, vars);
export const fishName = (id: string) => t(`fish.${id}`);
export const petName = (id: string) => t(`pet.${id}`);
export const pondName = (id: string) => t(`pond.${id}`);
export const bossName = (id: string) => t(`bossName.${id}`);
export const junkName = (id: string) => t(`junk.${id}`);
export const rarityName = (r: number) => t(`rarity.${r}`);
export const eggName = (r: number) => t(`egg.${r}`);

/** "2m 5s" / "45s" / "3h 10m" with the language's unit letters. */
export function duration(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}${t('unit.h')} ${m}${t('unit.m')}`;
  if (m > 0) return `${m}${t('unit.m')} ${r}${t('unit.s')}`;
  return `${r}${t('unit.s')}`;
}

/** "Lucky: +2% luck" in the current language. */
export function perkText(perk: string, value: number, unit: 'pct' | 'sec' | 'perMin') {
  const v = unit === 'pct' ? `+${Math.round(value)}%` : unit === 'sec' ? `+${value.toFixed(2)}s` : t('perk.perMin', { n: value.toFixed(1) });
  return `${t(`perk.${perk}`)}: ${t(`perk.${perk}What`, { v })}`;
}
