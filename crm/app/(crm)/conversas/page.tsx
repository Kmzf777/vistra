import Link from "next/link";
import { carregarConversas, type LeadConversa } from "@/lib/dados/vendedor";
import estilo from "../inicio/inicio.module.css";

export const dynamic = "force-dynamic";

const GRUPOS: { chave: string; titulo: string }[] = [
  { chave: "reservado", titulo: "Reservado, ainda sem abertura" },
  { chave: "quem_respondeu", titulo: "Esperando resposta" },
  { chave: "robo", titulo: "No robô" },
  { chave: "principal", titulo: "Mensagem principal" },
  { chave: "resultado", titulo: "Aguardando resultado" },
  { chave: "acompanhamento", titulo: "Acompanhamento" },
  { chave: "previa_pedida", titulo: "Prévia pedida" },
  { chave: "previa_pronta", titulo: "Prévia pronta" },
  { chave: "previa_enviada", titulo: "Prévia enviada" },
  { chave: "outros", titulo: "Outros" },
];

function grupoDe(l: LeadConversa): string {
  if (l.passo === "abertura") return "reservado";
  if (l.passo) return l.passo;
  if (l.etapa && GRUPOS.some((g) => g.chave === l.etapa)) return l.etapa;
  return "outros";
}

function dataCurta(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).format(
    new Date(iso),
  );
}

export default async function Conversas() {
  const leads = await carregarConversas();
  const porGrupo = new Map<string, LeadConversa[]>();
  for (const l of leads) {
    const g = grupoDe(l);
    porGrupo.set(g, [...(porGrupo.get(g) ?? []), l]);
  }

  return (
    <div className={estilo.tela}>
      <h1 className={estilo.cota}>Minhas conversas</h1>
      {leads.length === 0 && <p className={estilo.vazio}>Você ainda não tem conversas abertas.</p>}
      {GRUPOS.filter((g) => porGrupo.has(g.chave)).map((g) => (
        <section key={g.chave}>
          <h2 className={estilo.titulo}>
            {g.titulo} ({porGrupo.get(g.chave)!.length})
          </h2>
          <ul className={estilo.lista}>
            {porGrupo.get(g.chave)!.map((l) => (
              <li key={l.id}>
                <Link href={`/lead/${l.id}`} className={estilo.item}>
                  <strong>{l.nome}</strong>
                  {l.passo === "acompanhamento" && l.proximo_passo_em && (
                    <span>A partir de {dataCurta(l.proximo_passo_em)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
