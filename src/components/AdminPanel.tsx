"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { formatDate, formatPrice } from "@/lib/i18n";

type Row = {
  id: string;
  label: string;
  eventName: string;
  eventDate: string;
  location: string;
  price: number;
  currency: string;
  photoCount: number;
  unlocked: boolean;
  unlockedAt: string | null;
  unlockedBy: string | null;
  state: "ok" | "expired" | "archived";
};

const TOKEN_KEY = "sm.admin.token";
const OP_KEY = "sm.admin.operator";

/**
 * Panel operatera. Naplata je gotovinska i van softvera — ovdje se samo
 * evidentira: red u orders i unlocked_by, u istoj transakciji.
 *
 * Nema korisnickih naloga, pa je pristup zasticen deljenim ADMIN_TOKEN-om
 * iz .env-a. Pravi nalozi operatera dolaze kad se admin bude gradio.
 */
export function AdminPanel() {
  const [token, setToken] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  /**
   * Redni broj zahtjeva. Odgovor koji stigne poslije novijeg se odbacuje —
   * inace zakasnjeli 401 pregazi listu koju je noviji zahtjev vec ucitao.
   */
  const reqId = useRef(0);

  const load = useCallback(async (tok: string) => {
    const moj = ++reqId.current;
    const zastario = () => moj !== reqId.current;

    setErr(null);
    try {
      const res = await fetch("/api/admin/sessions", {
        headers: { Authorization: `Bearer ${tok}` },
        cache: "no-store",
      });
      if (zastario()) return;
      if (res.status === 401) {
        setErr("Pogrešan admin token.");
        return;
      }
      if (!res.ok) throw new Error("load");
      const data = (await res.json()) as { sessions: Row[] };
      if (zastario()) return;
      setRows(data.sessions);
      try {
        window.sessionStorage.setItem(TOKEN_KEY, tok);
      } catch {
        /* private mode */
      }
    } catch {
      if (zastario()) return;
      setErr("Nema veze sa serverom.");
    }
  }, []);

  useEffect(() => {
    let savedToken = "";
    try {
      savedToken = window.sessionStorage.getItem(TOKEN_KEY) ?? "";
      const savedOp = window.localStorage.getItem(OP_KEY) ?? "";
      if (savedToken) setToken(savedToken);
      if (savedOp) setOperatorId(savedOp);
    } catch {
      /* private mode */
    }

    // Samo za token vracen iz storage-a. Kucanje NE smije da okida ucitavanje:
    // token ima 64 znaka, pa je to 64 zahtjeva u bazu, svaki 401 jer je prefiks.
    // Operater pokrece ucitavanje dugmetom.
    if (savedToken) void load(savedToken);
  }, [load]);

  async function unlock(row: Row) {
    if (!operatorId.trim()) {
      setErr("Upišite ID operatera.");
      return;
    }
    setPending(row.id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/sessions/${row.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: row.price, operatorId: operatorId.trim() }),
      });
      if (!res.ok) {
        setErr(`Otključavanje nije prošlo (${res.status}).`);
        return;
      }
      try {
        window.localStorage.setItem(OP_KEY, operatorId.trim());
      } catch {
        /* private mode */
      }
      await load(token);
    } catch {
      setErr("Nema veze sa serverom.");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="page">
      <SiteNav help narrow tagline="appName" />

      <div className="head">
        <h1 className="display">Admin — naplata</h1>
        <p>
          Naplati gotovinu, pa klikni <strong>Naplaćeno</strong>. Galerija se otključava svima
          koji imaju kod te grupe, kroz polling, u roku od par sekundi.
        </p>
      </div>

      <div className="auth">
        <label className="field">
          <span className="field-label">Admin token</span>
          <input
            type="password"
            value={token}
            placeholder="ADMIN_TOKEN iz .env"
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">ID operatera</span>
          <input
            type="text"
            value={operatorId}
            placeholder="op-marko"
            onChange={(e) => setOperatorId(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn-dark" onClick={() => void load(token)}>
          Učitaj
        </button>
      </div>

      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}

      <div className="list">
        {rows?.map((r) => (
          <div className="row" key={r.id}>
            <div className="row-main">
              <span className="row-label">{r.label}</span>
              <span className="mono">
                {formatDate(r.eventDate)} · {r.eventName} · {r.photoCount} slika
              </span>
              <span className="mono">
                {formatPrice(r.price, r.currency)}
                {r.state !== "ok" ? ` · ${r.state}` : ""}
                {r.unlocked && r.unlockedBy ? ` · otključao ${r.unlockedBy}` : ""}
              </span>
            </div>
            {r.unlocked ? (
              <span className="done">Naplaćeno</span>
            ) : (
              <button
                type="button"
                className="btn btn-primary pay"
                disabled={pending === r.id || r.state !== "ok"}
                onClick={() => void unlock(r)}
              >
                {pending === r.id ? "…" : "Naplaćeno"}
              </button>
            )}
          </div>
        ))}
        {rows?.length === 0 && <p className="mono">Nema sesija. Pokreni seed.</p>}
      </div>

      <style jsx>{`
        .page {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
        }
        .head {
          padding: 20px var(--edge-narrow) 8px;
        }
        h1 {
          margin: 0;
          font-size: 34px;
        }
        p {
          margin: 10px 0 0;
          max-width: 60ch;
          font-size: 14px;
          line-height: 1.55;
          color: var(--body);
        }
        .auth {
          display: grid;
          gap: 12px;
          padding: 16px var(--edge-narrow);
          border-bottom: 1px solid var(--line);
        }
        .field {
          display: grid;
          gap: 8px;
        }
        .field-label {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .field :global(input) {
          width: 100%;
          min-height: var(--tap);
          padding: 0 14px;
          border: 1.5px solid var(--line-strong);
          border-radius: 12px;
          background: var(--field);
          font-size: 16px;
          outline: none;
        }
        .err {
          margin: 12px var(--edge-narrow) 0;
          color: var(--red-deep);
        }
        .list {
          padding: 12px var(--edge-narrow) 60px;
          display: grid;
          gap: 10px;
        }
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--field);
          flex-wrap: wrap;
        }
        .row-main {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .row-label {
          font-size: 16px;
          font-weight: 600;
        }
        .pay {
          min-height: var(--tap);
        }
        .done {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }

        @media (min-width: 700px) {
          .head {
            padding-block: 30px 10px;
          }
          .auth {
            grid-template-columns: 1fr 1fr auto;
            align-items: end;
            padding-block: 16px;
          }
          .auth :global(.btn) {
            min-height: 48px;
          }
          .list {
            padding-block: 16px 60px;
          }
          .err {
            margin-block: 12px 0;
          }
        }
      `}</style>
    </main>
  );
}
