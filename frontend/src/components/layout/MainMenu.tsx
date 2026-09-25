import { useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { MenuItem } from './menu';
import { MAIN_MENU, SUBCATEGORIES } from './menu';

function subLinks(item: MenuItem) {
  if (item.children) return item.children;
  if (item.plataforma) return [{ label: `Tudo de ${item.label}`, to: item.to! }, ...SUBCATEGORIES.map((s) => ({ label: s.label, to: `/${item.plataforma}/${s.slug}` }))];
  return [];
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 6 6" aria-hidden="true" shapeRendering="crispEdges" fill="currentColor" className={open ? 'rotate-180' : ''}>
      <rect x="0" y="1" width="1" height="1" /><rect x="1" y="2" width="1" height="1" /><rect x="2" y="3" width="2" height="1" /><rect x="4" y="2" width="1" height="1" /><rect x="5" y="1" width="1" height="1" />
    </svg>
  );
}

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 flex-1 items-center rounded-card px-2 ${isActive ? 'font-bold text-brand' : 'text-text'} hover:bg-brand-soft`;

/** Mobile drawer menu: every entry with children is an expandable group. */
function DrawerMenu() {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const base = useId();
  return (
    <nav aria-label="Menu principal">
      <ul className="flex flex-col gap-1">
        {MAIN_MENU.map((item, i) => {
          const subs = subLinks(item);
          const open = openLabel === item.label;
          const panelId = `${base}-${i}`;
          return (
            <li key={item.label} className="border-b border-border pb-1 last:border-0">
              {subs.length ? (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenLabel(open ? null : item.label)}
                  className="flex min-h-11 w-full items-center justify-between rounded-card px-2 font-bold hover:bg-brand-soft"
                >
                  {item.label}
                  <Chevron open={open} />
                </button>
              ) : (
                <NavLink to={item.to!} className={linkCls} end>
                  <span className="font-bold">{item.label}</span>
                </NavLink>
              )}
              {subs.length ? (
                <ul id={panelId} className={`${open ? 'flex' : 'hidden'} flex-col pb-2 pl-4`}>
                  {subs.map((s) => (
                    <li key={s.to} className="flex">
                      <NavLink to={s.to} className={linkCls} end>{s.label}</NavLink>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop inline nav: plain links, "Serviços" is a disclosure. */
function InlineMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const itemCls = 'inline-flex min-h-11 items-center gap-1 rounded-card px-2 text-sm font-bold text-white hover:bg-brand-strong';
  return (
    <nav aria-label="Menu principal">
      <ul className="flex flex-wrap items-center gap-1">
        {MAIN_MENU.map((item) =>
          item.children ? (
            <li
              key={item.label}
              ref={ref}
              className="relative"
              onKeyDown={(e) => { if (e.key === 'Escape' && open) { setOpen(false); btnRef.current?.focus(); } }}
              onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node | null)) setOpen(false); }}
            >
              <button ref={btnRef} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)} className={itemCls}>
                {item.label}
                <Chevron open={open} />
              </button>
              <ul id={panelId} hidden={!open} className="absolute left-0 top-full z-40 mt-1 w-[240px] rounded-card border border-border bg-surface p-1 shadow-card [&_a:focus-visible]:outline-brand">
                {item.children.map((c) => (
                  <li key={c.to} className="flex">
                    <NavLink to={c.to} className={linkCls}>{c.label}</NavLink>
                  </li>
                ))}
              </ul>
            </li>
          ) : (
            <li key={item.label}>
              <NavLink to={item.to!} className={({ isActive }) => `${itemCls} ${isActive ? 'bg-brand-strong' : ''}`}>
                {item.label}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

export function MainMenu({ layout }: { layout: 'drawer' | 'inline' }) {
  return layout === 'drawer' ? <DrawerMenu /> : <InlineMenu />;
}
