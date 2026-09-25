import { describe, it, expect } from 'vitest';
import { formatPrice, savingsPercent, buildInstallments, priceSummary, buildCrediarioRows } from './price';

const nbsp = (s: string) => s.replace(/ /g, ' ');
const p = { precoAVista: 2999, precoParcelado: 3199.92, parcelasMax: 12 };

describe('formatPrice', () => {
  it('formats BRL', () => expect(nbsp(formatPrice(2999))).toBe('R$ 2.999,00'));
  it('formats cents', () => expect(nbsp(formatPrice(266.66))).toBe('R$ 266,66'));
  it('never doubles the currency symbol', () => {
    for (const v of [0, 0.5, 1, 99.9, 1234.56, 1e6]) expect(formatPrice(v)).not.toContain('R$R$');
  });
});

describe('installments', () => {
  it('computes savings percent', () => expect(savingsPercent(p)).toBe(6));
  it('max row matches product price exactly', () => {
    const rows = buildInstallments(p);
    const last = rows[rows.length - 1];
    expect(last).toEqual({ parcelas: 12, valor: 266.66, total: 3199.92, juros: false });
  });
  it('every row: parcelas × valor === total (to the cent)', () => {
    for (const r of buildInstallments(p)) expect(Math.round(r.parcelas * r.valor * 100)).toBe(Math.round(r.total * 100));
  });
  it('adds interest rows only when jurosMensal is set', () => {
    expect(buildInstallments(p).some((r) => r.juros)).toBe(false);
    const rows = buildInstallments({ ...p, jurosMensal: 0.0199 });
    expect(rows.length).toBe(18);
    expect(rows[12].juros).toBe(true);
    expect(rows[12].total).toBeGreaterThan(p.precoParcelado);
  });
  it('summary uses the max row', () => {
    expect(priceSummary(p)).toEqual({ aVista: 2999, parcelas: 12, valorParcela: 266.66, totalCartao: 3199.92, economia: 6 });
  });
  it('crediario rows are consistent', () => {
    for (const r of buildCrediarioRows({ total: 3399.6, parcelasMax: 10 })) expect(Math.round(r.parcelas * r.valor * 100)).toBe(Math.round(r.total * 100));
  });
});
