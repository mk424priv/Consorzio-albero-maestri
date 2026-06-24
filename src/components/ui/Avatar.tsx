import { cn } from "@/lib/cn";

const TONI = {
  neutro: "bg-superficie-alta text-bianco",
  blu: "bg-blu/15 text-blu",
  verde: "bg-verde/15 text-verde",
  rosso: "bg-rosso/15 text-rosso",
} as const;

export type AvatarTono = keyof typeof TONI;

export function Avatar({ iniziali, tono = "neutro", size = 40, className }: { iniziali: string; tono?: AvatarTono; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", TONI[tono], className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {iniziali}
    </span>
  );
}

/** Cliente storico: anello mesh (CSS conic, niente WebGL → ok in liste lunghe). */
export function AvatarStorico({ iniziali, size = 44 }: { iniziali: string; size?: number }) {
  return (
    <span className="relative inline-grid shrink-0 place-items-center rounded-full" style={{ width: size + 6, height: size + 6 }}>
      <span
        className="absolute inset-0 animate-[spin_7s_linear_infinite] rounded-full motion-reduce:animate-none"
        style={{ background: "conic-gradient(from 0deg, #0a58ff, #00d15e, #4b0082, #ff3b30, #0a58ff)" }}
      />
      <span className="absolute inset-[2px] rounded-full bg-superficie" />
      <span className="relative font-semibold text-bianco" style={{ fontSize: Math.round(size * 0.32) }}>{iniziali}</span>
    </span>
  );
}

export function AvatarStack({ items, size = 32 }: { items: string[]; size?: number }) {
  return (
    <div className="flex">
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center rounded-full border-2 border-superficie bg-superficie-alta font-bold text-bianco"
          style={{ width: size, height: size, fontSize: Math.round(size * 0.32), marginLeft: i === 0 ? 0 : -Math.round(size * 0.3) }}
        >
          {it === "io" ? "IO" : it.slice(0, 2).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
