// ==================================================================
// Tipos e contas do funil. Nada aqui renderiza.
//
// O funil mostra os leads do vendedor que já têm `etapa` (a partir do "sim"
// à prévia). As colunas vêm de `etapas_funil`. O relógio "parado há" é o
// tempo desde o maior entre `etapa_desde` e `ultima_atividade_em`.
// ==================================================================

import type { EventoLead } from "../lib/fluxo/eventos";

export type EtapaFunil = { slug: string; nome: string; terminal: boolean };

export type ContatoLead = { id: string; nome: string | null; cargo: string | null; telefone_e164: string | null };

export type VendaLead = { id: string; valor: number; forma_pagamento: string; fechado_em: string; comissao: number };

export type CartaoLead = {
  id: string;
  nome: string;
  nicho: string | null;
  instagram: string | null;
  site: string | null;
  /** WhatsApp do lead para o wa.me (E.164), vindo de `telefone_para_abertura`; nulo se não há ou está bloqueado. */
  telefone: string | null;
  /** Há WhatsApp válido, mas algum telefone ou o place id do lead foi bloqueado. */
  numeroBloqueado: boolean;
  etapa: string;
  /** Mais antigo primeiro. */
  contatos: ContatoLead[];
  /** Mais recente primeiro. */
  eventos: EventoLead[];
  previa: { site_url: string | null; pdf_url: string | null } | null;
  venda: VendaLead | null;
  /** ISO: quando o lead entrou na coluna em que está. */
  entrouEm: string | null;
  ultimaAtividadeEm: string | null;
  /** Horas desde o último sinal de vida. Calculado no servidor, para não divergir na hidratação. */
  paradoHoras: number;
};

export type LinhaLeadFunil = {
  id: string;
  nome: string;
  nicho: string | null;
  instagram: string | null;
  site: string | null;
  etapa: string;
  etapa_desde: string | null;
  ultima_atividade_em: string | null;
};

/** As ações que o vendedor tem em cada etapa. `fechou` abre o formulário da venda. */
export type AcaoEtapa = "negociando" | "fechou" | "perdeu";

export const HORAS_ATENCAO = 72; // 3 dias
export const HORAS_FRIO = 168; // 7 dias

export type Temperatura = "calmo" | "atencao" | "frio";

export function acoesDaEtapa(etapa: string): AcaoEtapa[] {
  if (etapa === "previa_pedida" || etapa === "previa_pronta") return ["perdeu"];
  if (etapa === "previa_enviada") return ["negociando", "fechou", "perdeu"];
  if (etapa === "negociando") return ["fechou", "perdeu"];
  return [];
}

/** "Pediu para não chamar mais" no painel do funil: só nas etapas em jogo (o lead ainda está em conversa). */
export function podePedirParar(etapa: string): boolean {
  return etapa === "previa_pedida" || etapa === "previa_pronta" || etapa === "previa_enviada" || etapa === "negociando";
}

/** A ação principal que aparece no cartão, sem abrir o painel. */
export function proximaAcao(etapa: string): AcaoEtapa | null {
  if (etapa === "previa_enviada") return "negociando";
  if (etapa === "negociando") return "fechou";
  return null;
}

export function temperatura(terminal: boolean, paradoHoras: number): Temperatura {
  if (terminal) return "calmo";
  if (paradoHoras >= HORAS_FRIO) return "frio";
  if (paradoHoras >= HORAS_ATENCAO) return "atencao";
  return "calmo";
}

/** "agora" / "há 5 h" / "há 12 d". */
export function rotuloTempo(paradoHoras: number): string {
  if (paradoHoras < 1) return "agora";
  if (paradoHoras < 24) return `há ${Math.floor(paradoHoras)} h`;
  return `há ${Math.floor(paradoHoras / 24)} d`;
}

function hora(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

export function montarCartoes(
  leads: LinhaLeadFunil[],
  extras: {
    telefones: Map<string, string>;
    contatos: (ContatoLead & { lead_id: string })[];
    eventos: (EventoLead & { lead_id: string })[];
    previas: Map<string, { site_url: string | null; pdf_url: string | null }>;
    vendas: Map<string, VendaLead>;
    /** Leads com número bloqueado: o cartão não leva link. */
    bloqueados?: Set<string>;
  },
  agora: number = Date.now(),
): CartaoLead[] {
  return leads.map((l) => {
    const contatos = extras.contatos.filter((c) => c.lead_id === l.id).map(({ lead_id: _, ...c }) => c);
    const eventos = extras.eventos
      .filter((e) => e.lead_id === l.id)
      .map(({ lead_id: _, ...e }) => e)
      .sort((a, b) => hora(b.criado_em) - hora(a.criado_em) || b.id - a.id);
    const entrou = hora(l.etapa_desde);
    const atividade = Math.max(entrou, hora(l.ultima_atividade_em));
    return {
      id: l.id,
      nome: l.nome,
      nicho: l.nicho,
      instagram: l.instagram,
      site: l.site,
      telefone: extras.bloqueados?.has(l.id) ? null : (extras.telefones.get(l.id) ?? null),
      numeroBloqueado: extras.bloqueados?.has(l.id) ?? false,
      etapa: l.etapa,
      contatos,
      eventos,
      previa: extras.previas.get(l.id) ?? null,
      venda: extras.vendas.get(l.id) ?? null,
      entrouEm: entrou ? new Date(entrou).toISOString() : null,
      ultimaAtividadeEm: atividade ? new Date(atividade).toISOString() : null,
      paradoHoras: atividade ? Math.max(0, (agora - atividade) / 3_600_000) : 0,
    };
  });
}

/** Cartões de uma coluna. Coluna de trabalho: o mais parado sobe. Coluna terminal: o mais recente sobe. */
export function cartoesDaEtapa(cartoes: CartaoLead[], etapa: EtapaFunil): CartaoLead[] {
  const sinal = etapa.terminal ? 1 : -1;
  return cartoes.filter((c) => c.etapa === etapa.slug).sort((a, b) => sinal * (a.paradoHoras - b.paradoHoras));
}
