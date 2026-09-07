import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clampWidth, renderMockPhoto, type Variant } from "@/lib/mockImage";
import { readDerivative } from "@/lib/derivatives";
import { tokenFromRequest, verifyToken } from "@/lib/token";
import { sessionState } from "@/lib/session";

/**
 * Zajednicka provera za obje media zone.
 *
 * Namerno NE prima varijantu iz zahteva — svaka ruta je prosledjuje kao
 * literal iz svog fajla. Ne postoji parametar kojim bi klijent mogao da
 * pomjeri wm zahtev u clean odgovor.
 */
export async function serveDerivative(
  req: Request,
  variant: Variant,
  sessionId: string,
  photoId: string,
) {
  const path = new URL(req.url).pathname;

  const payload = verifyToken(tokenFromRequest(req), path);
  if (!payload) return deny(401);

  // Token mora da bude bas za ovu sesiju i bas za ovaj nivo.
  if (payload.sid !== sessionId || payload.lvl !== variant) return deny(403);

  // Jedan upit, ne dva: na jednu stranu grida ide 60 zahtjeva za slikama, pa
  // svaki suvisan round-trip do baze se mnozi sa 60. Join daje i sliku i
  // stanje sesije odjednom.
  const photo = await db.photo.findFirst({
    where: { id: photoId, sessionId },
    select: {
      id: true,
      width: true,
      height: true,
      hasDerivatives: true,
      session: { select: { unlockedAt: true, expiresAt: true, archivedAt: true } },
    },
  });
  if (!photo) return deny(404);

  const session = photo.session;
  if (sessionState(session) !== "ok") return deny(410);

  // Ovo je provjera koja stvarno stiti cistu sliku. Token je mogao biti izdat
  // prije nego sto je bilo sta naplaceno, ili poslije nego sto je opozvano —
  // pa se unlocked_at cita iz baze na SVAKI zahtjev, ne vjeruje se tokenu.
  if (variant === "clean" && !session.unlockedAt) return deny(403);

  const url = new URL(req.url);
  const width = clampWidth(url.searchParams.get("w"));
  const height = Math.round((width * photo.height) / photo.width);

  // Prave fotografije: derivat je vec pecen pri ingestu, sa zigom u pikselima.
  // Ruta ga samo procita i posalje — nista se ne obradjuje po zahtjevu. Ovo je
  // dio koji sutra preuzima CDN, a provjere iznad ostaju gdje jesu.
  if (photo.hasDerivatives) {
    const bytes = await readDerivative(variant, photo.id, width);
    if (bytes) {
      return new NextResponse(new Uint8Array(bytes), {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=300",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
        },
      });
    }
    // Red kaze da derivat postoji, a fajla nema — ingest nije zavrsen ili je
    // storage pobrisan. Ne curi se na mock, jer bi tiho posluzio pogresnu
    // sliku pod pravim imenom.
    return deny(404);
  }

  const svg = await renderMockPhoto({
    photoId: photo.id,
    variant,
    width,
    height,
    label: `IMG_${photo.id.slice(0, 4).toUpperCase()}`,
  });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Privatno i kratko: derivat je vezan za token koji i sam istice.
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}

/** Isti prazan odgovor za svaki razlog — status je jedina razlika. */
function deny(status: number) {
  return new NextResponse(null, { status });
}
