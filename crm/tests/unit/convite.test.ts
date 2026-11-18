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

function falso(retorno: unknown, ativacao: { data: unknown; error: unknown } = { data: [{ id: "u-1" }], error: null }) {
  const generateLink = vi.fn().mockResolvedValue(retorno);
  const select = vi.fn().mockResolvedValue(ativacao);
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { admin: { auth: { admin: { generateLink } }, from } as never, generateLink, from, update, eq };
}

describe("gerarConvite", () => {
  const dados = { email: "ana.exemplo@exemplo.com", nome: "Ana Exemplo", curso: "", artigo: "a" as const };

  it("pede invite com os dados no metadata e monta o link do hash", async () => {
    const { admin, generateLink } = falso({
      data: { properties: { hashed_token: "h+1" }, user: { id: "u-1" } },
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
    const { admin } = falso({ data: { properties: {}, user: { id: "u-1" } }, error: null });
    expect("erro" in (await gerarConvite(admin, dados, "http://x"))).toBe(true);
  });

  // O perfil nasce inativo (gatilho do banco): só o convite ativa, pelo id que o generateLink devolve.
  it("ativa o perfil do usuário devolvido pelo generateLink", async () => {
    const { admin, from, update, eq } = falso({ data: { properties: { hashed_token: "t" }, user: { id: "u-9" } }, error: null });
    const r = await gerarConvite(admin, dados, "http://x");
    expect("link" in r).toBe(true);
    expect(from).toHaveBeenCalledWith("perfis");
    expect(update).toHaveBeenCalledWith({ ativo: true });
    expect(eq).toHaveBeenCalledWith("id", "u-9");
  });

  it("sem o id do usuário não devolve link", async () => {
    const { admin, from } = falso({ data: { properties: { hashed_token: "t" } }, error: null });
    const r = await gerarConvite(admin, dados, "http://x");
    expect("erro" in r).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("se a ativação falhar, não devolve link e diz o que fazer", async () => {
    const { admin } = falso(
      { data: { properties: { hashed_token: "t" }, user: { id: "u-1" } }, error: null },
      { data: null, error: { message: "boom" } },
    );
    const r = await gerarConvite(admin, dados, "http://x");
    expect(r).toEqual({ erro: expect.stringMatching(/Reative/) });
  });

  it("se nenhum perfil foi ativado, também é erro", async () => {
    const { admin } = falso({ data: { properties: { hashed_token: "t" }, user: { id: "u-1" } }, error: null }, { data: [], error: null });
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
