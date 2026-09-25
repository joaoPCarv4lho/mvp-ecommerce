import type { EstadoConservacao, UsadoInfo } from '../../domain/types';
import type { WarrantyStatus } from '../../domain/warranty';
import { formatDateBR } from '../../domain/dates';
import { PixelIcon } from '../ui';

const ESTADOS: { id: EstadoConservacao; label: string; legenda: string }[] = [
  { id: 'excelente', label: 'Excelente', legenda: 'Sem marcas visíveis, funcionamento perfeito.' },
  { id: 'muito-bom', label: 'Muito bom', legenda: 'Marcas leves de uso, funcionamento perfeito.' },
  { id: 'bom', label: 'Bom', legenda: 'Marcas de uso visíveis, funcionamento perfeito.' },
];

/** Mandatory block for used products (§6.3). Warranty here is a plain line, never an Alert. */
export function UsedBlock({ usado, warranty }: { usado: UsadoInfo; warranty: WarrantyStatus }) {
  const itens: { label: string; ok: boolean }[] = [
    { label: 'Console', ok: usado.acompanha.console },
    { label: `Controles (${usado.acompanha.controles})`, ok: usado.acompanha.controles > 0 },
    { label: 'Cabos', ok: usado.acompanha.cabos },
    { label: 'Caixa', ok: usado.acompanha.caixa },
    { label: 'Jogo', ok: usado.acompanha.jogo },
  ];

  return (
    <section aria-labelledby="usado-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <h2 id="usado-heading" className="text-lg font-bold">
        Sobre esta unidade usada
      </h2>

      <div>
        <p className="font-bold">Estado de conservação</p>
        <ul className="mt-1 flex flex-col gap-1">
          {ESTADOS.map((e) => (
            <li key={e.id} className={`rounded-card p-2 ${e.id === usado.estado ? 'bg-brand-soft text-brand font-bold' : 'text-muted'}`}>
              {e.label}
              {e.id === usado.estado ? <span className="sr-only"> (estado desta unidade)</span> : null}
              {' — '}
              {e.legenda}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-bold">O que acompanha</p>
        <ul className="mt-1 flex flex-col gap-1">
          {itens.map((it) => (
            <li key={it.label} className="flex items-center gap-2">
              <PixelIcon name={it.ok ? 'check' : 'close'} size={16} />
              <span>{it.label}</span>
              <span className="sr-only">{it.ok ? 'incluído' : 'não incluído'}</span>
            </li>
          ))}
        </ul>
      </div>

      <p>Revisado pela assistência Joinville Games em {formatDateBR(usado.revisadoEm)}</p>

      {warranty.label ? <p>{warranty.label}</p> : null}

      <div>
        <p className="font-bold">Fotos reais desta unidade</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {usado.fotosReais.map((f, i) => (
            <img key={i} src={f.src} alt={f.alt} width={120} height={120} loading="lazy" decoding="async" className="rounded-card object-cover" />
          ))}
        </div>
        <p className="mt-1 text-sm text-muted">Repare nas marcas de uso destacadas</p>
      </div>
    </section>
  );
}
