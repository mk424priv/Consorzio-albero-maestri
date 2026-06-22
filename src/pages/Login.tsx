import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Leaf } from "lucide-react";
import { useStore } from "@/store/store";
import { Button } from "@/components/ui";
import { fieldCls } from "@/components/ui/fields";

export function Login() {
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState(false);
  const da = (location.state as { da?: string } | null)?.da ?? "/";

  function entra(e: React.FormEvent) {
    e.preventDefault();
    if (login(password)) navigate(da, { replace: true });
    else setErrore(true);
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-brand-500 to-brand-700 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-lime-bright/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-operatore-500/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-white/15 text-2xl backdrop-blur">🌳</span>
          <span className="text-lg font-extrabold">Albero Maestri</span>
        </div>
        <div className="relative">
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-md text-[2.6rem] font-extrabold leading-[1.05]">
            Il tuo lavoro nel verde, in un unico spazio.
          </motion.h1>
          <p className="mt-4 max-w-md text-brand-50/90">
            Clienti, squadra, ore, incassi e compensi — collegati tra loro e
            sempre sotto controllo, dal palmo della mano.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5 text-sm">
            {["🌱 Clienti-radice", "🧑‍🌾 Squadra & compensi", "💶 Flusso soldi", "📅 Agenda"].map((t) => (
              <span key={t} className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">{t}</span>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-brand-50/70"><Leaf size={14} className="mr-1.5 inline" /> Spazio di lavoro per l'arboricoltura</p>
      </div>

      <div className="grid place-items-center p-6">
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} onSubmit={entra} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-3xl">🌳</span>
            <h1 className="mt-2 text-2xl font-extrabold">Albero Maestri</h1>
          </div>
          <h2 className="text-2xl font-extrabold text-ink">Bentornato 👋</h2>
          <p className="mt-1 text-sm text-muted">Entra nel tuo spazio di lavoro.</p>

          <div className="mt-7">
            <label className="mb-1.5 block text-[0.78rem] font-semibold text-ink-soft" htmlFor="password">Password</label>
            <div className="relative">
              <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrore(false); }}
                placeholder="La tua password"
                className={`${fieldCls} h-12 pl-10`}
              />
            </div>
            {errore && <p className="mt-2 text-sm font-medium text-danger">Password non corretta.</p>}
          </div>

          <Button variante="primary" dim="lg" type="submit" className="mt-6 w-full">Entra <ArrowRight size={17} /></Button>
          <p className="mt-5 text-center text-xs text-muted">Password predefinita: <code className="codice">albero</code></p>
        </motion.form>
      </div>
    </div>
  );
}
