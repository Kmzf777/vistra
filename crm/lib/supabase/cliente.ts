"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente do navegador. Usa SÓ a chave publicável: quem protege os dados é o
// RLS do banco. A chave secreta nunca pode aparecer aqui.
export function criarCliente() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

// Para a tela avisar com honestidade em vez de quebrar com erro de rede.
export function temCredenciais() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

// TEMPORÁRIO: o Kanban antigo (Tarefa 10 troca) usa o esquema antigo.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function criarClienteLegado(): SupabaseClient<any, "public", any> {
  return criarCliente() as unknown as SupabaseClient;
}
