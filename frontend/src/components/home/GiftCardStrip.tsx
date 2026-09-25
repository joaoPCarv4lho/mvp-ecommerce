import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { listProducts } from '../../services/products';
import { slugify } from '../../domain/slug';
import { productImgProps } from '../product/img';

/** Gift cards strip (§6.1): 6 cards, each links to /gift-cards filtered by family. */
export function GiftCardStrip() {
  const { data } = useAsync(() => listProducts({ tipo: 'gift-card', sort: 'relevancia' }), []);
  const items = data?.items.slice(0, 6) ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6">
      <h2 className="mb-2 text-lg font-bold">Gift cards</h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
        {items.map((p) => {
          const img = p.imagens[0];
          return (
            <li key={p.id}>
              <Link
                to={`/gift-cards?plataforma=${slugify(p.familia)}`}
                className="flex flex-col items-center gap-1 rounded-card border border-border bg-surface p-4 text-center hover:border-brand"
              >
                {img ? <img {...productImgProps(img.src)} alt={img.alt} loading="lazy" decoding="async" className="h-auto w-full rounded-card object-cover" /> : null}
                <span className="text-sm font-bold">{p.familia}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
