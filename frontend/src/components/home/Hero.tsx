import { Link } from 'react-router-dom';
import { storeConfig } from '../../config/storeConfig';
import { Button, PixelIcon } from '../ui';
import type { PixelIconName } from '../ui';

const JORNADAS: { to: string; label: string; icon: PixelIconName }[] = [
  { to: '/produtos', label: 'Comprar games', icon: 'cart' },
  { to: '/troque-seu-game', label: 'Trocar meu game', icon: 'swap' },
  { to: '/assistencia-tecnica', label: 'Consertar meu console', icon: 'wrench' },
];

// LCP section: hero image loads eager + fetchpriority high; kept short on mobile so the h1 and the
// 3 journey cards below still land in the first viewport.
export function Hero() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6 lg:py-8">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-center lg:gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold lg:text-2xl">{storeConfig.slogan}</h1>
          <p className="text-muted">
            Loja de videogames em Joinville desde {storeConfig.anoFundacao}: venda, troca e assistência técnica.
          </p>
        </div>
        <div className="h-[160px] w-full overflow-hidden rounded-card lg:order-first lg:h-[320px]">
          <img
            src="/images/hero-800.webp"
            srcSet="/images/hero-800.webp 800w, /images/hero-1200.webp 1200w"
            sizes="(min-width: 1024px) 50vw, 100vw"
            width={800}
            height={500}
            alt="Vitrine da loja Mateus Games com consoles e jogos em destaque"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {JORNADAS.map((j, i) => (
          <Link
            key={j.to}
            to={j.to}
            className="flex min-h-11 items-center gap-2 rounded-card border border-border bg-surface p-4 font-bold text-text hover:border-brand"
          >
            <PixelIcon name={j.icon} size={24} />
            {i === 0 ? (
              <Button as="span" variant="primary" size="sm" className="pointer-events-none">
                {j.label}
              </Button>
            ) : (
              <span>{j.label}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
