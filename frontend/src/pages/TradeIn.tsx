import { useMemo, useState } from 'react';
import type { TradeInItem } from '../domain/types';
import { getFaq, getTradeIn } from '../services/content';
import { listProducts } from '../services/products';
import { createTradeInProtocol } from '../services/orders';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { buildProductName } from '../domain/productName';
import { tradeInMessage } from '../domain/messages';
import { whatsappLink, pageWhatsappText } from '../domain/whatsapp';
import { storeJsonLd } from '../seo/jsonld';
import { Accordion, Alert, Button, Input, PixelIcon, RadioCard, Select, Skeleton, Stepper } from '../components/ui';

const STEPS = ['O que você tem', 'Estado', 'O que você quer', 'Resumo'];
const SELECIONE = { value: '', label: 'Selecione' };

const TIPOS: { value: 'console' | 'jogo'; title: string; description: string }[] = [
  { value: 'console', title: 'Console', description: 'Videogames de mesa e portáteis, de qualquer geração.' },
  { value: 'jogo', title: 'Jogo', description: 'Mídia física: disco, cartucho ou caixa original.' },
];

const ESTADOS = [
  { value: 'Excelente', description: 'Sem marcas visíveis, funcionamento perfeito.' },
  { value: 'Muito bom', description: 'Marcas leves de uso, funcionamento perfeito.' },
  { value: 'Bom', description: 'Marcas de uso visíveis, funcionamento perfeito.' },
];

const ACOMPANHA = ['Caixa', 'Controles', 'Cabos', 'Manual'];

const QUER = [
  { value: 'Crédito na loja', description: 'O valor vira crédito para usar em qualquer produto, na hora.' },
  { value: 'Dinheiro', description: 'Pagamento em dinheiro ou Pix, com valor um pouco menor que o crédito.' },
  { value: 'Um produto específico', description: 'Use o valor como entrada em um produto do nosso catálogo.' },
];

interface WizardState {
  plataforma: string;
  tipo: '' | 'console' | 'jogo';
  modelo: string;
  estado: string;
  acompanha: string[];
  quer: string;
  produtoDesejado: string;
}

const EMPTY: WizardState = { plataforma: '', tipo: '', modelo: '', estado: '', acompanha: [], quer: '', produtoDesejado: '' };

function AcceptedTable({ rows }: { rows: TradeInItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="pb-2 text-left text-lg font-bold">Itens aceitos e não aceitos</caption>
        <thead>
          <tr className="border-b border-border text-muted">
            <th scope="col" className="py-2 pr-2 font-bold">Item</th>
            <th scope="col" className="py-2 pr-2 font-bold">Plataforma</th>
            <th scope="col" className="py-2 pr-2 font-bold">Aceito?</th>
            <th scope="col" className="py-2 font-bold">Observação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.familia}-${r.modelo}`} className="border-b border-border last:border-0">
              <th scope="row" className="py-2 pr-2 font-normal">{r.modelo}</th>
              <td className="py-2 pr-2">{r.familia}</td>
              <td className="py-2 pr-2">
                <span className={`inline-flex items-center gap-1 font-bold ${r.aceito ? 'text-success' : 'text-error'}`}>
                  <PixelIcon name={r.aceito ? 'check' : 'close'} size={14} />
                  {r.aceito ? 'Sim' : 'Não'}
                </span>
              </td>
              <td className="py-2">{r.motivo ?? (r.aceito ? 'Avaliamos na loja, em até 30 minutos.' : '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TradeIn() {
  const { data: rows = [], loading } = useAsync(() => getTradeIn(), []);
  const { data: faq } = useAsync(() => getFaq(), []);
  const perguntas = faq?.troca ?? [];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(EMPTY);
  const [errors, setErrors] = useState<{ plataforma?: string; modelo?: string; estado?: string; quer?: string; produtoDesejado?: string }>({});
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [protocoloError, setProtocoloError] = useState(false);
  const [busca, setBusca] = useState('');

  const aceitos = useMemo(() => rows.filter((r) => r.aceito), [rows]);
  const familias = useMemo(() => [...new Set(aceitos.map((r) => r.familia))], [aceitos]);
  const modelos = useMemo(
    () => aceitos.filter((r) => r.familia === form.plataforma && r.tipo === form.tipo).map((r) => r.modelo),
    [aceitos, form.plataforma, form.tipo],
  );

  const { data: buscaResult } = useAsync(
    () => (busca.trim().length >= 2 ? listProducts({ q: busca.trim(), sort: 'relevancia' }) : Promise.resolve({ items: [], total: 0 })),
    [busca],
  );
  const sugestoes = (buscaResult?.items ?? []).slice(0, 5);

  useSeo({
    title: 'Troque seu game | Mateus Games',
    description: 'Troque consoles e jogos usados por crédito na loja, dinheiro ou outro produto. Avaliação em até 30 minutos em Joinville.',
    path: '/troque-seu-game',
    jsonLd: storeJsonLd(),
  });
  useWhatsAppMessage(pageWhatsappText('Troque seu Game'));

  const tipoLabel = TIPOS.find((t) => t.value === form.tipo)?.title ?? '';
  const message = tradeInMessage({
    plataforma: form.plataforma,
    tipo: tipoLabel,
    modelo: form.modelo,
    estado: form.estado,
    acompanha: form.acompanha,
    quer: form.quer,
    ...(form.produtoDesejado ? { produtoDesejado: form.produtoDesejado } : {}),
    ...(protocolo ? { protocolo } : {}),
  });

  function advance() {
    const found: typeof errors = {};
    if (step === 0) {
      if (!form.plataforma) found.plataforma = 'Escolha a plataforma.';
      if (!form.tipo || !form.modelo) found.modelo = 'Escolha o tipo e o modelo do seu item.';
    }
    if (step === 1 && !form.estado) found.estado = 'Escolha o estado do item.';
    if (step === 2) {
      if (!form.quer) found.quer = 'Escolha o que você quer receber.';
      else if (form.quer === 'Um produto específico' && !form.produtoDesejado) found.produtoDesejado = 'Escolha o produto desejado.';
    }
    setErrors(found);
    if (Object.keys(found).length) {
      const first = found.plataforma ? 'troca-plataforma' : found.modelo ? 'troca-modelo' : null;
      // Select is a plain function component (no ref forwarding), so focus the field by id.
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setStep(step + 1);
  }

  async function gerarProtocolo() {
    setProtocoloError(false);
    try {
      const { protocolo: code } = await createTradeInProtocol(message);
      setProtocolo(code);
    } catch {
      setProtocoloError(true);
    }
  }

  const toggleAcompanha = (item: string) =>
    setForm((f) => ({ ...f, acompanha: f.acompanha.includes(item) ? f.acompanha.filter((i) => i !== item) : [...f.acompanha, item] }));

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Troque seu game</h1>
        <ul className="flex flex-col gap-1 text-muted">
          <li>Traga seu item na loja.</li>
          <li>Avaliação em até 30 minutos.</li>
          <li>O valor pode virar crédito na loja ou dinheiro.</li>
        </ul>
      </header>

      <section aria-labelledby="wizard" className="max-w-[640px]">
        <h2 id="wizard" className="sr-only">
          Simulador de troca
        </h2>
        <Stepper steps={STEPS} current={step} />

        {loading ? <Skeleton className="mt-6 h-64 w-full" /> : (
        <div className="mt-6 flex flex-col gap-4">
          {step === 0 ? (
            <>
              <Select
                id="troca-plataforma"
                label="Plataforma"
                value={form.plataforma}
                error={errors.plataforma}
                options={[SELECIONE, ...familias.map((f) => ({ value: f, label: f }))]}
                onChange={(e) => setForm({ ...form, plataforma: e.target.value, modelo: '' })}
              />
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-bold">Tipo</legend>
                {TIPOS.map((t) => (
                  <RadioCard
                    key={t.value}
                    name="troca-tipo"
                    value={t.value}
                    checked={form.tipo === t.value}
                    onChange={() => setForm({ ...form, tipo: t.value, modelo: '' })}
                    title={t.title}
                    description={t.description}
                  />
                ))}
              </fieldset>
              <Select
                id="troca-modelo"
                label="Modelo ou título"
                value={form.modelo}
                error={errors.modelo}
                options={[SELECIONE, ...modelos.map((m) => ({ value: m, label: m }))]}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-bold">Estado de conservação</legend>
                {ESTADOS.map((e) => (
                  <RadioCard
                    key={e.value}
                    name="troca-estado"
                    value={e.value}
                    checked={form.estado === e.value}
                    onChange={() => setForm({ ...form, estado: e.value })}
                    title={e.value}
                    description={e.description}
                  />
                ))}
              </fieldset>
              {errors.estado ? <p className="text-sm text-error">{errors.estado}</p> : null}
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-bold">O que acompanha</legend>
                {ACOMPANHA.map((item) => (
                  <label key={item} className="flex min-h-11 items-center gap-2">
                    <input type="checkbox" checked={form.acompanha.includes(item)} onChange={() => toggleAcompanha(item)} className="h-5 w-5" />
                    {item}
                  </label>
                ))}
              </fieldset>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-bold">O que você quer receber</legend>
                {QUER.map((q) => (
                  <RadioCard
                    key={q.value}
                    name="troca-quer"
                    value={q.value}
                    checked={form.quer === q.value}
                    onChange={() => setForm({ ...form, quer: q.value, produtoDesejado: '' })}
                    title={q.value}
                    description={q.description}
                  />
                ))}
              </fieldset>
              {errors.quer ? <p className="text-sm text-error">{errors.quer}</p> : null}
              {form.quer === 'Um produto específico' ? (
                <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
                  <Input
                    id="troca-busca"
                    label="Buscar produto"
                    value={busca}
                    error={errors.produtoDesejado}
                    placeholder="Ex.: PlayStation 5"
                    onChange={(e) => setBusca(e.target.value)}
                  />
                  <fieldset className="flex flex-col gap-2">
                    <legend className="sr-only">Produto desejado</legend>
                    {sugestoes.map((p) => {
                      const nome = buildProductName(p);
                      return (
                        <RadioCard
                          key={p.id}
                          name="troca-produto"
                          value={nome}
                          checked={form.produtoDesejado === nome}
                          onChange={() => setForm({ ...form, produtoDesejado: nome })}
                          title={nome}
                        />
                      );
                    })}
                  </fieldset>
                </div>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-4">
              <dl className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4 text-sm">
                {[
                  ['Item', `${tipoLabel} ${form.modelo}`],
                  ['Plataforma', form.plataforma],
                  ['Estado', form.estado],
                  ['Acompanha', form.acompanha.length ? form.acompanha.join(', ') : 'nada além do item'],
                  ['Quero', form.quer + (form.produtoDesejado ? ` — ${form.produtoDesejado}` : '')],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-wrap gap-1">
                    <dt className="font-bold">{label}:</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted">
                Traga o item na loja: a avaliação sai em até 30 minutos e o valor pode virar crédito na loja ou dinheiro.
              </p>
              {protocolo ? <Alert tone="success">Protocolo {protocolo}</Alert> : null}
              {protocoloError ? <Alert tone="error">Não foi possível gerar o protocolo. Tente novamente.</Alert> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button variant="primary" size="lg" onClick={advance}>
                Continuar
              </Button>
            ) : (
              <>
                <Button as="a" variant="primary" size="lg" href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
                  Enviar para o WhatsApp
                </Button>
                <Button variant="secondary" onClick={gerarProtocolo}>
                  Gerar protocolo
                </Button>
              </>
            )}
          </div>
        </div>
        )}
      </section>

      <section aria-labelledby="aceitos">
        <h2 id="aceitos" className="sr-only">
          Itens aceitos e não aceitos
        </h2>
        <AcceptedTable rows={rows} />
      </section>

      <section aria-labelledby="faq-troca">
        <h2 id="faq-troca" className="text-lg font-bold">
          Perguntas frequentes
        </h2>
        <div className="mt-2">
          <Accordion items={perguntas.map((f, i) => ({ id: `faq-troca-${i}`, title: f.pergunta, content: f.resposta }))} />
        </div>
      </section>
    </div>
  );
}
