import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  mediaBase,
  mintToken,
  parseToken,
  secondsLeft,
  TOKEN_REFRESH_BELOW_SECONDS,
  tokenFromRequest,
} from "@/lib/token";
import { accessLevel, sessionState } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Polling, da se galerija sama otkljuca dok je grupa gleda.
 *
 * Kad operater naplati, ovaj endpoint prvi vidi promjenu i vraca NOV token
 * na clean nivou. Stari wm token ostaje validan za wm rutu i nista vise —
 * nivo se ne "nadogradjuje", izdaje se drugi token.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const payload = parseToken(tokenFromRequest(req));
  if (!payload || payload.sid !== id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const session = await db.session.findUnique({
    where: { id },
    select: { id: true, unlockedAt: true, expiresAt: true, archivedAt: true },
  });
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const state = sessionState(session);
  if (state !== "ok") return NextResponse.json({ reason: state }, { status: 410 });

  const level = accessLevel(session);
  const levelChanged = level !== payload.lvl;
  const expiringSoon = secondsLeft(payload) < TOKEN_REFRESH_BELOW_SECONDS;

  return NextResponse.json({
    unlocked: level === "clean",
    ...(levelChanged || expiringSoon
      ? { token: mintToken(id, level), mediaBase: mediaBase(id, level) }
      : {}),
  });
}
