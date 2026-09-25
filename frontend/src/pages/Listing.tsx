import { useParams } from 'react-router-dom';
import { PLATAFORMAS, SUBCATEGORIES } from '../components/layout/menu';
import type { Plataforma } from '../domain/types';
import NotFound from './NotFound';

// Stub: replaced by its page task. Keeps the route guard: unknown /:plataforma or /:sub → NotFound.
export default function Listing() {
  const { plataforma, sub } = useParams();
  if (plataforma && !PLATAFORMAS.includes(plataforma as Plataforma)) return <NotFound />;
  if (sub && !SUBCATEGORIES.some((s) => s.slug === sub)) return <NotFound />;
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="text-2xl font-bold">Produtos</h1>
    </div>
  );
}
