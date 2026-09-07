/**
 * Oblik koda — dijele ga server i klijent, pa ovdje nema node:crypto
 * ni citanja env-a. HMAC je u codes.ts i ostaje na serveru.
 */

/** Bez I, O, 0, 1 — ljudi ih prepisuju sa kartice, mokrim rukama, na suncu. */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 8;

/** Skida razmake i crtice, podize u velika slova. Ono sto korisnik zalijepi. */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isWellFormedCode(raw: string): boolean {
  const code = normalizeCode(raw);
  if (code.length !== CODE_LENGTH) return false;
  return [...code].every((ch) => CODE_ALPHABET.includes(ch));
}
