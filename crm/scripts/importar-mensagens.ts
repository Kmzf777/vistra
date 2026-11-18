// Importa mensagens por lead e modelos gerais (arquivo local dos geradores) para o banco novo.
// Uso: npm run importar:mensagens -- --arquivo <json> [--autor <email do admin>] [--gravar]
// Sem --gravar não escreve no banco: valida e imprime o relatório. Nunca imprime telefone.
// Com --gravar e qualquer item reprovado, nada é gravado (nem modelos, nem mensagens) e o script sai com código 1.
// Nicho citado no arquivo precisa existir antes: crie com scripts/criar-dominio.ts.
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { carregarAmbiente } from "./_ambiente";
import { normalizarTelefone } from "../lib/telefone";
import { avaliarArquivo, motivoParaNaoGravar, nichosCitados, type ArquivoMensagens } from "../lib/mensagens/arquivo";

type LeadBanco = {
  nome: string;
  nota: number | null;
  avaliacoes: number | null;
  google_place_id: string | null;
  origem_id: string | null;
  nichos: { clinica: boolean } | null;
};

function valor(nome: string): string | null {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const SELECAO = "nome, nota, avaliacoes, google_place_id, origem_id, nichos(clinica)";

// Busca os leads do arquivo por place id, origem_id e telefone, em lotes.
async function buscarLeads(sb: SupabaseClient, itens: ArquivoMensagens["mensagens"]) {
  const porPlace = new Map<string, LeadBanco>();
  const porOrigem = new Map<string, LeadBanco>();
  const porFone = new Map<string, LeadBanco>();
  const lotes = <T,>(xs: T[]) => Array.from({ length: Math.ceil(xs.length / 100) }, (_, i) => xs.slice(i * 100, i * 100 + 100));

  const places = [...new Set(itens.map((i) => i.lead.google_place_id).filter((x): x is string => !!x))];
  for (const lote of lotes(places)) {
    const { data, error } = await sb.from("leads").select(SELECAO).in("google_place_id", lote);
    if (error) throw new Error(`buscar leads: ${error.message}`);
    for (const l of (data ?? []) as unknown as LeadBanco[]) if (l.google_place_id) porPlace.set(l.google_place_id, l);
  }
  const origens = [...new Set(itens.map((i) => i.lead.origem_id).filter((x): x is string => !!x))];
  for (const lote of lotes(origens)) {
    const { data, error } = await sb.from("leads").select(SELECAO).in("origem_id", lote);
    if (error) throw new Error(`buscar leads: ${error.message}`);
    for (const l of (data ?? []) as unknown as LeadBanco[]) if (l.origem_id) porOrigem.set(l.origem_id, l);
  }
  const fones = [...new Set(itens.map((i) => i.lead.telefone && normalizarTelefone(i.lead.telefone)?.e164).filter((x): x is string => !!x))];
  for (const lote of lotes(fones)) {
    const { data, error } = await sb.from("telefones_lead").select(`e164, leads(${SELECAO})`).in("e164", lote);
    if (error) throw new Error(`buscar telefones: ${error.message}`);
    for (const t of (data ?? []) as unknown as { e164: string; leads: LeadBanco | null }[]) if (t.leads) porFone.set(t.e164, t.leads);
  }
  return { porPlace, porOrigem, porFone };
}

async function principal() {
  const arquivo = valor("--arquivo");
  if (!arquivo) throw new Error("Informe --arquivo <json>.");
  const gravar = process.argv.includes("--gravar");
  const dados = JSON.parse(fs.readFileSync(path.resolve(arquivo), "utf8")) as ArquivoMensagens;
  if (!dados || !Array.isArray(dados.mensagens) || !dados.modelo) throw new Error("Arquivo inválido: faltam `modelo` e `mensagens`.");

  const env = carregarAmbiente();
  const sb = createClient(env.url, env.secreta, { auth: { persistSession: false, autoRefreshToken: false } });
  const { porPlace, porOrigem, porFone } = await buscarLeads(sb, dados.mensagens);

  const nomesNicho = nichosCitados(dados);
  const nichosBanco = new Set<string>();
  if (nomesNicho.length) {
    const { data, error } = await sb.from("nichos").select("nome").in("nome", nomesNicho);
    if (error) throw new Error(`buscar nichos: ${error.message}`);
    for (const n of data ?? []) nichosBanco.add(n.nome);
  }

  const avaliacao = avaliarArquivo(
    dados,
    (m, fone) => {
      const l =
        (m.lead.google_place_id && porPlace.get(m.lead.google_place_id)) ||
        (m.lead.origem_id && porOrigem.get(m.lead.origem_id)) ||
        (fone && porFone.get(fone)) ||
        null;
      return l ? { nome: l.nome, nota: l.nota, avaliacoes: l.avaliacoes, clinica: l.nichos?.clinica ?? false } : null;
    },
    nichosBanco,
  );
  const { aEnviar, reprovadas, validas, semLead } = avaliacao;

  console.log(`${validas} válidas, ${reprovadas.length} reprovadas, ${semLead} sem lead no banco`);
  for (const r of reprovadas) console.log(`  ${r.item}: ${r.erros}`);

  if (!gravar) {
    console.log("Simulação: nada foi gravado. Use --gravar para gravar.");
    return;
  }

  const motivo = motivoParaNaoGravar(avaliacao);
  if (motivo) {
    console.error(motivo);
    process.exitCode = 1;
    return;
  }

  const email = valor("--autor");
  if (!email) throw new Error("Com --gravar, informe --autor <email do admin>.");
  let autorId: string | null = null;
  for (let pagina = 1; !autorId; pagina++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw new Error(`listar usuários: ${error.message}`);
    autorId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    if (data.users.length < 200) break;
  }
  if (!autorId) throw new Error("Autor não encontrado.");

  if (dados.nichos?.length || dados.modelos?.length) {
    const { data, error } = await sb.rpc("importar_modelos", {
      p_autor: autorId,
      p_nichos: dados.nichos ?? [],
      p_modelos: (dados.modelos ?? []).map((m) => ({ ...m, rotulo: m.rotulo ?? "" })),
    });
    if (error) throw new Error(`importar_modelos: ${error.message}`);
    console.log(`Modelos gravados: ${data}`);
  }

  const totais: Record<string, number> = {};
  for (let i = 0; i < aEnviar.length; i += 100) {
    const { data, error } = await sb.rpc("importar_mensagens", { p_autor: autorId, p_itens: aEnviar.slice(i, i + 100) });
    if (error) throw new Error(`importar_mensagens (lote ${i / 100 + 1}): ${error.message}`);
    for (const r of data ?? []) totais[r.resultado] = (totais[r.resultado] ?? 0) + 1;
  }
  console.log("Resultado:");
  for (const [k, n] of Object.entries(totais)) console.log(`  ${k}: ${n}`);
}

(async () => {
  try {
    await principal();
  } catch (e) {
    console.error("Erro:", (e as Error).message);
    process.exitCode = 1;
  }
})();
