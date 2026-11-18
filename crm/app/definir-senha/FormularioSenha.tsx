"use client";

import { useState, useTransition } from "react";
import { definirSenha } from "./acoes";
import estilo from "../login/login.module.css";

export default function FormularioSenha() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pendente) return;
    setErro(null);
    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    iniciar(async () => {
      const r = await definirSenha(senha);
      // Em sucesso a ação redireciona e nunca volta aqui.
      if (r && !r.ok) setErro(r.erro);
    });
  }

  return (
    <div className={estilo.bloco}>
      <span className="rotulo">primeiro acesso</span>
      <form className={estilo.forma} onSubmit={enviar} noValidate>
        <div className={estilo.linha}>
          <label className="rotulo" htmlFor="senha">
            nova senha
          </label>
          <input
            id="senha"
            className="campo"
            type="password"
            name="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            placeholder="pelo menos 8 caracteres"
            disabled={pendente}
            autoFocus
          />
        </div>
        {erro && (
          <div className={estilo.erro} role="alert">
            <span>{erro}</span>
          </div>
        )}
        <button type="submit" className={`btn btn-forte ${estilo.entrar}`} disabled={pendente}>
          {pendente ? "salvando…" : "Definir senha"}
        </button>
      </form>
    </div>
  );
}
