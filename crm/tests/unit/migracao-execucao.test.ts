import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { conferirOpcoes, leadsComFalha, resumirConversas } from "../../lib/migracao/execucao";
import { confirmarIgnoradoPeloGit } from "../../scripts/_git";

describe("conferirOpcoes", () => {
  it("simulação não exige nada", () => {
    expect(conferirOpcoes({ gravar: false, autor: null, clientes: null })).toBeNull();
  });
  it("--gravar exige --autor", () => {
    expect(conferirOpcoes({ gravar: true, autor: null, clientes: "c.json" })).toMatch(/--autor/);
  });
  it("--gravar exige --clientes", () => {
    expect(conferirOpcoes({ gravar: true, autor: "admin@exemplo.com", clientes: null })).toMatch(/--clientes/);
  });
  it("--gravar com os dois passa", () => {
    expect(conferirOpcoes({ gravar: true, autor: "admin@exemplo.com", clientes: "c.json" })).toBeNull();
  });
});

describe("resumirConversas", () => {
  it("separa migradas, já migradas, ignoradas e falhas, com o origem id", () => {
    const r = resumirConversas([
      { origem_id: "exemplo-a", status: "migrada", erro: null },
      { origem_id: "exemplo-b", status: "ja_migrada", erro: null },
      { origem_id: "exemplo-c", status: "ignorada:reservado", erro: null },
      { origem_id: "exemplo-d", status: null, erro: "Dono precisa ser um perfil ativo." },
      { origem_id: "exemplo-e", status: null, erro: "sem lead no banco novo" },
      { origem_id: "exemplo-f", status: "algo_novo", erro: null },
    ]);
    expect(r.migradas).toBe(1);
    expect(r.jaMigradas).toBe(1);
    expect(r.ignoradas).toEqual([{ origem_id: "exemplo-c", motivo: "ignorada:reservado" }]);
    expect(r.falhas).toEqual([
      { origem_id: "exemplo-d", motivo: "Dono precisa ser um perfil ativo." },
      { origem_id: "exemplo-e", motivo: "sem lead no banco novo" },
      { origem_id: "exemplo-f", motivo: "status inesperado: algo_novo" },
    ]);
  });
});

describe("leadsComFalha", () => {
  it("lista só os resultados inválidos, com o origem id", () => {
    expect(
      leadsComFalha([
        { origem_id: "exemplo-1", resultado: "criado" },
        { origem_id: "exemplo-2", resultado: "invalido:cidade" },
        { origem_id: null, resultado: "invalido:erro:22P02" },
        { origem_id: "exemplo-4", resultado: "ja_descartado" },
        { origem_id: "exemplo-5", resultado: "bloqueado" },
      ]),
    ).toEqual([
      { origem_id: "exemplo-2", motivo: "invalido:cidade" },
      { origem_id: "(sem origem)", motivo: "invalido:erro:22P02" },
    ]);
  });
});

describe("confirmarIgnoradoPeloGit", () => {
  const raiz = path.resolve(__dirname, "..", "..", "..");
  it("arquivo em prospeccao/leads/ está ignorado", () => {
    // a pasta não precisa existir: vale a regra do .gitignore, conferida a partir de uma pasta do repositório
    expect(confirmarIgnoradoPeloGit(path.join(raiz, "prospeccao", "leads", "uberlandia", "plano-migracao-exemplo.json"))).toEqual({
      ok: true,
    });
  });
  it("arquivo numa pasta versionada é recusado", () => {
    const r = confirmarIgnoradoPeloGit(path.join(raiz, "crm", "scripts", "plano-migracao-exemplo.json"));
    expect(r.ok).toBe(false);
  });
  it("fora de repositório git é recusado", () => {
    const r = confirmarIgnoradoPeloGit(path.join(os.tmpdir(), "plano-migracao-exemplo.json"));
    expect(r.ok).toBe(false);
  });
});
