// Confere que o banco novo não aceita cadastro pela chave pública (Allow new users to sign up desligado)
// nem entrada anônima. Rode DEPOIS de desligar as duas opções no Dashboard (Authentication), com o ok do Kelwin.
// Uso: npx tsx scripts/conferir-cadastro-fechado.ts
//
// Esperado: o Auth responde signup_disabled ao signUp, e signup_disabled ou anonymous_provider_disabled à entrada
// anônima (https://supabase.com/docs/guides/auth/debugging/error-codes). O e-mail é fictício (@exemplo.com).
// Se o cadastro passar, o usuário criado é apagado na hora com a chave secreta e o script sai com código 1.
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { carregarAmbiente } from "./_ambiente";

type Conferencia = { nome: string; ok: boolean; detalhe: string };

async function apagarSeCriou(admin: SupabaseClient, id: string | undefined): Promise<string> {
  if (!id) return "";
  const { error } = await admin.auth.admin.deleteUser(id);
  return error ? ` O usuário ${id} NÃO foi apagado: ${error.message}. Apague no Dashboard.` : " O usuário criado foi apagado.";
}

async function principal(): Promise<Conferencia[]> {
  const env = carregarAmbiente();
  const opcoes = { auth: { persistSession: false, autoRefreshToken: false } };
  const publico = createClient(env.url, env.publicavel, opcoes);
  const admin = createClient(env.url, env.secreta, opcoes);
  const resultado: Conferencia[] = [];

  const email = `conferir-cadastro-${Date.now()}@exemplo.com`;
  const cadastro = await publico.auth.signUp({ email, password: randomBytes(18).toString("base64url") });
  if (cadastro.error?.code === "signup_disabled") {
    resultado.push({ nome: "cadastro pela chave pública", ok: true, detalhe: "recusado (signup_disabled)" });
  } else {
    const apagado = await apagarSeCriou(admin, cadastro.data?.user?.id);
    resultado.push({
      nome: "cadastro pela chave pública",
      ok: false,
      detalhe: cadastro.error
        ? `recusado por outro motivo (${cadastro.error.code ?? cadastro.error.message}); o cadastro pode estar aberto.${apagado}`
        : `ACEITO: o cadastro está aberto.${apagado}`,
    });
  }

  const anonimo = await publico.auth.signInAnonymously();
  const codigo = anonimo.error?.code;
  if (codigo === "signup_disabled" || codigo === "anonymous_provider_disabled") {
    resultado.push({ nome: "entrada anônima", ok: true, detalhe: `recusada (${codigo})` });
  } else {
    const apagado = await apagarSeCriou(admin, anonimo.data?.user?.id);
    resultado.push({
      nome: "entrada anônima",
      ok: false,
      detalhe: anonimo.error
        ? `recusada por outro motivo (${codigo ?? anonimo.error.message}).${apagado}`
        : `ACEITA: a entrada anônima está ligada.${apagado}`,
    });
  }
  return resultado;
}

principal()
  .then((r) => {
    for (const c of r) console.log(`${c.ok ? "OK  " : "FALHOU"} ${c.nome}: ${c.detalhe}`);
    if (r.some((c) => !c.ok)) {
      console.log(
        'Desligue no Dashboard do projeto novo (Authentication > Sign In / Providers, dashboard/project/<ref>/auth/providers): "Allow new users to sign up" e "Allow anonymous sign-ins".',
      );
      process.exitCode = 1;
    }
  })
  .catch((e) => {
    console.error("Erro:", e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  });
