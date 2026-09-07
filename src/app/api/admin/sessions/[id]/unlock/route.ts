import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionState } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Operater je naplatio gotovinu i klikce "Naplaćeno".
 *
 * Naplata je van softvera, pa je audit trag jedina kontrola: red u orders i
 * unlocked_by se upisuju u istoj transakciji kao i samo otkljucavanje.
 *
 * Nema korisnickih naloga, pa je ovaj pass zasticen deljenim ADMIN_TOKEN-om.
 * Pravi nalozi operatera dolaze kad se admin bude gradio.
 */
function authorized(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let amount: number | undefined;
  let operatorId = "";
  try {
    const body = (await req.json()) as { amount?: unknown; operatorId?: unknown };
    amount = typeof body.amount === "number" ? body.amount : undefined;
    operatorId = typeof body.operatorId === "string" ? body.operatorId.trim() : "";
  } catch {
    /* pada na validaciju ispod */
  }

  if (!operatorId) {
    return NextResponse.json({ error: "operatorId_required" }, { status: 400 });
  }

  const session = await db.session.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const state = sessionState(session);
  if (state !== "ok") return NextResponse.json({ reason: state }, { status: 410 });

  if (session.unlockedAt) {
    // Vec naplaceno. Drugi klik ne pravi drugi red u orders.
    return NextResponse.json({
      unlocked: true,
      unlockedAt: session.unlockedAt.toISOString(),
      unlockedBy: session.unlockedBy,
      alreadyUnlocked: true,
    });
  }

  const now = new Date();
  const charged = amount ?? session.price;

  const [, order] = await db.$transaction([
    db.session.update({
      where: { id },
      data: { unlockedAt: now, unlockedBy: operatorId },
    }),
    db.order.create({
      data: {
        sessionId: id,
        amount: charged,
        currency: session.currency,
        method: "cash",
        operatorId,
      },
    }),
  ]);

  console.info(
    `[unlock] session=${id} by=${operatorId} amount=${charged} at=${now.toISOString()}`,
  );

  return NextResponse.json({
    unlocked: true,
    unlockedAt: now.toISOString(),
    unlockedBy: operatorId,
    orderId: order.id,
  });
}
