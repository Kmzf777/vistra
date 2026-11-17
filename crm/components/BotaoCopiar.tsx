"use client";

import { useEffect, useRef, useState } from "react";
import estilo from "./BotaoCopiar.module.css";

// Plano B quando a API de área de transferência não existe ou foi negada:
// um <textarea> fora da tela, selecionado, com o comando antigo.
function copiarPorSelecao(texto: string): boolean {
  const campo = document.createElement("textarea");
  campo.value = texto;
  campo.readOnly = true;
  campo.setAttribute("aria-hidden", "true");
  campo.style.position = "fixed";
  campo.style.top = "0";
  campo.style.left = "-9999px";
  campo.style.opacity = "0";
  document.body.appendChild(campo);
  campo.focus();
  campo.select();
  campo.setSelectionRange(0, texto.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(campo);
  return ok;
}

type Props = {
  texto: string;
  rotulo: string;
  desabilitado?: boolean;
  /** Avisa o pai quando copiou de verdade (para marcar "parte 1 copiada"). */
  aoCopiar?: () => void;
  /** Mostra a pré-visualização do texto abaixo do botão. */
  mostrarTexto?: boolean;
};

export default function BotaoCopiar({ texto, rotulo, desabilitado, aoCopiar, mostrarTexto }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (relogio.current) clearTimeout(relogio.current);
  }, []);

  // A cópia começa dentro do próprio onClick: o Safari só aceita no gesto do toque.
  function copiar() {
    let promessa: Promise<boolean>;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      promessa = navigator.clipboard.writeText(texto).then(
        () => true,
        () => copiarPorSelecao(texto), // NotAllowedError e afins
      );
    } else {
      promessa = Promise.resolve(copiarPorSelecao(texto));
    }
    void promessa.then((ok) => {
      setFalhou(!ok);
      setCopiado(ok);
      if (ok) aoCopiar?.();
      if (relogio.current) clearTimeout(relogio.current);
      relogio.current = setTimeout(() => {
        setCopiado(false);
        setFalhou(false);
      }, 4000);
    });
  }

  return (
    <div className={estilo.bloco}>
      <button
        type="button"
        className={`${estilo.botao} ${copiado ? estilo.copiado : ""}`}
        onClick={copiar}
        disabled={desabilitado}
      >
        {copiado ? "Copiado" : rotulo}
      </button>
      {falhou && (
        <p className={estilo.falha} role="alert">
          Não deu para copiar. Segure o texto abaixo e copie à mão.
        </p>
      )}
      {(mostrarTexto || falhou) && <p className={estilo.texto}>{texto}</p>}
    </div>
  );
}
