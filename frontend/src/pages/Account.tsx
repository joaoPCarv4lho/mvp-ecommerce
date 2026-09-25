import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText } from '../domain/whatsapp';
import { Alert, Button, Input, toast } from '../components/ui';

/** Accounts are optional in the MVP (§6.5): this page only simulates the sign-up. */
export default function Account() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});

  useSeo({
    title: 'Minha conta | Mateus Games',
    description: 'Crie uma conta opcional para acompanhar seus pedidos na Mateus Games.',
    path: '/conta',
    noindex: true,
  });
  useWhatsAppMessage(pageWhatsappText('Minha conta'));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found: { email?: string; senha?: string } = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) found.email = 'Informe um e-mail válido, como nome@exemplo.com.';
    if (senha.length < 6) found.senha = 'A senha precisa de pelo menos 6 caracteres.';
    setErrors(found);
    const first = found.email ? 'conta-email' : found.senha ? 'conta-senha' : null;
    if (first) return document.getElementById(first)?.focus();
    setEmail('');
    setSenha('');
    toast('Conta criada (simulação)');
  }

  return (
    <div className="mx-auto max-w-[560px] px-4 py-8">
      <h1 className="text-2xl font-bold">Minha conta</h1>
      <p className="mt-2 text-muted">
        A conta é opcional: você compra sem cadastro e pode criar uma conta depois para acompanhar seus pedidos e agilizar as próximas compras.
      </p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          id="conta-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          id="conta-senha"
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          error={errors.senha}
          hint="Mínimo de 6 caracteres."
          onChange={(e) => setSenha(e.target.value)}
        />
        <Button type="submit" variant="primary" size="lg" className="self-start">
          Criar conta
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-2">
        <Alert tone="info">Cadastro simulado: nenhuma conta é criada de verdade neste MVP.</Alert>
        <Link to="/produtos" className="text-brand hover:underline">
          Voltar às compras
        </Link>
      </div>
    </div>
  );
}
