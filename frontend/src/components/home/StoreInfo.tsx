import { storeConfig } from '../../config/storeConfig';
import { Button, PixelIcon } from '../ui';

const enderecoTexto = (() => {
  const e = storeConfig.endereco;
  return `${e.rua}, ${e.bairro}, ${e.cidade} - ${e.uf}, ${e.cep}`;
})();

const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoTexto)}`;

/** Loja física (§6.1): endereço, horário, mapa placeholder e Instagram em destaque. */
export function StoreInfo() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-6 lg:grid-cols-2 lg:items-center">
        <img
          src="/images/loja-800.webp"
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          alt="Ilustração da fachada da loja Mateus Games em Joinville"
          className="h-auto w-full rounded-card object-cover"
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Visite a loja</h2>
          <p className="flex items-start gap-2">
            <PixelIcon name="store" size={20} />
            {enderecoTexto}
          </p>
          <ul className="flex flex-col gap-1 text-muted">
            {storeConfig.horario.map((h) => (
              <li key={h.dias}>
                {h.dias}: {h.horas}
              </li>
            ))}
          </ul>
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="font-bold text-brand hover:underline">
            Como chegar no Google Maps
          </a>
          <Button as="a" href={storeConfig.redes.instagram} target="_blank" rel="noopener noreferrer" variant="secondary" className="w-fit">
            Siga a Mateus Games no Instagram
          </Button>
        </div>
      </div>
    </section>
  );
}
