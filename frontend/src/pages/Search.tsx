import { Link, useSearchParams } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { listProducts } from '../services/products';
import { whatsappLink } from '../domain/whatsapp';
import { ProductGrid } from '../components/product/ProductGrid';
import { EmptyState } from '../components/ui';

const SUGESTOES = [
  { label: 'PlayStation 5', to: '/busca?q=playstation+5' },
  { label: 'Nintendo Switch', to: '/busca?q=nintendo+switch' },
  { label: 'Gift Cards', to: '/gift-cards' },
  { label: 'Usados & Seminovos', to: '/produtos?condicao=usado' },
];

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { data, loading } = useAsync(() => listProducts({ q }), [q]);
  const products = data?.items ?? [];

  useSeo({ title: `Resultados para "${q}" | Mateus Games`, description: `Resultados da busca por "${q}" na Mateus Games.`, path: '/busca', noindex: true });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-xl font-bold lg:text-2xl">Resultados para &quot;{q}&quot;</h1>

      {!loading && products.length === 0 ? (
        <EmptyState icon="search" title={`Não encontramos resultados para "${q}"`} text="Que tal tentar um destes:">
          <ul className="mb-4 flex flex-wrap justify-center gap-2">
            {SUGESTOES.map((s) => (
              <li key={s.label}>
                <Link to={s.to} className="font-bold text-brand hover:underline">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={whatsappLink(`Olá! Procurei por "${q}" no site e não encontrei. Vocês conseguem para mim?`)}
            target="_blank"
            rel="noopener"
            className="font-bold text-brand hover:underline"
          >
            Não achou? A gente procura pra você
          </a>
        </EmptyState>
      ) : (
        <div className="mt-4">
          <p aria-live="polite" className="mb-4 text-sm text-muted">
            {products.length} produtos
          </p>
          <ProductGrid products={products} loading={loading} skeletons={8} priorityCount={4} />
        </div>
      )}
    </div>
  );
}
