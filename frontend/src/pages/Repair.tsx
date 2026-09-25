import { useState } from 'react';
import type { FormEvent } from 'react';
import { getFaq, getServices } from '../services/content';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { formatPrice } from '../domain/price';
import { repairMessage } from '../domain/messages';
import { whatsappLink, pageWhatsappText } from '../domain/whatsapp';
import { faqJsonLd, storeJsonLd } from '../seo/jsonld';
import { storeConfig } from '../config/storeConfig';
import { Accordion, Alert, Button, Input, Select, Skeleton } from '../components/ui';

const CONSOLES = ['PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch', 'Retrô/outro'];
const SELECIONE = { value: '', label: 'Selecione' };

export default function Repair() {
  const { data: services = [], loading } = useAsync(() => getServices(), []);
  const { data: faq } = useAsync(() => getFaq(), []);
  const perguntas = faq?.assistencia ?? [];

  const [form, setForm] = useState({ console: '', problema: '', comoAconteceu: '', nome: '' });
  const [errors, setErrors] = useState<{ console?: string; problema?: string }>({});
  const [sentLink, setSentLink] = useState<string | null>(null);

  useSeo({
    title: 'Conserto de videogame em Joinville | Mateus Games',
    description:
      'Assistência técnica de videogame em Joinville: limpeza, pasta térmica, porta HDMI, drift de analógico, leitor e fonte. Orçamento sem compromisso.',
    path: '/assistencia-tecnica',
    image: '/images/bancada-800.webp',
    jsonLd: perguntas.length ? [storeJsonLd(), faqJsonLd(perguntas)] : storeJsonLd(),
  });
  useWhatsAppMessage(pageWhatsappText('Assistência Técnica'));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found: { console?: string; problema?: string } = {};
    if (!form.console) found.console = 'Escolha o console.';
    if (!form.problema) found.problema = 'Escolha o problema.';
    setErrors(found);
    if (found.console || found.problema) {
      // Input/Select are plain function components (no ref forwarding), so focus the field by id.
      document.getElementById(found.console ? 'reparo-console' : 'reparo-problema')?.focus();
      return;
    }
    const link = whatsappLink(repairMessage(form));
    setSentLink(link);
    window.open(link, '_blank', 'noopener');
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Conserto de videogame em Joinville</h1>
        <p className="max-w-[70ch] text-muted">
          Fazemos conserto de videogame em Joinville para PlayStation, Xbox e Nintendo Switch, além de consoles retrô. O diagnóstico é feito na
          nossa bancada, com orçamento sem compromisso antes de qualquer reparo. Desde {storeConfig.anoFundacao} atendendo a cidade na{' '}
          {storeConfig.endereco.rua}, {storeConfig.endereco.bairro}.
        </p>
      </header>

      <section aria-labelledby="servicos">
        <h2 id="servicos" className="text-lg font-bold">
          Serviços e preços
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-40 w-full" />
                </li>
              ))
            : services.map((s) => (
                <li key={s.id} className="flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-card">
                  <h3 className="font-bold">{s.nome}</h3>
                  <p className="flex-1 text-sm text-muted">{s.descricao}</p>
                  <p className="font-bold text-brand">A partir de {formatPrice(s.aPartirDe)}</p>
                  <p className="text-sm text-muted">Prazo médio: {s.prazoMedio}</p>
                  <p className="text-sm text-muted">Garantia do serviço: {s.garantia}</p>
                </li>
              ))}
        </ul>
      </section>

      <img
        src="/images/bancada-800.webp"
        srcSet="/images/bancada-400.webp 400w, /images/bancada-800.webp 800w"
        sizes="(min-width: 1024px) 800px, 100vw"
        width={800}
        height={800}
        loading="lazy"
        decoding="async"
        alt="Bancada da assistência técnica com console aberto em reparo"
        className="w-full rounded-card object-cover"
      />

      <section aria-labelledby="orcamento" className="max-w-[560px]">
        <h2 id="orcamento" className="text-lg font-bold">
          Solicitar orçamento
        </h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Select
            id="reparo-console"
            label="Console"
            value={form.console}
            error={errors.console}
            options={[SELECIONE, ...CONSOLES.map((c) => ({ value: c, label: c }))]}
            onChange={(e) => setForm({ ...form, console: e.target.value })}
          />
          <Select
            id="reparo-problema"
            label="Problema"
            value={form.problema}
            error={errors.problema}
            options={[SELECIONE, ...services.map((s) => ({ value: s.nome, label: s.nome })), { value: 'Outro', label: 'Outro' }]}
            onChange={(e) => setForm({ ...form, problema: e.target.value })}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="reparo-como" className="text-sm font-bold">
              Como aconteceu? (opcional)
            </label>
            <textarea
              id="reparo-como"
              rows={3}
              value={form.comoAconteceu}
              onChange={(e) => setForm({ ...form, comoAconteceu: e.target.value })}
              className="rounded-card border border-border px-4 py-2 text-base"
            />
          </div>
          <Input id="reparo-nome" label="Nome (opcional)" autoComplete="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Button type="submit" variant="primary" size="lg" className="self-start">
            Pedir orçamento no WhatsApp
          </Button>
        </form>

        {sentLink ? (
          <div className="mt-4">
            <Alert tone="success" title="Pedido de orçamento enviado!">
              Se o WhatsApp não abriu,{' '}
              <a href={sentLink} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                use este link
              </a>
              .
            </Alert>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="faq-assistencia">
        <h2 id="faq-assistencia" className="text-lg font-bold">
          Perguntas frequentes
        </h2>
        <div className="mt-2">
          <Accordion items={perguntas.map((f, i) => ({ id: `faq-${i}`, title: f.pergunta, content: f.resposta }))} />
        </div>
      </section>
    </div>
  );
}
