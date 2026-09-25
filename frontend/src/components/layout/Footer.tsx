import { Link } from 'react-router-dom';
import { storeConfig } from '../../config/storeConfig';
import { PixelIcon } from '../ui';

const LINKS = [
  { label: 'Sobre', to: '/sobre' },
  { label: 'Contato', to: '/contato' },
  { label: 'Trocas e devoluções', to: '/politicas/troca' },
  { label: 'Garantia', to: '/politicas/garantia' },
  { label: 'Privacidade', to: '/politicas/privacidade' },
  { label: 'Assistência', to: '/assistencia-tecnica' },
  { label: 'Troque seu Game', to: '/troque-seu-game' },
];

const PAGAMENTOS = ['Pix', 'Cartão em até 12x', 'Dinheiro'];

const linkCls = 'inline-flex min-h-11 items-center rounded-card hover:underline';
const headingCls = 'mb-2 text-base font-bold text-white';

export function Footer() {
  const { endereco: e, avaliacaoGoogle: g } = storeConfig;
  return (
    <footer className="mt-12 bg-brand-strong text-white [&_:focus-visible]:outline-white">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <nav aria-labelledby="footer-links">
          <h2 id="footer-links" className={headingCls}>Links úteis</h2>
          <ul className="grid grid-cols-2 gap-x-4 text-sm sm:grid-cols-1">
            {LINKS.map((l) => (
              <li key={l.to}><Link to={l.to} className={linkCls}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={headingCls}>Formas de pagamento</h2>
          <ul className="flex flex-wrap gap-2">
            {PAGAMENTOS.map((p) => (
              <li key={p} className="rounded-card border border-white px-2 py-1 text-xs font-bold">{p}</li>
            ))}
          </ul>
          <h2 className={`${headingCls} mt-6`}>Redes</h2>
          <ul className="flex gap-4 text-sm">
            <li><a href={storeConfig.redes.instagram} rel="noopener" className={linkCls}>Instagram</a></li>
            <li><a href={storeConfig.redes.facebook} rel="noopener" className={linkCls}>Facebook</a></li>
          </ul>
        </div>

        <div>
          <h2 className={headingCls}>Loja em {e.cidade}</h2>
          <address className="text-sm not-italic">
            {e.rua}<br />
            {e.bairro} · {e.cidade}/{e.uf}<br />
            CEP {e.cep}
          </address>
          <ul className="mt-2 text-sm">
            {storeConfig.horario.map((h) => (
              <li key={h.dias}>{h.dias}: {h.horas}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={headingCls}>Avaliações</h2>
          <p className="inline-flex items-center gap-2 rounded-card bg-white px-4 py-2 text-sm font-bold text-brand">
            <PixelIcon name="star" size={20} />
            Nota {g.nota.toLocaleString('pt-BR')} no Google · {g.total} avaliações
          </p>
        </div>
      </div>
      <div className="border-t border-brand">
        <p className="mx-auto max-w-[1200px] px-4 py-4 text-xs">
          © {new Date().getFullYear()} {storeConfig.nome} · Desde {storeConfig.anoFundacao}
        </p>
      </div>
    </footer>
  );
}
