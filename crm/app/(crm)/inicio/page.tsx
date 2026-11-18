import Link from "next/link";
import { carregarInicio } from "@/lib/dados/vendedor";
import type { ItemAgora } from "@/lib/fluxo/agora";
import ProximoLead from "./ProximoLead";
import estilo from "./inicio.module.css";

// Lê cookie de sessão: nunca pode ser pré-renderizada em build.
export const dynamic = "force-dynamic";

const MOTIVO: Record<ItemAgora["motivo"], string> = {
  previa_pronta: "Prévia pronta para enviar",
  em_andamento: "Conversa em andamento",
  acompanhamento_vencido: "Hora do acompanhamento",
};

export default async function Inicio() {
  const { cota, reservadoId, agora } = await carregarInicio();

  return (
    <div className={estilo.tela}>
      <h1 className={estilo.cota}>
        Hoje você abriu <b>{cota.abertas}</b> de <b>{cota.limite}</b>
      </h1>

      <ProximoLead reservado={reservadoId !== null} cotaAcabou={cota.abertas >= cota.limite} />

      <section>
        <h2 className={estilo.titulo}>Agora</h2>
        {agora.length === 0 ? (
          <p className={estilo.vazio}>Nada pedindo você agora.</p>
        ) : (
          <ul className={estilo.lista}>
            {agora.map((i) => (
              <li key={i.id}>
                <Link href={`/lead/${i.id}`} className={estilo.item}>
                  <strong>{i.nome}</strong>
                  <span>{MOTIVO[i.motivo]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
