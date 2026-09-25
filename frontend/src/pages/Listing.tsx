import { useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { PLATAFORMAS, SUBCATEGORIES } from '../components/layout/menu';
import type { Plataforma, ProductFilters, SortKey } from '../domain/types';
import { parseFilters, filtersToParams } from '../domain/catalog';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText } from '../domain/whatsapp';
import { breadcrumbJsonLd } from '../seo/jsonld';
import { listProducts } from '../services/products';
import { ProductGrid } from '../components/product/ProductGrid';
import { Filters, activeFilterCount, platformLabel } from '../components/product/Filters';
import { Breadcrumb, Button, Drawer, EmptyState, Select } from '../components/ui';
import NotFound from './NotFound';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'recentes', label: 'Mais recentes' },
];

export default function Listing() {
  const { plataforma, sub } = useParams<{ plataforma?: string; sub?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (plataforma && !PLATAFORMAS.includes(plataforma as Plataforma)) return <NotFound />;
  const subcat = sub ? SUBCATEGORIES.find((s) => s.slug === sub) : undefined;
  if (sub && !subcat) return <NotFound />;

  const urlFilters = parseFilters(searchParams);
  const filters: ProductFilters = {
    ...urlFilters,
    ...(plataforma ? { plataforma: plataforma as Plataforma } : {}),
    ...(subcat ? { tipo: subcat.tipo } : {}),
  };

  const { data, loading } = useAsync(() => listProducts(filters), [JSON.stringify(filters)]);
  const products = data?.items ?? [];

  const setFilters = (next: ProductFilters) => {
    const merged: ProductFilters = { ...next };
    if (plataforma) delete merged.plataforma;
    if (subcat) delete merged.tipo;
    setSearchParams(filtersToParams(merged), { replace: true });
  };

  const title = plataforma
    ? subcat
      ? `${subcat.label} de ${platformLabel(plataforma as Plataforma)}`
      : platformLabel(plataforma as Plataforma)
    : filters.condicao === 'usado'
      ? 'Usados & Seminovos'
      : 'Todos os produtos';

  const breadcrumbItems = [
    { label: 'Início', to: '/' },
    ...(plataforma ? [{ label: platformLabel(plataforma as Plataforma), to: subcat ? `/${plataforma}` : undefined }] : []),
    ...(subcat ? [{ label: subcat.label }] : []),
    ...(!plataforma && !subcat ? [{ label: title }] : []),
  ];

  const description = plataforma
    ? `Confira ${subcat ? subcat.label.toLowerCase() : 'consoles, jogos e acessórios'} de ${platformLabel(plataforma as Plataforma)} na Mateus Games, com garantia e retirada em Joinville.`
    : filters.condicao === 'usado'
      ? 'Usados e seminovos revisados com garantia na Mateus Games, em Joinville.'
      : 'Todos os produtos da Mateus Games: consoles, jogos, acessórios e gift cards, com garantia e retirada em Joinville.';

  useSeo({
    title: `${title} | Mateus Games`,
    description,
    path: location.pathname,
    jsonLd: breadcrumbJsonLd(breadcrumbItems.map((i) => ({ label: i.label, to: i.to ?? location.pathname }))),
  });
  useWhatsAppMessage(pageWhatsappText(title));

  const count = activeFilterCount(urlFilters);
  const filtersPanel = <Filters filters={filters} onChange={setFilters} showPlataforma={!plataforma} showTipo={!subcat} />;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="mt-2 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold lg:text-2xl">{title}</h1>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <aside className="hidden w-[240px] flex-shrink-0 lg:block">{filtersPanel}</aside>

        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="text-sm text-muted">
              {products.length} produtos
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
                Filtrar{count > 0 ? ` (${count})` : ''}
              </Button>
              <Select
                id="ordenar"
                label="Ordenar por"
                className="min-h-11"
                value={filters.sort ?? 'relevancia'}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortKey })}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          <ProductGrid products={products} loading={loading} skeletons={8} priorityCount={4} />

          {!loading && products.length === 0 ? (
            <EmptyState icon="search" title="Nenhum produto encontrado" text="Tente ajustar os filtros para ver mais resultados.">
              <Button variant="secondary" onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}>
                Limpar filtros
              </Button>
            </EmptyState>
          ) : null}
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filtrar" side="bottom">
        {filtersPanel}
      </Drawer>
    </div>
  );
}
