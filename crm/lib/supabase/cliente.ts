"use client";

import { createBrowserClient } from "@supabase/ssr";
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
