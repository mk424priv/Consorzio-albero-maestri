// Definizione DICHIARATIVA dei moduli del pannello amministrativo.
// Un solo motore CRUD (vedi pages/Admin.tsx) li renderizza tutti in modo
// coerente: tabella + form (Create/Read/Update/Delete).
import {
  CalendarCheck,
  FileText,
  FolderKanban,
  Fuel,
  Hammer,
  Image,
  Inbox,
  Languages,
  Search,
  Settings,
  Sprout,
  Users,
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
  opzioniDa?: "clienti" | "operatori"; // select con opzioni dinamiche dallo store app
  placeholder?: string;
  larga?: boolean; // occupa due colonne nel form
}

export type TipoVista = "tabella" | "config";
export type Origine = "admin" | "app"; // "app" = collegato allo store principale

export interface Modulo {
  id: string;
  coll: string; // chiave della collezione nello store
  origine?: Origine; // "app" = store principale; assente = "admin" (sito)
  gruppo?: string; // intestazione nella navigazione (assente = "Sito")
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

const MODALITA_OPZ = [{ value: "preventivo", label: "A preventivo" }, { value: "ore", label: "A ore" }, { value: "misto", label: "Misto" }];
const RUOLO_OPZ = [{ value: "titolare", label: "Titolare" }, { value: "collaboratore", label: "Collaboratore" }];
const STATO_LAVORO_OPZ = [{ value: "da_fare", label: "Da fare" }, { value: "in_corso", label: "In corso" }, { value: "fatto", label: "Fatto" }];
const CATEGORIA_OPZ = [{ value: "benzina", label: "Benzina" }, { value: "materiali", label: "Materiali" }, { value: "attrezzi", label: "Attrezzi" }, { value: "altro", label: "Altro" }];
const STATO_ATTREZZO_OPZ = [{ value: "ok", label: "In uso" }, { value: "manutenzione", label: "Manutenzione" }, { value: "dismesso", label: "Dismesso" }];

// Moduli collegati allo store dell'app: modificarli QUI cambia l'app (Spazio,
// Squadra, Agenda, Soldi…) in tempo reale.
const MODULI_APP: Modulo[] = [
  {
    id: "app_clienti", coll: "clienti", origine: "app", gruppo: "Applicazione", label: "Clienti", descrizione: "Anagrafica clienti — sincronizzata con lo Spazio", Icona: Sprout, vista: "tabella",
    titolo: "nome", colonne: ["nome", "cognome", "luogo", "modalitaPredefinita"],
    campi: [
      { nome: "nome", label: "Nome", tipo: "text" },
      { nome: "cognome", label: "Cognome", tipo: "text" },
      { nome: "telefono", label: "Telefono", tipo: "text" },
      { nome: "email", label: "Email", tipo: "email" },
      { nome: "luogo", label: "Luogo", tipo: "text", larga: true },
      { nome: "modalitaPredefinita", label: "Accordo", tipo: "select", opzioni: MODALITA_OPZ },
      { nome: "tariffaOraria", label: "Tariffa €/h", tipo: "number" },
    ],
  },
  {
    id: "app_operatori", coll: "operatori", origine: "app", gruppo: "Applicazione", label: "Operatori", descrizione: "La squadra — sincronizzata con la sezione Squadra", Icona: Users, vista: "tabella",
    titolo: "nome", colonne: ["nome", "ruolo", "tariffaOraria", "attivo"], badge: "attivo",
    campi: [
      { nome: "nome", label: "Nome", tipo: "text" },
      { nome: "ruolo", label: "Ruolo", tipo: "select", opzioni: RUOLO_OPZ },
      { nome: "tariffaOraria", label: "Tariffa €/h", tipo: "number" },
      { nome: "telefono", label: "Telefono", tipo: "text" },
      { nome: "attivo", label: "Attivo", tipo: "switch" },
    ],
  },
  {
    id: "app_lavori", coll: "lavori", origine: "app", gruppo: "Applicazione", label: "Lavori", descrizione: "Interventi — sincronizzati con Agenda e schede", Icona: Hammer, vista: "tabella",
    titolo: "titolo", colonne: ["titolo", "clienteId", "data", "stato"], badge: "stato",
    campi: [
      { nome: "titolo", label: "Titolo", tipo: "text" },
      { nome: "clienteId", label: "Cliente", tipo: "select", opzioniDa: "clienti" },
      { nome: "data", label: "Data", tipo: "date" },
      { nome: "operatoreId", label: "Operatore", tipo: "select", opzioniDa: "operatori" },
      { nome: "stato", label: "Stato", tipo: "select", opzioni: STATO_LAVORO_OPZ },
      { nome: "tipoCompenso", label: "Compenso", tipo: "select", opzioni: MODALITA_OPZ },
      { nome: "durataPrevistaOre", label: "Durata prevista (h)", tipo: "number" },
      { nome: "luogo", label: "Luogo", tipo: "text", larga: true },
    ],
  },
  {
    id: "app_spese", coll: "spese", origine: "app", gruppo: "Applicazione", label: "Spese", descrizione: "Uscite — sincronizzate con Soldi", Icona: Fuel, vista: "tabella",
    titolo: "descrizione", colonne: ["descrizione", "categoria", "importo", "data"], badge: "categoria",
    campi: [
      { nome: "descrizione", label: "Descrizione", tipo: "text", larga: true },
      { nome: "categoria", label: "Categoria", tipo: "select", opzioni: CATEGORIA_OPZ },
      { nome: "importo", label: "Importo €", tipo: "number" },
      { nome: "data", label: "Data", tipo: "date" },
      { nome: "clienteId", label: "Cliente (facolt.)", tipo: "select", opzioniDa: "clienti" },
    ],
  },
  {
    id: "app_attrezzi", coll: "attrezzi", origine: "app", gruppo: "Applicazione", label: "Attrezzi", descrizione: "Patrimonio — sincronizzato con Soldi › Patrimonio", Icona: Wrench, vista: "tabella",
    titolo: "nome", colonne: ["nome", "costoAcquisto", "stato"], badge: "stato",
    campi: [
      { nome: "nome", label: "Nome", tipo: "text" },
      { nome: "costoAcquisto", label: "Costo €", tipo: "number" },
      { nome: "dataAcquisto", label: "Data acquisto", tipo: "date" },
      { nome: "stato", label: "Stato", tipo: "select", opzioni: STATO_ATTREZZO_OPZ },
    ],
  },
];

const sezioneOpz = [
  { value: "hero", label: "Hero" },
  { value: "chi_siamo", label: "Chi siamo" },
  { value: "servizi", label: "Servizi" },
  { value: "contatti", label: "Contatti" },
  { value: "footer", label: "Footer" },
];

const MODULI_SITO: Modulo[] = [
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

export const MODULI: Modulo[] = [...MODULI_APP, ...MODULI_SITO];

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
