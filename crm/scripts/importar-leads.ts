// Importa leads raspados (novos-aprovados.json) para o banco novo.
// Uso: npm run importar:leads -- --arquivo <json> [--autor <email do admin>] [--cidade Uberlândia --uf MG] [--verificado-em <ISO>] [--gravar]
// Sem --gravar não toca no banco: só converte e imprime contagens. Nunca imprime telefone.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { carregarAmbiente } from "./_ambiente";
import { converterLeadRaspado, type LeadImportado, type LeadRaspado } from "../lib/importacao/converter";

function valor(nome: string, padrao: string | null = null): string | null {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

function contar<T>(itens: T[], chave: (i: T) => string): Record<string, number> {
  const c: Record<string, number> = {};
  for (const i of itens) c[chave(i)] = (c[chave(i)] ?? 0) + 1;
  return c;
}

async function principal() {
  const arquivo = valor("--arquivo");
  if (!arquivo) throw new Error("Informe --arquivo <json>.");
  const gravar = process.argv.includes("--gravar");
  const cidade = valor("--cidade", "Uberlândia") as string;
  const uf = valor("--uf", "MG") as string;

  const cru = JSON.parse(fs.readFileSync(path.resolve(arquivo), "utf8"));
  if (!Array.isArray(cru)) throw new Error("O arquivo precisa ser uma lista de leads.");

  // data da verificação: --verificado-em, senão o mtime do arquivo (estável entre execuções)
  const informado = valor("--verificado-em");
  const verificadoEm = informado ? new Date(informado).toISOString() : fs.statSync(path.resolve(arquivo)).mtime.toISOString();
  const leads: LeadImportado[] = [];
  const avisos: string[] = [];
  for (const item of cru as LeadRaspado[]) {
    const { lead, aviso } = converterLeadRaspado(item, { cidade, uf, verificadoEm });
    if (lead) leads.push(lead);
    if (aviso) avisos.push(aviso);
  }

  console.log(`${leads.length} convertidos, ${avisos.length} avisos`);
  const porVeredito = contar(leads, (l) => l.verificacao?.veredito ?? "sem veredito");
  for (const [k, n] of Object.entries(porVeredito)) console.log(`  ${k}: ${n}`);
  for (const a of avisos) console.log(`  aviso: ${a}`);

  if (!gravar) {
    console.log("Simulação: nada foi gravado. Use --gravar para gravar.");
    return;
  }

  const email = valor("--autor");
  if (!email) throw new Error("Com --gravar, informe --autor <email do admin>.");
  const env = carregarAmbiente();
  const sb = createClient(env.url, env.secreta, { auth: { persistSession: false, autoRefreshToken: false } });

  // resolve o e-mail em id de perfil admin
  let autorId: string | null = null;
  for (let pagina = 1; !autorId; pagina++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw new Error(`listar usuários: ${error.message}`);
    autorId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    if (data.users.length < 200) break;
  }
  if (!autorId) throw new Error("Autor não encontrado.");
  const { data: perfil, error: errPerfil } = await sb.from("perfis").select("papel, ativo").eq("id", autorId).single();
  if (errPerfil || !perfil || perfil.papel !== "admin" || !perfil.ativo) throw new Error("O autor precisa ser um admin ativo.");

  const totais: Record<string, number> = {};
  for (let i = 0; i < leads.length; i += 100) {
    const lote = leads.slice(i, i + 100);
    const { data, error } = await sb.rpc("importar_leads", { p_autor: autorId, p_itens: lote });
    if (error) throw new Error(`importar_leads (lote ${i / 100 + 1}): ${error.message}`);
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
