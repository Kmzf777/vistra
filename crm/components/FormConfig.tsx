"use client";

import { useState, useTransition } from "react";
import { salvarConfiguracao } from "@/app/(crm)/admin/acoes";
import { lerValor } from "@/lib/fluxo/venda";
import estilo from "./Formularios.module.css";

type Config = { preco: number; piso: number; comissao: number; cotaPadrao: number; diasAcompanhamento: number; diasAlerta: number };

const virgula = (n: number) => String(n).replace(".", ",");

export default function FormConfig({ inicial }: { inicial: Config }) {
  const [preco, setPreco] = useState(virgula(inicial.preco));
  const [piso, setPiso] = useState(virgula(inicial.piso));
  const [comissao, setComissao] = useState(virgula(inicial.comissao));
  const [cota, setCota] = useState(String(inicial.cotaPadrao));
  const [acomp, setAcomp] = useState(String(inicial.diasAcompanhamento));
  const [alerta, setAlerta] = useState(String(inicial.diasAlerta));
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setRecado(null);
    iniciar(async () => {
      const r = await salvarConfiguracao({
        preco: lerValor(preco),
        piso: lerValor(piso),
        comissao: lerValor(comissao),
        cotaPadrao: Number(cota),
        diasAcompanhamento: Number(acomp),
        diasAlerta: Number(alerta),
      });
      if (r.ok) setRecado(r.recado);
      else setErro(r.erro);
    });
  }

  return (
    <form className={estilo.form} onSubmit={enviar}>
      <label className={estilo.campo}>
        Preço de tabela (R$)
        <input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} required />
      </label>
      <label className={estilo.campo}>
        Piso de referência (R$)
        <input inputMode="decimal" value={piso} onChange={(e) => setPiso(e.target.value)} required />
        <span className={estilo.ajuda}>Só referência: o vendedor pode negociar abaixo.</span>
      </label>
      <label className={estilo.campo}>
        Comissão (%)
        <input inputMode="decimal" value={comissao} onChange={(e) => setComissao(e.target.value)} required />
        <span className={estilo.ajuda}>Vale para as vendas novas. A venda já registrada guarda o percentual dela.</span>
      </label>
      <label className={estilo.campo}>
        Cota padrão (aberturas por dia)
        <input type="number" inputMode="numeric" min={0} max={50} value={cota} onChange={(e) => setCota(e.target.value)} required />
      </label>
      <label className={estilo.campo}>
        Dias úteis até o acompanhamento
        <input type="number" inputMode="numeric" min={1} max={30} value={acomp} onChange={(e) => setAcomp(e.target.value)} required />
      </label>
      <label className={estilo.campo}>
        Dias úteis sem abertura para o alerta
        <input type="number" inputMode="numeric" min={1} max={30} value={alerta} onChange={(e) => setAlerta(e.target.value)} required />
      </label>
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
      {recado && <p className={estilo.ok}>{recado}</p>}
      <div className={estilo.acoes}>
        <button type="submit" className="btn btn-forte" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>
    </form>
  );
}
