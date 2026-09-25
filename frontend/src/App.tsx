import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LegacyRedirect from './pages/LegacyRedirect';

const loadHome = () => import('./pages/Home');
const loadListing = () => import('./pages/Listing');
const loadSearch = () => import('./pages/Search');
const loadProductPage = () => import('./pages/ProductPage');
const loadCart = () => import('./pages/Cart');
const loadCheckout = () => import('./pages/Checkout');
const loadRepair = () => import('./pages/Repair');
const loadTradeIn = () => import('./pages/TradeIn');
const loadGiftCards = () => import('./pages/GiftCards');
const loadAbout = () => import('./pages/About');
const loadContact = () => import('./pages/Contact');
const loadPolicy = () => import('./pages/Policy');
const loadAccount = () => import('./pages/Account');
const loadNotFound = () => import('./pages/NotFound');

const Home = lazy(loadHome);
const Listing = lazy(loadListing);
const Search = lazy(loadSearch);
const ProductPage = lazy(loadProductPage);
const Cart = lazy(loadCart);
const Checkout = lazy(loadCheckout);
const Repair = lazy(loadRepair);
const TradeIn = lazy(loadTradeIn);
const GiftCards = lazy(loadGiftCards);
const About = lazy(loadAbout);
const Contact = lazy(loadContact);
const Policy = lazy(loadPolicy);
const Account = lazy(loadAccount);
const NotFound = lazy(loadNotFound);

/**
 * Route chunk for a URL. Every page is prerendered, so the first client render must produce the
 * same markup straight away: mounting before its chunk arrives would replace the served HTML with
 * the loading skeleton and shift the layout. `main.tsx` waits for this before rendering.
 */
const CHUNKS: [RegExp, () => Promise<unknown>][] = [
  [/^\/$/, loadHome],
  [/^\/produtos(\/|$)/, loadListing],
  [/^\/usados(\/|$)/, loadListing],
  [/^\/gift-cards(\/|$)/, loadGiftCards],
  [/^\/produto\//, loadProductPage],
  [/^\/busca(\/|$)/, loadSearch],
  [/^\/carrinho(\/|$)/, loadCart],
  [/^\/checkout(\/|$)/, loadCheckout],
  [/^\/assistencia-tecnica(\/|$)/, loadRepair],
  [/^\/troque-seu-game(\/|$)/, loadTradeIn],
  [/^\/sobre(\/|$)/, loadAbout],
  [/^\/contato(\/|$)/, loadContact],
  [/^\/politicas\//, loadPolicy],
  [/^\/conta(\/|$)/, loadAccount],
  [/^\/(playstation|xbox|nintendo|retro)(\/|$)/, loadListing],
];

export const preloadRoute = (pathname: string): Promise<unknown> =>
  (CHUNKS.find(([re]) => re.test(pathname))?.[1] ?? loadNotFound)();

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="produtos" element={<Listing />} />
        <Route path="usados" element={<Navigate to="/produtos?condicao=usado" replace />} />
        <Route path="gift-cards" element={<GiftCards />} />
        <Route path="produto/:slug" element={<ProductPage />} />
        <Route path="busca" element={<Search />} />
        <Route path="carrinho" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="assistencia-tecnica" element={<Repair />} />
        <Route path="troque-seu-game" element={<TradeIn />} />
        <Route path="sobre" element={<About />} />
        <Route path="contato" element={<Contact />} />
        <Route path="politicas/:tipo" element={<Policy />} />
        <Route path="conta" element={<Account />} />
        <Route path="index.php" element={<LegacyRedirect />} />
        <Route path=":plataforma" element={<Listing />} />
        <Route path=":plataforma/:sub" element={<Listing />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
