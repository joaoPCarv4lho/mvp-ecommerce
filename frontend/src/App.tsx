import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LegacyRedirect from './pages/LegacyRedirect';

const Home = lazy(() => import('./pages/Home'));
const Listing = lazy(() => import('./pages/Listing'));
const Search = lazy(() => import('./pages/Search'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Repair = lazy(() => import('./pages/Repair'));
const TradeIn = lazy(() => import('./pages/TradeIn'));
const GiftCards = lazy(() => import('./pages/GiftCards'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Policy = lazy(() => import('./pages/Policy'));
const Account = lazy(() => import('./pages/Account'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
