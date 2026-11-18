// Convite e link de acesso por token_hash. Sem `server-only`: o script
// scripts/convidar.ts usa o mesmo código. Nada aqui envia e-mail: o admin
// recebe o link e manda pelo WhatsApp.
// O perfil nasce inativo (gatilho criar_perfil): o convite ativa, com a chave
// secreta, o usuário que o generateLink devolve. Cadastro pela chave pública
// não ganha acesso.
import type { SupabaseClient } from "@supabase/supabase-js";

export type DadosConvite = { email: string; nome: string; curso: string; artigo: "o" | "a" };

// Qualquer cliente do Supabase serve (tipado ou não).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClienteQualquer = SupabaseClient<any, any, any>;

export function montarLinkConvite(
  base: string,
  tokenHash: string,
  tipo: "invite" | "recovery"
): string {
  const raiz = base.replace(/\/+$/, "");
  return `${raiz}/auth/confirmar?token_hash=${encodeURIComponent(tokenHash)}&type=${tipo}`;
}

type RespostaLink = {
  data: { properties?: { hashed_token?: string } | null; user?: { id?: string } | null } | null;
  error: { message?: string } | null;
};

const ERRO_ATIVAR =
  "O convite foi criado, mas a pessoa ficou desativada. Reative na lista da equipe e gere um link de acesso.";

function extrair(r: RespostaLink, base: string, tipo: "invite" | "recovery") {
  const hash = r.data?.properties?.hashed_token;
  if (r.error || !hash) {
    return {
      erro: `Não deu para gerar o link: ${r.error?.message ?? "o Supabase não devolveu o token"}`,
    };
  }
  return { link: montarLinkConvite(base, hash, tipo) };
}

export async function gerarConvite(
  admin: ClienteQualquer,
  dados: DadosConvite,
  base: string
): Promise<{ link: string } | { erro: string }> {
  try {
    const r = await admin.auth.admin.generateLink({
      type: "invite",
      email: dados.email,
      options: { data: { nome: dados.nome, curso: dados.curso, artigo: dados.artigo } },
    });
    const resposta = r as unknown as RespostaLink;
    const pronto = extrair(resposta, base, "invite");
    if ("erro" in pronto) return pronto;
    const id = resposta.data?.user?.id;
    if (!id) return { erro: "Não deu para gerar o link: o Supabase não devolveu o usuário" };
    const ativado = await admin.from("perfis").update({ ativo: true }).eq("id", id).select("id");
    if (ativado.error || !ativado.data || ativado.data.length === 0) return { erro: ERRO_ATIVAR };
    return pronto;
  } catch (e) {
    return { erro: `Não deu para gerar o link: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function gerarLinkDeAcesso(
  admin: ClienteQualquer,
  email: string,
  base: string
): Promise<{ link: string } | { erro: string }> {
  try {
    const r = await admin.auth.admin.generateLink({ type: "recovery", email });
    return extrair(r as unknown as RespostaLink, base, "recovery");
  } catch (e) {
    return { erro: `Não deu para gerar o link: ${e instanceof Error ? e.message : String(e)}` };
  }
}
