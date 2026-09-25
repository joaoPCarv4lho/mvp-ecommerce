import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiSource, MSG_OFFLINE, MSG_SUBMIT } from './source';
import type { OrderInput } from '../domain/types';

const respond = (status: number, body: unknown = {}) => vi.fn(async () => new Response(JSON.stringify(body), { status }));
const order = { itens: [], cliente: { nome: 'a', email: 'a', telefone: '1' }, entrega: { tipo: 'retirada' }, pagamento: { metodo: 'pix' } } as OrderInput;

afterEach(() => vi.unstubAllGlobals());

describe('apiSource', () => {
  it('getProduct 404 → null', async () => {
    vi.stubGlobal('fetch', respond(404));
    expect(await apiSource.getProduct('x')).toBeNull();
  });
  it('500 throws', async () => {
    vi.stubGlobal('fetch', respond(500));
    await expect(apiSource.getProduct('x')).rejects.toThrow('Falha ao carregar dados');
  });
  it('network error → PT-BR message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(apiSource.listProducts({})).rejects.toThrow(MSG_OFFLINE);
  });
  it('POST error uses string detail, else generic message', async () => {
    vi.stubGlobal('fetch', respond(422, { detail: 'Produto x não existe' }));
    await expect(apiSource.createOrder(order)).rejects.toThrow('Produto x não existe');
    vi.stubGlobal('fetch', respond(422, { detail: [{ msg: 'bad' }] }));
    await expect(apiSource.createOrder(order)).rejects.toThrow(MSG_SUBMIT);
  });
});
