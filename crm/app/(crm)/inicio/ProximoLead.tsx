"use client";

import { useState, useTransition } from "react";
import { pegarProximoLead } from "@/app/(crm)/lead/acoes";
import estilo from "./inicio.module.css";

// Botão grande do Início. O servidor redireciona para o lead em caso de sucesso;
// aqui só aparece o erro e o estado "aguarde".
export default function ProximoLead({ reservado, cotaAcabou }: { reservado: boolean; cotaAcabou: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const bloqueado = cotaAcabou && !reservado;
  const texto = pendente
    ? "Buscando…"
    : reservado
      ? "Continuar o lead reservado"
      : cotaAcabou
        ? "A cota de hoje acabou"
        : "Próximo lead";

  function pegar() {
    setErro(null);
    iniciar(async () => {
      const r = await pegarProximoLead();
      // Em sucesso o redirect navega e esta linha nem chega aqui.
      if (r && !r.ok) setErro(r.erro);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        pegar();
      }}
    >
      <button type="submit" className={estilo.proximo} disabled={pendente || bloqueado}>
        {texto}
      </button>
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
    </form>
  );
}
