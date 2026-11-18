// Promove um perfil a admin com a chave secreta. Uso: npx tsx scripts/promover-admin.ts --email <e>
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";
import { carregarAmbiente } from "./_ambiente";

async function main() {
  const { values } = parseArgs({ options: { email: { type: "string" } } });
  if (!values.email) {
    console.error("Uso: --email <e>");
    process.exit(1);
  }
  const amb = carregarAmbiente();
  const sb = createClient(amb.url, amb.secreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb
    .from("perfis")
    .update({ papel: "admin" })
    .eq("email", values.email)
    .select("nome");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Nenhum perfil com esse e-mail.");
  console.log(`admin: ${data[0].nome}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
