// Disputa de verdade pelo "Próximo lead": 6 vendedores, 3 leads, conexões separadas.
// Uso: npx tsx scripts/teste-concorrencia.ts
// Cria só dados fictícios (@exemplo.com, origem_id exemplo-conc-) e limpa tudo no fim.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { carregarAmbiente } from "./_ambiente";
import { clienteSecreto, limparExemplos } from "./limpar-exemplos";

const FILA_VAZIA = "A fila está vazia agora. Avise o Kelwin.";

function ok<T>(r: { data: T | null; error: { message: string } | null }, onde: string): T {
  if (r.error) throw new Error(`${onde}: ${r.error.message}`);
  return r.data as T;
}

async function main() {
  const { url, publicavel } = carregarAmbiente();
  const adm = clienteSecreto();
  let modeloCriado: number | null = null;
  let falha: string | null = null;
  const sucessos: string[] = [];
  let recusas = 0;
  let entregues = 0;

  try {
    // 1. usuários
    const usuarios: { email: string; senha: string }[] = [];
    for (let i = 1; i <= 6; i++) {
      const email = `concorrencia.0${i}@exemplo.com`;
      const senha = randomBytes(18).toString("base64url");
      const r = await adm.auth.admin.createUser({
        email, password: senha, email_confirm: true, user_metadata: { nome: `Concorrencia ${i} Exemplo` },
      });
      if (r.error) throw new Error(`criar usuário ${i}: ${r.error.message}`);
      // o perfil nasce inativo (só convite ativa); aqui o teste faz o papel do convite
      ok(await adm.from("perfis").update({ ativo: true }).eq("id", r.data.user.id).select("id"), `ativar usuário ${i}`);
      usuarios.push({ email, senha });
    }

    // 2. leads prontos
    const cidade = ok(await adm.from("cidades").select("id").eq("nome", "Uberlândia").eq("uf", "MG").single(), "cidade") as { id: string };
    const nicho = ok(await adm.from("nichos").select("id").eq("nome", "Pet shop").single(), "nicho") as { id: string };
    for (let i = 1; i <= 5; i++) {
      // 04 e 05 são irmãos do mesmo grupo: só um deles pode ser entregue
      const lead = ok(
        await adm.from("leads").insert({
          nome: `Pet Shop Exemplo Conc 0${i}`, cidade_id: cidade.id, nicho_id: nicho.id,
          origem_id: `exemplo-conc-0${i}`, ...(i >= 4 ? { grupo: "exemplo-conc-grupo" } : {}), google_place_id: `exemplo-conc-0${i}`,
          // no topo da fila, para valer mesmo com outros leads prontos no banco
          prioridade: 1, nota: 5.0, avaliacoes: 9999,
        }).select("id").single(),
        "inserir lead",
      ) as { id: string };
      ok(await adm.from("telefones_lead").insert({ lead_id: lead.id, e164: `+553490000009${i}`, tipo: "whatsapp", principal: true }).select("id"), "telefone");
      ok(await adm.from("verificacoes_site").insert({ lead_id: lead.id, veredito: "PODE_ABORDAR", ferramenta: "teste-concorrencia" }).select("id"), "verificação");
      ok(await adm.from("mensagens_lead").insert({
        lead_id: lead.id, versao: 1, status: "aprovada", aprovada_em: new Date().toISOString(),
        partes: ["oi, tudo bem?", "vi o perfil de vocês", "posso mandar uma ideia?"],
      }).select("id"), "mensagem");
    }
    const modelos = ok(await adm.from("modelos_mensagem").select("id").eq("tipo", "abertura").eq("ativo", true).is("nicho_id", null).limit(1), "modelos") as { id: number }[];
    if (modelos.length === 0) {
      const m = ok(await adm.from("modelos_mensagem").insert({ tipo: "abertura", rotulo: "exemplo-conc", texto: "Olá [saudacao]" }).select("id").single(), "modelo") as { id: number };
      modeloCriado = m.id;
      console.log("Criei um modelo de abertura geral só para o teste; apago no fim.");
    }

    // 3. disputa
    const clientes = [];
    for (const u of usuarios) {
      const c = createClient(url, publicavel, { auth: { autoRefreshToken: false, persistSession: false } });
      const r = await c.auth.signInWithPassword({ email: u.email, password: u.senha });
      if (r.error) throw new Error(`entrar como usuário de exemplo: ${r.error.message}`);
      clientes.push(c);
    }
    const respostas = await Promise.all(clientes.map((c) => c.rpc("proximo_lead")));
    for (const r of respostas) {
      if (r.error) {
        if (r.error.message === FILA_VAZIA) recusas++;
        else throw new Error(`proximo_lead: ${r.error.message}`);
      } else sucessos.push(r.data as string);
    }

    // 4. conferências
    const repetidos = sucessos.length - new Set(sucessos).size;
    const conc = ok(await adm.from("leads").select("id").like("origem_id", "exemplo-conc-"+"%"), "leads de concorrência") as { id: string }[];
    const idsConc = new Set(conc.map((l) => l.id));
    const irmaos = ok(await adm.from("leads").select("id").in("origem_id", ["exemplo-conc-04", "exemplo-conc-05"]), "irmãos") as { id: string }[];
    const idsIrmaos = new Set(irmaos.map((l) => l.id));
    entregues = sucessos.filter((id) => idsConc.has(id)).length;
    const irmaosEntregues = sucessos.filter((id) => idsIrmaos.has(id)).length;
    console.log(`${respostas.length} pedidos, ${repetidos} ids repetidos, ${entregues} leads de concorrência entregues, ${irmaosEntregues} irmão(s) do grupo entregue(s).`);
    if (repetidos !== 0) falha = "ids repetidos";
    else if (sucessos.length + recusas !== 6) falha = "sucessos + recusas diferente de 6";
    else if (irmaosEntregues !== 1) falha = "esperava exatamente 1 irmão do grupo entregue";
    else if (entregues !== 4) falha = "esperava 4 leads de concorrência entregues (3 avulsos + 1 do grupo)";
  } catch (e) {
    falha = (e as Error).message;
  } finally {
    // 5. limpeza
    try {
      const r = await limparExemplos(adm, { prefixo: "exemplo-conc-", emails: "concorrencia.", gravar: true });
      console.log(`Limpeza: ${r.leads} leads e ${r.usuarios} usuários de exemplo apagados.`);
      if (modeloCriado !== null) {
        ok(await adm.from("modelos_mensagem").delete().eq("id", modeloCriado).select("id"), "apagar modelo");
        console.log("Modelo de abertura do teste apagado.");
      }
    } catch (e) {
      console.error("Falha na limpeza:", (e as Error).message);
      falha = falha ?? "limpeza";
    }
  }

  if (falha) {
    console.error(`FALHOU: ${falha}`);
    process.exit(1);
  }
  console.log("OK");
}

main().catch((e) => {
  console.error("Falhou:", (e as Error).message);
  process.exit(1);
});
