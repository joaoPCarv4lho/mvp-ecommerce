import type { Plataforma, Tipo } from '../../domain/types';

export interface MenuItem { label: string; to?: string; plataforma?: Plataforma; children?: { label: string; to: string }[] }

export const MAIN_MENU: MenuItem[] = [
  { label: 'PlayStation', to: '/playstation', plataforma: 'playstation' },
  { label: 'Xbox', to: '/xbox', plataforma: 'xbox' },
  { label: 'Nintendo', to: '/nintendo', plataforma: 'nintendo' },
  { label: 'Retrô & Clássicos', to: '/retro', plataforma: 'retro' },
  { label: 'Usados & Seminovos', to: '/produtos?condicao=usado' },
  { label: 'Gift Cards', to: '/gift-cards' },
  {
    label: 'Serviços',
    children: [
      { label: 'Assistência Técnica', to: '/assistencia-tecnica' },
      { label: 'Troque seu Game', to: '/troque-seu-game' },
    ],
  },
];

export const SUBCATEGORIES: { label: string; slug: string; tipo: Tipo }[] = [
  { label: 'Consoles', slug: 'consoles', tipo: 'console' },
  { label: 'Jogos', slug: 'jogos', tipo: 'jogo' },
  { label: 'Controles e Acessórios', slug: 'controles-e-acessorios', tipo: 'acessorio' },
  { label: 'Headsets', slug: 'headsets', tipo: 'headset' },
];

/** Platforms that have their own listing route (/:plataforma). */
export const PLATAFORMAS: Plataforma[] = ['playstation', 'xbox', 'nintendo', 'retro'];
