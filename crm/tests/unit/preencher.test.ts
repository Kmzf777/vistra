import { describe, expect, it } from "vitest";
import { linkWhatsApp, preencher, saudacao } from "../../lib/mensagens/preencher";

const v = { nome: "Ana Exemplo", curso: "Direito", artigo: "a" as const, negocio: "Pet Shop Exemplo 01" };

describe("preencher", () => {
  it("troca nome e curso e o artigo", () => {
    expect(preencher("Sou o [nome], estudo [curso] na UFU", v).texto).toBe("Sou a Ana Exemplo, estudo Direito na UFU");
  });
  it("[seu nome] funciona igual", () => {
    expect(preencher("Sou o [seu nome], estudo [seu curso]", v).texto).toBe("Sou a Ana Exemplo, estudo Direito");
  });
  it("sem [curso] no texto, curso vazio não falta", () => {
    const r = preencher("que bom falar com você! Sou [nome].", { ...v, curso: "" });
    expect(r.texto).toBe("que bom falar com você! Sou Ana Exemplo.");
    expect(r.faltando).toEqual([]);
  });
  it("com [curso] no texto e curso vazio, falta e o placeholder fica", () => {
    const r = preencher("estudo [curso]", { ...v, curso: "" });
    expect(r.faltando).toEqual(["curso"]);
    expect(r.texto).toContain("[curso]");
  });
  it("nome vazio falta e o placeholder fica", () => {
    const r = preencher("que bom falar com você! Sou [nome].", { ...v, nome: "" });
    expect(r.faltando).toEqual(["nome"]);
    expect(r.texto).toContain("[nome]");
  });
  it("negocio e saudacao", () => {
    expect(preencher("Olá [saudacao], [negocio]", { ...v, saudacao: "bom dia" }).texto).toBe("Olá bom dia, Pet Shop Exemplo 01");
    expect(preencher("Olá [saudacao]", v).faltando).toEqual(["saudacao"]);
  });
  it("valor com $ não vira padrão de troca", () => {
    expect(preencher("[negocio]", { ...v, negocio: "A$&B" }).texto).toBe("A$&B");
  });
});

describe("saudacao", () => {
  it("pela hora de Brasília", () => {
    expect(saudacao(new Date("2026-11-03T14:59:00Z"))).toBe("bom dia");
    expect(saudacao(new Date("2026-11-03T15:00:00Z"))).toBe("boa tarde");
    expect(saudacao(new Date("2026-11-03T20:59:00Z"))).toBe("boa tarde");
    expect(saudacao(new Date("2026-11-03T21:00:00Z"))).toBe("boa noite");
    expect(saudacao(new Date("2026-11-03T03:00:00Z"))).toBe("bom dia");
  });
});

describe("linkWhatsApp", () => {
  it("codifica o texto inteiro", () => {
    const t = "Olá bom dia\nDog & Cat #1? ção 🐶";
    const l = linkWhatsApp("+5534900000001", t);
    expect(l).toBe("https://wa.me/5534900000001?text=" + encodeURIComponent(t));
    for (const c of ["%0A", "%26", "%23", "%3F"]) expect(l).toContain(c);
  });
});
