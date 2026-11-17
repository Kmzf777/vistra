import "server-only";
import { exigirPerfil } from "@/lib/dados/sessao";
import type { EventoLead } from "@/lib/fluxo/eventos";
import { traduzirErro } from "@/lib/resultado";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  montarCartoes,
  type CartaoLead,
  type ContatoLead,
  type EtapaFunil,
  type LinhaLeadFunil,
  type VendaLead,
} from "@/components/KanbanTipos";

export type DadosFunil = {
  etapas: EtapaFunil[];
  cartoes: CartaoLead[];
  precoTabela: number;
  pisoReferencia: number;
};

function falha(e: { code?: string; message?: string }): never {
  throw new Error(traduzirErro(e));
}

/** Os leads do vendedor que já têm etapa, com o que o cartão e o painel precisam. */
export async function carregarFunil(): Promise<DadosFunil> {
  const perfil = await exigirPerfil("/funil");
  const sb = await criarClienteServidor();

  const [etapasR, configR, leadsR] = await Promise.all([
    sb.from("etapas_funil").select("slug, nome, terminal").order("posicao"),
    sb.from("configuracao").select("preco_tabela, piso_referencia").maybeSingle(),
    sb
      .from("leads")
      .select("id, nome, instagram, site, etapa, etapa_desde, ultima_atividade_em, nichos(nome)")
      .eq("dono_id", perfil.id)
      .not("etapa", "is", null)
      .order("ultima_atividade_em", { ascending: false, nullsFirst: false })
      .limit(300),
  ]);
  if (etapasR.error) falha(etapasR.error);
  if (configR.error) falha(configR.error);
  if (leadsR.error) falha(leadsR.error);

  const etapas: EtapaFunil[] = (etapasR.data ?? []).map((e) => ({ slug: e.slug, nome: e.nome, terminal: e.terminal }));
  const leads: LinhaLeadFunil[] = (leadsR.data ?? []).map((l) => ({
    id: l.id,
    nome: l.nome,
    nicho: (l.nichos as unknown as { nome: string } | null)?.nome ?? null,
    instagram: l.instagram,
    site: l.site,
    etapa: l.etapa as string,
    etapa_desde: l.etapa_desde,
    ultima_atividade_em: l.ultima_atividade_em,
  }));
  const config = {
    precoTabela: Number(configR.data?.preco_tabela ?? 497),
    pisoReferencia: Number(configR.data?.piso_referencia ?? 397),
  };
  if (leads.length === 0) return { etapas, cartoes: [], ...config };

  const ids = leads.map((l) => l.id);
  const [tel, contatos, eventos, previas, vendas] = await Promise.all([
    sb
      .from("telefones_lead")
      .select("lead_id, e164")
      .in("lead_id", ids)
      .eq("tipo", "whatsapp")
      .is("invalido_em", null)
      .order("principal", { ascending: false })
      .order("id", { ascending: true }),
    sb.from("contatos").select("id, lead_id, nome, cargo, telefone_e164").in("lead_id", ids).order("criado_em"),
    sb
      .from("eventos_lead")
      .select("id, lead_id, tipo, dados, criado_em")
      .in("lead_id", ids)
      .order("criado_em", { ascending: false })
      .limit(800),
    sb
      .from("pedidos_previa")
      .select("lead_id, site_url, pdf_url, pedido_em")
      .in("lead_id", ids)
      .order("pedido_em", { ascending: false }),
    sb.from("vendas").select("id, lead_id, valor, forma_pagamento, fechado_em, comissao").in("lead_id", ids),
  ]);
  for (const r of [tel, contatos, eventos, previas, vendas]) if (r.error) falha(r.error);

  const telefones = new Map<string, string>();
  for (const t of tel.data ?? []) if (!telefones.has(t.lead_id)) telefones.set(t.lead_id, t.e164);
  const mapaPrevias = new Map<string, { site_url: string | null; pdf_url: string | null }>();
  for (const p of previas.data ?? []) {
    if (!mapaPrevias.has(p.lead_id)) mapaPrevias.set(p.lead_id, { site_url: p.site_url, pdf_url: p.pdf_url });
  }
  const mapaVendas = new Map<string, VendaLead>();
  for (const v of vendas.data ?? []) {
    mapaVendas.set(v.lead_id, {
      id: v.id,
      valor: Number(v.valor),
      forma_pagamento: v.forma_pagamento,
      fechado_em: v.fechado_em,
      comissao: Number(v.comissao),
    });
  }

  return {
    etapas,
    ...config,
    cartoes: montarCartoes(leads, {
      telefones,
      contatos: (contatos.data ?? []) as (ContatoLead & { lead_id: string })[],
      eventos: (eventos.data ?? []).map((e) => ({
        id: e.id,
        lead_id: e.lead_id,
        tipo: e.tipo,
        dados: (e.dados ?? {}) as EventoLead["dados"],
        criado_em: e.criado_em,
      })),
      previas: mapaPrevias,
      vendas: mapaVendas,
    }),
  };
}
