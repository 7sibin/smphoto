import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionState } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Spisak termina za operatera. Kodovi se ne vracaju — u bazi su samo HMAC-ovi. */
export async function GET(req: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sessions = await db.session.findMany({
    orderBy: [{ startsAt: "desc" }],
    include: {
      event: { select: { name: true, date: true, location: true } },
      _count: { select: { photos: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      label: s.label,
      eventName: s.event.name,
      eventDate: s.event.date.toISOString(),
      location: s.event.location,
      startsAt: s.startsAt.toISOString(),
      price: s.price,
      currency: s.currency,
      photoCount: s._count.photos,
      unlocked: Boolean(s.unlockedAt),
      unlockedAt: s.unlockedAt?.toISOString() ?? null,
      unlockedBy: s.unlockedBy,
      state: sessionState(s),
    })),
  });
}
