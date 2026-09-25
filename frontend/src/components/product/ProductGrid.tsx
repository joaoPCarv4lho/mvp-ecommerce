import type { Product } from '../../domain/types';
import { ProductCardSkeleton } from '../ui';
import { ProductCard } from './ProductCard';

/** 2 columns on mobile, 4 on desktop (§6.2). The first `priorityCount` images load eagerly (above the fold). */
export function ProductGrid({ products = [], loading = false, skeletons = 8, priorityCount = 0 }: { products?: Product[]; loading?: boolean; skeletons?: number; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4" aria-busy={loading || undefined}>
      {loading
        ? Array.from({ length: skeletons }, (_, i) => <li key={i}><ProductCardSkeleton /></li>)
        : products.map((p, i) => <li key={p.id}><ProductCard product={p} priority={i < priorityCount} /></li>)}
    </ul>
  );
}
