"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangContext";
import { attemptsPhrase, formatPrice } from "@/lib/i18n";
import { submitCode, type Grant } from "@/lib/client";
import { CODE_LENGTH } from "@/lib/codeFormat";
import type { PublicSession } from "@/lib/session";

type Props = {
  session: PublicSession;
  /** Kod sa kartice — operater ga trazi da nadje termin u adminu. */
  code: string;
  onClose: () => void;
  onUnlocked: (grant: Grant) => void;
};

/**
 * Panel sa cijenom i uputstvom za placanje gotovinom.
 *
 * Prototip je ovdje imao dugme "Potvrdi i otkljucaj" koje sam korisnik klikne.
 * Toga nema: klijent ne moze da promijeni nivo pristupa. Ostaju dva puta —
 * operater naplati i klikne u adminu (galerija se otkljuca kroz polling),
 * ili, ako nema signal, izdiktira unlock kod koji se unosi ovdje.
 */
export function UnlockPanel({ session, code, onClose, onUnlocked }: Props) {
  const { t, lang } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [unlockCode, setUnlockCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submitUnlock() {
    if (busy || unlockCode.length !== CODE_LENGTH) return;
    setBusy(true);
    setErr(null);

    const out = await submitCode(unlockCode);
    setBusy(false);

    if (out.kind === "ok") {
      // Unlock kod druge grupe ne smije da otvori ovu galeriju.
      if (out.grant.sessionId !== session.id || !out.grant.unlocked) {
        setErr(t("errNotFound"));
        return;
      }
      onUnlocked(out.grant);
      return;
    }
    if (out.kind === "limited") setErr(t("errRateLimited"));
    else if (out.kind === "offline") setErr(t("errNetwork"));
    else if (out.kind === "gone") setErr(t("expiredTitle"));
    else setErr(`${t("errNotFound")} · ${attemptsPhrase(lang, out.attemptsLeft)}`);
  }

  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={t("buyTitle")}>
      <button type="button" className="scrim" onClick={onClose} aria-label={t("close")} />

      <div className="sheet">
        <div className="sheet-head">
          <span className="kicker">{t("payLabel")}</span>
          <button type="button" className="x" onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        </div>

        <div className="cols">
          <section className="col col-info">
            <h2 className="display">{t("buyTitle")}</h2>
            <span className="mono meta">
              {session.label} · {session.photoCount} {t("photos")}
            </span>

            <div className="price-row">
              <span className="price-label">{t("buyPriceLabel")}</span>
              <span className="display price">{formatPrice(session.price, session.currency)}</span>
            </div>

            <ul className="items">
              <li>{t("buyItem1")}</li>
              <li>{t("buyItem2")}</li>
              <li>{t("buyItem3")}</li>
              <li>{t("buyItem4")}</li>
            </ul>

            <span className="mono foot">{t("buyFoot")}</span>
          </section>

          <section className="col col-pay">
            <div className="cash">
              <span className="cash-title">{t("payCash")}</span>
              <span className="cash-body">{t("payCashBody")}</span>
            </div>

            <div className="steps">
              <span className="steps-title">{t("cashStepsTitle")}</span>
              <ol>
                <li>{t("cashStep1")}</li>
                <li>{t("cashStep2")}</li>
                <li>{t("cashStep3")}</li>
              </ol>
            </div>

            <div className="code-card">
              <span className="mono">{t("yourCode")}</span>
              <span className="display code">{code}</span>
            </div>

            <div className="waiting">
              <span className="dot" aria-hidden="true" />
              <span>
                <span className="waiting-title">{t("waitingForOperator")}</span>
                <span className="waiting-hint">{t("waitingHint")}</span>
              </span>
            </div>

            <details className="fallback">
              <summary>{t("unlockCodeLabel")}</summary>
              <p className="fallback-hint">{t("unlockCodeHint")}</p>
              <div className="fallback-row">
                <input
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={CODE_LENGTH}
                  placeholder="········"
                  value={unlockCode}
                  onChange={(e) => {
                    setUnlockCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, CODE_LENGTH),
                    );
                    if (err) setErr(null);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-dark"
                  disabled={busy || unlockCode.length !== CODE_LENGTH}
                  onClick={() => void submitUnlock()}
                >
                  {busy ? t("codeChecking") : t("unlockCodeCta")}
                </button>
              </div>
              {err && (
                <span className="err" role="alert">
                  {err}
                </span>
              )}
            </details>

            <div className="card-soon">
              <span className="card-soon-title">{t("payCard")}</span>
              <span className="card-soon-body">{t("payCardBody")}</span>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .sheet-wrap {
          position: fixed;
          inset: 0;
          z-index: 70;
        }
        .scrim {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(11, 10, 9, 0.5);
          animation: gdFade 0.25s ease both;
        }
        .sheet {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          overflow-y: auto;
          animation: gdUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .sheet-head {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg);
          border-bottom: 1px solid var(--line);
        }
        .x {
          min-width: 48px;
          min-height: 48px;
          border: 1px solid rgba(18, 17, 15, 0.28);
          border-radius: 999px;
          background: transparent;
          font-size: 20px;
          line-height: 1;
        }
        .cols {
          display: flex;
          flex-direction: column;
        }
        .col {
          padding: 22px 16px;
        }
        h2 {
          margin: 0;
          font-size: 34px;
          line-height: 0.95;
        }
        .meta {
          display: block;
          margin-top: 6px;
        }
        .price-row {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(18, 17, 15, 0.18);
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 14px;
        }
        .price-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .price {
          font-size: 40px;
          line-height: 1;
        }
        .items {
          margin: 18px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 10px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--body);
        }
        .items :global(li) {
          padding-left: 18px;
          position: relative;
        }
        .items :global(li)::before {
          content: "·";
          position: absolute;
          left: 4px;
          color: var(--red);
          font-weight: 700;
        }
        .foot {
          display: block;
          margin-top: 20px;
        }

        .col-pay {
          background: var(--panel-2);
          border-top: 1px solid var(--line);
        }
        .cash {
          display: grid;
          gap: 5px;
          padding: 16px 18px;
          border-radius: 14px;
          background: var(--ink);
          color: var(--bg);
        }
        .cash-title {
          font-size: 15px;
          font-weight: 600;
        }
        .cash-body {
          font-size: 13px;
          line-height: 1.45;
          color: rgba(245, 243, 238, 0.75);
        }
        .steps {
          margin-top: 18px;
        }
        .steps-title {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .steps :global(ol) {
          margin: 10px 0 0;
          padding-left: 20px;
          display: grid;
          gap: 8px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--body);
        }
        .code-card {
          margin-top: 18px;
          padding: 14px 16px;
          border: 1px dashed var(--line-strong);
          border-radius: 14px;
          display: grid;
          gap: 6px;
          background: var(--field);
        }
        .code {
          font-size: 34px;
          line-height: 1;
          letter-spacing: 0.16em;
        }
        .waiting {
          margin-top: 18px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .dot {
          flex: 0 0 auto;
          margin-top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--red);
          animation: gdPulse 1.6s ease-in-out infinite;
        }
        .waiting-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
        }
        .waiting-hint {
          display: block;
          margin-top: 3px;
          font-size: 13px;
          line-height: 1.45;
          color: var(--muted);
        }
        .fallback {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }
        .fallback :global(summary) {
          min-height: var(--tap);
          display: flex;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
          cursor: pointer;
        }
        .fallback-hint {
          margin: 0 0 12px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--body);
        }
        .fallback-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fallback-row :global(input) {
          width: 100%;
          min-height: 56px;
          padding: 0 16px;
          border: 1.5px solid var(--line-strong);
          border-radius: 12px;
          background: var(--field);
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 800;
          font-size: 26px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          outline: none;
        }
        .fallback-row :global(input:focus) {
          border-color: var(--red);
        }
        .fallback-row :global(.btn) {
          min-height: 56px;
          border-radius: 12px;
        }
        .err {
          display: block;
          margin-top: 10px;
          font-size: 13.5px;
          color: var(--red-deep);
        }
        .card-soon {
          margin-top: 20px;
          display: grid;
          gap: 5px;
          padding: 14px 16px;
          border: 1px dashed rgba(18, 17, 15, 0.3);
          border-radius: 14px;
        }
        .card-soon-title {
          font-size: 15px;
          font-weight: 600;
          color: rgba(18, 17, 15, 0.5);
        }
        .card-soon-body {
          font-size: 13px;
          line-height: 1.45;
          color: rgba(18, 17, 15, 0.45);
        }

        @media (min-width: 900px) {
          .sheet {
            inset: auto;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: min(880px, calc(100% - 64px));
            max-height: calc(100% - 64px);
            border-radius: 20px;
            overflow: hidden;
            /* gdUp zavrsava na transform: translateY(0) i sa fill-mode: both
               trajno pregazi centriranje — animacija bije obicnu deklaraciju.
               gdModal nosi translate(-50%,-50%) kroz cijeli keyframe. */
            animation: gdModal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          .sheet-head {
            position: absolute;
            top: 0;
            right: 0;
            left: auto;
            padding: 18px 22px;
            background: transparent;
            border-bottom: 0;
          }
          .sheet-head :global(.kicker) {
            display: none;
          }
          .cols {
            flex-direction: row;
            overflow-y: auto;
          }
          .col {
            flex: 1 1 50%;
            padding: 32px 30px;
          }
          .col-pay {
            border-top: 0;
            border-left: 1px solid var(--line);
            padding-top: 72px;
          }
          .fallback-row {
            flex-direction: row;
          }
          .fallback-row :global(input) {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
