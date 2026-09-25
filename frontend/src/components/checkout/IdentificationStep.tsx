import { Input } from '../ui';
import type { ClienteForm, FieldErrors } from './types';

/** Guest checkout (§6.5): no password, no account required. */
export function IdentificationStep({
  cliente,
  errors,
  onChange,
}: {
  cliente: ClienteForm;
  errors: FieldErrors;
  onChange: (next: ClienteForm) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Identificação</h2>
      <p className="text-muted">Compra sem cadastro. Você pode criar uma conta depois, se quiser.</p>
      <Input
        id="nome"
        label="Nome completo"
        autoComplete="name"
        value={cliente.nome}
        error={errors.nome}
        onChange={(e) => onChange({ ...cliente, nome: e.target.value })}
      />
      <Input
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        value={cliente.email}
        error={errors.email}
        hint="Enviamos a confirmação do pedido para este e-mail."
        onChange={(e) => onChange({ ...cliente, email: e.target.value })}
      />
      <Input
        id="telefone"
        label="Celular (WhatsApp)"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="(47) 99999-0000"
        value={cliente.telefone}
        error={errors.telefone}
        onChange={(e) => onChange({ ...cliente, telefone: e.target.value })}
      />
    </div>
  );
}
