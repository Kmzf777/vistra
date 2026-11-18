"use client";

import { useState, useTransition } from "react";
import { definirVendedor, editarPerfil } from "@/app/(crm)/admin/acoes";
import estilo from "./Formularios.module.css";

type Props = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  cota: number;
  curso: string;
  artigo: "o" | "a";
  souEu: boolean;
};

export default function LinhaEquipe({ id, nome, email, papel, ativo, cota, curso, artigo, souEu }: Props) {
  const [valor, setValor] = useState(String(cota));
  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState(nome);
  const [novoCurso, setNovoCurso] = useState(curso);
  const [novoArtigo, setNovoArtigo] = useState<string>(artigo);
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

  function salvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setRecado(null);
    iniciar(async () => {
      const r = await editarPerfil(id, { nome: novoNome, curso: novoCurso, artigo: novoArtigo });
      if (r.ok) {
        setRecado(r.recado);
        setEditando(false);
      } else setErro(r.erro);
    });
  }

  return (
    <li className={estilo.pessoa}>
      <p>
        <strong>{nome || email}</strong>{" "}
        <span className={estilo.ajuda}>{papel === "admin" ? "admin" : ativo ? "ativo" : "desativado"}</span>
      </p>
      <p className={estilo.ajuda}>
        {email}
        {curso ? ` · ${curso} · Sou ${artigo} …` : " · sem curso (as mensagens ficam bloqueadas)"}
      </p>
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
        {!editando && (
          <button type="button" className="btn" disabled={pendente} onClick={() => setEditando(true)}>
            Editar nome e curso
          </button>
        )}
      </div>
      {editando && (
        <form className={estilo.form} onSubmit={salvarPerfil}>
          <label className={estilo.campo}>
            Nome
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} maxLength={120} required />
          </label>
          <label className={estilo.campo}>
            Curso
            <input value={novoCurso} onChange={(e) => setNovoCurso(e.target.value)} maxLength={120} placeholder="Ex.: Direito" required />
            <span className={estilo.ajuda}>Entra na mensagem: &quot;estudo [curso] na UFU&quot;.</span>
          </label>
          <label className={estilo.campo}>
            Como a pessoa se apresenta
            <select value={novoArtigo} onChange={(e) => setNovoArtigo(e.target.value)}>
              <option value="o">Sou o …</option>
              <option value="a">Sou a …</option>
            </select>
          </label>
          <div className={estilo.acoes}>
            <button type="submit" className="btn btn-forte" disabled={pendente}>
              {pendente ? "Salvando…" : "Salvar perfil"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={pendente}
              onClick={() => {
                setEditando(false);
                setNovoNome(nome);
                setNovoCurso(curso);
                setNovoArtigo(artigo);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
      {recado && <p className={estilo.ok}>{recado}</p>}
    </li>
  );
}
