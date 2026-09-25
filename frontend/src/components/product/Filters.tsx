import type { Condicao, Plataforma, ProductFilters, Tipo } from '../../domain/types';
import { Input, RadioCard, Select } from '../ui';
import { MAIN_MENU } from '../layout/menu';

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
}: {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  showPlataforma?: boolean;
}) {
  const patch = (next: Partial<ProductFilters>) => onChange({ ...filters, ...next });

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
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Input
              id="filtro-preco-min"
              label="Mín"
              type="number"
              inputMode="numeric"
              min={0}
              className="w-full"
              defaultValue={filters.precoMin ?? ''}
              onBlur={(e) => patch({ precoMin: e.target.value ? Number(e.target.value) : undefined })}
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
              defaultValue={filters.precoMax ?? ''}
              onBlur={(e) => patch({ precoMax: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
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

      <Select
        id="filtro-tipo"
        label="Tipo"
        value={filters.tipo ?? ''}
        onChange={(e) => patch({ tipo: (e.target.value || undefined) as Tipo | undefined })}
        options={[{ value: '', label: 'Todos os tipos' }, ...TIPO_OPTIONS]}
      />
    </div>
  );
}
