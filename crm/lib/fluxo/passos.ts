// Os passos do lead e os botões de resultado de cada um. Módulo puro: sem servidor, sem banco.

export type Passo = "abertura" | "quem_respondeu" | "robo" | "acompanhamento" | "principal" | "resultado";

/** Os valores de `p_acao` de `registrar_acao`. */
export type Acao =
  | "abertura_enviada"
  | "numero_errado"
  | "robo"
  | "pessoa"
  | "sem_resposta"
  | "acompanhamento_enviado"
  | "principal_enviada"
  | "perguntou"
  | "quer_previa"
  | "sem_interesse"
  | "pediu_parar"
  | "previa_enviada";

export type Botao = { acao: Acao; rotulo: string; destaque: boolean; confirma?: string };

/** Ordem em que os passos aparecem na lista da tela do lead. */
export const PASSOS: { passo: Passo; rotulo: string }[] = [
  { passo: "abertura", rotulo: "Abertura" },
  { passo: "quem_respondeu", rotulo: "Quem respondeu" },
  { passo: "robo", rotulo: "Robô" },
  { passo: "acompanhamento", rotulo: "Acompanhamento" },
  { passo: "principal", rotulo: "Mensagem principal" },
  { passo: "resultado", rotulo: "Resultado" },
];

export function botoesDoPasso(passo: Passo | null, etapa: string | null): Botao[] {
  if (passo === "abertura") {
    return [
      { acao: "abertura_enviada", rotulo: "Enviei a abertura", destaque: true },
      { acao: "numero_errado", rotulo: "Número errado ou sem WhatsApp", destaque: false },
    ];
  }
  if (passo === "quem_respondeu") {
    return [
      { acao: "robo", rotulo: "Caiu no robô", destaque: false },
      { acao: "pessoa", rotulo: "Falou uma pessoa", destaque: true },
      { acao: "sem_resposta", rotulo: "Ninguém respondeu", destaque: false },
    ];
  }
  if (passo === "robo") {
    return [
      { acao: "pessoa", rotulo: "Falou uma pessoa", destaque: true },
      { acao: "sem_resposta", rotulo: "Ninguém respondeu", destaque: false },
    ];
  }
  if (passo === "acompanhamento") {
    return [{ acao: "acompanhamento_enviado", rotulo: "Enviei o acompanhamento", destaque: true }];
  }
  if (passo === "principal") {
    return [{ acao: "principal_enviada", rotulo: "Mandei a mensagem principal", destaque: true }];
  }
  if (passo === "resultado") {
    return [
      { acao: "quer_previa", rotulo: "Quer ver a prévia", destaque: true },
      { acao: "perguntou", rotulo: "Perguntou outra coisa ou preço", destaque: false },
      { acao: "sem_interesse", rotulo: "Não tem interesse", destaque: false },
      { acao: "sem_resposta", rotulo: "Não respondeu", destaque: false },
      {
        acao: "pediu_parar",
        rotulo: "Pediu para não chamar mais",
        destaque: false,
        confirma: "Isso bloqueia este número para todo mundo. Confirmar?",
      },
    ];
  }
  if (etapa === "previa_pronta") {
    return [{ acao: "previa_enviada", rotulo: "Enviei a prévia", destaque: true }];
  }
  return [];
}
