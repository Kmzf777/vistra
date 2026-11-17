// Planejador puro da migração do banco antigo para o novo. Sem rede, sem disco, sem server-only e sem "@/",
// para o tsx e o vitest carregarem. Decide o que entra, com qual estado e quais avisos o dono precisa ver.
import {
  converterLeadRaspado,
  type LeadImportado,
  type LeadRaspado,
  type Veredito,
} from "../importacao/converter";
import { normalizarTelefone } from "../telefone";

export type LeadAntigo = {
  id: string;
  nome: string;
  categoria: string | null;
  telefone: string | null;
  endereco: string | null;
  nota: number | string | null;
  avaliacoes: number | string | null;
  instagram: string | null;
  seguidores: number | string | null;
  site: string | null;
  fechado: boolean | null;
  origem: string | null;
  situacao: string;
  etapa: string | null;
  vendedor_id: string | null;
  atribuido_em: string | null;
  motivo_desqualificacao: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type LeadRevisado = LeadAntigo & {
  veredito: Veredito | null;
  evidencias: unknown;
  verificado_em: string | null;
  ig_ultimo_post?: unknown;
  ig_seguidores?: number | string | null;
  acao?: string | null;
};

export type ContatoAntigo = {
  id: string;
  lead_id: string;
  nome: string | null;
  cargo: string | null;
  telefone: string | null;
  e_decisor?: boolean | null;
  criado_em: string;
};

export type EventoAntigo = {
  id: string;
  lead_id: string;
  vendedor_id: string | null;
  tipo: string;
  nota: string | null;
  criado_em: string;
};

export type EntradasMigracao = {
  producao: {
    leads: LeadAntigo[];
    contatos: ContatoAntigo[];
    eventos: EventoAntigo[];
    perfis: { id: string; email: string }[];
  };
  export117: LeadAntigo[];
  backup71: LeadAntigo[];
  revisao: LeadRevisado[];
  aprovados: LeadRaspado[];
  clientes: { nome: string; telefone?: string; google_place_id?: string }[];
  donosNovos: Record<string, string>;
  adminId: string;
  // opcionais: data da verificação dos aprovados e cidade
  verificadoEmAprovados?: string;
  cidade?: string;
  uf?: string;
};

export type ConversaMigrada = {
  origem_id: string;
  dono_id: string;
  passo: "quem_respondeu" | "resultado";
  atribuido_em: string | null;
  contato: { nome: string; cargo: string; telefone_e164: string | null } | null;
  eventos: { tipo_antigo: string; nota: string; criado_em: string }[];
};

export type PlanoMigracao = {
  leads: LeadImportado[];
  conversas: ConversaMigrada[];
  bloqueios: { telefone_e164: string | null; google_place_id: string | null; motivo: "cliente" }[];
  avisos: string[];
  contagem: Record<string, number>;
};

const VERIFICADO_PADRAO = "2026-10-26T12:00:00.000Z";

function numero(v: number | string | null | undefined): number | string | null {
  return v === undefined || v === "" ? null : v;
}

// Veredito da revisão -> motivo do descarte. O resto vira "outro".
function motivoDoVeredito(v: Veredito | null | undefined): string {
  if (v === "TEM_SITE") return "tem_site";
  if (v === "DESCARTE_LEAD_FRACO") return "lead_fraco";
  if (v === "FECHADO") return "fechado";
  return "outro";
}

function paraRaspado(l: LeadAntigo, r: LeadRevisado | undefined): LeadRaspado {
  return {
    id: l.id,
    nome: l.nome,
    cat: l.categoria,
    tel: l.telefone,
    end: l.endereco,
    nota: numero(l.nota),
    aval: numero(l.avaliacoes),
    ig: l.instagram,
    seguidores: numero(l.seguidores),
    site: l.site,
    fechado: l.fechado ?? false,
    email: null,
    nicho: null,
    gancho: null,
    prioridade: null,
    veredito: r?.veredito ?? null,
    placeId: null,
    ig_ultimo_post: r?.ig_ultimo_post ?? null,
  };
}

function e164(bruto: string | null | undefined): string | null {
  return bruto ? (normalizarTelefone(bruto)?.e164 ?? null) : null;
}

export function montarPlanoMigracao(e: EntradasMigracao): PlanoMigracao {
  const cidade = e.cidade ?? "Uberlândia";
  const uf = e.uf ?? "MG";
  const avisos: string[] = [];
  const revisaoPorId = new Map(e.revisao.map((r) => [r.id, r]));
  const emProducao = new Set(e.producao.leads.map((l) => l.id));
  const universo117 = new Set([...e.export117, ...e.backup71].map((l) => l.id));
  const emailPorPerfil = new Map(e.producao.perfis.map((p) => [p.id, p.email.toLowerCase()]));

  const contatosPorLead = new Map<string, ContatoAntigo[]>();
  for (const c of [...e.producao.contatos].sort((a, b) => a.criado_em.localeCompare(b.criado_em))) {
    contatosPorLead.set(c.lead_id, [...(contatosPorLead.get(c.lead_id) ?? []), c]);
  }
  const eventosPorLead = new Map<string, EventoAntigo[]>();
  for (const ev of [...e.producao.eventos].sort((a, b) => a.criado_em.localeCompare(b.criado_em))) {
    eventosPorLead.set(ev.lead_id, [...(eventosPorLead.get(ev.lead_id) ?? []), ev]);
  }

  function converter(l: LeadAntigo): LeadImportado | null {
    const r = revisaoPorId.get(l.id);
    const { lead, aviso } = converterLeadRaspado(paraRaspado(l, r), {
      cidade,
      uf,
      verificadoEm: r?.verificado_em ?? VERIFICADO_PADRAO,
    });
    if (aviso) avisos.push(aviso);
    if (!lead) return null;
    lead.origem_id = l.id;
    // os 117 originais são pet shops; o que veio depois (manuais) não tem nicho conhecido
    if (universo117.has(l.id)) lead.nicho = "Pet shop";
    return lead;
  }

  // 1. ativos
  const leads: LeadImportado[] = [];
  const conversas: ConversaMigrada[] = [];
  let naoQualificados = 0;
  for (const l of e.producao.leads) {
    const lead = converter(l);
    if (!lead) {
      avisos.push(`${l.nome}: lead ativo ignorado, sem dados válidos`);
      continue;
    }
    if (l.situacao === "nao_qualificado") {
      naoQualificados++;
      lead.estado_inicial = "descartado";
      lead.motivo_fim = "outro";
      avisos.push(`${l.nome}: estava como não qualificado e entra descartado (outro)`);
    } else if (l.vendedor_id) {
      // 4. com dono: vira conversa; o lead nasce na fila e a RPC o põe em conversa
      if (lead.estado_inicial === "descartado") {
        avisos.push(`${l.nome}: tinha veredito de descarte, mas já estava em conversa e segue em conversa`);
      }
      lead.estado_inicial = "no_poco";
      lead.motivo_fim = null;
      const emailAntigo = emailPorPerfil.get(l.vendedor_id);
      const donoNovo = emailAntigo ? e.donosNovos[emailAntigo] : undefined;
      if (!donoNovo) avisos.push(`lead de ${l.nome} ficou com o admin`);
      const c = contatosPorLead.get(l.id) ?? [];
      if (c.length > 1) avisos.push(`${l.nome}: ${c.length} contatos, só o primeiro foi migrado`);
      conversas.push({
        origem_id: l.id,
        dono_id: donoNovo ?? e.adminId,
        passo: l.situacao === "qualificado" ? "resultado" : "quem_respondeu",
        atribuido_em: l.atribuido_em,
        contato: c[0]
          ? { nome: c[0].nome ?? "", cargo: c[0].cargo ?? "", telefone_e164: e164(c[0].telefone) }
          : null,
        eventos: (eventosPorLead.get(l.id) ?? []).map((ev) => ({
          tipo_antigo: ev.tipo,
          nota: ev.nota ?? "",
          criado_em: ev.criado_em,
        })),
      });
    }
    leads.push(lead);
  }

  // 2. descartados: no export ou no backup, mas fora da produção
  const vistos = new Set<string>();
  let descartados = 0;
  for (const l of [...e.export117, ...e.backup71]) {
    if (emProducao.has(l.id) || vistos.has(l.id)) continue;
    vistos.add(l.id);
    const lead = converter(l);
    if (!lead) continue;
    const veredito = revisaoPorId.get(l.id)?.veredito ?? null;
    const motivo = motivoDoVeredito(veredito);
    lead.estado_inicial = "descartado";
    lead.motivo_fim = motivo;
    if (motivo === "outro") {
      avisos.push(`${l.nome}: apagado à mão (veredito ${veredito ?? "sem revisão"}), entra descartado como outro`);
    }
    descartados++;
    leads.push(lead);
  }

  // 3. aprovados
  const porTelefone = new Map<string, LeadImportado>();
  for (const lead of leads) for (const t of lead.telefones) if (!porTelefone.has(t.e164)) porTelefone.set(t.e164, lead);
  let mesclados = 0;
  let pulados = 0;
  for (const cru of e.aprovados) {
    const { lead: novo, aviso } = converterLeadRaspado(cru, {
      cidade,
      uf,
      verificadoEm: e.verificadoEmAprovados ?? VERIFICADO_PADRAO,
    });
    if (aviso) avisos.push(aviso);
    if (!novo) continue;
    const alvo = novo.telefones.map((t) => porTelefone.get(t.e164)).find((x) => x !== undefined);
    if (alvo) {
      if (alvo.estado_inicial === "descartado") {
        pulados++;
        avisos.push(`${novo.nome} (${cru.id ?? "sem id"}): aprovado, mas o telefone é de um lead descartado; não entra`);
        continue;
      }
      // o ativo é o mesmo lead: ganha o place id e o enriquecimento do aprovado
      mesclados++;
      avisos.push(`${alvo.nome}: já era lead ativo e o aprovado ${cru.id ?? "sem id"} foi mesclado nele`);
      alvo.google_place_id = alvo.google_place_id ?? novo.google_place_id;
      alvo.nicho = novo.nicho ?? alvo.nicho;
      alvo.email = alvo.email ?? novo.email;
      alvo.gancho = novo.gancho ?? alvo.gancho;
      alvo.prioridade = novo.prioridade ?? alvo.prioridade;
      alvo.instagram = alvo.instagram ?? novo.instagram;
      alvo.site = alvo.site ?? novo.site;
      alvo.verificacao = novo.verificacao ?? alvo.verificacao;
      for (const t of novo.telefones) {
        if (!alvo.telefones.some((x) => x.e164 === t.e164)) alvo.telefones.push({ ...t, principal: false });
      }
      continue;
    }
    for (const t of novo.telefones) porTelefone.set(t.e164, novo);
    leads.push(novo);
  }

  // 5. clientes viram bloqueios
  const bloqueios: PlanoMigracao["bloqueios"] = [];
  for (const c of e.clientes) {
    const tel = e164(c.telefone);
    const place = c.google_place_id?.trim() || null;
    if (!tel && !place) {
      avisos.push(`${c.nome}: cliente sem telefone válido nem place id, não virou bloqueio`);
      continue;
    }
    bloqueios.push({ telefone_e164: tel, google_place_id: place, motivo: "cliente" });
  }

  const contagem: Record<string, number> = {
    ativos: e.producao.leads.length,
    descartados,
    aprovados: e.aprovados.length,
    mesclados,
    aprovados_pulados: pulados,
    nao_qualificados: naoQualificados,
    conversas: conversas.length,
    contatos: conversas.filter((c) => c.contato).length,
    eventos: conversas.reduce((s, c) => s + c.eventos.length, 0),
    bloqueios: bloqueios.length,
    leads: leads.length,
  };
  return { leads, conversas, bloqueios, avisos, contagem };
}
