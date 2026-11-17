import Link from "next/link";
import FormConvite from "@/components/FormConvite";
import LinhaEquipe from "@/components/LinhaEquipe";
import { carregarEquipe } from "@/lib/dados/admin";
import { exigirAdmin } from "@/lib/dados/sessao";
import estilo from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function Equipe() {
  const eu = await exigirAdmin();
  const { pessoas, cotaPadrao } = await carregarEquipe();

  return (
    <div className={estilo.tela}>
      <h1 className={estilo.titulo}>Equipe</h1>
      <div className={estilo.atalhos}>
        <Link href="/admin/fila">Fila e configuração</Link>
      </div>

      <section className={estilo.bloco}>
        <h2 className={estilo.sub}>Convidar pessoa</h2>
        <p className={estilo.nota}>
          O sistema não envia e-mail. Gere o link, copie e mande pelo WhatsApp para a própria pessoa. Cota inicial: {cotaPadrao} por dia.
        </p>
        <FormConvite modo="convite" />
      </section>

      <section className={estilo.bloco}>
        <h2 className={estilo.sub}>Esqueceu a senha</h2>
        <p className={estilo.nota}>Gera um link para a pessoa entrar e definir uma senha nova. Mande pelo WhatsApp.</p>
        <FormConvite modo="acesso" />
      </section>

      <section>
        <h2 className={estilo.sub}>Pessoas ({pessoas.length})</h2>
        <ul className={estilo.lista}>
          {pessoas.map((p) => (
            <LinhaEquipe key={p.id} id={p.id} nome={p.nome} email={p.email} papel={p.papel} ativo={p.ativo} cota={p.cota} souEu={p.id === eu.id} />
          ))}
        </ul>
      </section>
    </div>
  );
}
