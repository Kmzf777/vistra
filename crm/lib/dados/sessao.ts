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

/**
 * O perfil de quem está logado. `getClaims()` valida o JWT (nunca getSession).
 * Perfil ausente ou inativo dá null. O RLS só deixa ler o próprio perfil.
 */
export async function perfilAtual(): Promise<Perfil | null> {
  if (!temCredenciais()) return null;
  try {
    const sb = await criarClienteServidor();
    const { data: claims, error } = await sb.auth.getClaims();
    const id = claims?.claims?.sub;
    if (error || !id) return null;

    const { data, error: erroPerfil } = await sb
      .from("perfis")
      .select("id, nome, curso, artigo, email, papel, ativo, cota_diaria")
      .eq("id", id)
      .maybeSingle();
    if (erroPerfil || !data || !data.ativo) return null;

    return {
      id: data.id,
      nome: data.nome,
      curso: data.curso ?? "",
      artigo: data.artigo === "a" ? "a" : "o",
      email: data.email ?? "",
      papel: data.papel === "admin" ? "admin" : "vendedor",
      ativo: data.ativo,
      cota_diaria: data.cota_diaria,
    };
  } catch {
    return null;
  }
}

/** Exige perfil ativo; sem ele, redireciona para o login. Não chame dentro de try/catch. */
export async function exigirPerfil(de?: string): Promise<Perfil> {
  const perfil = await perfilAtual();
  if (!perfil) redirect(caminhoDeLogin(de));
  return perfil;
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
    const { data, error } = await sb.auth.getClaims();
    if (error || !data?.claims?.sub) return { erro: "Sessão expirada. Entre de novo para continuar." };
    const perfil = await perfilAtual();
    if (!perfil) return { erro: "Seu acesso foi desativado. Fale com o Kelwin." };
    if (opcoes.admin && perfil.papel !== "admin") return { erro: "Você não tem permissão para isso." };
    return { sb, perfil };
  } catch (e) {
    return { erro: `Não deu para falar com o banco: ${e instanceof Error ? e.message : String(e)}` };
  }
}
