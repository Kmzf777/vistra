import { describe, expect, it } from "vitest";
import { limparExemplos } from "../../scripts/limpar-exemplos";

// Cliente falso: grava cada consulta (tabela, operação e filtros) e responde pelo `responder`.
type Chamada = { tabela: string; op: string; filtros: [string, string, unknown][] };

function falso(responder: (c: Chamada) => unknown[]) {
  const chamadas: (Chamada | { tabela: "auth"; op: "deleteUser"; id: string })[] = [];
  function construtor(tabela: string) {
    const c: Chamada = { tabela, op: "select", filtros: [] };
    const b: Record<string, unknown> = {};
    for (const op of ["update", "delete", "upsert", "insert"]) {
      b[op] = () => {
        c.op = op;
        return b;
      };
    }
    b.select = () => b;
    b.order = () => b;
    for (const f of ["in", "eq", "like", "is"]) {
      b[f] = (col: string, v: unknown) => {
        c.filtros.push([f, col, v]);
        return b;
      };
    }
    b.maybeSingle = () => {
      chamadas.push(c);
      return Promise.resolve({ data: responder(c)[0] ?? null, error: null });
    };
    b.then = (ok: (r: unknown) => unknown, erro: (e: unknown) => unknown) => {
      chamadas.push(c);
      return Promise.resolve({ data: responder(c), error: null }).then(ok, erro);
    };
    return b;
  }
  const sb = {
    from: construtor,
    auth: {
      admin: {
        listUsers: () =>
          Promise.resolve({
            data: { users: [{ id: "u-adm", email: "admin.exemplo@exemplo.com" }, { id: "u-real", email: "real@outro.com" }] },
            error: null,
          }),
        deleteUser: (id: string) => {
          chamadas.push({ tabela: "auth", op: "deleteUser", id });
          return Promise.resolve({ error: null });
        },
      },
    },
  };
  return { sb: sb as never, chamadas };
}

function responder(c: Chamada): unknown[] {
  if (c.tabela === "leads" && c.op === "select") return [{ id: "l-1" }];
  if (c.tabela === "nichos" && c.op === "select") return [{ id: "n-ex" }];
  if (c.tabela === "modelos_mensagem" && c.op === "select") {
    if (c.filtros.some(([, col]) => col === "ativo")) return [{ tipo: "abertura", nichos: { nome: "Pet shop" } }, { tipo: "robo", nichos: null }];
    if (c.filtros.some(([, col]) => col === "autor_id")) return [{ id: 1 }, { id: 2 }];
    if (c.filtros.some(([, col]) => col === "nicho_id")) return [{ id: 2 }, { id: 3 }];
  }
  return [];
}

const opcoes = { prefixo: "exemplo-", emails: "", gravar: false };

describe("limparExemplos", () => {
  it("na simulação conta modelos de exemplo (do autor de exemplo ou do Nicho Exemplo) e não apaga nada", async () => {
    const { sb, chamadas } = falso(responder);
    const r = await limparExemplos(sb, opcoes);
    expect(r).toMatchObject({ leads: 1, usuarios: 1, modelos: 3, nichos: 1 });
    expect(r.ativos).toEqual([
      { tipo: "abertura", nicho: "Pet shop" },
      { tipo: "robo", nicho: "(geral)" },
    ]);
    expect(chamadas.some((c) => c.op === "delete" || c.op === "deleteUser" || c.op === "update")).toBe(false);
  });

  it("gravando, apaga os modelos e o Nicho Exemplo antes dos usuários", async () => {
    const { sb, chamadas } = falso(responder);
    const r = await limparExemplos(sb, { ...opcoes, gravar: true });
    const ordem = chamadas.map((c) => `${c.tabela}:${c.op}`);
    const modelos = ordem.indexOf("modelos_mensagem:delete");
    const nicho = ordem.indexOf("nichos:delete");
    const usuario = ordem.indexOf("auth:deleteUser");
    expect(modelos).toBeGreaterThan(-1);
    expect(nicho).toBeGreaterThan(modelos);
    expect(usuario).toBeGreaterThan(nicho);
    const delModelos = chamadas[modelos] as Chamada;
    expect(delModelos.filtros).toContainEqual(["in", "id", [1, 2, 3]]);
    const delNicho = chamadas[nicho] as Chamada;
    expect(delNicho.filtros).toContainEqual(["eq", "nome", "Nicho Exemplo"]);
    // nenhum nicho real é tocado
    expect(chamadas.filter((c) => c.tabela === "nichos" && c.op !== "select").length).toBe(1);
    expect(r.ativos.length).toBe(2);
  });
});
