import { describe, expect, it } from "vitest";
import { botoesDoPasso, ehEnvio, type Passo } from "@/lib/fluxo/passos";

describe("botoesDoPasso", () => {
  it("abertura começa com Enviei a abertura em destaque", () => {
    const b = botoesDoPasso("abertura", null);
    expect(b[0]).toMatchObject({ acao: "abertura_enviada", destaque: true, rotulo: "Enviei a abertura" });
    expect(b.map((x) => x.acao)).toContain("numero_errado");
  });

  it("prévia pronta oferece previa_enviada", () => {
    expect(botoesDoPasso(null, "previa_pronta").map((x) => x.acao)).toContain("previa_enviada");
  });

  it("resultado tem pediu_parar com confirmação", () => {
    const b = botoesDoPasso("resultado", null);
    const parar = b.find((x) => x.acao === "pediu_parar");
    expect(parar?.confirma).toMatch(/bloqueia este número/);
    expect(b.find((x) => x.destaque)?.acao).toBe("quer_previa");
  });

  it("quem_respondeu tem robô, pessoa, ninguém e as duas saídas", () => {
    expect(botoesDoPasso("quem_respondeu", null).map((x) => x.acao)).toEqual([
      "robo",
      "pessoa",
      "sem_resposta",
      "sem_interesse",
      "pediu_parar",
    ]);
  });

  it.each<Passo>(["quem_respondeu", "robo", "principal", "acompanhamento", "resultado"])(
    "%s tem Não tem interesse e Pediu para não chamar mais, este com a confirmação",
    (passo) => {
      const b = botoesDoPasso(passo, null);
      expect(b.find((x) => x.acao === "sem_interesse")?.rotulo).toBe("Não tem interesse");
      const parar = b.find((x) => x.acao === "pediu_parar");
      expect(parar?.rotulo).toBe("Pediu para não chamar mais");
      expect(parar?.confirma).toBe("Isso bloqueia este número para todo mundo. Confirmar?");
    },
  );

  it("abertura não tem as saídas: o lead ainda não está em conversa", () => {
    const acoes = botoesDoPasso("abertura", null).map((x) => x.acao);
    expect(acoes).not.toContain("sem_interesse");
    expect(acoes).not.toContain("pediu_parar");
  });

  it("acompanhamento tem Falou uma pessoa, sem tirar o destaque do envio", () => {
    const b = botoesDoPasso("acompanhamento", null);
    expect(b.find((x) => x.acao === "pessoa")).toMatchObject({ rotulo: "Falou uma pessoa", destaque: false });
    expect(b.find((x) => x.destaque)?.acao).toBe("acompanhamento_enviado");
  });

  it("ehEnvio marca só os botões de mandar mensagem", () => {
    expect(["abertura_enviada", "acompanhamento_enviado", "principal_enviada", "previa_enviada"].every((a) => ehEnvio(a as never))).toBe(
      true,
    );
    expect(["pessoa", "robo", "sem_resposta", "sem_interesse", "pediu_parar", "numero_errado"].some((a) => ehEnvio(a as never))).toBe(
      false,
    );
  });

  it("sem passo e sem prévia pronta não tem botão", () => {
    expect(botoesDoPasso(null, "previa_pedida")).toEqual([]);
  });
});
