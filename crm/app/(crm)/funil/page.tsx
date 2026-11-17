import Link from "next/link";
import Kanban from "@/components/Kanban";
import { carregarFunil } from "@/lib/dados/funil";
import estilo from "./funil.module.css";

// Lê cookie de sessão: nunca pode ser pré-renderizada em build.
export const dynamic = "force-dynamic";

// /funil: o que acontece depois do "sim" à prévia. Server Component: a carga
// é feita aqui, com a sessão do cookie. O quadro é o único pedaço de cliente.
export default async function Funil() {
  const dados = await carregarFunil();

  return (
    <main className={estilo.tela}>
      <header className={estilo.topo}>
        <div className={estilo.identidade}>
          <p className={estilo.sobretitulo}>depois do sim</p>
          <h1 className={estilo.titulo}>Funil</h1>
        </div>
        <p className={estilo.regra}>
          Aqui ficam os leads que quiseram ver a prévia. Quem ainda está na conversa fica no{" "}
          <Link href="/inicio">Início</Link>.
        </p>
      </header>

      {dados.cartoes.length === 0 && (
        <p className={estilo.faixa}>
          Nenhum lead no funil ainda. Um lead chega aqui quando responde &quot;quer ver a prévia&quot; no passo de
          resultado.
        </p>
      )}

      <div className={estilo.palco}>
        <Kanban
          etapas={dados.etapas}
          cartoes={dados.cartoes}
          precoTabela={dados.precoTabela}
          pisoReferencia={dados.pisoReferencia}
        />
      </div>
    </main>
  );
}
