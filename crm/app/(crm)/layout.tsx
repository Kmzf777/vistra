import { after } from "next/server";
import MenuLateral from "@/components/MenuLateral";
import SessaoMenu from "@/components/SessaoMenu";
import { exigirPerfil } from "@/lib/dados/sessao";
import { criarClienteComFotoDosCookies } from "@/lib/supabase/servidor";
import estilo from "./crm.module.css";

// Casco do CRM: menu fixo à esquerda (barra embaixo no celular), conteúdo à direita.
export default async function LayoutCrm({ children }: { children: React.ReactNode }) {
  const perfil = await exigirPerfil();

  // Marca o último acesso depois da resposta, sem segurar a tela; o erro não importa. O cliente nasce aqui,
  // com os cookies já lidos: dentro do after() de um layout os cookies não podem ser lidos.
  const sb = await criarClienteComFotoDosCookies();
  after(async () => {
    try {
      await sb.rpc("marcar_acesso");
    } catch {
      // sem efeito na tela
    }
  });

  return (
    <div className={estilo.casco}>
      <MenuLateral papel={perfil.papel} />
      {/* Monta-se por portal dentro da #menu-sessao do MenuLateral, entao
          nao vira um no na grade do casco. */}
      <SessaoMenu />
      <main className={estilo.conteudo}>{children}</main>
    </div>
  );
}
