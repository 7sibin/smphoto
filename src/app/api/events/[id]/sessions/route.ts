import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionState } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Termini u danu. Isto pravilo kao /api/events: spisak je javan, sadrzaj nije.
 *
 * Vraca broj slika (da grupa prepozna svoj camac) ali nijedan photo id i
 * nijedan token — otvaranje galerije i dalje trazi kod sa kartice.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const event = await db.event.findUnique({
    where: { id },
    select: { id: true, name: true, date: true, location: true },
  });
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const sessions = await db.session.findMany({
    where: { eventId: id },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      label: true,
      startsAt: true,
      endsAt: true,
      price: true,
      currency: true,
      unlockedAt: true,
      expiresAt: true,
      archivedAt: true,
      _count: { select: { photos: true } },
    },
  });

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      location: event.location,
    },
    sessions: sessions
      .filter((s) => sessionState(s) !== "archived")
      .map((s) => ({
        id: s.id,
        label: s.label,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        price: s.price,
        currency: s.currency,
        photoCount: s._count.photos,
        unlocked: Boolean(s.unlockedAt),
        state: sessionState(s),
      })),
  });
}
