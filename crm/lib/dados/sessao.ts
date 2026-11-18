import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteServidor, temCredenciais } from "@/lib/supabase/servidor";
import type { Database } from "@/lib/supabase/database.types";

export type Perfil = {
  id: string;
  nome: string;
  curso: string;
  artigo: "o" | "a";
  email: string;
  papel: "vendedor" | "admin";
  ativo: boolean;
  cota_diaria: number;
};

export const ROTA_LOGIN = "/login";

/** `/login?de=/funil` — o `de` é o que o login usa para devolver a pessoa. */
export function caminhoDeLogin(de?: string): string {
  if (!de || !de.startsWith("/") || de.startsWith("//") || de.startsWith(ROTA_LOGIN)) return ROTA_LOGIN;
  return `${ROTA_LOGIN}?de=${encodeURIComponent(de)}`;
}

type Leitura =
  | { tipo: "ok"; perfil: Perfil }
  | { tipo: "sem_sessao" }
  | { tipo: "inativo" }
  | { tipo: "erro" };

/**
 * Separa quatro desfechos: perfil ativo, sem sessão, perfil ausente/inativo e
 * falha de banco. Falha de rede nunca vira "desativado".
 * `getClaims()` valida o JWT (nunca getSession); o RLS só deixa ler o próprio perfil.
 */
async function lerPerfil(): Promise<Leitura> {
  if (!temCredenciais()) return { tipo: "sem_sessao" };
  try {
    const sb = await criarClienteServidor();
    const { data: claims, error } = await sb.auth.getClaims();
    const id = claims?.claims?.sub;
    if (error || !id) return { tipo: "sem_sessao" };

    const { data, error: erroPerfil } = await sb
      .from("perfis")
      .select("id, nome, curso, artigo, email, papel, ativo, cota_diaria")
      .eq("id", id)
      .maybeSingle();
    if (erroPerfil) return { tipo: "erro" };
    if (!data || !data.ativo) return { tipo: "inativo" };

    return {
      tipo: "ok",
      perfil: {
        id: data.id,
        nome: data.nome,
        curso: data.curso ?? "",
        artigo: data.artigo === "a" ? "a" : "o",
        email: data.email ?? "",
        papel: data.papel === "admin" ? "admin" : "vendedor",
        ativo: data.ativo,
        cota_diaria: data.cota_diaria,
      },
    };
  } catch {
    return { tipo: "erro" };
  }
}

/** Perfil ativo de quem está logado, ou null (sem sessão, inativo ou falha). */
export async function perfilAtual(): Promise<Perfil | null> {
  const r = await lerPerfil();
  return r.tipo === "ok" ? r.perfil : null;
}

/**
 * Exige perfil ativo. Sem sessão vai para o login; com sessão mas sem perfil
 * ativo vai para /auth/sair (que encerra a sessão), senão o proxy devolveria
 * a pessoa do login para /inicio em loop. Falha de banco lança, para a página
 * de erro aparecer em vez de deslogar alguém por causa de um soluço de rede.
 * Não chame dentro de try/catch.
 */
export async function exigirPerfil(de?: string): Promise<Perfil> {
  const r = await lerPerfil();
  if (r.tipo === "ok") return r.perfil;
  if (r.tipo === "sem_sessao") redirect(caminhoDeLogin(de));
  if (r.tipo === "inativo") redirect("/auth/sair");
  throw new Error("Não deu para falar com o banco. Tente de novo.");
}

/** Exige admin; vendedor vai para /inicio. */
export async function exigirAdmin(): Promise<Perfil> {
  const perfil = await exigirPerfil("/admin");
  if (perfil.papel !== "admin") redirect("/inicio");
  return perfil;
}

/**
 * Começo de toda Server Action: sessão e perfil ativo (e admin, se pedido).
 * Nunca lança: devolve `{ erro }`.
 */
export async function abrirAcao(
  opcoes: { admin?: boolean } = {}
): Promise<{ sb: SupabaseClient<Database>; perfil: Perfil } | { erro: string }> {
  if (!temCredenciais()) {
    return {
      erro: "Sem banco. Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    };
  }
  try {
    const sb = await criarClienteServidor();
    const r = await lerPerfil();
    if (r.tipo === "sem_sessao") return { erro: "Sessão expirada. Entre de novo para continuar." };
    if (r.tipo === "erro") return { erro: "Não deu para falar com o banco. Tente de novo." };
    if (r.tipo === "inativo") return { erro: "Seu acesso foi desativado. Fale com o Kelwin." };
    if (opcoes.admin && r.perfil.papel !== "admin") return { erro: "Você não tem permissão para isso." };
    return { sb, perfil: r.perfil };
  } catch (e) {
    return { erro: `Não deu para falar com o banco: ${e instanceof Error ? e.message : String(e)}` };
  }
}
