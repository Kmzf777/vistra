import { describe, expect, it } from "vitest";
import { classificarAgora, type LeadConversa } from "@/lib/fluxo/agora";

const agora = new Date("2026-11-10T13:00:00Z");

function lead(parcial: Partial<LeadConversa> & { id: string }): LeadConversa {
  return {
    nome: `Lead ${parcial.id}`,
    nicho: null,
    passo: null,
    etapa: null,
    proximo_passo_em: null,
    ultima_atividade_em: "2026-11-09T10:00:00Z",
    ...parcial,
  };
}

describe("classificarAgora", () => {
  it("põe prévia pronta primeiro e resultado em seguida", () => {
    const r = classificarAgora(
      [lead({ id: "r", passo: "resultado" }), lead({ id: "p", etapa: "previa_pronta" })],
      agora,
    );
    expect(r.map((i) => [i.id, i.motivo])).toEqual([
      ["p", "previa_pronta"],
      ["r", "em_andamento"],
    ]);
  });

  it("acompanhamento vence só quando a data chegou", () => {
    const r = classificarAgora(
      [
        lead({ id: "a", passo: "acompanhamento", proximo_passo_em: "2026-11-10T12:00:00Z" }),
        lead({ id: "b", passo: "acompanhamento", proximo_passo_em: "2026-11-11T12:00:00Z" }),
      ],
      agora,
    );
    expect(r.map((i) => [i.id, i.motivo])).toEqual([["a", "acompanhamento_vencido"]]);
  });

  it("deixa fora quem está em quem_respondeu ou abertura", () => {
    const r = classificarAgora(
      [lead({ id: "q", passo: "quem_respondeu" }), lead({ id: "o", passo: "abertura" })],
      agora,
    );
    expect(r).toEqual([]);
  });

  it("ordena o mais parado primeiro dentro do mesmo motivo", () => {
    const r = classificarAgora(
      [
        lead({ id: "novo", passo: "robo", ultima_atividade_em: "2026-11-10T11:00:00Z" }),
        lead({ id: "velho", passo: "principal", ultima_atividade_em: "2026-11-08T11:00:00Z" }),
      ],
      agora,
    );
    expect(r.map((i) => i.id)).toEqual(["velho", "novo"]);
  });

  it("prévia pronta vence mesmo com passo de andamento, e a ordem é previa, andamento, acompanhamento", () => {
    const r = classificarAgora(
      [
        lead({ id: "ac", passo: "acompanhamento", proximo_passo_em: "2026-11-01T00:00:00Z" }),
        lead({ id: "an", passo: "resultado" }),
        lead({ id: "pr", etapa: "previa_pronta", passo: "resultado" }),
      ],
      agora,
    );
    expect(r.map((i) => i.motivo)).toEqual(["previa_pronta", "em_andamento", "acompanhamento_vencido"]);
  });
});
