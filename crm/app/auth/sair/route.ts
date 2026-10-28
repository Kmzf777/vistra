import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Encerra a sessão de quem está logado sem perfil ativo (desativado) e volta
// para o login com o aviso. Pública no proxy para não cair em loop.
export async function GET(pedido: NextRequest) {
  try {
    const sb = await criarClienteServidor();
    await sb.auth.signOut({ scope: "local" });
  } catch {}
  return NextResponse.redirect(new URL("/login?erro=desativado", pedido.nextUrl.origin));
}
