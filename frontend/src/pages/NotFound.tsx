import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  useSeo({ title: 'Página não encontrada | Mateus Games', description: 'Página não encontrada na Mateus Games.', path: '/404', noindex: true });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <EmptyState icon="warning" title="Página não encontrada" text="O endereço acessado não existe ou foi removido.">
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/" className="font-bold text-brand hover:underline">
            Voltar para a página inicial
          </Link>
          <Link to="/busca" className="font-bold text-brand hover:underline">
            Ir para a busca
          </Link>
        </div>
      </EmptyState>
    </div>
  );
}
