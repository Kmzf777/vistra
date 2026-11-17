"use client";

import { useState, useTransition } from "react";
import BotaoCopiar from "@/components/BotaoCopiar";
import { largarLead, registrarAcao } from "@/app/(crm)/lead/acoes";
import { botoesDoPasso, PASSOS, type Acao, type Botao } from "@/lib/fluxo/passos";
import { linkWhatsApp } from "@/lib/mensagens/preencher";
import type { LeadEmPasso } from "@/lib/dados/vendedor";
import estilo from "./PassosLead.module.css";

const MOTIVOS_LARGAR = [
  { id: "tem_site", rotulo: "Já tem site" },
  { id: "fechado", rotulo: "Negócio fechado" },
  { id: "fora_do_nicho", rotulo: "Fora do nicho" },
  { id: "outro", rotulo: "Outro motivo" },
] as const;

function dataCurta(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).format(
    new Date(iso),
  );
}

export default function PassosLead({ dados }: { dados: LeadEmPasso }) {
  const { lead, telefone, abertura, robo, principal, acompanhamento, preco, faltando, mesmoGrupo, previa } = dados;
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<Acao | null>(null);
  const [largando, setLargando] = useState(false);
  const [copiadas, setCopiadas] = useState<Record<number, boolean>>({});

  // Só nome e curso (se o texto usa) bloqueiam: sem eles a mensagem sairia com o campo cru.
  const bloqueado = faltando.includes("nome") || faltando.includes("curso");
  const aviso = faltando.includes("nome")
    ? "Complete seu nome no perfil antes de mandar"
    : faltando.includes("curso")
      ? "Complete seu curso no perfil antes de mandar"
      : null;

  const botoes = botoesDoPasso(lead.passo, lead.etapa);
  const indiceAtual = PASSOS.findIndex((p) => p.passo === lead.passo);

  function rodar(b: Botao) {
    if (b.confirma && confirmando !== b.acao) {
      setConfirmando(b.acao);
      return;
    }
    setConfirmando(null);
    setErro(null);
    setRecado(null);
    iniciar(async () => {
      const r = await registrarAcao(lead.id, b.acao, b.acao === "principal_enviada" ? principal?.mensagemId : undefined);
      if (r.ok) {
        if (r.recado && r.recado !== "Feito.") setRecado(r.recado);
        setCopiadas({});
      } else setErro(r.erro);
    });
  }

  function largar(motivo: (typeof MOTIVOS_LARGAR)[number]["id"]) {
    setErro(null);
    iniciar(async () => {
      const r = await largarLead(lead.id, motivo);
      if (!r.ok) setErro(r.erro);
    });
  }

  const link = telefone && abertura ? linkWhatsApp(telefone.e164, abertura) : null;
  const podeAbrir = link !== null && !bloqueado;

  return (
    <div className={estilo.tela}>
      <header className={estilo.cabeca}>
        <h1>{lead.nome}</h1>
        <p className={estilo.meta}>
          {[
            lead.nicho,
            lead.nota !== null ? `nota ${String(lead.nota).replace(".", ",")}` : null,
            lead.avaliacoes !== null ? `${lead.avaliacoes} avaliações` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {lead.endereco && <p className={estilo.meta}>{lead.endereco}</p>}
        {lead.instagram && <p className={estilo.meta}>Instagram: {lead.instagram}</p>}
        {lead.gancho && <p className={estilo.gancho}>{lead.gancho}</p>}
        {mesmoGrupo.length > 0 && <p className={estilo.meta}>Mesma rede/telefone: {mesmoGrupo.join(", ")}</p>}
      </header>

      <ol className={estilo.passos} aria-label="Passos do lead">
        {PASSOS.map((p, i) => (
          <li
            key={p.passo}
            className={`${estilo.passo} ${p.passo === lead.passo ? estilo.atual : ""} ${
              indiceAtual > i ? estilo.feito : ""
            }`}
            aria-current={p.passo === lead.passo ? "step" : undefined}
          >
            {p.rotulo}
          </li>
        ))}
      </ol>

      {aviso && (
        <p className={estilo.aviso} role="alert">
          {aviso}
        </p>
      )}

      <section className={estilo.cartao}>
        {lead.passo === "abertura" && (
          <>
            <h2>Mande a abertura</h2>
            {abertura && <p className={estilo.texto}>{abertura}</p>}
            {!telefone && <p className={estilo.aviso}>Sem número de WhatsApp válido para este lead.</p>}
            {podeAbrir ? (
              <a className={estilo.acaoGrande} href={link!} target="_blank" rel="noopener">
                Abrir no WhatsApp
              </a>
            ) : (
              <span className={`${estilo.acaoGrande} ${estilo.off}`} aria-disabled="true">
                Abrir no WhatsApp
              </span>
            )}
          </>
        )}

        {lead.passo === "quem_respondeu" && <h2>Quem respondeu?</h2>}

        {lead.passo === "robo" && (
          <>
            <h2>Respostas para o robô</h2>
            <div className={estilo.lista}>
              {robo.map((r) => (
                <BotaoCopiar
                  key={r.rotulo}
                  rotulo={`Copiar: ${r.rotulo || "resposta"}`}
                  texto={r.texto}
                  desabilitado={bloqueado}
                  mostrarTexto
                />
              ))}
            </div>
            <p className={estilo.dica}>
              Menu com números? Escolha a opção comercial ou outros assuntos, nunca a de cliente.
            </p>
          </>
        )}

        {lead.passo === "acompanhamento" && (
          <>
            <h2>Acompanhamento</h2>
            {lead.proximo_passo_em && <p className={estilo.meta}>A partir de {dataCurta(lead.proximo_passo_em)}</p>}
            {acompanhamento && (
              <BotaoCopiar rotulo="Copiar acompanhamento" texto={acompanhamento} desabilitado={bloqueado} mostrarTexto />
            )}
          </>
        )}

        {lead.passo === "principal" && (
          <>
            <h2>Mensagem principal</h2>
            {principal ? (
              <div className={estilo.lista}>
                {principal.partes.map((parte, i) => (
                  <BotaoCopiar
                    key={i}
                    rotulo={`${copiadas[i] ? "✓ " : ""}Copiar parte ${i + 1}/${principal.partes.length}`}
                    texto={parte}
                    desabilitado={bloqueado}
                    aoCopiar={() => setCopiadas((c) => ({ ...c, [i]: true }))}
                    mostrarTexto
                  />
                ))}
              </div>
            ) : (
              <p className={estilo.aviso}>Este lead ainda não tem mensagem aprovada.</p>
            )}
          </>
        )}

        {lead.passo === "resultado" && (
          <>
            <h2>Como foi a resposta?</h2>
            {preco && (
              <BotaoCopiar rotulo="Copiar resposta sobre preço" texto={preco} desabilitado={bloqueado} mostrarTexto />
            )}
          </>
        )}

        {lead.passo === null && lead.etapa === "previa_pedida" && <h2>Prévia pedida. Aguardando ficar pronta.</h2>}

        {lead.passo === null && lead.etapa === "previa_pronta" && (
          <>
            <h2>A prévia está pronta</h2>
            <div className={estilo.lista}>
              {previa?.site_url && (
                <a className={estilo.link} href={previa.site_url} target="_blank" rel="noopener noreferrer">
                  Abrir o site da prévia
                </a>
              )}
              {previa?.pdf_url && (
                <a className={estilo.link} href={previa.pdf_url} target="_blank" rel="noopener noreferrer">
                  Abrir o PDF da prévia
                </a>
              )}
              {!previa?.site_url && !previa?.pdf_url && <p className={estilo.meta}>Sem link registrado.</p>}
            </div>
          </>
        )}
      </section>

      {botoes.length > 0 && (
        <div className={estilo.botoes}>
          {botoes.map((b) => {
            const semMensagem = b.acao === "principal_enviada" && !principal;
            const emConfirmacao = confirmando === b.acao;
            return (
              <div key={b.acao + b.rotulo} className={estilo.botaoBloco}>
                {emConfirmacao && b.confirma && <p className={estilo.confirma}>{b.confirma}</p>}
                <button
                  type="button"
                  className={`${estilo.botao} ${b.destaque ? estilo.destaque : ""} ${emConfirmacao ? estilo.perigo : ""}`}
                  disabled={pendente || semMensagem}
                  onClick={() => rodar(b)}
                >
                  {pendente ? "Aguarde…" : emConfirmacao ? "Sim, confirmar" : b.rotulo}
                </button>
                {emConfirmacao && (
                  <button type="button" className={estilo.botao} onClick={() => setConfirmando(null)} disabled={pendente}>
                    Cancelar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lead.passo === "abertura" && (
        <div className={estilo.largar}>
          {!largando ? (
            <button type="button" className={estilo.botaoFraco} onClick={() => setLargando(true)} disabled={pendente}>
              Largar este lead
            </button>
          ) : (
            <>
              <p className={estilo.meta}>Por que está largando?</p>
              {MOTIVOS_LARGAR.map((m) => (
                <button key={m.id} type="button" className={estilo.botao} onClick={() => largar(m.id)} disabled={pendente}>
                  {m.rotulo}
                </button>
              ))}
              <button type="button" className={estilo.botaoFraco} onClick={() => setLargando(false)} disabled={pendente}>
                Voltar
              </button>
            </>
          )}
        </div>
      )}

      {recado && (
        <p className={estilo.recado} role="status">
          {recado}
        </p>
      )}
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
