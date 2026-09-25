import { useAsync } from '../../hooks/useAsync';
import { getReviews } from '../../services/content';
import { formatDateBR } from '../../domain/dates';
import { storeConfig } from '../../config/storeConfig';
import { PixelIcon } from '../ui';

const notaBR = (n: number) => String(n).replace('.', ',');

function Stars({ nota }: { nota: number }) {
  return (
    <span aria-label={`Nota ${nota} de 5`} className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < nota ? 'text-brand' : 'text-border'}>
          <PixelIcon name="star" size={16} />
        </span>
      ))}
    </span>
  );
}

/** Google-style review cards (§6.1), mock data. */
export function Reviews() {
  const { data } = useAsync(getReviews, []);
  const { nota, total } = storeConfig.avaliacaoGoogle;

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6">
      <h2 className="mb-1 text-lg font-bold">Avaliações de clientes</h2>
      <p className="mb-4 text-muted">
        Nota {notaBR(nota)} no Google · {total} avaliações
      </p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand">
                {r.autor.charAt(0)}
              </span>
              <div>
                <p className="font-bold">{r.autor}</p>
                <p className="text-sm text-muted">{formatDateBR(r.data)}</p>
              </div>
            </div>
            <Stars nota={r.nota} />
            <p className="text-sm">{r.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
