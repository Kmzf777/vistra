import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { exigirPerfil } from "@/lib/dados/sessao";
import { classificarAgora, type ItemAgora, type LeadConversa } from "@/lib/fluxo/agora";
import type { Passo } from "@/lib/fluxo/passos";
import { preencher, saudacao } from "@/lib/mensagens/preencher";
import { traduzirErro } from "@/lib/resultado";

// Leituras das telas do vendedor. Tudo passa pelo RLS (a pessoa só lê os próprios leads),
// e mesmo assim cada consulta filtra por `dono_id`, porque o admin lê todos.

export type { LeadConversa };

export type LeadEmPasso = {
  lead: {
    id: string;
    nome: string;
    nicho: string | null;
    nota: number | null;
    avaliacoes: number | null;
    instagram: string | null;
    site: string | null;
    gancho: string | null;
    endereco: string | null;
    passo: Passo | null;
    etapa: string | null;
    estado: string;
    proximo_passo_em: string | null;
  };
  telefone: { e164: string; tipo: string } | null;
  abertura: string | null;
  robo: { rotulo: string; texto: string }[];
  principal: { mensagemId: number; partes: string[] } | null;
  acompanhamento: string | null;
  preco: string | null;
  /** Variáveis do texto que o perfil não preenche (hoje "nome" e "curso"). Não vazio bloqueia o envio. */
  faltando: string[];
  mesmoGrupo: string[];
  previa: { site_url: string | null; pdf_url: string | null } | null;
};

function falha(e: { code?: string; message?: string }): never {
  throw new Error(traduzirErro(e));
}

type LinhaConversa = {
  id: string;
  nome: string;
  passo: string | null;
  etapa: string | null;
  proximo_passo_em: string | null;
  ultima_atividade_em: string | null;
  nichos: { nome: string } | null;
};

function paraConversa(l: LinhaConversa): LeadConversa {
  return {
    id: l.id,
    nome: l.nome,
    nicho: l.nichos?.nome ?? null,
    passo: (l.passo as Passo | null) ?? null,
    etapa: l.etapa,
    proximo_passo_em: l.proximo_passo_em,
    ultima_atividade_em: l.ultima_atividade_em,
  };
}

const COLUNAS_CONVERSA = "id, nome, passo, etapa, proximo_passo_em, ultima_atividade_em, nichos(nome)";

export async function carregarInicio(): Promise<{
  cota: { abertas: number; limite: number };
  reservadoId: string | null;
  agora: ItemAgora[];
}> {
  const perfil = await exigirPerfil("/inicio");
  const sb = await criarClienteServidor();

  const [cota, leads] = await Promise.all([
    sb.rpc("minha_cota"),
    sb
      .from("leads")
      .select(`estado, ${COLUNAS_CONVERSA}`)
      .eq("dono_id", perfil.id)
      .in("estado", ["reservado", "em_conversa"]),
  ]);
  if (cota.error) falha(cota.error);
  if (leads.error) falha(leads.error);

  const linha = cota.data?.[0];
  const todos = (leads.data ?? []) as unknown as (LinhaConversa & { estado: string })[];
  const reservado = todos.find((l) => l.estado === "reservado");
  const conversas = todos.filter((l) => l.estado === "em_conversa").map(paraConversa);

  return {
    cota: { abertas: linha?.abertas_hoje ?? 0, limite: linha?.cota ?? perfil.cota_diaria },
    reservadoId: reservado?.id ?? null,
    agora: classificarAgora(conversas, new Date()),
  };
}

export async function carregarConversas(): Promise<LeadConversa[]> {
  const perfil = await exigirPerfil("/conversas");
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("leads")
    .select(COLUNAS_CONVERSA)
    .eq("dono_id", perfil.id)
    .in("estado", ["reservado", "em_conversa"])
    .order("ultima_atividade_em", { ascending: true, nullsFirst: true });
  if (error) falha(error);
  return ((data ?? []) as unknown as LinhaConversa[]).map(paraConversa);
}

export async function carregarLeadEmPasso(id: string): Promise<LeadEmPasso | null> {
  const perfil = await exigirPerfil(`/lead/${id}`);
  const sb = await criarClienteServidor();

  const { data: l, error } = await sb
    .from("leads")
    .select(
      "id, nome, nota, avaliacoes, instagram, site, gancho, endereco, passo, etapa, estado, proximo_passo_em, grupo, nicho_id, nichos(nome)",
    )
    .eq("id", id)
    .eq("dono_id", perfil.id)
    .in("estado", ["reservado", "em_conversa"])
    .maybeSingle();
  if (error) falha(error);
  if (!l) return null;

  const [tel, modelos, msg, grupo, previa] = await Promise.all([
    sb
      .from("telefones_lead")
      .select("e164, tipo")
      .eq("lead_id", id)
      .eq("tipo", "whatsapp")
      .is("invalido_em", null)
      .order("principal", { ascending: false })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    sb.from("modelos_mensagem").select("nicho_id, tipo, rotulo, texto, id").eq("ativo", true).order("id"),
    sb
      .from("mensagens_lead")
      .select("id, partes, versao")
      .eq("lead_id", id)
      .eq("status", "aprovada")
      .order("versao", { ascending: false })
      .limit(1)
      .maybeSingle(),
    l.grupo
      ? sb.from("leads").select("nome").eq("grupo", l.grupo).eq("dono_id", perfil.id).neq("id", id)
      : Promise.resolve({ data: [] as { nome: string }[], error: null }),
    sb
      .from("pedidos_previa")
      .select("site_url, pdf_url")
      .eq("lead_id", id)
      .order("pedido_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  for (const r of [tel, modelos, msg, grupo, previa]) if (r.error) falha(r.error);

  // O modelo do nicho do lead vale mais que o geral (nicho nulo), por tipo e rótulo.
  const doLead = new Map<string, { especifico: boolean; texto: string; tipo: string; rotulo: string }>();
  for (const m of modelos.data ?? []) {
    if (m.nicho_id !== null && m.nicho_id !== l.nicho_id) continue;
    const chave = `${m.tipo}|${m.rotulo}`;
    const atual = doLead.get(chave);
    const especifico = m.nicho_id !== null;
    if (!atual || (especifico && !atual.especifico)) {
      doLead.set(chave, { especifico, texto: m.texto, tipo: m.tipo, rotulo: m.rotulo });
    }
  }
  const modelosDoLead = [...doLead.values()];

  const faltando = new Set<string>();
  const vars = {
    nome: perfil.nome,
    curso: perfil.curso,
    artigo: perfil.artigo,
    negocio: l.nome,
    saudacao: saudacao(new Date()),
  };
  const montar = (texto: string): string => {
    const r = preencher(texto, vars);
    r.faltando.forEach((f) => faltando.add(f));
    return r.texto;
  };
  const primeiro = (tipo: string): string | null => {
    const m = modelosDoLead.find((x) => x.tipo === tipo);
    return m ? montar(m.texto) : null;
  };

  const e164 = tel.data?.e164 ?? null;

  return {
    lead: {
      id: l.id,
      nome: l.nome,
      nicho: (l.nichos as unknown as { nome: string } | null)?.nome ?? null,
      nota: l.nota,
      avaliacoes: l.avaliacoes,
      instagram: l.instagram,
      site: l.site,
      gancho: l.gancho,
      endereco: l.endereco,
      passo: (l.passo as Passo | null) ?? null,
      etapa: l.etapa,
      estado: l.estado,
      proximo_passo_em: l.proximo_passo_em,
    },
    telefone: e164 ? { e164, tipo: tel.data?.tipo ?? "whatsapp" } : null,
    abertura: primeiro("abertura"),
    robo: modelosDoLead
      .filter((m) => m.tipo === "robo")
      .map((m) => ({ rotulo: m.rotulo, texto: montar(m.texto) })),
    principal: msg.data ? { mensagemId: msg.data.id, partes: msg.data.partes.map(montar) } : null,
    acompanhamento: primeiro("acompanhamento"),
    preco: primeiro("preco"),
    faltando: [...faltando],
    mesmoGrupo: (grupo.data ?? []).map((g) => g.nome),
    previa: previa.data ? { site_url: previa.data.site_url, pdf_url: previa.data.pdf_url } : null,
  };
}
