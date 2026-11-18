"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { gerarConvite, gerarLinkDeAcesso } from "@/lib/convite";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { abrirAcao } from "@/lib/dados/sessao";
import { traduzirErro, type Resultado } from "@/lib/resultado";
import { telefoneDoFormulario } from "@/lib/telefone";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function anexarPrevia(pedidoId: string, siteUrl: string, pdfUrl: string): Promise<Resultado> {
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("anexar_previa", { p_pedido_id: pedidoId, p_site_url: siteUrl, p_pdf_url: pdfUrl });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin/previas");
    revalidatePath("/inicio");
    revalidatePath("/funil");
    return { ok: true, recado: "Prévia anexada. O vendedor já vê no Início." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function marcarVendaPaga(vendaId: string, pagoEm: string): Promise<Resultado> {
  if (!DATA.test(pagoEm)) return { ok: false, erro: "Informe a data do pagamento." };
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("marcar_venda_paga", { p_venda_id: vendaId, p_pago_em: pagoEm });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin/vendas");
    return { ok: true, recado: "Pagamento marcado." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function marcarComissaoRepassada(vendaId: string, repassadoEm: string): Promise<Resultado> {
  if (!DATA.test(repassadoEm)) return { ok: false, erro: "Informe a data do repasse." };
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("marcar_comissao_repassada", { p_venda_id: vendaId, p_repassado_em: repassadoEm });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin/vendas");
    return { ok: true, recado: "Repasse marcado." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

// ---- Equipe, fila e configuração -------------------------------------------------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Endereço do próprio app, para o link do convite. */
async function baseDoApp(): Promise<string> {
  const h = await headers();
  const origem = h.get("origin");
  if (origem) return origem;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function convidarVendedor(dados: {
  email: string;
  nome: string;
  curso: string;
  artigo: string;
}): Promise<Resultado> {
  const email = dados.email.trim().toLowerCase();
  const nome = dados.nome.trim();
  const curso = dados.curso.trim();
  if (!EMAIL.test(email)) return { ok: false, erro: "Informe um e-mail válido." };
  if (!nome) return { ok: false, erro: "Informe o nome." };
  if (!curso) return { ok: false, erro: "Informe o curso." };
  if (dados.artigo !== "a" && dados.artigo !== "o") return { ok: false, erro: 'Escolha "Sou o" ou "Sou a".' };
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const r = await gerarConvite(criarClienteAdmin(), { email, nome, curso, artigo: dados.artigo }, await baseDoApp());
    if ("erro" in r) return { ok: false, erro: r.erro };
    return { ok: true, recado: r.link };
  } catch {
    return { ok: false, erro: "Não deu para gerar o link. Tente de novo." };
  }
}

export async function gerarAcesso(emailBruto: string): Promise<Resultado> {
  const email = emailBruto.trim().toLowerCase();
  if (!EMAIL.test(email)) return { ok: false, erro: "Informe um e-mail válido." };
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const r = await gerarLinkDeAcesso(criarClienteAdmin(), email, await baseDoApp());
    if ("erro" in r) return { ok: false, erro: r.erro };
    return { ok: true, recado: r.link };
  } catch {
    return { ok: false, erro: "Não deu para gerar o link. Tente de novo." };
  }
}

/** Corrige nome, curso e artigo ("Sou o" / "Sou a") de uma pessoa da equipe. */
export async function editarPerfil(
  perfilId: string,
  dados: { nome: string; curso: string; artigo: string },
): Promise<Resultado> {
  const nome = dados.nome.trim();
  const curso = dados.curso.trim();
  if (!nome) return { ok: false, erro: "Informe o nome." };
  if (!curso) return { ok: false, erro: "Informe o curso." };
  if (dados.artigo !== "a" && dados.artigo !== "o") return { ok: false, erro: 'Escolha "Sou o" ou "Sou a".' };
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("editar_perfil", {
      p_perfil_id: perfilId,
      p_nome: nome,
      p_curso: curso,
      p_artigo: dados.artigo,
    });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin");
    revalidatePath("/admin/equipe");
    return { ok: true, recado: "Perfil salvo." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function definirVendedor(perfilId: string, ativo: boolean, cota: number): Promise<Resultado> {
  if (!Number.isInteger(cota)) return { ok: false, erro: "A cota é um número inteiro." };
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("definir_vendedor", { p_perfil_id: perfilId, p_ativo: ativo, p_cota: cota });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin");
    revalidatePath("/admin/equipe");
    return { ok: true, recado: ativo ? "Pessoa salva." : "Pessoa desativada. Os leads dela foram para você." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function alternarFiltroFila(tipo: "cidade" | "nicho", id: string, ativo: boolean): Promise<Resultado> {
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("definir_filtro_fila", { p_tipo: tipo, p_id: id, p_ativo: ativo });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin/fila");
    return { ok: true, recado: ativo ? "Ligado na fila." : "Fora da fila." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function salvarConfiguracao(dados: {
  preco: number;
  piso: number;
  comissao: number;
  cotaPadrao: number;
  diasAcompanhamento: number;
  diasAlerta: number;
}): Promise<Resultado> {
  const valores = Object.values(dados);
  if (valores.some((v) => typeof v !== "number" || !Number.isFinite(v))) {
    return { ok: false, erro: "Confira os valores da configuração." };
  }
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("atualizar_configuracao", {
      p_preco: dados.preco,
      p_piso: dados.piso,
      p_comissao: dados.comissao,
      p_cota_padrao: dados.cotaPadrao,
      p_dias_acompanhamento: dados.diasAcompanhamento,
      p_dias_alerta: dados.diasAlerta,
    });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin/fila");
    revalidatePath("/admin");
    return { ok: true, recado: "Configuração salva." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function bloquearContato(telefone: string, placeId: string, motivo: string): Promise<Resultado> {
  // Mesma normalização do contato: "(34) 90000-0000" e "+55 34 90000-0000" viram o mesmo E.164 do bloqueio.
  const fone = telefoneDoFormulario(telefone);
  if ("erro" in fone) return { ok: false, erro: fone.erro };
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("bloquear", {
      p_telefone_e164: fone.e164 ?? (null as unknown as string),
      p_google_place_id: placeId.trim() || (null as unknown as string),
      p_motivo: motivo,
    });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin/fila");
    return { ok: true, recado: "Bloqueado para todos." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function descartarLead(leadId: string, motivo: string): Promise<Resultado> {
  const a = await abrirAcao({ admin: true });
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("descartar_lead", { p_lead_id: leadId, p_motivo: motivo });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/admin/fila");
    return { ok: true, recado: "Lead descartado." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}
