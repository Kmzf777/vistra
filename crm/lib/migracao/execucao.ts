// Regras da gravação da migração (scripts/migrar-dados.ts), sem rede e sem disco, para o vitest testar.

/** Com --gravar, --autor e --clientes são obrigatórios: sem clientes, quem já é cliente pode ser abordado. */
export function conferirOpcoes(o: { gravar: boolean; autor: string | null; clientes: string | null }): string | null {
  if (!o.gravar) return null;
  if (!o.autor) return "Com --gravar, informe --autor <email do admin>.";
  if (!o.clientes) {
    return "Com --gravar, informe --clientes <json local dos clientes>: sem ele, os clientes atuais não viram bloqueio e podem ser abordados.";
  }
  return null;
}

export type Problema = { origem_id: string; motivo: string };

/** Resultado de cada migrar_conversa: só 'migrada' e 'ja_migrada' estão bem; o resto é listado. */
export function resumirConversas(linhas: { origem_id: string; status: string | null; erro: string | null }[]): {
  migradas: number;
  jaMigradas: number;
  ignoradas: Problema[];
  falhas: Problema[];
} {
  let migradas = 0;
  let jaMigradas = 0;
  const ignoradas: Problema[] = [];
  const falhas: Problema[] = [];
  for (const l of linhas) {
    if (l.erro) falhas.push({ origem_id: l.origem_id, motivo: l.erro });
    else if (l.status === "migrada") migradas++;
    else if (l.status === "ja_migrada") jaMigradas++;
    else if (l.status?.startsWith("ignorada:")) ignoradas.push({ origem_id: l.origem_id, motivo: l.status });
    else falhas.push({ origem_id: l.origem_id, motivo: `status inesperado: ${l.status ?? "vazio"}` });
  }
  return { migradas, jaMigradas, ignoradas, falhas };
}

/** Leads que o importar_leads recusou (invalido:*), com o origem id. */
export function leadsComFalha(resultados: { origem_id: string | null; resultado: string }[]): Problema[] {
  return resultados
    .filter((r) => r.resultado.startsWith("invalido"))
    .map((r) => ({ origem_id: r.origem_id ?? "(sem origem)", motivo: r.resultado }));
}
