export function shippingQuote(cep: string): { valor: number; prazo: string } | null {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const n = Number(digits);
  if (n >= 89200000 && n <= 89239999) return { valor: 15, prazo: '1 dia útil' };
  if (n >= 88000000 && n <= 89999999) return { valor: 25, prazo: '2 a 3 dias úteis' };
  return { valor: 45, prazo: '5 a 8 dias úteis' };
}
