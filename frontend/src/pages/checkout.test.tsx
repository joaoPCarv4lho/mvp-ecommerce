import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Cart from './Cart';
import Checkout from './Checkout';
import { useCart } from '../store/cart';
import { loadSeed } from '../data/loadSeed';

const orders = vi.hoisted(() => ({ fail: false }));
vi.mock('../services/orders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/orders')>();
  return {
    ...actual,
    createOrder: (input: Parameters<typeof actual.createOrder>[0]) =>
      orders.fail ? Promise.reject(new Error('falhou')) : actual.createOrder(input),
  };
});

const app = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/carrinho" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </MemoryRouter>,
  );

const product = (id: string) => loadSeed().products.find((p) => p.id === id)!;

beforeEach(() => {
  orders.fail = false;
  useCart.getState().clear();
});

async function fillIdentification(u: ReturnType<typeof userEvent.setup>) {
  await u.type(screen.getByLabelText('Nome completo'), 'Ana Souza');
  await u.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
  await u.type(screen.getByLabelText('Celular (WhatsApp)'), '47999990000');
  await u.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe('Cart', () => {
  it('empty cart shows suggestions and back button', async () => {
    app('/carrinho');
    expect(screen.getByText('Seu carrinho está vazio')).toBeInTheDocument();
    expect(await screen.findAllByRole('article')).not.toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Voltar às compras' })).toHaveAttribute('href', '/produtos');
  });

  it('lists items with quantity controls and announces updates', async () => {
    useCart.getState().add(product('ps5-pro-novo'));
    app('/carrinho');
    const u = userEvent.setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Seu carrinho' })).toBeInTheDocument();
    const live = screen.getByRole('status');
    expect(live.textContent).toMatch(/Carrinho atualizado: 1 item, total R\$/);
    await u.click(screen.getByRole('button', { name: /Aumentar quantidade de PlayStation 5 Pro/ }));
    expect(useCart.getState().items[0].quantidade).toBe(2);
    expect(screen.getByRole('status').textContent).toMatch(/Carrinho atualizado: 2 itens/);
    await u.click(screen.getByRole('button', { name: /Remover PlayStation 5 Pro/ }));
    expect(useCart.getState().items).toHaveLength(0);
    expect(screen.getByText('Seu carrinho está vazio')).toBeInTheDocument();
  });

  it('summary shows Pix and card totals and links to checkout', () => {
    useCart.getState().add(product('ps5-pro-novo'));
    app('/carrinho');
    expect(screen.getByText(/Subtotal no Pix/)).toBeInTheDocument();
    expect(screen.getByText(/no cartão/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar para identificação' })).toHaveAttribute('href', '/checkout');
  });
});

describe('Checkout (guest, Pix, pickup)', () => {
  it('completes an order without creating an account', async () => {
    useCart.getState().add(product('ps5-pro-novo'));
    app('/checkout');
    const u = userEvent.setup();
    await fillIdentification(u);
    expect(screen.getByLabelText(/Retirar na loja — grátis/)).toBeChecked();
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText(/Pix/)).toBeChecked();
    await u.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    expect(await screen.findByRole('heading', { name: 'Pedido confirmado!' })).toBeInTheDocument();
    expect(screen.getByText(/Número do pedido: MG-\d{8}-[0-9A-F]{4}/)).toBeInTheDocument();
    expect(useCart.getState().items).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/conta');
  });

  it('shows validation errors linked to fields', async () => {
    useCart.getState().add(loadSeed().products[0]);
    app('/checkout');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('empty cart redirects to the cart page', () => {
    app('/checkout');
    expect(screen.getByText('Seu carrinho está vazio')).toBeInTheDocument();
  });

  it('home delivery requires a valid CEP and adds the shipping cost', async () => {
    useCart.getState().add(product('ps5-pro-novo'));
    app('/checkout');
    const u = userEvent.setup();
    await fillIdentification(u);
    await u.click(screen.getByLabelText(/Receber em casa/));
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('CEP')).toHaveAttribute('aria-invalid', 'true');
    await u.type(screen.getByLabelText('CEP'), '89201000');
    await u.type(screen.getByLabelText('Endereço completo'), 'Rua das Palmeiras, 100, Centro');
    expect(await screen.findByText(/1 dia útil/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText(/Pix/)).toBeChecked();
    expect(screen.getAllByText(/Entrega/).length).toBeGreaterThan(0);
  });

  it('card payment offers the installments allowed by the cart', async () => {
    useCart.getState().add(product('ps5-pro-novo'));
    app('/checkout');
    const u = userEvent.setup();
    await fillIdentification(u);
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByLabelText(/Cartão de crédito/));
    const select = screen.getByLabelText('Parcelas');
    expect(within(select).getAllByRole('option').length).toBe(12);
    expect(within(select).getAllByRole('option')[11].textContent).toMatch(/^12x de R\$\s.+ sem juros$/);
  });

  it('keeps the data and shows an error when the order fails', async () => {
    orders.fail = true;
    useCart.getState().add(product('ps5-pro-novo'));
    app('/checkout');
    const u = userEvent.setup();
    await fillIdentification(u);
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível concluir o pedido. Tente novamente.');
    expect(useCart.getState().items).toHaveLength(1);
    await u.click(screen.getByRole('button', { name: 'Voltar' }));
    await u.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Souza');
  });
});
