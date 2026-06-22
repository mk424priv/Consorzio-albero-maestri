"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VOCI = [
  { href: "/", label: "Cruscotto", icona: "📊" },
  { href: "/calendario", label: "Calendario", icona: "📅" },
  { href: "/clienti", label: "Clienti", icona: "🌱" },
  { href: "/preventivi", label: "Preventivi", icona: "🧾" },
  { href: "/ore", label: "Ore", icona: "⏱️" },
  { href: "/pagamenti", label: "Pagamenti", icona: "💶" },
  { href: "/storico", label: "Storico", icona: "🗓️" },
  { href: "/officina", label: "Officina", icona: "🔧" },
  { href: "/spese", label: "Spese", icona: "⛽" },
];

export default function Nav() {
  const path = usePathname();
  const attivo = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <nav className="flex flex-col gap-0.5">
      {VOCI.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            attivo(v.href)
              ? "bg-[var(--primary-soft)] text-[var(--primary)] font-medium"
              : "text-[var(--foreground)] hover:bg-[#eef0ea]"
          }`}
        >
          <span className="text-base">{v.icona}</span>
          {v.label}
        </Link>
      ))}
    </nav>
  );
}
