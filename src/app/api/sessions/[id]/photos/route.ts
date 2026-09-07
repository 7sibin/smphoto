import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tokenFromRequest, verifySessionToken } from "@/lib/token";
import { sessionState } from "@/lib/session";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 60;

/**
 * Kursor je (takenAt, id) — takenAt sam nije jedinstven, dvije slike u istoj
 * milisekundi bi u suprotnom ili nestale ili se ponovile na granici strane.
 */
function encodeCursor(takenAt: Date, id: string): string {
  return Buffer.from(`${takenAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(raw: string | null): { takenAt: Date; id: string } | null {
  if (!raw) return null;
  try {
    const [iso, id] = Buffer.from(raw, "base64url").toString("utf8").split("|");
    if (!iso || !id) return null;
    const takenAt = new Date(iso);
    if (Number.isNaN(takenAt.getTime())) return null;
    return { takenAt, id };
  } catch {
    return null;
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const payload = verifySessionToken(tokenFromRequest(req), id);
  if (!payload) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const session = await db.session.findUnique({
    where: { id },
    select: { id: true, expiresAt: true, archivedAt: true },
  });
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const state = sessionState(session);
  if (state !== "ok") return NextResponse.json({ reason: state }, { status: 410 });

  const url = new URL(req.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT),
  );
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const rows = await db.photo.findMany({
    where: {
      sessionId: id,
      ...(cursor
        ? {
            OR: [
              { takenAt: { gt: cursor.takenAt } },
              { takenAt: cursor.takenAt, id: { gt: cursor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ takenAt: "asc" }, { id: "asc" }],
    // Jedan red viska govori da li postoji sledeca strana, bez COUNT(*).
    take: limit + 1,
    // storageKey namerno NIJE u selectu. Original nema javnu putanju.
    select: { id: true, width: true, height: true, takenAt: true },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return NextResponse.json({
    photos: page.map((p) => ({
      id: p.id,
      w: p.width,
      h: p.height,
      takenAt: p.takenAt.toISOString(),
    })),
    nextCursor: hasMore && last ? encodeCursor(last.takenAt, last.id) : null,
  });
}
