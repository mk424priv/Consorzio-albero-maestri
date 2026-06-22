import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE, verificaPassword, valoreToken } from "@/lib/auth";

async function entra(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (!verificaPassword(password)) {
    redirect("/login?errore=1");
  }
  const store = await cookies();
  store.set(COOKIE, valoreToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form action={entra} className="card p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1 text-[var(--primary)]">
          <span className="text-2xl">🌳</span>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Albero Maestri</h1>
        </div>
        <p className="text-sm text-[var(--muted)] mb-6">Centro di Comando del lavoro</p>

        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          className="input"
          placeholder="La tua password"
        />
        {errore && (
          <p className="text-sm text-[var(--danger)] mt-2">Password non corretta.</p>
        )}
        <button type="submit" className="btn btn-primary w-full justify-center mt-5">
          Entra
        </button>
      </form>
    </main>
  );
}
