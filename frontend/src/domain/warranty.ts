import type { Product } from './types';
import { addDays, formatMonthYear, toISODate } from './dates';
import { storeConfig } from '../config/storeConfig';

export type WarrantyStatus = { kind: 'ativa' | 'vencendo' | 'loja-padrao' | 'nenhuma'; label?: string; ate?: string };

const daysBetween = (fromISO: string, toISO: string) =>
  Math.round((Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / 86_400_000);

export function getWarrantyStatus(p: Product, hoje: Date, compraEm: Date = hoje): WarrantyStatus {
  if (!p.garantiaTipo) return { kind: 'nenhuma' };
  const today = toISODate(hoje);
  const ate = p.garantiaAte ?? (p.garantiaMeses ? addMonths(today, p.garantiaMeses) : undefined);
  if (!ate) return { kind: 'nenhuma' };
  const left = daysBetween(today, ate);
  if (left >= 0) {
    const label = p.garantiaAte ? `Garantia até ${formatMonthYear(ate)}` : `Garantia de ${p.garantiaMeses} meses`;
    return left <= 30 ? { kind: 'vencendo', label: `Garantia até ${formatMonthYear(ate)} — vence em ${left} dia${left === 1 ? '' : 's'}`, ate } : { kind: 'ativa', label, ate };
  }
  if (p.condicao === 'usado' && p.garantiaTipo === 'loja') {
    const dias = storeConfig.garantiaPadraoLojaDias;
    return { kind: 'loja-padrao', label: `Garantia da loja de ${dias} dias`, ate: addDays(toISODate(compraEm), dias) };
  }
  return { kind: 'nenhuma' };
}

function addMonths(iso: string, months: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return toISODate(d);
}
