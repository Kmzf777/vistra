import { describe, expect, it } from "vitest";
import { lerPedido } from "../../scripts/criar-dominio";

describe("lerPedido", () => {
  it("nicho com clínica e conselho", () => {
    expect(lerPedido(["--nicho", " Nicho Exemplo ", "--clinica", "--conselho", "CFO 196/2019"])).toEqual({
      nicho: { nome: "Nicho Exemplo", clinica: true, conselho: "CFO 196/2019" },
      cidade: null,
      gravar: false,
    });
  });
  it("cidade com UF em maiúsculas e --gravar", () => {
    expect(lerPedido(["--cidade", "Cidade Exemplo", "--uf", "ex", "--gravar"])).toEqual({
      nicho: null,
      cidade: { nome: "Cidade Exemplo", uf: "EX" },
      gravar: true,
    });
  });
  it("nada pedido é erro", () => {
    expect(lerPedido(["--gravar"])).toEqual({ erro: expect.stringMatching(/--nicho/) });
  });
  it("cidade sem UF válida é erro", () => {
    expect(lerPedido(["--cidade", "Cidade Exemplo"])).toEqual({ erro: expect.stringMatching(/--uf/) });
    expect(lerPedido(["--cidade", "Cidade Exemplo", "--uf", "MGX"])).toEqual({ erro: expect.stringMatching(/--uf/) });
  });
  it("valor que parece outra opção não vira nome", () => {
    expect(lerPedido(["--nicho", "--gravar"])).toEqual({ erro: expect.stringMatching(/--nicho/) });
  });
});
