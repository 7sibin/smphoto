import { db } from "@/lib/db";

/** 10 pokusaja / 15 min po IP, na oba tipa koda zajedno. */
export const MAX_ATTEMPTS = 10;
export const WINDOW_MS = 15 * 60 * 1000;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

/** Koliko je NEUSPELIH pokusaja ostalo ovom IP-u u tekucem prozoru. */
export async function attemptsLeft(ip: string): Promise<number> {
  const used = await db.codeAttempt.count({
    where: { ip, success: false, createdAt: { gte: windowStart() } },
  });
  return Math.max(0, MAX_ATTEMPTS - used);
}

export async function recordAttempt(
  ip: string,
  kind: "access" | "unlock" | "unknown",
  success: boolean,
): Promise<void> {
  await db.codeAttempt.create({ data: { ip, kind, success } });
}

/** Sekunde do isteka najstarijeg neuspelog pokusaja — kad se budzet obnavlja. */
export async function retryAfterSeconds(ip: string): Promise<number> {
  const oldest = await db.codeAttempt.findFirst({
    where: { ip, success: false, createdAt: { gte: windowStart() } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (!oldest) return 0;
  const freeAt = oldest.createdAt.getTime() + WINDOW_MS;
  return Math.max(0, Math.ceil((freeAt - Date.now()) / 1000));
}
