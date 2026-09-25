import { describe, it, expect } from 'vitest';
import { whatsappLink, productWhatsappText, pageWhatsappText } from './whatsapp';

describe('whatsapp', () => {
  it('builds wa.me link with encoded text', () =>
    expect(whatsappLink('Olá! PS5 & cia')).toBe('https://wa.me/5547999990000?text=Ol%C3%A1!%20PS5%20%26%20cia'));
  it('product message contains name and url', () =>
    expect(productWhatsappText('PlayStation 5 Slim — Usado', 'https://www.mateusgames.com.br/produto/x')).toBe('Olá! Tenho interesse em: PlayStation 5 Slim — Usado — https://www.mateusgames.com.br/produto/x'));
  it('page message mentions the page', () => expect(pageWhatsappText('Assistência Técnica')).toBe('Olá! Estou na página Assistência Técnica da Mateus Games e gostaria de ajuda.'));
});
