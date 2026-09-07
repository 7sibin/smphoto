import { createHmac } from "node:crypto";
import { normalizeCode } from "@/lib/codeFormat";

/**
 * Kodovi se nikad ne cuvaju kao plaintext. HMAC-SHA256 sa serverskim kljucem
 * je deterministican, pa kolona moze da bude UNIQUE i da se pretrazuje jednim
 * indeksiranim lookupom — bez skeniranja tabele i bcrypt-a po redu.
 *
 * Samo server. Oblik koda (duzina, alfabet) je u codeFormat.ts.
 */

const CODE_SECRET = requireSecret("CODE_HMAC_SECRET");

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 16) {
    throw new Error(
      `${name} nije postavljen (ili je kraci od 16 znakova). Pogledaj .env.`,
    );
  }
  return value;
}

export function hmacCode(code: string): string {
  return createHmac("sha256", CODE_SECRET).update(normalizeCode(code)).digest("hex");
}



export { CODE_LENGTH, normalizeCode, isWellFormedCode } from "@/lib/codeFormat";
