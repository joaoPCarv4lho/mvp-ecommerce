import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Home from './Home';
import Listing from './Listing';
import Search from './Search';

const at = (path: string, el: JSX.Element, pattern = '*') =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={el} /></Routes></MemoryRouter>);

describe('Home', () => {
  it('shows slogan, 3 journeys, reviews and no expired banner', async () => {
    at('/', <Home />);
    expect(await screen.findByRole('heading', { level: 1, name: 'A diversão de hoje é a nostalgia de amanhã' })).toBeInTheDocument();
    for (const n of ['Comprar games', 'Trocar meu game', 'Consertar meu console']) expect(screen.getByRole('link', { name: new RegExp(n) })).toBeInTheDocument();
    expect(await screen.findByText(/Nota 4,9 no Google/)).toBeInTheDocument();
    expect(screen.queryByText(/Black Friday 2023/)).toBeNull();
    expect(screen.getByText('Desde 2012')).toBeInTheDocument();
  });
});

describe('Listing', () => {
  it('used filter from URL, no descriptions', async () => {
    at('/produtos?condicao=usado', <Listing />, '/produtos');
    expect(await screen.findByRole('heading', { level: 1, name: 'Usados & Seminovos' })).toBeInTheDocument();
    const cards = await screen.findAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(within(c).getAllByText(/Usado/).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/Console revisado|descrição técnica/i);
  });
  it('platform page excludes gift cards', async () => {
    at('/playstation', <Listing />, '/:plataforma');
    await screen.findAllByRole('article');
    expect(screen.queryByText(/Gift Card/)).toBeNull();
  });
  it('hides the Tipo select when a subcategory is forced by the route', async () => {
    at('/playstation/consoles', <Listing />, '/:plataforma/:sub');
    await screen.findAllByRole('article');
    expect(screen.queryByLabelText('Tipo')).toBeNull();
  });
  it('filter badge counts only user-editable URL filters, not the route-implied plataforma/tipo', async () => {
    at('/playstation/consoles', <Listing />, '/:plataforma/:sub');
    await screen.findAllByRole('article');
    expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filtrar \(/ })).toBeNull();
  });
  it('clears the price inputs after "Limpar filtros"', async () => {
    at('/produtos?precoMin=999999999', <Listing />, '/produtos');
    const before = await screen.findAllByLabelText('Mín');
    for (const el of before) expect(el).toHaveValue(999999999);
    fireEvent.click(await screen.findByRole('button', { name: 'Limpar filtros' }));
    await waitFor(() => {
      for (const el of screen.getAllByLabelText('Mín')) expect(el).toHaveValue(null);
    });
  });
});

describe('Search', () => {
  it('"play 5" returns PS5 products', async () => {
    at('/busca?q=play%205', <Search />, '/busca');
    const cards = await screen.findAllByRole('article');
    for (const c of cards) expect(c.textContent).toMatch(/PlayStation 5/);
  });
  it('no results shows WhatsApp CTA with the term', async () => {
    at('/busca?q=zzzqqq', <Search />, '/busca');
    const cta = await screen.findByRole('link', { name: /Não achou\? A gente procura pra você/ });
    expect(cta.getAttribute('href')).toContain(encodeURIComponent('zzzqqq'));
  });
});
