import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { storeConfig } from '../../config/storeConfig';
import { cartCount, useCart } from '../../store/cart';
import { Drawer, PixelIcon } from '../ui';
import { MainMenu } from './MainMenu';
import { SearchBox } from './SearchBox';

const iconLink = 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-card px-2 font-bold hover:bg-brand-strong';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart(cartCount);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  return (
    <>
    {/* Focus ring switches to white on the purple bar so it stays visible. */}
    <header className="bg-brand text-white [&_:focus-visible]:outline-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-1 px-4 py-2 sm:gap-2 lg:gap-4">
        <button type="button" onClick={() => setMenuOpen(true)} className={`${iconLink} lg:hidden`} aria-haspopup="dialog" aria-expanded={menuOpen}>
          <PixelIcon name="menu" size={24} />
          <span className="sr-only">Menu</span>
        </button>
        <Link to="/" className="mr-auto inline-flex min-h-11 items-center gap-2 rounded-card text-lg font-bold lg:mr-0">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-card bg-white text-brand">
            <PixelIcon name="controller" size={28} />
          </span>
          {storeConfig.nome}
        </Link>
        <div className="order-last w-full lg:order-none lg:w-auto lg:flex-1">
          <SearchBox />
        </div>
        <Link to="/conta" className={iconLink}>
          <PixelIcon name="user" size={24} />
          <span className="sr-only sm:not-sr-only">Minha conta</span>
        </Link>
        <Link to="/carrinho" className={`${iconLink} relative`} aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}>
          <PixelIcon name="cart" size={24} />
          <span className="hidden sm:inline">Carrinho</span>
          <span
            aria-hidden="true"
            className={`inline-flex min-w-[20px] items-center justify-center rounded-card px-1 text-xs font-bold ${count ? 'bg-white text-brand' : 'bg-brand-strong text-white'}`}
          >
            {count}
          </span>
        </Link>
      </div>
      <div className="hidden border-t border-brand-strong lg:block">
        <div className="mx-auto max-w-[1200px] px-4">
          <MainMenu layout="inline" />
        </div>
      </div>
    </header>
    <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
      {/* Any link click closes the drawer, even when it points to the current URL (no location change). */}
      <div onClick={(e) => { if ((e.target as Element).closest('a')) setMenuOpen(false); }}>
        <MainMenu layout="drawer" />
      </div>
    </Drawer>
    </>
  );
}
