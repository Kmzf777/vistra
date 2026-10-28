import { describe, expect, it, vi } from "vitest";
import { gerarConvite, gerarLinkDeAcesso, montarLinkConvite } from "@/lib/convite";

describe("montarLinkConvite", () => {
  it("codifica o token e põe o tipo", () => {
    expect(montarLinkConvite("https://vistracrm.vercel.app", "abc+/=", "invite")).toBe(
      "https://vistracrm.vercel.app/auth/confirmar?token_hash=abc%2B%2F%3D&type=invite"
    );
  });

  it("não duplica a barra quando a base termina em /", () => {
    const link = montarLinkConvite("https://vistracrm.vercel.app/", "x", "recovery");
    expect(link).toBe("https://vistracrm.vercel.app/auth/confirmar?token_hash=x&type=recovery");
    expect(link).not.toContain("//auth");
  });
});

function falso(retorno: unknown) {
  const generateLink = vi.fn().mockResolvedValue(retorno);
  return { admin: { auth: { admin: { generateLink } } } as never, generateLink };
}

describe("gerarConvite", () => {
  const dados = { email: "ana.exemplo@exemplo.com", nome: "Ana Exemplo", curso: "", artigo: "a" as const };

  it("pede invite com os dados no metadata e monta o link do hash", async () => {
    const { admin, generateLink } = falso({
      data: { properties: { hashed_token: "h+1" } },
      error: null,
    });
    const r = await gerarConvite(admin, dados, "http://localhost:3000");
    expect(r).toEqual({ link: "http://localhost:3000/auth/confirmar?token_hash=h%2B1&type=invite" });
    expect(generateLink).toHaveBeenCalledWith({
      type: "invite",
      email: dados.email,
      options: { data: { nome: "Ana Exemplo", curso: "", artigo: "a" } },
    });
  });

  it("devolve erro em português, sem lançar, quando o Supabase recusa", async () => {
    const { admin } = falso({ data: null, error: { message: "boom" } });
    const r = await gerarConvite(admin, dados, "http://localhost:3000");
    expect("erro" in r).toBe(true);
  });

  it("devolve erro se não vier hashed_token", async () => {
    const { admin } = falso({ data: { properties: {} }, error: null });
    expect("erro" in (await gerarConvite(admin, dados, "http://x"))).toBe(true);
  });
});

describe("gerarLinkDeAcesso", () => {
  it("usa recovery", async () => {
    const { admin, generateLink } = falso({ data: { properties: { hashed_token: "t" } }, error: null });
    const r = await gerarLinkDeAcesso(admin, "a@exemplo.com", "http://x");
    expect(r).toEqual({ link: "http://x/auth/confirmar?token_hash=t&type=recovery" });
    expect(generateLink).toHaveBeenCalledWith({ type: "recovery", email: "a@exemplo.com" });
  });
});
