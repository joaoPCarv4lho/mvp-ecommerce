import { useEffect, useState } from 'react';
import type { Condicao, Plataforma, ProductFilters, Tipo } from '../../domain/types';
import { Input, RadioCard, Select } from '../ui';
import { MAIN_MENU } from '../layout/menu';

export const platformLabel = (p: Plataforma): string => MAIN_MENU.find((m) => m.plataforma === p)?.label ?? p;

const CONDICOES: { value: Condicao; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'usado', label: 'Usado' },
  { value: 'lacrado', label: 'Lacrado' },
];

const PLATAFORMA_OPTIONS = MAIN_MENU.filter((m) => m.plataforma).map((m) => ({ value: m.plataforma as Plataforma, label: m.label }));

const TIPO_OPTIONS: { value: Tipo; label: string }[] = [
  { value: 'console', label: 'Console' },
  { value: 'jogo', label: 'Jogo' },
  { value: 'acessorio', label: 'Acessório' },
  { value: 'headset', label: 'Headset' },
  { value: 'gift-card', label: 'Gift card' },
];

export function activeFilterCount(f: ProductFilters): number {
  return ['plataforma', 'tipo', 'condicao', 'precoMin', 'precoMax', 'disponibilidade'].filter((k) => (f as Record<string, unknown>)[k] != null).length;
}

/** All filter state lives in the URL (§5.3): every change here calls `onChange` with a patched copy of `filters`. */
export function Filters({
  filters,
  onChange,
  showPlataforma = true,
  showTipo = true,
}: {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  showPlataforma?: boolean;
  showTipo?: boolean;
}) {
  const patch = (next: Partial<ProductFilters>) => onChange({ ...filters, ...next });

  // Controlled local buffers so the fields reflect `filters` after external resets (e.g. "Limpar filtros")
  // instead of going stale like an uncontrolled defaultValue would.
  const [minVal, setMinVal] = useState(filters.precoMin != null ? String(filters.precoMin) : '');
  const [maxVal, setMaxVal] = useState(filters.precoMax != null ? String(filters.precoMax) : '');
  useEffect(() => setMinVal(filters.precoMin != null ? String(filters.precoMin) : ''), [filters.precoMin]);
  useEffect(() => setMaxVal(filters.precoMax != null ? String(filters.precoMax) : ''), [filters.precoMax]);
  const commitPrice = () => patch({ precoMin: minVal ? Number(minVal) : undefined, precoMax: maxVal ? Number(maxVal) : undefined });

  return (
    <div className="flex flex-col gap-6">
      {showPlataforma ? (
        <Select
          id="filtro-plataforma"
          label="Plataforma"
          value={filters.plataforma ?? ''}
          onChange={(e) => patch({ plataforma: (e.target.value || undefined) as Plataforma | undefined })}
          options={[{ value: '', label: 'Todas as plataformas' }, ...PLATAFORMA_OPTIONS]}
        />
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">Condição</legend>
        <div className="flex flex-col gap-2">
          <RadioCard
            name="condicao"
            value=""
            checked={!filters.condicao}
            onChange={() => patch({ condicao: undefined })}
            title="Qualquer condição"
          />
          {CONDICOES.map((c) => (
            <RadioCard
              key={c.value}
              name="condicao"
              value={c.value}
              checked={filters.condicao === c.value}
              onChange={(v) => patch({ condicao: v as Condicao })}
              title={c.label}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">Faixa de preço</legend>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            commitPrice();
          }}
        >
          <div className="min-w-0 flex-1">
            <Input
              id="filtro-preco-min"
              label="Mín"
              type="number"
              inputMode="numeric"
              min={0}
              className="w-full"
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
              onBlur={commitPrice}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Input
              id="filtro-preco-max"
              label="Máx"
              type="number"
              inputMode="numeric"
              min={0}
              className="w-full"
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
              onBlur={commitPrice}
            />
          </div>
        </form>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">Disponibilidade</legend>
        <div className="flex flex-col gap-2">
          <RadioCard
            name="disponibilidade"
            value=""
            checked={!filters.disponibilidade}
            onChange={() => patch({ disponibilidade: undefined })}
            title="Qualquer"
          />
          <RadioCard
            name="disponibilidade"
            value="estoque"
            checked={filters.disponibilidade === 'estoque'}
            onChange={() => patch({ disponibilidade: 'estoque' })}
            title="Em estoque"
          />
          <RadioCard
            name="disponibilidade"
            value="retirada"
            checked={filters.disponibilidade === 'retirada'}
            onChange={() => patch({ disponibilidade: 'retirada' })}
            title="Retirada imediata"
          />
        </div>
      </fieldset>

      {showTipo ? (
        <Select
          id="filtro-tipo"
          label="Tipo"
          value={filters.tipo ?? ''}
          onChange={(e) => patch({ tipo: (e.target.value || undefined) as Tipo | undefined })}
          options={[{ value: '', label: 'Todos os tipos' }, ...TIPO_OPTIONS]}
        />
      ) : null}
    </div>
  );
}
