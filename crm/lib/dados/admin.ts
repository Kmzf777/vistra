import "server-only";
import { exigirAdmin } from "@/lib/dados/sessao";
import { inicioDoPeriodo, type Periodo } from "@/lib/periodo";
import { traduzirErro } from "@/lib/resultado";
import { criarClienteServidor } from "@/lib/supabase/servidor";

function falha(e: { code?: string; message?: string }): never {
  throw new Error(traduzirErro(e));
}

export type LinhaPainel = {
  id: string;
  nome: string;
  ativo: boolean;
  ultimoAcesso: string | null;
  recebidos: number;
  aberturas: number;
  respostas: number;
  pedidosPrevia: number;
  vendas: number;
  comissaoAReceber: number;
  diasSemAbertura: number;
  parado: boolean;
};

/** Uma linha por perfil, admin incluso: o dono também prospecta. */
export async function carregarPainel(periodo: Periodo): Promise<{ ativos: LinhaPainel[]; inativos: LinhaPainel[]; alertaDias: number }> {
  await exigirAdmin();
  const sb = await criarClienteServidor();
  const desde = inicioDoPeriodo(periodo, new Date());
  const [painelR, configR] = await Promise.all([
    sb.rpc("painel_dono", { p_desde: (desde ? desde.toISOString() : null) as unknown as string }),
    sb.from("configuracao").select("dias_alerta_parado").maybeSingle(),
  ]);
  if (painelR.error) falha(painelR.error);
  if (configR.error) falha(configR.error);
  const linhas: LinhaPainel[] = (painelR.data ?? [])
    .map((l) => ({
      id: l.vendedor_id,
      nome: l.nome,
      ativo: l.ativo,
      ultimoAcesso: l.ultimo_acesso_em,
      recebidos: l.recebidos,
      aberturas: l.aberturas,
      respostas: l.respostas_pessoa,
      pedidosPrevia: l.pedidos_previa,
      vendas: l.vendas,
      comissaoAReceber: Number(l.comissao_a_receber),
      diasSemAbertura: l.dias_sem_abertura,
      parado: l.parado,
    }));
  return {
    ativos: linhas.filter((l) => l.ativo),
    inativos: linhas.filter((l) => !l.ativo),
    alertaDias: configR.data?.dias_alerta_parado ?? 2,
  };
}

export type PessoaEquipe = { id: string; nome: string; email: string; papel: string; ativo: boolean; cota: number; curso: string };

export async function carregarEquipe(): Promise<{ pessoas: PessoaEquipe[]; cotaPadrao: number }> {
  await exigirAdmin();
  const sb = await criarClienteServidor();
  const [pessoasR, configR] = await Promise.all([
    sb.from("perfis").select("id, nome, email, papel, ativo, cota_diaria, curso").order("nome"),
    sb.from("configuracao").select("cota_padrao").maybeSingle(),
  ]);
  if (pessoasR.error) falha(pessoasR.error);
  if (configR.error) falha(configR.error);
  return {
    pessoas: (pessoasR.data ?? []).map((p) => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      papel: p.papel,
      ativo: p.ativo,
      cota: p.cota_diaria,
      curso: p.curso,
    })),
    cotaPadrao: configR.data?.cota_padrao ?? 5,
  };
}

export type DadosFila = {
  cidades: { id: string; nome: string; uf: string; ativa: boolean }[];
  nichos: { id: string; nome: string; ativo: boolean }[];
  resumo: { cidade: string; nicho: string; prontos: number }[];
  config: {
    preco: number;
    piso: number;
    comissao: number;
    cotaPadrao: number;
    diasAcompanhamento: number;
    diasAlerta: number;
  };
};

export async function carregarFila(): Promise<DadosFila> {
  await exigirAdmin();
  const sb = await criarClienteServidor();
  const [cidadesR, nichosR, resumoR, configR] = await Promise.all([
    sb.from("cidades").select("id, nome, uf, ativa").order("nome"),
    sb.from("nichos").select("id, nome, ativo").order("nome"),
    sb.rpc("resumo_fila"),
    sb.from("configuracao").select("*").maybeSingle(),
  ]);
  if (cidadesR.error) falha(cidadesR.error);
  if (nichosR.error) falha(nichosR.error);
  if (resumoR.error) falha(resumoR.error);
  if (configR.error) falha(configR.error);
  const c = configR.data;
  return {
    cidades: cidadesR.data ?? [],
    nichos: nichosR.data ?? [],
    resumo: resumoR.data ?? [],
    config: {
      preco: Number(c?.preco_tabela ?? 497),
      piso: Number(c?.piso_referencia ?? 397),
      comissao: Number(c?.comissao_pct ?? 50),
      cotaPadrao: c?.cota_padrao ?? 5,
      diasAcompanhamento: c?.dias_acompanhamento ?? 2,
      diasAlerta: c?.dias_alerta_parado ?? 2,
    },
  };
}

export type LinhaVenda = {
  id: string;
  lead: string;
  vendedor: string;
  vendedorId: string;
  valor: number;
  forma: string;
  fechadoEm: string;
  pagoEm: string | null;
  comissao: number;
  repassadoEm: string | null;
};

export async function carregarVendas(): Promise<{ vendas: LinhaVenda[]; aReceber: { vendedor: string; total: number }[] }> {
  await exigirAdmin();
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("vendas")
    .select("id, valor, forma_pagamento, fechado_em, pago_em, comissao, repassado_em, vendedor_id, leads(nome), perfis!vendas_vendedor_id_fkey(nome)")
    .order("fechado_em", { ascending: false })
    .order("criado_em", { ascending: false })
    .limit(500);
  if (error) falha(error);
  const vendas: LinhaVenda[] = (data ?? []).map((v) => ({
    id: v.id,
    lead: (v.leads as unknown as { nome: string } | null)?.nome ?? "—",
    vendedor: (v.perfis as unknown as { nome: string } | null)?.nome ?? "—",
    vendedorId: v.vendedor_id,
    valor: Number(v.valor),
    forma: v.forma_pagamento,
    fechadoEm: v.fechado_em,
    pagoEm: v.pago_em,
    comissao: Number(v.comissao),
    repassadoEm: v.repassado_em,
  }));
  const soma = new Map<string, number>();
  for (const v of vendas) {
    if (v.pagoEm && !v.repassadoEm) soma.set(v.vendedor, (soma.get(v.vendedor) ?? 0) + v.comissao);
  }
  const aReceber = [...soma.entries()].map(([vendedor, total]) => ({ vendedor, total })).sort((a, b) => b.total - a.total);
  return { vendas, aReceber };
}
