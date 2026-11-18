import Link from "next/link";
import { carregarPainel, type LinhaPainel } from "@/lib/dados/admin";
import { lerPeriodo, type Periodo } from "@/lib/periodo";
import estilo from "./admin.module.css";

export const dynamic = "force-dynamic";

const PERIODOS: { id: Periodo; nome: string }[] = [
  { id: "hoje", nome: "Hoje" },
  { id: "semana", nome: "Semana" },
  { id: "tudo", nome: "Desde o início" },
];

const FUSO = "America/Sao_Paulo";

function dinheiro(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function acesso(iso: string | null): string {
  if (!iso) return "nunca entrou";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function Tabela({ linhas, alertaDias }: { linhas: LinhaPainel[]; alertaDias: number }) {
  return (
    <table className={estilo.tabela}>
      <thead>
        <tr>
          <th>Vendedor</th>
          <th className={estilo.num}>Recebidos</th>
          <th className={estilo.num}>Aberturas</th>
          <th className={estilo.num}>Respostas</th>
          <th className={estilo.num}>Pedidos de prévia</th>
          <th className={estilo.num}>Vendas</th>
          <th className={estilo.num}>Comissão a receber</th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <tr key={l.id} className={l.parado ? estilo.parado : undefined}>
            <td className={estilo.nome} data-rotulo="Vendedor">
              {l.nome}
              <span className={estilo.quando}>último acesso: {acesso(l.ultimoAcesso)}</span>
              {l.parado && (
                <span className={estilo.alerta}>
                  há {l.diasSemAbertura} {l.diasSemAbertura === 1 ? "dia útil" : "dias úteis"} sem abertura (alerta a partir de {alertaDias})
                </span>
              )}
            </td>
            <td className={estilo.num} data-rotulo="Recebidos">{l.recebidos}</td>
            <td className={estilo.num} data-rotulo="Aberturas">{l.aberturas}</td>
            <td className={estilo.num} data-rotulo="Respostas">{l.respostas}</td>
            <td className={estilo.num} data-rotulo="Pedidos de prévia">{l.pedidosPrevia}</td>
            <td className={estilo.num} data-rotulo="Vendas">{l.vendas}</td>
            <td className={estilo.num} data-rotulo="Comissão a receber">{dinheiro(l.comissaoAReceber)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function Painel({ searchParams }: { searchParams: Promise<{ periodo?: string | string[] }> }) {
  const periodo = lerPeriodo((await searchParams).periodo);
  const { ativos, inativos, alertaDias } = await carregarPainel(periodo);

  return (
    <div className={estilo.tela}>
      <h1 className={estilo.titulo}>Painel</h1>

      <nav className={estilo.filtro} aria-label="Período">
        {PERIODOS.map((p) => (
          <Link key={p.id} href={`/admin?periodo=${p.id}`} aria-current={p.id === periodo ? "page" : undefined}>
            {p.nome}
          </Link>
        ))}
      </nav>
      <p className={estilo.nota}>
        Os números vêm do histórico: cada ação conta para quem a fez, mesmo se o lead mudar de dono. A comissão a receber
        é a das vendas já pagas e ainda não repassadas, de qualquer data.
      </p>

      <section>
        <h2 className={estilo.sub}>Equipe ativa ({ativos.length})</h2>
        {ativos.length === 0 ? <p className={estilo.vazio}>Ninguém na equipe ainda. Convide pela tela Equipe.</p> : <Tabela linhas={ativos} alertaDias={alertaDias} />}
      </section>

      {inativos.length > 0 && (
        <details className={estilo.recolhido}>
          <summary>Desativados ({inativos.length})</summary>
          <Tabela linhas={inativos} alertaDias={alertaDias} />
        </details>
      )}
    </div>
  );
}
