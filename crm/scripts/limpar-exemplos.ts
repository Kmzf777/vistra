// Apaga dados de exemplo (leads com origem_id começando com o prefixo e usuários @exemplo.com).
// Uso: npx tsx scripts/limpar-exemplos.ts [--prefixo exemplo-] [--emails <prefixo do e-mail>] [--gravar]
// Sem --gravar, só conta o que apagaria.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { carregarAmbiente } from "./_ambiente";

type Opcoes = { prefixo: string; emails: string; gravar: boolean };
export type Resultado = { leads: number; usuarios: number };

function lerArgumentos(argv: string[]): Opcoes {
  const valor = (nome: string, padrao: string) => {
    const i = argv.indexOf(nome);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : padrao;
  };
  const o = { prefixo: valor("--prefixo", "exemplo-"), emails: valor("--emails", ""), gravar: argv.includes("--gravar") };
  if (!o.prefixo.startsWith("exemplo-")) throw new Error('--prefixo precisa começar com "exemplo-".');
  return o;
}

export function clienteSecreto(): SupabaseClient {
  const { url, secreta } = carregarAmbiente();
  return createClient(url, secreta, { auth: { autoRefreshToken: false, persistSession: false } });
}

function exigir<T>(r: { data: T | null; error: { message: string } | null }, onde: string): T {
  if (r.error) throw new Error(`${onde}: ${r.error.message}`);
  return r.data as T;
}

// Tabelas que talvez ainda não existam (criadas em tarefas posteriores): erro de tabela ausente é ignorado.
function tabelaAusente(erro: { code?: string; message: string } | null): boolean {
  return !!erro && (erro.code === "42P01" || erro.code === "PGRST205");
}

async function listarUsuarios(sb: SupabaseClient, prefixoEmail: string) {
  const achados: { id: string; email: string }[] = [];
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) {
      const email = u.email ?? "";
      if (email.endsWith("@exemplo.com") && email.startsWith(prefixoEmail)) achados.push({ id: u.id, email });
    }
    if (data.users.length < 200) break;
  }
  return achados;
}

export async function limparExemplos(sb: SupabaseClient, o: Opcoes): Promise<Resultado> {
  if (!o.prefixo.startsWith("exemplo-")) throw new Error('prefixo precisa começar com "exemplo-".');
  const leads = exigir(
    await sb.from("leads").select("id").like("origem_id", `${o.prefixo}%`),
    "ler leads",
  ) as { id: string }[];
  const leadIds = leads.map((l) => l.id);
  const usuarios = await listarUsuarios(sb, o.emails);
  const userIds = usuarios.map((u) => u.id);

  if (!o.gravar) return { leads: leadIds.length, usuarios: usuarios.length };

  // 1. devolve à fila os leads reservados pelos usuários do filtro e apaga os eventos deles
  if (userIds.length > 0) {
    exigir(
      await sb.from("leads")
        .update({ estado: "no_poco", dono_id: null, passo: null, reservado_em: null })
        .in("dono_id", userIds).eq("estado", "reservado").select("id"),
      "devolver reservas",
    );
    exigir(await sb.from("eventos_lead").delete().in("autor_id", userIds).select("id"), "apagar eventos dos usuários");
  }

  // 2. filhos e depois os leads
  if (leadIds.length > 0) {
    for (const tabela of ["eventos_lead", "mensagens_lead", "telefones_lead", "verificacoes_site", "contatos", "pedidos_previa", "vendas", "bloqueios"]) {
      const r = await sb.from(tabela).delete().in("lead_id", leadIds).select("lead_id");
      if (r.error && !tabelaAusente(r.error)) throw new Error(`apagar ${tabela}: ${r.error.message}`);
    }
    exigir(await sb.from("leads").delete().in("id", leadIds).select("id"), "apagar leads");
  }
  // bloqueios de exemplo sem lead
  const b = await sb.from("bloqueios").delete().like("google_place_id", `${o.prefixo}%`).select("id");
  if (b.error) throw new Error(`apagar bloqueios: ${b.error.message}`);

  // 3. usuários
  for (const u of usuarios) {
    const { error } = await sb.auth.admin.deleteUser(u.id);
    if (error) throw new Error(`apagar usuário de exemplo: ${error.message}`);
  }
  return { leads: leadIds.length, usuarios: usuarios.length };
}

if (require.main === module) {
  (async () => {
    const o = lerArgumentos(process.argv.slice(2));
    const r = await limparExemplos(clienteSecreto(), o);
    console.log(`${r.leads} leads de exemplo, ${r.usuarios} usuários de exemplo${o.gravar ? " (apagados)" : " (nada apagado; use --gravar)"}`);
  })().catch((e) => {
    console.error("Falhou:", (e as Error).message);
    process.exit(1);
  });
}
