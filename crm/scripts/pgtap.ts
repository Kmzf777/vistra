// Roda os testes pgTAP (supabase/tests/database/*.test.sql) contra o banco remoto (caminho B).
// Uso: npm run db:testar [-- --db-url <url>]. Sem --db-url, usa SUPABASE_DB_URL de .env.novo.local.
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { carregarAmbiente } from "./_ambiente";

const argIdx = process.argv.indexOf("--db-url");
const dbUrl = (argIdx >= 0 ? process.argv[argIdx + 1] : null) ?? process.env.SUPABASE_DB_URL ?? carregarAmbiente().dbUrl;
if (!dbUrl) {
  console.error("Sem URL do banco. Use --db-url ou defina SUPABASE_DB_URL em .env.novo.local.");
  process.exit(1);
}

async function main() {
  const sql = postgres(dbUrl as string, { max: 1, onnotice: () => {} });
  const dir = path.resolve(__dirname, "..", "supabase", "tests", "database");
  const arquivos = fs.readdirSync(dir).filter((f) => f.endsWith(".test.sql")).sort();
  const [{ existia }] = await sql`select exists(select 1 from pg_extension where extname = 'pgtap') as existia`;
  try {
    await sql.unsafe("create extension if not exists pgtap with schema extensions");
    for (const arq of arquivos) {
      console.log(`# ${arq}`);
      const conteudo = fs.readFileSync(path.join(dir, arq), "utf8");
      const resultados = (await sql.unsafe(conteudo).simple()) as unknown as Array<Array<Record<string, string>>>;
      for (const res of Array.isArray(resultados) ? resultados : [resultados]) {
        for (const linha of res ?? []) {
          const texto = String(Object.values(linha)[0]);
          console.log(texto);
          if (/^\s*not ok/.test(texto) || texto.includes("# Looks like")) process.exitCode = 1;
        }
      }
    }
  } catch (e) {
    console.error("Erro:", (e as Error).message);
    process.exitCode = 1;
  } finally {
    if (!existia) await sql.unsafe("drop extension if exists pgtap").catch(() => {});
    await sql.end();
  }
}
main();
