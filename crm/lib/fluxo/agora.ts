// A lista "Agora" do Início: o que pede ação do vendedor neste momento. Módulo puro.
import type { Passo } from "./passos";

export type LeadConversa = {
  id: string;
  nome: string;
  nicho: string | null;
  passo: Passo | null;
  etapa: string | null;
  proximo_passo_em: string | null;
  ultima_atividade_em: string | null;
};

export type ItemAgora = LeadConversa & {
  motivo: "previa_pronta" | "em_andamento" | "acompanhamento_vencido";
};

const ORDEM: ItemAgora["motivo"][] = ["previa_pronta", "em_andamento", "acompanhamento_vencido"];

function motivoDe(l: LeadConversa, agora: Date): ItemAgora["motivo"] | null {
  if (l.etapa === "previa_pronta") return "previa_pronta";
  if (l.passo === "robo" || l.passo === "principal" || l.passo === "resultado") return "em_andamento";
  if (l.passo === "acompanhamento" && l.proximo_passo_em && new Date(l.proximo_passo_em) <= agora) {
    return "acompanhamento_vencido";
  }
  return null;
}

function tempo(iso: string | null): number {
  // Sem atividade registrada conta como o mais parado.
  return iso ? new Date(iso).getTime() : 0;
}

export function classificarAgora(leads: LeadConversa[], agora: Date): ItemAgora[] {
  const itens: ItemAgora[] = [];
  for (const l of leads) {
    const motivo = motivoDe(l, agora);
    if (motivo) itens.push({ ...l, motivo });
  }
  return itens.sort(
    (a, b) =>
      ORDEM.indexOf(a.motivo) - ORDEM.indexOf(b.motivo) || tempo(a.ultima_atividade_em) - tempo(b.ultima_atividade_em),
  );
}
