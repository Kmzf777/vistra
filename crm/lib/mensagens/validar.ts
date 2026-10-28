// Validador das regras de mensagem do Kelwin. Sem server-only e sem "@/", para o tsx também carregar.
export const LIMITE_CARACTERES = 650;
// Folga para nome e negócio entrarem no lugar dos placeholders: o texto com placeholders fica em até 620.
export const FOLGA_PREENCHIMENTO = 30;

export type ContextoValidacao = {
  nota: number | null;
  avaliacoes: number | null;
  clinica: boolean;
  dominioPermitido?: string | null;
};

const TERMOS_CLINICA = ["resultado", "garant", "antes e depois", "mais pacientes"];

// Nota como o gerador escreve: vírgula decimal, inteiro sem casa.
function formatarNota(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

// Inteiro com ponto de milhar.
function formatarInteiro(n: number): string {
  return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function validarMensagem(partes: string[], ctx: ContextoValidacao): string[] {
  const erros: string[] = [];
  if (!Array.isArray(partes) || partes.length < 2 || partes.length > 3) {
    erros.push("precisa ter 2 ou 3 partes");
    if (!Array.isArray(partes) || partes.length === 0) return erros;
  }
  const texto = partes.join("\n");
  const teto = LIMITE_CARACTERES - FOLGA_PREENCHIMENTO;
  const total = partes.join("").length;
  if (total > teto) erros.push(`passa de ${teto} caracteres (${total}, contando os placeholders)`);

  if (texto.includes(":")) erros.push("tem dois-pontos");
  if (/[—–]/.test(texto)) erros.push("tem travessão");
  if (/vistra/i.test(texto)) erros.push("cita a Vistra");
  if (/somos da ufu/i.test(texto)) erros.push("diz \"somos da UFU\"");

  // link ou telefone, menos o domínio permitido
  let semDominio = texto;
  if (ctx.dominioPermitido) semDominio = texto.split(ctx.dominioPermitido).join("");
  if (/https?:\/\/|www\.|\b[\w-]+\.(com|br|net|org|app|site|me)\b|\d{4,5}[-\s]?\d{4}/i.test(semDominio)) {
    erros.push("tem link ou telefone");
  }

  const linhas = partes.flatMap((p) => p.split("\n"));
  if (linhas.some((l) => /[.!?]["')]*[ \t]+\p{Ll}/u.test(l))) {
    erros.push("pontuação seguida de minúscula na mesma linha");
  }
  if (linhas.some((l) => /^\s*\p{Lu}/u.test(l))) erros.push("linha começa com maiúscula");

  if (ctx.nota != null) {
    const m = /\bnota\s+(?:de\s+)?(\d+(?:[.,]\d+)?)/i.exec(texto);
    if (m && m[1].replace(".", ",") !== formatarNota(ctx.nota)) erros.push("nota diferente do dado");
  }
  if (ctx.avaliacoes != null) {
    const m = /(\d+(?:\.\d{3})*)\s+avalia(?:ç|c)(?:ões|oes|ão|ao)/i.exec(texto);
    if (m && m[1] !== formatarInteiro(ctx.avaliacoes)) erros.push("avaliações diferentes do dado");
  }

  if (ctx.clinica) {
    const minusculo = texto.toLowerCase();
    for (const t of TERMOS_CLINICA) {
      if (minusculo.includes(t)) erros.push(`termo vedado para clínica: ${t}`);
    }
  }

  if (!/\[(seu )?nome\]/i.test(texto)) erros.push("falta [nome]");
  if (!partes[partes.length - 1].trim().endsWith("?")) erros.push("a última parte termina com pergunta");
  return erros;
}
