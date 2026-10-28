import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente de servidor, para Server Components, Server Actions e route handlers.
// Lê e escreve a sessão nos cookies, com a chave publicável.
export async function criarClienteServidor() {
  const jar = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (lista) => {
          // Em Server Component puro isto lança: só route handler e Server
          // Action escrevem cookie. O proxy já renova a sessão, então engolir
          // aqui é correto.
          try {
            lista.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

export function temCredenciais() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

// TEMPORÁRIO: as telas antigas (funil, poço) consultam o esquema antigo e não
// passam no tipo novo. Elas saem nas Tarefas 9 e 10; até lá usam este cliente
// sem tipo. Código novo usa criarClienteServidor().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function criarClienteServidorLegado(): Promise<SupabaseClient<any, "public", any>> {
  return (await criarClienteServidor()) as unknown as SupabaseClient;
}
