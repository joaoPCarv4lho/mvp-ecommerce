import { useParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText } from '../domain/whatsapp';
import { storeConfig } from '../config/storeConfig';
import NotFound from './NotFound';

const { garantiaPadraoLojaDias: DIAS, nome, email, endereco } = storeConfig;

const POLICIES: Record<string, { title: string; description: string; paragraphs: string[] }> = {
  troca: {
    title: 'Política de trocas',
    description: `Como funcionam trocas e devoluções na ${nome}, dentro do Código de Defesa do Consumidor.`,
    paragraphs: [
      `Compras feitas no site podem ser devolvidas em até 7 dias corridos após o recebimento, por arrependimento, conforme o Código de Defesa do Consumidor. O produto precisa estar completo, com todos os acessórios e a embalagem original.`,
      `Produtos com defeito de fabricação podem ser trocados em até 30 dias corridos. Passado esse prazo, o atendimento segue pela garantia (loja ou fabricante), descrita na política de garantia.`,
      `Jogos e gift cards com lacre rompido ou código já revelado não podem ser trocados por arrependimento, porque o conteúdo digital já foi disponibilizado.`,
      `Para iniciar uma troca, fale com a gente pelo WhatsApp ou traga o produto na loja, na ${endereco.rua}, ${endereco.cidade}/${endereco.uf}. A conferência é feita na hora e, se tudo estiver certo, você escolhe entre outro produto, crédito na loja ou estorno.`,
      `O frete de devolução de produto com defeito é por nossa conta. Em devoluções por arrependimento, o custo do envio fica com o cliente.`,
    ],
  },
  garantia: {
    title: 'Política de garantia',
    description: `Garantia de ${DIAS} dias para usados revisados e garantia do fabricante para produtos novos na ${nome}.`,
    paragraphs: [
      `Todo produto usado vendido pela ${nome} passa pela nossa assistência antes de ir para a vitrine e sai da loja com ${DIAS} dias de garantia, contados a partir da data da compra.`,
      `A garantia da loja cobre defeitos de funcionamento: console que não liga, superaquecimento, leitor que não reconhece mídia, controle com drift e problemas de fonte, entre outros. Não cobre danos por queda, contato com líquidos, oxidação, uso de fontes fora do padrão nem violação do lacre de reparo.`,
      `Produtos novos e lacrados seguem a garantia do fabricante, normalmente de 12 meses, acionada diretamente com a marca. Ajudamos com o processo e guardamos a nota fiscal no seu histórico de compra.`,
      `Acessórios e serviços de assistência têm garantia própria, informada no orçamento e na página de cada serviço.`,
      `Para acionar a garantia, traga o produto e a nota fiscal na loja. O diagnóstico é feito pela nossa equipe e, quando o reparo não for possível, o produto é substituído por outro equivalente ou o valor é devolvido.`,
    ],
  },
  privacidade: {
    title: 'Política de privacidade',
    description: `Como a ${nome} usa os dados que você informa no site.`,
    paragraphs: [
      `Coletamos apenas os dados necessários para concluir o pedido e falar com você: nome, e-mail, celular e, quando há entrega, o endereço. Não é preciso criar conta para comprar.`,
      `Usamos esses dados para processar o pedido, avisar sobre o status e responder ao seu atendimento. Não vendemos nem compartilhamos suas informações com terceiros para publicidade.`,
      `Este site é um MVP demonstrativo: os pagamentos são simulados e nenhum dado de cartão é solicitado, processado ou armazenado.`,
      `Você pode pedir a consulta, correção ou exclusão dos seus dados a qualquer momento pelo e-mail ${email}, conforme a Lei Geral de Proteção de Dados (LGPD).`,
      `Usamos armazenamento do próprio navegador apenas para lembrar o que está no seu carrinho durante a visita. Esses dados ficam no seu dispositivo e não são enviados para nós.`,
    ],
  },
};

export default function Policy() {
  const { tipo = '' } = useParams();
  const policy = POLICIES[tipo];

  useSeo({
    title: policy ? `${policy.title} | ${nome}` : `Política não encontrada | ${nome}`,
    description: policy?.description ?? 'Política não encontrada.',
    path: `/politicas/${tipo}`,
    noindex: !policy,
  });
  useWhatsAppMessage(pageWhatsappText(policy?.title ?? 'Políticas'));

  if (!policy) return <NotFound />;

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">{policy.title}</h1>
      {policy.paragraphs.map((p) => (
        <p key={p.slice(0, 40)} className="text-muted">
          {p}
        </p>
      ))}
    </div>
  );
}
