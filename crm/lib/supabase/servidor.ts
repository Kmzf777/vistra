import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

/**
 * Cliente com uma foto dos cookies tirada agora, para usar dentro de `after()` num Server Component:
 * lá dentro não se pode ler cookies (docs do Next: 03-api-reference/04-functions/after.md). Só lê; não grava.
 */
export async function criarClienteComFotoDosCookies() {
  const foto = (await cookies()).getAll();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => foto, setAll: () => {} } }
  );
}

export function temCredenciais() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
