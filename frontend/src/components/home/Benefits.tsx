import { storeConfig } from '../../config/storeConfig';
import { PixelIcon } from '../ui';
import type { PixelIconName } from '../ui';

const ITEMS: { icon: PixelIconName; text: string }[] = [
  { icon: 'truck', text: 'Retirada grátis na loja em Joinville' },
  { icon: 'shield', text: 'Usados revisados com garantia' },
  { icon: 'coin', text: 'Parcele em até 12x' },
  { icon: 'store', text: `Desde ${storeConfig.anoFundacao}` },
];

export function Benefits() {
  return (
    <section className="border-y border-border bg-surface">
      <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4">
        {ITEMS.map((i) => (
          <li key={i.text} className="flex items-center gap-2 text-sm font-bold">
            <PixelIcon name={i.icon} size={24} />
            {i.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
