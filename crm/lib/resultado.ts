// Retorno padrão das Server Actions: nunca lançam, sempre devolvem isto.
export type Resultado = { ok: true; recado: string } | { ok: false; erro: string };

// Traduz o erro do Supabase/PostgREST para uma frase em português.
// P0001 é a frase que a própria função do banco escreveu para o usuário.
export function traduzirErro(
  e: { code?: string; message?: string } | null | undefined,
): string {
  if (!e) return "Não deu para falar com o banco. Tente de novo.";
  if (e.code === "P0001" && e.message) return e.message;
  if (e.code === "42501") return "Você não tem permissão para isso.";
  if (e.code === "PGRST301") return "Sessão expirada. Entre de novo para continuar.";
  return `Não deu para falar com o banco: ${e.message ?? "erro desconhecido"}`;
}
