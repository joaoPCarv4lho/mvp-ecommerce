import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText } from '../domain/whatsapp';
import { storeJsonLd } from '../seo/jsonld';
import { storeConfig } from '../config/storeConfig';
import { PixelIcon } from '../components/ui';
import type { PixelIconName } from '../components/ui';

const O_QUE_FAZEMOS: { icon: PixelIconName; title: string; text: string; to: string; cta: string }[] = [
  {
    icon: 'controller',
    title: 'Venda de consoles, jogos e acessórios',
    text: 'Novos, lacrados e usados revisados, com garantia da loja e retirada imediata em Joinville.',
    to: '/produtos',
    cta: 'Ver produtos',
  },
  {
    icon: 'swap',
    title: 'Troca do seu game',
    text: 'Avaliamos seu console ou jogo na hora e o valor vira crédito na loja ou dinheiro.',
    to: '/troque-seu-game',
    cta: 'Simular troca',
  },
  {
    icon: 'wrench',
    title: 'Assistência técnica própria',
    text: 'Limpeza, pasta térmica, porta HDMI, drift de analógico, leitor e fonte, com garantia do serviço.',
    to: '/assistencia-tecnica',
    cta: 'Ver serviços',
  },
];

export default function About() {
  const { endereco: e } = storeConfig;

  useSeo({
    title: `Sobre a ${storeConfig.nome} | Loja de videogames em Joinville`,
    description: `Desde ${storeConfig.anoFundacao} em Joinville: venda, troca e assistência técnica de consoles e jogos na ${storeConfig.nome}.`,
    path: '/sobre',
    image: '/images/loja-800.webp',
    jsonLd: storeJsonLd(),
  });
  useWhatsAppMessage(pageWhatsappText('Sobre'));

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Sobre a {storeConfig.nome}</h1>
        <p className="text-muted">
          Desde {storeConfig.anoFundacao}, a {storeConfig.nome} é uma loja de videogames de rua em Joinville. Começamos com uma bancada de conserto e
          uma prateleira de usados; hoje vendemos, trocamos e consertamos consoles de todas as gerações — sempre com quem entende do assunto atrás do
          balcão.
        </p>
        <p className="text-muted">
          Cada usado passa pela nossa assistência antes de ir para a vitrine: limpeza, teste completo e garantia da loja de{' '}
          {storeConfig.garantiaPadraoLojaDias} dias. É o mesmo cuidado que gostaríamos de encontrar como clientes.
        </p>
      </header>

      <img
        src="/images/loja-800.webp"
        srcSet="/images/loja-400.webp 400w, /images/loja-800.webp 800w"
        sizes="(min-width: 1024px) 800px, 100vw"
        width={800}
        height={800}
        loading="lazy"
        decoding="async"
        alt={`Fachada da loja ${storeConfig.nome} em ${e.cidade}`}
        className="w-full rounded-card object-cover"
      />

      <section aria-labelledby="o-que-fazemos">
        <h2 id="o-que-fazemos" className="text-lg font-bold">
          O que fazemos
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {O_QUE_FAZEMOS.map((item) => (
            <li key={item.title} className="flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-4">
              <PixelIcon name={item.icon} size={32} />
              <h3 className="font-bold">{item.title}</h3>
              <p className="flex-1 text-sm text-muted">{item.text}</p>
              <Link to={item.to} className="font-bold text-brand hover:underline">
                {item.cta}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="a-loja" className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
        <h2 id="a-loja" className="text-lg font-bold">
          A loja física
        </h2>
        <p>
          {e.rua} — {e.bairro}, {e.cidade}/{e.uf}, CEP {e.cep}
        </p>
        {storeConfig.horario.map((h) => (
          <p key={h.dias} className="text-muted">
            {h.dias}: {h.horas}
          </p>
        ))}
        <Link to="/contato" className="mt-2 font-bold text-brand hover:underline">
          Fale com a gente
        </Link>
      </section>
    </div>
  );
}
