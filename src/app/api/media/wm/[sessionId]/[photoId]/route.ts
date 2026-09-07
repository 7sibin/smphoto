import { serveDerivative } from "@/lib/mediaGuard";

export const dynamic = "force-dynamic";

/**
 * Watermark zona. Odvojena ruta, odvojen fajl, varijanta zakucana kao literal.
 * Ne postoji grana u ovom fajlu koja moze da vrati cistu sliku.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ sessionId: string; photoId: string }> },
) {
  const { sessionId, photoId } = await ctx.params;
  return serveDerivative(req, "wm", sessionId, photoId);
}
