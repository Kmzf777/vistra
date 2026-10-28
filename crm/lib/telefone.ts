// Normaliza telefone brasileiro para E.164. Sem server-only e sem "@/", para o tsx também carregar.
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export function normalizarTelefone(bruto: string): { e164: string; tipo: "fixo" | "celular" } | null {
  if (!bruto || !bruto.trim()) return null;
  const numero = parsePhoneNumberFromString(bruto.trim(), "BR");
  if (!numero || !numero.isValid()) return null;
  const tipo = numero.getType();
  if (tipo === "MOBILE") return { e164: numero.number, tipo: "celular" };
  if (tipo === "FIXED_LINE") return { e164: numero.number, tipo: "fixo" };
  return null;
}

// Dígitos para o link wa.me: o e164 sem o "+".
export function digitosWhatsApp(e164: string): string {
  return e164.replace(/^\+/, "");
}
