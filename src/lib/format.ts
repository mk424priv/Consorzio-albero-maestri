const fmtData = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const dataBreve = (iso: string): string => fmtData.format(new Date(iso));
