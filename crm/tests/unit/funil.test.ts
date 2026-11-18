import { describe, expect, it } from "vitest";
import {
  acoesDaEtapa,
  cartoesDaEtapa,
  montarCartoes,
  podePedirParar,
  proximaAcao,
  rotuloTempo,
  temperatura,
  type LinhaLeadFunil,
} from "../../components/KanbanTipos";
import { rotuloEvento } from "../../lib/fluxo/eventos";
import { lerValor } from "../../lib/fluxo/venda";

const agora = Date.parse("2026-11-17T12:00:00Z");
const vazio = { telefones: new Map(), contatos: [], eventos: [], previas: new Map(), vendas: new Map() };

function lead(p: Partial<LinhaLeadFunil> & { id: string }): LinhaLeadFunil {
  return {
    nome: `Lead ${p.id}`,
    nicho: null,
    instagram: null,
    site: null,
    etapa: "previa_enviada",
    etapa_desde: "2026-11-17T10:00:00Z",
    ultima_atividade_em: "2026-11-17T10:00:00Z",
    ...p,
  };
}

describe("pediu para parar no funil", () => {
  it("vale nas etapas em jogo", () => {
    for (const e of ["previa_pedida", "previa_pronta", "previa_enviada", "negociando"]) expect(podePedirParar(e)).toBe(true);
  });
  it("não vale nas terminais", () => {
    expect(podePedirParar("fechou")).toBe(false);
    expect(podePedirParar("perdeu")).toBe(false);
  });
});

describe("número bloqueado no funil", () => {
  it("o cartão marca o bloqueio e não leva telefone", () => {
    const [c, d] = montarCartoes(
      [lead({ id: "a" }), lead({ id: "b" })],
      { ...vazio, telefones: new Map([["b", "+5534900000001"]]), bloqueados: new Set(["a"]) },
      agora,
    );
    expect(c).toMatchObject({ numeroBloqueado: true, telefone: null });
    expect(d).toMatchObject({ numeroBloqueado: false, telefone: "+5534900000001" });
  });
});

describe("acoes por etapa", () => {
  it("previa enviada vai a negociando, fechou ou perdeu", () => {
    expect(acoesDaEtapa("previa_enviada")).toEqual(["negociando", "fechou", "perdeu"]);
    expect(proximaAcao("previa_enviada")).toBe("negociando");
  });
  it("previa pedida e pronta só perdem", () => {
    expect(acoesDaEtapa("previa_pedida")).toEqual(["perdeu"]);
    expect(acoesDaEtapa("previa_pronta")).toEqual(["perdeu"]);
    expect(proximaAcao("previa_pronta")).toBeNull();
  });
  it("etapas terminais não têm ação", () => {
    expect(acoesDaEtapa("fechou")).toEqual([]);
    expect(acoesDaEtapa("perdeu")).toEqual([]);
  });
});

describe("relógio parado há", () => {
  it("usa o maior entre etapa_desde e ultima_atividade_em", () => {
    const [c] = montarCartoes(
      [lead({ id: "a", etapa_desde: "2026-11-17T06:00:00Z", ultima_atividade_em: "2026-11-17T09:00:00Z" })],
      vazio,
      agora,
    );
    expect(c.paradoHoras).toBe(3);
    const [d] = montarCartoes(
      [lead({ id: "b", etapa_desde: "2026-11-17T11:00:00Z", ultima_atividade_em: "2026-11-10T09:00:00Z" })],
      vazio,
      agora,
    );
    expect(d.paradoHoras).toBe(1);
  });
  it("temperatura: calmo, atenção em 3 dias, frio em 7; terminal nunca esquenta", () => {
    expect(temperatura(false, 71)).toBe("calmo");
    expect(temperatura(false, 72)).toBe("atencao");
    expect(temperatura(false, 168)).toBe("frio");
    expect(temperatura(true, 500)).toBe("calmo");
  });
  it("rótulo curto", () => {
    expect(rotuloTempo(0.2)).toBe("agora");
    expect(rotuloTempo(5.9)).toBe("há 5 h");
    expect(rotuloTempo(49)).toBe("há 2 d");
  });
});

describe("coluna", () => {
  const cartoes = montarCartoes(
    [
      lead({ id: "novo", ultima_atividade_em: "2026-11-17T11:00:00Z", etapa_desde: "2026-11-17T11:00:00Z" }),
      lead({ id: "velho", ultima_atividade_em: "2026-11-10T11:00:00Z", etapa_desde: "2026-11-10T11:00:00Z" }),
    ],
    vazio,
    agora,
  );
  it("coluna de trabalho põe o mais parado em cima", () => {
    const l = cartoesDaEtapa(cartoes, { slug: "previa_enviada", nome: "Prévia enviada", terminal: false });
    expect(l.map((c) => c.id)).toEqual(["velho", "novo"]);
  });
  it("coluna terminal põe o mais recente em cima", () => {
    const l = cartoesDaEtapa(
      cartoes.map((c) => ({ ...c, etapa: "fechou" })),
      { slug: "fechou", nome: "Fechou", terminal: true },
    );
    expect(l.map((c) => c.id)).toEqual(["novo", "velho"]);
  });
});

describe("rótulos de evento", () => {
  const nome = (s: string) => ({ previa_enviada: "Prévia enviada", negociando: "Negociando" })[s] ?? s;
  it("etapa mostra de e para", () => {
    expect(rotuloEvento({ tipo: "etapa", dados: { de: "previa_enviada", para: "negociando" } }, nome)).toBe(
      "Etapa: Prévia enviada para Negociando",
    );
  });
  it("traduz os tipos conhecidos e não quebra nos desconhecidos", () => {
    expect(rotuloEvento({ tipo: "previa_pronta", dados: {} }, nome)).toBe("Prévia pronta");
    expect(rotuloEvento({ tipo: "venda", dados: {} }, nome)).toBe("Venda fechada");
    expect(rotuloEvento({ tipo: "inventado", dados: {} }, nome)).toBe("inventado");
  });
});

describe("lerValor", () => {
  it("aceita vírgula, ponto de milhar e R$", () => {
    expect(lerValor("350")).toBe(350);
    expect(lerValor("497,00")).toBe(497);
    expect(lerValor("1.350,50")).toBe(1350.5);
    expect(lerValor("R$ 350")).toBe(350);
  });
  it("recusa texto, negativo e mais de duas casas", () => {
    expect(lerValor("abc")).toBeNaN();
    expect(lerValor("-5")).toBeNaN();
    expect(lerValor("10,999")).toBeNaN();
    expect(lerValor("")).toBeNaN();
  });
});
