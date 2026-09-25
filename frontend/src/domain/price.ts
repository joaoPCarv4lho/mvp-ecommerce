import type { PriceModel } from './types';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatPrice = (value: number): string => brl.format(value);

const cents = (v: number) => Math.round(v * 100);
const fromCents = (c: number) => c / 100;

export interface InstallmentRow { parcelas: number; valor: number; total: number; juros: boolean }

function evenRow(total: number, n: number, juros = false): InstallmentRow {
  const valorC = Math.round(cents(total) / n);
  return { parcelas: n, valor: fromCents(valorC), total: fromCents(valorC * n), juros };
}

export const savingsPercent = (p: PriceModel) => Math.round((1 - p.precoAVista / p.precoParcelado) * 100);

export function buildInstallments(p: PriceModel): InstallmentRow[] {
  const rows = Array.from({ length: p.parcelasMax }, (_, i) => evenRow(p.precoParcelado, i + 1));
  if (p.jurosMensal) {
    const i = p.jurosMensal;
    for (let n = p.parcelasMax + 1; n <= 18; n++) {
      const pmt = (p.precoParcelado * i) / (1 - (1 + i) ** -n);
      const valorC = Math.round(pmt * 100);
      rows.push({ parcelas: n, valor: fromCents(valorC), total: fromCents(valorC * n), juros: true });
    }
  }
  return rows;
}

export const buildCrediarioRows = (c: { total: number; parcelasMax: number }) =>
  Array.from({ length: c.parcelasMax }, (_, i) => evenRow(c.total, i + 1));

export function priceSummary(p: PriceModel) {
  const max = evenRow(p.precoParcelado, p.parcelasMax);
  return { aVista: p.precoAVista, parcelas: max.parcelas, valorParcela: max.valor, totalCartao: max.total, economia: savingsPercent(p) };
}
