"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import estilo from "./MenuLateral.module.css";

type Porta = { href: string; nome: string; curto: string; desc: string; glifo: string };

// A ordem é a do dia de trabalho: o Início, as conversas em andamento e o funil.
const PORTAS_VENDEDOR: Porta[] = [
  { href: "/inicio", nome: "Início", curto: "Início", desc: "o que fazer agora", glifo: "◉" },
  { href: "/conversas", nome: "Minhas conversas", curto: "Conversas", desc: "na sua mão", glifo: "▪" },
  { href: "/funil", nome: "Funil", curto: "Funil", desc: "seus qualificados", glifo: "▤" },
];

// O admin tem as mesmas portas e mais as de gestão.
const PORTAS_ADMIN: Porta[] = [
  { href: "/admin", nome: "Painel", curto: "Painel", desc: "a equipe toda", glifo: "▦" },
  { href: "/admin/previas", nome: "Sites para fazer", curto: "Sites", desc: "prévias pedidas", glifo: "◧" },
  { href: "/admin/vendas", nome: "Vendas", curto: "Vendas", desc: "fechamentos", glifo: "$" },
  { href: "/admin/equipe", nome: "Equipe e fila", curto: "Equipe", desc: "pessoas e cotas", glifo: "☰" },
];

export default function MenuLateral({ papel }: { papel: "vendedor" | "admin" }) {
  const caminho = usePathname();
  const portas = papel === "admin" ? [...PORTAS_VENDEDOR, ...PORTAS_ADMIN] : PORTAS_VENDEDOR;

  return (
    <nav className={estilo.menu}>
      <Link href="/inicio" className={estilo.marca} aria-label="Vistra CRM">
        <svg className={estilo.simbolo} viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="100" fill="#39FF14" />
          <path d="M52 56 H82 L94 122 L128 56 H158 L104 150 H76 Z" fill="#000" />
        </svg>
        <span className={estilo.nomeMarca}>
          vistra<b>.ia</b>
          <small>CRM</small>
        </span>
      </Link>

      <ul className={estilo.portas}>
        {portas.map((p) => {
          // /admin é prefixo das outras portas de admin: só acende na própria página.
          const aqui = p.href === "/admin" ? caminho === "/admin" : caminho === p.href || caminho.startsWith(p.href + "/");
          return (
            <li key={p.href}>
              <Link href={p.href} className={`${estilo.porta} ${aqui ? estilo.aqui : ""}`}>
                <span className={estilo.glifo} aria-hidden>
                  {p.glifo}
                </span>
                <span className={estilo.texto}>
                  <strong className={estilo.longo}>{p.nome}</strong>
                  <strong className={estilo.curto}>{p.curto}</strong>
                  <em>{p.desc}</em>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* O rodapé do menu é preenchido pelo SessaoMenu (quem está logado + sair). */}
      <div className={estilo.pe} id="menu-sessao" />
    </nav>
  );
}
