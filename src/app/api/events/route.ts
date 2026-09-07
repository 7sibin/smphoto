import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Lista dana. Javna je namerno — ekran "Pregled po datumu" postoji za ljude
 * koji su izgubili karticu. Ali vraca samo dan, mjesto i broj termina.
 * Nijedan photo id, nijedan kod, nijedan session token.
 */
export async function GET() {
  const events = await db.event.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true,
      name: true,
      date: true,
      location: true,
      // Arhivirane sesije lista ne prikazuje, pa ne smiju ni da se broje.
      _count: { select: { sessions: { where: { archivedAt: null } } } },
    },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date.toISOString(),
      location: e.location,
      sessionCount: e._count.sessions,
    })),
  });
}
