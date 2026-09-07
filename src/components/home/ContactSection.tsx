"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { useLang } from "@/components/LangContext";
import { STRINGS, type StringKey } from "@/lib/i18n";

const KINDS: StringKey[] = ["navRafting", "ctcKindWedding", "ctcKindBaptism", "ctcKindBirthday"];

/**
 * Upit za termin. Nema rute koja ovo prima — u ovom prolazu forma samo
 * potvrdjuje unos, isto kao prototip. Kad backend stigne, ovdje ide jedan
 * POST; polja i validacija su vec na mjestu.
 */
export function ContactSection() {
  const { t } = useLang();
  const [kind, setKind] = useState<StringKey>("navRafting");
  const [sent, setSent] = useState(false);
  const [bad, setBad] = useState(false);

  const rows: { label: StringKey; value: string; href?: string }[] = [
    { label: "ctcPhone", value: "+387 65 000 000", href: `tel:${STRINGS.phone[0]}` },
    { label: "ctcMail", value: "info@smfotostudio.rs", href: "mailto:info@smfotostudio.rs" },
    { label: "ctcInstagram", value: "@smfotostudio", href: "https://instagram.com/" },
    { label: "ctcStudio", value: "Foča" },
  ];

  return (
    <section id="kontakt" className="sec">
      <Reveal className="wrap">
        <div className="grid">
          <div className="left">
            <div className="idx">
              <span>02</span>
              <span className="hair" aria-hidden="true" />
              <span>{t("ctcReply")}</span>
            </div>
            <h2 className="display">
              {t("ctcTitleA")}
              <br />
              {t("ctcTitleB")}
            </h2>
            <p className="lede">{t("ctcBody")}</p>

            <dl className="rows">
              {rows.map((r) => (
                <div className="row" key={r.label}>
                  <dt>{t(r.label)}</dt>
                  <dd>
                    {r.href ? (
                      <a
                        href={r.href}
                        target={r.href.startsWith("http") ? "_blank" : undefined}
                        rel={r.href.startsWith("http") ? "noreferrer" : undefined}
                      >
                        {r.value}
                      </a>
                    ) : (
                      r.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const ok = String(data.get("ime") ?? "").trim() && String(data.get("kontakt") ?? "").trim();
              setBad(!ok);
              setSent(Boolean(ok));
            }}
          >
            <div className="pair">
              <label className="fld">
                <span className="fld-label">{t("ctcName")}</span>
                <input name="ime" type="text" placeholder={t("ctcNamePh")} required />
              </label>
              <label className="fld">
                <span className="fld-label">{t("ctcContact")}</span>
                <input name="kontakt" type="text" placeholder={t("ctcContactPh")} required />
              </label>
            </div>

            <fieldset className="chips">
              <legend className="fld-label">{t("ctcKind")}</legend>
              <div className="chip-row">
                {KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="chip"
                    data-on={kind === k ? "1" : undefined}
                    aria-pressed={kind === k}
                    onClick={() => setKind(k)}
                  >
                    {t(k)}
                  </button>
                ))}
              </div>
              <input type="hidden" name="tip" value={t(kind)} />
            </fieldset>

            <div className="pair">
              <label className="fld">
                <span className="fld-label">{t("ctcDate")}</span>
                <input name="datum" type="date" />
              </label>
              <label className="fld">
                <span className="fld-label">{t("ctcPlace")}</span>
                <input name="mjesto" type="text" placeholder={t("ctcPlacePh")} />
              </label>
            </div>

            <label className="fld">
              <span className="fld-label">{t("ctcMessage")}</span>
              <textarea name="poruka" rows={3} placeholder={t("ctcMessagePh")} />
            </label>

            <div className="send">
              <span className={sent ? "note note-on" : bad ? "note note-bad" : "note"} role="status">
                {sent ? t("ctcSent") : bad ? t("ctcMissing") : t("ctcNote")}
              </span>
              <button type="submit" className="go">
                {t("ctcSend")}
              </button>
            </div>
            <span className="mock">{t("ctcMock")}</span>
          </form>
        </div>
      </Reveal>

      <style jsx>{`
        .sec {
          padding: 64px 0;
          border-top: 1px solid var(--ink);
          background: var(--panel-2);
        }
        .sec :global(.wrap) {
          padding-inline: var(--edge);
        }
        .grid {
          display: grid;
          gap: 44px;
        }
        .idx {
          display: flex;
          align-items: baseline;
          gap: 14px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .hair {
          display: block;
          width: 40px;
          height: 1px;
          background: rgba(18, 17, 15, 0.4);
        }
        h2 {
          margin: 16px 0 0;
          font-size: clamp(38px, 9vw, 82px);
          line-height: 0.88;
        }
        .lede {
          margin: 20px 0 0;
          max-width: 38ch;
          font-size: 15px;
          line-height: 1.65;
          color: var(--body);
          text-wrap: pretty;
        }

        .rows {
          margin: 32px 0 0;
          display: grid;
        }
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 54px;
          padding: 10px 0;
          border-top: 1px solid rgba(18, 17, 15, 0.18);
        }
        .row:last-child {
          border-bottom: 1px solid rgba(18, 17, 15, 0.18);
        }
        dt {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }
        dd {
          margin: 0;
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 600;
          font-size: 20px;
          letter-spacing: 0.03em;
          text-align: right;
        }
        dd a {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          min-height: var(--tap);
        }
        dd a:hover {
          color: var(--red);
        }

        .form {
          display: grid;
          gap: 22px;
        }
        .pair {
          display: grid;
          gap: 22px;
        }
        .fld {
          display: grid;
          gap: 9px;
          min-width: 0;
        }
        .fld-label {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          padding: 0;
        }
        .fld input,
        .fld textarea {
          width: 100%;
          min-height: var(--tap);
          padding: 9px 0;
          border: 0;
          border-bottom: 1px solid rgba(18, 17, 15, 0.32);
          background: transparent;
          /* 16px je prag ispod kojeg iOS zumira polje pri fokusu. */
          font-size: 16px;
          line-height: 1.6;
          color: var(--ink);
          outline: none;
        }
        .fld textarea {
          resize: vertical;
        }
        .fld input:focus,
        .fld textarea:focus {
          border-bottom-color: var(--red);
        }

        .chips {
          margin: 0;
          padding: 0;
          border: 0;
          display: grid;
          gap: 12px;
        }
        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .chip {
          min-height: var(--tap);
          padding: 0 18px;
          border: 1px solid rgba(18, 17, 15, 0.3);
          border-radius: 999px;
          background: transparent;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink);
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
        }
        .chip[data-on] {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        .send {
          display: grid;
          gap: 16px;
          padding-top: 4px;
        }
        .note {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          line-height: 1.6;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.5);
        }
        .note-on,
        .note-bad {
          color: var(--red-deep);
        }
        .go {
          justify-self: start;
          min-height: 52px;
          padding: 0 30px;
          border: 1px solid var(--red);
          border-radius: 999px;
          background: var(--red);
          color: var(--bg);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          transition: background 0.18s ease, border-color 0.18s ease;
        }
        .go:hover {
          background: var(--ink);
          border-color: var(--ink);
        }
        .mock {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.38);
        }

        @media (min-width: 700px) {
          .sec {
            padding: 88px 0;
          }
          .pair {
            grid-template-columns: 1fr 1fr;
            gap: 26px;
          }
          .send {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            flex-wrap: wrap;
          }
        }

        @media (min-width: 1000px) {
          .grid {
            grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
            gap: 64px;
            align-items: start;
          }
          .form {
            gap: 26px;
          }
        }
      `}</style>
    </section>
  );
}
