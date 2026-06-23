import { ulid } from "ulid";

/** ID generato sul client (ULID): ordinabile nel tempo, pronto per un futuro sync. */
export function nuovoId(): string {
  return ulid();
}
