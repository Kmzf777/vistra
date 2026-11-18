export type Periodo = "hoje" | "semana" | "tudo";

const DESLOCAMENTO_MS = 3 * 3_600_000; // Brasília é UTC-3 o ano todo (sem horário de verão desde 2019)

/** Meia-noite de Brasília de hoje, ou da segunda-feira desta semana; `null` para "tudo". */
export function inicioDoPeriodo(p: Periodo, agora: Date): Date | null {
  if (p === "tudo") return null;
  const local = new Date(agora.getTime() - DESLOCAMENTO_MS);
  const diasAtras = p === "semana" ? (local.getUTCDay() + 6) % 7 : 0;
  const meiaNoite = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - diasAtras);
  return new Date(meiaNoite + DESLOCAMENTO_MS);
}

export function lerPeriodo(v: string | string[] | undefined): Periodo {
  const x = Array.isArray(v) ? v[0] : v;
  return x === "hoje" || x === "tudo" ? x : "semana";
}
