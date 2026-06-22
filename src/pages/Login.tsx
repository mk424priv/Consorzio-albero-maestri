import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, Leaf } from "lucide-react";
import { useStore } from "@/store/store";
import { Button, Input } from "@/components/ui";

export function Login() {
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState(false);

  const da = (location.state as { da?: string } | null)?.da ?? "/";

  function entra(e: React.FormEvent) {
    e.preventDefault();
    if (login(password)) {
      navigate(da, { replace: true });
    } else {
      setErrore(true);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Pannello brand */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-brand-500 to-brand-700 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-2xl backdrop-blur">🌳</span>
          <span className="text-lg font-bold">Albero Maestri</span>
        </div>
        <div className="relative">
          <h1 className="max-w-md text-4xl font-extrabold leading-tight">
            Il lavoro nel verde, tutto in un posto solo.
          </h1>
          <p className="mt-4 max-w-md text-brand-50/90">
            Clienti, lavori, preventivi, ore, pagamenti e quadro economico —
            che vivono nei dati e si raccontano da soli.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5 text-sm">
            {["📊 Cruscotto", "🌱 Codice parlante", "💶 Pagamenti", "🗓️ Storico"].map((t) => (
              <span key={t} className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">{t}</span>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-brand-50/70">
          <Leaf size={14} className="mr-1.5 inline" />
          Centro di Comando del lavoro nel verde
        </p>
      </div>

      {/* Form */}
      <div className="grid place-items-center p-6">
        <form onSubmit={entra} className="anim-fade-up w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-3xl">🌳</span>
            <h1 className="mt-2 text-2xl font-bold">Albero Maestri</h1>
          </div>

          <h2 className="text-2xl font-bold text-ink">Bentornato</h2>
          <p className="mt-1 text-sm text-muted">Entra nel tuo Centro di Comando.</p>

          <div className="mt-7">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="relative">
              <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                id="password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrore(false);
                }}
                placeholder="La tua password"
                className="!pl-10"
              />
            </div>
            {errore && <p className="mt-2 text-sm font-medium text-danger">Password non corretta.</p>}
          </div>

          <Button variante="primary" type="submit" className="mt-6 w-full">
            Entra <ArrowRight size={17} />
          </Button>

          <p className="mt-5 text-center text-xs text-muted">
            Suggerimento: la password predefinita è <code className="codice">albero</code>
          </p>
        </form>
      </div>
    </div>
  );
}
