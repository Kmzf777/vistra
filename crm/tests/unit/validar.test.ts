import { describe, expect, it } from "vitest";
import { FOLGA_PREENCHIMENTO, LIMITE_CARACTERES, validarMensagem, type ContextoValidacao } from "../../lib/mensagens/validar";

const P1 =
  "que bom falar com você! Sou [nome].\nvi a nota 4,8 da Pet Shop Exemplo 01 no Google, com 120 avaliações. Parabéns, nota assim não é fácil!";
const P2 =
  "só não achei um site de vocês. Aí quem acha vocês no Google muitas vezes pergunta tudo no WhatsApp, quanto é o banho, se tem horário, onde fica.\ncom um site, o tutor já vê os serviços, o horário e as fotos, e chama vocês só para marcar.";
const P3 =
  "estou montando uma startup com uns amigos e, para levantar capital, fazemos sites por um preço justo.\nainda hoje a gente monta uma prévia do site com as fotos e as avaliações de vocês. É gratuita e você não precisa fazer nada. Quer ver?";
const BASE = [P1, P2, P3];
const CTX: ContextoValidacao = { nota: 4.8, avaliacoes: 120, clinica: false };

const erros = (partes: string[], ctx = CTX) => validarMensagem(partes, ctx);
const com = (i: number, de: string, para: string) => BASE.map((p, k) => (k === i ? p.replace(de, para) : p));

describe("validarMensagem", () => {
  it("constantes", () => {
    expect(LIMITE_CARACTERES).toBe(650);
    expect(FOLGA_PREENCHIMENTO).toBe(30);
  });
  it("a base passa", () => {
    expect(erros(BASE)).toEqual([]);
  });
  it("dois-pontos", () => {
    expect(erros(com(1, "tudo no WhatsApp,", "tudo no WhatsApp:")).join("|")).toMatch(/dois-pontos/);
  });
  it("travessão", () => {
    expect(erros(com(1, "já vê", "— já vê")).join("|")).toMatch(/travessão/);
    expect(erros(com(1, "já vê", "– já vê")).join("|")).toMatch(/travessão/);
  });
  it("cita a Vistra", () => {
    expect(erros(com(2, "uns amigos", "a VISTRA")).join("|")).toMatch(/cita a Vistra/);
  });
  it("link ou telefone", () => {
    expect(erros(com(2, "preço justo", "preço justo em www.exemplo.com.br")).join("|")).toMatch(/link ou telefone/);
    expect(erros(com(2, "preço justo", "preço justo 90000-0001")).join("|")).toMatch(/link ou telefone/);
  });
  it("aceita o domínio permitido", () => {
    const partes = com(2, "preço justo", "www.exemplo.com.br");
    expect(erros(partes, { ...CTX, dominioPermitido: "www.exemplo.com.br" })).toEqual([]);
  });
  it("pontuação seguida de minúscula na mesma linha", () => {
    expect(erros(com(0, "Parabéns, nota", "Parabéns! só nota")).join("|")).toMatch(/minúscula na mesma linha/);
  });
  it("linha começa com maiúscula", () => {
    expect(erros(com(1, "só não achei", "Só não achei")).join("|")).toMatch(/começa com maiúscula/);
    expect(erros(com(1, "\ncom um site", "\nCom um site")).join("|")).toMatch(/começa com maiúscula/);
  });
  it("linha pode começar por [", () => {
    expect(erros(com(0, "que bom falar", "[nome] que bom falar").map((p, i) => (i === 0 ? p.replace("Sou [nome]", "Sou eu") : p)))).toEqual([]);
  });
  it("somos da UFU", () => {
    expect(erros(com(2, "uns amigos", "uns amigos, somos da UFU")).join("|")).toMatch(/somos da UFU/);
  });
  it("2 ou 3 partes", () => {
    expect(erros([P1]).join("|")).toMatch(/2 ou 3 partes/);
    expect(erros([P1, P2, P3, "estou aqui?"]).join("|")).toMatch(/2 ou 3 partes/);
  });
  it("passa de 620 caracteres", () => {
    const longa = com(1, "marcar.", "marcar. " + "e ".repeat(120).trim() + ".");
    expect(erros(longa).join("|")).toMatch(/passa de 620 caracteres/);
  });
  it("nota diferente do dado", () => {
    expect(erros(com(0, "nota 4,8", "nota 4,9")).join("|")).toMatch(/nota diferente do dado/);
  });
  it("avaliações diferentes do dado", () => {
    expect(erros(com(0, "120 avaliações", "130 avaliações")).join("|")).toMatch(/avaliações diferentes do dado/);
  });
  it("formata milhar com ponto e nota inteira sem casa", () => {
    const partes = com(0, "nota 4,8", "nota 5").map((p) => p.replace("120 avaliações", "1.234 avaliações"));
    expect(erros(partes, { nota: 5, avaliacoes: 1234, clinica: false })).toEqual([]);
  });
  it("pula nota e avaliações quando nulas", () => {
    expect(erros(com(0, "nota 4,8", "nota 3,1"), { nota: null, avaliacoes: null, clinica: false })).toEqual([]);
  });
  it("termos vedados para clínica", () => {
    for (const termo of ["resultado", "garantia", "antes e depois", "mais pacientes"]) {
      const partes = com(2, "preço justo", `${termo}`);
      expect(erros(partes, { ...CTX, clinica: true }).join("|")).toMatch(/termo vedado para clínica/);
    }
    expect(erros(com(2, "preço justo", "resultado"))).toEqual([]);
  });
  it("falta [nome], aceita [seu nome]", () => {
    expect(erros(com(0, "Sou [nome]", "Sou eu")).join("|")).toMatch(/falta \[nome\]/);
    expect(erros(com(0, "[nome]", "[seu nome]"))).toEqual([]);
  });
  it("não exige [curso]", () => {
    expect(erros(BASE).join("|")).not.toMatch(/curso/);
  });
  it("a última parte termina com pergunta", () => {
    expect(erros(com(2, "Quer ver?", "Quer ver.")).join("|")).toMatch(/termina com pergunta/);
  });
});

import { validarEstiloTexto } from "../../lib/mensagens/validar";
describe("validarEstiloTexto", () => {
  it("aceita texto de modelo com quebra depois da pontuação", () => {
    expect(validarEstiloTexto("oi!\nnão é agendamento, é um assunto. Consegue me passar para alguém?")).toEqual([]);
  });
  it("recusa dois-pontos, travessão e pontuação seguida de minúscula", () => {
    expect(validarEstiloTexto("oi: tudo bem")).toContain("tem dois-pontos");
    expect(validarEstiloTexto("oi — tudo bem")).toContain("tem travessão");
    expect(validarEstiloTexto("oi! não é agendamento")).toContain("pontuação seguida de minúscula na mesma linha");
  });
});
