import type { Campaign, Product } from './types';
import { toISODate } from './dates';

export const isPreOrderActive = (p: Product, hoje: Date) => !!p.dataLancamento && p.dataLancamento.slice(0, 10) > toISODate(hoje);

export function isCampaignActive(c: Campaign, hoje: Date) {
  const t = toISODate(hoje);
  return c.inicio.slice(0, 10) <= t && t <= c.fim.slice(0, 10);
}
