"use server";

import { revalidatePath } from "next/cache";
import { abrirAcao } from "@/lib/dados/sessao";
import { traduzirErro, type Resultado } from "@/lib/resultado";

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
