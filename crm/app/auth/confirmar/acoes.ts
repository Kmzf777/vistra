"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Troca o token_hash por sessão. Só roda no POST (botão "Continuar"): a prévia
// de link do WhatsApp faz GET na página e não pode gastar o convite.
export async function confirmar(formData: FormData): Promise<void> {
  const tokenHash = formData.get("token_hash");
  const tipo = formData.get("type");

  let ok = false;
  if (typeof tokenHash === "string" && tokenHash && (tipo === "invite" || tipo === "recovery")) {
    try {
      const sb = await criarClienteServidor();
      const { error } = await sb.auth.verifyOtp({ type: tipo as EmailOtpType, token_hash: tokenHash });
      ok = !error;
    } catch {
      ok = false;
    }
  }
  redirect(ok ? "/definir-senha" : "/login?erro=link");
}
