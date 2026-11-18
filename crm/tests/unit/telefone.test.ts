import { describe, expect, it } from "vitest";
import { digitosWhatsApp, normalizarTelefone, telefoneDoFormulario } from "../../lib/telefone";

describe("normalizarTelefone", () => {
  it("celular com máscara", () => {
    expect(normalizarTelefone("(34) 90000-0001")).toEqual({ e164: "+5534900000001", tipo: "celular" });
  });
  it("formatos diferentes dão o mesmo e164", () => {
    for (const bruto of ["34900000001", "+55 34 90000-0001", "034 90000 0001"]) {
      expect(normalizarTelefone(bruto)?.e164).toBe("+5534900000001");
    }
  });
  it("fixo", () => {
    expect(normalizarTelefone("(34) 3000-0007")).toEqual({ e164: "+553430000007", tipo: "fixo" });
  });
  it("inválidos dão null", () => {
    expect(normalizarTelefone("(34) 9000-0001")).toBeNull();
    expect(normalizarTelefone("0001")).toBeNull();
    expect(normalizarTelefone("")).toBeNull();
  });
});

describe("telefoneDoFormulario", () => {
  it("vazio é opcional", () => {
    expect(telefoneDoFormulario("  ")).toEqual({ e164: null });
  });
  it("com máscara ou com DDI vira E.164", () => {
    expect(telefoneDoFormulario("(34) 90000-0001")).toEqual({ e164: "+5534900000001" });
    expect(telefoneDoFormulario("+5534900000001")).toEqual({ e164: "+5534900000001" });
  });
  it("inválido devolve o erro em português", () => {
    expect(telefoneDoFormulario("12345")).toEqual({ erro: "Telefone inválido. Use DDD e número, como (34) 90000-0000." });
  });
});

describe("digitosWhatsApp", () => {
  it("tira o +", () => {
    expect(digitosWhatsApp("+5534900000001")).toBe("5534900000001");
  });
});
