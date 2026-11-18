"use client";

import { useState, useTransition } from "react";
import { bloquearContato } from "@/app/(crm)/admin/acoes";
import estilo from "./Formularios.module.css";

export default function FormBloqueio() {
  const [telefone, setTelefone] = useState("");
  const [place, setPlace] = useState("");
  const [motivo, setMotivo] = useState("pediu_parar");
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setRecado(null);
    iniciar(async () => {
      const r = await bloquearContato(telefone, place, motivo);
      if (r.ok) {
        setRecado(r.recado);
        setTelefone("");
        setPlace("");
      } else setErro(r.erro);
    });
  }

  return (
    <form className={estilo.form} onSubmit={enviar}>
      <label className={estilo.campo}>
        Telefone
        <input inputMode="tel" placeholder="(34) 90000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
      </label>
      <label className={estilo.campo}>
        Place id do Google (opcional)
        <input value={place} onChange={(e) => setPlace(e.target.value)} />
      </label>
      <label className={estilo.campo}>
        Motivo
        <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
          <option value="pediu_parar">Pediu para parar</option>
          <option value="cliente">Já é cliente</option>
          <option value="descarte">Descarte</option>
        </select>
      </label>
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
      {recado && <p className={estilo.ok}>{recado}</p>}
      <div className={estilo.acoes}>
        <button type="submit" className="btn" disabled={pendente}>
          {pendente ? "Bloqueando…" : "Bloquear para todos"}
        </button>
      </div>
    </form>
  );
}
