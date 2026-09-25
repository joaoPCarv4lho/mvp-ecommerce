import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText, whatsappLink } from '../domain/whatsapp';
import { storeJsonLd } from '../seo/jsonld';
import { storeConfig } from '../config/storeConfig';
import { PixelIcon } from '../components/ui';

const telHref = (telefone: string) => `tel:${telefone.replace(/[^\d+]/g, '')}`;

export default function Contact() {
  const { endereco: e } = storeConfig;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${storeConfig.geo.lat},${storeConfig.geo.lng}`;

  useSeo({
    title: `Contato | ${storeConfig.nome} em ${e.cidade}`,
    description: `Endereço, horário, telefone, WhatsApp e e-mail da ${storeConfig.nome}, em ${e.cidade}/${e.uf}.`,
    path: '/contato',
    jsonLd: storeJsonLd(),
  });
  useWhatsAppMessage(pageWhatsappText('Contato'));

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Contato</h1>
        <p className="text-muted">Prefere resolver pelo WhatsApp? Respondemos no horário da loja, de segunda a sábado.</p>
      </header>

      <section aria-labelledby="canais" className="flex flex-col gap-2">
        <h2 id="canais" className="text-lg font-bold">
          Canais de atendimento
        </h2>
        <ul className="flex flex-col gap-2">
          <li>
            <a
              href={whatsappLink(pageWhatsappText('Contato'))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 font-bold text-brand hover:underline"
            >
              <PixelIcon name="whatsapp" size={20} />
              Conversar no WhatsApp
            </a>
          </li>
          <li>
            <a href={telHref(storeConfig.telefone)} className="inline-flex min-h-11 items-center gap-2 font-bold text-brand hover:underline">
              <PixelIcon name="store" size={20} />
              {storeConfig.telefone}
            </a>
          </li>
          <li>
            <a href={`mailto:${storeConfig.email}`} className="inline-flex min-h-11 items-center gap-2 font-bold text-brand hover:underline">
              <PixelIcon name="heart" size={20} />
              {storeConfig.email}
            </a>
          </li>
          <li>
            <a
              href={storeConfig.redes.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 font-bold text-brand hover:underline"
            >
              <PixelIcon name="star" size={20} />
              Instagram da loja
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="endereco" className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
        <h2 id="endereco" className="text-lg font-bold">
          Onde estamos
        </h2>
        <address className="not-italic">
          {e.rua}
          <br />
          {e.bairro} — {e.cidade}/{e.uf}
          <br />
          CEP {e.cep}
        </address>
        {storeConfig.horario.map((h) => (
          <p key={h.dias} className="text-muted">
            {h.dias}: {h.horas}
          </p>
        ))}
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 font-bold text-brand hover:underline">
          Abrir no Google Maps
        </a>
      </section>

      <img
        src="/images/loja-800.webp"
        srcSet="/images/loja-400.webp 400w, /images/loja-800.webp 800w"
        sizes="(min-width: 1024px) 800px, 100vw"
        width={800}
        height={800}
        loading="lazy"
        decoding="async"
        alt={`Mapa ilustrativo da localização da ${storeConfig.nome} no ${e.bairro} de ${e.cidade}`}
        className="w-full rounded-card object-cover"
      />
    </div>
  );
}
