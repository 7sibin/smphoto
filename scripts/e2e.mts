/**
 * E2E provjere preko HTTP-a, protiv pokrenutog servera — lokalnog ili
 * deployovanog.
 *
 *   npm run e2e                                   # http://localhost:3000
 *   npm run e2e -- https://smphoto-nu.vercel.app  # produkcija
 *
 * Razlika u odnosu na `npm run smoke`: ovo NE MIJENJA stanje. Nijedna
 * provjera ne otkljucava sesiju niti pise u bazu osim onoga sto rate limit
 * sam upise. Zato smije da se pusti na produkciju, a smoke ne smije.
 *
 * Ne uvozi Prismu ni bilo sta iz src/. Gleda sistem izvana, kao browser —
 * ako se schema promijeni a API ostane isti, ovo i dalje vazi.
 */

// .env se cita rucno i PREGAZI zatecene varijable. Dotenv to ne radi, pa
// zaostali DATABASE_URL u shell-u umije da pregazi .env i da lazan rezultat.
import { readFileSync } from "node:fs";

function loadEnv(): void {
  let raw: string;
  try {
    raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  } catch {
    return; // Nema .env — oslanjamo se na okruzenje (CI).
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/.exec(line);
    if (m && !line.trimStart().startsWith("#")) process.env[m[1]!] = m[2]!;
  }
}

loadEnv();

const BASE = (process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ADMIN = process.env.ADMIN_TOKEN ?? "";

/**
 * Kodovi iz seed-a. Hero par je fiksan u prisma/seed.ts; ostali ispadaju iz
 * deterministicnog rng-a, pa se ne mijenjaju dok se lista sesija ne dira.
 * Ako se seed promijeni, prepravi ovdje ili proslijedi kroz okruzenje.
 */
const LOCKED = process.env.E2E_LOCKED_CODE ?? "K7XM4Q2P";   // 420 slika, zakljucana
const UNLOCKED = process.env.E2E_UNLOCKED_CODE ?? "HG92TVZD"; // seed je oznacio otkljucanom

/**
 * Lazna IP po run-u, da rate limit ne curi iz jednog run-a u drugi.
 * Radi lokalno; iza Vercel edge-a x-forwarded-for postavlja platforma, pa
 * tamo jedan run potrosi 1 od 10 dozvoljenih promasaja po pravoj IP.
 */
const RUN_IP = `10.${rand(255)}.${rand(255)}.${rand(254) + 1}`;

function rand(n: number): number {
  return Math.floor(Math.random() * n);
}

let pass = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    failures.push(name);
    console.log(`  PAO   ${name}${detail ? "  " + detail : ""}`);
  }
}

function get(path: string, headers: Record<string, string> = {}) {
  return fetch(`${BASE}${path}`, { headers: { "x-forwarded-for": RUN_IP, ...headers } });
}

async function access(code: string) {
  const r = await fetch(`${BASE}/api/access`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ code }),
  });
  const text = await r.text();
  let body: any = null;
  try {
    body = JSON.parse(text);
  } catch {
    // Prazno tijelo znaci 500 iz funkcije — poruka je u logovima hosta.
  }
  return { status: r.status, body, text };
}

async function main(): Promise<void> {
  console.log(`\ncilj: ${BASE}`);
  if (!ADMIN) console.log("upozorenje: ADMIN_TOKEN nije postavljen — admin grupa ce pasti");

  console.log("\n[1] Stranica galerije");
  const page = await get(`/g/${LOCKED}`);
  const html = await page.text();
  check("GET /g/<kod> vraca 200", page.status === 200, `(${page.status})`);
  check("HTML nije prazan", html.length > 1000, `(${html.length} B)`);

  console.log("\n[2] Razrjesavanje koda");
  const locked = await access(LOCKED);
  if (locked.status === 429) {
    console.log("  rate limit pogodjen — sacekaj do 15 min ili promijeni IP. Prekidam.");
    process.exitCode = 1;
    return;
  }
  check("validan kod -> 200", locked.status === 200, `(${locked.status}) ${locked.text.slice(0, 120)}`);
  if (locked.status !== 200) {
    console.log("  bez tokena nema smisla nastavljati. Prekidam.");
    process.exitCode = 1;
    return;
  }
  check("nivo je 'wm'", locked.body.mediaBase?.includes("/wm/"));
  check("unlocked = false", locked.body.unlocked === false);
  check("420 slika", locked.body.session?.photoCount === 420, `(${locked.body.session?.photoCount})`);

  // 401 namjerno, isti status kao za neispravan oblik — galerija ne smije biti
  // enumerabilna, pa se "ne postoji" ne razlikuje od "pogresan oblik".
  const bad = await access("XXXXXXXX");
  check("nepostojeci kod -> 401", bad.status === 401, `(${bad.status})`);
  check("odgovor ne odaje da sesija ne postoji", bad.body?.error === "not_found");

  console.log("\n[3] Kursor paginacija");
  const sid: string = locked.body.sessionId;
  const tok: string = locked.body.token;
  const auth = { authorization: `Bearer ${tok}` };

  const page1 = await (await get(`/api/sessions/${sid}/photos`, auth)).json() as any;
  check("prva strana = 60 slika", page1.photos?.length === 60, `(${page1.photos?.length})`);
  check("cursor postoji", Boolean(page1.nextCursor));

  const page2 = await (await get(
    `/api/sessions/${sid}/photos?cursor=${encodeURIComponent(page1.nextCursor)}`,
    auth,
  )).json() as any;
  const overlap = page1.photos.some((a: any) => page2.photos.some((b: any) => a.id === b.id));
  check("druga strana se ne preklapa sa prvom", !overlap);

  console.log("\n[4] Bez tokena");
  check("spisak slika bez tokena -> 401", (await get(`/api/sessions/${sid}/photos`)).status === 401);

  console.log("\n[5] Nivo pristupa — jedina provjera koja stvarno mora da prodje");
  const pid: string = page1.photos[0].id;

  const wm = await get(`/api/media/wm/${sid}/${pid}?t=${tok}`);
  check("wm ruta sa wm tokenom -> 200", wm.status === 200, `(${wm.status})`);
  check("odgovor je slika", (wm.headers.get("content-type") ?? "").startsWith("image/"));

  const stolen = await get(`/api/media/clean/${sid}/${pid}?t=${tok}`);
  check(
    "clean ruta sa wm tokenom -> ODBIJENO",
    stolen.status === 401 || stolen.status === 403,
    `(${stolen.status})`,
  );

  console.log("\n[6] Otkljucana sesija — clean mora da radi");
  const un = await access(UNLOCKED);
  check("unlocked = true", un.body?.unlocked === true, `(${un.status})`);
  if (un.body?.unlocked) {
    check("nivo je 'clean'", un.body.mediaBase?.includes("/clean/"));
    const unPhotos = await (await get(`/api/sessions/${un.body.sessionId}/photos`, {
      authorization: `Bearer ${un.body.token}`,
    })).json() as any;
    const clean = await get(
      `/api/media/clean/${un.body.sessionId}/${unPhotos.photos[0].id}?t=${un.body.token}`,
    );
    check("clean ruta sa clean tokenom -> 200", clean.status === 200, `(${clean.status})`);
  }

  console.log("\n[7] Admin");
  check("bez tokena -> 401", (await get("/api/admin/sessions")).status === 401);
  const adminRes = await get("/api/admin/sessions", { authorization: `Bearer ${ADMIN}` });
  check("sa ADMIN_TOKEN -> 200", adminRes.status === 200, `(${adminRes.status})`);
  if (adminRes.status === 200) {
    const body = await adminRes.json() as any;
    check("vraca 12 sesija", body.sessions?.length === 12, `(${body.sessions?.length})`);
    check("ne vraca plaintext kodove", !JSON.stringify(body).includes(LOCKED));
  }

  console.log("\n" + "=".repeat(50));
  console.log(`proslo: ${pass}   palo: ${failures.length}`);
  if (failures.length) {
    console.log("\npalo:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("\nGRESKA:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
