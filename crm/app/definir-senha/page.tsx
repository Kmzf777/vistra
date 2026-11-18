import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { criarClienteServidor, temCredenciais } from "@/lib/supabase/servidor";
import FormularioSenha from "./FormularioSenha";
import estilo from "../login/login.module.css";

export const metadata: Metadata = { title: "Definir senha · Vistra CRM" };

// Lê cookie de sessão: nunca pode ser pré-renderizada.
export const dynamic = "force-dynamic";

export default async function PaginaDefinirSenha() {
  if (!temCredenciais()) redirect("/login");
  const sb = await criarClienteServidor();
  const { data, error } = await sb.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login?erro=link");

  return (
    <div className={estilo.tela}>
      <section className={estilo.console}>
        <FormularioSenha />
      </section>
    </div>
  );
}
