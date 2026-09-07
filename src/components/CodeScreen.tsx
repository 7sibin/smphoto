"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangContext";
import { BlockedScreen } from "@/components/BlockedScreen";
import { TodayFeed } from "@/components/TodayFeed";
import { attemptsPhrase } from "@/lib/i18n";
import { submitCode, type AccessOutcome } from "@/lib/client";
import { CODE_LENGTH } from "@/lib/codeFormat";

type ErrState =
  | { kind: "denied"; reason: "not_found" | "malformed"; attemptsLeft: number }
  | { kind: "limited" }
  | { kind: "offline" }
  | null;

export function CodeScreen({ initialCode = "" }: { initialCode?: string }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState(initialCode.toUpperCase().slice(0, CODE_LENGTH));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ErrState>(null);
  const [gone, setGone] = useState<"expired" | "archived" | null>(null);

  const run = useCallback(
    async (value: string) => {
      if (busy) return;
      setBusy(true);
      setErr(null);

      const out: AccessOutcome = await submitCode(value);

      if (out.kind === "ok") {
        // Grant je vec u sessionStorage; galerija ga tamo nalazi.
        router.push(`/s/${out.grant.sessionId}`);
        return;
      }

      setBusy(false);
      if (out.kind === "gone") setGone(out.reason);
      else if (out.kind === "limited") setErr({ kind: "limited" });
      else if (out.kind === "offline") setErr({ kind: "offline" });
      else setErr({ kind: "denied", reason: out.reason, attemptsLeft: out.attemptsLeft });
    },
    [busy, router],
  );

  // QR deep link: /g/K7XM4Q2P popunjava kod unaprijed i salje ga sam.
  const autoFired = useRef(false);
  useEffect(() => {
    if (autoFired.current) return;
    if (initialCode.length !== CODE_LENGTH) return;
    autoFired.current = true;
    void run(initialCode.toUpperCase());
  }, [initialCode, run]);

  if (gone) return <BlockedScreen reason={gone} />;

  const ready = code.length === CODE_LENGTH;

  return (
    <div className="screen">
      <section className="pane">
        <span className="kicker">{t("codeKicker")}</span>
        <h1 className="display">
          {t("codeTitleA")}
          <br />
          {t("codeTitleB")}
        </h1>
        <p className="body">{t("codeBody")}</p>

        <form
          className="entry"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) void run(code);
          }}
        >
          <label className="field">
            <span className="field-label">{t("codeLabel")}</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={CODE_LENGTH}
              placeholder="K7XM4Q2P"
              value={code}
              aria-invalid={err?.kind === "denied"}
              onChange={(e) => {
                const next = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, CODE_LENGTH);
                setCode(next);
                if (err) setErr(null);
              }}
            />
          </label>
          <button type="submit" className="btn btn-primary cta" disabled={!ready || busy}>
            {busy ? t("codeChecking") : t("codeCta")}
          </button>
        </form>

        {err && (
          <div className="err" role="alert">
            <span className="err-text">
              {err.kind === "limited"
                ? t("errRateLimited")
                : err.kind === "offline"
                  ? t("errNetwork")
                  : t(err.reason === "malformed" ? "errMalformed" : "errNotFound")}
            </span>
            {err.kind === "denied" && (
              <span className="err-meta">{attemptsPhrase(lang, err.attemptsLeft)}</span>
            )}
            {err.kind === "offline" && (
              <button type="button" className="btn btn-ghost retry" onClick={() => void run(code)}>
                {t("retry")}
              </button>
            )}
          </div>
        )}

        <div className="alt">
          <span>{t("noCode")}</span>
          <Link className="btn btn-ghost" href="/dani">
            {t("byDateCta")}
          </Link>
        </div>
      </section>

      <TodayFeed />

      <style jsx>{`
        .screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          animation: gdFade 0.3s ease both;
        }
        .pane {
          padding: 28px var(--gutter) 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        h1 {
          margin: 12px 0 0;
          font-size: clamp(40px, 13vw, 70px);
          line-height: 0.88;
        }
        .body {
          margin: 16px 0 0;
          max-width: 46ch;
          font-size: 16px;
          line-height: 1.6;
          color: var(--body);
          text-wrap: pretty;
        }
        .entry {
          margin-top: 26px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .field {
          display: grid;
          gap: 10px;
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
          height: 68px;
          padding: 0 16px;
          border: 1.5px solid var(--line-strong);
          border-radius: 14px;
          background: var(--field);
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 800;
          font-size: 34px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          outline: none;
        }
        .field :global(input:focus) {
          border-color: var(--red);
        }
        .cta {
          height: 62px;
          border-radius: 14px;
          font-size: 12px;
          letter-spacing: 0.18em;
        }
        .err {
          margin-top: 16px;
          max-width: 520px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(193, 39, 45, 0.1);
          border: 1px solid rgba(193, 39, 45, 0.35);
          animation: gdUp 0.25s ease both;
        }
        .err-text {
          display: block;
          font-size: 14px;
          line-height: 1.5;
          color: var(--red-deep);
        }
        .err-meta {
          display: block;
          margin-top: 5px;
          font-family: ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(143, 31, 36, 0.75);
        }
        .retry {
          margin-top: 12px;
          border-color: rgba(143, 31, 36, 0.4);
          color: var(--red-deep);
        }
        .alt {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
          font-size: 14px;
          color: var(--body);
        }

        /* Tablet: jos uvijek jedna kolona, ali polje za osam znakova ne
           smije da bude siroko 700px. Kolona sadrzaja staje, rub raste. */
        @media (min-width: 600px) and (max-width: 899.98px) {
          .pane {
            padding-block: 44px 48px;
          }
          .entry {
            width: min(100%, 420px);
          }
        }

        @media (min-width: 900px) {
          .screen {
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(380px, 0.85fr);
            /* Bez ovoga feed na 2560px dobije 1100px sirine praznog reda. */
            width: 100%;
            max-width: var(--content);
            margin-inline: auto;
          }
          .pane {
            padding: 44px 56px;
            overflow-y: auto;
          }
          /* Dok .screen jos nije skupljen, panel nosi svojih 56px i naslov
             stoji 16px uvucen od loga — tako je u dizajnu. Kad ekran predje
             --content pa se .screen pocne centrirati, ta uvlaka se oduzima
             od inseta koji je vec dosao spolja, i na kraju padne na nulu.
             Naslov tada sjedi tacno ispod loga. Racuna se u vw jer mjeri
             isto sto i --edge u headeru: sirinu stranice, ne panela. */
          .pane {
            padding-left: max(0px, 56px - max(0px, (100vw - var(--content)) / 2));
          }
          .entry {
            margin-top: 34px;
            flex-direction: row;
            align-items: flex-end;
            gap: 14px;
            flex-wrap: wrap;
          }
          .field :global(input) {
            width: 340px;
            height: 70px;
            font-size: 36px;
          }
          .cta {
            height: 70px;
            padding: 0 34px;
          }
          .alt {
            flex-direction: row;
            align-items: center;
            gap: 20px;
            margin-top: 26px;
          }
        }
      `}</style>
    </div>
  );
}
