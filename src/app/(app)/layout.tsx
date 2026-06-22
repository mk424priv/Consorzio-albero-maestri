import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { COOKIE } from "@/lib/auth";

async function esci() {
  "use server";
  const store = await cookies();
  store.delete(COOKIE);
  redirect("/login");
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 px-2 mb-6">
          <span className="text-2xl">🌳</span>
          <div>
            <div className="font-semibold leading-tight">Albero Maestri</div>
            <div className="text-xs text-[var(--muted)]">Centro di Comando</div>
          </div>
        </div>
        <Nav />
        <form action={esci} className="mt-auto pt-4">
          <button type="submit" className="btn w-full justify-center text-sm">Esci</button>
        </form>
      </aside>

      <div className="flex-1 min-w-0">
        {/* barra superiore mobile */}
        <header className="md:hidden flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <span className="text-xl">🌳</span>
          <span className="font-semibold">Albero Maestri</span>
        </header>
        <main className="p-4 md:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
