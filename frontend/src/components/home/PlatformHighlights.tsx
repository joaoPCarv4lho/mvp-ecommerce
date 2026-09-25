import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { listProducts } from '../../services/products';
import { MAIN_MENU, PLATAFORMAS } from '../layout/menu';
import { ProductGrid } from '../product/ProductGrid';

const PLATFORM_LABEL = Object.fromEntries(MAIN_MENU.filter((m) => m.plataforma).map((m) => [m.plataforma, m.label]));

function PlatformSection({ plataforma }: { plataforma: (typeof PLATAFORMAS)[number] }) {
  const { data, loading } = useAsync(() => listProducts({ plataforma, sort: 'relevancia' }), [plataforma]);
  const items = data?.items.slice(0, 4) ?? [];
  const label = PLATFORM_LABEL[plataforma];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold">{label}</h3>
        <Link to={`/${plataforma}`} className="text-sm font-bold text-brand hover:underline">
          Ver tudo de {label}
        </Link>
      </div>
      <ProductGrid products={items} loading={loading && items.length === 0} skeletons={4} />
    </div>
  );
}

/** Destaques por plataforma (§6.1): 4 products each, by relevance. */
export function PlatformHighlights() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6">
      <h2 className="mb-4 text-lg font-bold">Destaques por plataforma</h2>
      <div className="flex flex-col gap-6">
        {PLATAFORMAS.map((p) => (
          <PlatformSection key={p} plataforma={p} />
        ))}
      </div>
    </section>
  );
}
