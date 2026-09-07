import { serveDerivative } from "@/lib/mediaGuard";

export const dynamic = "force-dynamic";

/**
 * Cista zona. Do ovdje se stize samo sa clean tokenom, i tek nakon sto
 * serveDerivative ponovo procita sessions.unlocked_at iz baze.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ sessionId: string; photoId: string }> },
) {
  const { sessionId, photoId } = await ctx.params;
  return serveDerivative(req, "clean", sessionId, photoId);
}
