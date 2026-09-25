import { it, expect } from 'vitest';
import { MAIN_MENU } from './menu';

it('main menu has at most 7 items and official spelling', () => {
  expect(MAIN_MENU.length).toBeLessThanOrEqual(7);
  expect(MAIN_MENU.map((m) => m.label)).toEqual(['PlayStation', 'Xbox', 'Nintendo', 'Retrô & Clássicos', 'Usados & Seminovos', 'Gift Cards', 'Serviços']);
  expect(MAIN_MENU.find((m) => m.label === 'Usados & Seminovos')!.to).toBe('/produtos?condicao=usado');
});
