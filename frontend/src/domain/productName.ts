import type { Condicao, Product } from './types';

const CONDICAO: Record<Condicao, string> = { novo: 'Novo', usado: 'Usado', lacrado: 'Lacrado' };
export const conditionLabel = (c: Condicao) => CONDICAO[c];

const BRAND_FIXES: [RegExp, string][] = [
  [/\bplaystation\b/gi, 'PlayStation'],
  [/\bxbox series x\s*\|?\s*s\b/gi, 'Xbox Series X|S'],
  [/\bnintendo switch\b/gi, 'Nintendo Switch'],
];
export const fixBrands = (s: string) => BRAND_FIXES.reduce((acc, [re, v]) => acc.replace(re, v), s);

type NameInput = Pick<Product, 'familia' | 'modelo' | 'condicao' | 'tipo'> & Partial<Pick<Product, 'capacidade' | 'edicao'>>;

export function buildProductName(p: NameInput): string {
  const base = [p.familia, p.modelo, p.capacidade, p.edicao].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  const name = fixBrands(base);
  return p.tipo === 'gift-card' ? name : `${name} — ${conditionLabel(p.condicao)}`;
}

// Catches capacity glued to the next word ("1TBControle"). CamelCase is NOT rejected: brands like PlayStation/DualSense use it.
const GLUED = /\d+(TB|GB|MB)(?=[A-Za-zÀ-ú])/;

export function validateProductInput(p: Partial<Product>): string[] {
  const errors: string[] = [];
  const text = [p.familia, p.modelo, p.capacidade, p.edicao].filter(Boolean).join(' ');
  if (!p.familia || !p.modelo) errors.push('Plataforma e modelo são obrigatórios.');
  if (GLUED.test(text)) errors.push('Texto colado sem espaço (ex.: "1TBControle").');
  if (/->|→/.test(text)) errors.push('Não use setas no nome.');
  if (/garantia/i.test(text)) errors.push('Garantia é um campo próprio, não parte do nome.');
  if (p.condicao === 'usado') {
    if (!p.usado?.estado) errors.push('Usado precisa do estado de conservação.');
    if (!p.usado?.acompanha) errors.push('Usado precisa informar o que acompanha.');
  }
  if (p.preco && Math.round(p.preco.precoParcelado * 100) % p.preco.parcelasMax !== 0)
    errors.push('Preço parcelado precisa dividir exatamente pelo número de parcelas.');
  return errors;
}
