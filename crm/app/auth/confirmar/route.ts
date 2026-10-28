import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Troca o token_hash do convite (ou do link de acesso) por sessão e manda a
// pessoa definir a senha. Pública: o proxy deixa passar.
export async function GET(pedido: NextRequest) {
  const { searchParams, origin } = pedido.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");

  if (!tokenHash || (tipo !== "invite" && tipo !== "recovery")) {
    return NextResponse.redirect(new URL("/login?erro=link", origin));
  }

  const sb = await criarClienteServidor();
  const { error } = await sb.auth.verifyOtp({ type: tipo as EmailOtpType, token_hash: tokenHash });
  if (error) return NextResponse.redirect(new URL("/login?erro=link", origin));

  return NextResponse.redirect(new URL("/definir-senha", origin));
}
