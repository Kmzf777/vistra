"use client";

import { useState, useTransition } from "react";
import { alternarFiltroFila } from "@/app/(crm)/admin/acoes";
import estilo from "./Formularios.module.css";

export default function FiltroFila({ tipo, id, nome, ativo }: { tipo: "cidade" | "nicho"; id: string; nome: string; ativo: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <li className={estilo.pessoa}>
      <div className={estilo.acoes}>
        <span>{nome}</span>
        <button
          type="button"
          className={ativo ? "btn" : "btn btn-forte"}
          aria-pressed={ativo}
          disabled={pendente}
          onClick={() => {
            setErro(null);
            iniciar(async () => {
              const r = await alternarFiltroFila(tipo, id, !ativo);
              if (!r.ok) setErro(r.erro);
            });
          }}
        >
          {ativo ? "Ativo: desligar" : "Desligado: ligar"}
        </button>
      </div>
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
    </li>
  );
}
