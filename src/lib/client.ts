"use client";

import type { PublicSession } from "@/lib/session";

/**
 * Dozvola koju je server izdao za jednu sesiju.
 *
 * Zivi u sessionStorage, ne u URL-u i ne u localStorage: token treba da
 * nestane kad se kartica zatvori, a ne da ostane na tudjem telefonu.
 */
export type Grant = {
  sessionId: string;
  token: string;
  mediaBase: string;
  unlocked: boolean;
  session: PublicSession;
  /** Kod sa kartice — panel za placanje ga pokazuje operateru. */
  code: string;
};

const key = (sessionId: string) => `sm.grant.${sessionId}`;

export function saveGrant(g: Grant): void {
  try {
    window.sessionStorage.setItem(key(g.sessionId), JSON.stringify(g));
  } catch {
    /* private mode — galerija i dalje radi do reloada */
  }
}

export function loadGrant(sessionId: string): Grant | null {
  try {
    const raw = window.sessionStorage.getItem(key(sessionId));
    return raw ? (JSON.parse(raw) as Grant) : null;
  } catch {
    return null;
  }
}

export function clearGrant(sessionId: string): void {
  try {
    window.sessionStorage.removeItem(key(sessionId));
  } catch {
    /* nista */
  }
}

/* ---------------------------------------------------------------- access */

export type AccessOutcome =
  | { kind: "ok"; grant: Grant }
  | { kind: "denied"; reason: "not_found" | "malformed"; attemptsLeft: number }
  | { kind: "limited"; retryAfter: number }
  | { kind: "gone"; reason: "expired" | "archived" }
  | { kind: "offline" };

export async function submitCode(code: string): Promise<AccessOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { kind: "offline" };
  }

  if (res.ok) {
    const data = (await res.json()) as {
      sessionId: string;
      token: string;
      mediaBase: string;
      unlocked: boolean;
      session: PublicSession;
    };
    const grant: Grant = { ...data, code: code.toUpperCase() };
    saveGrant(grant);
    return { kind: "ok", grant };
  }

  if (res.status === 410) {
    const data = (await res.json().catch(() => ({}))) as { reason?: string };
    return { kind: "gone", reason: data.reason === "archived" ? "archived" : "expired" };
  }

  if (res.status === 429) {
    const data = (await res.json().catch(() => ({}))) as { retryAfter?: number };
    return { kind: "limited", retryAfter: data.retryAfter ?? 900 };
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    attemptsLeft?: number;
  };
  return {
    kind: "denied",
    reason: data.error === "malformed" ? "malformed" : "not_found",
    attemptsLeft: data.attemptsLeft ?? 0,
  };
}

/* ---------------------------------------------------------------- photos */

export type PhotoRef = { id: string; w: number; h: number; takenAt: string };

export type PhotoPage = { photos: PhotoRef[]; nextCursor: string | null };

export class OfflineError extends Error {}
export class GoneError extends Error {
  constructor(public reason: "expired" | "archived") {
    super(reason);
  }
}

export async function fetchPhotos(
  sessionId: string,
  token: string,
  cursor: string | null,
  limit = 60,
): Promise<PhotoPage> {
  const url = new URL(`/api/sessions/${sessionId}/photos`, window.location.origin);
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new OfflineError("offline");
  }

  if (res.status === 410) {
    const data = (await res.json().catch(() => ({}))) as { reason?: string };
    throw new GoneError(data.reason === "archived" ? "archived" : "expired");
  }
  if (!res.ok) throw new Error(`photos ${res.status}`);

  return (await res.json()) as PhotoPage;
}

/* ---------------------------------------------------------------- status */

export type StatusOutcome =
  | { kind: "ok"; unlocked: boolean; token?: string; mediaBase?: string }
  | { kind: "gone"; reason: "expired" | "archived" }
  | { kind: "offline" };

export async function fetchStatus(sessionId: string, token: string): Promise<StatusOutcome> {
  let res: Response;
  try {
    res = await fetch(`/api/sessions/${sessionId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { kind: "offline" };
  }

  if (res.status === 410) {
    const data = (await res.json().catch(() => ({}))) as { reason?: string };
    return { kind: "gone", reason: data.reason === "archived" ? "archived" : "expired" };
  }
  if (!res.ok) return { kind: "offline" };

  const data = (await res.json()) as { unlocked: boolean; token?: string; mediaBase?: string };
  return { kind: "ok", ...data };
}

/* ----------------------------------------------------------------- media */

/**
 * Klijent sastavlja URL iz base + token. Jedan token za cijelu sesiju —
 * ne poziva se server po slici da bi se dobio potpis.
 */
export function photoUrl(grant: Grant, photoId: string, width: number): string {
  return `${grant.mediaBase}/${photoId}?w=${width}&t=${encodeURIComponent(grant.token)}`;
}
