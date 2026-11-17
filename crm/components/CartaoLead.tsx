"use client";

import { digitosWhatsApp } from "@/lib/telefone";
import { proximaAcao, rotuloTempo, temperatura, type AcaoEtapa, type CartaoLead as Cartao } from "./KanbanTipos";
import estilo from "./CartaoLead.module.css";

type Props = {
  cartao: Cartao;
  terminal: boolean;
  /** Gravação em voo: o botão fica desabilitado até o banco responder. */
  gravando: boolean;
  aoAbrir: (id: string) => void;
  aoExecutar: (c: Cartao, acao: AcaoEtapa) => void;
  nomeEtapa: (slug: string) => string;
};

const ROTULO_ACAO: Record<AcaoEtapa, string> = {
  negociando: "Negociando",
  fechou: "Fechou",
  perdeu: "Perdeu",
};

// O cartão mostra quem é, quem decide (se alguém anotou), há quanto tempo
// ninguém toca nele e a próxima ação. O resto está no painel.
export default function CartaoLead({ cartao, terminal, gravando, aoAbrir, aoExecutar, nomeEtapa }: Props) {
  const temp = temperatura(terminal, cartao.paradoHoras);
  const quem = cartao.contatos[0] ?? null;
  const acao = proximaAcao(cartao.etapa);

  return (
    <li className={estilo.casa}>
      <article className={estilo.cartao} data-temp={temp} aria-busy={gravando}>
        <h3 className={estilo.cabeca}>
          <button type="button" id={`cartao-${cartao.id}`} className={estilo.titulo} onClick={() => aoAbrir(cartao.id)}>
            {cartao.nome}
          </button>
        </h3>

        {cartao.nicho && <p className={estilo.categoria}>{cartao.nicho}</p>}

        {quem && (
          <div className={estilo.decisor}>
            <p className={estilo.quem}>
              <strong>{quem.nome || "nome não anotado"}</strong>
              {quem.cargo && <em>{quem.cargo}</em>}
            </p>
          </div>
        )}

        {cartao.telefone && (
          <p className={estilo.fone}>
            <a href={`https://wa.me/${digitosWhatsApp(cartao.telefone)}`} target="_blank" rel="noopener noreferrer">
              Abrir o WhatsApp
            </a>
          </p>
        )}

        <footer className={estilo.pe}>
          <span className={estilo.parado} data-temp={temp}>
            <i className={estilo.luz} aria-hidden />
            {terminal ? rotuloTempo(cartao.paradoHoras) : `parado ${rotuloTempo(cartao.paradoHoras)}`}
          </span>
          {acao && (
            <button
              type="button"
              className={estilo.seta}
              disabled={gravando}
              onClick={() => aoExecutar(cartao, acao)}
              aria-label={`${ROTULO_ACAO[acao]}: ${cartao.nome}, hoje em ${nomeEtapa(cartao.etapa)}`}
            >
              {gravando ? "…" : ROTULO_ACAO[acao]}
            </button>
          )}
        </footer>
      </article>
    </li>
  );
}
