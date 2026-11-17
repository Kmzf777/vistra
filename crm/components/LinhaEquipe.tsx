"use client";

import { useState, useTransition } from "react";
import { definirVendedor } from "@/app/(crm)/admin/acoes";
import estilo from "./Formularios.module.css";

type Props = { id: string; nome: string; email: string; papel: string; ativo: boolean; cota: number; souEu: boolean };

export default function LinhaEquipe({ id, nome, email, papel, ativo, cota, souEu }: Props) {
  const [valor, setValor] = useState(String(cota));
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  function salvar(novoAtivo: boolean) {
    setErro(null);
    setRecado(null);
    iniciar(async () => {
      const r = await definirVendedor(id, novoAtivo, Number(valor));
      if (r.ok) setRecado(r.recado);
      else setErro(r.erro);
    });
  }

  return (
    <li className={estilo.pessoa}>
      <p>
        <strong>{nome || email}</strong>{" "}
        <span className={estilo.ajuda}>{papel === "admin" ? "admin" : ativo ? "ativo" : "desativado"}</span>
      </p>
      <p className={estilo.ajuda}>{email}</p>
      <div className={estilo.acoes}>
        <label className={estilo.campo}>
          Cota por dia
          <input type="number" inputMode="numeric" min={0} max={50} value={valor} onChange={(e) => setValor(e.target.value)} />
        </label>
        <button type="button" className="btn" disabled={pendente} onClick={() => salvar(ativo)}>
          Salvar cota
        </button>
        {!souEu && (
          <button
            type="button"
            className={ativo ? "btn" : "btn btn-forte"}
            disabled={pendente}
            onClick={() => {
              if (ativo && !window.confirm(`Desativar ${nome || email}? Os leads em conversa vão para você.`)) return;
              salvar(!ativo);
            }}
          >
            {ativo ? "Desativar" : "Reativar"}
          </button>
        )}
      </div>
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
      {recado && <p className={estilo.ok}>{recado}</p>}
    </li>
  );
}
