import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente com a chave secreta: ignora RLS. Só no servidor, só para o que o
// admin precisa (convite, link de acesso).
export function criarClienteAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
