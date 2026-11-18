"use client";

import { useId } from "react";
import CartaoLead from "./CartaoLead";
import { temperatura, type AcaoEtapa, type CartaoLead as Cartao, type EtapaFunil } from "./KanbanTipos";
import estilo from "./Kanban.module.css";

type Props = {
  etapa: EtapaFunil;
  /** Já filtrados e ordenados. */
  cartoes: Cartao[];
  /** Id do cartão com uma gravação em andamento, ou null. */
  ocupado: string | null;
  aoAbrir: (id: string) => void;
  aoExecutar: (c: Cartao, acao: AcaoEtapa) => void;
  nomeEtapa: (slug: string) => string;
};

export default function KanbanColuna({ etapa, cartoes, ocupado, aoAbrir, aoExecutar, nomeEtapa }: Props) {
  const idTitulo = useId();
  const frios = cartoes.filter((c) => temperatura(etapa.terminal, c.paradoHoras) === "frio").length;

  return (
    <section className={estilo.coluna} data-terminal={etapa.terminal ? "sim" : "nao"} aria-labelledby={idTitulo}>
      <header className={estilo.cabeca}>
        <h2 className={estilo.nomeColuna} id={idTitulo}>
          {etapa.nome}
        </h2>
        {frios > 0 && (
          <span className={estilo.frios} title={`${frios} parado(s) há mais de 7 dias`}>
            {frios} frio{frios > 1 ? "s" : ""}
          </span>
        )}
        <span className={estilo.conta} aria-label={`${cartoes.length} leads nesta coluna`}>
          {cartoes.length}
        </span>
      </header>

      <ul className={estilo.pilha}>
        {cartoes.map((c) => (
          <CartaoLead
            key={c.id}
            cartao={c}
            terminal={etapa.terminal}
            gravando={ocupado === c.id}
            aoAbrir={aoAbrir}
            aoExecutar={aoExecutar}
            nomeEtapa={nomeEtapa}
          />
        ))}
        {cartoes.length === 0 && <li className={estilo.vazia}>vazia</li>}
      </ul>
    </section>
  );
}
