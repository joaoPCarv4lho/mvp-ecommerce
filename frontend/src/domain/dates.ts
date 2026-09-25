const DATE_FIELDS = new Set(['garantiaAte', 'dataLancamento', 'criadoEm', 'revisadoEm', 'inicio', 'fim', 'data']);
const REL = /^([+-])(\d+)d$/;

export const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function resolveDate(value: string, today: Date): string {
  const m = REL.exec(value);
  if (!m) return value;
  return addDays(toISODate(today), (m[1] === '-' ? -1 : 1) * Number(m[2]));
}

export function resolveSeedDates<T>(obj: T, today: Date): T {
  if (Array.isArray(obj)) return obj.map((x) => resolveSeedDates(x, today)) as T;
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, DATE_FIELDS.has(k) && typeof v === 'string' ? resolveDate(v, today) : resolveSeedDates(v, today)]),
    ) as T;
  }
  return obj;
}

export const formatDateBR = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
export const formatMonthYear = (iso: string) => { const [y, m] = iso.slice(0, 10).split('-'); return `${m}/${y}`; };
