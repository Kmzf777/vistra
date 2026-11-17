"use client";

import { useState, useTransition } from "react";
import { convidarVendedor, gerarAcesso } from "@/app/(crm)/admin/acoes";
import BotaoCopiar from "./BotaoCopiar";
import estilo from "./Formularios.module.css";

type Modo = "convite" | "acesso";

/** Convite de pessoa nova ou link de acesso para quem esqueceu a senha. Nada é enviado por e-mail. */
export default function FormConvite({ modo }: { modo: Modo }) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [curso, setCurso] = useState("");
  const [artigo, setArtigo] = useState("o");
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLink(null);
    iniciar(async () => {
      const r = modo === "convite" ? await convidarVendedor({ email, nome, curso, artigo }) : await gerarAcesso(email);
      if (r.ok) setLink(r.recado);
      else setErro(r.erro);
    });
  }

  return (
    <form className={estilo.form} onSubmit={enviar}>
      <label className={estilo.campo}>
        E-mail
        <input type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      {modo === "convite" && (
        <>
          <label className={estilo.campo}>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
          <label className={estilo.campo}>
            Curso
            <input value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Ex.: Direito" required />
            <span className={estilo.ajuda}>Entra na mensagem: &quot;estudo [curso] na UFU&quot;.</span>
          </label>
          <label className={estilo.campo}>
            Artigo do curso
            <select value={artigo} onChange={(e) => setArtigo(e.target.value)}>
              <option value="o">o (estudo o curso)</option>
              <option value="a">a (estudo a graduação)</option>
            </select>
          </label>
        </>
      )}
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
      {link && (
        <div className={estilo.campo}>
          <p className={estilo.ok}>Link pronto. Mande pelo WhatsApp para a própria pessoa.</p>
          <BotaoCopiar texto={link} rotulo="Copiar link" mostrarTexto />
        </div>
      )}
      <div className={estilo.acoes}>
        <button type="submit" className="btn btn-forte" disabled={pendente}>
          {pendente ? "Gerando…" : modo === "convite" ? "Gerar convite" : "Gerar link de acesso"}
        </button>
      </div>
    </form>
  );
}
