// Preenche os placeholders da mensagem, escolhe a saudação e monta o link wa.me.
import { digitosWhatsApp } from "../telefone";

export type Variaveis = { nome: string; curso: string; artigo: "o" | "a"; negocio: string; saudacao?: string };

// Troca por função para que "$&" no valor não vire padrão de substituição.
function trocar(texto: string, padrao: RegExp, valor: string | undefined, chave: string, faltando: string[]): string {
  if (!padrao.test(texto)) return texto;
  padrao.lastIndex = 0;
  if (!valor || !valor.trim()) {
    if (!faltando.includes(chave)) faltando.push(chave);
    return texto;
  }
  return texto.replace(padrao, () => valor.trim());
}

export function preencher(texto: string, v: Variaveis): { texto: string; faltando: string[] } {
  const faltando: string[] = [];
  let t = texto;
  // "Sou o [nome]" vira "Sou a Ana": o artigo vem do perfil. Só quando há nome.
  if (v.nome && v.nome.trim()) {
    t = t.replace(/\b([Ss])ou o (\[(?:seu )?nome\])/g, (_m, s: string, ph: string) => `${s}ou ${v.artigo} ${ph}`);
  }
  t = trocar(t, /\[(?:seu )?nome\]/gi, v.nome, "nome", faltando);
  t = trocar(t, /\[(?:seu )?curso\]/gi, v.curso, "curso", faltando);
  t = trocar(t, /\[negocio\]/gi, v.negocio, "negocio", faltando);
  t = trocar(t, /\[saudacao\]/gi, v.saudacao, "saudacao", faltando);
  return { texto: t, faltando };
}

export function saudacao(agora: Date): "bom dia" | "boa tarde" | "boa noite" {
  const hora = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "America/Sao_Paulo" })
      .formatToParts(agora)
      .find((p) => p.type === "hour")?.value,
  );
  if (hora < 12) return "bom dia";
  if (hora < 18) return "boa tarde";
  return "boa noite";
}

export function linkWhatsApp(e164: string, texto: string): string {
  return `https://wa.me/${digitosWhatsApp(e164)}?text=${encodeURIComponent(texto)}`;
}
