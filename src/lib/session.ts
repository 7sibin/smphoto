import { db } from "@/lib/db";
import type { AccessLevel } from "@/lib/token";

/** Oblik sesije koji sme da napusti server. Bez ijednog HMAC-a i bez putanja. */
export type PublicSession = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  price: number;
  currency: string;
  photoCount: number;
  unlocked: boolean;
  event: { id: string; name: string; date: string; location: string };
};

export type SessionState = "ok" | "expired" | "archived";

type Gateable = { expiresAt: Date | null; archivedAt: Date | null };

export function sessionState(s: Gateable): SessionState {
  if (s.archivedAt) return "archived";
  if (s.expiresAt && s.expiresAt.getTime() < Date.now()) return "expired";
  return "ok";
}

export function accessLevel(s: { unlockedAt: Date | null }): AccessLevel {
  return s.unlockedAt ? "clean" : "wm";
}

const WITH_EVENT = { event: true } as const;

export async function loadSession(id: string) {
  return db.session.findUnique({ where: { id }, include: WITH_EVENT });
}

export async function toPublicSession(
  s: Awaited<ReturnType<typeof loadSession>> & object,
): Promise<PublicSession> {
  const photoCount = await db.photo.count({ where: { sessionId: s.id } });
  return {
    id: s.id,
    label: s.label,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    price: s.price,
    currency: s.currency,
    photoCount,
    unlocked: Boolean(s.unlockedAt),
    event: {
      id: s.event.id,
      name: s.event.name,
      date: s.event.date.toISOString(),
      location: s.event.location,
    },
  };
}
