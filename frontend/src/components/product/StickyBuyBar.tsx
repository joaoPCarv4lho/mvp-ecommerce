import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { formatPrice } from '../../domain/price';
import { Button } from '../ui';

/**
 * Fixed mobile CTA bar. Only becomes visible once the in-page "Comprar" button scrolls out of
 * view, so exactly one variant="primary" button is ever visible at once (§ hard rules).
 * jsdom has no IntersectionObserver, so it guards its absence and simply never shows (no sticky bar in tests).
 */
export function StickyBuyBar({
  targetRef,
  price,
  label,
  onBuy,
  disabled,
}: {
  targetRef: RefObject<HTMLElement>;
  price: number;
  label: string;
  onBuy: () => void;
  disabled?: boolean;
}) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetRef]);

  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2 border-t border-border bg-surface p-2 shadow-card lg:hidden">
      <span className="font-bold">{formatPrice(price)} no Pix</span>
      <Button variant="primary" onClick={onBuy} disabled={disabled}>
        {label}
      </Button>
    </div>
  );
}
