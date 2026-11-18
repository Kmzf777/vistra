"use client";

import { useState, useTransition } from "react";
import { marcarComissaoRepassada, marcarVendaPaga } from "@/app/(crm)/admin/acoes";
import estilo from "./Formularios.module.css";

function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** "Marcar pago" e depois "Marcar repassado", com a data (hoje por padrão). */
export default function AcoesVenda({ vendaId, pago, repassado }: { vendaId: string; pago: boolean; repassado: boolean }) {
  const [data, setData] = useState("");
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (repassado) return <p className={estilo.ajuda}>Comissão repassada.</p>;

  function marcar() {
    setErro(null);
    iniciar(async () => {
      const dia = data || hojeEmBrasilia();
      const r = pago ? await marcarComissaoRepassada(vendaId, dia) : await marcarVendaPaga(vendaId, dia);
      if (!r.ok) setErro(r.erro);
    });
  }

  return (
    <div className={estilo.acoes}>
      <label className={estilo.campo}>
        {pago ? "Data do repasse" : "Data do pagamento"}
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </label>
      <button type="button" className="btn btn-forte" disabled={pendente} onClick={marcar}>
        {pago ? "Marcar repassado" : "Marcar pago"}
      </button>
      {erro && (
        <p className={estilo.erro} role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
