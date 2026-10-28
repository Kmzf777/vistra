import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { confirmar } from "./acoes";
import estilo from "./confirmar.module.css";

export const metadata: Metadata = { title: "Entrar · Vistra CRM", robots: { index: false } };
export const dynamic = "force-dynamic";

// O GET só mostra o botão. Quem gasta o token é o POST (ver acoes.ts).
export default async function PaginaConfirmar({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const p = await searchParams;
  const tokenHash = typeof p.token_hash === "string" ? p.token_hash : "";
  const tipo = typeof p.type === "string" ? p.type : "";
  if (!tokenHash || (tipo !== "invite" && tipo !== "recovery")) redirect("/login?erro=link");

  return (
    <main className={estilo.tela}>
      <form action={confirmar} className={estilo.caixa}>
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={tipo} />
        <h1 className={estilo.titulo}>{tipo === "invite" ? "Seu convite" : "Seu acesso"}</h1>
        <p className={estilo.texto}>Toque em continuar para definir a sua senha.</p>
        <button type="submit" className={`btn btn-forte ${estilo.botao}`}>
          Continuar
        </button>
      </form>
    </main>
  );
}
