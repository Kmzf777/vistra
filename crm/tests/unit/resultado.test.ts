import { describe, expect, it } from "vitest";
import { traduzirErro } from "@/lib/resultado";

describe("traduzirErro", () => {
  it("devolve a frase do banco quando o código é P0001", () => {
    const frase = "Você já abriu 5 conversas hoje. A cota volta amanhã.";
    expect(traduzirErro({ code: "P0001", message: frase })).toBe(frase);
  });

  it("traduz falta de permissão", () => {
    expect(
      traduzirErro({ code: "42501", message: "permission denied for table leads" }),
    ).toBe("Você não tem permissão para isso.");
  });

  it("traduz sessão expirada", () => {
    expect(traduzirErro({ code: "PGRST301", message: "JWT expired" })).toBe(
      "Sessão expirada. Entre de novo para continuar.",
    );
  });

  it("trata erro ausente", () => {
    expect(traduzirErro(null)).toBe("Não deu para falar com o banco. Tente de novo.");
  });

  it("repassa a mensagem de qualquer outro erro", () => {
    expect(traduzirErro({ code: "XX000", message: "boom" })).toBe(
      "Não deu para falar com o banco: boom",
    );
  });
});
