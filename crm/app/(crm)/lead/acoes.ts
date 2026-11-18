"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { abrirAcao } from "@/lib/dados/sessao";
import type { Acao } from "@/lib/fluxo/passos";
import { traduzirErro, type Resultado } from "@/lib/resultado";
import { normalizarTelefone } from "@/lib/telefone";

const MOTIVOS = ["tem_site", "fechado", "fora_do_nicho", "outro"] as const;
type MotivoLargar = (typeof MOTIVOS)[number];

// O `redirect()` lança de propósito: por isso fica fora do try/catch.
export async function pegarProximoLead(): Promise<Resultado> {
  const a = await abrirAcao();
  if ("erro" in a) return { ok: false, erro: a.erro };

  let id: string | null = null;
  try {
    const { data, error } = await a.sb.rpc("proximo_lead");
    if (error) return { ok: false, erro: traduzirErro(error) };
    id = data;
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
  if (!id) return { ok: false, erro: "Não há lead disponível agora. Tente de novo mais tarde." };

  revalidatePath("/inicio");
  redirect(`/lead/${id}`);
}

export async function registrarAcao(leadId: string, acao: Acao, mensagemId?: number): Promise<Resultado> {
  const a = await abrirAcao();
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { data, error } = await a.sb.rpc("registrar_acao", {
      p_lead_id: leadId,
      p_acao: acao,
      ...(mensagemId !== undefined ? { p_mensagem_id: mensagemId } : {}),
    });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/inicio");
    revalidatePath("/conversas");
    revalidatePath("/funil");
    revalidatePath(`/lead/${leadId}`);
    return { ok: true, recado: data ?? "Feito." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function largarLead(leadId: string, motivo: MotivoLargar): Promise<Resultado> {
  if (!MOTIVOS.includes(motivo)) return { ok: false, erro: "Motivo inválido." };
  const a = await abrirAcao();
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("largar_lead", { p_lead_id: leadId, p_motivo: motivo });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidatePath("/inicio");
    revalidatePath("/conversas");
    revalidatePath(`/lead/${leadId}`);
    return { ok: true, recado: "Lead devolvido." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

function revalidarFunil(leadId: string) {
  revalidatePath("/funil");
  revalidatePath("/inicio");
  revalidatePath("/conversas");
  revalidatePath(`/lead/${leadId}`);
}

export async function moverEtapa(leadId: string, etapa: string): Promise<Resultado> {
  const a = await abrirAcao();
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("mover_etapa", { p_lead_id: leadId, p_etapa: etapa });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidarFunil(leadId);
    return { ok: true, recado: "Etapa atualizada." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

const FORMAS = ["pix", "boleto", "cartao", "dinheiro", "outro"] as const;

export async function registrarVenda(
  leadId: string,
  valor: number,
  forma: string,
  fechadoEm: string,
): Promise<Resultado> {
  if (!Number.isFinite(valor) || valor <= 0) return { ok: false, erro: "Informe o valor da venda." };
  if (!(FORMAS as readonly string[]).includes(forma)) return { ok: false, erro: "Escolha a forma de pagamento." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechadoEm)) return { ok: false, erro: "Informe a data do fechamento." };
  const a = await abrirAcao();
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("registrar_venda", {
      p_lead_id: leadId,
      p_valor: valor,
      p_forma: forma,
      p_fechado_em: fechadoEm,
    });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidarFunil(leadId);
    revalidatePath("/admin/vendas");
    return { ok: true, recado: "Venda registrada." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}

export async function salvarContato(leadId: string, nome: string, cargo: string, telefone: string): Promise<Resultado> {
  let e164 = "";
  if (telefone.trim()) {
    const n = normalizarTelefone(telefone);
    if (!n) return { ok: false, erro: "Telefone inválido. Use DDD e número, como (34) 90000-0000." };
    e164 = n.e164;
  }
  const a = await abrirAcao();
  if ("erro" in a) return { ok: false, erro: a.erro };
  try {
    const { error } = await a.sb.rpc("salvar_contato", {
      p_lead_id: leadId,
      p_nome: nome,
      p_cargo: cargo,
      p_telefone_e164: e164,
    });
    if (error) return { ok: false, erro: traduzirErro(error) };
    revalidarFunil(leadId);
    return { ok: true, recado: "Contato salvo." };
  } catch {
    return { ok: false, erro: traduzirErro(null) };
  }
}
