import { describe, expect, it } from "vitest";
import { inicioDoPeriodo } from "@/lib/periodo";

describe("inicioDoPeriodo", () => {
  it("hoje: meia-noite de Brasília (02:30 UTC ainda é o dia anterior)", () => {
    expect(inicioDoPeriodo("hoje", new Date("2026-11-11T02:30:00Z"))?.toISOString()).toBe("2026-11-10T03:00:00.000Z");
  });
  it("semana numa quarta volta para a segunda", () => {
    expect(inicioDoPeriodo("semana", new Date("2026-11-11T15:00:00Z"))?.toISOString()).toBe("2026-11-09T03:00:00.000Z");
  });
  it("semana num domingo volta para a segunda anterior", () => {
    expect(inicioDoPeriodo("semana", new Date("2026-11-15T15:00:00Z"))?.toISOString()).toBe("2026-11-09T03:00:00.000Z");
  });
  it("semana numa segunda cedo em UTC ainda é o domingo em Brasília", () => {
    expect(inicioDoPeriodo("semana", new Date("2026-11-16T01:00:00Z"))?.toISOString()).toBe("2026-11-09T03:00:00.000Z");
  });
  it("tudo não tem início", () => {
    expect(inicioDoPeriodo("tudo", new Date("2026-11-11T15:00:00Z"))).toBeNull();
  });
});
