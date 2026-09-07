"use client";

import Link from "next/link";
import { useLang } from "@/components/LangContext";
import { STRINGS } from "@/lib/i18n";

/**
 * Podnozje javnog sajta. "full" je sa naslovne — cetiri kolone, veliki
 * zig i donja traka. "slim" je sa kategorija i O nama, jedan red.
 */
export function SiteFooter({
  variant = "full",
  narrow = false,
}: {
  variant?: "full" | "slim";
  /** Uza kolona, da se poklopi sa sadrzajem — vidi "narrow" u SiteNav.tsx. */
  narrow?: boolean;
}) {
  const { t } = useLang();

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (variant === "slim") {
    return (
      <footer className="slim" data-narrow={narrow ? "1" : undefined}>
        <span>{t("ftRights")}</span>
        <span className="slim-mid">Foča · Tara &amp; Drina</span>
        <Link href="/" className="slim-home">
          {t("navHome")}
        </Link>

        <style jsx>{`
          .slim[data-narrow] {
            padding-inline: var(--edge-narrow);
          }
          .slim {
            padding: 22px var(--edge) calc(22px + env(safe-area-inset-bottom));
            border-top: 1px solid var(--ink);
            display: flex;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(18, 17, 15, 0.5);
          }
          /* Na 375px tri stavke u redu daju tri prelomljena reda teksta. */
          .slim-mid {
            display: none;
          }
          .slim :global(.slim-home) {
            display: inline-flex;
            align-items: center;
            min-height: var(--tap);
          }
          .slim :global(.slim-home):hover {
            color: var(--ink);
          }
          @media (min-width: 700px) {
            .slim-mid {
              display: block;
            }
          }
        `}</style>
      </footer>
    );
  }

  return (
    <footer className="ft">
      <div className="cols">
        <div className="col col-lede">
          <span className="since">{t("ftSince")}</span>
          <p>{t("ftBlurb")}</p>
          <a className="ig" href="https://instagram.com/" target="_blank" rel="noreferrer">
            {t("ctcInstagram")}
          </a>
        </div>

        <div className="col">
          <span className="col-head">{t("ftGalleries")}</span>
          <Link className="fl" href="/galerija/rafting">
            {t("navRafting")}
          </Link>
          <Link className="fl" href="/galerija/vencanja">
            {t("navWeddings")}
          </Link>
          <Link className="fl" href="/galerija/krstenja">
            {t("navBaptisms")}
          </Link>
          <Link className="fl" href="/galerija/rodjendani">
            {t("navBirthdays")}
          </Link>
        </div>

        <div className="col">
          <span className="col-head">{t("ftStudio")}</span>
          <Link className="fl" href="/o-nama">
            {t("navAbout")}
          </Link>
          <Link className="fl" href="/#kontakt">
            {t("ftBook")}
          </Link>
          <span className="dim">{t("ftSeat")}</span>
          <span className="dim">{t("ftSeason")}</span>
        </div>

        <div className="col">
          <span className="col-head">{t("ftContact")}</span>
          <a className="fl" href={`tel:${STRINGS.phone[0]}`}>
            +387 65 000 000
          </a>
          <a className="fl" href="mailto:info@smfotostudio.rs">
            info@smfotostudio.rs
          </a>
          <span className="dim">{t("ftHours")}</span>
        </div>
      </div>

      <div className="wordmark" aria-hidden="true">
        SM Foto Studio
      </div>

      <div className="base">
        <span>{t("ftRights")}</span>
        <span className="base-mid">{t("ftCopyright")}</span>
        <button type="button" className="top" onClick={toTop}>
          {t("ftTop")}
        </button>
      </div>

      <style jsx>{`
        .ft {
          background: var(--night);
          color: var(--bg);
          padding: 56px 0 20px;
          overflow: hidden;
        }
        .cols {
          padding-inline: var(--edge);
          display: grid;
          gap: 34px;
        }
        .col {
          display: grid;
          gap: 12px;
          align-content: start;
        }
        .col-lede {
          gap: 18px;
        }
        .since {
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(245, 243, 238, 0.55);
        }
        p {
          margin: 0;
          max-width: 32ch;
          font-size: 15px;
          line-height: 1.65;
          color: rgba(245, 243, 238, 0.72);
          text-wrap: pretty;
        }
        .ig {
          display: inline-flex;
          align-items: center;
          justify-self: start;
          min-height: var(--tap);
          padding: 0 22px;
          border: 1px solid rgba(245, 243, 238, 0.32);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--bg);
        }
        .ig:hover {
          background: var(--red);
          border-color: var(--red);
        }
        .col-head {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(245, 243, 238, 0.45);
        }
        /* .fl sjedi i na <Link> i na <a> — vidi komentar u SiteNav.tsx. */
        .col :global(.fl) {
          display: flex;
          align-items: center;
          min-height: var(--tap);
          font-size: 13.5px;
          letter-spacing: 0.04em;
          color: rgba(245, 243, 238, 0.85);
        }
        .col :global(.fl):hover {
          color: var(--bg);
        }
        .dim {
          font-size: 13.5px;
          letter-spacing: 0.04em;
          color: rgba(245, 243, 238, 0.55);
        }

        .wordmark {
          margin-top: 46px;
          padding-inline: var(--edge);
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 800;
          font-size: clamp(44px, 11.6vw, 190px);
          line-height: 0.82;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          white-space: nowrap;
          color: var(--bg);
        }

        .base {
          margin-top: 28px;
          padding: 18px var(--edge) calc(4px + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(245, 243, 238, 0.18);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(245, 243, 238, 0.5);
        }
        .base-mid {
          display: none;
        }
        .top {
          min-height: var(--tap);
          padding: 0;
          border: 0;
          background: transparent;
          font: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          color: rgba(245, 243, 238, 0.5);
        }
        .top:hover {
          color: var(--bg);
        }

        @media (min-width: 700px) {
          .ft {
            padding-top: 72px;
          }
          .cols {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 40px;
          }
          .base-mid {
            display: block;
          }
        }

        @media (min-width: 1000px) {
          .cols {
            grid-template-columns: minmax(0, 1.2fr) repeat(3, minmax(0, 0.6fr));
            gap: 44px;
            align-items: start;
          }
          .wordmark {
            margin-top: 66px;
          }
        }
      `}</style>
    </footer>
  );
}
