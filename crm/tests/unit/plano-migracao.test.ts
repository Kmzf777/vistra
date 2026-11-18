import { describe, expect, it } from "vitest";
import {
  montarPlanoMigracao,
  type ContatoAntigo,
  type EntradasMigracao,
  type EventoAntigo,
  type LeadAntigo,
  type LeadRevisado,
} from "../../lib/migracao/plano";
import type { LeadRaspado } from "../../lib/importacao/converter";

const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const VENDEDOR_NOVO = "00000000-0000-0000-0000-0000000000b1";
const PERFIL_VEND = "perfil-vendedor";
const PERFIL_SUMIU = "perfil-sumiu";

function antigo(letra: string, n: number, extra: Partial<LeadAntigo> = {}): LeadAntigo {
  return {
    id: `exemplo-antigo-${letra}`,
    nome: `Pet Exemplo ${letra}`,
    categoria: "Pet shop",
    telefone: `(34) 90000-00${n}`,
    endereco: "Rua Exemplo, 1",
    nota: 4.5,
    avaliacoes: 50,
    instagram: "",
    seguidores: null,
    site: "",
    fechado: false,
    origem: "raspado",
    situacao: "novo",
    etapa: null,
    vendedor_id: null,
    atribuido_em: null,
    motivo_desqualificacao: null,
    criado_em: "2026-10-01T10:00:00Z",
    atualizado_em: "2026-10-01T10:00:00Z",
    ...extra,
  };
}

function revisao(l: LeadAntigo, veredito: LeadRevisado["veredito"]): LeadRevisado {
  return { ...l, veredito, evidencias: [], ig_ultimo_post: null, ig_seguidores: null, verificado_em: "2026-10-26T12:00:00Z" };
}

function aprovado(id: string, tel: string, extra: Partial<LeadRaspado> = {}): LeadRaspado {
  return {
    id, nome: `Clinica Exemplo ${id}`, cat: "Clínica", tel, end: "Rua Exemplo, 2", nota: 4.8, aval: 30, ig: null,
    seguidores: null, site: null, fechado: false, email: null, nicho: "Odontologia", gancho: "gancho exemplo",
    prioridade: 1, veredito: "PODE_ABORDAR", placeId: `exemplo-place-${id}`, ig_ultimo_post: null, ...extra,
  };
}

function entradas(): EntradasMigracao {
  const A = antigo("A", 11);
  const B = antigo("B", 12);
  const C = antigo("C", 13);
  const D = antigo("D", 14, { situacao: "meu", vendedor_id: PERFIL_VEND, atribuido_em: "2026-10-20T09:00:00Z" });
  const E = antigo("E", 15, { situacao: "qualificado", vendedor_id: PERFIL_SUMIU, atribuido_em: null });
  const contatos: ContatoAntigo[] = [
    { id: "c1", lead_id: D.id, nome: "Fulano Exemplo", cargo: "dono", telefone: "(34) 90000-0099", e_decisor: true, criado_em: "2026-10-21T10:00:00Z" },
  ];
  const eventos: EventoAntigo[] = [
    { id: "e2", lead_id: D.id, vendedor_id: PERFIL_VEND, tipo: "nota", nota: "falei com a recepção", criado_em: "2026-10-22T10:00:00Z" },
    { id: "e1", lead_id: D.id, vendedor_id: PERFIL_VEND, tipo: "atribuiu", nota: "", criado_em: "2026-10-20T09:00:00Z" },
    { id: "e3", lead_id: A.id, vendedor_id: null, tipo: "criou", nota: "", criado_em: "2026-10-01T10:00:00Z" },
  ];
  return {
    producao: {
      leads: [A, D, E],
      contatos,
      eventos,
      perfis: [
        { id: PERFIL_VEND, email: "Vendedor.Exemplo@exemplo.com" },
        { id: PERFIL_SUMIU, email: "sumiu@exemplo.com" },
      ],
    },
    export117: [A, B, C, D, E],
    backup71: [B, C],
    revisao: [
      revisao(A, "PODE_ABORDAR"),
      revisao(B, "TEM_SITE"),
      revisao(C, "PODE_ABORDAR"),
      revisao(D, "PODE_ABORDAR"),
      revisao(E, "PODE_ABORDAR"),
    ],
    aprovados: [aprovado("udi-1", "(34) 90000-0011")],
    clientes: [{ nome: "Cliente Exemplo", telefone: "(34) 90000-0088", google_place_id: "exemplo-cliente" }],
    donosNovos: { "vendedor.exemplo@exemplo.com": VENDEDOR_NOVO },
    adminId: ADMIN,
  };
}

describe("montarPlanoMigracao", () => {
  const plano = montarPlanoMigracao(entradas());
  const porOrigem = (id: string) => plano.leads.find((l) => l.origem_id === id);

  it("lead em produção sem dono vira no_poco e não gera conversa", () => {
    const a = porOrigem("exemplo-antigo-A");
    expect(a?.estado_inicial).toBe("no_poco");
    expect(plano.conversas.find((c) => c.origem_id === "exemplo-antigo-A")).toBeUndefined();
  });

  it("descartado só no export com TEM_SITE vira descartado/tem_site", () => {
    const b = porOrigem("exemplo-antigo-B");
    expect(b?.estado_inicial).toBe("descartado");
    expect(b?.motivo_fim).toBe("tem_site");
  });

  it("descartado com PODE_ABORDAR vira outro e avisa com o nome", () => {
    const c = porOrigem("exemplo-antigo-C");
    expect(c?.estado_inicial).toBe("descartado");
    expect(c?.motivo_fim).toBe("outro");
    expect(plano.avisos.some((a) => a.includes("Pet Exemplo C"))).toBe(true);
  });

  it("lead com dono mapeado vira conversa com o dono novo e passo quem_respondeu", () => {
    const d = plano.conversas.find((c) => c.origem_id === "exemplo-antigo-D");
    expect(d?.dono_id).toBe(VENDEDOR_NOVO);
    expect(d?.passo).toBe("quem_respondeu");
    expect(d?.atribuido_em).toBe("2026-10-20T09:00:00Z");
    expect(d?.contato).toEqual({ nome: "Fulano Exemplo", cargo: "dono", telefone_e164: "+5534900000099" });
    expect(d?.eventos.map((e) => e.tipo_antigo)).toEqual(["atribuiu", "nota"]);
    expect(d?.eventos[1]).toEqual({ tipo_antigo: "nota", nota: "falei com a recepção", criado_em: "2026-10-22T10:00:00Z" });
    expect(porOrigem("exemplo-antigo-D")?.estado_inicial).toBe("no_poco");
  });

  it("dono não mapeado fica com o admin, passo resultado se qualificado, e avisa", () => {
    const e = plano.conversas.find((c) => c.origem_id === "exemplo-antigo-E");
    expect(e?.dono_id).toBe(ADMIN);
    expect(e?.passo).toBe("resultado");
    expect(e?.contato).toBeNull();
    expect(plano.avisos.some((a) => a.includes("lead de Pet Exemplo E ficou com o admin"))).toBe(true);
  });

  it("aprovado com o telefone de um ativo mescla, não cresce e avisa", () => {
    expect(plano.leads).toHaveLength(5);
    const a = porOrigem("exemplo-antigo-A");
    expect(a?.google_place_id).toBe("exemplo-place-udi-1");
    expect(a?.nicho).toBe("Odontologia");
    expect(plano.leads.some((l) => l.origem_id === "udi-1")).toBe(false);
    expect(plano.avisos.some((x) => x.includes("Pet Exemplo A"))).toBe(true);
  });

  it("clientes viram bloqueios", () => {
    expect(plano.bloqueios).toEqual([
      { telefone_e164: "+5534900000088", google_place_id: "exemplo-cliente", motivo: "cliente" },
    ]);
  });

  it("contagem", () => {
    expect(plano.contagem).toMatchObject({
      ativos: 3,
      descartados: 2,
      aprovados: 1,
      conversas: 2,
      mesclados: 1,
      contatos: 1,
      eventos: 2,
      com_contato_sem_dono: 0,
    });
  });

  // No banco antigo, largar o lead voltava a situação para "novo" e tirava o dono: o rastro do contato só
  // sobra nos eventos e contatos. Esse lead não pode voltar para a fila como se nunca tivesse sido abordado.
  it("lead sem dono com eventos de contato vira conversa do admin, com aviso e contagem", () => {
    const e = entradas();
    const F = antigo("F", 16);
    e.producao.leads.push(F);
    e.export117.push(F);
    e.producao.eventos.push(
      { id: "f1", lead_id: F.id, vendedor_id: PERFIL_VEND, tipo: "atribuiu", nota: "", criado_em: "2026-10-10T09:00:00Z" },
      { id: "f2", lead_id: F.id, vendedor_id: PERFIL_VEND, tipo: "largou", nota: "não respondeu", criado_em: "2026-10-12T09:00:00Z" },
    );
    const p = montarPlanoMigracao(e);
    const f = p.conversas.find((c) => c.origem_id === F.id);
    expect(f).toMatchObject({ dono_id: ADMIN, passo: "quem_respondeu", contato: null, atribuido_em: null });
    expect(f?.eventos.map((x) => x.tipo_antigo)).toEqual(["atribuiu", "largou"]);
    expect(p.leads.find((l) => l.origem_id === F.id)?.estado_inicial).toBe("no_poco");
    expect(p.avisos).toContain("lead de Pet Exemplo F tinha contato anterior e ficou com o admin");
    expect(p.contagem.com_contato_sem_dono).toBe(1);
    expect(p.contagem.conversas).toBe(3);
  });

  it("lead sem dono só com contato também vira conversa do admin, com o contato", () => {
    const e = entradas();
    const G = antigo("G", 17);
    e.producao.leads.push(G);
    e.producao.contatos.push({
      id: "g1", lead_id: G.id, nome: "Beltrana Exemplo", cargo: "gerente", telefone: "(34) 90000-0098", e_decisor: true,
      criado_em: "2026-10-11T10:00:00Z",
    });
    const p = montarPlanoMigracao(e);
    const g = p.conversas.find((c) => c.origem_id === G.id);
    expect(g?.dono_id).toBe(ADMIN);
    expect(g?.contato).toEqual({ nome: "Beltrana Exemplo", cargo: "gerente", telefone_e164: "+5534900000098" });
    expect(p.contagem.com_contato_sem_dono).toBe(1);
  });

  it("só o evento de criação não conta como contato anterior", () => {
    // o A da base tem só "criou" e continua na fila (primeiro teste)
    expect(plano.conversas.some((c) => c.origem_id === "exemplo-antigo-A")).toBe(false);
    expect(plano.avisos.some((a) => a.includes("Pet Exemplo A tinha contato anterior"))).toBe(false);
  });

  it("aprovado novo entra com origem udi e o aprovado que bate com descartado é pulado com aviso", () => {
    const e = entradas();
    e.aprovados.push(aprovado("udi-2", "(34) 90000-0077"), aprovado("udi-3", "(34) 90000-0012"));
    const p = montarPlanoMigracao(e);
    expect(p.leads.find((l) => l.origem_id === "udi-2")?.estado_inicial).toBe("no_poco");
    expect(p.leads.some((l) => l.origem_id === "udi-3")).toBe(false);
    expect(p.avisos.some((a) => a.includes("udi-3") || a.includes("Clinica Exemplo udi-3"))).toBe(true);
  });

  it("não qualificado vira descartado e não vira conversa", () => {
    const e = entradas();
    const F = antigo("F", 16, { situacao: "nao_qualificado", vendedor_id: PERFIL_VEND, motivo_desqualificacao: "sem perfil" });
    e.producao.leads.push(F);
    e.export117.push(F);
    const p = montarPlanoMigracao(e);
    expect(p.leads.find((l) => l.origem_id === F.id)?.estado_inicial).toBe("descartado");
    expect(p.conversas.some((c) => c.origem_id === F.id)).toBe(false);
  });
});
