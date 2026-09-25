import { useAsync } from '../../hooks/useAsync';
import { listProducts } from '../../services/products';
import { ProductCard } from '../product/ProductCard';
import { ProductCardSkeleton } from '../ui';

/** "Chegou agora" (§6.1): recently listed used products, horizontal scroll on mobile. */
export function NewArrivals() {
  const { data, loading } = useAsync(() => listProducts({ condicao: 'usado', sort: 'recentes' }), []);
  const items = data?.items.slice(0, 8) ?? [];
  if (!loading && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6">
      <h2 className="mb-2 text-lg font-bold">Chegou agora</h2>
      <div
        tabIndex={0}
        aria-label="Chegou agora: produtos usados recém-cadastrados, role para o lado para ver mais"
        className="flex gap-2 overflow-x-auto pb-2 sm:gap-4"
      >
        {loading
          ? Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="w-[160px] flex-shrink-0 sm:w-[220px]">
                <ProductCardSkeleton />
              </div>
            ))
          : items.map((p) => (
              <div key={p.id} className="w-[160px] flex-shrink-0 sm:w-[220px]">
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  );
}
