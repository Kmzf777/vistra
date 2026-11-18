import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { avaliarArquivo, motivoParaNaoGravar, nichosCitados, type ArquivoMensagens } from "../../lib/mensagens/arquivo";

const exemplo = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "..", "scripts", "exemplos", "mensagens-exemplo.json"), "utf8"),
) as ArquivoMensagens;

const leadExemplo = (m: ArquivoMensagens["mensagens"][number]) => {
  const n = Number(m.lead.google_place_id?.slice(-2));
  return { nome: `Pet Shop Exemplo ${String(n).padStart(2, "0")}`, nota: 4 + n / 10, avaliacoes: 50 + n * 10, clinica: false };
};

describe("arquivo de exemplo", () => {
  it("só cita o Nicho Exemplo: nenhum modelo geral, nenhum nicho real", () => {
    expect(nichosCitados(exemplo)).toEqual(["Nicho Exemplo"]);
    expect((exemplo.modelos ?? []).every((m) => m.nicho === "Nicho Exemplo")).toBe(true);
  });

  it("passa na validação quando o Nicho Exemplo existe", () => {
    const a = avaliarArquivo(exemplo, leadExemplo, new Set(["Nicho Exemplo"]));
    expect(a.reprovadas).toEqual([]);
    expect(a.validas).toBe(5);
    expect(motivoParaNaoGravar(a)).toBeNull();
  });

  it("sem o Nicho Exemplo no banco, reprova o nicho e os modelos e não grava nada", () => {
    const a = avaliarArquivo(exemplo, leadExemplo, new Set(["Pet shop"]));
    expect(a.reprovadas[0]).toEqual({ item: 'nicho "Nicho Exemplo"', erros: "não existe no banco" });
    expect(a.reprovadas.filter((r) => r.item.startsWith("modelo "))).toHaveLength(5);
    expect(motivoParaNaoGravar(a)).toMatch(/Nada foi gravado/);
  });
});

describe("reprovadas", () => {
  const base: ArquivoMensagens = { gerado_em: "2026-11-18", modelo: "m", nichos: [], modelos: [], mensagens: [] };

  it("um modelo com dois-pontos basta para não gravar, e a lista diz índice e tipo, sem o texto", () => {
    const a = avaliarArquivo(
      {
        ...base,
        modelos: [
          { nicho: null, tipo: "abertura", texto: "oi, [saudacao]" },
          { nicho: null, tipo: "robo", rotulo: "menu", texto: "assunto: parceria" },
        ],
      },
      () => null,
      new Set(),
    );
    expect(a.reprovadas).toEqual([{ item: "modelo 2 (robo menu)", erros: "tem dois-pontos" }]);
    expect(JSON.stringify(a.reprovadas)).not.toContain("parceria");
    expect(motivoParaNaoGravar(a)).toBe("Nada foi gravado: 1 item(ns) reprovado(s). Corrija o arquivo e rode de novo.");
  });

  it("mensagem reprovada aparece pelo índice", () => {
    const a = avaliarArquivo(
      { ...base, mensagens: [{ lead: { google_place_id: "exemplo-x" }, partes: ["só uma parte?"] }] },
      () => null,
      new Set(),
    );
    expect(a.reprovadas[0].item).toBe("mensagem 1 (exemplo-x)");
    expect(a.semLead).toBe(1);
  });
});
