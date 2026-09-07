"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangContext";

type Props = {
  kind: "web" | "full";
  photoCount: number;
  onClose: () => void;
};

/**
 * Ekran "pravimo vaš ZIP" iz dizajna.
 *
 * U ovom prolazu je mock — nema storage-a iz kog bi se paket pakovao. Napredak
 * je tajmer, i to pise na dnu panela da niko ne pomisli da fajl stvarno stize.
 */
export function ZipModal({ kind, photoCount, onClose }: Props) {
  const { t } = useLang();
  const [pct, setPct] = useState(8);
  const [mail, setMail] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          if (timer.current) clearInterval(timer.current);
          return 100;
        }
        return Math.min(100, p + 3);
      });
    }, 700);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="wrap" role="dialog" aria-modal="true">
      <button type="button" className="scrim" onClick={onClose} aria-label={t("close")} />

      <div className="card">
        <div className="head">
          <span className="spin" aria-hidden="true" />
          <span className="display title">{t("zipTitle")}</span>
        </div>

        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="stat">
          <span className="mono">
            {Math.round((photoCount * pct) / 100)} / {photoCount} {t("photos")}
          </span>
          <span className="mono">
            {pct}% · {t(kind === "web" ? "zipWeb" : "zipFull")}
          </span>
        </div>

        <p className="body">{t("zipBody")}</p>

        <div className="mailrow">
          <label className="field">
            <span className="field-label">{t("zipMailLabel")}</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ime@mail.com"
              value={mail}
              onChange={(e) => {
                setMail(e.target.value);
                if (note) setNote(null);
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-dark save"
            onClick={() => {
              const v = mail.trim();
              if (!v.includes("@") || v.length < 5) {
                setNote({ ok: false, text: t("zipMailBad") });
                return;
              }
              setNote({ ok: true, text: `${t("zipSave")} → ${v}` });
            }}
          >
            {t("zipSave")}
          </button>
        </div>

        {note && (
          <span className="note" data-bad={note.ok ? undefined : "1"}>
            {note.text}
          </span>
        )}

        <span className="mock mono">{t("zipMock")}</span>

        <button type="button" className="btn btn-ghost close" onClick={onClose}>
          {t("close")}
        </button>
      </div>

      <style jsx>{`
        .wrap {
          position: fixed;
          inset: 0;
          z-index: 80;
        }
        .scrim {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(11, 10, 9, 0.5);
          animation: gdFade 0.25s ease both;
        }
        .card {
          position: absolute;
          /* Bez transforma za centriranje — gdUp bi ga pregazio. */
          left: 0;
          right: 0;
          bottom: 0;
          margin: 0 auto;
          width: 100%;
          max-height: 92%;
          overflow-y: auto;
          padding: 22px 16px calc(22px + env(safe-area-inset-bottom));
          background: var(--bg);
          border-radius: 20px 20px 0 0;
          animation: gdUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .head {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .spin {
          display: block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(18, 17, 15, 0.2);
          border-top-color: var(--red);
          border-radius: 999px;
          animation: gdSpin 1s linear infinite;
        }
        .title {
          font-size: 28px;
        }
        .bar {
          margin-top: 18px;
          height: 6px;
          border-radius: 999px;
          background: rgba(18, 17, 15, 0.14);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          background: var(--red);
          transition: width 0.4s linear;
        }
        .stat {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .body {
          margin: 18px 0 0;
          font-size: 14px;
          line-height: 1.55;
          color: var(--body);
        }
        .mailrow {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .field {
          display: grid;
          gap: 9px;
          flex: 1;
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
          min-height: 54px;
          padding: 0 16px;
          border: 1.5px solid rgba(18, 17, 15, 0.3);
          border-radius: 12px;
          background: var(--field);
          font-size: 16px;
          outline: none;
        }
        .field :global(input:focus) {
          border-color: var(--red);
        }
        .save {
          min-height: 54px;
          border-radius: 12px;
        }
        .note {
          display: block;
          margin-top: 12px;
          font-size: 13.5px;
        }
        .note[data-bad] {
          color: var(--red-deep);
        }
        .mock {
          display: block;
          margin-top: 16px;
        }
        .close {
          margin-top: 16px;
          width: 100%;
          min-height: 52px;
        }

        @media (min-width: 700px) {
          .card {
            left: 50%;
            right: auto;
            top: 50%;
            bottom: auto;
            transform: translate(-50%, -50%);
            width: min(560px, calc(100% - 64px));
            padding: 30px;
            border-radius: 20px;
            /* vidi komentar u UnlockPanel.tsx */
            animation: gdModal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          .title {
            font-size: 30px;
          }
          .mailrow {
            flex-direction: row;
            align-items: flex-end;
          }
          .close {
            width: auto;
            padding: 0 26px;
          }
        }
      `}</style>
    </div>
  );
}
