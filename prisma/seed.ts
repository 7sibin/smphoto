/**
 * Seed: 3 dogadjaja, 12 sesija, i jedna sesija sa 420 slika.
 *
 * Ta jedna je test slucaj — 420 slika kroz kursor paginaciju i virtualizovan
 * grid. Ostalih 11 postoje da bi ekrani "po datumu", "prazan termin",
 * "istekao" i "vec otkljucano" imali stvarne podatke, ne prekidace.
 */

// .env mora da se ucita pre nego sto codes.ts trazi CODE_HMAC_SECRET.
try {
  process.loadEnvFile();
} catch {
  // Ako .env ne postoji, oslanjamo se na okruzenje.
}

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { hmacCode } from "../src/lib/codes";

const db = new PrismaClient();

/** Fiksni kodovi za sesiju sa 420 slika — QR deep link iz dizajna je /g/K7XM4Q2P. */
const HERO_ACCESS_CODE = "K7XM4Q2P";
const HERO_UNLOCK_CODE = "9RTUNL42";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Deterministicni generator, da svaki seed da iste kodove za ispis. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const rng = makeRng(20260817);

function codeFrom(rand: () => number): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return out;
}

function at(dateIso: string, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(dateIso);
  d.setHours(h!, m!, 0, 0);
  return d;
}

type SessionSpec = {
  label: string;
  start: string;
  end: string;
  photos: number;
  price?: number;
  /** Vec naplacena pre seed-a — da se otkljucano stanje vidi bez cekanja. */
  unlocked?: boolean;
  /** Dostupnost je istekla: /api/access vraca 410 "expired". */
  expired?: boolean;
  /** Sklonjena iz ponude: /api/access vraca 410 "archived". */
  archived?: boolean;
  accessCode?: string;
  unlockCode?: string;
};

type EventSpec = {
  name: string;
  date: string;
  location: string;
  sessions: SessionSpec[];
};

const EVENTS: EventSpec[] = [
  {
    name: "Rafting Tara — ponedjeljak",
    date: "2026-08-17",
    location: "Baza Šćepan Polje",
    sessions: [
      {
        label: "Čamac 3 · 14:20",
        start: "14:20",
        end: "17:10",
        photos: 420,
        accessCode: HERO_ACCESS_CODE,
        unlockCode: HERO_UNLOCK_CODE,
      },
      { label: "Čamac 7 · 14:20", start: "14:20", end: "17:05", photos: 268 },
      { label: "Čamac 1 · 09:40", start: "09:40", end: "12:30", photos: 341 },
      { label: "Čamac 5 · 09:40", start: "09:40", end: "12:20", photos: 0 },
      { label: "Čamac 9 · 17:00", start: "17:00", end: "19:40", photos: 156, unlocked: true },
    ],
  },
  {
    name: "Rafting Tara — nedjelja",
    date: "2026-08-16",
    location: "Baza Šćepan Polje",
    sessions: [
      { label: "Čamac 2 · 10:00", start: "10:00", end: "12:50", photos: 297 },
      { label: "Čamac 5 · 15:10", start: "15:10", end: "18:00", photos: 189 },
      { label: "Čamac 8 · 10:00", start: "10:00", end: "12:45", photos: 233, price: 7000 },
      { label: "Čamac 4 · 15:10", start: "15:10", end: "17:55", photos: 311 },
    ],
  },
  {
    name: "Rafting Drina — subota",
    date: "2026-08-15",
    location: "Baza Foča",
    sessions: [
      { label: "Čamac 4 · 09:40", start: "09:40", end: "12:30", photos: 355 },
      { label: "Čamac 9 · 14:20", start: "14:20", end: "17:10", photos: 214, expired: true },
      { label: "Čamac 6 · 14:20", start: "14:20", end: "17:00", photos: 178, archived: true },
    ],
  },
];

const DEFAULT_PRICE = 6000; // 60 KM
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  console.log("Brišem stare podatke…");
  await db.codeAttempt.deleteMany();
  await db.order.deleteMany();
  await db.photo.deleteMany();
  await db.session.deleteMany();
  await db.event.deleteMany();

  const printed: Array<{ label: string; photos: number; access: string; unlock: string; note: string }> = [];

  for (const ev of EVENTS) {
    const event = await db.event.create({
      data: { name: ev.name, date: new Date(ev.date), location: ev.location },
    });

    for (const spec of ev.sessions) {
      const accessCode = spec.accessCode ?? codeFrom(rng);
      const unlockCode = spec.unlockCode ?? codeFrom(rng);
      const startsAt = at(ev.date, spec.start);
      const endsAt = at(ev.date, spec.end);

      const session = await db.session.create({
        data: {
          eventId: event.id,
          label: spec.label,
          startsAt,
          endsAt,
          price: spec.price ?? DEFAULT_PRICE,
          currency: "BAM",
          accessCodeHmac: hmacCode(accessCode),
          unlockCodeHmac: hmacCode(unlockCode),
          unlockedAt: spec.unlocked ? new Date(startsAt.getTime() + 3 * 60 * 60 * 1000) : null,
          unlockedBy: spec.unlocked ? "op-marko" : null,
          expiresAt: spec.expired
            ? new Date(Date.now() - 2 * DAY)
            : new Date(Date.now() + 30 * DAY),
          archivedAt: spec.archived ? new Date(Date.now() - 5 * DAY) : null,
        },
      });

      if (spec.unlocked) {
        await db.order.create({
          data: {
            sessionId: session.id,
            amount: spec.price ?? DEFAULT_PRICE,
            currency: "BAM",
            method: "cash",
            operatorId: "op-marko",
          },
        });
      }

      if (spec.photos > 0) {
        const spanMs = endsAt.getTime() - startsAt.getTime();
        const rows = Array.from({ length: spec.photos }, (_, i) => {
          const id = randomUUID();
          // Slike padaju u rafalima kroz spust, ne u ravnomjernom ritmu.
          const jitter = Math.floor(rng() * 4000) - 2000;
          const takenAt = new Date(
            startsAt.getTime() + Math.floor((spanMs * i) / spec.photos) + jitter,
          );
          const portrait = i % 7 === 3;
          return {
            id,
            sessionId: session.id,
            storageKey: `originals/${session.id}/${id}.cr3`,
            takenAt,
            width: portrait ? 4000 : 6000,
            height: portrait ? 6000 : 4000,
            bytes: 4_200_000 + Math.floor(rng() * 5_000_000),
          };
        });

        // SQLite ne voli jedan ogroman INSERT — 500 po komadu.
        for (let i = 0; i < rows.length; i += 500) {
          await db.photo.createMany({ data: rows.slice(i, i + 500) });
        }

        await db.session.update({
          where: { id: session.id },
          data: { coverPhotoId: rows[0]!.id },
        });
      }

      printed.push({
        label: `${ev.date} · ${spec.label}`,
        photos: spec.photos,
        access: accessCode,
        unlock: unlockCode,
        note: spec.expired
          ? "istekla (410 expired)"
          : spec.archived
            ? "arhivirana (410 archived)"
            : spec.unlocked
              ? "već otključana"
              : spec.photos === 0
                ? "prazan termin"
                : "",
      });
    }
  }

  const total = printed.reduce((a, p) => a + p.photos, 0);

  console.log(`\nUpisano: ${EVENTS.length} događaja, ${printed.length} sesija, ${total} slika.\n`);
  console.log("KOD          UNLOCK       SLIKA  TERMIN");
  console.log("─".repeat(78));
  for (const p of printed) {
    const star = p.photos === 420 ? " ←── test slučaj" : "";
    console.log(
      `${p.access}     ${p.unlock}     ${String(p.photos).padStart(5)}  ${p.label}` +
        (p.note ? `  (${p.note})` : "") +
        star,
    );
  }
  console.log("─".repeat(78));
  console.log(`\nSesija sa 420 slika:  http://localhost:3000/g/${HERO_ACCESS_CODE}`);
  console.log(`Admin panel:          http://localhost:3000/admin\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
