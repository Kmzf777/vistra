// Leitura do valor digitado no formulário da venda. Módulo puro.

/** Aceita "350", "350,50" e "1.350,50". */
export function lerValor(texto: string): number {
  const limpo = texto.trim().replace(/\s/g, "").replace(/^R\$/, "");
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  return /^\d+(\.\d{1,2})?$/.test(normal) ? Number(normal) : NaN;
}
