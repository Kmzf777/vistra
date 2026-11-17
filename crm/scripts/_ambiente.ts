// Lê as credenciais dos scripts sem escrever em process.env e sem imprimir valores.
import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

const RAIZ = path.resolve(__dirname, "..");

function ler(arquivo: string): Record<string, string | undefined> {
  return parseEnv(fs.readFileSync(arquivo, "utf8"));
}

function exigir(vars: Record<string, string | undefined>, nome: string): string {
  const valor = vars[nome];
  if (!valor) throw new Error(`Variável ${nome} faltando no arquivo de ambiente.`);
  return valor;
}

export function carregarAmbiente(arquivo = path.join(RAIZ, ".env.novo.local")) {
  const v = ler(arquivo);
  return {
    url: exigir(v, "NEXT_PUBLIC_SUPABASE_URL"),
    publicavel: exigir(v, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    secreta: exigir(v, "SUPABASE_SECRET_KEY"),
    ref: exigir(v, "SUPABASE_PROJECT_REF"),
    dbUrl: v.SUPABASE_DB_URL || null,
  };
}

// Banco antigo (crm/.env.local), usado só pela migração de dados.
export function lerAmbienteAntigo(arquivo = path.join(RAIZ, ".env.local")) {
  const v = ler(arquivo);
  return {
    url: exigir(v, "NEXT_PUBLIC_SUPABASE_URL"),
    serviceRole: exigir(v, "SUPABASE_SERVICE_ROLE_KEY"),
  };
}
