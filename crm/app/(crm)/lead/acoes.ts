"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { abrirAcao } from "@/lib/dados/sessao";
import type { Acao } from "@/lib/fluxo/passos";
import { traduzirErro, type Resultado } from "@/lib/resultado";

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
