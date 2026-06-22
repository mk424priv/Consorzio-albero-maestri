// Dati d'esempio per il pannello amministrativo.
import type { Item, Valore } from "@/lib/admin-moduli";

const oggi = () => new Date().toISOString().slice(0, 10);

export function seedCollezioni(): Record<string, Item[]> {
  return {
    contenuti: [
      { id: "c1", titolo: "Il verde, fatto bene", chiave: "hero.titolo", sezione: "hero", corpo: "Potatura, abbattimenti e cura del giardino sull'Isola d'Elba.", pubblicato: true },
      { id: "c2", titolo: "Chi siamo", chiave: "about.testo", sezione: "chi_siamo", corpo: "Da oltre vent'anni ci prendiamo cura degli alberi e dei giardini dell'Elba.", pubblicato: true },
    ],
    servizi: [
      { id: "s1", nome: "Potatura", descrizione: "Potatura di alberi, siepi e olivi a regola d'arte.", prezzoDa: 80, durata: "mezza giornata", attivo: true },
      { id: "s2", nome: "Abbattimento", descrizione: "Abbattimenti controllati anche di piante pericolanti.", prezzoDa: 150, durata: "1 giornata", attivo: true },
      { id: "s3", nome: "Manutenzione giardini", descrizione: "Cura periodica del verde.", prezzoDa: 30, durata: "a ore", attivo: true },
    ],
    progetti: [
      { id: "p1", titolo: "Villa Rossi — potatura olivi", descrizione: "Recupero di un oliveto storico.", luogo: "Marina di Campo", anno: "2024", copertina: "", tags: ["olivi", "potatura"], pubblicato: true },
      { id: "p2", titolo: "Abbattimento pino pericolante", descrizione: "Rimozione in sicurezza vicino all'abitazione.", luogo: "Capoliveri", anno: "2025", copertina: "", tags: ["abbattimento"], pubblicato: false },
    ],
    media: [
      { id: "m1", nome: "Copertina home", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400", tipo: "immagine", alt: "Bosco verde" },
    ],
    lead: [
      { id: "l1", nome: "Giulia Neri", email: "giulia@example.com", telefono: "333 0001122", messaggio: "Vorrei un preventivo per la potatura di 3 olivi.", origine: "sito", stato: "nuovo" },
      { id: "l2", nome: "Paolo Verdi", email: "paolo@example.com", telefono: "", messaggio: "Disponibilità per sopralluogo?", origine: "telefono", stato: "in_corso" },
    ],
    appuntamenti: [
      { id: "a1", nome: "Giulia Neri", contatto: "333 0001122", servizio: "Potatura", data: oggi(), ora: "09:30", stato: "confermato", note: "Portare scala lunga" },
      { id: "a2", nome: "Paolo Verdi", contatto: "paolo@example.com", servizio: "Sopralluogo", data: oggi(), ora: "15:00", stato: "richiesto", note: "" },
    ],
    seo: [
      { id: "se1", pagina: "/", title: "Albero Maestri — Cura del verde all'Elba", description: "Potatura, abbattimenti e manutenzione giardini sull'Isola d'Elba.", keywords: "potatura, giardiniere, elba", ogImage: "" },
      { id: "se2", pagina: "/servizi", title: "Servizi — Albero Maestri", description: "Tutti i servizi per il tuo verde.", keywords: "servizi, potatura", ogImage: "" },
    ],
    lingue: [
      { id: "it", nome: "Italiano", codice: "it", attiva: true, predefinita: true },
      { id: "en", nome: "English", codice: "en", attiva: true, predefinita: false },
      { id: "de", nome: "Deutsch", codice: "de", attiva: false, predefinita: false },
    ],
  };
}

export function seedConfig(): Record<string, Valore> {
  return {
    nomeSito: "Albero Maestri",
    slogan: "Il verde, fatto bene.",
    email: "info@alberomaestri.it",
    telefono: "+39 333 1234567",
    indirizzo: "Marina di Campo, Isola d'Elba (LI)",
    sitoWeb: "https://alberomaestri.it",
    instagram: "@alberomaestri",
    facebook: "alberomaestri",
    descrizione: "Cura professionale di alberi e giardini sull'Isola d'Elba.",
  };
}
