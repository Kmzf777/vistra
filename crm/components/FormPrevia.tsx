"use client";

import { useState, useTransition } from "react";
import { anexarPrevia } from "@/app/(crm)/admin/acoes";
import estilo from "./Formularios.module.css";

export default function FormPrevia({ pedidoId }: { pedidoId: string }) {
  const [site, setSite] = useState("");
  const [pdf, setPdf] = useState("");
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setRecado(null);
    iniciar(async () => {
      const r = await anexarPrevia(pedidoId, site, pdf);
      if (r.ok) setRecado(r.recado);
      else setErro(r.erro);
    });
  }

  return (
    <form className={estilo.form} onSubmit={enviar}>
      <label className={estilo.campo}>
        Link do site da prévia
        <input type="url" inputMode="url" placeholder="https://" value={site} onChange={(e) => setSite(e.target.value)} required />
      </label>
      <label className={estilo.campo}>
        Link do PDF da prévia
        <input type="url" inputMode="url" placeholder="https://" value={pdf} onChange={(e) => setPdf(e.target.value)} required />
      </label>
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
      {recado && <p className={estilo.ok}>{recado}</p>}
      <div className={estilo.acoes}>
        <button type="submit" className="btn btn-forte" disabled={pendente}>
          {pendente ? "Anexando…" : "Anexar prévia"}
        </button>
      </div>
    </form>
  );
}
