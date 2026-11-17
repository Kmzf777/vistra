// Rótulos em português dos eventos de `eventos_lead`. Módulo puro.

export type EventoLead = {
  id: number;
  tipo: string;
  dados: Record<string, unknown>;
  criado_em: string;
};

const ROTULOS: Record<string, string> = {
  recebeu: "Recebeu o lead",
  abertura_enviada: "Abertura enviada",
  numero_errado: "Número errado ou sem WhatsApp",
  robo: "Caiu no robô",
  pessoa_respondeu: "Uma pessoa respondeu",
  sem_resposta: "Sem resposta",
  acompanhamento_enviado: "Acompanhamento enviado",
  principal_enviada: "Mensagem principal enviada",
  perguntou: "Perguntou o preço",
  sem_interesse: "Sem interesse",
  previa_pedida: "Quer ver a prévia",
  previa_pronta: "Prévia pronta",
  previa_enviada: "Prévia enviada",
  etapa: "Mudou de etapa",
  venda: "Venda fechada",
  largou: "Largou o lead",
  descartou: "Lead descartado",
  bloqueou: "Pediu para parar",
  reserva_venceu: "Reserva venceu",
  reatribuido: "Passou para outra pessoa",
  importado: "Lead importado",
  migrado: "Veio do sistema antigo",
  contato: "Contato salvo",
};

export function rotuloEvento(e: Pick<EventoLead, "tipo" | "dados">, nomeEtapa: (slug: string) => string): string {
  if (e.tipo === "etapa") {
    const de = typeof e.dados.de === "string" ? nomeEtapa(e.dados.de) : null;
    const para = typeof e.dados.para === "string" ? nomeEtapa(e.dados.para) : null;
    if (de && para) return `Etapa: ${de} para ${para}`;
  }
  return ROTULOS[e.tipo] ?? e.tipo;
}
