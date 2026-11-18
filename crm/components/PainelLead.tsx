"use client";

import { useEffect, useId, useRef, useState } from "react";
import { digitosWhatsApp } from "@/lib/telefone";
import { rotuloEvento } from "@/lib/fluxo/eventos";
import { PEDIU_PARAR } from "@/lib/fluxo/passos";
import FormVenda from "./FormVenda";
import {
  acoesDaEtapa,
  podePedirParar,
  rotuloTempo,
  temperatura,
  type AcaoEtapa,
  type CartaoLead as Cartao,
  type EtapaFunil,
} from "./KanbanTipos";
import form from "./Formularios.module.css";
import estilo from "./PainelLead.module.css";

type Props = {
  cartao: Cartao;
  etapa: EtapaFunil | undefined;
  nomeEtapa: (slug: string) => string;
  /** Gravação desta etapa em voo: os botões congelam. */
  ocupado: boolean;
  vendendo: boolean;
  erroVenda: string | null;
  precoTabela: number;
  pisoReferencia: number;
  aoFechar: () => void;
  aoExecutar: (acao: AcaoEtapa) => void;
  /** "Pediu para não chamar mais": bloqueia o número para todos e leva o lead a Perdeu. */
  aoPedirParar: () => void;
  aoCancelarVenda: () => void;
  aoRegistrarVenda: (valor: number, forma: string, fechadoEm: string) => void;
  /** Devolve o erro, ou null quando salvou. */
  aoSalvarContato: (nome: string, cargo: string, telefone: string) => Promise<string | null>;
};

const RELOGIO = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function quando(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  return Number.isFinite(t) ? RELOGIO.format(new Date(t)) : "—";
}

function dinheiro(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ROTULO_ACAO: Record<AcaoEtapa, string> = {
  negociando: "Passar para Negociando",
  fechou: "Fechou",
  perdeu: "Perdeu",
};

const FORMAS: Record<string, string> = { pix: "Pix", boleto: "Boleto", cartao: "Cartão", dinheiro: "Dinheiro", outro: "Outro" };

// O painel do lead. Não é um modal: o quadro continua usável atrás dele.
export default function PainelLead({
  cartao,
  etapa,
  nomeEtapa,
  ocupado,
  vendendo,
  erroVenda,
  precoTabela,
  pisoReferencia,
  aoFechar,
  aoExecutar,
  aoPedirParar,
  aoCancelarVenda,
  aoRegistrarVenda,
  aoSalvarContato,
}: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  const [confirmaPerdeu, setConfirmaPerdeu] = useState(false);
  const [confirmaParar, setConfirmaParar] = useState(false);
  const [novoContato, setNovoContato] = useState(false);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [fone, setFone] = useState("");
  const [erroContato, setErroContato] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    caixa.current?.focus();
  }, []);

  const terminal = etapa?.terminal ?? false;
  const temp = temperatura(terminal, cartao.paradoHoras);
  const acoes = acoesDaEtapa(cartao.etapa);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErroContato(null);
    const erro = await aoSalvarContato(nome, cargo, fone);
    setSalvando(false);
    if (erro) return setErroContato(erro);
    setNome("");
    setCargo("");
    setFone("");
    setNovoContato(false);
  }

  return (
    <div
      className={estilo.painel}
      role="dialog"
      aria-labelledby={idTitulo}
      tabIndex={-1}
      ref={caixa}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          aoFechar();
        }
      }}
    >
      <header className={estilo.topo}>
        <div className={estilo.identidade}>
          <p className={estilo.etapaAtual} data-terminal={terminal ? "sim" : "nao"}>
            {nomeEtapa(cartao.etapa)}
          </p>
          <h2 className={estilo.nome} id={idTitulo}>
            {cartao.nome}
          </h2>
          {cartao.nicho && <p className={estilo.categoria}>{cartao.nicho}</p>}
        </div>
        <button type="button" className={estilo.fechar} onClick={aoFechar} aria-label="Fechar o painel (Esc)">
          <span aria-hidden>✕</span>
        </button>
      </header>

      <div className={estilo.rolo}>
        {vendendo ? (
          <section className={estilo.bloco}>
            <FormVenda
              nome={cartao.nome}
              precoTabela={precoTabela}
              pisoReferencia={pisoReferencia}
              pendente={ocupado}
              erro={erroVenda}
              aoRegistrar={aoRegistrarVenda}
              aoCancelar={aoCancelarVenda}
            />
          </section>
        ) : (
          acoes.length > 0 && (
            <section className={estilo.bloco}>
              <h3 className={estilo.rotulo}>O que aconteceu</h3>
              <div className={form.acoes}>
                {acoes.map((a) =>
                  a === "perdeu" ? (
                    confirmaPerdeu ? (
                      <span key={a} className={form.acoes}>
                        <button
                          type="button"
                          className="btn"
                          disabled={ocupado}
                          onClick={() => {
                            setConfirmaPerdeu(false);
                            aoExecutar(a);
                          }}
                        >
                          Sim, perdeu
                        </button>
                        <button type="button" className="btn" onClick={() => setConfirmaPerdeu(false)}>
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button key={a} type="button" className="btn" disabled={ocupado} onClick={() => setConfirmaPerdeu(true)}>
                        {ROTULO_ACAO[a]}
                      </button>
                    )
                  ) : (
                    <button
                      key={a}
                      type="button"
                      className={a === "fechou" ? "btn btn-forte" : "btn"}
                      disabled={ocupado}
                      onClick={() => aoExecutar(a)}
                    >
                      {ocupado ? "Aguarde…" : ROTULO_ACAO[a]}
                    </button>
                  ),
                )}
              </div>
              {podePedirParar(cartao.etapa) &&
                (confirmaParar ? (
                  <div className={form.form}>
                    <p className={form.erro}>{PEDIU_PARAR.confirma}</p>
                    <div className={form.acoes}>
                      <button
                        type="button"
                        className="btn"
                        disabled={ocupado}
                        onClick={() => {
                          setConfirmaParar(false);
                          aoPedirParar();
                        }}
                      >
                        Sim, confirmar
                      </button>
                      <button type="button" className="btn" onClick={() => setConfirmaParar(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={form.acoes}>
                    <button type="button" className="btn" disabled={ocupado} onClick={() => setConfirmaParar(true)}>
                      {PEDIU_PARAR.rotulo}
                    </button>
                  </div>
                ))}
            </section>
          )
        )}

        <section className={estilo.bloco}>
          <h3 className={estilo.rotulo}>Tempo</h3>
          <dl className={estilo.tabela}>
            <div data-temp={temp}>
              <dt>Parado</dt>
              <dd className={estilo.destaque}>{rotuloTempo(cartao.paradoHoras)}</dd>
            </div>
            <div>
              <dt>Nesta etapa desde</dt>
              <dd>{quando(cartao.entrouEm)}</dd>
            </div>
            <div>
              <dt>Última atividade</dt>
              <dd>{quando(cartao.ultimaAtividadeEm)}</dd>
            </div>
          </dl>
        </section>

        {cartao.venda && (
          <section className={estilo.bloco}>
            <h3 className={estilo.rotulo}>Venda</h3>
            <dl className={estilo.tabela}>
              <div>
                <dt>Valor</dt>
                <dd>{dinheiro(cartao.venda.valor)}</dd>
              </div>
              <div>
                <dt>Forma</dt>
                <dd>{FORMAS[cartao.venda.forma_pagamento] ?? cartao.venda.forma_pagamento}</dd>
              </div>
              <div>
                <dt>Sua comissão</dt>
                <dd>{dinheiro(cartao.venda.comissao)}</dd>
              </div>
            </dl>
          </section>
        )}

        {cartao.previa && (cartao.previa.site_url || cartao.previa.pdf_url) && (
          <section className={estilo.bloco}>
            <h3 className={estilo.rotulo}>Prévia</h3>
            <dl className={estilo.tabela}>
              {cartao.previa.site_url && (
                <div>
                  <dt>Site</dt>
                  <dd>
                    <a href={cartao.previa.site_url} target="_blank" rel="noopener noreferrer">
                      Abrir o site da prévia
                    </a>
                  </dd>
                </div>
              )}
              {cartao.previa.pdf_url && (
                <div>
                  <dt>PDF</dt>
                  <dd>
                    <a href={cartao.previa.pdf_url} target="_blank" rel="noopener noreferrer">
                      Abrir o PDF da prévia
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section className={estilo.bloco}>
          <h3 className={estilo.rotulo}>Contato</h3>
          {cartao.numeroBloqueado && (
            <p className={form.erro} role="alert">
              Este número está bloqueado. Fale com o admin.
            </p>
          )}
          {cartao.telefone && (
            <p>
              <a className={estilo.telefone} href={`https://wa.me/${digitosWhatsApp(cartao.telefone)}`} target="_blank" rel="noopener noreferrer">
                Abrir o WhatsApp do negócio
              </a>
            </p>
          )}
          {cartao.contatos.length > 0 && (
            <ul className={estilo.contatos}>
              {cartao.contatos.map((c) => (
                <li key={c.id}>
                  <p className={estilo.contatoNome}>
                    <strong>{c.nome || "nome não anotado"}</strong>
                  </p>
                  {c.cargo && <p className={estilo.cargo}>{c.cargo}</p>}
                  {c.telefone_e164 && (
                    <a
                      className={estilo.telefone}
                      href={`https://wa.me/${digitosWhatsApp(c.telefone_e164)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {c.telefone_e164}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!novoContato ? (
            <button type="button" className="btn" onClick={() => setNovoContato(true)}>
              Anotar quem decide
            </button>
          ) : (
            <form className={form.form} onSubmit={salvar}>
              <label className={form.campo}>
                Nome
                <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />
              </label>
              <label className={form.campo}>
                Cargo
                <input value={cargo} onChange={(e) => setCargo(e.target.value)} autoComplete="off" />
              </label>
              <label className={form.campo}>
                Telefone
                <input inputMode="tel" value={fone} onChange={(e) => setFone(e.target.value)} placeholder="(34) 90000-0000" />
              </label>
              {erroContato && (
                <p className={form.erro} role="alert">
                  {erroContato}
                </p>
              )}
              <div className={form.acoes}>
                <button type="submit" className="btn btn-forte" disabled={salvando}>
                  {salvando ? "Salvando…" : "Salvar contato"}
                </button>
                <button type="button" className="btn" onClick={() => setNovoContato(false)} disabled={salvando}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>

        <section className={estilo.bloco}>
          <h3 className={estilo.rotulo}>O negócio</h3>
          <dl className={estilo.tabela}>
            {cartao.site && (
              <div>
                <dt>Site</dt>
                <dd>{cartao.site}</dd>
              </div>
            )}
            {cartao.instagram && (
              <div>
                <dt>Instagram</dt>
                <dd>{cartao.instagram}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className={estilo.bloco}>
          <h3 className={estilo.rotulo}>Histórico</h3>
          {cartao.eventos.length === 0 ? (
            <p className={estilo.nada}>Nenhum evento registrado neste lead.</p>
          ) : (
            <ol className={estilo.historico}>
              {cartao.eventos.map((e) => (
                <li key={e.id}>
                  <p className={estilo.linhaEvento}>
                    <span className={estilo.tipo}>{rotuloEvento(e, nomeEtapa)}</span>
                    <time className={estilo.data}>{quando(e.criado_em)}</time>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
