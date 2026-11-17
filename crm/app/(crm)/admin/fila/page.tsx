import Link from "next/link";
import FiltroFila from "@/components/FiltroFila";
import FormBloqueio from "@/components/FormBloqueio";
import FormConfig from "@/components/FormConfig";
import { carregarFila } from "@/lib/dados/admin";
import estilo from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function Fila() {
  const { cidades, nichos, resumo, config } = await carregarFila();
  const total = resumo.reduce((s, r) => s + r.prontos, 0);

  return (
    <div className={estilo.tela}>
      <h1 className={estilo.titulo}>Fila e configuração</h1>
      <div className={estilo.atalhos}>
        <Link href="/admin/equipe">Equipe</Link>
      </div>

      <section className={estilo.bloco}>
        <h2 className={estilo.sub}>Prontos para abordar ({total})</h2>
        {resumo.length === 0 ? (
          <p className={estilo.vazio}>Nenhum lead pronto agora. Confira as cidades e os nichos ligados abaixo.</p>
        ) : (
          <dl className={estilo.resumo}>
            {resumo.map((r) => (
              <div key={`${r.cidade}|${r.nicho}`} style={{ display: "contents" }}>
                <dt>
                  {r.cidade} · {r.nicho}
                </dt>
                <dd>{r.prontos}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section>
        <h2 className={estilo.sub}>Cidades na fila</h2>
        <ul className={estilo.lista}>
          {cidades.map((c) => (
            <FiltroFila key={c.id} tipo="cidade" id={c.id} nome={`${c.nome} (${c.uf})`} ativo={c.ativa} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className={estilo.sub}>Nichos na fila</h2>
        <ul className={estilo.lista}>
          {nichos.map((n) => (
            <FiltroFila key={n.id} tipo="nicho" id={n.id} nome={n.nome} ativo={n.ativo} />
          ))}
        </ul>
      </section>

      <section className={estilo.bloco}>
        <h2 className={estilo.sub}>Configuração</h2>
        <FormConfig inicial={config} />
      </section>

      <section className={estilo.bloco}>
        <h2 className={estilo.sub}>Bloquear contato</h2>
        <p className={estilo.nota}>O bloqueio vale para a base inteira, inclusive importações futuras.</p>
        <FormBloqueio />
      </section>
    </div>
  );
}
