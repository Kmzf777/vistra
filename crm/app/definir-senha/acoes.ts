"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { traduzirErro, type Resultado } from "@/lib/resultado";

/** Define a senha de quem acabou de entrar pelo link. Em sucesso, redireciona para /inicio. */
export async function definirSenha(senha: string): Promise<Resultado> {
  if (typeof senha !== "string" || senha.length < 8) {
    return { ok: false, erro: "A senha precisa ter pelo menos 8 caracteres." };
  }

  let falha: string | null = null;
  try {
    const sb = await criarClienteServidor();
    const { data, error: erroSessao } = await sb.auth.getClaims();
    if (erroSessao || !data?.claims?.sub) {
      return { ok: false, erro: "Este link já foi usado ou expirou. Peça outro ao Kelwin." };
    }
    const { error } = await sb.auth.updateUser({ password: senha });
    if (error) falha = traduzirErro(error);
  } catch (e) {
    falha = `Não deu para falar com o banco: ${e instanceof Error ? e.message : String(e)}`;
  }
  if (falha) return { ok: false, erro: falha };

  redirect("/inicio");
}
