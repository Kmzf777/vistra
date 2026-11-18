import FormPrevia from "@/components/FormPrevia";
import { exigirAdmin } from "@/lib/dados/sessao";
import { traduzirErro } from "@/lib/resultado";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import estilo from "./previas.module.css";

export const dynamic = "force-dynamic";

type Pedido = {
  id: string;
  status: string;
  pedido_em: string;
  site_url: string | null;
  pdf_url: string | null;
  pronta_em: string | null;
  leads: {
    nome: string;
    instagram: string | null;
    site: string | null;
    gancho: string | null;
    nichos: { nome: string } | null;
  } | null;
  perfis: { nome: string } | null;
};

function haQuanto(iso: string, agora: number): string {
  const h = Math.max(0, (agora - Date.parse(iso)) / 3_600_000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${Math.floor(h)} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export default async function SitesParaFazer() {
  await exigirAdmin();
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("pedidos_previa")
    .select(
      "id, status, pedido_em, site_url, pdf_url, pronta_em, leads(nome, instagram, site, gancho, etapa, nichos(nome)), perfis!pedidos_previa_vendedor_id_fkey(nome)",
    )
    .in("status", ["pendente", "pronta"])
    .order("pedido_em", { ascending: true });
  if (error) throw new Error(traduzirErro(error));

  const pedidos = (data ?? []) as unknown as (Pedido & { leads: { etapa: string | null } | null })[];
  // Pedido de lead que já perdeu não vale mais: o banco recusa o anexo.
  const pendentes = pedidos.filter((p) => p.status === "pendente" && p.leads?.etapa === "previa_pedida");
  const prontas = pedidos.filter((p) => p.status === "pronta" && p.leads?.etapa === "previa_pronta");
  const agora = Date.now();

  return (
    <div className={estilo.tela}>
      <h1 className={estilo.titulo}>Sites para fazer</h1>

      <section>
        <h2 className={estilo.sub}>Pedidos ({pendentes.length})</h2>
        {pendentes.length === 0 && <p className={estilo.vazio}>Nenhum pedido esperando.</p>}
        <ul className={estilo.lista}>
          {pendentes.map((p) => (
            <li key={p.id} className={estilo.cartao}>
              <p className={estilo.nome}>
                {p.leads?.nome} <span className={estilo.tempo}>pedido {haQuanto(p.pedido_em, agora)}</span>
              </p>
              <dl className={estilo.dados}>
                <div>
                  <dt>Nicho</dt>
                  <dd>{p.leads?.nichos?.nome ?? "—"}</dd>
                </div>
                <div>
                  <dt>Instagram</dt>
                  <dd>{p.leads?.instagram ?? "—"}</dd>
                </div>
                <div>
                  <dt>Site</dt>
                  <dd>{p.leads?.site ?? "—"}</dd>
                </div>
                <div>
                  <dt>Gancho</dt>
                  <dd>{p.leads?.gancho ?? "—"}</dd>
                </div>
                <div>
                  <dt>Vendedor</dt>
                  <dd>{p.perfis?.nome ?? "—"}</dd>
                </div>
              </dl>
              <FormPrevia pedidoId={p.id} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={estilo.sub}>Prontas, esperando o vendedor ({prontas.length})</h2>
        {prontas.length === 0 && <p className={estilo.vazio}>Nenhuma prévia esperando envio.</p>}
        <ul className={estilo.lista}>
          {prontas.map((p) => (
            <li key={p.id} className={estilo.cartao}>
              <p className={estilo.nome}>
                {p.leads?.nome}{" "}
                <span className={estilo.tempo}>
                  pronta {p.pronta_em ? haQuanto(p.pronta_em, agora) : ""} · vendedor {p.perfis?.nome ?? "—"}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
