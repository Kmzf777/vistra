// Gera o link de convite (não envia e-mail). Uso:
//   npm run convidar -- --email <e> --nome <n> [--curso <c>] [--artigo a|o] [--base http://localhost:3000]
// Imprime só o link; mande-o à própria pessoa pelo WhatsApp.
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";
import { carregarAmbiente } from "./_ambiente";
import { gerarConvite } from "../lib/convite";

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      nome: { type: "string" },
      curso: { type: "string", default: "" },
      artigo: { type: "string", default: "o" },
      base: { type: "string", default: "http://localhost:3000" },
    },
  });
  if (!values.email || !values.nome) {
    console.error("Uso: --email <e> --nome <n> [--curso <c>] [--artigo a|o] [--base <url>]");
    process.exit(1);
  }
  if (values.artigo !== "a" && values.artigo !== "o") {
    console.error('--artigo precisa ser "a" ou "o".');
    process.exit(1);
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/.test(values.base ?? "")) {
    console.error("atenção, link local; para a equipe use --base https://vistracrm.vercel.app");
  }
  const amb = carregarAmbiente();
  const admin = createClient(amb.url, amb.secreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const r = await gerarConvite(
    admin,
    { email: values.email, nome: values.nome, curso: values.curso ?? "", artigo: values.artigo },
    values.base ?? "http://localhost:3000"
  );
  if ("erro" in r) {
    console.error(r.erro);
    process.exit(1);
  }
  console.log(r.link);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
