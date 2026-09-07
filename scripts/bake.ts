/**
 * Ingest: prave fotografije u galeriju jedne grupe.
 *
 * Jedino mjesto koje uvozi sharp. Aplikacija ne obradjuje slike po zahtjevu —
 * ovdje se sve ispece, a ruta poslije samo cita bajtove sa diska.
 *
 *   npx tsx scripts/bake.ts [KOD] [broj]
 *   npm run bake
 *
 * Sto se tacno desava sa svakom slikom:
 *
 *   1. Original se kopira u storage/originals/<sessionId>/ — van public/, bez
 *      javne putanje. Ime je UUID slike, ne originalno ime fajla.
 *   2. Za svaku dozvoljenu sirinu peku se DVA derivata:
 *        clean — cista slika, EXIF skinut
 *        wm    — ista slika sa zigom RASTERIZOVANIM u piksele
 *      Zig nije sloj preko slike. Poslije pecenja u wm fajlu ne postoji nijedan
 *      piksel ciste fotografije — nema sta da se ugasi ni obrise.
 *   3. Red u bazi dobije prave dimenzije i hasDerivatives = true.
 *
 * EXIF: sharp po difoltu ne prenosi metapodatke u izlaz. GPS koordinate sa
 * kanjona i serijski broj aparata ne izlaze iz storage-a.
 */

try {
  process.loadEnvFile();
} catch {
  // Ako .env ne postoji, oslanjamo se na okruzenje.
}

import { PrismaClient } from "@prisma/client";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { hmacCode } from "../src/lib/codes";
import { ALLOWED_WIDTHS, watermarkLayer, type Variant } from "../src/lib/mockImage";

const db = new PrismaClient();

/** Privatni izvor. Ovdje operater sipa slike sa citaca kartica. */
const SOURCE_DIR = path.join(process.cwd(), "assets", "photos");
const STORAGE_ROOT = process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");

const DEFAULT_CODE = "K7XM4Q2P";
const SUPPORTED = /\.(jpe?g|png|webp|tiff?)$/i;

const [codeArg, countArg] = process.argv.slice(2);
const CODE = (codeArg ?? DEFAULT_CODE).toUpperCase();
const LIMIT = countArg ? Number(countArg) : Infinity;

/** Zig kao samostalan SVG, iz iste funkcije koju koristi i mock. */
function watermarkOverlay(width: number, height: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${watermarkLayer(width, height)}</svg>`,
  );
}

async function bakeOne(
  original: Buffer,
  photoId: string,
  variant: Variant,
  width: number,
  srcWidth: number,
  srcHeight: number,
): Promise<number> {
  // Nikad ne uvecavaj preko originala — sirina fajla je i dalje trazena sirina,
  // pa je pretraga na ruti jedan direktan pogodak, bez fallback logike.
  const w = Math.min(width, srcWidth);
  const h = Math.round((w * srcHeight) / srcWidth);

  let pipe = sharp(original).resize(w, h, { fit: "inside" });

  if (variant === "wm") {
    pipe = pipe.composite([{ input: watermarkOverlay(w, h), top: 0, left: 0 }]);
  }

  // Bez .withMetadata() — EXIF ostaje iza.
  const out = await pipe.webp({ quality: variant === "wm" ? 72 : 82 }).toBuffer();

  const dest = path.join(STORAGE_ROOT, "derivatives", variant, `${photoId}@${width}.webp`);
  await writeFile(dest, out);
  return out.length;
}

async function main() {
  const session = await db.session.findUnique({
    where: { accessCodeHmac: hmacCode(CODE) },
    select: { id: true, label: true, startsAt: true },
  });
  if (!session) throw new Error(`Nema sesije za kod ${CODE}. Jesi li pokrenuo npm run seed?`);

  let sources: string[];
  try {
    sources = (await readdir(SOURCE_DIR)).filter((f) => SUPPORTED.test(f)).sort();
  } catch {
    throw new Error(`Nema direktorijuma ${SOURCE_DIR}. Napravi ga i ubaci slike.`);
  }
  if (sources.length === 0) throw new Error(`${SOURCE_DIR} je prazan.`);

  const take = Math.min(sources.length, LIMIT);
  const picked = sources.slice(0, take);

  // Prve slike po vremenu snimanja — grupa ih vidi cim se galerija otvori,
  // bez skrolovanja.
  const targets = await db.photo.findMany({
    where: { sessionId: session.id },
    orderBy: [{ takenAt: "asc" }, { id: "asc" }],
    take,
    select: { id: true },
  });
  if (targets.length < take) {
    throw new Error(`Sesija ima samo ${targets.length} slika, a trazeno je ${take}.`);
  }

  // Derivati su izvedeni podaci. Brisu se i peku ispocetka, da poslije novog
  // seeda ne ostanu fajlovi sa mrtvim photo id-evima.
  await rm(path.join(STORAGE_ROOT, "derivatives"), { recursive: true, force: true });
  const originalsDir = path.join(STORAGE_ROOT, "originals", session.id);
  await rm(originalsDir, { recursive: true, force: true });
  for (const v of ["wm", "clean"] as Variant[]) {
    await mkdir(path.join(STORAGE_ROOT, "derivatives", v), { recursive: true });
  }
  await mkdir(originalsDir, { recursive: true });

  console.log(`\nSesija: ${session.label} · ${session.startsAt.toISOString().slice(0, 10)}`);
  console.log(`Izvor:  ${SOURCE_DIR}`);
  console.log(`Pecem:  ${take} slika × ${ALLOWED_WIDTHS.length} sirina × 2 zone\n`);

  let totalBytes = 0;

  for (let i = 0; i < take; i++) {
    const file = picked[i];
    const photoId = targets[i].id;
    const original = await readFile(path.join(SOURCE_DIR, file));
    const meta = await sharp(original).metadata();
    if (!meta.width || !meta.height) throw new Error(`Ne mogu procitati dimenzije: ${file}`);

    // Original u storage, pod UUID imenom. Galerija ostaje neprobojna za
    // pogadjanje imena, a putanja iz baze nikad ne ide klijentu.
    const ext = path.extname(file).toLowerCase();
    const storageKey = `originals/${session.id}/${photoId}${ext}`;
    await writeFile(path.join(STORAGE_ROOT, storageKey), original);

    let perPhoto = 0;
    for (const w of ALLOWED_WIDTHS) {
      for (const v of ["wm", "clean"] as Variant[]) {
        perPhoto += await bakeOne(original, photoId, v, w, meta.width, meta.height);
      }
    }
    totalBytes += perPhoto;

    await db.photo.update({
      where: { id: photoId },
      data: {
        storageKey,
        width: meta.width,
        height: meta.height,
        bytes: original.length,
        hasDerivatives: true,
      },
    });

    console.log(
      `  ${String(i + 1).padStart(2)}. ${file.padEnd(22)} ${meta.width}×${meta.height}` +
        `  →  ${(perPhoto / 1024).toFixed(0)} KB derivata`,
    );
  }

  console.log(`\nGotovo. ${take} pravih slika na vrhu galerije, ${(totalBytes / 1024 / 1024).toFixed(1)} MB derivata.`);
  console.log(`Storage: ${STORAGE_ROOT}  (van public/, bez javne putanje)\n`);
}

main()
  .catch((e) => {
    console.error(`\n${e instanceof Error ? e.message : e}\n`);
    process.exitCode = 1;
  })
  .finally(() => void db.$disconnect());
