import { ulid } from "ulid";

export const nuovoId = (): string => ulid();
export const adesso = (): string => new Date().toISOString();
