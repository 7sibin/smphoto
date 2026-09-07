import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hmacCode, isWellFormedCode, normalizeCode } from "@/lib/codes";
import { mintToken, mediaBase, TOKEN_TTL_SECONDS } from "@/lib/token";
import { accessLevel, sessionState, toPublicSession } from "@/lib/session";
import { attemptsLeft, clientIp, recordAttempt, retryAfterSeconds } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Isti endpoint prima oba tipa koda i sam prepoznaje koji je.
 *
 * Kod se nikad ne poredi kao tekst — racuna se HMAC i gadja se indeksirana
 * kolona. Nema odgovora koji razlikuje "kod ne postoji" od "kod postoji ali
 * je pogresnog tipa": oba su 401, da se galerije ne mogu prebrojavati.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);

  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? normalizeCode(body.code) : "";
  } catch {
    code = "";
  }

  // Rate limit se proverava PRE lookupa — inace je baza besplatan orakl.
  const left = await attemptsLeft(ip);
  if (left <= 0) {
    return NextResponse.json(
      { error: "rate_limited", attemptsLeft: 0, retryAfter: await retryAfterSeconds(ip) },
      { status: 429 },
    );
  }

  if (!isWellFormedCode(code)) {
    await recordAttempt(ip, "unknown", false);
    return NextResponse.json(
      { error: "malformed", attemptsLeft: Math.max(0, left - 1) },
      { status: 401 },
    );
  }

  const digest = hmacCode(code);

  const session = await db.session.findFirst({
    where: { OR: [{ accessCodeHmac: digest }, { unlockCodeHmac: digest }] },
    include: { event: true },
  });

  if (!session) {
    await recordAttempt(ip, "unknown", false);
    return NextResponse.json(
      { error: "not_found", attemptsLeft: Math.max(0, left - 1) },
      { status: 401 },
    );
  }

  const isUnlockCode = session.unlockCodeHmac === digest;

  // Istekla ili arhivirana galerija ne otvara se nijednim kodom.
  const state = sessionState(session);
  if (state !== "ok") {
    await recordAttempt(ip, isUnlockCode ? "unlock" : "access", false);
    return NextResponse.json({ reason: state }, { status: 410 });
  }

  let current = session;

  // Rezervni put: operater nema signal, pa grupi da unlock kod. Gotovina je
  // vec naplacena, pa red u orders ide odmah — audit trag je jedina kontrola.
  if (isUnlockCode && !current.unlockedAt) {
    const now = new Date();
    await db.$transaction([
      db.session.update({
        where: { id: current.id },
        data: { unlockedAt: now, unlockedBy: "unlock-code" },
      }),
      db.order.create({
        data: {
          sessionId: current.id,
          amount: current.price,
          currency: current.currency,
          method: "cash",
          operatorId: "unlock-code",
        },
      }),
    ]);
    current = { ...current, unlockedAt: now, unlockedBy: "unlock-code" };
    console.info(`[unlock] session=${current.id} by=unlock-code at=${now.toISOString()}`);
  }

  await recordAttempt(ip, isUnlockCode ? "unlock" : "access", true);

  // Token se izdaje skopiran na nivo koji sesija STVARNO ima u ovom trenutku.
  const level = accessLevel(current);
  const publicSession = await toPublicSession(current);

  return NextResponse.json({
    sessionId: current.id,
    token: mintToken(current.id, level),
    tokenTtl: TOKEN_TTL_SECONDS,
    unlocked: level === "clean",
    mediaBase: mediaBase(current.id, level),
    session: publicSession,
  });
}
