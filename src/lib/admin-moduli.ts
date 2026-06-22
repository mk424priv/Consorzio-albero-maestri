// Definizione DICHIARATIVA dei moduli del pannello amministrativo.
// Un solo motore CRUD (vedi pages/Admin.tsx) li renderizza tutti in modo
// coerente: tabella + form (Create/Read/Update/Delete).
import {
  CalendarCheck,
  FileText,
  FolderKanban,
  Image,
  Inbox,
  Languages,
  Search,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Tono } from "@/lib/entita";

export type Valore = string | number | boolean | string[] | null;
export type Item = { id: string } & { [k: string]: Valore };

export type CampoTipo =
  | "text" | "textarea" | "number" | "date" | "url" | "email"
  | "select" | "switch" | "tags";

export interface Campo {
  nome: string;
  label: string;
  tipo: CampoTipo;
  opzioni?: { value: string; label: string }[];
  placeholder?: string;
  larga?: boolean; // occupa due colonne nel form
}

export type TipoVista = "tabella" | "config";

export interface Modulo {
  id: string;
  coll: string; // chiave della collezione nello store
  label: string;
  descrizione: string;
  Icona: LucideIcon;
  vista: TipoVista;
  campi: Campo[];
  colonne: string[]; // campi mostrati in tabella
  titolo: string; // campo "titolo" dell'elemento
  anteprima?: boolean; // mostra anteprima immagine (media)
  badge?: string; // campo da mostrare come badge di stato
}

const sezioneOpz = [
  { value: "hero", label: "Hero" },
  { value: "chi_siamo", label: "Chi siamo" },
  { value: "servizi", label: "Servizi" },
  { value: "contatti", label: "Contatti" },
  { value: "footer", label: "Footer" },
];

export const MODULI: Modulo[] = [
  {
    id: "contenuti", coll: "contenuti", label: "Contenuti", descrizione: "Blocchi di testo delle pagine pubbliche", Icona: FileText, vista: "tabella",
    titolo: "titolo", colonne: ["titolo", "sezione", "pubblicato"], badge: "pubblicato",
    campi: [
      { nome: "titolo", label: "Titolo", tipo: "text", placeholder: "es. Benvenuti" },
      { nome: "chiave", label: "Chiave", tipo: "text", placeholder: "hero.titolo" },
      { nome: "sezione", label: "Sezione", tipo: "select", opzioni: sezioneOpz },
      { nome: "corpo", label: "Testo", tipo: "textarea", larga: true },
      { nome: "pubblicato", label: "Pubblicato", tipo: "switch" },
    ],
  },
  {
    id: "servizi", coll: "servizi", label: "Servizi", descrizione: "I servizi offerti, con prezzo e descrizione", Icona: Wrench, vista: "tabella",
    titolo: "nome", colonne: ["nome", "prezzoDa", "attivo"], badge: "attivo",
    campi: [
      { nome: "nome", label: "Nome", tipo: "text", placeholder: "es. Potatura" },
      { nome: "descrizione", label: "Descrizione", tipo: "textarea", larga: true },
      { nome: "prezzoDa", label: "Prezzo da (€)", tipo: "number" },
      { nome: "durata", label: "Durata stimata", tipo: "text", placeholder: "es. mezza giornata" },
      { nome: "attivo", label: "Attivo", tipo: "switch" },
    ],
  },
  {
    id: "progetti", coll: "progetti", label: "Progetti", descrizione: "Portfolio dei lavori da mostrare al pubblico", Icona: FolderKanban, vista: "tabella",
    titolo: "titolo", colonne: ["titolo", "luogo", "anno", "pubblicato"], badge: "pubblicato",
    campi: [
      { nome: "titolo", label: "Titolo", tipo: "text" },
      { nome: "descrizione", label: "Descrizione", tipo: "textarea", larga: true },
      { nome: "luogo", label: "Luogo", tipo: "text" },
      { nome: "anno", label: "Anno", tipo: "text", placeholder: "2025" },
      { nome: "copertina", label: "Immagine (URL)", tipo: "url" },
      { nome: "tags", label: "Tag", tipo: "tags", placeholder: "potatura, olivi", larga: true },
      { nome: "pubblicato", label: "Pubblicato", tipo: "switch" },
    ],
  },
  {
    id: "media", coll: "media", label: "Media", descrizione: "Libreria immagini e file", Icona: Image, vista: "tabella",
    titolo: "nome", colonne: ["nome", "tipo"], anteprima: true,
    campi: [
      { nome: "nome", label: "Nome", tipo: "text" },
      { nome: "url", label: "URL", tipo: "url", larga: true },
      { nome: "tipo", label: "Tipo", tipo: "select", opzioni: [{ value: "immagine", label: "Immagine" }, { value: "video", label: "Video" }, { value: "documento", label: "Documento" }] },
      { nome: "alt", label: "Testo alternativo", tipo: "text", larga: true },
    ],
  },
  {
    id: "lead", coll: "lead", label: "Lead & richieste", descrizione: "Richieste di contatto dal sito", Icona: Inbox, vista: "tabella",
    titolo: "nome", colonne: ["nome", "email", "origine", "stato"], badge: "stato",
    campi: [
      { nome: "nome", label: "Nome", tipo: "text" },
      { nome: "email", label: "Email", tipo: "email" },
      { nome: "telefono", label: "Telefono", tipo: "text" },
      { nome: "messaggio", label: "Messaggio", tipo: "textarea", larga: true },
      { nome: "origine", label: "Origine", tipo: "select", opzioni: [{ value: "sito", label: "Sito" }, { value: "telefono", label: "Telefono" }, { value: "social", label: "Social" }] },
      { nome: "stato", label: "Stato", tipo: "select", opzioni: [{ value: "nuovo", label: "Nuovo" }, { value: "in_corso", label: "In corso" }, { value: "chiuso", label: "Chiuso" }] },
    ],
  },
  {
    id: "appuntamenti", coll: "appuntamenti", label: "Appuntamenti", descrizione: "Prenotazioni e sopralluoghi", Icona: CalendarCheck, vista: "tabella",
    titolo: "nome", colonne: ["nome", "servizio", "data", "stato"], badge: "stato",
    campi: [
      { nome: "nome", label: "Cliente", tipo: "text" },
      { nome: "contatto", label: "Contatto", tipo: "text", placeholder: "telefono o email" },
      { nome: "servizio", label: "Servizio", tipo: "text" },
      { nome: "data", label: "Data", tipo: "date" },
      { nome: "ora", label: "Ora", tipo: "text", placeholder: "es. 09:30" },
      { nome: "stato", label: "Stato", tipo: "select", opzioni: [{ value: "richiesto", label: "Richiesto" }, { value: "confermato", label: "Confermato" }, { value: "concluso", label: "Concluso" }, { value: "annullato", label: "Annullato" }] },
      { nome: "note", label: "Note", tipo: "textarea", larga: true },
    ],
  },
  {
    id: "seo", coll: "seo", label: "SEO", descrizione: "Meta tag per ogni pagina", Icona: Search, vista: "tabella",
    titolo: "pagina", colonne: ["pagina", "title"],
    campi: [
      { nome: "pagina", label: "Pagina", tipo: "text", placeholder: "/ , /servizi …" },
      { nome: "title", label: "Title", tipo: "text", larga: true },
      { nome: "description", label: "Meta description", tipo: "textarea", larga: true },
      { nome: "keywords", label: "Keywords", tipo: "text", larga: true },
      { nome: "ogImage", label: "OG Image (URL)", tipo: "url", larga: true },
    ],
  },
  {
    id: "lingue", coll: "lingue", label: "Multilingua", descrizione: "Lingue disponibili sul sito", Icona: Languages, vista: "tabella",
    titolo: "nome", colonne: ["nome", "codice", "attiva", "predefinita"], badge: "attiva",
    campi: [
      { nome: "nome", label: "Lingua", tipo: "text", placeholder: "Italiano" },
      { nome: "codice", label: "Codice", tipo: "text", placeholder: "it" },
      { nome: "attiva", label: "Attiva", tipo: "switch" },
      { nome: "predefinita", label: "Predefinita", tipo: "switch" },
    ],
  },
  {
    id: "impostazioni", coll: "config", label: "Impostazioni", descrizione: "Configurazioni generali del sito", Icona: Settings, vista: "config",
    titolo: "nomeSito", colonne: [],
    campi: [
      { nome: "nomeSito", label: "Nome del sito", tipo: "text" },
      { nome: "slogan", label: "Slogan", tipo: "text", larga: true },
      { nome: "email", label: "Email", tipo: "email" },
      { nome: "telefono", label: "Telefono", tipo: "text" },
      { nome: "indirizzo", label: "Indirizzo", tipo: "text", larga: true },
      { nome: "sitoWeb", label: "Sito web", tipo: "url" },
      { nome: "instagram", label: "Instagram", tipo: "text" },
      { nome: "facebook", label: "Facebook", tipo: "text" },
      { nome: "descrizione", label: "Descrizione attività", tipo: "textarea", larga: true },
    ],
  },
];

export function getModulo(id: string): Modulo | undefined {
  return MODULI.find((m) => m.id === id);
}

// tono del badge per valori di stato comuni
const TONI: Record<string, Tono> = {
  nuovo: "info", in_corso: "warn", chiuso: "success",
  richiesto: "warn", confermato: "info", concluso: "success", annullato: "danger",
};
export function tonoStato(v: Valore): Tono {
  if (typeof v === "boolean") return v ? "success" : "neutral";
  if (typeof v === "string" && TONI[v]) return TONI[v];
  return "neutral";
}
