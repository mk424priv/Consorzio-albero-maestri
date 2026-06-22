// Autenticazione semplice (PRD §13.1, Fase 1): una sola password per il titolare.
import { cookies } from "next/headers";

export const COOKIE = "am_session";

function tokenAtteso(): string {
  const pwd = process.env.APP_PASSWORD ?? "albero";
  // token derivato (non in chiaro): sufficiente per un'app a utente singolo.
  return btoa(`am:${pwd}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function verificaPassword(password: string): boolean {
  const pwd = process.env.APP_PASSWORD ?? "albero";
  return password === pwd;
}

export function valoreToken(): string {
  return tokenAtteso();
}

export async function ingressoValido(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === tokenAtteso();
}
