// Avalia o arquivo de mensagens dos geradores (scripts/importar-mensagens.ts) antes de gravar.
// Puro: a busca dos leads e dos nichos no banco vem de fora. Sem "@/", para o tsx também carregar.
import { normalizarTelefone } from "../telefone";
import { validarEstiloTexto, validarMensagem } from "./validar";

export type TipoModelo = "abertura" | "robo" | "acompanhamento" | "preco";

export type ArquivoMensagens = {
  gerado_em: string;
  modelo: string;
  nichos?: { nome: string; dor: string; transformacao: string }[];
  modelos?: { nicho: string | null; tipo: TipoModelo; rotulo?: string; texto: string }[];
  mensagens: {
    lead: { google_place_id?: string; telefone?: string; origem_id?: string };
    partes: string[];
    whatsapp?: { numero: string; origem: string };
    observacao?: string;
  }[];
};

export type LeadDoArquivo = {
  nome: string;
  nota: number | null;
  avaliacoes: number | null;
  clinica: boolean;
};

/** Um item reprovado: onde está no arquivo (índice e tipo) e o porquê. Sem o texto da mensagem. */
export type Reprovada = { item: string; erros: string };

export type Avaliacao = {
  aEnviar: Record<string, unknown>[];
  reprovadas: Reprovada[];
  validas: number;
  semLead: number;
};

const TIPOS: readonly string[] = ["abertura", "robo", "acompanhamento", "preco"];

/** Todos os nomes de nicho que o arquivo cita (na seção nichos e nos modelos). */
export function nichosCitados(dados: ArquivoMensagens): string[] {
  const nomes = [...(dados.nichos ?? []).map((n) => n.nome), ...(dados.modelos ?? []).map((m) => m.nicho)];
  return [...new Set(nomes.filter((x): x is string => !!x))];
}

export function avaliarArquivo(
  dados: ArquivoMensagens,
  acharLead: (m: ArquivoMensagens["mensagens"][number], e164: string | undefined) => LeadDoArquivo | null,
  nichosBanco: Set<string>,
): Avaliacao {
  const aEnviar: Record<string, unknown>[] = [];
  const reprovadas: Reprovada[] = [];
  let validas = 0;
  let semLead = 0;

  dados.mensagens.forEach((m, idx) => {
    const fone = m.lead.telefone ? normalizarTelefone(m.lead.telefone)?.e164 : undefined;
    const lead = acharLead(m, fone);
    if (!lead) semLead++;
    const erros = validarMensagem(m.partes, {
      nota: lead?.nota ?? null,
      avaliacoes: lead?.avaliacoes ?? null,
      clinica: lead?.clinica ?? false,
    });
    let numero: string | undefined;
    if (m.whatsapp) {
      const n = normalizarTelefone(m.whatsapp.numero);
      if (!n) erros.push("whatsapp com número inválido");
      else numero = n.e164;
    }
    if (erros.length) {
      const rotulo = lead?.nome ?? m.lead.google_place_id ?? m.lead.origem_id ?? "sem identificador";
      reprovadas.push({ item: `mensagem ${idx + 1} (${rotulo})`, erros: erros.join("; ") });
      return;
    }
    validas++;
    aEnviar.push({
      lead: { ...m.lead, ...(fone ? { telefone: fone } : {}) },
      partes: m.partes,
      modelo: dados.modelo,
      observacao: m.observacao ?? null,
      ...(numero ? { whatsapp: { numero, origem: m.whatsapp?.origem ?? null } } : {}),
    });
  });

  // nichos: só existentes (nicho novo se cria antes, com scripts/criar-dominio.ts)
  for (const n of dados.nichos ?? []) {
    if (!nichosBanco.has(n.nome)) reprovadas.push({ item: `nicho "${n.nome}"`, erros: "não existe no banco" });
  }
  // modelos: nicho existente, tipo válido, texto não vazio e regras de estilo
  (dados.modelos ?? []).forEach((m, idx) => {
    const erros: string[] = [];
    if (!TIPOS.includes(m.tipo)) erros.push("tipo inválido");
    if (!m.texto || !m.texto.trim()) erros.push("texto vazio");
    else erros.push(...validarEstiloTexto(m.texto));
    if (m.nicho && !nichosBanco.has(m.nicho)) erros.push(`nicho "${m.nicho}" não existe no banco`);
    if (erros.length) {
      reprovadas.push({ item: `modelo ${idx + 1} (${m.tipo}${m.rotulo ? " " + m.rotulo : ""})`, erros: erros.join("; ") });
    }
  });

  return { aEnviar, reprovadas, validas, semLead };
}

/** Com qualquer reprovada, nada é gravado: nem modelos, nem mensagens. */
export function motivoParaNaoGravar(a: Avaliacao): string | null {
  if (a.reprovadas.length === 0) return null;
  return `Nada foi gravado: ${a.reprovadas.length} item(ns) reprovado(s). Corrija o arquivo e rode de novo.`;
}
