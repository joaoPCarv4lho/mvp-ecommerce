import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ProductCardSkeleton, Skeleton, ToastRegion } from '../ui';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';

export function PageSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8" role="status" aria-label="Carregando">
      <Skeleton className="h-8 w-1/2" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo?.(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <a href="#conteudo" className="sr-only z-50 rounded-card bg-surface px-4 py-2 font-bold text-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
      <ToastRegion />
    </div>
  );
}
