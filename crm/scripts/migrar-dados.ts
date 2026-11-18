// Migra os dados do banco antigo para o novo.
// Uso: npm run migrar -- [--autor <email do admin>] [--clientes <json local>] [--env-antigo <arquivo>] [--dados <pasta>] [--gravar]
// Sem --gravar nada é escrito no banco: lê o antigo só com GET, monta o plano, imprime contagem, avisos e
// totais, e grava o plano completo em <dados>/plano-migracao-<data>.json, só depois de o `git check-ignore`
// confirmar que o arquivo está ignorado (o repositório é público).
// Com --gravar, --autor e --clientes são obrigatórios. Toda conversa que não sair 'migrada' ou 'ja_migrada' e todo
// lead recusado são listados pelo origem id, e o script sai com código 1.
// Nunca imprime telefone. Nomes de lead aparecem só nos avisos locais.
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { carregarAmbiente, lerAmbienteAntigo } from "./_ambiente";
import {
  montarPlanoMigracao,
  type ContatoAntigo,
  type EventoAntigo,
  type LeadAntigo,
  type LeadRevisado,
} from "../lib/migracao/plano";
import type { LeadRaspado } from "../lib/importacao/converter";
import { conferirOpcoes, leadsComFalha, resumirConversas, type Problema } from "../lib/migracao/execucao";
import { confirmarIgnoradoPeloGit } from "./_git";

const RAIZ = path.resolve(__dirname, "..");

function valor(nome: string, padrao: string | null = null): string | null {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

function lerJson(arquivo: string): unknown {
  return JSON.parse(fs.readFileSync(arquivo, "utf8"));
}

function lista<T>(cru: unknown, chave?: string): T[] {
  const v = Array.isArray(cru) ? cru : chave ? (cru as Record<string, unknown>)[chave] : null;
  if (!Array.isArray(v)) throw new Error(`Arquivo inesperado: esperava uma lista${chave ? ` em .${chave}` : ""}.`);
  return v as T[];
}

// Leitura do banco antigo: só GET (select), 1.000 linhas por página.
async function lerTudo<T>(sb: SupabaseClient, tabela: string, colunas: string, ordem: string): Promise<T[]> {
  const todos: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from(tabela).select(colunas).order(ordem).range(de, de + 999);
    if (error) throw new Error(`ler ${tabela}: ${error.message}`);
    todos.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return todos;
}

async function principal() {
  const gravar = process.argv.includes("--gravar");
  const autor = valor("--autor");
  const arquivoClientes = valor("--clientes");
  const erroOpcoes = conferirOpcoes({ gravar, autor, clientes: arquivoClientes });
  if (erroOpcoes) throw new Error(erroOpcoes);
  const dados = path.resolve(valor("--dados", path.resolve(RAIZ, "..", "prospeccao", "leads", "uberlandia")) as string);
  const arquivoAntigo = valor("--env-antigo");

  // arquivos locais
  const export117 = lista<LeadAntigo>(lerJson(path.join(dados, "crm-export.json")));
  const backup71 = lista<LeadAntigo>(lerJson(path.join(dados, "crm-backup-antes-limpeza-2026-10-26.json")), "leads");
  const revisao = lista<LeadRevisado>(lerJson(path.join(dados, "crm-revisao.json")), "leads");
  const arqAprovados = path.join(dados, "novos-aprovados.json");
  const aprovados = lista<LeadRaspado>(lerJson(arqAprovados));
  const clientes = arquivoClientes
    ? lista<{ nome: string; telefone?: string; google_place_id?: string }>(lerJson(path.resolve(arquivoClientes)))
    : [];

  // banco antigo, só leitura
  const antigo = lerAmbienteAntigo(arquivoAntigo ? path.resolve(arquivoAntigo) : undefined);
  const sbAntigo = createClient(antigo.url, antigo.serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const leads = await lerTudo<LeadAntigo>(sbAntigo, "leads", "*", "id");
  const contatos = await lerTudo<ContatoAntigo>(sbAntigo, "contatos", "*", "id");
  const eventos = await lerTudo<EventoAntigo>(sbAntigo, "eventos", "*", "id");
  const perfis = await lerTudo<{ id: string; email: string }>(sbAntigo, "perfis", "id,email", "id");

  // banco novo: usuários já convidados (leitura)
  const env = carregarAmbiente();
  const sb = createClient(env.url, env.secreta, { auth: { persistSession: false, autoRefreshToken: false } });
  const donosNovos: Record<string, string> = {};
  let autorId: string | null = null;
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw new Error(`listar usuários: ${error.message}`);
    for (const u of data.users) {
      if (!u.email) continue;
      donosNovos[u.email.toLowerCase()] = u.id;
      if (autor && u.email.toLowerCase() === autor.toLowerCase()) autorId = u.id;
    }
    if (data.users.length < 200) break;
  }
  if (gravar) {
    if (!autorId) throw new Error("Autor não encontrado.");
    const { data: perfil, error } = await sb.from("perfis").select("papel, ativo").eq("id", autorId).single();
    if (error || !perfil || perfil.papel !== "admin" || !perfil.ativo) throw new Error("O autor precisa ser um admin ativo.");
  }

  const plano = montarPlanoMigracao({
    producao: { leads, contatos, eventos, perfis },
    export117,
    backup71,
    revisao,
    aprovados,
    clientes,
    donosNovos,
    adminId: autorId ?? "ADMIN-A-DEFINIR",
    verificadoEmAprovados: fs.statSync(arqAprovados).mtime.toISOString(),
  });

  console.log("Contagem:");
  for (const [k, n] of Object.entries(plano.contagem)) console.log(`  ${k}: ${n}`);
  const porMotivo: Record<string, number> = {};
  for (const l of plano.leads) {
    if (l.estado_inicial === "descartado") porMotivo[l.motivo_fim ?? "?"] = (porMotivo[l.motivo_fim ?? "?"] ?? 0) + 1;
  }
  console.log("Descartados por motivo:");
  for (const [k, n] of Object.entries(porMotivo)) console.log(`  ${k}: ${n}`);
  console.log(`Avisos (${plano.avisos.length}):`);
  for (const a of plano.avisos) console.log(`  - ${a}`);

  if (!gravar) {
    const arquivo = path.join(dados, `plano-migracao-${new Date().toISOString().slice(0, 10)}.json`);
    const ignorado = confirmarIgnoradoPeloGit(arquivo);
    if (!ignorado.ok) {
      console.error(`Plano NÃO gravado: ${ignorado.motivo}. Use --dados numa pasta ignorada pelo git (prospeccao/leads/...).`);
      process.exitCode = 1;
    } else {
      fs.writeFileSync(arquivo, JSON.stringify(plano, null, 2));
      console.log(`Plano completo gravado em ${arquivo} (ignorado pelo git, conferido com git check-ignore).`);
    }
    console.log("Simulação: nada foi gravado no banco. Use --gravar para gravar.");
    return;
  }

  // 1. todos os leads
  const idPorOrigem = new Map<string, string>();
  const totais: Record<string, number> = {};
  const resultadosLeads: { origem_id: string | null; resultado: string }[] = [];
  for (let i = 0; i < plano.leads.length; i += 100) {
    const lote = plano.leads.slice(i, i + 100);
    const { data, error } = await sb.rpc("importar_leads", { p_autor: autorId, p_itens: lote });
    if (error) throw new Error(`importar_leads (lote ${i / 100 + 1}): ${error.message}`);
    for (const r of (data ?? []) as { indice: number; lead_id: string | null; resultado: string }[]) {
      totais[r.resultado] = (totais[r.resultado] ?? 0) + 1;
      const origem = lote[r.indice]?.origem_id ?? null;
      resultadosLeads.push({ origem_id: origem, resultado: r.resultado });
      if (origem && r.lead_id) idPorOrigem.set(origem, r.lead_id);
    }
  }
  console.log("importar_leads:");
  for (const [k, n] of Object.entries(totais)) console.log(`  ${k}: ${n}`);
  const leadsRecusados = leadsComFalha(resultadosLeads);

  // 2. conversas: cada uma diz o que aconteceu ('migrada', 'ja_migrada' ou 'ignorada:<estado>')
  const linhas: { origem_id: string; status: string | null; erro: string | null }[] = [];
  for (const c of plano.conversas) {
    const leadId = idPorOrigem.get(c.origem_id);
    if (!leadId) {
      linhas.push({ origem_id: c.origem_id, status: null, erro: "sem lead no banco novo (importar_leads não devolveu id)" });
      continue;
    }
    const { data, error } = await sb.rpc("migrar_conversa", {
      p_lead_id: leadId,
      p_dono: c.dono_id,
      p_passo: c.passo,
      p_contato: c.contato,
      p_eventos: c.eventos,
      p_atribuido_em: c.atribuido_em,
    });
    linhas.push({ origem_id: c.origem_id, status: error ? null : (data ?? null), erro: error ? error.message : null });
  }
  const conversas = resumirConversas(linhas);
  console.log(
    `conversas: ${conversas.migradas} migradas, ${conversas.jaMigradas} já migradas, ` +
      `${conversas.ignoradas.length} ignoradas, ${conversas.falhas.length} falhas`,
  );

  // 3. clientes viram bloqueios; o índice único parcial recusa duplicado (23505), que conta como já existente
  let novos = 0;
  let jaExistiam = 0;
  for (const b of plano.bloqueios) {
    const { error } = await sb.from("bloqueios").insert({ ...b, origem: "migracao", criado_por: autorId });
    if (!error) novos++;
    else if (error.code === "23505") jaExistiam++;
    else throw new Error(`bloqueio: ${error.message}`);
  }
  console.log(`bloqueios: ${novos} novos, ${jaExistiam} já existiam`);

  // 4. o que precisa de atenção, pelo origem id (sem telefone)
  const listar = (titulo: string, xs: Problema[]) => {
    if (xs.length === 0) return;
    console.log(`${titulo} (${xs.length}):`);
    for (const x of xs) console.log(`  - origem ${x.origem_id}: ${x.motivo}`);
  };
  listar("Leads recusados pelo importar_leads", leadsRecusados);
  listar("Conversas ignoradas", conversas.ignoradas);
  listar("Conversas com falha", conversas.falhas);
  const problemas = leadsRecusados.length + conversas.ignoradas.length + conversas.falhas.length;
  if (problemas > 0) {
    console.error(`Migração com ${problemas} pendência(s). Não rode importar:mensagens --gravar até zerar falhas e ignoradas.`);
    process.exitCode = 1;
  } else {
    console.log("Migração sem pendências: falhas 0, ignoradas 0.");
  }
}

(async () => {
  try {
    await principal();
  } catch (e) {
    console.error("Erro:", (e as Error).message);
    process.exitCode = 1;
  }
})();
