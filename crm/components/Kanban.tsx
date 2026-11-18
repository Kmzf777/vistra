"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { moverEtapa, registrarAcao, registrarVenda, salvarContato } from "@/app/(crm)/lead/acoes";
import KanbanColuna from "./KanbanColuna";
import PainelLead from "./PainelLead";
import {
  cartoesDaEtapa,
  temperatura,
  type AcaoEtapa,
  type CartaoLead,
  type EtapaFunil,
} from "./KanbanTipos";
import estilo from "./Kanban.module.css";

type Aviso = { texto: string; tom: "ok" | "erro" };

type Props = {
  etapas: EtapaFunil[];
  cartoes: CartaoLead[];
  precoTabela: number;
  pisoReferencia: number;
};

// ==================================================================
// O quadro. Toda gravação é uma Server Action (RPC no banco) e a tela só
// muda quando o banco responde: depois do `revalidatePath` o servidor manda
// os cartões novos. Sem pintura otimista, porque agora o banco recusa
// movimentos (o funil não anda para trás e "Fechou" é uma venda).
// ==================================================================
export default function Kanban({ etapas, cartoes, precoTabela, pisoReferencia }: Props) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [vendendo, setVendendo] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [erroVenda, setErroVenda] = useState<string | null>(null);
  const [emAcao, setEmAcao] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const relogio = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (relogio.current) window.clearTimeout(relogio.current);
    },
    [],
  );

  function anunciar(tom: Aviso["tom"], texto: string) {
    setAviso({ tom, texto });
    if (relogio.current) window.clearTimeout(relogio.current);
    relogio.current = window.setTimeout(() => setAviso(null), tom === "erro" ? 12_000 : 6_000);
  }

  const porSlug = useMemo(() => new Map(etapas.map((e) => [e.slug, e])), [etapas]);
  const nomeEtapa = (slug: string) => porSlug.get(slug)?.nome ?? slug;

  const colunas = useMemo(() => etapas.map((e) => ({ etapa: e, lista: cartoesDaEtapa(cartoes, e) })), [etapas, cartoes]);
  const emJogo = cartoes.filter((c) => !porSlug.get(c.etapa)?.terminal).length;
  const frios = cartoes.filter((c) => temperatura(!!porSlug.get(c.etapa)?.terminal, c.paradoHoras) === "frio").length;
  const cartaoAberto = aberto ? (cartoes.find((c) => c.id === aberto) ?? null) : null;

  function abrir(id: string) {
    setAberto(id);
    setVendendo(false);
    setErroVenda(null);
  }

  function fechar() {
    setAberto(null);
    setVendendo(false);
  }

  function executar(c: CartaoLead, acao: AcaoEtapa) {
    if (acao === "fechou") {
      setAberto(c.id);
      setErroVenda(null);
      setVendendo(true);
      return;
    }
    if (pendente) return;
    setEmAcao(c.id);
    iniciar(async () => {
      const r = await moverEtapa(c.id, acao);
      setEmAcao(null);
      if (r.ok) anunciar("ok", `${c.nome}: ${nomeEtapa(acao)}`);
      else anunciar("erro", `${c.nome}: ${r.erro}`);
    });
  }

  function pedirParar(c: CartaoLead) {
    if (pendente) return;
    setEmAcao(c.id);
    iniciar(async () => {
      const r = await registrarAcao(c.id, "pediu_parar");
      setEmAcao(null);
      if (r.ok) anunciar("ok", `${c.nome}: número bloqueado para todo mundo. O lead foi para Perdeu.`);
      else anunciar("erro", `${c.nome}: ${r.erro}`);
    });
  }

  function registrar(c: CartaoLead, valor: number, forma: string, data: string) {
    setErroVenda(null);
    setEmAcao(c.id);
    iniciar(async () => {
      const r = await registrarVenda(c.id, valor, forma, data);
      setEmAcao(null);
      if (r.ok) {
        setVendendo(false);
        anunciar("ok", `${c.nome}: venda registrada.`);
      } else setErroVenda(r.erro);
    });
  }

  async function contato(c: CartaoLead, nome: string, cargo: string, telefone: string) {
    const r = await salvarContato(c.id, nome, cargo, telefone);
    return r.ok ? null : r.erro;
  }

  return (
    <div className={estilo.tudo}>
      <div className={estilo.resumo}>
        <span className={estilo.medida}>
          <b>{cartoes.length}</b> no funil
        </span>
        <span className={estilo.medida}>
          <b>{emJogo}</b> em jogo
        </span>
        <span className={estilo.medida} data-grave={frios > 0 ? "sim" : "nao"}>
          <b>{frios}</b> parado{frios === 1 ? "" : "s"} há mais de 7 dias
        </span>
      </div>

      <p className={estilo.aviso} data-tom={aviso?.tom ?? "nenhum"} role="status" aria-live="polite">
        {aviso?.texto ?? ""}
      </p>

      <div className={estilo.area} data-painel={cartaoAberto ? "sim" : "nao"}>
        <div className={estilo.quadro}>
          {colunas.map((c) => (
            <KanbanColuna
              key={c.etapa.slug}
              etapa={c.etapa}
              cartoes={c.lista}
              ocupado={pendente ? emAcao : null}
              aoAbrir={abrir}
              aoExecutar={executar}
              nomeEtapa={nomeEtapa}
            />
          ))}
        </div>

        {cartaoAberto && (
          <aside className={estilo.doca}>
            <PainelLead
              key={cartaoAberto.id}
              cartao={cartaoAberto}
              etapa={porSlug.get(cartaoAberto.etapa)}
              nomeEtapa={nomeEtapa}
              ocupado={pendente && emAcao === cartaoAberto.id}
              vendendo={vendendo}
              erroVenda={erroVenda}
              precoTabela={precoTabela}
              pisoReferencia={pisoReferencia}
              aoFechar={fechar}
              aoExecutar={(a) => executar(cartaoAberto, a)}
              aoPedirParar={() => pedirParar(cartaoAberto)}
              aoCancelarVenda={() => setVendendo(false)}
              aoRegistrarVenda={(v, f, d) => registrar(cartaoAberto, v, f, d)}
              aoSalvarContato={(n, cg, t) => contato(cartaoAberto, n, cg, t)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
