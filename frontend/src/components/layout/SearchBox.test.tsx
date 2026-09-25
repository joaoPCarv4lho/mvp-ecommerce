import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SearchBox } from './SearchBox';

function Where() { const l = useLocation(); return <p data-testid="where">{l.pathname + l.search}</p>; }

const setup = (entry = '/') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <SearchBox />
      <Routes><Route path="*" element={<Where />} /></Routes>
    </MemoryRouter>,
  );

it('ArrowDown + Enter opens the highlighted suggestion; Escape closes the list', async () => {
  const user = userEvent.setup();
  setup();
  const input = screen.getByRole('combobox', { name: 'Buscar produtos' });
  await user.type(input, 'ps5');
  const options = await screen.findAllByRole('option');
  expect(input).toHaveAttribute('aria-expanded', 'true');
  expect(await screen.findByText(`${options.length} sugestões`)).toBeInTheDocument();

  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
  expect(options[0]).toHaveAttribute('aria-selected', 'true');

  await user.keyboard('{Escape}');
  expect(input).toHaveAttribute('aria-expanded', 'false');

  await user.keyboard('{ArrowDown}{Enter}');
  expect(screen.getByTestId('where').textContent).toMatch(/^\/produto\/playstation-5-/);
});

it('Enter without a highlighted option searches; input mirrors ?q= on /busca', async () => {
  const user = userEvent.setup();
  setup('/busca?q=xbox');
  const input = screen.getByRole('combobox', { name: 'Buscar produtos' });
  expect(input).toHaveValue('xbox');
  await user.clear(input);
  await user.type(input, 'switch{Enter}');
  expect(screen.getByTestId('where').textContent).toBe('/busca?q=switch');
});
