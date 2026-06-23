import { clsx, type ClassValue } from "clsx";

/** Unione condizionale di classi (facciata semplice su clsx). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
