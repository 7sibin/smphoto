"use client";

import Link from "next/link";
import { useLang } from "@/components/LangContext";
import { STRINGS, type StringKey } from "@/lib/i18n";

/** "O nama.dc.html" — jedan ekran, portret desno, tabela podataka lijevo. */
export function AboutScreen() {
  const { t } = useLang();

  const rows: { label: StringKey; value: string; href?: string }[] = [
    { label: "abPhotographer", value: "Sreten Milutinović" },
    { label: "abSeat", value: "Foča" },
    { label: "ctcPhone", value: "+387 65 000 000", href: `tel:${STRINGS.phone[0]}` },
    { label: "ctcInstagram", value: "@smfotostudio", href: "https://instagram.com/" },
  ];

  return (
    <section className="screen">
      <div className="grid">
        <div className="left">
          <div className="idx">
            <span>{t("abKicker")}</span>
            <span className="hair" aria-hidden="true" />
            <span>{t("abSince")}</span>
          </div>

          {/* Ime ulazi odozdo iza maske — vidi komentar u Hero.tsx. */}
          <span className="line">
            <h1 className="display name">
              {t("abNameA")}
              <br />
              {t("abNameB")}
            </h1>
          </span>

          <div className="body">
            <p>{t("abBody1")}</p>
            <p>{t("abBody2")}</p>
          </div>

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
            <div className="row">
              <dt>{t("abPricing")}</dt>
              <dd>
                <Link href="/#kontakt">{t("abOnRequest")}</Link>
              </dd>
            </div>
          </dl>

          <Link className="cta" href="/#kontakt">
            {t("ftBook")}
          </Link>
        </div>

        <div className="right">
          <figure className="frame">
            <div className="plate" aria-hidden="true" />
            <figcaption>
              <span>{t("abPortrait")}</span>
              <span>Foča</span>
            </figcaption>
          </figure>
          <span className="under">{t("abSameDay")}</span>
        </div>
      </div>

      <style jsx>{`
        .screen {
          flex: 1;
          padding: 48px 0 72px;
          animation: gdFade 0.8s ease 0.12s both;
        }
        .grid {
          padding-inline: var(--edge-narrow);
          display: grid;
          gap: 44px;
        }
        .idx {
          display: flex;
          align-items: baseline;
          gap: 14px;
          flex-wrap: wrap;
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
        .line {
          display: block;
          overflow: hidden;
          margin-top: 16px;
          padding: 0.2em 0 0.3em;
          margin-bottom: -0.3em;
        }
        .name {
          margin: 0;
          font-size: clamp(42px, 11vw, 104px);
          line-height: 0.86;
          letter-spacing: -0.015em;
          animation: gdRise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .body {
          margin-top: 26px;
          display: grid;
          gap: 18px;
          max-width: 52ch;
        }
        p {
          margin: 0;
          font-size: 15.5px;
          line-height: 1.65;
          color: var(--body);
          text-wrap: pretty;
        }

        .rows {
          margin: 36px 0 0;
          display: grid;
          max-width: 560px;
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
        dd :global(a) {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          min-height: var(--tap);
        }
        dd :global(a):hover {
          color: var(--red);
        }

        /* .cta sjedi na <Link> — vidi komentar u SiteNav.tsx. */
        .left :global(.cta) {
          margin-top: 34px;
          display: inline-flex;
          align-items: center;
          min-height: var(--tap);
          padding: 0 22px;
          border: 1px solid var(--red);
          border-radius: 999px;
          background: var(--red);
          color: var(--bg);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .left :global(.cta):hover {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        .right {
          display: grid;
          gap: 20px;
          align-content: start;
        }
        .frame {
          position: relative;
          margin: 0;
          padding: 12px 12px 36px;
          background: var(--field);
          box-shadow: 0 18px 34px -22px rgba(18, 17, 15, 0.5), 0 1px 0 rgba(18, 17, 15, 0.06);
        }
        .plate {
          height: clamp(280px, 62vw, 460px);
          background-color: #ddd8cc;
          background-image: repeating-linear-gradient(
            112deg,
            rgba(18, 17, 15, 0.07) 0 2px,
            rgba(18, 17, 15, 0) 2px 14px
          );
        }
        figcaption {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 11px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.5);
        }
        .under {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.45);
        }

        @media (min-width: 700px) {
          .screen {
            padding: 66px 0 90px;
          }
        }

        @media (min-width: 1000px) {
          .grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr);
            gap: 64px;
            align-items: start;
          }
          .frame {
            padding: 14px 14px 40px;
          }
        }
      `}</style>
    </section>
  );
}
