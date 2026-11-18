// Cria um nicho e/ou uma cidade no banco novo (dados de domínio, não de lead), antes de importar leads e
// mensagens que os citam. Uso:
//   npm run criar:dominio -- [--nicho "<nome>" [--clinica] [--conselho "<texto>"]] [--cidade "<nome>" --uf <UF>] [--gravar]
// Sem --gravar só diz o que já existe e o que criaria. O que já existe fica como está. Chave secreta, só aqui.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { carregarAmbiente } from "./_ambiente";

export type Pedido = {
  nicho: { nome: string; clinica: boolean; conselho: string | null } | null;
  cidade: { nome: string; uf: string } | null;
  gravar: boolean;
};

export function lerPedido(argv: string[]): Pedido | { erro: string } {
  const valor = (nome: string): string | null => {
    const i = argv.indexOf(nome);
    if (i < 0) return null;
    const v = argv[i + 1];
    return v && !v.startsWith("--") && v.trim() ? v.trim() : "";
  };
  const nicho = valor("--nicho");
  const cidade = valor("--cidade");
  const uf = valor("--uf");
  if (nicho === "") return { erro: "Informe o nome depois de --nicho." };
  if (cidade === "") return { erro: "Informe o nome depois de --cidade." };
  if (nicho === null && cidade === null) return { erro: 'Informe --nicho "<nome>" e/ou --cidade "<nome>" --uf <UF>.' };
  if (cidade !== null && (!uf || !/^[A-Za-z]{2}$/.test(uf))) return { erro: "Com --cidade, informe --uf com 2 letras (ex.: MG)." };
  if ((nicho ?? "").length > 80 || (cidade ?? "").length > 80) return { erro: "Nome com no máximo 80 letras." };
  const conselho = valor("--conselho");
  return {
    nicho: nicho === null ? null : { nome: nicho, clinica: argv.includes("--clinica"), conselho: conselho || null },
    cidade: cidade === null ? null : { nome: cidade, uf: (uf as string).toUpperCase() },
    gravar: argv.includes("--gravar"),
  };
}

async function existe(sb: SupabaseClient, tabela: "nichos" | "cidades", filtro: Record<string, string>): Promise<boolean> {
  let q = sb.from(tabela).select("id");
  for (const [k, v] of Object.entries(filtro)) q = q.eq(k, v);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(`ler ${tabela}: ${error.message}`);
  return !!data;
}

async function principal(p: Pedido) {
  const { url, secreta } = carregarAmbiente();
  const sb = createClient(url, secreta, { auth: { persistSession: false, autoRefreshToken: false } });

  if (p.nicho) {
    if (await existe(sb, "nichos", { nome: p.nicho.nome })) console.log(`nicho "${p.nicho.nome}": já existe, fica como está`);
    else if (!p.gravar) console.log(`nicho "${p.nicho.nome}": seria criado (clínica: ${p.nicho.clinica ? "sim" : "não"})`);
    else {
      const { error } = await sb
        .from("nichos")
        .upsert({ nome: p.nicho.nome, clinica: p.nicho.clinica, conselho: p.nicho.conselho, ativo: true }, {
          onConflict: "nome",
          ignoreDuplicates: true,
        });
      if (error) throw new Error(`criar nicho: ${error.message}`);
      console.log(`nicho "${p.nicho.nome}": criado`);
    }
  }
  if (p.cidade) {
    const rotulo = `${p.cidade.nome}/${p.cidade.uf}`;
    if (await existe(sb, "cidades", { nome: p.cidade.nome, uf: p.cidade.uf })) console.log(`cidade ${rotulo}: já existe, fica como está`);
    else if (!p.gravar) console.log(`cidade ${rotulo}: seria criada`);
    else {
      const { error } = await sb
        .from("cidades")
        .upsert({ nome: p.cidade.nome, uf: p.cidade.uf, ativa: true }, { onConflict: "nome,uf", ignoreDuplicates: true });
      if (error) throw new Error(`criar cidade: ${error.message}`);
      console.log(`cidade ${rotulo}: criada`);
    }
  }
  if (!p.gravar) console.log("Simulação: nada foi gravado. Use --gravar para gravar.");
}

if (require.main === module) {
  const p = lerPedido(process.argv.slice(2));
  if ("erro" in p) {
    console.error(p.erro);
    process.exitCode = 1;
  } else {
    principal(p).catch((e) => {
      console.error("Erro:", e instanceof Error ? e.message : String(e));
      process.exitCode = 1;
    });
  }
}
