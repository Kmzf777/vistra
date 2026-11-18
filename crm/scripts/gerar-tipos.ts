// Gera lib/supabase/database.types.ts a partir do banco (SUPABASE_DB_URL), sem login nem Docker.
// Não imprime a URL.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { carregarAmbiente } from "./_ambiente";

const { dbUrl } = carregarAmbiente();
if (!dbUrl) throw new Error("SUPABASE_DB_URL faltando em .env.novo.local.");

const r = spawnSync("npx", ["supabase", "gen", "types", "typescript", "--db-url", dbUrl, "--schema", "public"], {
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 64 * 1024 * 1024,
});
if (r.status !== 0 || !r.stdout.includes("export type Database")) {
  console.error("Falha ao gerar os tipos (status " + r.status + ").");
  process.exit(1);
}
fs.writeFileSync(path.resolve(__dirname, "..", "lib/supabase/database.types.ts"), r.stdout, "utf8");
console.log("Tipos gravados em lib/supabase/database.types.ts");
