import { describe, expect, it } from "vitest";
import { converterLeadRaspado, type LeadRaspado } from "../../lib/importacao/converter";

const base: LeadRaspado = {
  id: "exemplo-01",
  nome: "Pet Shop Exemplo 01",
  cat: "Pet shop",
  tel: "(34) 90000-0001",
  end: "Rua Exemplo, 1",
  nota: "4,7",
  aval: "120",
  ig: null,
  seguidores: null,
  site: null,
  fechado: false,
  email: null,
  nicho: "Pet shop",
  gancho: null,
  prioridade: 1,
  veredito: "PODE_ABORDAR",
  placeId: "exemplo-place-01",
  ig_ultimo_post: null,
};
const opcoes = { cidade: "Uberlândia", uf: "MG", verificadoEm: "2026-10-28T12:00:00Z" };

describe("converterLeadRaspado", () => {
  it("converte os campos", () => {
    const { lead, aviso } = converterLeadRaspado(base, opcoes);
    expect(aviso).toBeNull();
    expect(lead).not.toBeNull();
    expect(lead!.nota).toBe(4.7);
    expect(lead!.avaliacoes).toBe(120);
    expect(lead!.google_place_id).toBe("exemplo-place-01");
    expect(lead!.origem_id).toBe("exemplo-01");
    expect(lead!.telefones).toEqual([
      { e164: "+5534900000001", tipo: "celular", origem: "google", principal: true },
    ]);
    expect(lead!.verificacao?.veredito).toBe("PODE_ABORDAR");
    expect(lead!.verificacao?.ferramenta).toBe("verificar_sem_site.py");
    expect(lead!.estado_inicial).toBe("no_poco");
  });
  it("telefone inválido vira aviso e lead sem telefone", () => {
    const { lead, aviso } = converterLeadRaspado({ ...base, tel: "123" }, opcoes);
    expect(lead!.telefones).toEqual([]);
    expect(aviso).toContain("telefone inválido");
  });
});
