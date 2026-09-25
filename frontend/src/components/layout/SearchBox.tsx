import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Suggestion } from '../../domain/types';
import { suggestProducts } from '../../services/products';
import { formatPrice } from '../../domain/price';
import { PixelIcon } from '../ui';

export function SearchBox() {
  const id = useId();
  const listId = `${id}-list`;
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState(() => (location.pathname === '/busca' ? new URLSearchParams(location.search).get('q') ?? '' : ''));
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const latest = useRef('');

  useEffect(() => {
    const term = q.trim();
    latest.current = term;
    if (term.length < 2) { setItems([]); return; }
    const t = setTimeout(() => {
      suggestProducts(term).then((r) => {
        if (latest.current !== term) return; // stale response
        setItems(r);
        setActive(-1);
      }, () => setItems([]));
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  // Close the list whenever the route changes.
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);

  const expanded = open && items.length > 0;

  const go = (s: Suggestion) => { setOpen(false); navigate(`/produto/${s.slug}`); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    navigate(`/busca?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      const d = e.key === 'ArrowDown' ? 1 : -1;
      const n = items.length;
      // Cycles through -1 (input) .. n-1.
      setActive((a) => ((a + 1 + d + n + 1) % (n + 1)) - 1);
    } else if (e.key === 'Enter' && expanded && active >= 0 && active < items.length) {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === 'Escape') {
      if (expanded) { e.preventDefault(); setOpen(false); setActive(-1); }
    }
  };

  return (
    <form role="search" action="/busca" onSubmit={onSubmit} className="relative w-full">
      <label htmlFor={`${id}-input`} className="sr-only">Buscar produtos</label>
      <input
        id={`${id}-input`}
        name="q"
        type="search"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 && active < items.length ? `${id}-opt-${active}` : undefined}
        placeholder="Buscar games, consoles, acessórios…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="min-h-11 w-full rounded-card border border-border bg-surface py-2 pl-4 pr-12 text-base text-text placeholder:text-muted focus-visible:border-brand"
      />
      <button type="submit" aria-label="Buscar" className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-card text-brand">
        <PixelIcon name="search" size={20} />
      </button>
      <ul
        id={listId}
        role="listbox"
        aria-label="Sugestões de produtos"
        hidden={!expanded}
        className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-card border border-border bg-surface text-text shadow-card"
      >
        {items.map((s, i) => (
          <li
            key={s.slug}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()} // keep focus in the input so blur doesn't close before click
            onClick={() => go(s)}
            onMouseEnter={() => setActive(i)}
            className={`flex min-h-11 cursor-pointer items-center gap-2 px-2 py-1 ${i === active ? 'bg-brand-soft' : ''}`}
          >
            <img src={s.imagem.src} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-card bg-bg object-cover" />
            <span className="flex-1 text-sm">{s.nome}</span>
            <span className="text-sm font-bold">{formatPrice(s.preco)}</span>
          </li>
        ))}
      </ul>
    </form>
  );
}
