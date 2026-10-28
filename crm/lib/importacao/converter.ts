// Converte um lead de novos-aprovados.json para o formato da RPC importar_leads.
// Sem server-only e sem "@/", para o tsx também carregar.
import { normalizarTelefone } from "../telefone";

export type Veredito = "PODE_ABORDAR" | "SITE_QUEBRADO" | "TEM_SITE" | "FECHADO" | "DESCARTE_LEAD_FRACO" | "DUVIDA";

export type LeadRaspado = {
  id: string | null;
  nome: string;
  cat: string | null;
  tel: string | null;
  end: string | null;
  nota: string | number | null;
  aval: string | number | null;
  ig: string | null;
  seguidores: number | string | null;
  site: string | null;
  fechado: boolean | null;
  email: string | null;
  nicho: string | null;
  gancho: string | null;
  prioridade: number | null;
  veredito: Veredito | null;
  placeId: string | null;
  ig_ultimo_post: unknown;
};

export type LeadImportado = {
  origem_id: string | null;
  google_place_id: string | null;
  nome: string;
  cidade: string;
  uf: string;
  nicho: string | null;
  categoria: string | null;
  endereco: string | null;
  nota: number | null;
  avaliacoes: number | null;
  instagram: string | null;
  seguidores: number | null;
  seguidores_em: string | null;
  site: string | null;
  email: string | null;
  gancho: string | null;
  prioridade: number | null;
  grupo: string | null;
  telefones: { e164: string; tipo: "fixo" | "celular" | "whatsapp"; origem: string; principal: boolean }[];
  verificacao: { veredito: Veredito; evidencias: unknown[]; verificado_em: string; ferramenta: string } | null;
  estado_inicial: "no_poco" | "descartado";
  motivo_fim: string | null;
};

function numero(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const t = v.trim();
  // com vírgula, o ponto é milhar ("1.234,5"); sem vírgula, o ponto é decimal ("4.7")
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) ? n : null;
}

function texto(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

// Descartes que já nascem da verificação: o lead entra no banco, mas fora da fila.
const DESCARTE_POR_VEREDITO: Partial<Record<Veredito, string>> = {
  TEM_SITE: "tem_site",
  FECHADO: "fechado",
  DESCARTE_LEAD_FRACO: "lead_fraco",
};

export function converterLeadRaspado(
  cru: LeadRaspado,
  opcoes: { cidade: string; uf: string; verificadoEm: string },
): { lead: LeadImportado | null; aviso: string | null } {
  const nome = texto(cru.nome);
  if (!nome) return { lead: null, aviso: "lead sem nome" };

  const avisos: string[] = [];
  const telefones: LeadImportado["telefones"] = [];
  if (texto(cru.tel)) {
    const t = normalizarTelefone(cru.tel as string);
    // WhatsApp presumido: celular do Google vale como whatsapp e entra na fila; fixo fica fora.
    // Se o número estiver errado, o fluxo numero_errado resolve.
    if (t) telefones.push({ e164: t.e164, tipo: t.tipo === "celular" ? "whatsapp" : "fixo", origem: "google", principal: true });
    else avisos.push("telefone inválido");
  }

  let nota = numero(cru.nota);
  if (nota !== null && (nota < 0 || nota > 5)) {
    avisos.push(`nota fora de 0 a 5 (${String(cru.nota)})`);
    nota = null;
  }
  let prioridade: number | null = null;
  if (cru.prioridade !== null && cru.prioridade !== undefined) {
    if (Number.isInteger(cru.prioridade) && cru.prioridade >= 1 && cru.prioridade <= 4) prioridade = cru.prioridade;
    else avisos.push(`prioridade inválida (${String(cru.prioridade)})`);
  }
  const aval = numero(cru.aval);
  const seguidores = numero(cru.seguidores);

  const veredito = cru.veredito;
  const motivo = cru.fechado ? "fechado" : veredito ? (DESCARTE_POR_VEREDITO[veredito] ?? null) : null;

  const lead: LeadImportado = {
    origem_id: texto(cru.id),
    google_place_id: texto(cru.placeId),
    nome,
    cidade: opcoes.cidade,
    uf: opcoes.uf,
    nicho: texto(cru.nicho),
    categoria: texto(cru.cat),
    endereco: texto(cru.end),
    nota,
    avaliacoes: aval === null ? null : Math.max(0, Math.round(aval)),
    instagram: texto(cru.ig),
    seguidores: seguidores === null ? null : Math.max(0, Math.round(seguidores)),
    seguidores_em: seguidores === null ? null : opcoes.verificadoEm.slice(0, 10),
    site: texto(cru.site),
    email: texto(cru.email),
    gancho: texto(cru.gancho),
    prioridade,
    grupo: null,
    telefones,
    verificacao: veredito
      ? {
          veredito,
          evidencias: cru.ig_ultimo_post ? [{ ig_ultimo_post: cru.ig_ultimo_post }] : [],
          verificado_em: opcoes.verificadoEm,
          ferramenta: "verificar_sem_site.py",
        }
      : null,
    estado_inicial: motivo ? "descartado" : "no_poco",
    motivo_fim: motivo,
  };
  const aviso = avisos.length ? `${nome}: ${avisos.join("; ")}` : null;
  return { lead, aviso };
}
