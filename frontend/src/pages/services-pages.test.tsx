import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Repair from './Repair';
import TradeIn from './TradeIn';
import GiftCards from './GiftCards';
import About from './About';
import Contact from './Contact';
import Policy from './Policy';
import { useCart } from '../store/cart';

const at = (path: string, el: JSX.Element, pattern = path.split('?')[0]) =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={el} /></Routes></MemoryRouter>);

beforeEach(() => useCart.getState().clear());

describe('Repair', () => {
  it('lists 6 services and builds WhatsApp quote with form data', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    at('/assistencia-tecnica', <Repair />);
    expect(await screen.findAllByText(/A partir de/)).toHaveLength(6);
    await userEvent.selectOptions(screen.getByLabelText('Console'), 'PlayStation 5');
    await userEvent.selectOptions(screen.getByLabelText('Problema'), screen.getAllByRole('option', { name: /HDMI/ })[0]);
    await userEvent.type(screen.getByLabelText(/Como aconteceu\?/), 'Cabo puxado');
    await userEvent.click(screen.getByRole('button', { name: 'Pedir orçamento no WhatsApp' }));
    const url = decodeURIComponent(open.mock.calls[0][0] as string);
    expect(url).toContain('Console: PlayStation 5');
    expect(url).toContain('Como aconteceu: Cabo puxado');
    expect(screen.getByText(/Pedido de orçamento enviado/)).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    open.mockRestore();
  });

  it('requires console and problem before sending', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    at('/assistencia-tecnica', <Repair />);
    await screen.findAllByText(/A partir de/);
    await userEvent.click(screen.getByRole('button', { name: 'Pedir orçamento no WhatsApp' }));
    expect(screen.getByLabelText('Console')).toHaveAttribute('aria-invalid', 'true');
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});

describe('TradeIn', () => {
  it('completes 3 steps and shows summary with WhatsApp CTA', async () => {
    at('/troque-seu-game', <TradeIn />);
    const u = userEvent.setup();
    const plat = await screen.findByLabelText('Plataforma');
    await u.selectOptions(plat, 'PlayStation 4');
    await u.click(screen.getByLabelText(/Console/));
    const modelo = screen.getByLabelText('Modelo ou título');
    await u.selectOptions(modelo, within(modelo).getAllByRole('option')[1]); // option 0 is the "Selecione" placeholder
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByLabelText(/Muito bom/));
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByLabelText(/Crédito na loja/));
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    const cta = screen.getByRole('link', { name: 'Enviar para o WhatsApp' });
    expect(decodeURIComponent(cta.getAttribute('href')!)).toContain('Quero: Crédito na loja');
    expect(screen.getByRole('table', { name: /Itens aceitos e não aceitos/ })).toBeInTheDocument();
  });

  it('blocks the first step until the item is chosen', async () => {
    at('/troque-seu-game', <TradeIn />);
    const u = userEvent.setup();
    await screen.findByLabelText('Plataforma');
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('Plataforma')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByLabelText(/Muito bom/)).toBeNull();
  });

  it('generates a protocol and carries it into the WhatsApp message', async () => {
    at('/troque-seu-game', <TradeIn />);
    const u = userEvent.setup();
    await u.selectOptions(await screen.findByLabelText('Plataforma'), 'PlayStation 4');
    await u.click(screen.getByLabelText(/Console/));
    const modelo = screen.getByLabelText('Modelo ou título');
    await u.selectOptions(modelo, within(modelo).getAllByRole('option')[1]);
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByLabelText(/Muito bom/));
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByLabelText(/Dinheiro/));
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByRole('button', { name: 'Gerar protocolo' }));
    const protocolo = await screen.findByText(/Protocolo TR-\d{8}-[0-9A-F]{4}/);
    const code = protocolo.textContent!.replace('Protocolo ', '');
    const cta = screen.getByRole('link', { name: 'Enviar para o WhatsApp' });
    expect(decodeURIComponent(cta.getAttribute('href')!)).toContain(`Protocolo: ${code}`);
  });
});

describe('GiftCards', () => {
  it('filters by platform and states Brazil region', async () => {
    at('/gift-cards?plataforma=steam', <GiftCards />);
    expect(await screen.findAllByRole('article')).toHaveLength(1);
    expect(screen.getAllByText('Válido para contas Brasil').length).toBeGreaterThan(0);
  });

  it('adds the chosen value to the cart', async () => {
    at('/gift-cards', <GiftCards />);
    const u = userEvent.setup();
    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(6);
    const card = cards[0];
    await u.click(within(card).getByRole('button', { name: /^R\$\s200,00$/ }));
    await u.click(within(card).getByRole('button', { name: /Adicionar ao carrinho/ }));
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].valorGiftCard).toBe(200);
    expect(screen.getByRole('link', { name: 'Ir para o carrinho' })).toHaveAttribute('href', '/carrinho');
  });
});

describe('Institutional pages', () => {
  it('About uses "Desde 2012" and never "há X anos"', () => {
    at('/sobre', <About />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sobre a Mateus Games' })).toBeInTheDocument();
    expect(screen.getAllByText(/Desde 2012/).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/há \d+ anos|anos de mercado/);
  });

  it('Contact links phone, WhatsApp, e-mail and Instagram', () => {
    at('/contato', <Contact />);
    expect(screen.getByRole('link', { name: /Conversar no WhatsApp/ })).toHaveAttribute('href', expect.stringContaining('wa.me'));
    expect(screen.getByRole('link', { name: /3422-0000/ })).toHaveAttribute('href', 'tel:+554734220000');
    expect(screen.getByRole('link', { name: /contato@mateusgames.com.br/ })).toHaveAttribute('href', 'mailto:contato@mateusgames.com.br');
    expect(screen.getByRole('link', { name: /Instagram/ })).toHaveAttribute('href', expect.stringContaining('instagram.com'));
  });

  it('Policy renders each known policy and 404s on unknown ones', () => {
    at('/politicas/garantia', <Policy />, '/politicas/:tipo');
    expect(screen.getByRole('heading', { level: 1, name: 'Política de garantia' })).toBeInTheDocument();
    expect(screen.getByText(/90 dias/)).toBeInTheDocument();
    at('/politicas/devolucao-total', <Policy />, '/politicas/:tipo');
    expect(screen.getByText('Página não encontrada')).toBeInTheDocument();
  });
});
