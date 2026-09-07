import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Jedan potpisan token po SESIJI, skopiran na putanju (pathAllowed).
 * Nikad token po slici — 420 HMAC-ova po ucitavanju stranice je bug.
 *
 * Token nosi nivo koji je server vec odobrio. On je dozvola za prefiks
 * putanje, ne dokaz o pravu: /api/media/clean svejedno ponovo cita
 * sessions.unlocked_at iz baze pre nego sto posalje ijedan bajt.
 */

const TOKEN_SECRET = requireSecret("TOKEN_SECRET");

/** Derivati. Original (sledeci pass) dobija znatno kraci TTL. */
export const TOKEN_TTL_SECONDS = 30 * 60;

/** Prag ispod kog /status vraca svez token, da grid ne pukne usred gledanja. */
export const TOKEN_REFRESH_BELOW_SECONDS = 10 * 60;

export type AccessLevel = "wm" | "clean";

export type TokenPayload = {
  v: 1;
  sid: string;
  lvl: AccessLevel;
  /** Prefiks putanje koji ovaj token pokriva. */
  path: string;
  /** Unix sekunde. */
  exp: number;
};

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 16) {
    throw new Error(
      `${name} nije postavljen (ili je kraci od 16 znakova). Pogledaj .env.`,
    );
  }
  return value;
}

export function mediaBase(sessionId: string, level: AccessLevel): string {
  return `/api/media/${level}/${sessionId}`;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(body: string): string {
  return b64url(createHmac("sha256", TOKEN_SECRET).update(body).digest());
}

export function mintToken(sessionId: string, level: AccessLevel): string {
  const payload: TokenPayload = {
    v: 1,
    sid: sessionId,
    lvl: level,
    path: `${mediaBase(sessionId, level)}/`,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${body}.${sign(body)}`;
}

/** Potpis i rok. Ne govori nista o tome sta token sme da otvori. */
export function parseToken(token: string | null): TokenPayload | null {
  if (!token) return null;

  const dot = token.indexOf(".");
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = sign(body);

  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }

  if (payload.v !== 1) return null;
  if (payload.lvl !== "wm" && payload.lvl !== "clean") return null;
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
  if (!payload.path || !payload.sid) return null;

  return payload;
}

/**
 * Vraca payload samo ako potpis, rok i PUTANJA prolaze.
 * `requestPath` je stvarna putanja zahteva — token vazi iskljucivo za svoj
 * prefiks, pa wm token ne moze da otvori clean rutu ni za jednu sliku.
 */
export function verifyToken(token: string | null, requestPath: string): TokenPayload | null {
  const payload = parseToken(token);
  if (!payload) return null;
  if (!requestPath.startsWith(payload.path)) return null;
  return payload;
}

/** Za API rute koje nisu media: dovoljno je da token pripada ovoj sesiji. */
export function verifySessionToken(token: string | null, sessionId: string): TokenPayload | null {
  const payload = parseToken(token);
  if (!payload || payload.sid !== sessionId) return null;
  return payload;
}

/** Token stize kao `Authorization: Bearer …` ili kao `?t=` na media URL-u. */
export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return new URL(req.url).searchParams.get("t");
}

export function secondsLeft(payload: TokenPayload): number {
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}
