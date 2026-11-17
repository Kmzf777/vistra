import AcoesVenda from "@/components/AcoesVenda";
import { carregarVendas } from "@/lib/dados/admin";
import estilo from "../admin.module.css";

export const dynamic = "force-dynamic";

const FORMAS: Record<string, string> = { pix: "Pix", boleto: "Boleto", cartao: "Cartão", dinheiro: "Dinheiro", outro: "Outro" };

function dinheiro(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// A data do banco vem como AAAA-MM-DD; formata sem passar por fuso.
function data(d: string | null): string {
  if (!d) return "—";
  const [a, m, dia] = d.split("-");
  return `${dia}/${m}/${a}`;
}

export default async function Vendas() {
  const { vendas, aReceber } = await carregarVendas();

  return (
    <div className={estilo.tela}>
      <h1 className={estilo.titulo}>Vendas</h1>

      <section className={estilo.bloco}>
        <h2 className={estilo.sub}>Comissão a receber por vendedor</h2>
        {aReceber.length === 0 ? (
          <p className={estilo.vazio}>Nada a repassar agora. Entra aqui a venda marcada como paga e ainda não repassada.</p>
        ) : (
          <dl className={estilo.resumo}>
            {aReceber.map((r) => (
              <div key={r.vendedor} style={{ display: "contents" }}>
                <dt>{r.vendedor}</dt>
                <dd>{dinheiro(r.total)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section>
        <h2 className={estilo.sub}>Todas as vendas ({vendas.length})</h2>
        {vendas.length === 0 && <p className={estilo.vazio}>Nenhuma venda registrada ainda.</p>}
        <ul className={estilo.lista}>
          {vendas.map((v) => (
            <li key={v.id} className={estilo.venda}>
              <p>
                <strong>{v.lead}</strong> · {v.vendedor}
              </p>
              <dl className={estilo.dados}>
                <div>
                  <dt>Valor</dt>
                  <dd>{dinheiro(v.valor)}</dd>
                </div>
                <div>
                  <dt>Comissão</dt>
                  <dd>{dinheiro(v.comissao)}</dd>
                </div>
                <div>
                  <dt>Forma</dt>
                  <dd>{FORMAS[v.forma] ?? v.forma}</dd>
                </div>
                <div>
                  <dt>Fechou em</dt>
                  <dd>{data(v.fechadoEm)}</dd>
                </div>
                <div>
                  <dt>Pago em</dt>
                  <dd>{data(v.pagoEm)}</dd>
                </div>
                <div>
                  <dt>Repassado em</dt>
                  <dd>{data(v.repassadoEm)}</dd>
                </div>
              </dl>
              <AcoesVenda vendaId={v.id} pago={v.pagoEm !== null} repassado={v.repassadoEm !== null} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
