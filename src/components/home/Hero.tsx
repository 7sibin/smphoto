"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangContext";
import { submitCode, type AccessOutcome } from "@/lib/client";
import { attemptsPhrase } from "@/lib/i18n";
import { CODE_LENGTH } from "@/lib/codeFormat";

type Note = { text: string; bad: boolean } | null;

/**
 * Hero sa naslovne. Polje za kod je isti ulaz kao /kod, samo skraceno —
 * bez feed-a i bez brojaca pokusaja, jer ovdje nema mjesta. Provjeru i dalje
 * radi /api/access; nivo pristupa odredjuje server, ovdje se samo prikazuje
 * sta je server rekao.
 */
export function Hero() {
  const { t, lang } = useLang();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  const ready = code.length === CODE_LENGTH;

  const run = useCallback(
    async (value: string) => {
      if (busy) return;
      setBusy(true);
      setNote(null);

      const out: AccessOutcome = await submitCode(value);

      if (out.kind === "ok") {
        router.push(`/s/${out.grant.sessionId}`);
        return;
      }

      setBusy(false);
      if (out.kind === "gone") {
        setNote({ text: t(out.reason === "expired" ? "expiredTitle" : "archivedTitle"), bad: true });
      } else if (out.kind === "limited") {
        setNote({ text: t("errRateLimited"), bad: true });
      } else if (out.kind === "offline") {
        setNote({ text: t("errNetwork"), bad: true });
      } else {
        const head = t(out.reason === "malformed" ? "errMalformed" : "errNotFound");
        setNote({ text: `${head} ${attemptsPhrase(lang, out.attemptsLeft)}`, bad: true });
      }
    },
    [busy, lang, router, t],
  );

  return (
    <section className="hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="shot" src="/1.webp" alt="" fetchPriority="high" />
      <span className="veil" aria-hidden="true" />

      <div className="body">
        <div className="kicker-row">
          <span className="live">
            <span className="dot" aria-hidden="true" />
            {t("heroKicker")}
          </span>
          <span className="hair" aria-hidden="true" />
          <span>{t("heroPlace")}</span>
        </div>

        <h1 className="display title">
          <span className="line">
            <span className="line-in">{t("heroTitleA")}</span>
          </span>
          <span className="line">
            <span className="line-in line-in-2">{t("heroTitleB")}</span>
          </span>
        </h1>

        <form
          className="entry"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) void run(code);
          }}
        >
          <label className="label" htmlFor="hero-code">
            {t("heroCodeLabel")}
          </label>
          <div className="field">
            <input
              id="hero-code"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={CODE_LENGTH}
              placeholder="K7XM4Q2P"
              value={code}
              aria-invalid={note?.bad || undefined}
              onChange={(e) => {
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, CODE_LENGTH),
                );
                if (note) setNote(null);
              }}
            />
            <button type="submit" className="go" disabled={!ready || busy}>
              {busy ? t("codeChecking") : t("codeCta")}
            </button>
          </div>

          <p className={note?.bad ? "note note-bad" : "note"} role={note ? "alert" : undefined}>
            {note ? note.text : t("heroNote")}
          </p>

          <Link className="full" href="/kod">
            {t("heroFull")} →
          </Link>
        </form>
      </div>

      <style jsx>{`
        .hero {
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          background: var(--night);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .shot {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .veil {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(18, 17, 15, 0.66) 0,
            rgba(18, 17, 15, 0.34) 26%,
            rgba(18, 17, 15, 0.66) 58%,
            rgba(18, 17, 15, 0.93) 100%
          );
        }
        .body {
          position: relative;
          padding: 96px var(--edge) calc(28px + env(safe-area-inset-bottom));
          display: grid;
          gap: 20px;
          background: linear-gradient(
            180deg,
            rgba(18, 17, 15, 0) 0,
            rgba(18, 17, 15, 0.88) 34%,
            rgba(18, 17, 15, 0.94) 100%
          );
          color: var(--bg);
        }

        .kicker-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          animation: gdFade 0.9s ease 0.2s both;
        }
        .live {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dot {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--red);
        }
        .hair {
          display: block;
          width: 34px;
          height: 1px;
          background: rgba(245, 243, 238, 0.5);
        }

        .title {
          margin: 0;
          max-width: 15ch;
          font-size: clamp(40px, 9vw, 92px);
          line-height: 0.86;
        }
        /* Redovi ulaze odozdo iza maske — zato .line nosi overflow, a padding
           i negativna margina vracaju prostor koji bi maska odsjekla slovima
           sa kukom (Č, ž) i dijakriticima. */
        .line {
          display: block;
          overflow: hidden;
          padding: 0.2em 0 0.3em;
          margin: -0.2em 0 -0.3em;
        }
        .line-in {
          display: block;
          animation: gdRise 1s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }
        .line-in-2 {
          animation-delay: 0.24s;
        }

        .entry {
          display: grid;
          gap: 14px;
          max-width: 560px;
          animation: gdFade 1s ease 0.5s both;
        }
        .label {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .field {
          display: grid;
          gap: 12px;
        }
        .field input {
          width: 100%;
          min-height: var(--tap);
          padding: 8px 0;
          border: 0;
          border-bottom: 1px solid rgba(245, 243, 238, 0.55);
          background: transparent;
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 800;
          font-size: 30px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--bg);
          outline: none;
        }
        .field input::placeholder {
          color: rgba(245, 243, 238, 0.4);
        }
        .field input:focus {
          border-bottom-color: var(--red);
        }
        .go {
          justify-self: start;
          min-height: 52px;
          padding: 0 26px;
          border: 1px solid var(--red);
          border-radius: 999px;
          background: var(--red);
          color: var(--bg);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
        }
        .go:not(:disabled):hover {
          background: var(--bg);
          border-color: var(--bg);
          color: var(--ink);
        }
        .go:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .note {
          margin: 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10.5px;
          line-height: 1.6;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(245, 243, 238, 0.75);
        }
        .note-bad {
          color: #f3a3a6;
        }
        /* .full sjedi na <Link> — vidi komentar u SiteNav.tsx. */
        .entry :global(.full) {
          display: inline-flex;
          align-items: center;
          justify-self: start;
          min-height: var(--tap);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(245, 243, 238, 0.7);
          border-bottom: 1px solid rgba(245, 243, 238, 0.35);
        }
        .entry :global(.full):hover {
          color: var(--bg);
          border-bottom-color: var(--red);
        }

        @media (min-width: 700px) {
          .body {
            padding-top: 120px;
            padding-bottom: calc(7vh + env(safe-area-inset-bottom));
            gap: 24px;
          }
          .field {
            display: flex;
            align-items: flex-end;
            gap: 18px;
            border-bottom: 1px solid rgba(245, 243, 238, 0.55);
          }
          .field input {
            flex: 1;
            min-width: 0;
            border-bottom: 0;
            font-size: 34px;
          }
          .field input:focus {
            border-bottom-color: transparent;
          }
          .go {
            margin-bottom: 10px;
          }
          .note {
            font-size: 11px;
          }
        }

        /* Telefon u landscape-u: 100svh je 375px, hero mora da stane u to. */
        @media (orientation: landscape) and (max-height: 520px) {
          .body {
            padding-top: 72px;
          }
          .title {
            font-size: 34px;
          }
          .entry :global(.full) {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
