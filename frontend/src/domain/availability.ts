import type { Product } from './types';

export type Availability = { kind: 'estoque' | 'revisao' | 'esgotado'; label: string; motivo: string };

export function getAvailability(p: Pick<Product, 'estoque' | 'emRevisao'>): Availability {
  if (p.estoque <= 0) return { kind: 'esgotado', label: 'Esgotado — avise-me', motivo: 'Sem unidades no momento.' };
  if (p.emRevisao) return { kind: 'revisao', label: 'Disponível em 2 a 3 dias úteis (em revisão técnica)', motivo: 'A unidade está passando pela revisão da nossa assistência antes da venda.' };
  return { kind: 'estoque', label: 'Em estoque — retire hoje', motivo: 'Unidade disponível na loja em Joinville.' };
}
