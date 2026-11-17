import { describe, expect, it } from "vitest";
import { botoesDoPasso } from "@/lib/fluxo/passos";

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

  it("quem_respondeu tem robô, pessoa e ninguém", () => {
    expect(botoesDoPasso("quem_respondeu", null).map((x) => x.acao)).toEqual(["robo", "pessoa", "sem_resposta"]);
  });

  it("sem passo e sem prévia pronta não tem botão", () => {
    expect(botoesDoPasso(null, "previa_pedida")).toEqual([]);
  });
});
