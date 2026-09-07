/**
 * Citanje pecenih derivata sa diska.
 *
 * Ovaj fajl NE zna da peče. Pecenje je posao ingesta (scripts/bake.ts), koji
 * jedini uvozi sharp — aplikacija samo servira bajtove, kao sto ce ih sutra
 * servirati CDN. Zato sharp nikad ne udje u server bundle.
 *
 * Layout je isti kao sto bi bile dvije CDN zone:
 *
 *   storage/derivatives/wm/<photoId>@<width>.webp
 *   storage/derivatives/clean/<photoId>@<width>.webp
 *
 * Dvije zone, dva direktorijuma. Varijanta u putanji dolazi iz literala u
 * ruti, nikad iz zahtjeva.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Variant } from "@/lib/mockImage";

/** Van public/. Original i derivati nemaju javnu putanju — samo ovu. */
export const STORAGE_ROOT =
  process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");

export function derivativeDir(variant: Variant): string {
  return path.join(STORAGE_ROOT, "derivatives", variant);
}

export function derivativePath(variant: Variant, photoId: string, width: number): string {
  return path.join(derivativeDir(variant), `${photoId}@${width}.webp`);
}

/**
 * Vraca bajtove pecenog derivata, ili null ako ga nema.
 *
 * Null nije greska — znaci "ova slika je mock, nacrtaj je". Pravi ingest bi
 * ovdje imao samo dvije mogucnosti: bajtovi ili 404.
 */
export async function readDerivative(
  variant: Variant,
  photoId: string,
  width: number,
): Promise<Buffer | null> {
  try {
    return await readFile(derivativePath(variant, photoId, width));
  } catch {
    return null;
  }
}
