"use client";

import { useState } from "react";
import { lerValor } from "@/lib/fluxo/venda";
import estilo from "./Formularios.module.css";

type Props = {
  nome: string;
  precoTabela: number;
  pisoReferencia: number;
  pendente: boolean;
  erro: string | null;
  aoRegistrar: (valor: number, forma: string, fechadoEm: string) => void;
  aoCancelar: () => void;
};

const FORMAS = [
  { id: "pix", nome: "Pix" },
  { id: "boleto", nome: "Boleto" },
  { id: "cartao", nome: "Cartão" },
  { id: "dinheiro", nome: "Dinheiro" },
  { id: "outro", nome: "Outro" },
];

function dinheiro(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export default function FormVenda({ nome, precoTabela, pisoReferencia, pendente, erro, aoRegistrar, aoCancelar }: Props) {
  // O formulário só monta depois do toque em "Fechou", então a data de hoje não diverge na hidratação.
  const [hoje] = useState(hojeEmBrasilia);
  const [valor, setValor] = useState(precoTabela.toFixed(2).replace(".", ","));
  const [forma, setForma] = useState("pix");
  const [data, setData] = useState(hoje);
  const [local, setLocal] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const v = lerValor(valor);
    if (!(v > 0)) return setLocal("Informe o valor da venda.");
    if (!data) return setLocal("Informe a data do fechamento.");
    setLocal(null);
    aoRegistrar(v, forma, data);
  }

  return (
    <form className={estilo.form} onSubmit={enviar}>
      <p>
        <strong>Fechou com {nome}</strong>
      </p>
      <label className={estilo.campo}>
        Valor da venda
        <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} required />
        <span className={estilo.ajuda}>
          Preço de tabela {dinheiro(precoTabela)}. Piso de referência {dinheiro(pisoReferencia)}.
        </span>
      </label>
      <label className={estilo.campo}>
        Forma de pagamento
        <select value={forma} onChange={(e) => setForma(e.target.value)}>
          {FORMAS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label className={estilo.campo}>
        Data do fechamento
        <input type="date" value={data} max={hoje} onChange={(e) => setData(e.target.value)} required />
      </label>
      {(local || erro) && (
        <p className={estilo.erro} role="alert">
          {local ?? erro}
        </p>
      )}
      <div className={estilo.acoes}>
        <button type="submit" className="btn btn-forte" disabled={pendente}>
          {pendente ? "Registrando…" : "Registrar venda"}
        </button>
        <button type="button" className="btn" onClick={aoCancelar} disabled={pendente}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
